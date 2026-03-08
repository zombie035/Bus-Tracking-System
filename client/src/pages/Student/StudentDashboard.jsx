// client/src/pages/Student/StudentDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Icon } from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/StudentDashboard.css';
import { io } from 'socket.io-client';
import {
  MapIcon,
  BellIcon,
  QuestionMarkCircleIcon,
  Cog6ToothIcon,
  XMarkIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  MapPinIcon,
  ClockIcon,
  ArrowPathIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

// --- Custom Hooks for Map ---
function MapController({ center, zoom, autoAlign, compassHeading }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, {
        animate: true,
        duration: 1.5
      });
    }
  }, [center, zoom, map]);
  useEffect(() => {
    if (autoAlign && compassHeading !== null) {
      map.setBearing(compassHeading);
    } else {
      map.setBearing(0);
    }
  }, [autoAlign, compassHeading, map]);
  return null;
}

// --- Compass Hook for Device Orientation ---
function useCompass() {
  const [heading, setHeading] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if device orientation is supported
    if ('DeviceOrientationEvent' in window) {
      setIsSupported(true);

      const handleOrientation = (event) => {
        if (event.alpha !== null) {
          // Convert alpha (0-360) to compass heading (0-360)
          const compassHeading = Math.round(360 - event.alpha);
          setHeading(compassHeading);
          console.log('Compass heading:', compassHeading);
        }
      };

      // Add event listener
      window.addEventListener('deviceorientation', handleOrientation);

      // Cleanup
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    } else {
      setIsSupported(false);
      console.log('Device orientation not supported');
    }
  }, []);

  return { heading, isSupported };
}

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  // Use compass hook
  const { heading: deviceHeading, isSupported: compassSupported } = useCompass();

  // State
  const [activePopup, setActivePopup] = useState(null); // 'notifications', 'help', 'settings'
  const [isPopupMaximized, setIsPopupMaximized] = useState(false);
  const [mapCenter, setMapCenter] = useState([9.9252, 78.1198]);
  const [mapZoom, setMapZoom] = useState(15);
  const [autoAlign, setAutoAlign] = useState(false);
  const [compassHeading, setCompassHeading] = useState(0);
  const [mapTheme, setMapTheme] = useState('light');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Update compass heading when device orientation changes
  useEffect(() => {
    if (autoAlign && compassSupported) {
      setCompassHeading(deviceHeading);
    }
  }, [deviceHeading, autoAlign, compassSupported]);

  // Initialize socket connection
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      withCredentials: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server for real-time notifications');

      // Authenticate session and register for notifications
      fetch('/api/auth/check', {
        credentials: 'include'
      })
        .then(response => response.json())
        .then(data => {
          if (data.authenticated && data.session) {
            socket.emit('authenticate-session', {
              userId: data.session.userId,
              role: data.session.role
            });
          }
        })
        .catch(error => {
          console.error('Error checking authentication:', error);
        });
    });

    socket.on('notification-ready', (data) => {
      console.log('Notification registration confirmed:', data);
    });

    socket.on('new-notification', (notification) => {
      console.log('New notification received:', notification);

      // Add new notification to the list
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    socket.on('notification-updated', (updatedNotification) => {
      console.log('Notification updated:', updatedNotification);

      // Update existing notification in the list
      setNotifications(prev =>
        prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
      );

      // Update unread count
      if (updatedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Debug logging to verify state changes
  console.log('StudentDashboard - Current map theme:', mapTheme);

  // Fetch notifications on component mount and set up polling
  useEffect(() => {
    fetchNotifications();

    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/student/notifications', {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        // Log notification data to debug attachment visibility
        console.log('📬 Notifications fetched:', data.notifications.length, 'Unread:', data.unreadCount);
        console.log('📎 Sample notification with attachments:',
          data.notifications.filter(n => n.attachment_url || n.attachmentUrl));
        console.log('📋 Full notification data:', data.notifications);

        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/student/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        // Update local state to mark as read
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  const [busLocation, setBusLocation] = useState([9.9252, 78.1198]);
  const [currentStop, setCurrentStop] = useState({
    name: "College Main Gate",
    eta: "3 MIN",
    distance: "0.8 KM",
    busId: "BUS-42"
  });

  // --- Black & White Icons ---
  const busIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="white" stroke="black" stroke-width="4"/>
        <circle cx="20" cy="20" r="6" fill="black"/>
      </svg>
    `),
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  const stopIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="black" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
    `),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // Red marker for last stop
  const lastStopIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="#dc2626" stroke="#991b1b" stroke-width="3"/>
        <circle cx="16" cy="16" r="6" fill="#ef4444"/>
        <text x="16" y="20" text-anchor="middle" fill="white" font-size="8" font-weight="bold">END</text>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  // Sample route stops data
  const routeStops = [
    { id: 1, name: "College Main Gate", lat: 9.9252, lng: 78.1198, status: "current" },
    { id: 2, name: "Library", lat: 9.9262, lng: 78.1208, status: "upcoming" },
    { id: 3, name: "Cafeteria", lat: 9.9272, lng: 78.1218, status: "upcoming" },
    { id: 4, name: "Sports Complex", lat: 9.9282, lng: 78.1228, status: "upcoming" },
    { id: 5, name: "Hostel Block A", lat: 9.9292, lng: 78.1238, status: "upcoming" },
    { id: 6, name: "Bus Terminal", lat: 9.9302, lng: 78.1248, status: "last" }
  ];

  // --- Utility Functions ---
  const togglePopup = (name) => {
    if (activePopup === name) {
      setActivePopup(null);
      setIsPopupMaximized(false);
    } else {
      setActivePopup(name);
      setIsPopupMaximized(false);
    }
  };

  const closePopup = () => {
    setActivePopup(null);
    setIsPopupMaximized(false);
  };

  // --- Render Components ---

  const NavbarItem = ({ icon: IconComponent, label, name, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 transition-all duration-300 rounded-2xl ${isActive
        ? 'bg-white text-black translate-y-[-8px] shadow-lg scale-110'
        : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
    >
      <IconComponent className="w-6 h-6" strokeWidth={2} />
    </button>
  );

  const PopupCard = ({ title, children }) => {
    if (!activePopup) return null;

    return (
      <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
        <div
          className={`
            premium-glass flex flex-col overflow-hidden transition-all duration-500 ease-in-out
            ${isPopupMaximized ? 'w-full h-full rounded-none' : 'w-[90%] max-w-md h-[70%] rounded-3xl premium-shadow'}
          `}
        >
          {/* Popup Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40">
            <h2 className="text-xl font-bold tracking-wider text-white uppercase">{title}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setIsPopupMaximized(!isPopupMaximized)}
                className="p-2 rounded-full hover:bg-white/10 text-gray-300 transition-colors"
              >
                {isPopupMaximized ? <ArrowsPointingInIcon className="w-5 h-5" /> : <ArrowsPointingOutIcon className="w-5 h-5" />}
              </button>
              <button
                onClick={closePopup}
                className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Popup Content */}
          <div className="flex-1 overflow-y-auto p-6 pb-32 text-gray-200">
            {children}
          </div>
        </div>
      </div>
    );
  };

  // --- Content Generators ---
  const renderPopupContent = () => {
    switch (activePopup) {
      case 'notifications':
        return (
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <BellIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-bold text-white">No Notifications</h3>
                <p className="text-sm text-gray-400">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => {
                // Support both snake_case and camelCase from different APIs/sockets
                const attachmentUrl = notification.attachment_url || notification.attachmentUrl;
                const attachmentName = notification.attachment_name || notification.attachmentName;
                const attachmentSize = notification.attachment_size || notification.attachmentSize;
                const attachmentType = notification.attachment_type || notification.attachmentType;

                // Check if attachment exists (URL or name)
                const hasAttachment = !!(attachmentUrl || attachmentName);

                // Debug logging for ALL notifications to help diagnose
                console.log('🔔 Notification:', {
                  id: notification.id,
                  title: notification.title,
                  hasAttachment,
                  attachmentUrl,
                  attachmentName,
                  attachmentSize,
                  attachmentType,
                  allFields: Object.keys(notification)
                });

                // Build attachment href - handle both absolute and relative URLs
                let attachmentHref = null;
                if (attachmentUrl) {
                  if (attachmentUrl.startsWith('http://') || attachmentUrl.startsWith('https://')) {
                    attachmentHref = attachmentUrl;
                  } else {
                    // Relative URL - prepend base URL
                    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                    attachmentHref = `${baseUrl}${attachmentUrl.startsWith('/') ? attachmentUrl : '/' + attachmentUrl}`;
                  }
                }

                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer ${!notification.is_read ? 'opacity-100' : 'opacity-70'}`}
                    onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start mb-1 gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-white">{notification.title}</h3>
                          {hasAttachment && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/30 text-[11px] font-semibold text-blue-200 border border-blue-400/50 shadow-sm">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                              </svg>
                              File Attached
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                      </div>
                      {!notification.is_read && (
                        <div className="flex flex-col items-end gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          {hasAttachment && (
                            <span className="text-[10px] text-blue-300 font-semibold uppercase">
                              New file
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{notification.message}</p>

                    {hasAttachment && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        {attachmentHref ? (
                          <a
                            href={attachmentHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-sm text-white rounded-lg border border-blue-400/50 transition-all hover:scale-105 hover:shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('📎 Opening attachment:', attachmentHref);
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">
                              {attachmentName || 'Download Attachment'}
                            </span>
                            {attachmentSize && (
                              <span className="text-xs text-blue-200 ml-1">
                                ({(attachmentSize / 1024).toFixed(1)} KB)
                              </span>
                            )}
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-sm text-yellow-200 rounded-lg border border-yellow-400/50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">
                              {attachmentName || 'Attachment'} (URL missing)
                            </span>
                            {attachmentSize && (
                              <span className="text-xs text-yellow-200 ml-1">
                                ({(attachmentSize / 1024).toFixed(1)} KB)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {notification.sender_name && (
                      <p className="text-xs text-gray-500 mt-2">From: {notification.sender_name}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        );
      case 'help':
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <QuestionMarkCircleIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-bold text-white">Need Assistance?</h3>
              <p className="text-sm text-gray-400 mt-2">Contact the transport admin for help with routes or technical issues.</p>
            </div>
            <button className="w-full py-4 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors">
              CONTACT SUPPORT
            </button>
            <div className="border-t border-white/10 pt-4">
              <h4 className="font-bold text-gray-300 mb-2">FAQ</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>• How do I track my bus?</li>
                <li>• What if the bus is late?</li>
                <li>• How to report an incident?</li>
              </ul>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <div className="flex flex-col gap-3 mb-4">
                <span className="text-white font-medium">Map Theme</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMapTheme('light')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${mapTheme === 'light' ? 'bg-white text-black shadow-lg scale-105' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                  >
                    LIGHT
                  </button>
                  <button
                    onClick={() => setMapTheme('dark')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${mapTheme === 'dark' ? 'bg-white text-black shadow-lg scale-105' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                  >
                    DARK
                  </button>
                  <button
                    onClick={() => setMapTheme('default')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${mapTheme === 'default' ? 'bg-white text-black shadow-lg scale-105' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                  >
                    DEFAULT
                  </button>
                  <button
                    onClick={() => setMapTheme('satellite')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${mapTheme === 'satellite' ? 'bg-white text-black shadow-lg scale-105' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                  >
                    SATELLITE
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Notifications</span>
                <div className="w-10 h-6 rounded-full bg-white relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-black rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/5 opacity-50 cursor-not-allowed">
              <h4 className="text-gray-400 font-bold mb-2 text-sm uppercase tracking-wider">Admin & Driver Access</h4>
              <p className="text-xs text-gray-500">You do not have permission to access these settings.</p>
            </div>

            <button onClick={logout} className="w-full py-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 transition-colors">
              LOG OUT
            </button>
          </div>
        );
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <UserCircleIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-bold text-white">Student Profile</h3>
            </div>
            <div className="glass-black rounded-2xl p-6 mb-6 max-w-sm mx-auto">
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center mx-auto mb-4">
                  <UserCircleIcon className="w-12 h-12 text-gray-600" />
                </div>
                <h4 className="text-lg font-bold text-white">{user?.name || 'Student'}</h4>
                <p className="text-sm text-gray-300">{user?.email || 'student@college.edu'}</p>
                <p className="text-xs text-gray-400 mt-2">Student ID: {user?.studentId || 'N/A'}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/10">
                  <span className="text-sm font-medium text-gray-300">Account Settings</span>
                  <Cog6ToothIcon className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/10">
                  <span className="text-sm font-medium text-gray-300">Privacy</span>
                  <ArrowPathIcon className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 mt-6"
              >
                <span>LOGOUT</span>
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-black overflow-hidden font-sans"
      style={{
        height: '100dvh', // Dynamic viewport height for mobile
        overflow: 'hidden', // Prevent body scroll
        position: 'relative'
      }}
    >

      {/* 1. TOP BAR - CURRENT STOP INFO */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 flex justify-center pointer-events-none">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-6 shadow-2xl pointer-events-auto min-w-[320px]">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Next Stop</span>
            <h1 className="text-xl font-black text-white leading-tight">{currentStop.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-black bg-white px-2 py-0.5 rounded-sm">{currentStop.busId}</span>
              <span className="text-xs text-gray-400">{currentStop.distance} away</span>
            </div>
          </div>
          <div className="h-10 w-[1px] bg-white/10"></div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">ETA</span>
            <span className="text-2xl font-black text-white">{currentStop.eta}</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN MAP CONTAINER */}
      <div className="absolute inset-0 z-0">
        {/* Map placeholder if 'window' is not defined (SSR safety), though standard React runs client-side */}
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          zoomControl={false}
          attributionControl={false}
          className={`w-full h-full ${mapTheme === 'dark' ? 'bg-[#111]' : mapTheme === 'satellite' ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}
          style={{ background: mapTheme === 'dark' ? '#111' : mapTheme === 'satellite' ? '#1a1a1a' : '#f3f4f6' }}
        >
          <MapController center={mapCenter} zoom={mapZoom} autoAlign={autoAlign} compassHeading={compassHeading} />

          {/* Dynamic Theme Tile Layer */}
          <TileLayer
            url={
              mapTheme === 'dark'
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : mapTheme === 'light'
                  ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  : mapTheme === 'satellite'
                    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
            subdomains={mapTheme === 'satellite' ? [] : mapTheme === 'default' ? "abc" : "abcd"}
            maxZoom={20}
          />

          {/* Bus Marker */}
          <Marker position={busLocation} icon={busIcon} />

          {/* Route Stops Markers */}
          {routeStops.map((stop, index) => (
            <Marker
              key={stop.id}
              position={[stop.lat, stop.lng]}
              icon={stop.status === 'last' ? lastStopIcon : stopIcon}
            />
          ))}

          {/* Route Line connecting stops */}
          <Polyline
            positions={routeStops.map(stop => [stop.lat, stop.lng])}
            color="rgba(59, 130, 246, 0.8)"
            weight={4}
            opacity={0.7}
            dashArray="10, 5"
          />

        </MapContainer>

        {/* Compass Button */}
        <button
          onClick={() => {
            if (!autoAlign) {
              setCompassHeading(deviceHeading);
            } else {
              setCompassHeading(0);
            }
            setAutoAlign(!autoAlign);
          }}
          className={`absolute top-28 right-4 z-[1000] p-3 rounded-full transition-all duration-300 shadow-xl border-2 ${autoAlign ? 'bg-white text-black border-white' : 'bg-black/70 text-white border-white/30 backdrop-blur-md hover:bg-black/80'
            }`}
          title={autoAlign ? 'Disable Compass Alignment' : 'Enable Compass Alignment'}
        >
          <svg
            className={`w-6 h-6 transition-transform duration-500 ${autoAlign ? 'text-black' : 'text-white'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ transform: `rotate(${autoAlign ? -compassHeading : 0}deg)` }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>

        {/* Satellite Toggle Button */}
        <button
          onClick={() => {
            const newTheme = mapTheme === 'satellite' ? 'default' : 'satellite';
            console.log('Satellite button clicked - switching from', mapTheme, 'to', newTheme);
            setMapTheme(newTheme);
          }}
          className={`absolute top-40 right-4 z-[1000] p-3 rounded-full transition-all duration-300 shadow-xl border-2 ${mapTheme === 'satellite' ? 'bg-blue-600 text-white border-blue-400' : 'bg-black/70 text-white border-white/30 backdrop-blur-md hover:bg-black/80'
            }`}
          title={mapTheme === 'satellite' ? 'Switch to Default Map' : 'Switch to Satellite View'}
        >
          {mapTheme === 'satellite' ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
      </div>


      {/* 3. POPUPS (RENDERED IN PORTAL STYLE ABOVE MAP) */}
      <PopupCard title={activePopup}>
        {renderPopupContent()}
      </PopupCard>

      {/* 4. BOTTOM NAVBAR - ICONS ONLY */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[999] flex justify-center pointer-events-none transition-all duration-300"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}
      >
        <div className="premium-glass px-2 py-2 rounded-3xl flex items-center gap-1 shadow-2xl pointer-events-auto">

          <NavbarItem
            icon={MapIcon}
            isActive={activePopup === null}
            onClick={() => setActivePopup(null)}
          />

          <NavbarItem
            icon={ArrowPathIcon}
            isActive={false}
            onClick={() => {
              // Simulate refresh or "Live Bus" focus
              setMapCenter(busLocation);
              setMapZoom(16);
            }}
          />

          <div className="w-[1px] h-8 bg-white/10 mx-2"></div>

          <NavbarItem
            icon={BellIcon}
            name="notifications"
            isActive={activePopup === 'notifications'}
            onClick={() => togglePopup('notifications')}
          >
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </NavbarItem>

          <NavbarItem
            icon={QuestionMarkCircleIcon}
            name="help"
            isActive={activePopup === 'help'}
            onClick={() => togglePopup('help')}
          />

          <NavbarItem
            icon={Cog6ToothIcon}
            name="settings"
            isActive={activePopup === 'settings'}
            onClick={() => togglePopup('settings')}
          />

          {/* Profile Icon with Logout */}
          <div className="relative">
            <NavbarItem
              icon={UserCircleIcon}
              isActive={false}
              onClick={() => togglePopup('profile')}
            />
            {/* Logout Button */}
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="absolute -bottom-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
              title="Logout"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

export default StudentDashboard;
