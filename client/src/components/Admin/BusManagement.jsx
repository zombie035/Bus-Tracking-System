// client/src/components/Admin/BusManagement.jsx
import React, { useState, useEffect } from 'react';
import { busService } from '../../services/busService';
import Modal from '../UI/Modal';
import BusForm from './BusForm';
import Toast from '../UI/Toast';
import '../../styles/admin.css';

const BusManagement = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingBus, setEditingBus] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [locationModal, setLocationModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [locationData, setLocationData] = useState({
    latitude: '',
    longitude: '',
    speed: 0,
    status: 'active'
  });
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    fetchBuses();
    const interval = setInterval(fetchBuses, 30000);
    return () => clearInterval(interval);
  }, []);

  // client/src/components/Admin/BusManagement.jsx

  const fetchBuses = async () => {
    try {
      console.log('🔄 Fetching buses from API...');
      setLoading(true);
      const response = await busService.getAllBuses();

      console.log('📥 API Response:', response);
      console.log('   Response.success:', response.success);
      console.log('   Response.buses length:', response.buses?.length);

      if (response.success && response.buses) {
        // --- START EDIT HERE ---
        const formattedBuses = response.buses.map(bus => ({
          ...bus,
          id: bus.id || bus._id,
          busNumber: bus.busNumber || bus.bus_number,
          routeName: bus.routeName || bus.route_name,
          driverId: bus.driverId || bus.driver_id,
          // Handle driverName from the join in Bus.js model
          driverName: bus.driverName || bus.driver_name || 'Unassigned',
          driverEmail: bus.driverEmail || '',
          capacity: parseInt(bus.capacity || 0),
          status: bus.status || 'active',
          latitude: bus.latitude,
          longitude: bus.longitude
        }));

        console.log(`✅ Formatted ${formattedBuses.length} buses`);
        setBuses(formattedBuses);
      } else {
        console.log('⚠️ No buses in response');
        setBuses([]);
      }
    } catch (error) {
      console.error('❌ Error fetching buses:', error);
      showToast('Failed to fetch buses', 'error');
      setBuses([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddBus = () => {
    setEditingBus(null);
    setModalType('form');
    setShowModal(true);
  };

  const handleEditBus = (bus) => {
    setEditingBus(bus);
    setModalType('form');
    setShowModal(true);
  };

  const handleDeleteClick = (bus) => {
    setSelectedBus(bus);
    setDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedBus) return;

    try {
      const response = await busService.deleteBus(selectedBus.id);
      if (response.success) {
        setBuses(prev => prev.filter(b => b.id !== selectedBus.id));
        showToast(`Bus ${selectedBus.busNumber} deleted successfully`, 'success');
        setDeleteConfirm(false);
        setSelectedBus(null);
      } else {
        showToast(response.message || 'Failed to delete bus', 'error');
      }
    } catch (error) {
      console.error('Error deleting bus:', error);
      showToast('Error deleting bus', 'error');
    }
  };

  const handleUpdateLocation = (bus) => {
    setSelectedBus(bus);
    setLocationData({
      latitude: bus.latitude || '',
      longitude: bus.longitude || '',
      speed: bus.speed || 0,
      status: bus.status || 'active'
    });
    setLocationModal(true);
  };

  const handleSubmitLocation = async () => {
    if (!selectedBus) return;

    try {
      const response = await busService.updateBusLocation(selectedBus.id, locationData);
      if (response.success) {
        setBuses(prev => prev.map(b =>
          b.id === selectedBus.id
            ? { ...b, ...locationData, updatedAt: new Date().toISOString() }
            : b
        ));
        showToast('Bus location updated successfully', 'success');
        setLocationModal(false);
        setSelectedBus(null);
      } else {
        showToast(response.message || 'Failed to update location', 'error');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      showToast('Error updating location', 'error');
    }
  };

  const handleBusSuccess = () => {
    setShowModal(false);
    showToast(editingBus ? 'Bus updated successfully' : 'Bus created successfully', 'success');
    fetchBuses();
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border border-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 border border-gray-300';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const filteredBuses = buses.filter(bus => {
    const matchesSearch = !search ||
      bus.busNumber?.toLowerCase().includes(search.toLowerCase()) ||
      bus.routeName?.toLowerCase().includes(search.toLowerCase()) ||
      bus.driverName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || bus.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Notification Card - Inline instead of popup */}
      {toast && (
        <div className={`p-4 rounded-lg border flex items-center justify-between gap-3 shadow-md ${toast.type === 'success'
          ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-red-50 border-red-200 text-red-700'
          }`}>
          <div className="flex items-center gap-3">
            <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-lg`}></i>
            <span className="font-medium">{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer flex-shrink-0 w-8 h-8 flex items-center justify-center rounded hover:bg-white/50"
            aria-label="Close notification"
            type="button"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bus Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all buses in the tracking system ({filteredBuses.length} buses)
          </p>
        </div>

        <button
          onClick={handleAddBus}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 w-fit shadow hover:shadow-md"
        >
          <i className="fas fa-plus"></i>
          Add New Bus
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <i className="fas fa-search absolute inset-y-0 left-3 text-gray-400 top-3"></i>
              <input
                type="text"
                placeholder="Search by bus number, route, or driver..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading buses...</p>
          </div>
        </div>
      ) : filteredBuses.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center">
            <i className="fas fa-bus-slash text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Buses Found</h3>
            <p className="text-gray-600 text-center mb-6">
              {search || statusFilter !== 'all'
                ? 'No buses match your search criteria'
                : 'No buses in the system yet'}
            </p>
            {!search && statusFilter === 'all' && (
              <button
                onClick={handleAddBus}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2"
              >
                <i className="fas fa-plus"></i>
                Add Your First Bus
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Bus Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Route</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Driver</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Capacity</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Last Updated</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBuses.map((bus) => (
                  <tr key={bus.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-bus text-blue-600"></i>
                        <span className="font-semibold text-gray-900">{bus.busNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-gray-700">{bus.routeName || '—'}</span></td>
                    <td className="px-6 py-4">
                      {bus.driverName ? (
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{bus.driverName}</p>
                          <p className="text-gray-500">{bus.driverEmail}</p>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(bus.status)}`}>
                        {bus.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{bus.capacity} seats</td>
                    <td className="px-6 py-4">
                      {bus.latitude && bus.longitude && !isNaN(parseFloat(bus.latitude)) && !isNaN(parseFloat(bus.longitude)) ? (
                        <div className="flex items-center gap-1 text-gray-700 text-sm">
                          <i className="fas fa-map-marker-alt text-red-500"></i>
                          <span>{parseFloat(bus.latitude).toFixed(4)}, {parseFloat(bus.longitude).toFixed(4)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {bus.updatedAt ? new Date(bus.updatedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditBus(bus)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleUpdateLocation(bus)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Update location"
                        >
                          <i className="fas fa-map-marker-alt"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(bus)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bus Form Modal */}
      <Modal
        isOpen={showModal && modalType === 'form'}
        onClose={() => setShowModal(false)}
        title={editingBus ? 'Edit Bus' : 'Add New Bus'}
      >
        <BusForm
          bus={editingBus}
          onSuccess={handleBusSuccess}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm}
        onClose={() => { setDeleteConfirm(false); setSelectedBus(null); }}
        title="Delete Bus"
      >
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-3">
              <i className="fas fa-exclamation-circle text-red-600 text-xl mt-0.5"></i>
              <div>
                <h3 className="font-semibold text-red-900">Delete Bus {selectedBus?.busNumber}?</h3>
                <p className="text-red-700 text-sm mt-1">This action cannot be undone. The bus will be permanently removed.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => { setDeleteConfirm(false); setSelectedBus(null); }}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              <i className="fas fa-trash mr-2"></i>
              Delete Bus
            </button>
          </div>
        </div>
      </Modal>

      {/* Location Update Modal */}
      <Modal
        isOpen={locationModal}
        onClose={() => { setLocationModal(false); setSelectedBus(null); }}
        title={`Update Location - Bus ${selectedBus?.busNumber}`}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Latitude *</label>
              <input
                type="number"
                step="0.000001"
                value={locationData.latitude}
                onChange={(e) => setLocationData(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitude *</label>
              <input
                type="number"
                step="0.000001"
                value={locationData.longitude}
                onChange={(e) => setLocationData(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Speed (km/h)</label>
              <input
                type="number"
                value={locationData.speed}
                onChange={(e) => setLocationData(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={locationData.status}
                onChange={(e) => setLocationData(prev => ({ ...prev, status: e.target.value }))}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => { setLocationModal(false); setSelectedBus(null); }}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitLocation}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              <i className="fas fa-save mr-2"></i>
              Update Location
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default BusManagement;
