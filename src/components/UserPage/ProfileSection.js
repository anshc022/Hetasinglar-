import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import config from '../../config/environment';
import { users as userApi } from '../../services/api';
import { useAuth } from '../context/AuthContext';
import { SWEDISH_REGION_OPTIONS } from '../../constants/swedishRegions';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB
const DESCRIPTION_MAX_LENGTH = 2000;

const buildAssetBaseUrl = () => {
  if (!config.API_URL) {
    return '';
  }
  return config.API_URL.replace(/\/api\/?$/, '');
};

const ProfileSection = ({ user }) => {
  const { token, setAuthData } = useAuth();
  const setAuthDataRef = useRef(setAuthData);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const buildFormValuesFromUser = useCallback(() => ({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    phoneNumber: user?.profile?.phoneNumber || '',
    country: user?.profile?.country || '',
    city: user?.profile?.city || '',
    region: user?.profile?.region || '',
    description: user?.profile?.description || ''
  }), [user]);
  const [formValues, setFormValues] = useState(buildFormValuesFromUser);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setAuthDataRef.current = setAuthData;
  }, [setAuthData]);

  useEffect(() => {
    setFormValues(buildFormValuesFromUser());
  }, [user, buildFormValuesFromUser]);

  const assetBaseUrl = useMemo(buildAssetBaseUrl, []);

  const firstName = formValues.firstName || user?.profile?.firstName;
  const lastName = formValues.lastName || user?.profile?.lastName;
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || user?.username || '';
  const fallbackInitial = user?.username?.charAt(0)?.toUpperCase() || 'U';
  const userInitial = displayName?.charAt(0)?.toUpperCase() || fallbackInitial;

  const location = [formValues.city, formValues.country].filter(Boolean).join(', ') || 'Not specified';
  const formattedDob = user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not specified';
  const gender = user?.sex ? `${user.sex.charAt(0).toUpperCase()}${user.sex.slice(1)}` : 'Not specified';
  const phoneNumber = formValues.phoneNumber || 'Not provided';
  const usernameDisplay = user?.username ? `@${user.username}` : 'Not specified';
  const coinBalance = typeof user?.coins?.balance === 'number' ? user.coins.balance : 0;
  const avatarUrl = user?.profile?.avatarUrl;
  const avatarPath = user?.profile?.avatar;
  const policyAcceptedDateObj = user?.legal?.policyAcceptedAt ? new Date(user.legal.policyAcceptedAt) : null;
  const policyAcceptedAtFull = policyAcceptedDateObj ? policyAcceptedDateObj.toLocaleString() : null;
  const policyAcceptedAtDate = policyAcceptedDateObj ? policyAcceptedDateObj.toLocaleDateString() : null;
  const policyVersion = user?.legal?.policyVersion || 'current';
  const descriptionLength = formValues.description.length;

  const resolveAvatarSource = useMemo(() => {
    if (previewUrl) {
      return previewUrl;
    }

    const avatarCandidate = avatarUrl || avatarPath;
    if (!avatarCandidate) {
      return null;
    }

    if (/^https?:\/\//i.test(avatarCandidate)) {
      return avatarCandidate;
    }

    const normalized = avatarCandidate.startsWith('/') ? avatarCandidate : `/${avatarCandidate}`;
    if (!assetBaseUrl) {
      return normalized;
    }

    return `${assetBaseUrl}${normalized}`;
  }, [previewUrl, avatarUrl, avatarPath, assetBaseUrl]);

  useEffect(() => () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  const resetSelection = () => {
    setSelectedFile(null);
    setPreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      return null;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setFormValues((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const handleDescriptionChange = (event) => {
    const value = event.target.value.slice(0, DESCRIPTION_MAX_LENGTH);
    setFormValues((previous) => ({
      ...previous,
      description: value
    }));
  };

  const handleProfileReset = () => {
    setFormValues(buildFormValuesFromUser());
    setStatus(null);
  };

  const handleProfileSave = async (event) => {
    event?.preventDefault();

    if (!token) {
      setStatus({ type: 'error', message: 'You must be signed in to update your profile details.' });
      return;
    }

    const payload = {
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      phoneNumber: formValues.phoneNumber.trim(),
      country: formValues.country.trim(),
      city: formValues.city.trim(),
      region: formValues.region,
      description: formValues.description.trim()
    };

    if (!payload.firstName || !payload.lastName) {
      setStatus({ type: 'error', message: 'Please provide both first and last name.' });
      return;
    }

    if (!payload.region) {
      setStatus({ type: 'error', message: 'Please select your region.' });
      return;
    }

    if (!payload.description || payload.description.length < 10) {
      setStatus({ type: 'error', message: 'Please add a short description of at least 10 characters.' });
      return;
    }

    setIsSavingProfile(true);
    setStatus(null);

    try {
      const response = await userApi.updateProfile(payload);
      if (response?.user) {
        setAuthDataRef.current?.(response.user, token);
        setFormValues({
          firstName: payload.firstName,
          lastName: payload.lastName,
          phoneNumber: payload.phoneNumber,
          country: payload.country,
          city: payload.city,
          region: payload.region,
          description: payload.description
        });
      }
      setStatus({ type: 'success', message: response?.message || 'Profile details updated successfully.' });
    } catch (error) {
      const message = error?.message || error?.error || 'Failed to update profile details. Please try again.';
      setStatus({ type: 'error', message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      setStatus({ type: 'error', message: 'Please choose a JPG, PNG, WEBP, or GIF image.' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setStatus({ type: 'error', message: 'Image is too large. Maximum size is 2 MB.' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);
    setStatus({ type: 'info', message: 'Preview updated. Click Save Photo to confirm.' });
    setPreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      return URL.createObjectURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelUpload = () => {
    resetSelection();
    setStatus(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    if (!token) {
      setStatus({ type: 'error', message: 'You must be signed in to update your profile image.' });
      return;
    }

    setIsUploading(true);
    setStatus(null);

    try {
      const response = await userApi.uploadAvatar(selectedFile);
      if (response?.user) {
        setAuthDataRef.current?.(response.user, token);
      }
      setStatus({ type: 'success', message: 'Profile image updated successfully.' });
      resetSelection();
    } catch (error) {
      const message = error?.message || error?.error || 'Failed to update profile image. Please try again.';
      setStatus({ type: 'error', message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 dark:border-gray-600/50 p-6">
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-600">
        <div className="relative">
          {resolveAvatarSource ? (
            <img
              src={resolveAvatarSource}
              alt={`${displayName || user?.username || 'User'} avatar`}
              className="h-20 w-20 rounded-full object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
              {userInitial}
            </div>
          )}
          <label className="absolute bottom-0 right-0 inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-rose-500 rounded-full cursor-pointer shadow-md hover:bg-rose-600 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
            Change
          </label>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{displayName || user?.username}</h2>
          <p className="text-gray-500 dark:text-gray-400">{user?.email || 'No email on file'}</p>
          {user?.username && (
            <p className="text-sm text-gray-400 dark:text-gray-500">{usernameDisplay}</p>
          )}
        </div>
      </div>

      {selectedFile && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Selected file: <span className="font-medium">{selectedFile.name}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-400 text-white text-sm rounded-lg transition-colors"
            >
              {isUploading ? 'Saving...' : 'Save Photo'}
            </button>
            <button
              onClick={handleCancelUpload}
              disabled={isUploading}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {status?.message && (
        <div
          className={`mb-4 text-sm ${
            status.type === 'error'
              ? 'text-red-500 dark:text-red-400'
              : status.type === 'success'
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-600 dark:text-gray-300'
          }`}
        >
          {status.message}
        </div>
      )}

          <form onSubmit={handleProfileSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">First Name</label>
                <input
                  type="text"
                  value={formValues.firstName}
                  onChange={handleFieldChange('firstName')}
                  className="w-full px-4 py-2.5 rounded-lg border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition bg-white/80 dark:bg-gray-800/80 dark:border-gray-600"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formValues.lastName}
                  onChange={handleFieldChange('lastName')}
                  className="w-full px-4 py-2.5 rounded-lg border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition bg-white/80 dark:bg-gray-800/80 dark:border-gray-600"
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Username</label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">City</label>
                <input
                  type="text"
                  value={formValues.city}
                  onChange={handleFieldChange('city')}
                  className="w-full px-4 py-2.5 rounded-lg border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition bg-white/80 dark:bg-gray-800/80 dark:border-gray-600"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Country</label>
                <input
                  type="text"
                  value={formValues.country}
                  onChange={handleFieldChange('country')}
                  className="w-full px-4 py-2.5 rounded-lg border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition bg-white/80 dark:bg-gray-800/80 dark:border-gray-600"
                  placeholder="Country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Region</label>
                <select
                  value={formValues.region}
                  onChange={handleFieldChange('region')}
                  className="w-full px-4 py-2.5 rounded-lg border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition bg-white/80 dark:bg-gray-800/80 dark:border-gray-600"
                >
                  <option value="">Select region</option>
                  {SWEDISH_REGION_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formValues.phoneNumber}
                  onChange={handleFieldChange('phoneNumber')}
                  className="w-full px-4 py-2.5 rounded-lg border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition bg-white/80 dark:bg-gray-800/80 dark:border-gray-600"
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">About You</label>
              <textarea
                value={formValues.description}
                onChange={handleDescriptionChange}
                rows={5}
                className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition bg-white/80 dark:bg-gray-800/80 dark:border-gray-600 resize-none"
                placeholder="Write a short introduction that helps matches get to know you."
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">
                {descriptionLength}/{DESCRIPTION_MAX_LENGTH}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {policyAcceptedAtFull
                  ? `Policy accepted on ${policyAcceptedAtFull} (version ${policyVersion})`
                  : 'Policy acceptance pending'}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleProfileReset}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  disabled={isSavingProfile}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 disabled:bg-rose-400 transition-colors"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth:</span>
              <p className="text-gray-800 dark:text-gray-200">{formattedDob}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender:</span>
              <p className="text-gray-800 dark:text-gray-200">{gender}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Location:</span>
              <p className="text-gray-800 dark:text-gray-200">{location}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Region:</span>
              <p className="text-gray-800 dark:text-gray-200">{formValues.region || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone:</span>
              <p className="text-gray-800 dark:text-gray-200">{phoneNumber}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Coin Balance:</span>
              <p className="text-gray-800 dark:text-gray-200">{coinBalance}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {policyAcceptedAtDate
                ? `Policy version ${policyVersion} • accepted ${policyAcceptedAtDate}`
                : 'Policy acceptance information not available'}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.open('/privacy', '_blank', 'noopener')}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                View Policy
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
    </div>
  );
};

export default ProfileSection;
