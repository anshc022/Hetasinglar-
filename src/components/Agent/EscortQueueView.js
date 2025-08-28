import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaEye, FaUser, FaClock, FaComments, FaHeart, FaFilter, FaSearch } from 'react-icons/fa';
import { agentAuth } from '../../services/agentApi';

const EscortQueueView = () => {
  const navigate = useNavigate();
  const { escortId } = useParams();
  const [escortChats, setEscortChats] = useState([]);
  const [escortProfile, setEscortProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (escortId) {
      loadEscortQueue();
    }
  }, [escortId]);

  const loadEscortQueue = async () => {
    try {
      setLoading(true);
      
      // Load escort profile info first
      const escortResponse = await agentAuth.getMyEscorts();
      const escort = escortResponse.find(e => e._id === escortId);
      setEscortProfile(escort);
      
  // Load chats for this escort profile using the optimized agent endpoint
  const chatsResponse = await agentAuth.getLiveQueue(escortId);
  const normalized = Array.isArray(chatsResponse) ? chatsResponse : (Array.isArray(chatsResponse?.data) ? chatsResponse.data : []);
  setEscortChats(normalized);
      
    } catch (error) {
      console.error('Error loading escort queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = escortChats.filter(chat => {
    const matchesSearch = !searchTerm || 
      (chat.customerName && chat.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (chat.customerId && (typeof chat.customerId === 'string' 
        ? chat.customerId.toLowerCase().includes(searchTerm.toLowerCase())
        : (chat.customerId?._id || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    const matchesFilter = filter === 'all' || chat.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: 'bg-green-900 text-green-200 border-green-700',
      new: 'bg-blue-900 text-blue-200 border-blue-700',
      assigned: 'bg-yellow-900 text-yellow-200 border-yellow-700',
      pending: 'bg-orange-900 text-orange-200 border-orange-700',
      closed: 'bg-gray-900 text-gray-200 border-gray-700'
    };
    
    return statusConfig[status] || statusConfig.pending;
  };

  const formatLastActivity = (timestamp) => {
    if (!timestamp) return 'No recent activity';
    
    const now = new Date();
    const lastActivity = new Date(timestamp);
    const diffInMinutes = Math.floor((now - lastActivity) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/agent/dashboard')}
                className="flex items-center text-gray-300 hover:text-white transition-colors"
              >
                <FaArrowLeft className="mr-2" />
                Back to Dashboard
              </button>
            </div>
            
            {escortProfile && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  {(
                    escortProfile.profileImage || 
                    escortProfile.profilePicture || 
                    escortProfile.imageUrl
                  ) && (
                    <img
                      src={escortProfile.profileImage || escortProfile.profilePicture || escortProfile.imageUrl}
                      alt={escortProfile.firstName}
                      className="w-10 h-10 rounded-full object-cover border border-gray-700"
                    />
                  )}
                  <div>
                    <h1 className="text-xl font-semibold text-white">
                      {escortProfile.firstName}'s Queue
                    </h1>
                    <p className="text-sm text-gray-400">
                      {filteredChats.length} active conversations
                    </p>
                  </div>
                </div>
                
                {/* Refresh Button */}
                <button
                  onClick={loadEscortQueue}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Refresh Queue"
                >
                  <svg 
                    className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading conversations...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Filters and Search */}
            <div className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by customer name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <FaFilter className="text-gray-400" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Chats</option>
                    <option value="new">New</option>
                    <option value="active">Active</option>
                    <option value="assigned">Assigned</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{escortChats.length}</div>
                  <div className="text-sm text-gray-400">Total Chats</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {escortChats.filter(c => c.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-400">Active</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {escortChats.filter(c => c.status === 'new').length}
                  </div>
                  <div className="text-sm text-gray-400">New</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {escortChats.filter(c => c.status === 'pending').length}
                  </div>
                  <div className="text-sm text-gray-400">Pending</div>
                </div>
              </div>
            </div>

            {/* Chat List */}
            {filteredChats.length > 0 ? (
              <div className="space-y-4">
                {filteredChats.map((chat, index) => (
                  <div 
                    key={chat._id} 
                    className="bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                            <FaUser className="text-blue-400 text-lg" />
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {chat.customerName || (() => {
                                const idStr = typeof chat.customerId === 'string' 
                                  ? chat.customerId 
                                  : (chat.customerId?._id || '').toString();
                                return `Customer ${idStr ? idStr.slice(-4) : '----'}`;
                              })()}
                            </h3>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center space-x-1 text-gray-400">
                                <FaClock className="text-sm" />
                                <span className="text-sm">
                                  {formatLastActivity(chat.lastCustomerResponse)}
                                </span>
                              </div>
                              
                              {chat.messages && (
                                <div className="flex items-center space-x-1 text-gray-400">
                                  <FaComments className="text-sm" />
                                  <span className="text-sm">
                                    {chat.messages.length} messages
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {chat.status && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(chat.status)}`}>
                              {chat.status.charAt(0).toUpperCase() + chat.status.slice(1)}
                            </span>
                          )}
                          
                          <button
                            onClick={() => navigate(`/agent/live-queue/${escortId}?chatId=${chat._id}`)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 font-medium"
                          >
                            <FaEye />
                            <span>Open Chat</span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Additional Info */}
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <div className="flex items-center space-x-4">
                            <span>Chat ID: {chat._id.slice(-8)}</span>
                            {chat.createdAt && (
                              <span>Created: {new Date(chat.createdAt).toLocaleDateString()}</span>
                            )}
                          </div>
                          
                          {chat.isInPanicRoom && (
                            <div className="flex items-center space-x-1 text-red-400">
                              <FaHeart className="text-sm" />
                              <span className="text-sm font-medium">Panic Room</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-800 rounded-lg border border-gray-700">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaComments className="text-2xl text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {searchTerm || filter !== 'all' ? 'No matching chats' : 'No active chats'}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {searchTerm || filter !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : `No conversations found for ${escortProfile?.firstName}. New chats will appear here when customers start conversations.`
                    }
                  </p>
                  
                  {(searchTerm || filter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilter('all');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EscortQueueView;
