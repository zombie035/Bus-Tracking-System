// client/src/contexts/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Use the proxy (port 3000 -> 5000)
    // Connecting to window.location.origin ensures we go through the dev server
    const socketUrl = window.location.origin;
    console.log('🔌 Connecting to socket via proxy:', socketUrl);

    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);

      // Register for notifications (ALL users)
      newSocket.emit('register-notifications', user.id);

      // Join appropriate room based on user role
      if (user.role === 'driver') {
        newSocket.emit('join-driver-room', user.id);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const joinBusRoom = (busId) => {
    if (socket && busId) {
      socket.emit('join-bus-room', busId);
    }
  };

  const sendLocationUpdate = (data) => {
    if (socket && connected) {
      socket.emit('driver-location-update', data);
    }
  };

  // Driver-specific socket methods
  const sendTripStatusUpdate = (data) => {
    if (socket && connected) {
      socket.emit('trip-status-update', data);
    }
  };

  const sendStopArrived = (data) => {
    if (socket && connected) {
      socket.emit('stop-arrived', data);
    }
  };

  const sendStopDeparted = (data) => {
    if (socket && connected) {
      socket.emit('stop-departed', data);
    }
  };

  const sendEmergencyAlert = (data) => {
    if (socket && connected) {
      socket.emit('emergency-alert', data);
    }
  };

  const sendBroadcastMessage = (data) => {
    if (socket && connected) {
      socket.emit('broadcast-message', data);
    }
  };

  const sendDelayReport = (data) => {
    if (socket && connected) {
      socket.emit('delay-report', data);
    }
  };

  const joinDriverRoom = (driverId) => {
    if (socket && driverId) {
      socket.emit('join-driver-room', driverId);
    }
  };

  const value = {
    socket,
    connected,
    joinBusRoom,
    sendLocationUpdate,
    // Driver-specific methods
    sendTripStatusUpdate,
    sendStopArrived,
    sendStopDeparted,
    sendEmergencyAlert,
    sendBroadcastMessage,
    sendDelayReport,
    joinDriverRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};