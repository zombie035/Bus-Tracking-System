// client/src/contexts/DriverContext.jsx
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { busService } from '../services/busService';

// Trip States
export const TRIP_STATES = {
  NOT_STARTED: 'NOT_STARTED',
  STARTED: 'STARTED',
  EN_ROUTE: 'EN_ROUTE',
  DELAYED: 'DELAYED',
  EMERGENCY: 'EMERGENCY',
  COMPLETED: 'COMPLETED'
};

// Initial State
const initialState = {
  // Trip State
  tripState: TRIP_STATES.NOT_STARTED,
  tripStartTime: null,
  tripEndTime: null,

  // Bus & Route
  bus: null,
  route: null,
  routeStops: [],
  routePath: [],

  // Stop Management
  currentStopIndex: 0,
  stopArrivalTime: null,
  completedStops: [],

  // Analytics
  analytics: {
    totalDistance: 0,
    averageSpeed: 0,
    maxSpeed: 0,
    delayTime: 0,
    stopsCompleted: 0
  },

  // Location
  location: null,
  isTracking: false,
  speed: 0,
  accuracy: 0,

  // Students
  studentCount: 0,

  // Settings
  settings: {
    routeLock: false,
    highwayOnly: false,
    trafficOverlay: false,
    autoMarkStopDistance: 50, // meters
    darkMode: true,
    locationAccuracy: 'high', // high, balanced, low
    dataSaver: false,
    layoutConfig: {
      navbarPosition: "bottom",
      navStyle: "icons-label",
      density: "comfortable",
      theme: "auto",
      mapControls: "right",
      bottomSheetDefault: "collapsed",
      emergencyPosition: "top-right"
    }
  },

  // Loading states
  loading: true,
  error: null
};

// Action Types
const ActionTypes = {
  SET_TRIP_STATE: 'SET_TRIP_STATE',
  SET_BUS: 'SET_BUS',
  SET_ROUTE: 'SET_ROUTE',
  SET_ROUTE_STOPS: 'SET_ROUTE_STOPS',
  SET_ROUTE_PATH: 'SET_ROUTE_PATH',
  SET_CURRENT_STOP: 'SET_CURRENT_STOP',
  SET_STOP_ARRIVAL: 'SET_STOP_ARRIVAL',
  COMPLETE_STOP: 'COMPLETE_STOP',
  UPDATE_ANALYTICS: 'UPDATE_ANALYTICS',
  SET_LOCATION: 'SET_LOCATION',
  SET_TRACKING: 'SET_TRACKING',
  SET_STUDENT_COUNT: 'SET_STUDENT_COUNT',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  RESET_TRIP: 'RESET_TRIP'
};

// Reducer
function driverReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_TRIP_STATE:
      return { ...state, tripState: action.payload };

    case ActionTypes.SET_BUS:
      return { ...state, bus: action.payload };

    case ActionTypes.SET_ROUTE:
      return { ...state, route: action.payload };

    case ActionTypes.SET_ROUTE_STOPS:
      return { ...state, routeStops: action.payload };

    case ActionTypes.SET_ROUTE_PATH:
      return { ...state, routePath: action.payload };

    case ActionTypes.SET_CURRENT_STOP:
      return { ...state, currentStopIndex: action.payload };

    case ActionTypes.SET_STOP_ARRIVAL:
      return { ...state, stopArrivalTime: action.payload };

    case ActionTypes.COMPLETE_STOP:
      return {
        ...state,
        completedStops: [...state.completedStops, action.payload],
        analytics: {
          ...state.analytics,
          stopsCompleted: state.analytics.stopsCompleted + 1
        }
      };

    case ActionTypes.UPDATE_ANALYTICS:
      return { ...state, analytics: { ...state.analytics, ...action.payload } };

    case ActionTypes.SET_LOCATION:
      return {
        ...state,
        location: action.payload.location,
        speed: action.payload.speed || state.speed,
        accuracy: action.payload.accuracy || state.accuracy
      };

    case ActionTypes.SET_TRACKING:
      return { ...state, isTracking: action.payload };

    case ActionTypes.SET_STUDENT_COUNT:
      return { ...state, studentCount: action.payload };

    case ActionTypes.UPDATE_SETTINGS:
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };

    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };

    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };

    case ActionTypes.RESET_TRIP:
      return {
        ...state,
        tripState: TRIP_STATES.NOT_STARTED,
        tripStartTime: null,
        tripEndTime: null,
        currentStopIndex: 0,
        stopArrivalTime: null,
        completedStops: [],
        analytics: initialState.analytics
      };

    default:
      return state;
  }
}

// Context
const DriverContext = createContext(null);

