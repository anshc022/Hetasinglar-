import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { agentAuth, agentApi } from '../../services/agentApi';
import { agentCache, CACHE_KEYS, CACHE_DURATIONS } from '../../utils/agentCache';
import AgentEarnings from './AgentEarnings';
import AffiliateView from './AffiliateView';
import AffiliateManager from './AffiliateManager';
import ChatStatistics from './ChatStatistics';
import CreateFirstContact from './CreateFirstContact';
import NotificationPanel from './NotificationPanel';
import ReminderSystem from './ReminderSystem';
import PanicRoomTab from './PanicRoomTab';
import EscortImageManager from './EscortImageManager';
import EscortProfilesTab from './EscortProfilesTab';
import ChatQueueTab from './ChatQueueTab';
import AssignedCustomersTab from './AssignedCustomersTab';
import { 
  FaEye, 
  FaBell, 
  FaEnvelope, 
  FaUsers, 
  FaPlus, 
  FaComments, 
  FaDollarSign, 
  FaUserTie, 
  FaChartBar,
  FaExclamationTriangle,
  FaUserFriends,
  FaSearch,
  FaLink
} from 'react-icons/fa';
import websocketService from '../../services/websocket';
import notificationService from '../../services/notificationService';
import { format, differenceInHours, formatDistanceToNow } from 'date-fns';

