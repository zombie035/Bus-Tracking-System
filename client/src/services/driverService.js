// AGGRESSIVE DRIVER SERVICE - CONTROL CENTER OPERATIONS
import { io } from 'socket.io-client';
import api from './api';

class DriverService {
  constructor() {
    this.socket = null;
    this.tripId = null;
    this.busId = null;
    this.locationTracking = null;
    this.emergencyActive = false;
  }

  // ===== DRIVER PROFILE & BUS DETAILS =====

  // Get bus details by driver name
  async getBusDetailsByDriver(driverName) {
    try {
      console.log('🔍 Fetching bus details for driver:', driverName);
      
      const response = await api.get(`/api/driver/bus-details/${encodeURIComponent(driverName)}`);
      
      console.log('🚌 Bus details response:', response.data);
      
      return {
        success: true,
        busDetails: response.data.busDetails || {},
        driverInfo: response.data.driverInfo || {}
      };
    } catch (error) {
      console.error('❌ Error fetching bus details:', error);
      
      // Return mock data as fallback
      const mockBusDetails = this.getMockBusDetails(driverName);
      return {
        success: false,
        busDetails: mockBusDetails,
        error: error.response?.data?.message || 'Failed to fetch bus details'
      };
    }
  }

  // Get bus details by driver ID (NEW METHOD)
  async getBusDetailsByDriverId(driverId) {
    try {
      console.log('🔍 Fetching bus details for driver ID:', driverId);
      
      const response = await api.get(`/api/driver/bus-by-driver-id/${driverId}`);
      
      console.log('🚌 Bus by driver ID response:', response.data);
      
      return {
        success: true,
        busDetails: response.data.busDetails || {},
        driverInfo: response.data.driverInfo || {}
      };
    } catch (error) {
      console.error('❌ Error fetching bus details by driver ID:', error);
      
      // Return mock data as fallback
      const mockBusDetails = this.getMockBusDetails();
      return {
        success: false,
        busDetails: mockBusDetails,
        error: error.response?.data?.message || 'Failed to fetch bus details'
      };
    }
  }

  // Get real-time bus data from database
  async getBusRealTimeData(busNumber) {
    try {
      console.log('🚌 Fetching real-time bus data for:', busNumber);
      
      const response = await api.get(`/api/bus/realtime/${busNumber}`);
      
      console.log('📡 Real-time bus data:', response.data);
      
      return {
        success: true,
        busData: response.data.busData || {}
      };
    } catch (error) {
      console.error('❌ Error fetching real-time bus data:', error);
      return {
        success: false,
        busData: {},
        error: error.response?.data?.message || 'Failed to fetch bus data'
      };
    }
  }

  // Get mock bus details as fallback
  getMockBusDetails(driverName) {
    const mockBuses = {
      'John Driver': {
        busNumber: 'BUS001',
        busType: 'Standard Bus',
        capacity: 50,
        licensePlate: 'TN-01-AB-1234',
        routeName: 'Main Campus Route',
        totalStops: 5,
        estimatedDuration: 45,
        fuelLevel: 75,
        lastMaintenance: '2024-01-15',
        nextMaintenance: '2024-02-15',
        status: 'Active',
        driverAssigned: 'John Driver',
        driverPhone: '8888888888',
        driverLicense: 'DL123456'
      },
      'Sarah Driver': {
        busNumber: 'BUS002',
        busType: 'Express Bus',
        capacity: 40,
        licensePlate: 'TN-01-CD-5678',
        routeName: 'North Campus Route',
        totalStops: 5,
        estimatedDuration: 35,
        fuelLevel: 82,
        lastMaintenance: '2024-01-20',
        nextMaintenance: '2024-02-20',
        status: 'Active',
        driverAssigned: 'Sarah Driver',
        driverPhone: '8888888889',
        driverLicense: 'DL789012'
      },
      'Michael Driver': {
        busNumber: 'BUS003',
        busType: 'Mini Bus',
        capacity: 30,
        licensePlate: 'TN-01-EF-9012',
        routeName: 'East Campus Route',
        totalStops: 6,
        estimatedDuration: 40,
        fuelLevel: 68,
        lastMaintenance: '2024-01-10',
        nextMaintenance: '2024-02-10',
        status: 'Active',
        driverAssigned: 'Michael Driver',
        driverPhone: '8888888890',
        driverLicense: 'DL345678'
      },
      'raj': {
        busNumber: '121',
        busType: 'College Bus',
        capacity: 45,
        licensePlate: 'TN-01-RJ-121',
        routeName: 'College Route 121',
        totalStops: 7,
        estimatedDuration: 50,
        fuelLevel: 85,
        lastMaintenance: '2024-01-25',
        nextMaintenance: '2024-02-25',
        status: 'Active',
        driverAssigned: 'raj',
        driverPhone: '9876543211',
        driverLicense: 'DL987654'
      }
    };
    
    return mockBuses[driverName] || mockBuses['John Driver'];
  }

