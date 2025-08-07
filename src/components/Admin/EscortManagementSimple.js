import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter, FaImage, FaMapMarkerAlt, FaStar, FaCheck, FaTimes } from 'react-icons/fa';

const EscortManagement = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [escorts, setEscorts] = useState([]);
  const [escortProfiles, setEscortProfiles] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedEscort, setSelectedEscort] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    featured: '',
    type: '',
    page: 1
  });
  const [pagination, setPagination] = useState({});
  const [formData, setFormData] = useState({
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
  }, [activeTab, filters]);

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

      const response = await axios.get(`/api/admin/all-escort-profiles?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });

      setAllProfiles(response.data.profiles || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching all profiles:', error);
      alert('Error fetching profiles');
    } finally {
      setLoading(false);
    }
  };

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

      const response = await axios.get(`/api/admin/escorts?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });

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

      const response = await axios.get(`/api/admin/escort-profiles?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });

      setEscortProfiles(response.data.profiles || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching escort profiles:', error);
      alert('Error fetching escort profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEscort = async () => {
    try {
      const response = await axios.post('/api/admin/escorts', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });

      alert('Escort profile created successfully');
      setShowModal(false);
      resetForm();
      fetchEscorts();
      fetchAllProfiles();
    } catch (error) {
      console.error('Error creating escort:', error);
      alert(error.response?.data?.error || 'Error creating escort profile');
    }
  };

  const handleUpdateEscort = async () => {
    try {
      const response = await axios.put(`/api/admin/escorts/${selectedEscort.id}`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });

      alert('Escort profile updated successfully');
      setShowModal(false);
      resetForm();
      fetchEscorts();
      fetchAllProfiles();
    } catch (error) {
      console.error('Error updating escort:', error);
      alert(error.response?.data?.error || 'Error updating escort profile');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalType === 'create') {
      handleCreateEscort();
    } else if (modalType === 'edit') {
      handleUpdateEscort();
    }
  };

  const resetForm = () => {
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

  const openModal = (type, escort = null) => {
    setModalType(type);
    setSelectedEscort(escort);
    
    if (type === 'edit' && escort) {
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
    } else if (type === 'create') {
      resetForm();
    }
    
    setShowModal(true);
  };

  const deleteEscort = async (escortId) => {
    if (!window.confirm('Are you sure you want to delete this escort profile?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/escorts/${escortId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });

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
      await axios.patch(`/api/admin/escort-profiles/${profileId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );

      alert(`Profile status updated to ${newStatus}`);
      fetchAllProfiles();
      fetchEscortProfiles();
    } catch (error) {
      console.error('Error updating profile status:', error);
      alert('Error updating profile status');
    }
  };

  const renderAllProfilesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Escort Profiles</h2>
          <p className="text-gray-600">View all escort profiles created by admins and agents</p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FaPlus /> Add New Escort
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search profiles..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="admin">Admin Created</option>
            <option value="agent">Agent Created</option>
          </select>
          <button
            onClick={() => setFilters({ search: '', status: '', featured: '', type: '', page: 1 })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profile
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                </td>
              </tr>
            ) : allProfiles.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No profiles found
                </td>
              </tr>
            ) : (
              allProfiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50">
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
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <FaImage className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {profile.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {profile.username && `@${profile.username}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {profile.age && `${profile.age} years old`}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {profile.createdBy?.id ? 
                      `${profile.createdBy.type}: ${profile.createdBy.id}` 
                      : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      profile.type === 'admin-created' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {profile.type === 'admin-created' ? 'Admin' : 'Agent'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal('view', profile)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FaEye />
                      </button>
                      {profile.type === 'admin-created' && (
                        <>
                          <button
                            onClick={() => openModal('edit', profile)}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Escort Management</h1>
        <p className="text-gray-600">Manage escort profiles and agent-created profiles</p>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Profiles ({allProfiles.length})
            </button>
            <button
              onClick={() => setActiveTab('escorts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'escorts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Admin Created ({escorts.length})
            </button>
            <button
              onClick={() => setActiveTab('profiles')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profiles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Agent Created ({escortProfiles.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'all' && renderAllProfilesTab()}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-medium">
                  {modalType === 'create' ? 'Add New Escort Profile' : 
                   modalType === 'edit' ? 'Edit Escort Profile' : 'View Escort Profile'}
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <FaTimes />
                </button>
              </div>

              {modalType === 'view' ? (
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Username</label>
                      <p className="text-sm text-gray-900">{selectedEscort?.username || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <p className="text-sm text-gray-900">{selectedEscort?.firstName || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <p className="text-sm text-gray-900">{selectedEscort?.gender || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Country</label>
                      <p className="text-sm text-gray-900">{selectedEscort?.country || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter unique username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  </div>

                  <div>
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
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
