import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import { escorts } from '../../services/api';
import { likeService } from '../../services/likeService';
import { useAuth } from '../context/AuthContext';
import { useSwedishTranslation } from '../../utils/swedishTranslations';
import {
  IconFemale,
  IconMale,
  IconCake,
  IconHeartSpark,
  IconPin
} from './UserIcons';

const LIKES_PAGE_SIZE = 500;
const INITIAL_MEMBER_BATCH = 24;
const LOAD_MORE_STEP = 24;

const safeParseInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

// Profile Detail Modal Component extracted for clarity
const ProfileModal = ({ member, isOpen, onClose }) => {
  const { t } = useSwedishTranslation();

  if (!isOpen || !member) {
    return null;
  }

  const age = member.dateOfBirth
    ? new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear()
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <div className="aspect-[4/3] bg-gradient-to-br from-pink-100 to-rose-100 dark:from-gray-700 dark:to-gray-800 overflow-hidden rounded-t-2xl">
            {member.profileImage ? (
              <img
                src={member.profileImage}
                alt={member.firstName || member.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100/70 via-rose-50/60 to-purple-100/70 dark:from-gray-700 dark:to-gray-600 text-pink-400 dark:text-pink-300 text-6xl font-bold">
                {(member.firstName || member.username)?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {member.status && (
            <div className="absolute top-4 left-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  member.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
              </span>
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center border-b border-gray-200 dark:border-gray-600 pb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {member.firstName || member.username}
            </h2>
            {age && (
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                {age} {t('yearsOld')}
              </p>
            )}
            {(member.country || member.region) && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  {member.country && member.region
                    ? `${member.region}, ${member.country}`
                    : member.country || member.region}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
              {t('personalInformation')}
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {member.relationshipStatus && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">{t('relationship')}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        member.relationshipStatus === 'Single'
                          ? 'bg-green-400'
                          : member.relationshipStatus === 'In Relationship'
                          ? 'bg-yellow-400'
                          : member.relationshipStatus === 'Married'
                          ? 'bg-red-400'
                          : 'bg-gray-400'
                      }`}
                    ></div>
                    <span className="text-gray-900 dark:text-gray-100">
                      {member.relationshipStatus}
                    </span>
                  </div>
                </div>
              )}

              {member.gender && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">{t('gender')}</span>
                  <span className="text-gray-900 dark:text-gray-100 capitalize">{member.gender}</span>
                </div>
              )}

              {member.profession && (
                <div className="col-span-2">
                  <span className="text-gray-500 dark:text-gray-400 block">{t('profession')}</span>
                  <span className="text-gray-900 dark:text-gray-100">{member.profession}</span>
                </div>
              )}

              {member.height && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">{t('height')}</span>
                  <span className="text-gray-900 dark:text-gray-100">{member.height} cm</span>
                </div>
              )}

              {member.serialNumber && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">{t('id')}</span>
                  <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">#{member.serialNumber}</span>
                </div>
              )}
            </div>
          </div>

          {member.interests && member.interests.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
                {t('interests')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {member.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 rounded-full text-sm font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {member.description && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
                {t('aboutMe')}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {member.description}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={() => {
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700 text-white rounded-lg font-medium transition-colors"
            >
              {t('startChat')}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MembersSection = ({ setActiveSection, setSelectedChat, handleStartChat }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [likedProfiles, setLikedProfiles] = useState(new Set());
  const [likeLoading, setLikeLoading] = useState(new Set());
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [filters, setFilters] = useState({
    lookingFor: '',
    relationStatus: '',
    ageMin: '',
    ageMax: '',
    location: ''
  });
  const { token } = useAuth();
  const [visibleCount, setVisibleCount] = useState(INITIAL_MEMBER_BATCH);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const normalizedFilters = useMemo(() => ({
    lookingFor: filters.lookingFor?.toLowerCase().trim() || '',
    relationStatus: filters.relationStatus?.toLowerCase().trim() || '',
    ageMin: filters.ageMin ? safeParseInt(filters.ageMin) : null,
    ageMax: filters.ageMax ? safeParseInt(filters.ageMax) : null,
    location: filters.location?.toLowerCase().trim() || ''
  }), [filters]);

  const {
    lookingFor: normalizedLookingFor,
    relationStatus: normalizedRelationStatus,
    ageMin: normalizedAgeMin,
    ageMax: normalizedAgeMax,
    location: normalizedLocation
  } = normalizedFilters;

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const fetchAllLikedEscortIds = useCallback(
    async (authToken) => {
      if (!authToken) {
        return new Set();
      }

      const likedSet = new Set();
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const likeResponse = await likeService.getUserLikes(
          authToken,
          currentPage,
          LIKES_PAGE_SIZE
        );

        const likes = Array.isArray(likeResponse?.likes) ? likeResponse.likes : [];
        for (const like of likes) {
          const escortRef = like?.escortId;
          if (!escortRef) {
            continue;
          }
          if (typeof escortRef === 'string') {
            likedSet.add(escortRef);
          } else if (escortRef?._id) {
            likedSet.add(escortRef._id.toString());
          }
        }

        const pagination = likeResponse?.pagination;
        if (pagination?.hasMore) {
          currentPage += 1;
        } else {
          hasMore = false;
        }
      }

      return likedSet;
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    const fetchMembers = async () => {
      setLoading(true);
      setError(null);

      try {
        const normalizeEscorts = (escortResponse) => {
          if (Array.isArray(escortResponse)) {
            return escortResponse;
          }
          if (Array.isArray(escortResponse?.data)) {
            return escortResponse.data;
          }
          if (Array.isArray(escortResponse?.items)) {
            return escortResponse.items;
          }
          return [];
        };

        const escortsPromise = escorts.getEscortProfiles({ full: true, fetchAll: true });
        const likesPromise = token
          ? fetchAllLikedEscortIds(token)
          : Promise.resolve(new Set());

        const [escortResponse, likedIds] = await Promise.all([escortsPromise, likesPromise]);

        if (!isMounted) {
          return;
        }

        const escortList = normalizeEscorts(escortResponse);
        setMembers(escortList);

        const likedProfileSet = likedIds instanceof Set ? likedIds : new Set(likedIds || []);
        setLikedProfiles(likedProfileSet);
      } catch (err) {
        console.error('Error fetching members:', err);
        if (isMounted) {
          setError('Failed to load members');
          setLikedProfiles(new Set());
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMembers();

    return () => {
      isMounted = false;
    };
  }, [fetchAllLikedEscortIds, token]);

  const handleLikeToggle = async (memberId) => {
    if (likeLoading.has(memberId)) {
      return;
    }

    try {
      setLikeLoading((prev) => new Set([...prev, memberId]));

      const isCurrentlyLiked = likedProfiles.has(memberId);

      if (isCurrentlyLiked) {
        await likeService.unlikeEscort(memberId, token);
        setLikedProfiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(memberId);
          return newSet;
        });
      } else {
        await likeService.likeEscort(memberId, token);
        setLikedProfiles((prev) => new Set([...prev, memberId]));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      alert('Failed to update like status: ' + (err.message || 'Unknown error'));
    } finally {
      setLikeLoading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
    }
  };

  const handleProfileClick = (member) => {
    setSelectedProfile(member);
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedProfile(null);
  };

  const filteredMembers = useMemo(() => {
    if (!Array.isArray(members) || members.length === 0) {
      return [];
    }

    const normalizedQuery = (deferredSearchQuery || '').trim().toLowerCase();

    return members.filter((member) => {
      if (normalizedQuery) {
        const matchesQuery =
          member.username?.toLowerCase().includes(normalizedQuery) ||
          member.firstName?.toLowerCase().includes(normalizedQuery) ||
          member.country?.toLowerCase().includes(normalizedQuery) ||
          member.region?.toLowerCase().includes(normalizedQuery) ||
          member.profession?.toLowerCase().includes(normalizedQuery) ||
          (Array.isArray(member.interests) &&
            member.interests.some((interest) => interest.toLowerCase().includes(normalizedQuery)));

        if (!matchesQuery) {
          return false;
        }
      }

      const age = member.dateOfBirth ? currentYear - new Date(member.dateOfBirth).getFullYear() : null;

      if (normalizedAgeMin !== null && age !== null && age < normalizedAgeMin) {
        return false;
      }

      if (normalizedAgeMax !== null && age !== null && age > normalizedAgeMax) {
        return false;
      }

      if (normalizedLocation) {
        const country = member.country?.toLowerCase() || '';
        const region = member.region?.toLowerCase() || '';

        if (!country.includes(normalizedLocation) && !region.includes(normalizedLocation)) {
          return false;
        }
      }

      if (normalizedLookingFor) {
        const gender = member.gender?.toLowerCase();
        if (!gender || gender !== normalizedLookingFor) {
          return false;
        }
      }

      if (normalizedRelationStatus) {
        const status = member.relationshipStatus?.toString().toLowerCase() || '';
        if (!status.includes(normalizedRelationStatus)) {
          return false;
        }
      }

      return true;
    });
  }, [
    members,
    deferredSearchQuery,
    currentYear,
    normalizedLocation,
    normalizedLookingFor,
    normalizedRelationStatus,
    normalizedAgeMin,
    normalizedAgeMax
  ]);

  const visibleMembers = useMemo(
    () => filteredMembers.slice(0, visibleCount),
    [filteredMembers, visibleCount]
  );

  const hasActiveFilters = useMemo(() => {
    const hasQuery = Boolean((deferredSearchQuery || '').trim());
    return (
      hasQuery ||
      Boolean(
        normalizedLookingFor ||
          normalizedRelationStatus ||
          normalizedLocation ||
          normalizedAgeMin !== null ||
          normalizedAgeMax !== null
      )
    );
  }, [
    deferredSearchQuery,
    normalizedLookingFor,
    normalizedRelationStatus,
    normalizedLocation,
    normalizedAgeMin,
    normalizedAgeMax
  ]);

  useEffect(() => {
    setVisibleCount(INITIAL_MEMBER_BATCH);
  }, [filteredMembers]);

  const handleLoadMoreMembers = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_STEP, filteredMembers.length));
  }, [filteredMembers.length]);

  const resetFilters = () => {
    setSearchQuery('');
    setShowFilters(false);
    setFilters({
      lookingFor: '',
      relationStatus: '',
      ageMin: '',
      ageMax: '',
      location: ''
    });
    setVisibleCount(INITIAL_MEMBER_BATCH);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Loading members...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 rounded-xl shadow-lg border border-pink-300/50 dark:border-pink-500/30 overflow-hidden transition-colors duration-300">
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Find Your Perfect Match</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/90 bg-white/20 px-3 py-1 rounded-full">{filteredMembers.length} found</span>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                <span className="text-sm font-medium">Filters</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search members by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-xl border-0 bg-white/95 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-white/50 focus:outline-none transition-all duration-200 text-gray-800 placeholder-gray-500 shadow-lg"
            />
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-150 rounded-full hover:bg-gray-100"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="overflow-hidden">
            <div className="px-4 sm:px-6 pb-6 border-t border-white/20">
              <div className="pt-4">
                  <div className="block sm:hidden mb-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            lookingFor: prev.lookingFor === 'female' ? '' : 'female'
                          }))
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          filters.lookingFor === 'female'
                            ? 'bg-white text-pink-600'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <IconFemale className="w-4 h-4" /> Women
                        </span>
                      </button>
                      <button
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            lookingFor: prev.lookingFor === 'male' ? '' : 'male'
                          }))
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          filters.lookingFor === 'male'
                            ? 'bg-white text-pink-600'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <IconMale className="w-4 h-4" /> Men
                        </span>
                      </button>
                      <button
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            ageMin: prev.ageMin ? '' : '18',
                            ageMax: prev.ageMax ? '' : '30'
                          }))
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          filters.ageMin || filters.ageMax
                            ? 'bg-white text-pink-600'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <IconCake className="w-4 h-4" /> 18-30
                        </span>
                      </button>
                      <button
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            relationStatus: prev.relationStatus === 'single' ? '' : 'single'
                          }))
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          filters.relationStatus === 'single'
                            ? 'bg-white text-pink-600'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <IconHeartSpark className="w-4 h-4" /> Single
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-white/90 mb-2 uppercase tracking-wide">
                        Looking For
                      </label>
                      <select
                        value={filters.lookingFor}
                        onChange={(e) => setFilters((prev) => ({ ...prev, lookingFor: e.target.value }))}
                        className="w-full px-3 py-3 rounded-lg border-0 bg-white/95 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-white/50 text-sm appearance-none cursor-pointer shadow-lg"
                      >
                        <option value="">All Genders</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-white/90 mb-2 uppercase tracking-wide">
                        Relationship Status
                      </label>
                      <select
                        value={filters.relationStatus}
                        onChange={(e) => setFilters((prev) => ({ ...prev, relationStatus: e.target.value }))}
                        className="w-full px-3 py-3 rounded-lg border-0 bg-white/95 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-white/50 text-sm appearance-none cursor-pointer shadow-lg"
                      >
                        <option value="">Any Status</option>
                        <option value="single">Single</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                        <option value="separated">Separated</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-white/90 mb-2 uppercase tracking-wide">
                        Age Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="18"
                          value={filters.ageMin}
                          onChange={(e) => setFilters((prev) => ({ ...prev, ageMin: e.target.value }))}
                          className="w-full px-2 py-3 rounded-lg border-0 bg-white/95 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-white/50 text-sm text-center shadow-lg"
                          min="18"
                          max="99"
                        />
                        <input
                          type="number"
                          placeholder="99"
                          value={filters.ageMax}
                          onChange={(e) => setFilters((prev) => ({ ...prev, ageMax: e.target.value }))}
                          className="w-full px-2 py-3 rounded-lg border-0 bg-white/95 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-white/50 text-sm text-center shadow-lg"
                          min="18"
                          max="99"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-white/90 mb-2 uppercase tracking-wide">
                        Location
                      </label>
                      <select
                        value={filters.location}
                        onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                        className="w-full px-3 py-3 rounded-lg border-0 bg-white/95 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-white/50 text-sm appearance-none cursor-pointer shadow-lg"
                      >
                        <option value="">All Locations</option>
                        <option value="usa">🇺🇸 United States</option>
                        <option value="canada">🇨🇦 Canada</option>
                        <option value="uk">🇬🇧 United Kingdom</option>
                        <option value="australia">🇦🇺 Australia</option>
                        <option value="germany">🇩🇪 Germany</option>
                        <option value="france">🇫🇷 France</option>
                        <option value="spain">🇪🇸 Spain</option>
                        <option value="italy">🇮🇹 Italy</option>
                        <option value="netherlands">🇳🇱 Netherlands</option>
                        <option value="sweden">🇸🇪 Sweden</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-white/20">
                    <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                      <button
                        onClick={resetFilters}
                        className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-150 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="font-medium">Reset</span>
                      </button>

                      {hasActiveFilters && (
                        <span className="text-xs px-3 py-1 bg-white/30 text-white rounded-full">Active filters</span>
                      )}
                    </div>

                    <div className="hidden sm:block">
                      <button
                        onClick={() => setShowFilters(false)}
                        className="flex items-center space-x-2 px-6 py-3 bg-white text-pink-600 rounded-lg hover:bg-white/90 transition-all duration-150 shadow-lg font-medium text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>Search Members</span>
                      </button>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {filteredMembers.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
            {visibleMembers.map((member) => (
              <div
                key={member._id}
                onClick={() => handleProfileClick(member)}
                className="bg-white/20 dark:bg-gray-800/30 backdrop-blur-lg rounded-2xl shadow-lg shadow-pink-200/40 dark:shadow-gray-900/40 border border-white/30 dark:border-gray-600/30 hover:bg-white/30 dark:hover:bg-gray-700/40 hover:border-pink-200/50 dark:hover:border-gray-500/50 overflow-hidden group relative cursor-pointer"
                style={{
                  background:
                    'linear-gradient(145deg, rgba(255,255,255,0.25) 0%, rgba(252,231,243,0.35) 50%, rgba(254,202,202,0.25) 100%)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px 0 rgba(244, 114, 182, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }}
              >
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-pink-100/20 pointer-events-none rounded-2xl"></div>
              <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-2xl"></div>

              <div className="relative aspect-[3/4] bg-gradient-to-br from-pink-50/50 to-rose-100/50 overflow-hidden rounded-t-2xl backdrop-blur-sm">
                {member.profileImage ? (
                  <img
                    src={member.profileImage}
                    alt={member.firstName || member.username}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100/70 via-rose-50/60 to-purple-100/70 text-pink-400 text-xl sm:text-2xl lg:text-3xl font-bold backdrop-blur-sm">
                    {(member.firstName || member.username)?.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-pink-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                  <div className="flex space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!likeLoading.has(member._id)) {
                          handleLikeToggle(member._id);
                        }
                      }}
                      disabled={likeLoading.has(member._id)}
                      className={`w-12 h-12 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/35 transition-all duration-200 border border-white/40 shadow-lg ${
                        likedProfiles.has(member._id) ? 'shadow-red-500/30' : 'shadow-pink-500/30'
                      } ${likeLoading.has(member._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={
                        likeLoading.has(member._id)
                          ? 'Loading...'
                          : likedProfiles.has(member._id)
                          ? 'Unlike'
                          : 'Like'
                      }
                      style={{
                        background: likedProfiles.has(member._id)
                          ? 'linear-gradient(145deg, rgba(239,68,68,0.3) 0%, rgba(220,38,38,0.2) 100%)'
                          : 'linear-gradient(145deg, rgba(255,255,255,0.3) 0%, rgba(244,114,182,0.2) 100%)',
                        backdropFilter: 'blur(15px)',
                        boxShadow: '0 4px 20px rgba(244, 114, 182, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                      }}
                    >
                      <svg
                        className={`w-5 h-5 drop-shadow-sm ${likedProfiles.has(member._id) ? 'text-red-300' : 'text-white'}`}
                        fill={likedProfiles.has(member._id) ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSection('messages');
                        setSelectedChat({
                          escortId: member._id,
                          escortName: member.firstName || member.username || 'Member',
                          profileImage: member.profileImage,
                          messages: [],
                          isOnline: true,
                          time: new Date().toLocaleString()
                        });
                        handleStartChat(member._id, {
                          escortName: member.firstName || member.username || 'Member',
                          profileImage: member.profileImage
                        });
                      }}
                      className="w-12 h-12 bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/35 transition-all duration-200 border border-white/40 shadow-lg shadow-pink-500/30"
                      title="Message"
                      style={{
                        background:
                          'linear-gradient(145deg, rgba(255,255,255,0.3) 0%, rgba(244,114,182,0.2) 100%)',
                        backdropFilter: 'blur(15px)',
                        boxShadow: '0 4px 20px rgba(244, 114, 182, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                      }}
                    >
                      <FiMessageSquare className="w-5 h-5 text-white drop-shadow-sm" />
                    </button>
                  </div>
                </div>

                {member.dateOfBirth && (
                  <div
                    className="absolute top-3 right-3 text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/30"
                    style={{
                      background: 'linear-gradient(145deg, rgba(0,0,0,0.6) 0%, rgba(244,114,182,0.4) 100%)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 2px 10px rgba(244, 114, 182, 0.2)'
                    }}
                  >
                    {new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear()}
                  </div>
                )}

                <div
                  className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
                  style={{ boxShadow: '0 0 10px rgba(34, 197, 94, 0.5), 0 2px 4px rgba(244, 114, 182, 0.2)' }}
                ></div>
              </div>

              <div className="p-3 sm:p-4 relative z-10 bg-white/10 dark:bg-gray-700/20 backdrop-blur-sm rounded-b-2xl">
                <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-100 leading-tight mb-1 drop-shadow-sm">
                  <span className="truncate block">{member.firstName || member.username}</span>
                  {member.dateOfBirth && (
                    <span className="text-xs font-normal text-gray-600 dark:text-gray-400 block">
                      {new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear()} years old
                    </span>
                  )}
                </h3>

                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate mb-2">
                  <IconPin className="w-3.5 h-3.5 text-pink-400 dark:text-pink-300 flex-shrink-0 drop-shadow-sm" />
                  <span className="truncate drop-shadow-sm">{member.country || member.region || 'Unknown'}</span>
                </div>

                {member.description && (
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2 truncate whitespace-nowrap">
                    {member.description}
                  </p>
                )}

                <div className="hidden sm:flex flex-col gap-2 mt-3 text-xs">
                  <div
                    className="flex items-center gap-1 text-green-700 dark:text-green-400 px-2 py-1 rounded-full border border-white/30 dark:border-gray-600/30"
                    style={{
                      background:
                        'linear-gradient(145deg, rgba(34,197,94,0.15) 0%, rgba(255,255,255,0.25) 100%)',
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 2px 8px rgba(34, 197, 94, 0.2)'
                    }}
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full shadow-sm"></div>
                    <span className="font-medium drop-shadow-sm">Online</span>
                  </div>
                  {member.profession && (
                    <span
                      className="text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full truncate max-w-20 font-medium border border-white/30 dark:border-gray-600/30"
                      style={{
                        background:
                          'linear-gradient(145deg, rgba(255,255,255,0.25) 0%, rgba(244,114,182,0.15) 100%)',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 2px 8px rgba(244, 114, 182, 0.15)'
                      }}
                    >
                      {member.profession}
                    </span>
                  )}

                  {member.relationshipStatus && (
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          member.relationshipStatus === 'single'
                            ? 'bg-green-400'
                            : member.relationshipStatus === 'in_relationship'
                            ? 'bg-yellow-400'
                            : member.relationshipStatus === 'married'
                            ? 'bg-red-400'
                            : 'bg-gray-400'
                        }`}
                      ></div>
                      <span className="text-gray-600 dark:text-gray-400 capitalize text-xs">
                        {member.relationshipStatus.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs text-pink-400 dark:text-pink-300 opacity-70">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Tap for details</span>
                  </div>
                </div>

                <div className="flex sm:hidden justify-center space-x-2 mt-3 pt-3 border-t border-white/30 dark:border-gray-600/30">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!likeLoading.has(member._id)) {
                        handleLikeToggle(member._id);
                      }
                    }}
                    disabled={likeLoading.has(member._id)}
                    className={`flex-1 py-2.5 rounded-xl flex items-center justify-center transition-all duration-200 border border-white/40 dark:border-gray-600/40 ${
                      likedProfiles.has(member._id) ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'
                    } ${likeLoading.has(member._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={
                      likeLoading.has(member._id)
                        ? 'Loading...'
                        : likedProfiles.has(member._id)
                        ? 'Unlike'
                        : 'Like'
                    }
                    style={{
                      background: likedProfiles.has(member._id)
                        ? 'linear-gradient(145deg, rgba(239,68,68,0.25) 0%, rgba(220,38,38,0.15) 100%)'
                        : 'linear-gradient(145deg, rgba(255,255,255,0.25) 0%, rgba(229,231,235,0.35) 100%)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 15px rgba(244, 114, 182, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <svg
                      className="w-4 h-4 drop-shadow-sm"
                      fill={likedProfiles.has(member._id) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => {
                      setActiveSection('messages');
                      setSelectedChat({
                        escortId: member._id,
                        escortName: member.firstName || member.username || 'Member',
                        profileImage: member.profileImage,
                        messages: [],
                        isOnline: true,
                        time: new Date().toLocaleString()
                      });
                      handleStartChat(member._id, {
                        escortName: member.firstName || member.username || 'Member',
                        profileImage: member.profileImage
                      });
                    }}
                    className="flex-1 py-2.5 text-white rounded-xl flex items-center justify-center transition-all duration-200 border border-white/40 dark:border-gray-600/40"
                    title="Message"
                    style={{
                      background: 'linear-gradient(145deg, rgba(244,114,182,0.8) 0%, rgba(59,130,246,0.7) 100%)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 20px rgba(244, 114, 182, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <FiMessageSquare className="w-4 h-4 drop-shadow-sm" />
                  </button>
                </div>
              </div>
              </div>
            ))}
          </div>
          {filteredMembers.length > visibleMembers.length && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleLoadMoreMembers}
                className="px-4 py-2 bg-white/80 hover:bg-white text-gray-700 rounded-lg border border-white/40 shadow-sm transition-colors"
              >
                Show more profiles
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="text-lg sm:text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No members found</h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            {searchQuery ? 'Try adjusting your search terms or filters' : 'No members available at the moment'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700 text-white rounded-lg transition-colors text-sm"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      <ProfileModal member={selectedProfile} isOpen={showProfileModal} onClose={handleCloseProfileModal} />
    </div>
  );
};

export default MembersSection;
