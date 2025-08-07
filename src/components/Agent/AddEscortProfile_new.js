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
  const [successMessage, setSuccessMessage] = useState('');
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
    setUploadProgress(0);
    setError(null);

    try {
      // Compression options
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/agent/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FaArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">Add New Escort Profile</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
            <FaCheckCircle className="text-green-600 w-5 h-5" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
            <FaExclamationCircle className="text-red-600 w-5 h-5" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Profile Image Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <FaImage className="w-5 h-5 text-blue-600" />
                <span>Profile Photo</span>
              </h2>
              
              <div className="flex items-start space-x-6">
                {/* Image Preview */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-200">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaUser className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Upload Controls */}
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload a profile photo
                    </label>
                    <p className="text-sm text-gray-500 mb-3">
                      JPG, PNG or GIF. Max file size 10MB. Images will be automatically optimized.
                    </p>
                  </div>
                  
                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Processing image...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <label className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <FaUpload className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Choose file</span>
                      <input
                        type="file"
                        id="profileImage"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                  />
                  {validationErrors.username && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                  />
                  {validationErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.dateOfBirth ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                  {validationErrors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.dateOfBirth}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Location</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="country"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.country ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Enter country"
                  />
                  {validationErrors.country && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.country}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region/State
                  </label>
                  <input
                    type="text"
                    name="region"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={formData.region}
                    onChange={handleChange}
                    placeholder="Enter region or state"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Additional Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship Status
                  </label>
                  <select
                    name="relationshipStatus"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={formData.relationshipStatus}
                    onChange={handleChange}
                  >
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profession
                  </label>
                  <input
                    type="text"
                    name="profession"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={formData.profession}
                    onChange={handleChange}
                    placeholder="Enter profession"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    min="100"
                    max="250"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.height ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="Enter height"
                  />
                  {validationErrors.height && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.height}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interests
                  </label>
                  <input
                    type="text"
                    name="interests"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={formData.interests.join(', ')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      interests: e.target.value.split(',').map(i => i.trim())
                    }))}
                    placeholder="e.g., Dancing, Reading, Traveling"
                  />
                  <p className="mt-1 text-sm text-gray-500">Separate interests with commas</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/agent/dashboard')}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || isUploading}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaSave className="w-4 h-4" />
                <span>{loading ? 'Creating...' : 'Create Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEscortProfile;