  // Get driver profile with bus details
  async getDriverProfile(driverId) {
    try {
      console.log('👤 Fetching driver profile for:', driverId);
      
      const response = await api.get(`/api/driver/profile/${driverId}`);
      
      return {
        success: true,
        profile: response.data.profile || {}
      };
    } catch (error) {
      console.error('❌ Error fetching driver profile:', error);
      
      // Return mock data as fallback
      const mockProfile = this.getMockDriverProfile(driverId);
      return {
        success: false,
        profile: mockProfile,
        error: error.response?.data?.message || 'Failed to fetch driver profile'
      };
    }
  }

  // Get mock driver profile as fallback
  getMockDriverProfile(driverId) {
    return {
      id: driverId,
      name: 'John Driver',
      email: 'john.driver@buscompany.com',
      phone: '8888888888',
      licenseNumber: 'DL123456',
      experience: '5 years',
      joinDate: '2020-01-15',
      status: 'Active',
      totalTrips: 1250,
      averageRating: 4.8,
      busAssigned: 'BUS001',
      routeName: 'Main Campus Route',
      department: 'Transportation',
      emergencyContact: '9876543210',
      medicalConditions: 'None',
      certifications: ['Commercial License', 'First Aid', 'Defensive Driving']
    };
  }

  // Initialize driver socket connection
  initializeDriverSocket(busId, driverId) {
    this.busId = busId;
    
    this.socket = io('http://localhost:5000', {
      withCredentials: true,
      query: {
        role: 'driver',
        busId,
        driverId
      }
    });

    this.setupDriverEventListeners();
    return this.socket;
  }