const Sidebar = ({ activeTab, setActiveTab, agent, reminderCount = 0, panicRoomCount = 0 }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        bg-gray-900 text-gray-300 w-64 h-screen flex flex-col
        fixed lg:sticky top-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold">
              {agent?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold truncate">{agent?.name || 'Agent'}</h3>
              <p className="text-xs text-gray-500 truncate">ID: {agent?.agentId}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 p-3 space-y-1 overflow-y-auto">
          {[
            { name: 'Dashboard', icon: FaEye },
            { name: 'Escort Profiles', icon: FaUsers },
            { name: 'Chat Queue', icon: FaComments },
            { 
              name: 'Panic Room', 
              icon: FaExclamationTriangle, 
              badge: panicRoomCount,
              badgeColor: 'bg-red-500'
            },
            { name: 'Earnings', icon: FaDollarSign },
            { name: 'Affiliates', icon: FaUserTie },
            { name: 'Affiliate Links', icon: FaLink },
            { name: 'My Assigned Customers', icon: FaUserFriends },
            { name: 'Chat Statistics', icon: FaChartBar },
            { name: 'Reminders', icon: FaBell, badge: reminderCount }
          ].map((item) => {
            const Icon = item.icon;
            const showBadge = item.badge > 0;
            
            return (
              <button
                key={item.name}
                onClick={() => {
                  setActiveTab(item.name.toLowerCase());
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 relative text-sm ${
                  activeTab === item.name.toLowerCase()
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
                {showBadge && (
                  <span className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-xs rounded-full text-white ${item.badgeColor || 'bg-blue-500'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

const NotificationBell = ({ notifications, onNotificationClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const notifRef = useRef(null);

  const handleClickOutside = (event) => {
    if (notifRef.current && !notifRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={notifRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:bg-gray-700 rounded-lg transition-colors"
      >
        <FaBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-96 bg-gray-800 rounded-lg shadow-lg z-50 max-h-[80vh] overflow-y-auto"
          >
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
            </div>
            <div className="divide-y divide-gray-700">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      onNotificationClick(notif);
                      setIsOpen(false);
                    }}
                    className={`p-4 hover:bg-gray-700/50 cursor-pointer ${
                      !notif.read ? 'bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 mt-2 rounded-full ${
                        notif.severity === 'high' ? 'bg-red-500' :
                        notif.severity === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <div>
                        <p className="text-white">
                          <span className="font-semibold">{notif.customerName}</span> needs a follow-up
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Last message: {notif.lastMessage}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Due: {formatDistanceToNow(new Date(notif.followUpDue), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-gray-400 text-center">
                  No notifications
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-gray-800 p-6 rounded-lg shadow-lg"
  >
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-gray-400 text-sm">{title}</h3>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  </motion.div>
);

const LiveQueueTable = ({ chats, onAssign, onPushBack, onOpenChat, navigate, onCreateFirstContact, userPresence = new Map() }) => {
  // Store the current chat index for sequential viewing
  const [currentChatIndex, setCurrentChatIndex] = useState(0);
  
  // Filter chats to show only those with unread messages
  // Include panic room chats at the top, but exclude them from automatic queue
  const unreadsOnly = chats.filter(chat => {
    const unreadCount = chat.messages?.filter(msg => 
      msg.sender === 'customer' && !msg.readByAgent
    ).length || 0;
    
    // Show panic room chats or regular chats with unread messages
    return chat.isInPanicRoom || unreadCount > 0;
  });

  // Sort chats with panic room chats at the top, then by unread count
  const sortedChats = useMemo(() => {
    return [...unreadsOnly].sort((a, b) => {
      // Panic room chats always come first
      if (a.isInPanicRoom && !b.isInPanicRoom) return -1;
      if (!a.isInPanicRoom && b.isInPanicRoom) return 1;
      
      // If both are panic room chats, sort by moved date (newest first)
      if (a.isInPanicRoom && b.isInPanicRoom) {
        return new Date(b.panicRoomMovedAt || 0) - new Date(a.panicRoomMovedAt || 0);
      }
      
      const aUnread = a.messages?.filter(msg => msg.sender === 'customer' && !msg.readByAgent).length || 0;
      const bUnread = b.messages?.filter(msg => msg.sender === 'customer' && !msg.readByAgent).length || 0;
      
      // Sort by unread count (highest first)
      if (bUnread !== aUnread) return bUnread - aUnread;
      
      // Finally sort by last message time (newest first)
      const aLastMessage = a.messages?.[a.messages.length - 1]?.timestamp;
      const bLastMessage = b.messages?.[b.messages.length - 1]?.timestamp;
      return new Date(bLastMessage) - new Date(aLastMessage);
    });
  }, [unreadsOnly]);

  // Function to get user presence status
  const getUserPresence = (userId) => {
    if (!userId) return { isOnline: false, lastSeen: null };
    const presence = userPresence.get(userId.toString());
    return presence || { isOnline: false, lastSeen: null };
  };

  // Function to handle Watch Live click
  const handleWatchLiveClick = () => {
    // Filter out panic room chats from automatic queue
    const autoQueueChats = sortedChats.filter(chat => !chat.isInPanicRoom);
    if (autoQueueChats.length === 0) return;
    
    const currentChat = autoQueueChats[currentChatIndex];
    if (currentChat?.escortId?._id) {
      navigate(`/agent/live-queue/${currentChat.escortId._id}?chatId=${currentChat._id}&queue=${encodeURIComponent(JSON.stringify(autoQueueChats.map(c => c._id)))}&index=${currentChatIndex}`);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-2 md:p-4 shadow-lg overflow-x-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
        <h2 className="text-lg md:text-xl font-semibold text-white">Live Queue</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            onClick={onCreateFirstContact}
            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 text-xs md:text-base"
          >
            <FaPlus />
            <span>Create First Contact</span>
          </button>
          {sortedChats.length > 0 && (
            <div className="flex items-center gap-2">
              {(() => {
                const panicRoomCount = sortedChats.filter(chat => chat.isInPanicRoom).length;
                const autoQueueCount = sortedChats.length - panicRoomCount;
                return (
                  <div className="text-gray-400 text-xs md:text-sm flex items-center gap-3">
                    <span>
                      {autoQueueCount} in queue
                    </span>
                    {panicRoomCount > 0 && (
                      <span className="text-red-400">
                        {panicRoomCount} in panic room
                      </span>
                    )}
                  </div>
                );
              })()}
              {sortedChats.filter(chat => !chat.isInPanicRoom).length > 0 && (
                <button 
                  onClick={handleWatchLiveClick}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 text-xs md:text-base"
                >
                  <FaEye />
                  <span>Watch Live Queue</span>
                  {sortedChats.filter(chat => !chat.isInPanicRoom).length > 1 && (
                    <span className="text-xs bg-blue-600 px-2 py-1 rounded-full">
                      {currentChatIndex + 1}/{sortedChats.filter(chat => !chat.isInPanicRoom).length}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700 text-xs md:text-sm">
          <thead className="bg-gray-900 text-gray-400 uppercase">
            <tr>
              <th className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap">User / Last Message</th>
              <th className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap">Escort Profile</th>
              <th className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap">Status</th>
              <th className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap">Unread Messages</th>
              <th className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap">Last Active</th>
              <th className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-300 divide-y divide-gray-700">
            {unreadsOnly.length > 0 ? unreadsOnly.map((chat) => {
              const unreadCount = chat.messages?.filter(msg => 
                msg.sender === 'customer' && !msg.readByAgent
              ).length || 0;
              const lastMessage = chat.messages?.[chat.messages.length - 1];
              const userPresence = getUserPresence(chat.customerId?._id);
              
              return (
                <tr key={chat._id} className={`${
                  chat.isInPanicRoom 
                    ? 'border-l-4 border-red-500 bg-red-900/20' 
                    : 'border-l-4 border-blue-500 bg-blue-900/10'
                } hover:bg-gray-700/30 transition-colors`}>
                  <td className="px-2 py-2 md:px-4 md:py-3 min-w-[160px] align-top">
                    <div className="flex items-start gap-2 md:gap-3 flex-col md:flex-row">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${userPresence.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                        {userPresence.isOnline && (
                          <span className="text-xs text-green-400">Online</span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`font-medium ${chat.isInPanicRoom ? 'text-red-300' : 'text-white'}`}>
                          {chat.customerId?.username || chat.customerName}
                        </span>
                        {chat.isInPanicRoom && (
                          <span className="ml-0 md:ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full mt-1">PANIC ROOM</span>
                        )}
                        {chat.isInPanicRoom && chat.panicRoomReason && (
                          <span className="text-xs text-red-400 mt-1">
                            Reason: {chat.panicRoomReason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        )}
                        {unreadCount > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-blue-400">New messages</span>
                            {chat.messages?.some(msg => msg.sender === 'agent' && !msg.readByCustomer) && (
                              <span className="text-xs text-yellow-400">• Sent ✓</span>
                            )}
                            {chat.messages?.some(msg => msg.sender === 'agent' && msg.readByCustomer) && (
                              <span className="text-xs text-green-400">• Read ✓✓</span>
                            )}
                          </div>
                        )}
                        {lastMessage && (
                          <span className="block text-xs text-gray-400 mt-1 max-w-[180px] truncate">
                            {lastMessage.messageType === 'image' ? '📷 Image' : lastMessage.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2 md:px-4 md:py-3 min-w-[120px] align-top">
                    <span className="block font-semibold text-white truncate">
                      {chat.escortId?.firstName || chat.escortId?.name || chat.escortName || 'N/A'}
                    </span>
                  </td>
                  <td className="px-2 py-2 md:px-4 md:py-3 align-top">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        userPresence.isOnline ? 'bg-green-500 text-white' : 'bg-gray-600 text-white'
                      }`}>
                        {userPresence.isOnline ? 'Online' : 'Offline'}
                      </span>
                      {!userPresence.isOnline && userPresence.lastSeen && (
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(userPresence.lastSeen), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 md:px-4 md:py-3 align-top">
                    {unreadCount > 0 && (
                      <span className="px-2 py-1 bg-blue-500 text-white rounded-full text-xs w-fit">
                        {unreadCount} unread
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 md:px-4 md:py-3 align-top">
                    <span className="block text-xs text-gray-400">
                      {format(new Date(chat.lastActive || chat.createdAt), 'PPp')}
                    </span>
                  </td>
                  <td className="px-2 py-2 md:px-4 md:py-3 align-top">
                    <div className="flex flex-col md:flex-row gap-2">
                      <button 
                        onClick={() => navigate(`/agent/live-queue/${chat.escortId._id}?chatId=${chat._id}`)}
                        className="p-2 text-white rounded-lg flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-xs md:text-sm"
                        title="Open Live Chat"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="hidden md:inline">
                          {unreadCount > 0 ? 'View Messages' : 'Open Chat'}
                        </span>
                      </button>
                      <button 
                        onClick={() => onPushBack(chat._id)}
                        className="p-2 bg-yellow-500 rounded-lg hover:bg-yellow-600 text-xs md:text-sm"
                        title="Push Back Chat"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="6" className="px-2 py-8 text-center text-gray-400">
                  No unread messages at the moment
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


const AgentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState({
    step: 0,
    total: 6,
    message: 'Initializing...',
    details: 'Setting up dashboard components',
    progress: 0
  });
  const [stats, setStats] = useState({
    liveMessages: 0,
    totalReminders: 0,
    sentMessages: 0,
    onlineMembers: 0
  });
  const [chats, setChats] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [agent, setAgent] = useState(null);
  const [myEscorts, setMyEscorts] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showCreateFirstContact, setShowCreateFirstContact] = useState(false);
  const [panicRoomCount, setPanicRoomCount] = useState(0);
  const [userPresence, setUserPresence] = useState(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEscortForImages, setSelectedEscortForImages] = useState(null);
  
  const socketRef = useRef(null);

  // Loading status helper
  const updateLoadingStatus = (step, message, details) => {
    const progress = Math.round((step / 6) * 100);
    setLoadingStatus({
      step,
      total: 6,
      message,
      details,
      progress
    });
    console.log(`📊 Loading Step ${step}/6: ${message} - ${details}`);
  };

  // Initialize websocket connection
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Step 1: Initialize WebSocket
        updateLoadingStatus(1, 'Connecting to Server', 'Establishing WebSocket connection for real-time updates');
        
        // Fetch agent profile data with cache
        updateLoadingStatus(2, 'Loading Agent Profile', 'Fetching your agent information and permissions');
        try {
          const agentData = await agentCache.getOrFetch(
            CACHE_KEYS.AGENT_PROFILE,
            () => agentAuth.getProfile(),
            CACHE_DURATIONS.VERY_LONG
          );
          setAgent(agentData);
          console.log('✅ Agent profile loaded:', agentData.name);
        } catch (error) {
          console.error('Failed to fetch agent profile:', error);
        }

        // Step 3: Initialize services
        updateLoadingStatus(3, 'Starting Services', 'Initializing notification monitoring and WebSocket services');
        
        // Start notification monitoring for new customers
        notificationService.startMonitoring(agentAuth);

        // Create websocket connection for real-time updates
        websocketService.connect();
        websocketService.setUserId('agent');
        socketRef.current = websocketService;
        
        // Set up message handlers
        const messageHandler = (data) => {
          console.log('Dashboard received WebSocket message:', data);
          
          if (data.type === 'queue:update' || data.type === 'live_queue_update') {
            console.log('Received queue update:', data);
            // Invalidate cache when queue updates
            agentCache.delete(CACHE_KEYS.LIVE_QUEUE);
            agentCache.delete(CACHE_KEYS.DASHBOARD_STATS);
            
            // Refresh live queue data
            if (window.fetchLiveQueueData) {
              window.fetchLiveQueueData();
            }
          }
          
          if (data.type === 'chat_message') {
            // Update chat in real-time when new messages arrive
            setChats(prevChats => {
              return prevChats.map(chat => {
                if (chat._id === data.chatId) {
                  const newMessage = {
                    sender: data.sender,
                    message: data.message,
                    messageType: data.messageType || 'text',
                    timestamp: data.timestamp,
                    readByAgent: data.readByAgent,
                    readByCustomer: data.readByCustomer,
                    imageData: data.imageData,
                    mimeType: data.mimeType,
                    filename: data.filename
                  };
                  
                  return {
                    ...chat,
                    messages: [...(chat.messages || []), newMessage],
                    updatedAt: data.timestamp
                  };
                }
                return chat;
              });
            });
          }
          
          if (data.type === 'notifications_update') {
            setNotifications(prevNotifs => {
              // Keep existing notifications that aren't in the new update
              const oldNotifs = prevNotifs.filter(old => 
                !data.notifications.find(n => n.chatId === old.chatId)
              );
              return [...oldNotifs, ...data.notifications];
            });
          }
        };

        // Handle presence updates
        const presenceHandler = (data) => {
          console.log('Presence update:', data);
          
          if (data.type === 'user_presence') {
            setUserPresence(prev => {
              const newPresence = new Map(prev);
              newPresence.set(data.userId, {
                isOnline: data.status === 'online',
                lastSeen: data.timestamp,
                status: data.status
              });
              return newPresence;
            });

            // Update chat list to reflect user online status
            setChats(prevChats => {
              return prevChats.map(chat => {
                if (chat.customerId?._id.toString() === data.userId) {
                  return {
                    ...chat,
                    isUserActive: data.status === 'online'
                  };
                }
                return chat;
              });
            });
          }
          
          if (data.type === 'user_activity_update') {
            setUserPresence(prev => {
              const newPresence = new Map(prev);
              const existing = newPresence.get(data.userId) || {};
              newPresence.set(data.userId, {
                ...existing,
                isOnline: true,
                lastSeen: data.timestamp
              });
              return newPresence;
            });
          }
        };
        
        // Subscribe to WebSocket messages
        const unsubscribeMessage = websocketService.onMessage(messageHandler);
        const unsubscribePresence = websocketService.onPresence(presenceHandler);
        
        console.log('✅ Connected to dashboard websockets');
        
        // Clean up on unmount
        return () => {
          unsubscribeMessage();
          unsubscribePresence();
          websocketService.disconnect();
          notificationService.stopMonitoring();
        };
        
      } catch (error) {
        console.error('❌ Failed to initialize dashboard:', error);
        setLoadingStatus({
          step: 0,
          total: 6,
          message: 'Connection Failed',
          details: 'Please refresh the page to try again',
          progress: 0
        });
      }
    };

    initializeDashboard();
  }, []);

  // Fetch initial dashboard data with cache
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Step 4: Load Dashboard Data
        updateLoadingStatus(4, 'Loading Dashboard Stats', 'Fetching dashboard statistics and metrics');
        
        const dashboardStats = await agentCache.getOrFetch(
          CACHE_KEYS.DASHBOARD_STATS,
          () => agentAuth.getDashboardStats(),
          CACHE_DURATIONS.MEDIUM
        );

        // Step 5: Load Live Queue
        updateLoadingStatus(5, 'Loading Live Queue', 'Fetching active chat conversations and customer queue');
        
        const liveQueue = await agentCache.getOrFetch(
          CACHE_KEYS.LIVE_QUEUE,
          () => agentAuth.getLiveQueue(),
          CACHE_DURATIONS.SHORT
        );

        // Step 6: Load Escort Profiles
        updateLoadingStatus(6, 'Loading Escort Profiles', 'Loading your assigned escort profiles and data');
        
        const escortData = await agentCache.getOrFetch(
          CACHE_KEYS.MY_ESCORTS,
          () => agentAuth.getMyEscorts(),
          CACHE_DURATIONS.LONG
        );

        console.log('✅ All dashboard data loaded successfully');

        setStats({
          liveMessages: dashboardStats.totalLiveMessages || 0,
          totalReminders: dashboardStats.reminders?.length || 0,
          sentMessages: dashboardStats.agentStats.totalMessagesSent || 0,
          onlineMembers: dashboardStats.onlineCustomers || 0
        });

        setChats(liveQueue);
        setMyEscorts(escortData);
        setReminders(dashboardStats.reminders || []);

        // Initialize user presence from initial data
        const presenceMap = new Map();
        liveQueue.forEach(chat => {
          if (chat.customerId?._id) {
            presenceMap.set(chat.customerId._id.toString(), {
              isOnline: chat.isUserActive || false,
              lastSeen: chat.lastActive || chat.updatedAt,
              status: chat.isUserActive ? 'online' : 'offline'
            });
          }
        });
        setUserPresence(presenceMap);

        // Mark loading as complete
        setLoadingStatus({
          step: 6,
          total: 6,
          message: 'Dashboard Ready',
          details: 'All systems operational and ready to use',
          progress: 100
        });

      } catch (error) {
        console.error('❌ Failed to fetch dashboard data:', error);
        setLoadingStatus({
          step: 0,
          total: 6,
          message: 'Failed to Load Data',
          details: error.message || 'Please check your connection and try again',
          progress: 0
        });
        
        if (error.response && error.response.status === 401) {
          navigate('/agent/login');
        }
      } finally {
        // Complete loading after a short delay to show final status
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    };

    const fetchLiveQueueData = async () => {
      try {
        const response = await agentApi.get('/chats/live-queue-updates');
        const { liveQueue, metadata } = response.data;
        
        setChats(liveQueue.map(item => ({
          _id: item.chatId,
          customerId: { _id: item.customerId, username: item.customerName },
          customerName: item.customerName,
          escortId: { _id: item.escortId, firstName: item.escortName },
          escortName: item.escortName,
          status: item.status,
          messages: [], // Will be populated by real-time updates
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          lastActive: item.lastActive,
          isUserActive: item.isUserActive,
          isInPanicRoom: item.isInPanicRoom,
          panicRoomReason: item.panicRoomReason,
          panicRoomMovedAt: item.panicRoomMovedAt,
          requiresFollowUp: item.requiresFollowUp,
          followUpDue: item.followUpDue,
          unreadCount: item.unreadCount,
          hasUnreadAgentMessages: item.hasUnreadAgentMessages,
          lastMessage: item.lastMessage
        })));

        // Update presence data
        const presenceMap = new Map();
        liveQueue.forEach(item => {
          if (item.customerId) {
            presenceMap.set(item.customerId.toString(), item.presence);
          }
        });
        setUserPresence(presenceMap);

        // Update stats
        setStats(prev => ({
          ...prev,
          onlineMembers: metadata.activeUsers,
          liveMessages: metadata.totalChats
        }));

        setPanicRoomCount(metadata.panicRoomCount);

      } catch (error) {
        console.error('Failed to fetch live queue updates:', error);
      }
    };

    // Store fetchLiveQueueData in a ref so it can be called from WebSocket handlers
    window.fetchLiveQueueData = fetchLiveQueueData;

    fetchDashboardData();
    
    // Remove auto-polling - use manual refresh button instead
    // const interval = setInterval(() => {
    //   fetchLiveQueueData();
    // }, 15000); // Poll every 15 seconds
    
    // return () => clearInterval(interval);
  }, [navigate]); // Removed activeTab dependency to prevent refetching on tab changes

  // Add this to fetch panic room count
  const updatePanicRoomCount = async () => {
    try {
      const response = await agentAuth.getPanicRoomChats();
      setPanicRoomCount(response.chats.length);
    } catch (error) {
      console.error('Error fetching panic room count:', error);
    }
  };

  useEffect(() => {
    updatePanicRoomCount();
    // Remove auto-update - use manual refresh button instead
    // const interval = setInterval(updatePanicRoomCount, 60000); // Update every minute
    // return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    agentAuth.logout();
    navigate('/agent/login');
  };

  const handleAssignChat = async (chatId) => {
    try {
      await agentAuth.assignChat(chatId);
      // Invalidate cache since chat status changed
      invalidateCacheOnAction('chat_action');
      // The websocket will handle updating the UI
    } catch (error) {
      console.error('Failed to assign chat:', error);
    }
  };

  const handlePushBack = async (chatId) => {
    try {
      const hours = 2; // Default pushback time (2 hours)
      await agentAuth.pushBackChat(chatId, hours);
      // Invalidate cache since chat status changed
      invalidateCacheOnAction('chat_action');
      // The websocket will handle updating the UI
    } catch (error) {
      console.error('Failed to push back chat:', error);
    }
  };

  const handleOpenChat = (chatId) => {
    navigate(`/agent/chat/${chatId}`);
  };

  const handleAddEscort = () => {
    navigate('/agent/escorts/add');
  };

  const handleUpdateProfile = (updatedProfile) => {
    // Update the myEscorts state with the updated profile
    setMyEscorts(prevEscorts => 
      prevEscorts.map(escort => 
        escort._id === updatedProfile._id ? updatedProfile : escort
      )
    );
  };

  const handleMarkReminderComplete = async (chatId) => {
    try {
      // Update the chat to mark that the reminder has been handled
      await agentAuth.updateChatInfo(chatId, { 
        reminderHandled: true, 
        reminderHandledAt: new Date().toISOString() 
      });
      
      // Refresh the chats to update the display
      const response = await agentAuth.getLiveQueue();
      setChats(response);
    } catch (error) {
      console.error('Failed to mark reminder as complete:', error);
    }
  };

  const handleSnoozeReminder = async (chatId, hours) => {
    try {
      // Add snooze time to the chat
      const snoozeUntil = new Date();
      snoozeUntil.setHours(snoozeUntil.getHours() + hours);
      
      await agentAuth.updateChatInfo(chatId, { 
        reminderSnoozedUntil: snoozeUntil.toISOString() 
      });
      
      // Refresh the chats to update the display
      const response = await agentAuth.getLiveQueue();
      setChats(response);
    } catch (error) {
      console.error('Failed to snooze reminder:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark notification as read
    setNotifications(prev => 
      prev.map(n => 
        n.chatId === notification.chatId 
          ? { ...n, read: true }
          : n
      )
    );

    // Navigate to the relevant chat
    navigate(`/agent/live-queue/${notification.chatId}`);
  };

  const handleCreateFirstContact = () => {
    setShowCreateFirstContact(true);
  };

  // Cache management functions
  const showCacheInfo = () => {
    const info = agentCache.getInfo();
    console.log('📊 Agent Cache Info:', info);
    alert(`Cache Info:\nTotal Entries: ${info.totalEntries}\n\nEntries:\n${info.entries.map(e => 
      `${e.key}: ${e.isExpired ? 'EXPIRED' : `${e.remaining}s remaining`}`
    ).join('\n')}`);
  };

  const clearAllCache = () => {
    agentCache.clear();
    console.log('🧹 All cache cleared manually');
  };

  // Invalidate specific cache when actions occur
  const invalidateCacheOnAction = (actionType) => {
    switch (actionType) {
      case 'agent_update':
        agentCache.delete(CACHE_KEYS.AGENT_PROFILE);
        break;
      case 'escort_update':
        agentCache.delete(CACHE_KEYS.MY_ESCORTS);
        break;
      case 'chat_action':
        agentCache.delete(CACHE_KEYS.LIVE_QUEUE);
        agentCache.delete(CACHE_KEYS.DASHBOARD_STATS);
        break;
      case 'earnings_update':
        agentCache.delete(CACHE_KEYS.EARNINGS);
        agentCache.delete(CACHE_KEYS.DASHBOARD_STATS);
        break;
      default:
        break;
    }
  };

  const refreshDashboard = async () => {
    try {
      console.log('🔄 Manual dashboard refresh triggered - clearing cache');
      
      // Clear relevant cache entries
      agentCache.delete(CACHE_KEYS.DASHBOARD_STATS);
      agentCache.delete(CACHE_KEYS.LIVE_QUEUE);
      agentCache.delete(CACHE_KEYS.MY_ESCORTS);
      agentCache.delete(CACHE_KEYS.REMINDERS);

      // Fetch fresh data
      const [dashboardStats, liveQueue, escortData] = await Promise.all([
        agentAuth.getDashboardStats(),
        agentAuth.getLiveQueue(),
        agentAuth.getMyEscorts()
      ]);

      // Cache the fresh data
      agentCache.set(CACHE_KEYS.DASHBOARD_STATS, dashboardStats, CACHE_DURATIONS.MEDIUM);
      agentCache.set(CACHE_KEYS.LIVE_QUEUE, liveQueue, CACHE_DURATIONS.SHORT);
      agentCache.set(CACHE_KEYS.MY_ESCORTS, escortData, CACHE_DURATIONS.LONG);

      // Update stats
      setStats({
        liveMessages: dashboardStats.totalLiveMessages || 0,
        totalReminders: dashboardStats.reminders?.length || 0,
        sentMessages: dashboardStats.agentStats.totalMessagesSent || 0,
        onlineMembers: dashboardStats.onlineCustomers || 0
      });

      // Update chats
      setChats(liveQueue);
      setMyEscorts(escortData);
      setReminders(dashboardStats.reminders || []);

      // Update panic room count
      await updatePanicRoomCount();

      // Update user presence from fresh data
      const presenceMap = new Map();
      liveQueue.forEach(chat => {
        if (chat.customerId?._id) {
          presenceMap.set(chat.customerId._id.toString(), {
            isOnline: chat.isUserActive || false,
            lastSeen: chat.lastActive || chat.updatedAt,
            status: chat.isUserActive ? 'online' : 'offline'
          });
        }
      });
      setUserPresence(presenceMap);
      
      console.log('✅ Dashboard refreshed successfully with fresh data');
    } catch (error) {
      console.error('❌ Error refreshing dashboard:', error);
    }
  };

  const handlePanicRoomChatSelect = (chat) => {
    if (chat?.escortId?._id && chat?._id) {
      navigate(`/agent/live-queue/${chat.escortId._id}?chatId=${chat._id}`);
    }
  };

  // Watch live queue effect
  useEffect(() => {
    const watchLiveQueue = async () => {
      try {
        const response = await agentApi.get('/chats/live-queue');
        setChats(response.data);
      } catch (error) {
        console.error('Error fetching live queue:', error);
      }
    };

    watchLiveQueue();
    // Remove auto-polling - use manual refresh button instead
    // const interval = setInterval(watchLiveQueue, 30000); // Refresh every 30 seconds

    // return () => clearInterval(interval);
  }, []);

  // Calculate unread message count for sidebar badge (simplified - no reminders)
  const reminderCount = 0; // Removed reminder functionality

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-pink-50 flex items-center justify-center relative overflow-hidden">
        {/* Floating background shapes matching website */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-rose-50/60 to-pink-100/70"></div>
        <div className="absolute w-96 h-96 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-15 -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-80 h-80 bg-gradient-to-r from-pink-300 to-rose-300 rounded-full mix-blend-multiply filter blur-xl opacity-15 top-1/3 -right-40 animate-pulse"></div>
        <div className="absolute w-64 h-64 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-15 bottom-20 left-1/4 animate-pulse"></div>

        <div className="max-w-md w-full mx-auto relative z-10">
          <div className="glass-effect bg-white/20 backdrop-filter backdrop-blur-20 rounded-3xl shadow-2xl p-8 border border-white/30">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-900 via-pink-900 to-red-900 bg-clip-text text-transparent mb-2">Agent Dashboard</h2>
              <p className="text-gray-600">Initializing your workspace...</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span className="font-medium">Step {loadingStatus.step} of {loadingStatus.total}</span>
                <span className="font-bold text-rose-600">{loadingStatus.progress}%</span>
              </div>
              <div className="w-full bg-gray-200/50 rounded-full h-3 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-rose-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${loadingStatus.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Current Status */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-gray-800 font-semibold">{loadingStatus.message}</span>
              </div>
              <p className="text-gray-600 text-sm ml-6 italic">{loadingStatus.details}</p>
            </div>

            {/* Loading Steps Checklist */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Loading Steps:</h3>
              
              {[
                { step: 1, label: 'Server Connection', desc: 'WebSocket & Real-time services', icon: '🔗' },
                { step: 2, label: 'Agent Profile', desc: 'Your account & permissions', icon: '👤' },
                { step: 3, label: 'Services', desc: 'Notifications & monitoring', icon: '🔔' },
                { step: 4, label: 'Dashboard Stats', desc: 'Metrics & analytics', icon: '📊' },
                { step: 5, label: 'Live Queue', desc: 'Active conversations', icon: '💬' },
                { step: 6, label: 'Escort Profiles', desc: 'Your assigned profiles', icon: '👥' }
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3 p-2 rounded-lg bg-white/30 backdrop-filter backdrop-blur-10 border border-white/20">
                  <div className="flex-shrink-0">
                    {loadingStatus.step > item.step ? (
                      <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : loadingStatus.step === item.step ? (
                      <div className="w-6 h-6 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse shadow-lg text-white text-xs">
                        {item.icon}
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs">
                        {item.icon}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className={`font-semibold text-sm ${
                      loadingStatus.step > item.step ? 'text-green-700' :
                      loadingStatus.step === item.step ? 'text-gray-800' : 'text-gray-500'
                    }`}>
                      {item.label}
                    </span>
                    <div className={`text-xs ${
                      loadingStatus.step >= item.step ? 'text-gray-600' : 'text-gray-500'
                    }`}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Loading Animation */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-3 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-transparent bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"></div>
                <span className="text-sm font-medium">Preparing your agent environment...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        agent={agent} 
        reminderCount={reminderCount} 
        panicRoomCount={panicRoomCount} 
      />
      
      <div className="flex-1 lg:ml-0 ml-0 min-w-0">
        <div className="p-4 lg:p-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Agent Dashboard</h1>
              <button
                onClick={refreshDashboard}
                className="p-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 flex items-center gap-2 text-sm"
                title="Refresh Dashboard (Force Fresh Data)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
              </button>
              {/* Cache Debug Buttons - Only show in development */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  <button
                    onClick={showCacheInfo}
                    className="p-2 text-white bg-gray-600 rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm"
                    title="Show Cache Info"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">Cache</span>
                  </button>
                  <button
                    onClick={clearAllCache}
                    className="p-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm"
                    title="Clear All Cache"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <NotificationPanel 
                onNavigateToFirstContact={(customer) => {
                  setShowCreateFirstContact(true);
                  // Optional: set the customer as pre-selected
                }}
              />
              <NotificationBell 
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
              />
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Statistics Grid - Removed as requested */}
          
        {/* Live Queue Table */}
        {activeTab === 'dashboard' && (
          <LiveQueueTable 
            chats={chats}
            onAssign={handleAssignChat}
            onPushBack={handlePushBack}
            onOpenChat={handleOpenChat}
            onCreateFirstContact={handleCreateFirstContact}
            navigate={navigate}
            userPresence={userPresence}
          />
        )}

        {activeTab === 'escort profiles' && (
          <EscortProfilesTab 
            escorts={myEscorts}
            onAddNew={handleAddEscort}
            setSelectedEscortForImages={setSelectedEscortForImages}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {activeTab === 'chat queue' && (
          <div className="bg-gray-800 rounded-lg p-4 lg:p-6">
            <ChatQueueTab 
              chats={chats} 
              onOpenChat={handleOpenChat}
              navigate={navigate}
              userPresence={userPresence}
            />
          </div>
        )}
        
        {activeTab === 'earnings' && (
          <AgentEarnings agentId={agent?._id} />
        )}

        {activeTab === 'affiliates' && agent && (
          <AffiliateView agentId={agent._id || agent.agentId} />
        )}

        {activeTab === 'affiliates' && !agent && (
          <div className="p-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading agent data...</span>
            </div>
          </div>
        )}

        {activeTab === 'affiliate links' && (
          <AffiliateManager />
        )}

        {activeTab === 'chat statistics' && (
          <ChatStatistics agentId={agent?._id || agent?.id} />
        )}

        {activeTab === 'reminders' && (
          <ReminderSystem
            chats={chats}
            navigate={navigate}
            onMarkReminder={handleMarkReminderComplete}
            onSnoozeReminder={handleSnoozeReminder}
          />
        )}
        
        {activeTab === 'panic room' && (
          <PanicRoomTab 
            chats={chats}
            onAssign={handleAssignChat}
            onPushBack={handlePushBack}
            onOpenChat={handleOpenChat}
            navigate={navigate}
          />
        )}

        {activeTab === 'my assigned customers' && agent && (
          <AssignedCustomersTab 
            agentId={agent._id || agent.agentId || agent.id}
            navigate={navigate}
          />
        )}

        {activeTab === 'my assigned customers' && !agent && (
          <div className="p-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading agent data...</span>
            </div>
          </div>
        )}

        </div>
      </div>

      {/* CreateFirstContact Modal */}
      <AnimatePresence>
        {showCreateFirstContact && (
          <CreateFirstContact
            onClose={() => setShowCreateFirstContact(false)}
            onSuccess={refreshDashboard}
          />
        )}
      </AnimatePresence>

      {/* Escort Image Manager Modal */}
      <AnimatePresence>
        {selectedEscortForImages && (
          <EscortImageManager
            escort={selectedEscortForImages}
            onClose={() => setSelectedEscortForImages(null)}
            onUpdate={(updatedEscort) => {
              setMyEscorts(prev => 
                prev.map(escort => 
                  escort._id === updatedEscort._id ? updatedEscort : escort
                )
              );
              setSelectedEscortForImages(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentDashboard;