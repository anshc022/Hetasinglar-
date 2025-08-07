import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentAuth } from '../../services/agentApi';
import imageCompression from 'browser-image-compression';
import { 
  FaUser, 
  FaUpload, 
  FaTrash, 
  FaArrowLeft, 
  FaSave,
  FaImage,
  FaCheckCircle,
  FaExclamationCircle
} from 'react-icons/fa';

const AddEscortProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    gender: 'female',
    profileImage: '',
    country: '',
    region: '',
    relationshipStatus: 'single',
    interests: [],
    profession: '',
    height: '',
    dateOfBirth: ''
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = () => {
    const errors = {};
    
    // Required fields
    if (!formData.username.trim()) errors.username = 'Username is required';
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!formData.country.trim()) errors.country = 'Country is required';
    
    // Username validation
    if (formData.username && formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    // Age validation
    if (formData.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(formData.dateOfBirth);
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        errors.dateOfBirth = 'Must be at least 18 years old';
      }
    }
    
    // Height validation
    if (formData.height && (formData.height < 100 || formData.height > 250)) {
      errors.height = 'Height must be between 100-250 cm';
    }
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage('');

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fix the errors below');
      setLoading(false);
      return;
    }

    try {
      setValidationErrors({});
      await agentAuth.createEscortProfile({
        ...formData,
        interests: formData.interests.filter(i => i.trim()),
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        height: parseInt(formData.height) || null
      });

      setSuccessMessage('Profile created successfully!');
      setTimeout(() => {
        navigate('/agent/dashboard', { 
          state: { message: 'Escort profile created successfully' }
        });
      }, 2000);
    } catch (error) {
      setError(error.message || 'Failed to create escort profile');
      if (error.message.includes('Not authorized')) {
        setTimeout(() => {
          navigate('/agent/dashboard');
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Compression options
      const options = {
        maxSizeMB: 0.5, // Compress to max 0.5MB
        maxWidthOrHeight: 1200, // Max dimension
        useWebWorker: true,
        onProgress: (progress) => {
          setUploadProgress(Math.round(progress));
        }
      };

      // Compress the image
      const compressedFile = await imageCompression(file, options);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        setFormData(prev => ({ ...prev, profileImage: base64String }));
        setImagePreview(base64String);
        setIsUploading(false);
        setUploadProgress(0);
      };
      reader.onerror = () => {
        setError('Failed to process image');
        setIsUploading(false);
        setUploadProgress(0);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
      setError('Failed to compress image. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, profileImage: '' }));
    setImagePreview(null);
    setUploadProgress(0);
    // Reset file input
    const fileInput = document.getElementById('profileImage');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-700">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Add New Escort Profile</h1>
          <p className="text-gray-400">Create a comprehensive profile for your escort</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                name="username"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                name="firstName"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                name="gender"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white">Profile Image</h2>
              </div>
              
              <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  {/* Image Preview */}
                  <div className="flex-shrink-0">
                    <div className="relative group">
                      <div className="w-40 h-40 rounded-2xl bg-gray-700 overflow-hidden border-2 border-gray-600 shadow-lg">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Profile preview"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Upload Controls */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Upload Profile Image
                      </label>
                      
                      {/* Upload Progress */}
                      {isUploading && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                            <span>Compressing image...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl disabled:opacity-50">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          {isUploading ? 'Processing...' : 'Choose Image'}
                          <input
                            type="file"
                            id="profileImage"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                            className="hidden"
                          />
                        </label>
                        {imagePreview && (
                          <button
                            type="button"
                            onClick={removeImage}
                            disabled={isUploading}
                            className="flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                          >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
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
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Country</label>
              <input
                type="text"
                name="country"
                required
                className="mt-1 block w-full px-4 py-3 bg-gray-600 text-white rounded-lg border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                value={formData.country}
                onChange={handleChange}
                placeholder="Enter country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Region</label>
              <input
                type="text"
                name="region"
                className="mt-1 block w-full px-4 py-3 bg-gray-600 text-white rounded-lg border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                value={formData.region}
                onChange={handleChange}
                placeholder="Enter region/state"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Relationship Status</label>
              <input
                type="text"
                name="relationshipStatus"
                className="mt-1 block w-full px-4 py-3 bg-gray-600 text-white rounded-lg border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                value={formData.relationshipStatus}
                onChange={handleChange}
                placeholder="Enter relationship status"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Profession</label>
              <input
                type="text"
                name="profession"
                className="mt-1 block w-full px-4 py-3 bg-gray-600 text-white rounded-lg border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                value={formData.profession}
                onChange={handleChange}
                placeholder="Enter profession"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Height (cm)</label>
              <input
                type="number"
                name="height"
                className="mt-1 block w-full px-4 py-3 bg-gray-600 text-white rounded-lg border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                value={formData.height}
                onChange={handleChange}
                placeholder="Enter height in cm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                required
                className="mt-1 block w-full px-4 py-3 bg-gray-600 text-white rounded-lg border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Interests (comma-separated)</label>
            <input
              type="text"
              name="interests"
              className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              value={formData.interests.join(', ')}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                interests: e.target.value.split(',').map(i => i.trim())
              }))}
              placeholder="e.g., Dancing, Reading, Traveling"
            />
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/agent/escorts')}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isUploading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              {loading ? 'Creating...' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEscortProfile;