  // Setup driver-specific socket events
  setupDriverEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🚌 Driver connected to control center');
      this.authenticateDriver();
    });

    this.socket.on('disconnect', () => {
      console.log('🚌 Driver disconnected from control center');
    });

    // Trip management events
    this.socket.on('trip-status-confirmed', (data) => {
      console.log('✅ Trip status confirmed:', data);
      this.handleTripStatusConfirmation(data);
    });

    this.socket.on('stop-confirmed', (data) => {
      console.log('🛑 Stop action confirmed:', data);
      this.handleStopConfirmation(data);
    });

    // Emergency events
    this.socket.on('emergency-acknowledged', (data) => {
      console.log('🚨 Emergency acknowledged by admin:', data);
      this.emergencyActive = true;
    });

    this.socket.on('emergency-resolved', (data) => {
      console.log('✅ Emergency resolved:', data);
      this.emergencyActive = false;
    });

    // Broadcast events
    this.socket.on('broadcast-delivered', (data) => {
      console.log('📢 Broadcast delivered to students:', data);
    });

    // Admin commands
    this.socket.on('admin-command', (data) => {
      console.log('👨‍💼 Admin command received:', data);
      this.handleAdminCommand(data);
    });

    // Location tracking feedback
    this.socket.on('location-update-acknowledged', (data) => {
      console.log('📍 Location update acknowledged:', data);
    });
  }

  // Authenticate driver session
  authenticateDriver() {
    this.socket.emit('driver-authenticate', {
      busId: this.busId,
      role: 'driver',
      timestamp: new Date()
    });
  }

  // ===== TRIP LIFECYCLE MANAGEMENT =====

  // Start trip with full state
  startTrip(routeData, initialLocation) {
    const tripData = {
      tripId: this.generateTripId(),
      busId: this.busId,
      routeId: routeData.routeId,
      status: 'STARTED',
      startTime: new Date(),
      startLocation: initialLocation,
      driverId: this.getDriverId(),
      metadata: {
        weather: 'clear', // Could be fetched from API
        traffic: 'normal',
        estimatedDuration: routeData.estimatedDuration
      }
    };

    this.socket.emit('trip-start', tripData);
    this.tripId = tripData.tripId;
    
    // Start location tracking
    this.startLocationTracking();
    
    return tripData;
  }

  // Pause trip (delay)
  pauseTrip(reason, estimatedDelay) {
    const pauseData = {
      tripId: this.tripId,
      busId: this.busId,
      status: 'DELAYED',
      pauseTime: new Date(),
      reason,
      estimatedDelay,
      location: this.getCurrentLocation()
    };

    this.socket.emit('trip-pause', pauseData);
    return pauseData;
  }

  // Resume trip
  resumeTrip() {
    const resumeData = {
      tripId: this.tripId,
      busId: this.busId,
      status: 'EN_ROUTE',
      resumeTime: new Date(),
      location: this.getCurrentLocation()
    };

    this.socket.emit('trip-resume', resumeData);
    return resumeData;
  }

  // End trip with metrics
  endTrip(finalMetrics) {
    const endData = {
      tripId: this.tripId,
      busId: this.busId,
      status: 'COMPLETED',
      endTime: new Date(),
      finalLocation: this.getCurrentLocation(),
      metrics: {
        ...finalMetrics,
        totalDuration: this.calculateTripDuration(),
        totalDistance: this.calculateTotalDistance(),
        averageSpeed: this.calculateAverageSpeed(),
        stopsCompleted: this.getCompletedStopsCount(),
        delays: this.getDelaysList()
      }
    };

    this.socket.emit('trip-end', endData);
    
    // Stop location tracking
    this.stopLocationTracking();
    
    return endData;
  }

  // ===== STOP MANAGEMENT =====

  // Arrived at stop
  arrivedAtStop(stopId, stopData) {
    const arrivalData = {
      tripId: this.tripId,
      busId: this.busId,
      stopId,
      stopName: stopData.name,
      arrivalTime: new Date(),
      location: this.getCurrentLocation(),
      passengerCount: this.getCurrentPassengerCount(),
      status: 'ARRIVED'
    };

    this.socket.emit('stop-arrived', arrivalData);
    return arrivalData;
  }

  // Departed from stop
  departedFromStop(stopId, boardingCount, alightingCount) {
    const departureData = {
      tripId: this.tripId,
      busId: this.busId,
      stopId,
      departureTime: new Date(),
      location: this.getCurrentLocation(),
      boardingCount,
      alightingCount,
      currentPassengerCount: this.getCurrentPassengerCount(),
      status: 'DEPARTED'
    };

    this.socket.emit('stop-departed', departureData);
    return departureData;
  }

  // Skip stop with reason
  skipStop(stopId, reason) {
    const skipData = {
      tripId: this.tripId,
      busId: this.busId,
      stopId,
      skipTime: new Date(),
      reason,
      location: this.getCurrentLocation(),
      status: 'SKIPPED'
    };

    this.socket.emit('stop-skipped', skipData);
    return skipData;
  }

  // ===== BROADCAST SYSTEM =====

  // Send broadcast message
  sendBroadcast(message, priority = 'normal', targetAudience = 'students') {
    const broadcastData = {
      tripId: this.tripId,
      busId: this.busId,
      message,
      priority,
      targetAudience,
      timestamp: new Date(),
      driverId: this.getDriverId(),
      messageType: 'text'
    };

    this.socket.emit('driver-broadcast', broadcastData);
    return broadcastData;
  }

  // Send emergency broadcast
  sendEmergencyBroadcast(message, emergencyType) {
    const emergencyBroadcast = {
      tripId: this.tripId,
      busId: this.busId,
      message,
      priority: 'emergency',
      emergencyType,
      timestamp: new Date(),
      driverId: this.getDriverId(),
      messageType: 'emergency'
    };

    this.socket.emit('emergency-broadcast', emergencyBroadcast);
    return emergencyBroadcast;
  }

  // Send voice broadcast (base64 encoded)
  sendVoiceBroadcast(audioData, duration) {
    const voiceBroadcast = {
      tripId: this.tripId,
      busId: this.busId,
      audioData,
      duration,
      priority: 'normal',
      timestamp: new Date(),
      driverId: this.getDriverId(),
      messageType: 'voice'
    };

    this.socket.emit('voice-broadcast', voiceBroadcast);
    return voiceBroadcast;
  }

  // ===== EMERGENCY SYSTEM =====

  // Trigger emergency alert
  triggerEmergency(emergencyType, details, location) {
    const emergencyData = {
      tripId: this.tripId,
      busId: this.busId,
      emergencyType, // 'accident', 'breakdown', 'medical', 'security'
      severity: 'high',
      timestamp: new Date(),
      location: location || this.getCurrentLocation(),
      details,
      driverId: this.getDriverId(),
      vehicleStatus: this.getVehicleStatus(),
      passengerCount: this.getCurrentPassengerCount()
    };

    this.socket.emit('emergency-trigger', emergencyData);
    this.emergencyActive = true;
    
    return emergencyData;
  }

  // Update emergency status
  updateEmergencyStatus(update) {
    const updateData = {
      tripId: this.tripId,
      busId: this.busId,
      emergencyId: update.emergencyId,
      update,
      timestamp: new Date(),
      location: this.getCurrentLocation()
    };

    this.socket.emit('emergency-update', updateData);
    return updateData;
  }

  // Resolve emergency
  resolveEmergency(resolution, finalReport) {
    const resolutionData = {
      tripId: this.tripId,
      busId: this.busId,
      resolution,
      finalReport,
      resolvedAt: new Date(),
      location: this.getCurrentLocation()
    };

    this.socket.emit('emergency-resolve', resolutionData);
    this.emergencyActive = false;
    
    return resolutionData;
  }

  // ===== LOCATION TRACKING =====

  // Start continuous location tracking
  startLocationTracking(interval = 5000) {
    if (this.locationTracking) {
      clearInterval(this.locationTracking);
    }

    this.locationTracking = setInterval(() => {
      const location = this.getCurrentLocation();
      if (location) {
        this.broadcastLocationUpdate(location);
      }
    }, interval);
  }

  // Stop location tracking
  stopLocationTracking() {
    if (this.locationTracking) {
      clearInterval(this.locationTracking);
      this.locationTracking = null;
    }
  }

  // Broadcast location update
  broadcastLocationUpdate(location) {
    const locationData = {
      tripId: this.tripId,
      busId: this.busId,
      latitude: location.latitude,
      longitude: location.longitude,
      speed: location.speed || 0,
      heading: location.heading || 0,
      accuracy: location.accuracy || 0,
      timestamp: new Date(),
      status: this.emergencyActive ? 'emergency' : 'moving'
    };

    this.socket.emit('bus-location-update', locationData);
    return locationData;
  }

  // ===== UTILITY METHODS =====

  generateTripId() {
    return `TRIP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getDriverId() {
    return localStorage.getItem('driverId') || 'DRV001';
  }

  getCurrentLocation() {
    // This would integrate with actual GPS
    return {
      latitude: 9.9252,
      longitude: 78.1198,
      speed: 25,
      heading: 45,
      accuracy: 10,
      timestamp: new Date()
    };
  }

  getCurrentPassengerCount() {
    // This would integrate with actual passenger counting system
    return Math.floor(Math.random() * 30) + 10;
  }

  getVehicleStatus() {
    return {
      fuel: 75,
      engine: 'normal',
      brakes: 'normal',
      lights: 'normal'
    };
  }

  calculateTripDuration() {
    // Calculate actual trip duration
    return 45; // minutes
  }

  calculateTotalDistance() {
    // Calculate total distance traveled
    return 12.5; // km
  }

  calculateAverageSpeed() {
    // Calculate average speed
    return 28; // km/h
  }

  getCompletedStopsCount() {
    // Get number of completed stops
    return 4;
  }

  getDelaysList() {
    // Get list of delays during trip
    return [
      { stop: 'Library', delay: 5, reason: 'Traffic' }
    ];
  }

  // ===== EVENT HANDLERS =====

  handleTripStatusConfirmation(data) {
    // Handle trip status confirmation from server
    console.log('Trip status confirmed:', data);
  }

  handleStopConfirmation(data) {
    // Handle stop action confirmation from server
    console.log('Stop action confirmed:', data);
  }

  handleAdminCommand(data) {
    // Handle commands from admin
    switch (data.command) {
      case 'STOP_IMMEDIATELY':
        // Handle immediate stop command
        break;
      case 'CHANGE_ROUTE':
        // Handle route change command
        break;
      case 'SPEED_LIMIT':
        // Handle speed limit command
        break;
      default:
        console.log('Unknown admin command:', data);
    }
  }

  // ===== CLEANUP =====

  disconnect() {
    if (this.socket) {
      this.socket.emit('driver-disconnect', {
        busId: this.busId,
        tripId: this.tripId,
        timestamp: new Date()
      });
      
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.stopLocationTracking();
  }
}

// Export singleton instance
export const driverService = new DriverService();
export default driverService;
