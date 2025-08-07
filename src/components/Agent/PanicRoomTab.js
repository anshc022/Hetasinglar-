import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaUser, FaClock, FaComments, FaEye, FaSearch } from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';
import { agentAuth } from '../../services/agentApi';
import Notification from '../common/Notification';

const PanicRoomTab = ({ onChatSelect }) => {
  const [panicRoomChats, setPanicRoomChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);
  const [notification, setNotification] = useState(null);

  // Notification helper
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    loadPanicRoomChats();
    // Refresh panic room chats every minute
    const interval = setInterval(loadPanicRoomChats, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadPanicRoomChats = async () => {
    try {
      const response = await agentAuth.getPanicRoomChats();
      setPanicRoomChats(response.chats);
    } catch (error) {
      console.error('Error loading panic room chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokePanicRoom = async (e, chat) => {
    e.stopPropagation(); // Prevent chat selection
    
    if (!window.confirm('Are you sure you want to remove this chat from the panic room?')) {
      return;
    }
    
    setIsRevoking(true);
    try {
      await agentAuth.removeFromPanicRoom(chat._id, 'Revoked from Panic Room tab');
      // Remove from local state immediately
      setPanicRoomChats(prev => prev.filter(c => c._id !== chat._id));
      showNotification('Chat removed from panic room successfully', 'success');
    } catch (error) {
      console.error('Error removing from panic room:', error);
      showNotification('Failed to remove chat from panic room', 'error');
    } finally {
      setIsRevoking(false);
    }
  };

  // Sort and filter chats
  const filteredAndSortedChats = React.useMemo(() => {
    let result = [...panicRoomChats];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(chat => 
        chat.customerId?.username?.toLowerCase().includes(query) ||
        chat.panicRoomReason?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = a.panicRoomEnteredAt ? new Date(a.panicRoomEnteredAt) : new Date(0);
        const dateB = b.panicRoomEnteredAt ? new Date(b.panicRoomEnteredAt) : new Date(0);
        return dateB - dateA;
      } else if (sortBy === 'oldest') {
        const dateA = a.panicRoomEnteredAt ? new Date(a.panicRoomEnteredAt) : new Date(0);
        const dateB = b.panicRoomEnteredAt ? new Date(b.panicRoomEnteredAt) : new Date(0);
        return dateA - dateB;
      }
      return 0;
    });

    return result;
  }, [panicRoomChats, sortBy, searchQuery]);

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="bg-red-600 p-4 text-white">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FaExclamationTriangle />
          Panic Room
          {panicRoomChats.length > 0 && (
            <span className="px-2 py-1 bg-red-700 rounded-full text-sm ml-2">
              {panicRoomChats.length}
            </span>
          )}
        </h2>
        <p className="text-sm text-red-100 mt-1">Customers requiring special attention</p>
        
        {/* Search and Sort Controls */}
        <div className="mt-4 flex gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-red-700 text-white placeholder-red-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-red-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Chat List */}
      <div className="p-4 flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading panic room...
          </div>
        ) : filteredAndSortedChats.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {searchQuery ? (
              <>
                <FaSearch className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No matching results found
              </>
            ) : (
              <>
                <FaExclamationTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No customers in panic room
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedChats.map(chat => (
              <div
                key={chat._id}
                onClick={() => onChatSelect(chat)}
                className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
              >
                {/* Customer Info */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaUser className="text-red-400" />
                    <div>
                      <div className="font-medium text-white">{chat.customerId?.username || 'Unknown User'}</div>
                      <div className="text-xs text-gray-400">
                        <FaClock className="inline mr-1" />
                        {chat.panicRoomEnteredAt ? (
                          formatDistanceToNow(new Date(chat.panicRoomEnteredAt), { addSuffix: true })
                        ) : (
                          'Recently moved'
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-red-400 font-medium px-2 py-1 bg-red-900/30 rounded-full">
                    {chat.panicRoomReason || 'Manual Review'}
                  </span>
                </div>

                {/* Message Preview */}
                {chat.messages?.length > 0 && (
                  <div className="mt-2 text-sm text-gray-300 bg-gray-800/50 rounded p-2">
                    <p className="line-clamp-2">
                      {chat.messages[chat.messages.length - 1].content}
                    </p>
                  </div>
                )}

                {/* Stats & Actions */}
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center">
                      <FaComments className="mr-1" />
                      {chat.messages?.length || 0} messages
                    </span>
                    <span className="flex items-center text-blue-400 hover:text-blue-300">
                      <FaEye className="mr-1" />
                      View Chat
                    </span>
                    <button
                      onClick={(e) => handleRevokePanicRoom(e, chat)}
                      disabled={isRevoking}
                      className="flex items-center text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove from Panic Room"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Revoke
                    </button>
                  </div>
                  <span className="text-xs">
                    {chat.panicRoomEnteredAt ? (
                      format(new Date(chat.panicRoomEnteredAt), 'MMM d, HH:mm')
                    ) : (
                      'Unknown time'
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default PanicRoomTab;