export const useDriver = () => {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error('useDriver must be used within a DriverProvider');
  }
  return context;
};

export const DriverProvider = ({ children }) => {
  const [state, dispatch] = useReducer(driverReducer, initialState);
  const { socket, connected, sendLocationUpdate } = useSocket();
  const { user } = useAuth();

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });

      // Fetch bus
      const busData = await busService.getMyBus();
      if (busData.success && busData.bus) {
        dispatch({ type: ActionTypes.SET_BUS, payload: busData.bus });
        dispatch({ type: ActionTypes.SET_STUDENT_COUNT, payload: busData.bus.students?.length || 0 });

        // Fetch route stops
        const routeIdentifier = busData.bus.routeId || busData.bus.routeName;
        if (routeIdentifier) {
          const stopsData = await busService.getRouteStops(routeIdentifier);
          if (stopsData.success && stopsData.stops) {
            dispatch({ type: ActionTypes.SET_ROUTE_STOPS, payload: stopsData.stops });

            if (stopsData.routePath && stopsData.routePath.length > 0) {
              dispatch({ type: ActionTypes.SET_ROUTE_PATH, payload: stopsData.routePath });
            } else {
              dispatch({ type: ActionTypes.SET_ROUTE_PATH, payload: stopsData.stops.map(s => [s.latitude, s.longitude]) });
            }
          }
        }
      }

      // Fetch settings
      const settingsData = await busService.getDriverSettings();
      if (settingsData.success && settingsData.settings) {
        dispatch({ type: ActionTypes.UPDATE_SETTINGS, payload: settingsData.settings });
      }

      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    } catch (error) {
      console.error('Error fetching initial data:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  }, []);

  // Initialize
  useEffect(() => {
    if (user && user.role === 'driver') {
      fetchInitialData();
    }
  }, [user, fetchInitialData]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleTrackingCount = (data) => {
      if (data.busId === state.bus?._id) {
        dispatch({ type: ActionTypes.SET_STUDENT_COUNT, payload: data.count });
      }
    };

    socket.on('tracking-count', handleTrackingCount);

    return () => {
      socket.off('tracking-count', handleTrackingCount);
    };
  }, [socket, state.bus]);

  // Trip Actions
  const startTrip = useCallback(async () => {
    try {
      const result = await busService.startTrip();
      if (result.success) {
        dispatch({ type: ActionTypes.SET_TRIP_STATE, payload: TRIP_STATES.STARTED });
        dispatch({ type: ActionTypes.SET_TRIP_STATE, payload: TRIP_STATES.EN_ROUTE });
        dispatch({ type: ActionTypes.SET_STOP_ARRIVAL, payload: new Date() });

        // Emit socket event
        if (socket) {
          socket.emit('trip-status-update', {
            busId: state.bus?._id,
            status: TRIP_STATES.EN_ROUTE,
            timestamp: new Date()
          });
        }

        return { success: true };
      }
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [socket, state.bus]);

  const pauseTrip = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_TRIP_STATE, payload: TRIP_STATES.DELAYED });

    if (socket) {
      socket.emit('trip-status-update', {
        busId: state.bus?._id,
        status: TRIP_STATES.DELAYED,
        timestamp: new Date()
      });
    }
  }, [socket, state.bus]);

  const resumeTrip = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_TRIP_STATE, payload: TRIP_STATES.EN_ROUTE });

    if (socket) {
      socket.emit('trip-status-update', {
        busId: state.bus?._id,
        status: TRIP_STATES.EN_ROUTE,
        timestamp: new Date()
      });
    }
  }, [socket, state.bus]);

  const endTrip = useCallback(async () => {
    try {
      const result = await busService.endTrip();
      if (result.success) {
        dispatch({ type: ActionTypes.SET_TRIP_STATE, payload: TRIP_STATES.COMPLETED });

        if (socket) {
          socket.emit('trip-status-update', {
            busId: state.bus?._id,
            status: TRIP_STATES.COMPLETED,
            timestamp: new Date()
          });
        }

        return { success: true };
      }
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [socket, state.bus]);

  const triggerEmergency = useCallback(async (alertData) => {
    dispatch({ type: ActionTypes.SET_TRIP_STATE, payload: TRIP_STATES.EMERGENCY });

    if (socket) {
      socket.emit('emergency-alert', {
        busId: state.bus?._id,
        driverId: user?.id,
        ...alertData,
        timestamp: new Date()
      });
    }
  }, [socket, state.bus, user]);

  // Stop Actions
  const arriveAtStop = useCallback(async (stopIndex) => {
    const stop = state.routeStops[stopIndex];
    if (!stop) return { success: false, message: 'Stop not found' };

    dispatch({ type: ActionTypes.SET_CURRENT_STOP, payload: stopIndex });
    dispatch({ type: ActionTypes.SET_STOP_ARRIVAL, payload: new Date() });

    if (socket) {
      socket.emit('stop-arrived', {
        busId: state.bus?._id,
        stopId: stop.id,
        stopName: stop.stopName,
        stopIndex,
        timestamp: new Date()
      });
    }

    return { success: true, stop };
  }, [socket, state.bus, state.routeStops]);

  const departFromStop = useCallback(async (stopIndex, boardingCount = 0) => {
    const stop = state.routeStops[stopIndex];
    if (!stop) return { success: false, message: 'Stop not found' };

    dispatch({
      type: ActionTypes.COMPLETE_STOP,
      payload: {
        ...stop,
        departureTime: new Date(),
        boardingCount
      }
    });

    if (socket) {
      socket.emit('stop-departed', {
        busId: state.bus?._id,
        stopId: stop.id,
        stopName: stop.stopName,
        stopIndex,
        boardingCount,
        timestamp: new Date()
      });
    }

    // Move to next stop
    const nextIndex = stopIndex + 1;
    if (nextIndex < state.routeStops.length) {
      dispatch({ type: ActionTypes.SET_CURRENT_STOP, payload: nextIndex });
    }

    return { success: true, stop };
  }, [socket, state.bus, state.routeStops]);

  const skipStop = useCallback(async (stopIndex, reason) => {
    const stop = state.routeStops[stopIndex];
    if (!stop) return { success: false, message: 'Stop not found' };

    if (socket) {
      socket.emit('stop-skipped', {
        busId: state.bus?._id,
        stopId: stop.id,
        stopName: stop.stopName,
        stopIndex,
        reason,
        timestamp: new Date()
      });
    }

    // Move to next stop
    const nextIndex = stopIndex + 1;
    if (nextIndex < state.routeStops.length) {
      dispatch({ type: ActionTypes.SET_CURRENT_STOP, payload: nextIndex });
    }

    return { success: true };
  }, [socket, state.bus, state.routeStops]);

  // Location Actions
  const updateLocation = useCallback((locationData) => {
    const speedKmh = locationData.speed ? (locationData.speed * 3.6).toFixed(1) : 0;

    dispatch({
      type: ActionTypes.SET_LOCATION,
      payload: {
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          heading: locationData.heading,
          timestamp: locationData.timestamp
        },
        speed: parseFloat(speedKmh),
        accuracy: locationData.accuracy
      }
    });

    // Update analytics
    if (state.speed > 0) {
      const newAvgSpeed = ((state.analytics.averageSpeed * state.analytics.stopsCompleted) + parseFloat(speedKmh)) / (state.analytics.stopsCompleted + 1);
      dispatch({
        type: ActionTypes.UPDATE_ANALYTICS,
        payload: {
          averageSpeed: newAvgSpeed,
          maxSpeed: Math.max(state.analytics.maxSpeed, parseFloat(speedKmh))
        }
      });
    }

    // Send location update via socket
    if (socket && connected) {
      sendLocationUpdate({
        busId: state.bus?._id,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        speed: speedKmh,
        accuracy: locationData.accuracy,
        heading: locationData.heading,
        status: state.tripState === TRIP_STATES.EN_ROUTE ? 'moving' : 'idle',
        timestamp: new Date()
      });
    }
  }, [socket, connected, sendLocationUpdate, state.bus, state.tripState, state.speed, state.analytics]);

  // Settings Actions
  const updateSettings = useCallback(async (newSettings) => {
    try {
      const result = await busService.updateDriverSettings(newSettings);
      if (result.success) {
        dispatch({ type: ActionTypes.UPDATE_SETTINGS, payload: newSettings });
        return { success: true };
      }
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, []);

  // Broadcast Actions
  const sendBroadcast = useCallback(async (message, priority = 'normal') => {
    if (socket) {
      socket.emit('broadcast-message', {
        busId: state.bus?._id,
        driverId: user?.id,
        message,
        priority,
        timestamp: new Date()
      });
    }
  }, [socket, state.bus, user]);

  const value = {
    // State
    ...state,

    // Actions
    startTrip,
    pauseTrip,
    resumeTrip,
    endTrip,
    triggerEmergency,
    arriveAtStop,
    departFromStop,
    skipStop,
    updateLocation,
    updateSettings,
    sendBroadcast,
    fetchInitialData
  };

  return (
    <DriverContext.Provider value={value}>
      {children}
    </DriverContext.Provider>
  );
};

export default DriverContext;
