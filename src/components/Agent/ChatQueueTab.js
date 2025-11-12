import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FaEye, 
  FaComments, 
  FaClock, 
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaUsers,
  FaChevronDown
} from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';

const ChatQueueTab = ({ chats, onOpenChat, navigate, userPresence = new Map() }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, unread, panic, active
  const [sortBy, setSortBy] = useState('lastActive'); // lastActive, unreadCount, customerName
  const [showFilters, setShowFilters] = useState(false);

  const currentAgentInfo = useMemo(() => {
    if (typeof window === 'undefined') {
      return {};
    }
    try {
      const stored = window.localStorage.getItem('agent');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  }, []);

  const getAssignedAgent = (chatItem) => {
    if (!chatItem) return null;
    if (chatItem.assignedAgent) {
      return chatItem.assignedAgent;
    }
    if (chatItem.agentId && typeof chatItem.agentId === 'object') {
      const details = chatItem.agentId;
      if (details && (details.name || details.agentId)) {
        const identifier = details._id || details.id || null;
        return {
          _id: identifier,
          name: details.name,
          agentId: details.agentId
        };
      }
    }
    return null;
  };

  const matchesCurrentAgent = (agent) => {
    if (!agent) return false;
    const assignedId = agent._id ? String(agent._id) : null;
    const assignedCode = agent.agentId || null;
    const currentId = currentAgentInfo && currentAgentInfo._id ? String(currentAgentInfo._id) : null;
    const currentCode = currentAgentInfo && currentAgentInfo.agentId ? currentAgentInfo.agentId : null;
    return (assignedId && currentId && assignedId === currentId) || (assignedCode && currentCode && assignedCode === currentCode);
  };

  // Function to get user presence status
  const getUserPresence = (userId) => {
    if (!userId) return { isOnline: false, lastSeen: null };
    const presence = userPresence.get(userId.toString());
    return presence || { isOnline: false, lastSeen: null };
  };

  // Process and filter chats
  const processedChats = useMemo(() => {
    let filtered = [...chats];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(chat => 
        (chat.customerId?.username || chat.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (chat.escortId?.firstName || chat.escortId?.name || chat.escortName || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    switch (filterStatus) {
      case 'unread':
        filtered = filtered.filter(chat => {
          const unreadCount = chat.messages?.filter(msg => 
            msg.sender === 'customer' && !msg.readByAgent
          ).length || 0;
          return unreadCount > 0;
        });
        break;
      case 'panic':
        filtered = filtered.filter(chat => chat.isInPanicRoom);
        break;
      case 'active':
        filtered = filtered.filter(chat => {
          const userPresence = getUserPresence(chat.customerId?._id);
          return userPresence.isOnline;
        });
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'unreadCount':
          const aUnread = a.messages?.filter(msg => msg.sender === 'customer' && !msg.readByAgent).length || 0;
          const bUnread = b.messages?.filter(msg => msg.sender === 'customer' && !msg.readByAgent).length || 0;
          return bUnread - aUnread;
        case 'customerName':
          const aName = a.customerId?.username || a.customerName || '';
          const bName = b.customerId?.username || b.customerName || '';
          return aName.localeCompare(bName);
        case 'lastActive':
        default:
          return new Date(b.lastActive || b.updatedAt) - new Date(a.lastActive || a.updatedAt);
      }
    });

    return filtered;
  }, [chats, searchTerm, filterStatus, sortBy, userPresence]);

  // Stats calculations
  const stats = useMemo(() => {
    const totalChats = chats.length;
    const unreadChats = chats.filter(chat => {
      const unreadCount = chat.messages?.filter(msg => 
        msg.sender === 'customer' && !msg.readByAgent
      ).length || 0;
      return unreadCount > 0;
    }).length;
    const panicRoomChats = chats.filter(chat => chat.isInPanicRoom).length;
    const activeChats = chats.filter(chat => {
      const userPresence = getUserPresence(chat.customerId?._id);
      return userPresence.isOnline;
    }).length;

    return { totalChats, unreadChats, panicRoomChats, activeChats };
  }, [chats, userPresence]);

  const handleChatClick = (chat) => {
    if (chat?.escortId?._id && chat?._id) {
      navigate(`/agent/live-queue/${chat.escortId._id}?chatId=${chat._id}`);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg">
      {/* Header with Stats */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FaComments className="text-blue-500" />
              Chat Queue Management
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Manage all active conversations and monitor chat status
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap gap-3">
            <div className="bg-gray-700 px-3 py-2 rounded-lg">
              <div className="text-xs text-gray-400">Total Chats</div>
              <div className="text-lg font-semibold text-white">{stats.totalChats}</div>
            </div>
            <div className="bg-blue-900/30 px-3 py-2 rounded-lg border border-blue-700">
              <div className="text-xs text-blue-300">Unread</div>
              <div className="text-lg font-semibold text-blue-300">{stats.unreadChats}</div>
            </div>
            <div className="bg-red-900/30 px-3 py-2 rounded-lg border border-red-700">
              <div className="text-xs text-red-300">Panic Room</div>
              <div className="text-lg font-semibold text-red-300">{stats.panicRoomChats}</div>
            </div>
            <div className="bg-green-900/30 px-3 py-2 rounded-lg border border-green-700">
              <div className="text-xs text-green-300">Active Users</div>
              <div className="text-lg font-semibold text-green-300">{stats.activeChats}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-4 border-b border-gray-700 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer or escort name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 flex items-center gap-2"
          >
            <FaFilter />
            Filters
            <FaChevronDown className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-3 pt-3 border-t border-gray-700"
          >
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              >
                <option value="all">All Chats</option>
                <option value="unread">Unread Only</option>
                <option value="panic">Panic Room</option>
                <option value="active">Active Users</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              >
                <option value="lastActive">Last Active</option>
                <option value="unreadCount">Unread Messages</option>
                <option value="customerName">Customer Name</option>
              </select>
            </div>
          </motion.div>
        )}
      </div>

      {/* Chat List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Escort
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Assigned Agent
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Messages (In/Out)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Last Active
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {processedChats.length > 0 ? processedChats.map((chat) => {
              const unreadCount = chat.messages?.filter(msg => 
                msg.sender === 'customer' && !msg.readByAgent
              ).length || 0;
              const lastMessage = chat.messages?.[chat.messages.length - 1];
              const userPresence = getUserPresence(chat.customerId?._id);
              const assignedAgent = getAssignedAgent(chat);
              const isAssignedToCurrentAgent = matchesCurrentAgent(assignedAgent);
              
              return (
                <tr 
                  key={chat._id} 
                  className={`hover:bg-gray-700/50 cursor-pointer transition-colors ${
                    chat.isInPanicRoom ? 'border-l-4 border-red-500 bg-red-900/10' : 
                    unreadCount > 0 ? 'border-l-4 border-blue-500 bg-blue-900/10' : ''
                  }`}
                  onClick={() => handleChatClick(chat)}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`h-3 w-3 rounded-full ${userPresence.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                        {userPresence.isOnline && (
                          <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {chat.customerId?.username || chat.customerName}
                        </div>
                        {userPresence.isOnline && (
                          <div className="text-xs text-green-400">
                            Online now
                          </div>
                        )}
                        {!userPresence.isOnline && userPresence.lastSeen && (
                          <div className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(userPresence.lastSeen), { addSuffix: true })}
                          </div>
                        )}
                        {chat.isInPanicRoom && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-500 text-white mt-1">
                            <FaExclamationTriangle className="mr-1" />
                            PANIC ROOM
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {chat.escortId?.firstName || chat.escortId?.name || chat.escortName || 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {assignedAgent ? (
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${isAssignedToCurrentAgent ? 'text-green-300' : 'text-cyan-200'}`}>
                          {isAssignedToCurrentAgent ? 'You' : (assignedAgent.name || assignedAgent.agentId || 'Assigned')}
                        </span>
                        {assignedAgent.agentId && assignedAgent.agentId !== 'Unknown' && (
                          <span className="text-xs text-gray-400">
                            ID: {assignedAgent.agentId}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-red-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        userPresence.isOnline ? 'bg-green-500 text-white' : 'bg-gray-600 text-white'
                      }`}>
                        <div className={`h-2 w-2 rounded-full mr-1 ${userPresence.isOnline ? 'bg-green-200' : 'bg-gray-300'}`} />
                        {userPresence.isOnline ? 'Online' : 'Offline'}
                      </span>
                      {!userPresence.isOnline && userPresence.lastSeen && (
                        <span className="text-xs text-gray-400">
                          Last seen: {formatDistanceToNow(new Date(userPresence.lastSeen), { addSuffix: true })}
                        </span>
                      )}
                      {userPresence.isOnline && (
                        <span className="text-xs text-green-400">
                          Active now
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">
                        {chat.messages?.length || 0} total
                      </span>
                      {unreadCount > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500 text-white">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    {/* In/Out Message Counter */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-green-400">
                        In: {chat.messages?.filter(msg => msg.sender === 'customer' && !msg.isDeleted).length || 0}
                      </span>
                      <span className="text-xs text-blue-400">
                        Out: {chat.messages?.filter(msg => msg.sender === 'agent' && !msg.isDeleted).length || 0}
                      </span>
                    </div>
                    {lastMessage && (
                      <div className="text-xs text-gray-400 mt-1 max-w-[200px] truncate">
                        {(lastMessage.messageType === 'image' || lastMessage.message === '📷 Image') ? '📷 Image' : lastMessage.message}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                    <div>{format(new Date(chat.lastActive || chat.updatedAt), 'PPp')}</div>
                    <div className="text-xs">
                      {formatDistanceToNow(new Date(chat.lastActive || chat.updatedAt), { addSuffix: true })}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChatClick(chat);
                      }}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue"
                    >
                      <FaEye className="mr-1" />
                      Open Chat
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center">
                  <div className="text-gray-400">
                    <FaComments className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg">No chats found</p>
                    <p className="text-sm">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Try adjusting your filters or search terms'
                        : 'No active conversations at the moment'
                      }
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination could be added here if needed */}
      {processedChats.length > 0 && (
        <div className="px-4 py-3 bg-gray-900 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            Showing {processedChats.length} of {chats.length} chats
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatQueueTab;
