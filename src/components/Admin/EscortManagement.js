import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaImage, FaMapMarkerAlt, FaStar, FaCheck, FaTimes } from 'react-icons/fa';

const EscortManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [escorts, setEscorts] = useState([]);
  const [escortProfiles, setEscortProfiles] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create', 'edit', 'view'
  const [selectedEscort, setSelectedEscort] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    featured: '',
    type: '', // 'admin', 'agent', or ''
    page: 1
  });
  const [pagination, setPagination] = useState({});  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    gender: '',
    profileImage: '',
    country: '',
    region: '',
    relationshipStatus: '',
    interests: [],
    profession: '',
    height: '',
    dateOfBirth: ''
  });
  useEffect(() => {
    if (activeTab === 'all') {
      fetchAllProfiles();
    } else if (activeTab === 'escorts') {
      fetchEscorts();
    } else {
      fetchEscortProfiles();
    }
  }, [activeTab, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEscorts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: filters.page,
        limit: 20,
        search: filters.search,
        status: filters.status,
        featured: filters.featured
      });

      const response = await adminApi.get(`/admin/escorts?${params}`);

      setEscorts(response.data.escorts || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching escorts:', error);
      alert('Error fetching escorts');
    } finally {
      setLoading(false);
    }
  };

  const fetchEscortProfiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: filters.page,
        limit: 20,
        search: filters.search,
        status: filters.status
      });

      const response = await adminApi.get(`/admin/escort-profiles?${params}`);

      setEscortProfiles(response.data.profiles || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching escort profiles:', error);
      alert('Error fetching escort profiles');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProfiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: filters.page,
        limit: 20,
        search: filters.search,
        status: filters.status,
        type: filters.type
      });

      const response = await adminApi.get(`/admin/all-escort-profiles?${params}`);

      setAllProfiles(response.data.profiles || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching all profiles:', error);
      alert('Error fetching profiles');
    } finally {
      setLoading(false);
    }
  };
  const handleCreateEscort = async () => {
    try {
      await adminApi.post('/admin/escorts', formData);

      alert('Escort profile created successfully');
      setShowModal(false);
      resetForm();
      fetchEscorts();
    } catch (error) {
      console.error('Error creating escort:', error);
      alert('Error creating escort: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateEscort = async () => {
    try {
      await adminApi.put(`/admin/escorts/${selectedEscort._id}`, formData);

      alert('Escort profile updated successfully');
      setShowModal(false);
      resetForm();
      fetchEscorts();
    } catch (error) {
      console.error('Error updating escort:', error);
      alert('Error updating escort: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteEscort = async (escortId) => {
    if (!window.confirm('Are you sure you want to delete this escort profile?')) {
      return;
    }

    try {
      await adminApi.delete(`/admin/escorts/${escortId}`);

      alert('Escort profile deleted successfully');
      fetchEscorts();
    } catch (error) {
      console.error('Error deleting escort:', error);
      alert('Error deleting escort');
    }
  };

  const handleUpdateProfileStatus = async (profileId, newStatus) => {
    try {
      await adminApi.patch(`/admin/escort-profiles/${profileId}/status`, 
        { status: newStatus }
      );

      alert(`Profile status updated to ${newStatus}`);
      fetchEscortProfiles();
    } catch (error) {
      console.error('Error updating profile status:', error);
      alert('Error updating profile status');
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm('Are you sure you want to delete this escort profile?')) {
      return;
    }

    try {
      await adminApi.delete(`/admin/escort-profiles/${profileId}`);

      alert('Escort profile deleted successfully');
      fetchEscortProfiles();
    } catch (error) {
      console.error('Error deleting escort profile:', error);
      alert('Error deleting escort profile');
    }
  };

  const openModal = (type, escort = null) => {
    setModalType(type);
    setSelectedEscort(escort);
    
    if (type === 'edit' && escort) {
      setFormData({
        name: escort.name || '',
        age: escort.age || '',
        location: escort.location || '',
        description: escort.description || '',
        images: escort.images || [],
        services: escort.services || [],
        rates: escort.rates || { hourly: '', daily: '' },
        availability: escort.availability !== undefined ? escort.availability : true,
        featured: escort.featured || false
      });
    } else if (type === 'create') {
      resetForm();
    }
    
    setShowModal(true);
  };  const resetForm = () => {
    setFormData({
      username: '',
      firstName: '',
      gender: '',
      profileImage: '',
      country: '',
      region: '',
      relationshipStatus: '',
      interests: [],
      profession: '',
      height: '',
      dateOfBirth: ''
    });
    setSelectedEscort(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalType === 'create') {
      handleCreateEscort();
    } else if (modalType === 'edit') {
      handleUpdateEscort();
    }  };

  const viewProfile = (profile) => {
    setSelectedEscort(profile);
    setModalType('view');
    setShowModal(true);
  };const editEscort = (escort) => {
    setSelectedEscort(escort);
    setModalType('edit');
    setFormData({
      username: escort.username || '',
      firstName: escort.firstName || '',
      gender: escort.gender || '',
      profileImage: escort.profileImage || '',
      country: escort.country || '',
      region: escort.region || '',
      relationshipStatus: escort.relationshipStatus || '',
      interests: escort.interests || [],
      profession: escort.profession || '',
      height: escort.height || '',
      dateOfBirth: escort.dateOfBirth ? new Date(escort.dateOfBirth).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const deleteEscort = async (escortId) => {
    if (!window.confirm('Are you sure you want to delete this escort profile?')) {
      return;
    }

    try {
      await adminApi.delete(`/admin/escorts/${escortId}`);

      alert('Escort profile deleted successfully');
      fetchAllProfiles();
      fetchEscorts();
    } catch (error) {
      console.error('Error deleting escort:', error);
      alert('Error deleting escort profile');
    }
  };

  const toggleProfileStatus = async (profileId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      await adminApi.patch(`/admin/escort-profiles/${profileId}/status`, 
        { status: newStatus }
      );

      alert(`Profile status updated to ${newStatus}`);
      fetchAllProfiles();
      fetchEscortProfiles();
    } catch (error) {
      console.error('Error updating profile status:', error);
      alert('Error updating profile status');
    }
  };

  const renderEscortsTab = () => (
    <div className="space-y-4 lg:space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white">Escort Profiles</h2>
          <p className="text-sm lg:text-base text-gray-300">Manage escort listings and information</p>
        </div>
        <button
          onClick={() => navigate('/admin/escorts/add')}
          className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-sm lg:text-base w-full sm:w-auto justify-center"
        >
          <FaPlus className="text-sm" /> Add New Escort
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-3 lg:p-4 rounded-lg shadow border border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search escorts..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              className="pl-10 pr-4 py-2 border border-gray-600 rounded-lg w-full focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400 text-sm"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-gray-700 text-white text-sm"
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
          <select
            value={filters.featured}
            onChange={(e) => setFilters(prev => ({ ...prev, featured: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-gray-700 text-white text-sm"
          >
            <option value="">All Types</option>
            <option value="true">Featured</option>
            <option value="false">Regular</option>
          </select>
          <button
            onClick={() => setFilters({ search: '', status: '', featured: '', page: 1 })}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 border border-gray-600 text-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Escorts List - Cards on mobile, table on desktop */}
      <div className="bg-gray-800 rounded-lg shadow border border-gray-700">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading escorts...</div>
          </div>
        ) : escorts.length === 0 ? (
          <div className="text-center py-8">
            <FaImage className="mx-auto text-4xl text-gray-500 mb-4" />
            <p className="text-gray-400">No escorts found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="block lg:hidden">
              <div className="divide-y divide-gray-700">
                {escorts.map((escort) => (
                  <div key={escort._id} className="p-4 hover:bg-gray-700 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {escort.name?.charAt(0)?.toUpperCase() || 'E'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-white truncate">{escort.name}</h3>
                            {escort.featured && <FaStar className="ml-2 text-yellow-500 text-xs" />}
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            escort.availability 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {escort.availability ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        <div className="mt-1">
                          <p className="text-xs text-gray-400">{escort.images?.length || 0} photos</p>
                          <div className="flex items-center text-xs text-gray-400 mt-1">
                            <FaMapMarkerAlt className="mr-1" /> {escort.location} • {escort.age} years
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-xs text-white">
                            Hourly: ${escort.rates?.hourly || 'N/A'} • Daily: ${escort.rates?.daily || 'N/A'}
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => openModal('view', escort)}
                              className="text-rose-600 hover:text-rose-400 p-1"
                            >
                              <FaEye className="text-sm" />
                            </button>
                            <button
                              onClick={() => openModal('edit', escort)}
                              className="text-indigo-600 hover:text-indigo-400 p-1"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleDeleteEscort(escort._id)}
                              className="text-red-600 hover:text-red-400 p-1"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Created: {new Date(escort.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Escort
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Age & Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Rates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {escorts.map((escort) => (
                    <tr key={escort._id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">
                                {escort.name?.charAt(0)?.toUpperCase() || 'E'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white flex items-center">
                              {escort.name}
                              {escort.featured && <FaStar className="ml-2 text-yellow-500" />}
                            </div>
                            <div className="text-sm text-gray-400">
                              {escort.images?.length || 0} photos
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{escort.age} years old</div>
                        <div className="text-sm text-gray-400 flex items-center">
                          <FaMapMarkerAlt className="mr-1" /> {escort.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          escort.availability 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {escort.availability ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div>Hourly: ${escort.rates?.hourly || 'N/A'}</div>
                        <div>Daily: ${escort.rates?.daily || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(escort.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal('view', escort)}
                            className="text-rose-600 hover:text-rose-900"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/escorts/edit/${escort._id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteEscort(escort._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-900 px-3 sm:px-4 py-3 flex items-center justify-between border-t border-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={!pagination.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  Showing <span className="font-medium">{((pagination.currentPage - 1) * 20) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(pagination.currentPage * 20, pagination.totalCount)}</span> of{' '}
                  <span className="font-medium">{pagination.totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfilesTab = () => (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-white">Agent-Created Escort Profiles</h2>
        <p className="text-sm lg:text-base text-gray-300">Manage profiles created by agents</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-3 lg:p-4 rounded-lg shadow border border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search profiles..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              className="pl-10 pr-4 py-2 border border-gray-600 rounded-lg w-full focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400 text-sm"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-gray-700 text-white text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={() => setFilters({ search: '', status: '', featured: '', page: 1 })}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 border border-gray-600 text-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Profiles List - Cards on mobile, table on desktop */}
      <div className="bg-gray-800 rounded-lg shadow border border-gray-700">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading profiles...</div>
          </div>
        ) : escortProfiles.length === 0 ? (
          <div className="text-center py-8">
            <FaImage className="mx-auto text-4xl text-gray-500 mb-4" />
            <p className="text-gray-400">No escort profiles found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="block lg:hidden">
              <div className="divide-y divide-gray-700">
                {escortProfiles.map((profile) => (
                  <div key={profile._id} className="p-4 hover:bg-gray-700 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {profile.profileImage ? (
                          <img 
                            className="h-12 w-12 rounded-full object-cover" 
                            src={profile.profileImage} 
                            alt={profile.username}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {profile.username?.charAt(0)?.toUpperCase() || 'P'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-white truncate">{profile.username}</h3>
                            <p className="text-xs text-gray-400 truncate">{profile.firstName}</p>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            profile.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {profile.status}
                          </span>
                        </div>
                        <div className="mt-1">
                          <p className="text-xs text-gray-400">{profile.gender}</p>
                          <p className="text-xs text-gray-400 truncate">{profile.country}, {profile.region}</p>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-xs text-gray-400">
                            <p>By: {profile.createdBy?.name || 'Unknown'}</p>
                            <p>Created: {new Date(profile.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleUpdateProfileStatus(profile._id, profile.status === 'active' ? 'inactive' : 'active')}
                              className={`p-1 ${
                                profile.status === 'active' 
                                  ? 'text-red-600 hover:text-red-400' 
                                  : 'text-green-600 hover:text-green-400'
                              }`}
                            >
                              {profile.status === 'active' ? <FaTimes className="text-sm" /> : <FaCheck className="text-sm" />}
                            </button>
                            <button
                              onClick={() => handleDeleteProfile(profile._id)}
                              className="text-red-600 hover:text-red-400 p-1"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Profile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {escortProfiles.map((profile) => (
                    <tr key={profile._id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {profile.profileImage ? (
                              <img 
                                className="h-12 w-12 rounded-full object-cover" 
                                src={profile.profileImage} 
                                alt={profile.username}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                <span className="text-white font-semibold text-lg">
                                  {profile.username?.charAt(0)?.toUpperCase() || 'P'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{profile.username}</div>
                            <div className="text-sm text-gray-400">{profile.firstName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{profile.gender}</div>
                        <div className="text-sm text-gray-400">{profile.country}, {profile.region}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{profile.createdBy?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-400">{profile.createdBy?.agentId || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          profile.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {profile.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateProfileStatus(profile._id, profile.status === 'active' ? 'inactive' : 'active')}
                            className={`${
                              profile.status === 'active' 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {profile.status === 'active' ? <FaTimes /> : <FaCheck />}
                          </button>
                          <button
                            onClick={() => handleDeleteProfile(profile._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderAllProfilesTab = () => (
    <div className="space-y-4 lg:space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white">All Escort Profiles</h2>
          <p className="text-sm lg:text-base text-gray-300">View all escort profiles created by admins and agents</p>
        </div>
        <button
          onClick={() => navigate('/admin/escorts/add')}
          className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-sm lg:text-base w-full sm:w-auto justify-center"
        >
          <FaPlus className="text-sm" /> Add New Escort
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-3 lg:p-4 rounded-lg shadow border border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search profiles..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              className="pl-10 pr-4 py-2 border border-gray-600 rounded-lg w-full focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400 text-sm"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-gray-700 text-white text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-gray-700 text-white text-sm"
          >
            <option value="">All Types</option>
            <option value="admin">Admin Created</option>
            <option value="agent">Agent Created</option>
          </select>
          <button
            onClick={() => setFilters({ search: '', status: '', featured: '', type: '', page: 1 })}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 border border-gray-600 text-sm col-span-1 sm:col-span-2 lg:col-span-1"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* All Profiles List - Cards on mobile, table on desktop */}
      <div className="bg-gray-800 rounded-lg shadow border border-gray-700">
        {loading ? (
          <div className="text-center py-8">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600"></div>
            </div>
          </div>
        ) : allProfiles.length === 0 ? (
          <div className="text-center py-8">
            <FaImage className="mx-auto text-4xl text-gray-500 mb-4" />
            <p className="text-gray-400">No profiles found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="block lg:hidden">
              <div className="divide-y divide-gray-700">
                {allProfiles.map((profile) => (
                  <div key={profile.id} className="p-4 hover:bg-gray-700 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {profile.images && profile.images.length > 0 ? (
                          <img
                            className="h-12 w-12 rounded-full object-cover"
                            src={profile.images[0]}
                            alt={profile.name}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-600 flex items-center justify-center">
                            <FaImage className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-white truncate">{profile.name}</h3>
                            <p className="text-xs text-gray-400 truncate">
                              {profile.username && `@${profile.username}`}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              profile.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : profile.status === 'inactive'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {profile.status}
                            </span>
                            {profile.featured && (
                              <span className="inline-flex px-1 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                <FaStar className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-1">
                          <p className="text-xs text-gray-400">
                            {profile.age && `${profile.age} years old`}
                          </p>
                          <div className="text-xs text-gray-400 flex items-center">
                            <FaMapMarkerAlt className="h-3 w-3 mr-1" />
                            {profile.location}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-xs text-gray-400">
                            <span className={`inline-flex px-2 py-1 rounded-full ${
                              profile.type === 'admin-created' 
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {profile.type === 'admin-created' ? 'Admin' : 'Agent'}
                            </span>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => viewProfile(profile)}
                              className="text-rose-600 hover:text-rose-400 p-1"
                            >
                              <FaEye className="text-sm" />
                            </button>
                            {profile.type === 'admin-created' && (
                              <>
                                <button
                                  onClick={() => editEscort(profile)}
                                  className="text-indigo-600 hover:text-indigo-400 p-1"
                                >
                                  <FaEdit className="text-sm" />
                                </button>
                                <button
                                  onClick={() => deleteEscort(profile.id)}
                                  className="text-red-600 hover:text-red-400 p-1"
                                >
                                  <FaTrash className="text-sm" />
                                </button>
                              </>
                            )}
                            {profile.type === 'agent-created' && (
                              <button
                                onClick={() => toggleProfileStatus(profile.id, profile.status)}
                                className={`inline-flex items-center px-2 py-1 border border-transparent text-xs rounded ${
                                  profile.status === 'active'
                                    ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                    : 'text-green-700 bg-green-100 hover:bg-green-200'
                                }`}
                              >
                                {profile.status === 'active' ? <FaTimes className="mr-1" /> : <FaCheck className="mr-1" />}
                                {profile.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Created by: {profile.createdBy ? 
                            `${profile.createdBy.type}: ${profile.createdBy.id || 'Unknown'}` 
                            : 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Profile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {allProfiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {profile.images && profile.images.length > 0 ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={profile.images[0]}
                                alt={profile.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
                                <FaImage className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {profile.name}
                            </div>
                            <div className="text-sm text-gray-400">
                              {profile.username && `@${profile.username}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">
                          {profile.age && `${profile.age} years old`}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center">
                          <FaMapMarkerAlt className="h-3 w-3 mr-1" />
                          {profile.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          profile.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : profile.status === 'inactive'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {profile.status}
                        </span>
                        {profile.featured && (
                          <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            <FaStar className="h-3 w-3 mr-1" />
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {profile.createdBy ? 
                          `${profile.createdBy.type}: ${profile.createdBy.id || 'Unknown'}` 
                          : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          profile.type === 'admin-created' 
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {profile.type === 'admin-created' ? 'Admin' : 'Agent'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewProfile(profile)}
                            className="text-rose-600 hover:text-rose-900"
                          >
                            <FaEye />
                          </button>
                          {profile.type === 'admin-created' && (
                            <>
                              <button
                                onClick={() => navigate(`/admin/escorts/edit/${profile.id}`)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => deleteEscort(profile.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                          {profile.type === 'agent-created' && (
                            <button
                              onClick={() => toggleProfileStatus(profile.id, profile.status)}
                              className={`inline-flex items-center px-2 py-1 border border-transparent text-xs rounded ${
                                profile.status === 'active'
                                  ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                  : 'text-green-700 bg-green-100 hover:bg-green-200'
                              }`}
                            >
                              {profile.status === 'active' ? <FaTimes className="mr-1" /> : <FaCheck className="mr-1" />}
                              {profile.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-900 px-3 sm:px-4 py-3 flex items-center justify-between border-t border-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={!pagination.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  Showing <span className="font-medium">{((pagination.currentPage - 1) * 20) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(pagination.currentPage * 20, pagination.totalCount)}</span> of{' '}
                  <span className="font-medium">{pagination.totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto bg-gray-900 min-h-screen">
      <div className="mb-4 lg:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 lg:mb-2">Escort Management</h1>
        <p className="text-sm lg:text-base text-gray-300">Manage escort profiles and agent-created profiles</p>
      </div>      {/* Tab Navigation */}
      <div className="bg-gray-800 rounded-lg shadow mb-4 lg:mb-6 overflow-hidden">
        <div className="border-b border-gray-700">
          <nav className="flex flex-col sm:flex-row sm:space-x-4 lg:space-x-8 px-3 sm:px-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors w-full sm:w-auto text-center sm:text-left ${
                activeTab === 'all'
                  ? 'border-rose-500 text-rose-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              <span className="block sm:inline">All Profiles</span>
              <span className="block sm:inline sm:ml-1">({allProfiles.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('escorts')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors w-full sm:w-auto text-center sm:text-left ${
                activeTab === 'escorts'
                  ? 'border-rose-500 text-rose-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              <span className="block sm:inline">Admin Created</span>
              <span className="block sm:inline sm:ml-1">({escorts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('profiles')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors w-full sm:w-auto text-center sm:text-left ${
                activeTab === 'profiles'
                  ? 'border-rose-500 text-rose-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              <span className="block sm:inline">Agent Created</span>
              <span className="block sm:inline sm:ml-1">({escortProfiles.length})</span>
            </button>
          </nav>
        </div>        {/* Tab Content */}
        <div className="p-3 sm:p-4 lg:p-6">
          {activeTab === 'all' && renderAllProfilesTab()}
          {activeTab === 'escorts' && renderEscortsTab()}
          {activeTab === 'profiles' && renderProfilesTab()}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-800 rounded-lg shadow-xl max-w-sm sm:max-w-md lg:max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-700"
            >              <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {modalType === 'create' && 'Add New Escort Profile'}
                  {modalType === 'edit' && 'Edit Escort Profile'}
                  {modalType === 'view' && 'Escort Profile Details'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 min-w-[32px] min-h-[32px]"
                >
                  <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>              {modalType === 'view' ? (
                <div className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
                  {/* Profile Image */}
                  {(selectedEscort?.profileImage || (selectedEscort?.images && selectedEscort.images.length > 0)) && (
                    <div className="flex justify-center">
                      <img
                        src={selectedEscort.profileImage || selectedEscort.images[0]}
                        alt={selectedEscort.firstName || selectedEscort.username || selectedEscort.name}
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-gray-600"
                      />
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300">Username</label>
                      <p className="text-xs sm:text-sm text-white break-words">
                        {selectedEscort?.username || selectedEscort?.name || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300">First Name</label>
                      <p className="text-xs sm:text-sm text-white break-words">
                        {selectedEscort?.firstName || selectedEscort?.name || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300">Gender</label>
                      <p className="text-xs sm:text-sm text-white">
                        {selectedEscort?.gender || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300">Date of Birth</label>
                      <p className="text-xs sm:text-sm text-white">
                        {selectedEscort?.dateOfBirth 
                          ? new Date(selectedEscort.dateOfBirth).toLocaleDateString()
                          : selectedEscort?.age 
                          ? `${selectedEscort.age} years old`
                          : 'Not set'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300">Country</label>
                      <p className="text-xs sm:text-sm text-white break-words">
                        {selectedEscort?.country || (selectedEscort?.location && selectedEscort.location.split(',')[0]) || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300">Region</label>
                      <p className="text-xs sm:text-sm text-white break-words">
                        {selectedEscort?.region || selectedEscort?.location || 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300">Height</label>
                      <p className="text-xs sm:text-sm text-white">
                        {selectedEscort?.height ? `${selectedEscort.height} cm` : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300">Relationship Status</label>
                      <p className="text-xs sm:text-sm text-white">
                        {selectedEscort?.relationshipStatus || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300">Profession</label>
                    <p className="text-xs sm:text-sm text-white break-words">
                      {selectedEscort?.profession || 'Not specified'}
                    </p>
                  </div>

                  {/* Description for admin-created escorts */}
                  {selectedEscort?.description && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300">Description</label>
                      <p className="text-xs sm:text-sm text-white break-words">
                        {selectedEscort.description}
                      </p>
                    </div>
                  )}

                  {/* Services for admin-created escorts */}
                  {selectedEscort?.services && selectedEscort.services.length > 0 && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300">Services</label>
                      <div className="flex flex-wrap gap-1 lg:gap-2 mt-2">
                        {selectedEscort.services.map((service, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rates for admin-created escorts */}
                  {selectedEscort?.rates && (selectedEscort.rates.hourly || selectedEscort.rates.daily) && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300">Rates</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        {selectedEscort.rates.hourly && (
                          <div className="bg-gray-700 p-2 rounded">
                            <span className="text-xs text-gray-400">Hourly:</span>
                            <span className="text-sm text-white ml-2">${selectedEscort.rates.hourly}</span>
                          </div>
                        )}
                        {selectedEscort.rates.daily && (
                          <div className="bg-gray-700 p-2 rounded">
                            <span className="text-xs text-gray-400">Daily:</span>
                            <span className="text-sm text-white ml-2">${selectedEscort.rates.daily}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Interests */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300">Interests</label>
                    <div className="flex flex-wrap gap-1 lg:gap-2 mt-2">
                      {selectedEscort?.interests && selectedEscort.interests.length > 0 ? (
                        selectedEscort.interests.map((interest, index) => (
                          <span key={index} className="px-2 py-1 bg-rose-600 text-white text-xs rounded-full">
                            {interest}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs sm:text-sm text-gray-400">No interests specified</p>
                      )}
                    </div>
                  </div>

                  {/* Images for admin-created escorts */}
                  {selectedEscort?.images && selectedEscort.images.length > 0 && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300">Images ({selectedEscort.images.length})</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                        {selectedEscort.images.slice(0, 6).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Profile ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-gray-600"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Profile Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300">Status</label>
                      <p className="text-xs sm:text-sm text-white">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          (selectedEscort?.status === 'active' || selectedEscort?.availability === true)
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {selectedEscort?.status || (selectedEscort?.availability ? 'Available' : 'Unavailable')}
                        </span>
                        {selectedEscort?.featured && (
                          <span className="ml-2 px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">
                            Featured
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300">Created Date</label>
                      <p className="text-xs sm:text-sm text-white">
                        {selectedEscort?.createdAt 
                          ? new Date(selectedEscort.createdAt).toLocaleDateString()
                          : 'Unknown'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Created By Information */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300">Created By</label>
                    <p className="text-xs sm:text-sm text-white break-words">
                      {selectedEscort?.createdBy ? (
                        typeof selectedEscort.createdBy === 'string' 
                          ? selectedEscort.createdBy 
                          : selectedEscort.createdBy.name || selectedEscort.createdBy.adminId || selectedEscort.createdBy.agentId || 'Unknown'
                      ) : 'System'}
                    </p>
                  </div>
                </div>
              ) : (                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Username *</label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400"
                        placeholder="Enter unique username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                      <select
                        required
                        value={formData.gender}
                        onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter country"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Region/State</label>
                      <input
                        type="text"
                        value={formData.region}
                        onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter region or state"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                      <input
                        type="text"
                        value={formData.profession}
                        onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter profession"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                      <input
                        type="number"
                        value={formData.height}
                        onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Height in centimeters"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Status</label>
                      <input
                        type="text"
                        value={formData.relationshipStatus}
                        onChange={(e) => setFormData(prev => ({ ...prev, relationshipStatus: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Single, Married, etc."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image URL</label>
                    <input
                      type="url"
                      value={formData.profileImage}
                      onChange={(e) => setFormData(prev => ({ ...prev, profileImage: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interests (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.interests.join(', ')}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        interests: e.target.value.split(',').map(i => i.trim()).filter(i => i) 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Music, Travel, Sports, etc."
                    />
                  </div>                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 border border-gray-600"
                    >
                      Cancel
                    </button><button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                    >
                      {modalType === 'create' ? 'Create Escort' : 'Update Escort'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EscortManagement;
