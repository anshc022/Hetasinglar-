import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminAuth } from '../../services/adminApi';
import imageCompression from 'browser-image-compression';
import MultipleImageDragDrop from '../shared/MultipleImageDragDrop';
import { 
  FaUser, 
  FaUpload, 
  FaTrash, 
  FaArrowLeft, 
  FaSave,
  FaImage,
  FaCheckCircle,
  FaExclamationCircle,
  FaGlobe,
  FaMapMarkerAlt,
  FaEdit,
  FaUserShield
} from 'react-icons/fa';
import { 
  COUNTRIES, 
  getStatesForCountry, 
  countryHasStates, 
  getStateLabelForCountry 
} from '../../utils/statesData';

const AdminAddUpdateEscort = () => {
  const navigate = useNavigate();
  const { escortId } = useParams();
  const isEditMode = Boolean(escortId);
  
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    email: '',
    phone: '',
    gender: 'female',
    profileImage: '',
    country: 'SE',
    region: '',
    relationshipStatus: '',
    interests: [],
    profession: '',
    height: '',
    dateOfBirth: '',
    isActive: true,
    isVerified: false,
    hourlyRate: '',
    description: '',
    languages: [],
    services: [],
    availability: 'available'
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [profileImages, setProfileImages] = useState([]); // New state for multiple images
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [availableStates, setAvailableStates] = useState([]);
  const [stateLabel, setStateLabel] = useState('Region/State');
  const [relationshipStatuses, setRelationshipStatuses] = useState([]);
  const [swedishRegions, setSwedishRegions] = useState([]);

  // Fetch relationship statuses and Swedish regions on mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        
        // Fetch relationship statuses
        const relationshipResponse = await fetch('/api/admin/relationship-statuses', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (relationshipResponse.ok) {
          const relationshipData = await relationshipResponse.json();
          setRelationshipStatuses(relationshipData.statuses || []);
        }

        // Fetch Swedish regions
        const regionsResponse = await fetch('/api/admin/swedish-regions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (regionsResponse.ok) {
          const regionsData = await regionsResponse.json();
          setSwedishRegions(regionsData.regions || []);
        }
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

  // Load existing escort profile if in edit mode
  useEffect(() => {
    if (isEditMode && escortId) {
      loadEscortProfile();
    }
  }, [isEditMode, escortId]);

  const loadEscortProfile = async () => {
    setLoadingProfile(true);
    setError(null);
    
    try {
      const profile = await adminAuth.getEscortProfile(escortId);
      setFormData({
        username: profile.username || '',
        firstName: profile.firstName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        gender: profile.gender || 'female',
        profileImage: profile.profileImage || '',
        country: profile.countryCode || profile.country || '',
        region: profile.regionCode || profile.region || '',
        relationshipStatus: profile.relationshipStatus || 'single',
        interests: profile.interests || [],
        profession: profile.profession || '',
        height: profile.height || '',
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
        isActive: profile.isActive !== undefined ? profile.isActive : true,
        isVerified: profile.isVerified !== undefined ? profile.isVerified : false,
        hourlyRate: profile.hourlyRate || '',
        description: profile.description || '',
        languages: profile.languages || [],
        services: profile.services || [],
        availability: profile.availability || 'available'
      });
      
      if (profile.profileImage) {
        setImagePreview(profile.profileImage);
      }
    } catch (err) {
      setError(`Failed to load escort profile: ${err.message}`);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Update available states when country changes
  useEffect(() => {
    if (formData.country) {
      if (formData.country === 'SE' || formData.country === 'Sweden') {
        // Use Swedish regions for Sweden
        setAvailableStates(swedishRegions.map(region => ({ value: region, label: region })));
        setStateLabel('Län (Region)');
      } else {
        // Use existing logic for other countries
        const states = getStatesForCountry(formData.country);
        setAvailableStates(states);
        setStateLabel(getStateLabelForCountry(formData.country));
      }
      
      // Clear region if country changed and previous region is not valid for new country
      if (formData.region) {
        const isSweden = formData.country === 'SE' || formData.country === 'Sweden';
        const validRegion = isSweden 
          ? swedishRegions.includes(formData.region)
          : (countryHasStates(formData.country) && 
             getStatesForCountry(formData.country).some(state => state.value === formData.region || state.label === formData.region));
        
        if (!validRegion) {
          setFormData(prev => ({ ...prev, region: '' }));
        }
      }
    } else {
      setAvailableStates([]);
      setStateLabel('Region/State');
    }
  }, [formData.country, swedishRegions]);

  // Helper function to get readable names from codes
  const getReadableLocationNames = () => {
    const country = COUNTRIES.find(c => c.value === formData.country);
    const countryName = country?.label || formData.country;
    
    let regionName = formData.region;
    if (formData.region && countryHasStates(formData.country)) {
      const state = availableStates.find(s => s.value === formData.region);
      regionName = state?.label || formData.region;
    }
    
    return { countryName, regionName };
  };

  const validateForm = () => {
    const errors = {};
    
    // Required fields
    if (!formData.username.trim()) errors.username = 'Username is required';
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!formData.country.trim()) errors.country = 'Country is required';
    if (!formData.region.trim()) errors.region = 'Län (Region) is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
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
    
    // Hourly rate validation
    if (formData.hourlyRate && formData.hourlyRate < 0) {
      errors.hourlyRate = 'Hourly rate must be a positive number';
    }
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image size must be less than 10MB');
      }

      // Compression options
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        fileType: 'image/jpeg',
        onProgress: (progress) => {
          setUploadProgress(Math.round(progress));
        }
      };

      // Compress image
      const compressedFile = await imageCompression(file, options);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData(prev => ({ ...prev, profileImage: base64String }));
        setImagePreview(base64String);
        setIsUploading(false);
        setUploadProgress(100);
      };
      reader.readAsDataURL(compressedFile);

    } catch (err) {
      setError(`Image upload failed: ${err.message}`);
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

  // Handler for multiple images
  const handleMultipleImagesChange = (images) => {
    setProfileImages(images);
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
      
      const { countryName, regionName } = getReadableLocationNames();
      
      const profileData = {
        ...formData,
        country: countryName,
        region: regionName,
        countryCode: formData.country,
        regionCode: formData.region,
        interests: Array.isArray(formData.interests) ? formData.interests : formData.interests.split(',').map(i => i.trim()),
        languages: Array.isArray(formData.languages) ? formData.languages : formData.languages.split(',').map(l => l.trim()),
        services: Array.isArray(formData.services) ? formData.services : formData.services.split(',').map(s => s.trim()),
        profileImages: profileImages.map(img => img.data), // Include multiple images
        imageMetadata: profileImages.map(img => ({ // Include metadata
          name: img.name,
          size: img.size,
          type: img.type
        }))
      };

      if (isEditMode) {
        await adminAuth.updateEscortProfile(escortId, profileData);
        setSuccessMessage('Escort profile updated successfully!');
      } else {
        await adminAuth.createEscortProfile(profileData);
        setSuccessMessage('Escort profile created successfully!');
      }

      // Redirect after short delay to show success message
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 2000);

    } catch (err) {
      setError(`${isEditMode ? 'Update' : 'Creation'} failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4">Loading escort profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <FaArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <FaUserShield className="w-6 h-6 text-blue-400" />
                <h1 className="text-xl font-semibold text-white">
                  {isEditMode ? 'Update Escort Profile' : 'Add New Escort Profile'}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 bg-gray-900">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-600 rounded-lg flex items-center space-x-3">
            <FaCheckCircle className="text-green-400 w-5 h-5" />
            <span className="text-green-200">{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-600 rounded-lg flex items-center space-x-3">
            <FaExclamationCircle className="text-red-400 w-5 h-5" />
            <span className="text-red-200">{error}</span>
          </div>
        )}

        {/* Form */}
        <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-800">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Profile Images Section */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-white flex items-center space-x-2">
                <FaImage className="w-5 h-5 text-blue-400" />
                <span>Profile Photos</span>
              </h2>
              
              {/* Main Profile Photo */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-300">Main Profile Photo</h3>
                <div className="flex items-start space-x-6">
                  {/* Image Preview */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-700 bg-gray-800">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaUser className="w-12 h-12 text-gray-600" />
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Upload main profile photo
                      </label>
                      <p className="text-sm text-gray-400 mb-3">
                        JPG, PNG or GIF. Max file size 10MB. This will be the primary photo shown in listings.
                      </p>
                    </div>
                    
                    {/* Upload Progress */}
                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>Processing image...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-3">
                      <label className="flex items-center space-x-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors">
                        <FaUpload className="w-4 h-4 text-gray-300" />
                        <span className="text-sm text-gray-300">Choose file</span>
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
                          className="px-4 py-2 text-red-400 hover:text-red-500 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Photos */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-300">Additional Photos</h3>
                <p className="text-sm text-gray-400">
                  Add up to 10 additional photos. Drag and drop multiple images or click to select.
                </p>
                <MultipleImageDragDrop
                  images={profileImages}
                  onImagesChange={handleMultipleImagesChange}
                  maxImages={10}
                  maxSizePerImageMB={10}
                  className="mt-4"
                />
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-white flex items-center space-x-2">
                <FaUser className="w-5 h-5 text-blue-400" />
                <span>Basic Information</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    className={`w-full px-3 py-2 border bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.username ? 'border-red-500 bg-red-900/30' : 'border-gray-700'
                    }`}
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                  />
                  {validationErrors.username && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    className={`w-full px-3 py-2 border bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.firstName ? 'border-red-500 bg-red-900/30' : 'border-gray-700'
                    }`}
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                  />
                  {validationErrors.firstName && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className={`w-full px-3 py-2 border bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.email ? 'border-red-500 bg-red-900/30' : 'border-gray-700'
                    }`}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Gender <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="gender"
                    required
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Date of Birth <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.dateOfBirth ? 'border-red-500 bg-red-900/30' : 'border-gray-700 bg-gray-800 text-white'
                    }`}
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                  {validationErrors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.dateOfBirth}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-white flex items-center space-x-2">
                <FaMapMarkerAlt className="w-5 h-5 text-blue-400" />
                <span>Location</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    <FaGlobe className="inline mr-2" />
                    Country <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="country"
                    required
                    className={`w-full px-3 py-2 border bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.country ? 'border-red-500 bg-red-900/30' : 'border-gray-700'
                    }`}
                    value={formData.country}
                    onChange={handleChange}
                  >
                    <option value="">Select Country</option>
                    <option value="SE">Sweden</option>
                  </select>
                  {validationErrors.country && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.country}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    <FaMapMarkerAlt className="inline mr-2" />
                    Län (Region) <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="region"
                    required
                    className={`w-full px-3 py-2 border bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.region ? 'border-red-500 bg-red-900/30' : 'border-gray-700'
                    }`}
                    value={formData.region}
                    onChange={handleChange}
                  >
                    <option value="">Select Län (Region)</option>
                    {swedishRegions.map(region => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                  {validationErrors.region && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.region}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-white flex items-center space-x-2">
                <FaEdit className="w-5 h-5 text-blue-400" />
                <span>Professional Information</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    name="hourlyRate"
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.hourlyRate ? 'border-red-500 bg-red-900/30' : 'border-gray-700 bg-gray-800 text-white'
                    }`}
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    placeholder="Enter hourly rate"
                  />
                  {validationErrors.hourlyRate && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.hourlyRate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Availability
                  </label>
                  <select
                    name="availability"
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={formData.availability}
                    onChange={handleChange}
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Profession
                  </label>
                  <input
                    type="text"
                    name="profession"
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={formData.profession}
                    onChange={handleChange}
                    placeholder="Enter profession"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-white flex items-center space-x-2">
                <FaUser className="w-5 h-5 text-blue-400" />
                <span>Additional Information</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Relationship Status
                  </label>
                  <select
                    name="relationshipStatus"
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={formData.relationshipStatus}
                    onChange={handleChange}
                  >
                    <option value="">Select Relationship Status</option>
                    {relationshipStatuses.length > 0 ? (
                      relationshipStatuses.map(status => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))
                    ) : (
                      // Fallback options if API fails
                      <>
                        <option value="Single">Single</option>
                        <option value="In a Relationship">In a Relationship</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                        <option value="It's Complicated">It's Complicated</option>
                        <option value="Open Relationship">Open Relationship</option>
                        <option value="Separated">Separated</option>
                        <option value="Living Apart">Living Apart</option>
                        <option value="Mingle">Mingle</option>
                        <option value="Prefer Not to Say">Prefer Not to Say</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    min="100"
                    max="250"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.height ? 'border-red-500 bg-red-900/30' : 'border-gray-700 bg-gray-800 text-white'
                    }`}
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="Enter height"
                  />
                  {validationErrors.height && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.height}</p>
                  )}
                </div>

                <div className="lg:col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Interests
                  </label>
                  <input
                    type="text"
                    name="interests"
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={Array.isArray(formData.interests) ? formData.interests.join(', ') : formData.interests}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      interests: e.target.value.split(',').map(i => i.trim())
                    }))}
                    placeholder="e.g., Dancing, Reading, Traveling"
                  />
                  <p className="mt-1 text-sm text-gray-500">Separate interests with commas</p>
                </div>

                <div className="lg:col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Languages
                  </label>
                  <input
                    type="text"
                    name="languages"
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={Array.isArray(formData.languages) ? formData.languages.join(', ') : formData.languages}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      languages: e.target.value.split(',').map(l => l.trim())
                    }))}
                    placeholder="e.g., English, Spanish, French"
                  />
                  <p className="mt-1 text-sm text-gray-500">Separate languages with commas</p>
                </div>

                <div className="lg:col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Services
                  </label>
                  <input
                    type="text"
                    name="services"
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={Array.isArray(formData.services) ? formData.services.join(', ') : formData.services}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      services: e.target.value.split(',').map(s => s.trim())
                    }))}
                    placeholder="e.g., Companionship, Events, Travel"
                  />
                  <p className="mt-1 text-sm text-gray-500">Separate services with commas</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter a brief description about the escort..."
                />
              </div>
            </div>

            {/* Admin Controls */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-white flex items-center space-x-2">
                <FaUserShield className="w-5 h-5 text-blue-400" />
                <span>Admin Controls</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="isActive" className="text-gray-300">
                    Account Active
                    <span className="block text-sm text-gray-500">Allow the escort to accept bookings</span>
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isVerified"
                    name="isVerified"
                    checked={formData.isVerified}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="isVerified" className="text-gray-300">
                    Verified Account
                    <span className="block text-sm text-gray-500">Mark as verified escort</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="px-6 py-2 text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <FaArrowLeft className="w-4 h-4" />
                  <span>Cancel</span>
                </div>
              </button>
              <button
                type="submit"
                disabled={loading || isUploading}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
              >
                <FaSave className="w-4 h-4" />
                <span>
                  {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Profile' : 'Create Profile')}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminAddUpdateEscort;
