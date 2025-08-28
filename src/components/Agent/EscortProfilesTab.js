import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentAuth } from '../../services/agentApi';
import imageCompression from 'browser-image-compression';
import config from '../../config/environment';
import { 
  FaEye, 
  FaImages, 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaUser, 
  FaVenus,
  FaMars,
  FaGenderless,
  FaEdit,
  FaTimes,
  FaSave,
  FaUpload,
  FaTrash
} from 'react-icons/fa';

const EscortProfilesTab = ({ 
  escorts, 
  onAddNew, 
  setSelectedEscortForImages, 
  searchTerm, 
  setSearchTerm,
  onUpdateProfile,
  onDeleteProfile
}) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);

  // Normalize image src (supports base64, absolute URLs, or relative paths)
  const getImageSrc = (src) => {
    if (!src) return null;
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) return src;
    const base = (config.API_URL || '').replace(/\/$/, '').replace('/api', '');
    const path = src.startsWith('/') ? src : `/${src}`;
    return `${base}${path}`;
  };

  const filteredEscorts = escorts.filter(escort => {
    const matchesSearch = !searchTerm || 
      escort.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escort.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escort.country?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || escort.gender === filter;
    
    return matchesSearch && matchesFilter;
  });

  const sortedEscorts = filteredEscorts.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'name':
        return (a.firstName || '').localeCompare(b.firstName || '');
      default:
        return 0;
    }
  });

  const getGenderIcon = (gender) => {
    switch (gender) {
      case 'female':
        return <FaVenus className="text-pink-400" />;
      case 'male':
        return <FaMars className="text-blue-400" />;
      default:
        return <FaGenderless className="text-gray-400" />;
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset states
    setIsImageUploading(true);
    setImageUploadProgress(0);

    try {
      // File validation
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('File is too large. Max size is 10MB.');
      }

      // Compression options
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: false, // Disable web worker for reliability
        onProgress: (progress) => setImageUploadProgress(Math.round(progress)),
        initialQuality: 0.7,
      };

      console.log('Attempting to compress image...', file.name);
      const compressedFile = await imageCompression(file, options);
      console.log('Compression successful:', compressedFile);

      // Validate compressed file
      if (!(compressedFile instanceof Blob)) {
        console.error('Invalid compression result:', compressedFile);
        throw new Error('Failed to process image after compression');
      }

      // Convert to base64 using Promise
      const base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(new Error('Failed to read the processed image'));
        };
        reader.readAsDataURL(compressedFile);
      });

      // Update form state
      setImagePreview(base64String);
      setEditForm(prev => ({
        ...prev,
        profileImage: base64String
      }));

    } catch (error) {
      console.error('Image processing error:', error);
      alert(error.message || 'Failed to process image. Please try again.');
      
      // Reset file input to allow retry
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
    } finally {
      setIsImageUploading(false);
      setImageUploadProgress(0);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setEditForm({
      ...editForm,
      profileImage: null
    });
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="space-y-2">
      {/* Minimal Header Section */}
      <div className="bg-gray-800 rounded p-3 border border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-medium text-white">Escort Profiles</h2>
            <p className="text-xs text-gray-400">
              Manage your {escorts.length} escort profiles and their conversations
            </p>
          </div>
          
          <button
            onClick={onAddNew}
            className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium"
          >
            <FaPlus className="mr-1 text-xs" />
            Add New Profile
          </button>
        </div>
      </div>

      {/* Minimal Filters and Search */}
      <div className="bg-gray-800 rounded p-3 border border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search profiles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Gender Filter */}
          <div className="flex items-center space-x-1">
            <FaFilter className="text-gray-400 text-xs" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Genders</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
          
          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>
        
        {/* Minimal Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-gray-700 rounded p-2 text-center">
            <div className="text-sm font-semibold text-blue-400">{escorts.length}</div>
            <div className="text-xs text-gray-400">Total Profiles</div>
          </div>
          <div className="bg-gray-700 rounded p-2 text-center">
            <div className="text-sm font-semibold text-pink-400">
              {escorts.filter(e => e.gender === 'female').length}
            </div>
            <div className="text-xs text-gray-400">Female</div>
          </div>
          <div className="bg-gray-700 rounded p-2 text-center">
            <div className="text-sm font-semibold text-blue-400">
              {escorts.filter(e => e.gender === 'male').length}
            </div>
            <div className="text-xs text-gray-400">Male</div>
          </div>
          <div className="bg-gray-700 rounded p-2 text-center">
            <div className="text-sm font-semibold text-green-400">
              {escorts.filter(e => e.status === 'active').length}
            </div>
            <div className="text-xs text-gray-400">Active</div>
          </div>
        </div>
      </div>

      {/* Responsive Escort Table */}
      {sortedEscorts.length > 0 ? (
        <div className="bg-gray-800 rounded border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-2 py-2 hidden sm:table-cell">Profile</th>
                  <th className="px-2 py-2">Name/Info</th>
                  <th className="px-2 py-2 hidden md:table-cell">Status</th>
                  <th className="px-2 py-2 hidden xl:table-cell">Interests</th>
                  <th className="px-2 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 text-gray-300 text-xs">
                {sortedEscorts.map((profile) => (
                  <tr key={profile._id} className="hover:bg-gray-700/30 transition-colors">
                    {/* Profile Image - Hidden on mobile */}
                    <td className="px-2 py-2 hidden sm:table-cell">
                      <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
            {(profile.profileImage || profile.profilePicture || profile.imageUrl) ? (
                          <img
              src={getImageSrc(profile.profileImage || profile.profilePicture || profile.imageUrl)}
                            alt={profile.firstName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaUser className="text-gray-500 text-xs" />
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* Name and Info - Always visible */}
                    <td className="px-2 py-2">
                      <div className="flex items-center space-x-2 sm:space-x-0 sm:block">
                        {/* Mobile profile image */}
                        <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 sm:hidden">
              {(profile.profileImage || profile.profilePicture || profile.imageUrl) ? (
                            <img
                src={getImageSrc(profile.profileImage || profile.profilePicture || profile.imageUrl)}
                              alt={profile.firstName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FaUser className="text-gray-500 text-xs" />
                            </div>
                          )}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="text-white font-medium truncate text-xs">{profile.firstName}</div>
                          <div className="text-xs text-gray-400 truncate">@{profile.username}</div>
                          {/* Mobile-only additional info */}
                          <div className="sm:hidden text-xs text-gray-400 mt-0.5">
                            <div className="flex items-center space-x-1">
                              {getGenderIcon(profile.gender)}
                              <span>{profile.gender || 'Unknown'}</span>
                              {profile.dateOfBirth && (
                                <>
                                  <span>•</span>
                                  <span>{calculateAge(profile.dateOfBirth)}y</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Status - Hidden on mobile */}
                    <td className="px-2 py-2 hidden md:table-cell">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        profile.status === 'active' 
                          ? 'bg-green-900 text-green-200' 
                          : profile.status === 'pending'
                            ? 'bg-yellow-900 text-yellow-200'
                            : 'bg-gray-900 text-gray-200'
                      }`}>
                        {profile.status || 'Active'}
                      </span>
                    </td>
                    
                    {/* Interests - Hidden on mobile, tablet, and some desktop */}
                    <td className="px-2 py-2 hidden xl:table-cell">
                      {profile.interests && profile.interests.length > 0 ? (
                        <div className="flex flex-wrap gap-0.5 max-w-24">
                          {profile.interests.slice(0, 1).map((interest, index) => (
                            <span
                              key={index}
                              className="px-1.5 py-0.5 bg-blue-900 text-blue-200 text-xs rounded truncate"
                              title={interest}
                            >
                              {interest}
                            </span>
                          ))}
                          {profile.interests.length > 1 && (
                            <span className="px-1.5 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                              +{profile.interests.length - 1}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">None</span>
                      )}
                    </td>
                    
                    {/* Actions - Always visible */}
                    <td className="px-2 py-2">
                      <div className="flex justify-center space-x-1">
                        <button
                          onClick={() => navigate(`/agent/live-queue/${profile._id}`)}
                          className="px-1.5 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs font-medium flex items-center space-x-0.5"
                          title="View Queue"
                        >
                          <FaEye className="text-xs" />
                          <span className="hidden sm:inline">Queue</span>
                        </button>
                        <button
                          onClick={() => setSelectedEscortForImages(profile)}
                          className="px-1.5 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-xs font-medium flex items-center space-x-0.5"
                          title="Manage Images"
                        >
                          <FaImages className="text-xs" />
                          <span className="hidden sm:inline">Images</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProfile(profile);
                            setEditForm(profile);
                            setImagePreview(profile.profileImage || null);
                            setIsEditMode(false);
                          }}
                          className="px-1.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium flex items-center space-x-0.5"
                          title="Edit Profile"
                        >
                          <FaEdit className="text-xs" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={async () => {
                            const confirmDelete = window.confirm('Delete this escort profile? This will deactivate it and hide from lists.');
                            if (!confirmDelete) return;
                            try {
                              await agentAuth.deleteEscortProfile(profile._id);
                              if (onDeleteProfile) onDeleteProfile(profile._id);
                            } catch (err) {
                              console.error('Delete escort failed', err);
                              alert(err?.message || 'Failed to delete profile');
                            }
                          }}
                          className="px-1.5 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs font-medium flex items-center space-x-0.5"
                          title="Delete Profile"
                        >
                          <FaTrash className="text-xs" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <div className="max-w-sm mx-auto">
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaUser className="text-xl text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchTerm || filter !== 'all' ? 'No matching profiles' : 'No escort profiles found'}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first escort profile to start managing conversations'
              }
            </p>
            
            {searchTerm || filter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={onAddNew}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Create Your First Profile
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Edit Profile Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-700">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {isEditMode ? 'Edit Profile' : 'Profile Details'}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {isEditMode ? 'Update escort profile information' : 'View detailed profile information'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedProfile(null);
                    setIsEditMode(false);
                    setImagePreview(null);
                  }}
                  className="p-3 hover:bg-gray-700 rounded-full transition-colors group"
                >
                  <FaTimes className="text-gray-400 group-hover:text-white text-lg" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Image Section */}
                <div className="md:col-span-2 space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <FaUser className="text-white text-sm" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Profile Image</h3>
                  </div>
                  
                  <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                      {/* Current/Preview Image */}
                      <div className="flex-shrink-0">
                        <div className="relative group">
                          <div className="w-40 h-40 rounded-2xl bg-gray-700 overflow-hidden border-2 border-gray-600 shadow-lg">
                            {(imagePreview || selectedProfile.profileImage) ? (
                              <img
                                src={imagePreview || selectedProfile.profileImage}
                                alt="Profile"
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FaUser className="text-5xl text-gray-500" />
                              </div>
                            )}
                          </div>
                          {isEditMode && (
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-2xl transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium">
                                Click to change
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Upload Controls */}
                      {isEditMode && (
                        <div className="flex-1 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                              Upload New Image
                            </label>
                            
                            {/* Upload Progress */}
                            {isImageUploading && (
                              <div className="mb-4">
                                <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                                  <span>Compressing image...</span>
                                  <span>{imageUploadProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-600 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${imageUploadProgress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex flex-wrap gap-3">
                              <label className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl disabled:opacity-50">
                                <FaUpload className="mr-2" />
                                {isImageUploading ? 'Processing...' : 'Choose Image'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  disabled={isImageUploading}
                                  className="hidden"
                                />
                              </label>
                              {(imagePreview || selectedProfile.profileImage) && (
                                <button
                                  onClick={removeImage}
                                  disabled={isImageUploading}
                                  className="flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                                >
                                  <FaTrash className="mr-2" />
                                  Remove
                                </button>
                              )}
                            </div>
                            
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-4">
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Auto-compression:</strong> Images are automatically compressed to optimize file size while maintaining quality. 
                                Supported formats: JPG, PNG, GIF, WebP
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <FaUser className="text-white text-sm" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Basic Information</h3>
                  </div>
                  
                  <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        First Name
                      </label>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editForm.firstName || ''}
                          onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-500 transition-all duration-200"
                          placeholder="Enter first name"
                        />
                      ) : (
                        <p className="text-white text-lg">{selectedProfile.firstName || 'N/A'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Username
                      </label>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editForm.username || ''}
                          onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-500 transition-all duration-200"
                          placeholder="Enter username"
                        />
                      ) : (
                        <p className="text-white text-lg">@{selectedProfile.username || 'N/A'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Gender
                      </label>
                      {isEditMode ? (
                        <select
                          value={editForm.gender || ''}
                          onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-500 transition-all duration-200"
                        >
                          <option value="">Select Gender</option>
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <div className="flex items-center space-x-2">
                          {getGenderIcon(selectedProfile.gender)}
                          <span className="text-white capitalize text-lg">{selectedProfile.gender || 'N/A'}</span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Date of Birth
                      </label>
                      {isEditMode ? (
                        <input
                          type="date"
                          value={editForm.dateOfBirth || ''}
                          onChange={(e) => setEditForm({...editForm, dateOfBirth: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-500 transition-all duration-200"
                        />
                      ) : (
                        <p className="text-white text-lg">
                          {selectedProfile.dateOfBirth ? 
                            `${selectedProfile.dateOfBirth} (${calculateAge(selectedProfile.dateOfBirth)} years old)` : 
                            'N/A'
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Location & Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                    Location & Contact
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Country
                    </label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editForm.country || ''}
                        onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-white">{selectedProfile.country || 'N/A'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Region/State
                    </label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editForm.region || ''}
                        onChange={(e) => setEditForm({...editForm, region: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-white">{selectedProfile.region || 'N/A'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Status
                    </label>
                    {isEditMode ? (
                      <select
                        value={editForm.status || 'active'}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        selectedProfile.status === 'active' 
                          ? 'bg-green-900 text-green-200' 
                          : 'bg-gray-900 text-gray-200'
                      }`}>
                        {selectedProfile.status || 'Active'}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Interests & Bio */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                    Interests & Bio
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Interests
                    </label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editForm.interests ? editForm.interests.join(', ') : ''}
                        onChange={(e) => setEditForm({...editForm, interests: e.target.value.split(', ').filter(i => i.trim())})}
                        placeholder="Enter interests separated by commas"
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedProfile.interests && selectedProfile.interests.length > 0 ? (
                          selectedProfile.interests.map((interest, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-900 text-blue-200 text-sm rounded"
                            >
                              {interest}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">No interests added</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Bio
                    </label>
                    {isEditMode ? (
                      <textarea
                        value={editForm.bio || ''}
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                        rows={4}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter bio description..."
                      />
                    ) : (
                      <p className="text-white">{selectedProfile.bio || 'No bio available'}</p>
                    )}
                  </div>
                </div>

                {/* Additional Details (from model) */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                    Additional Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Relationship Status
                      </label>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editForm.relationshipStatus || ''}
                          onChange={(e) => setEditForm({...editForm, relationshipStatus: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Single, In a relationship"
                        />
                      ) : (
                        <p className="text-white">{selectedProfile.relationshipStatus || 'N/A'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Profession
                      </label>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editForm.profession || ''}
                          onChange={(e) => setEditForm({...editForm, profession: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter profession"
                        />
                      ) : (
                        <p className="text-white">{selectedProfile.profession || 'N/A'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Height (cm)
                      </label>
                      {isEditMode ? (
                        <input
                          type="number"
                          value={editForm.height || ''}
                          onChange={(e) => setEditForm({...editForm, height: e.target.valueAsNumber || ''})}
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter height"
                        />
                      ) : (
                        <p className="text-white">{selectedProfile.height ? `${selectedProfile.height} cm` : 'N/A'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Serial Number
                      </label>
                      <p className="text-white">{selectedProfile.serialNumber || 'N/A'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Mass Mail Active
                      </label>
                      {isEditMode ? (
                        <div className="flex items-center space-x-2">
                          <input
                            id="massMailActive"
                            type="checkbox"
                            checked={!!editForm.massMailActive}
                            onChange={(e) => setEditForm({...editForm, massMailActive: e.target.checked})}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="massMailActive" className="text-sm text-gray-300">Enable</label>
                        </div>
                      ) : (
                        <span className={`px-2 py-1 rounded text-sm font-medium ${selectedProfile.massMailActive ? 'bg-green-900 text-green-200' : 'bg-gray-900 text-gray-200'}`}>
                          {selectedProfile.massMailActive ? 'Enabled' : 'Disabled'}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Created At
                      </label>
                      <p className="text-white">{selectedProfile.createdAt ? new Date(selectedProfile.createdAt).toLocaleString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
                {isEditMode ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditMode(false);
                        setImagePreview(selectedProfile.profileImage || null);
                        setEditForm(selectedProfile);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const updatedProfileData = {
                            ...editForm,
                            profileImage: imagePreview || editForm.profileImage
                          };
                          const updatedProfile = await agentAuth.updateEscortProfile(
                            selectedProfile._id,
                            updatedProfileData
                          );
                          if (onUpdateProfile) onUpdateProfile(updatedProfile);
                          setIsEditMode(false);
                          setSelectedProfile(null);
                          setImagePreview(null);
                        } catch (error) {
                          console.error('Error updating profile:', error);
                          alert('Failed to update profile. Please try again.');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <FaSave />
                      <span>Save Changes</span>
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <FaEdit />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={async () => {
                        const confirmDelete = window.confirm('Delete this escort profile? This will deactivate it and hide from lists.');
                        if (!confirmDelete) return;
                        try {
                          await agentAuth.deleteEscortProfile(selectedProfile._id);
                          if (onDeleteProfile) onDeleteProfile(selectedProfile._id);
                          setSelectedProfile(null);
                          setIsEditMode(false);
                        } catch (err) {
                          console.error('Delete escort failed', err);
                          alert(err?.message || 'Failed to delete profile');
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <FaTrash />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscortProfilesTab;