import React, { useEffect, useMemo, useRef, useState } from 'react';
import config from '../../config/environment';
import { users as userApi } from '../../services/api';
import { useAuth } from '../context/AuthContext';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB

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
  const fileInputRef = useRef(null);

  useEffect(() => {
    setAuthDataRef.current = setAuthData;
  }, [setAuthData]);

  const assetBaseUrl = useMemo(buildAssetBaseUrl, []);

  const firstName = user?.profile?.firstName;
  const lastName = user?.profile?.lastName;
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || user?.username || '';
  const fallbackInitial = user?.username?.charAt(0)?.toUpperCase() || 'U';
  const userInitial = displayName?.charAt(0)?.toUpperCase() || fallbackInitial;

  const location = [user?.profile?.city, user?.profile?.country].filter(Boolean).join(', ') || 'Not specified';
  const formattedDob = user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not specified';
  const gender = user?.sex ? `${user.sex.charAt(0).toUpperCase()}${user.sex.slice(1)}` : 'Not specified';
  const phoneNumber = user?.profile?.phoneNumber || 'Not provided';
  const usernameDisplay = user?.username ? `@${user.username}` : 'Not specified';
  const coinBalance = typeof user?.coins?.balance === 'number' ? user.coins.balance : 0;
  const avatarUrl = user?.profile?.avatarUrl;
  const avatarPath = user?.profile?.avatar;

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth:</span>
            <p className="text-gray-800 dark:text-gray-200">{formattedDob}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender:</span>
            <p className="text-gray-800 dark:text-gray-200">{gender}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Username:</span>
            <p className="text-gray-800 dark:text-gray-200">{usernameDisplay}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Location:</span>
            <p className="text-gray-800 dark:text-gray-200">{location}</p>
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
      </div>

      <div className="flex justify-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
        <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          Change Password
        </button>
      </div>
    </div>
  );
};

export default ProfileSection;
