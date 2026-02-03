// client/src/components/Admin/LiveMonitor.jsx
import React, { useState, useEffect, useCallback } from 'react';
import MapComponent from '../Common/MapComponent';
import { busService } from '../../services/busService';
import { useSocket } from '../../contexts/SocketContext';
import '../../styles/admin.css';

const LiveMonitor = () => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showBusList, setShowBusList] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { socket } = useSocket();

  // Action states
  const [messageModal, setMessageModal] = useState({ show: false, busId: null, driverId: null });
  const [messageText, setMessageText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchBuses();
    fetchRoutes();
  }, []);

  // Setup socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleBusUpdate = (data) => {
      setBuses(prev => prev.map(bus =>
        bus.id === data.busId
          ? { ...bus, ...data, updatedAt: new Date() }
          : bus
      ));

      // Update selected bus if it's the one being updated
      if (selectedBus && selectedBus.id === data.busId) {
        setSelectedBus(prev => ({ ...prev, ...data, updatedAt: new Date() }));
      }
    };

    socket.on('bus-update', handleBusUpdate);
    socket.on('bus-live-update', handleBusUpdate);
    socket.on('bus-location-update', handleBusUpdate);

    return () => {
      socket.off('bus-update', handleBusUpdate);
      socket.off('bus-live-update', handleBusUpdate);
      socket.off('bus-location-update', handleBusUpdate);
    };
  }, [socket, selectedBus]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchBuses, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchBuses = async () => {
    try {
      // Use getAllBuses to show offline buses too (with initial/last location)
      const busesData = await busService.getAllBuses();
      setBuses(busesData.buses || []);
    } catch (error) {
      console.error('Error fetching buses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const routesData = await busService.getRoutes();
      setRoutes(routesData.routes || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchBuses();
  };

  const handleBusClick = (bus) => {
    setSelectedBus(bus);
  };

  // Actions
  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    setActionLoading(true);
    try {
      await busService.sendMessageToDriver({
        driverId: messageModal.driverId,
        message: messageText
      });
      alert('Message sent successfully!');
      setMessageModal({ show: false, busId: null, driverId: null });
      setMessageText('');
    } catch (error) {
      alert('Failed to send message');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkDelayed = async (bus) => {
    if (!window.confirm('Mark this trip as DELAYED?')) return;
    setActionLoading(true);
    try {
      await busService.updateTripStatus({
        busId: bus.id,
        status: 'delayed',
        reason: 'Traffic/Manual Report'
      });
      fetchBuses(); // Refresh to show status
    } catch (error) {
      alert('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const statusColors = {
    moving: '#10b981',
    stopped: '#f59e0b',
    delayed: '#ef4444',
    offline: '#94a3b8'
  };

  const getStatusColor = (status) => statusColors[status?.toLowerCase()] || statusColors.offline;

  const filteredBuses = buses.filter(bus =>
    statusFilter === 'all' || bus.status === statusFilter
  );

  // Prepare map markers
  const mapMarkers = filteredBuses
    .filter(bus => bus.latitude && bus.longitude && !isNaN(parseFloat(bus.latitude)) && !isNaN(parseFloat(bus.longitude)))
    .map(bus => ({
      position: { lat: parseFloat(bus.latitude), lng: parseFloat(bus.longitude) },
      iconHtml: `
        <div style="
          width: 40px; height: 40px;
          background: ${getStatusColor(bus.status)};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 1.1rem;
          transform: rotate(${bus.direction || 0}deg);
        ">
          <i class="fas fa-location-arrow"></i>
        </div>
      `,
      popup: `
        <div style="padding: 5px;">
          <strong>Bus ${bus.busNumber}</strong><br>
          <span style="color:${getStatusColor(bus.status)}">${bus.status?.toUpperCase()}</span><br>
          Speed: ${bus.speed || 0} km/h
        </div>
      `,
      onClick: () => handleBusClick(bus)
    }));

  // Prepare map routes (active bus routes)
  const mapRoutes = [];
  if (selectedBus) {
    // Find route for selected bus
    const route = routes.find(r => r.name === selectedBus.routeName);
    if (route && route.stops) {
      const coords = route.stops
        .filter(s => s.latitude && s.longitude)
        .map(s => ({ lat: parseFloat(s.latitude), lng: parseFloat(s.longitude) }));

      if (coords.length > 1) {
        mapRoutes.push({
          coordinates: coords,
          color: '#3b82f6',
          weight: 5
        });
      }
    }
  }

  // Calculate center
  const calculateMapCenter = () => {
    if (selectedBus?.latitude && !isNaN(parseFloat(selectedBus.latitude))) {
      return [parseFloat(selectedBus.latitude), parseFloat(selectedBus.longitude)];
    }
    const validBuses = filteredBuses.filter(bus => bus.latitude && bus.longitude && !isNaN(parseFloat(bus.latitude)) && !isNaN(parseFloat(bus.longitude)));
    if (validBuses.length === 0) return [9.849607, 78.163951];
    if (validBuses.length > 0 && validBuses[0].latitude && !isNaN(parseFloat(validBuses[0].latitude))) {
      return [parseFloat(validBuses[0].latitude), parseFloat(validBuses[0].longitude)];
    }
    return [9.849607, 78.163951];
  };

  return (
    <div className="admin-dashboard h-full flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            Live Fleet Monitor
          </h1>
          <p className="text-sm text-gray-500">Real-time tracking • {buses.filter(b => b.status === 'moving').length} Moving • {buses.filter(b => b.status === 'delayed').length} Delayed</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleRefresh} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition">
            <i className={`fas fa-sync ${loading ? 'animate-spin' : ''}`}></i> Refresh
          </button>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['all', 'moving', 'delayed'].map(filter => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-md text-sm capitalize transition ${statusFilter === filter ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative bg-gray-100">
          <MapComponent
            center={calculateMapCenter()}
            zoom={selectedBus ? 15 : 6}
            markers={mapMarkers}
            routes={mapRoutes}
            className="z-0"
          />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-6 left-6 bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-sm z-[400]">
            <div className="font-semibold mb-2 text-gray-700">Status Legend</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Moving
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span> Stopped
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span> Delayed
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info Panel */}
        <div className="w-96 bg-white border-l border-gray-200 shadow-xl overflow-y-auto z-20 flex flex-col">
          {selectedBus ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Bus {selectedBus.busNumber}</h2>
                    <p className="text-sm text-gray-500 font-medium">{selectedBus.routeName}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm" style={{ backgroundColor: getStatusColor(selectedBus.status) }}>
                    {selectedBus.status?.toUpperCase()}
                  </span>
                </div>
                <button onClick={() => setSelectedBus(null)} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2">
                  <i className="fas fa-arrow-left"></i> Back to Fleet
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Critical Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Speed</div>
                    <div className="text-2xl font-bold text-gray-800">{selectedBus.speed || 0} <span className="text-xs font-normal text-gray-500">km/h</span></div>
                  </div>
                  <div className={`p-3 rounded-xl border ${selectedBus.engine_status === 'ON' ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Engine</div>
                    <div className={`text-2xl font-bold ${selectedBus.engine_status === 'ON' ? 'text-green-600' : 'text-gray-400'}`}>
                      {selectedBus.engine_status || 'OFF'}
                    </div>
                  </div>
                </div>

                {/* Detail List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                        <i className="fas fa-compass"></i>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Direction</div>
                        <div className="text-xs text-gray-500">{selectedBus.direction ? `${selectedBus.direction}° Heading` : 'Stationary'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                        <i className="fas fa-user-tie"></i>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Driver</div>
                        <div className="text-xs text-gray-500">{selectedBus.driverName || 'Not Assigned'}</div>
                      </div>
                    </div>
                    <div className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">ID: {selectedBus.driverId || 'N/A'}</div>
                  </div>

                  {selectedBus.idle_start_time && (
                    <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-stopwatch text-amber-500"></i>
                        <div>
                          <div className="text-sm font-medium text-amber-800">Idling Since</div>
                          <div className="text-xs text-amber-600">{new Date(selectedBus.idle_start_time).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 border-t border-gray-100 bg-white space-y-3">
                <button
                  onClick={() => setMessageModal({ show: true, busId: selectedBus.id, driverId: selectedBus.driverId })}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex justify-center items-center gap-2"
                >
                  <i className="fas fa-comment-dots"></i> Message Driver
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleMarkDelayed(selectedBus)}
                    className="py-3 bg-amber-50 text-amber-700 rounded-xl font-medium hover:bg-amber-100 border border-amber-200 transition flex justify-center items-center gap-2"
                  >
                    <i className="fas fa-clock"></i> Mark Delay
                  </button>
                  <button
                    onClick={() => window.open(`tel:${selectedBus.driverPhone || ''}`)} // Added fallbacks
                    className="py-3 bg-gray-50 text-gray-700 rounded-xl font-medium hover:bg-gray-100 border border-gray-200 transition flex justify-center items-center gap-2"
                  >
                    <i className="fas fa-phone"></i> Call
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
              <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
                <i className="fas fa-bus text-4xl text-blue-500 text-opacity-50"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Select a Vehicle</h3>
              <p className="text-gray-500 mb-8 max-w-xs">Click on any bus marker on the map to view live telemetry, driver info, and control options.</p>

              {/* Mini List */}
              <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-left">
                <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-700 text-sm">Active Buses ({filteredBuses.length})</div>
                <div className="max-h-64 overflow-y-auto">
                  {filteredBuses.map(bus => (
                    <div
                      key={bus.id}
                      onClick={() => handleBusClick(bus)}
                      className="px-4 py-3 border-b border-gray-50 hover:bg-blue-50 cursor-pointer flex justify-between items-center group transition"
                    >
                      <div>
                        <div className="font-medium text-gray-800 group-hover:text-blue-700">Bus {bus.busNumber}</div>
                        <div className="text-xs text-gray-500">{bus.routeName}</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full`} style={{ background: getStatusColor(bus.status) }}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      {messageModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[500]">
          <div className="bg-white p-6 rounded-2xl w-96 shadow-2xl transform transition-all scale-100">
            <h3 className="text-lg font-bold mb-1 text-gray-800">Message Driver</h3>
            <p className="text-sm text-gray-500 mb-4">Send an instant alert to the driver app.</p>

            <textarea
              className="w-full border border-gray-300 rounded-xl p-3 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-gray-50"
              rows="4"
              placeholder="Type your message here (e.g., 'Please wait 5 mins at next stop')..."
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMessageModal({ show: false, busId: null, driverId: null })}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={actionLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <i className="fas fa-circle-notch animate-spin"></i>}
                {actionLoading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMonitor;