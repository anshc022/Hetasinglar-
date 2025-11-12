import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import { likeService } from '../../services/likeService';
import { useAuth } from '../context/AuthContext';
import { useSwedishTranslation } from '../../utils/swedishTranslations';
import { IconHeartSpark, IconPin } from './UserIcons';

const INITIAL_LIKES_BATCH = 24;
const LOAD_MORE_LIKES = 24;

const LikedProfilesSection = ({ setActiveSection, setSelectedChat, handleStartChat }) => {
  const [likedProfiles, setLikedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [visibleLikesCount, setVisibleLikesCount] = useState(INITIAL_LIKES_BATCH);
  const { token } = useAuth();
  const { t } = useSwedishTranslation();

  const visibleLikedProfiles = useMemo(
    () => likedProfiles.slice(0, visibleLikesCount),
    [likedProfiles, visibleLikesCount]
  );

  const canShowMoreLikes = visibleLikesCount < likedProfiles.length;

  const handleLoadMoreLikes = useCallback(() => {
    setVisibleLikesCount((prev) => Math.min(prev + LOAD_MORE_LIKES, likedProfiles.length));
  }, [likedProfiles.length]);

  useEffect(() => {
    const fetchLikedProfiles = async () => {
      try {
        setLoading(true);
        const response = await likeService.getUserLikes(token, currentPage, 20);
        setLikedProfiles(response.likes);
        setPagination(response.pagination);
        setVisibleLikesCount(INITIAL_LIKES_BATCH);
      } catch (err) {
        console.error('Error fetching liked profiles:', err);
        setError('Failed to load liked profiles');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchLikedProfiles();
    }
  }, [token, currentPage]);

  const handleUnlikeProfile = async (escortId) => {
    try {
      await likeService.unlikeEscort(escortId, token);
        setLikedProfiles((prev) => {
          const updated = prev.filter((like) => like.escortId._id !== escortId);
          setVisibleLikesCount((count) => Math.min(count, Math.max(updated.length, INITIAL_LIKES_BATCH)));
          return updated;
        });
    } catch (err) {
      console.error('Error unliking profile:', err);
      alert('Failed to unlike profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-300">Loading liked profiles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 dark:text-red-400 p-8">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 rounded-xl shadow-lg border border-pink-300/50 dark:border-pink-600/30 overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <IconHeartSpark className="w-6 h-6" />
                {t('likedProfiles')}
              </h2>
              <p className="text-pink-100 dark:text-pink-200 text-sm sm:text-base mt-1">
                {t('profilesYouLiked')} • {pagination?.totalLikes || 0} {t('total')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {likedProfiles.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
            {visibleLikedProfiles.map((like) => (
              <div
                key={like._id}
                className="bg-white/20 dark:bg-gray-800/30 backdrop-blur-lg rounded-2xl shadow-lg shadow-pink-200/40 dark:shadow-gray-900/40 border border-white/30 dark:border-gray-600/30 hover:bg-white/30 dark:hover:bg-gray-700/40 hover:border-pink-200/50 dark:hover:border-gray-500/50 overflow-hidden group relative"
                style={{
                  background:
                    'linear-gradient(145deg, rgba(255,255,255,0.25) 0%, rgba(252,231,243,0.35) 50%, rgba(254,202,202,0.25) 100%)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(236, 72, 153, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                }}
              >
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-pink-100/20 pointer-events-none rounded-2xl"></div>
              <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-2xl"></div>

              <div className="relative aspect-[3/4] bg-gradient-to-br from-pink-50/50 to-rose-100/50 overflow-hidden rounded-t-2xl backdrop-blur-sm">
                {like.escortId.profileImage ? (
                  <img
                    src={like.escortId.profileImage}
                    alt={like.escortId.firstName || like.escortId.username}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100/70 via-rose-50/60 to-purple-100/70 text-pink-400 text-xl sm:text-2xl lg:text-3xl font-bold backdrop-blur-sm">
                    {(like.escortId.firstName || like.escortId.username)?.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-pink-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                  <div className="flex space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlikeProfile(like.escortId._id);
                      }}
                      className="w-12 h-12 bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-red-500/80 transition-all duration-200 border border-white/40 shadow-lg shadow-red-500/30 group"
                      title="Unlike"
                      style={{
                        background: 'linear-gradient(145deg, rgba(239,68,68,0.3) 0%, rgba(220,38,38,0.2) 100%)',
                        backdropFilter: 'blur(15px)',
                        boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                      }}
                    >
                      <svg
                        className="w-5 h-5 text-white drop-shadow-sm group-hover:scale-110 transition-transform"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        <path d="M6 8L18 8M6 16L18 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSection('messages');
                        setSelectedChat({
                          escortId: like.escortId._id,
                          escortName: like.escortId.firstName || like.escortId.username || 'Member',
                          profileImage: like.escortId.profileImage,
                          messages: [],
                          isOnline: true,
                          time: new Date().toLocaleString()
                        });
                        handleStartChat(like.escortId._id, {
                          escortName: like.escortId.firstName || like.escortId.username || 'Member',
                          profileImage: like.escortId.profileImage
                        });
                      }}
                      className="w-12 h-12 bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/35 transition-all duration-200 border border-white/40 shadow-lg shadow-pink-500/30"
                      title="Message"
                      style={{
                        background: 'linear-gradient(145deg, rgba(244,114,182,0.3) 0%, rgba(59,130,246,0.2) 100%)',
                        backdropFilter: 'blur(15px)',
                        boxShadow: '0 4px 20px rgba(244, 114, 182, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                      }}
                    >
                      <FiMessageSquare className="w-5 h-5 text-white drop-shadow-sm" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 relative z-10">
                <div className="text-center">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                    {like.escortId.firstName || like.escortId.username}
                  </h3>
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-600 dark:text-gray-300 mt-1">
                    <IconPin className="w-3 h-3" />
                    <span className="truncate">
                      {like.escortId.region && like.escortId.country
                        ? `${like.escortId.region}, ${like.escortId.country}`
                        : like.escortId.country || 'Location not specified'}
                    </span>
                  </div>
                  {like.escortId.profession && (
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span className="truncate">{like.escortId.profession}</span>
                    </div>
                  )}
                  <div className="text-xs text-pink-500 dark:text-pink-400 mt-2">
                    Liked {new Date(like.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              </div>
            ))}
          </div>
          {canShowMoreLikes && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleLoadMoreLikes}
                className="px-4 py-2 bg-white/80 hover:bg-white text-gray-700 rounded-lg border border-white/40 shadow-sm transition-colors"
              >
                Show more liked profiles
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <svg
            className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <h3 className="text-lg sm:text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No liked profiles yet</h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
            Start exploring members and like the profiles you find interesting
          </p>
          <button
            onClick={() => setActiveSection('members')}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700 text-white rounded-lg transition-colors"
          >
            Browse Members
          </button>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-white/80 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
          >
            Previous
          </button>
          <span className="px-3 py-1 bg-rose-500 text-white rounded-lg">
            {currentPage} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
            disabled={currentPage >= pagination.totalPages}
            className="px-3 py-1 bg-white/80 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default LikedProfilesSection;
