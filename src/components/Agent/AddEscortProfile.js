import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentAuth } from '../../services/agentApi';
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
  FaMapMarkerAlt
} from 'react-icons/fa';
import { 
  COUNTRIES, 
  getStatesForCountry, 
  countryHasStates, 
  getStateLabelForCountry 
} from '../../utils/statesData';

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
    profileImages: [], // New field for multiple images
    country: 'SE',
    region: '',
    relationshipStatus: '',
    interests: [],
    profession: '',
    height: '',
    dateOfBirth: ''
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
        const token = localStorage.getItem('agentToken');
        
        // Fetch relationship statuses
        const relationshipResponse = await fetch('/api/agents/relationship-statuses', {
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
        const regionsResponse = await fetch('/api/agents/swedish-regions', {
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
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!formData.country.trim()) errors.country = 'Country is required';
    
    // Region validation for Sweden
    if ((formData.country === 'SE' || formData.country === 'Sweden') && !formData.region.trim()) {
      errors.region = 'Län (Region) is required for Sweden';
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
      
      const { countryName, regionName } = getReadableLocationNames();
      
      await agentAuth.createEscortProfile({
        ...formData,
        country: countryName,
        region: regionName,
        countryCode: formData.country,
        regionCode: formData.region,
        interests: formData.interests.filter(i => i.trim()),
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        height: parseInt(formData.height) || null,
        profileImages: profileImages.map(img => img.data), // Include multiple images
        imageMetadata: profileImages.map(img => ({ // Include metadata
          name: img.name,
          size: img.size,
          type: img.type
        }))
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

    // Reset UI state
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);
    setValidationErrors(prev => ({ ...prev, profileImage: '' }));

    // --- File Validation ---
    if (!file.type.startsWith('image/')) {
      setError('Invalid file type. Please select an image.');
      setIsUploading(false);
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('File is too large. Max size is 10MB.');
      setIsUploading(false);
      return;
    }

    try {
      // --- Image Compression ---
      let compressedFile;
      try {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          useWebWorker: false, // Disabled web worker for reliability
          onProgress: (progress) => setUploadProgress(Math.round(progress)),
          initialQuality: 0.7,
        };
        console.log('Attempting to compress image...', file.name);
        compressedFile = await imageCompression(file, options);
        console.log('Compression successful.', compressedFile);
      } catch (compressionError) {
        console.error('Image compression failed:', compressionError);
        throw new Error('Failed to compress image. The file may be unsupported or corrupted.');
      }

      // --- Blob Validation ---
      if (!(compressedFile instanceof Blob)) {
        console.error('Compression result is not a valid Blob:', compressedFile);
        throw new Error('Image processing failed after compression.');
      }

      // --- File Reading (Promise-based) ---
      const base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(new Error('Could not read the processed image.'));
        };
      });

      setFormData(prev => ({ ...prev, profileImage: base64String }));
      setImagePreview(base64String);
      setIsUploading(false);

    } catch (error) {
      console.error('An error occurred during the upload process:', error);
      setError(error.message || 'An unknown error occurred during image processing.');
      setIsUploading(false);
      setUploadProgress(0);
      
      // Reset file input to allow retry
      const fileInput = document.getElementById('profileImage');
      if (fileInput) fileInput.value = '';
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
    setFormData(prev => ({ 
      ...prev, 
      profileImages: images.map(img => img.data) // Store base64 data
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/agent/dashboard')}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <FaArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-600"></div>
              <h1 className="text-xl font-semibold text-white">Add New Escort Profile</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 bg-gray-900">
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
                          className="px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.dateOfBirth ? 'border-red-500 bg-red-900/30' : 'border-gray-600 bg-gray-700 text-white'
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
              <h2 className="text-lg font-medium text-white flex items-center space-x-2">
                <FaImage className="w-5 h-5 text-blue-400" />
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
                    {stateLabel}
                    {(formData.country === 'SE' || formData.country === 'Sweden') && (
                      <span className="text-red-400 ml-1">*</span>
                    )}
                  </label>
                  {formData.country && (countryHasStates(formData.country) || formData.country === 'SE' || formData.country === 'Sweden') ? (
                    <select
                      name="region"
                      required={(formData.country === 'SE' || formData.country === 'Sweden')}
                      className={`w-full px-3 py-2 border bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        validationErrors.region ? 'border-red-500 bg-red-900/30' : 'border-gray-700'
                      }`}
                      value={formData.region}
                      onChange={handleChange}
                    >
                      <option value="">Select {stateLabel}</option>
                      {availableStates.map(state => (
                        <option key={state.value} value={state.value}>
                          {state.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="region"
                      className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.region}
                      onChange={handleChange}
                      placeholder={formData.country ? `Enter ${stateLabel.toLowerCase()}` : "Select country first"}
                      disabled={!formData.country}
                    />
                  )}
                  {validationErrors.region && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.region}</p>
                  )}
                  {!formData.country && (
                    <p className="mt-1 text-sm text-gray-400">Please select a country first</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Additional Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Interests
                  </label>
                  <input
                    type="text"
                    name="interests"
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={() => navigate('/agent/dashboard')}
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
