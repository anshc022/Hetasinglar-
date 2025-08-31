import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { agentAuth, agentApi } from '../../services/agentApi';
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
              {(agent?.name?.[0] || 'A').toUpperCase()}
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
            { 
              name: 'Dashboard', 
              icon: FaEye,
              badge: panicRoomCount + reminderCount,
              badgeColor: panicRoomCount > 0 ? 'bg-red-500' : 'bg-blue-500'
            },
            { name: 'Escort Profiles', icon: FaUsers },
            { name: 'Earnings', icon: FaDollarSign },
            { name: 'Affiliates', icon: FaUserTie },
            { name: 'Affiliate Links', icon: FaLink },
            { name: 'My Assigned Customers', icon: FaUserFriends },
            { name: 'Chat Statistics', icon: FaChartBar }
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

const LiveQueueTable = ({ chats, onAssign, onPushBack, onOpenChat, navigate, onCreateFirstContact, userPresence = new Map(), reminders = [] }) => {
  // Store the current chat index for sequential viewing
  const [currentChatIndex, setCurrentChatIndex] = useState(0);
  const [filterType, setFilterType] = useState('all'); // 'all', 'panic', 'reminders', 'queue'
  
  // Filter chats based on current filter - using chatType from backend
  const filteredChats = useMemo(() => {
    let allChats = Array.isArray(chats) ? [...chats] : [];
    
    // The backend now sends chatType field, so we don't need to manually process reminders
    // Just use the chats as they come from the backend
    
    // Apply filter type based on chatType from backend
    switch (filterType) {
      case 'panic':
        return allChats.filter(chat => chat.chatType === 'panic' || chat.isInPanicRoom);
      case 'reminders':
        return allChats.filter(chat => {
          const messageBasedUnreadCount = chat.messages?.filter(msg => 
            msg.sender === 'customer' && !msg.readByAgent
          ).length || 0;
          const unread = chat.unreadCount || messageBasedUnreadCount;
          if (unread > 0) return false; // exclude chats with unread
          // Treat undefined reminderHandled as handled (true) so it doesn't show as reminder
          const isUnhandledReminder = chat.reminderHandled === false;
          return (
            chat.chatType === 'reminder' ||
            chat.isReminder ||
            isUnhandledReminder ||
            !!chat.requiresFollowUp ||
            !!chat.reminderSnoozedUntil
          );
        });
      case 'queue':
        return allChats.filter(chat => chat.chatType === 'queue' && !chat.isInPanicRoom && 
          chat.chatType !== 'reminder');
      case 'unread':
        return allChats.filter(chat => {
          const unreadCount = chat.unreadCount || chat.messages?.filter(msg => 
            msg.sender === 'customer' && !msg.readByAgent
          ).length || 0;
          return unreadCount > 0;
        });
      default:
        // Only show active items: panic, unread, or valid reminder state
        return allChats.filter(chat => {
          const unread = chat.unreadCount || chat.messages?.filter(msg => 
            msg.sender === 'customer' && !msg.readByAgent
          ).length || 0;
          const isPanic = chat.chatType === 'panic' || chat.isInPanicRoom;
          const isReminder = (
            chat.reminderHandled === false ||
            !!chat.requiresFollowUp ||
            !!chat.reminderSnoozedUntil ||
            chat.chatType === 'reminder' ||
            chat.isReminder
          ) && unread === 0;
          return isPanic || unread > 0 || isReminder;
        });
    }
  }, [chats, filterType]);

  // Sort chats to always show unread messages on top (Panic first, then unread)
  const sortedChats = useMemo(() => {
    if (!Array.isArray(filteredChats)) return [];
    return [...filteredChats].sort((a, b) => {
      // 1) Panic room always first
      const aPanic = a.chatType === 'panic' || a.isInPanicRoom;
      const bPanic = b.chatType === 'panic' || b.isInPanicRoom;
      if (aPanic && !bPanic) return -1;
      if (!aPanic && bPanic) return 1;

      // 2) Unread messages next (always show unread on top)
      const aUnread = a.unreadCount || a.messages?.filter(msg => msg.sender === 'customer' && !msg.readByAgent).length || 0;
      const bUnread = b.unreadCount || b.messages?.filter(msg => msg.sender === 'customer' && !msg.readByAgent).length || 0;
      const aHasUnread = aUnread > 0;
      const bHasUnread = bUnread > 0;
      if (aHasUnread && !bHasUnread) return -1;
      if (!aHasUnread && bHasUnread) return 1;

      // If both have unread, sort by unread count desc
      if (aHasUnread && bHasUnread && aUnread !== bUnread) {
        return bUnread - aUnread;
      }

      // 3) Use backend priority to break ties (higher first)
      if (a.priority && b.priority && a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      // 4) As a minor fallback, prefer reminders before generic queue when none have unread
      if (a.chatType === 'reminder' && b.chatType === 'queue') return -1;
      if (a.chatType === 'queue' && b.chatType === 'reminder') return 1;

      // 5) Finally, order by most recent activity/message
      const aLastMessage = a.lastMessage?.timestamp || a.messages?.[a.messages.length - 1]?.timestamp || a.updatedAt || a.lastActive || a.createdAt;
      const bLastMessage = b.lastMessage?.timestamp || b.messages?.[b.messages.length - 1]?.timestamp || b.updatedAt || b.lastActive || b.createdAt;
      return new Date(bLastMessage) - new Date(aLastMessage);
    });
  }, [filteredChats]);

  // Function to get user presence status
  const getUserPresence = (userId) => {
    if (!userId) return { isOnline: false, lastSeen: null };
    const presence = userPresence.get(userId.toString());
    return presence || { isOnline: false, lastSeen: null };
  };

  // Function to handle Watch Live click - only for regular queue items (not panic room or reminders)
  const handleWatchLiveClick = () => {
    const autoQueueChats = Array.isArray(sortedChats) ? sortedChats.filter(chat => 
      chat.chatType === 'queue' && !chat.isInPanicRoom && chat.chatType !== 'reminder'
    ) : [];
    if (autoQueueChats.length === 0) return;
    
    const currentChat = autoQueueChats[currentChatIndex];
    if (currentChat?.escortId?._id) {
      navigate(`/agent/live-queue/${currentChat.escortId._id}?chatId=${currentChat._id}&queue=${encodeURIComponent(JSON.stringify(autoQueueChats.map(c => c._id)))}&index=${currentChatIndex}`);
    }
  };

  // Function to assign current agent to a chat
  const handleAssignAgent = async (chatId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/agent/chats/${chatId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Agent assigned successfully:', result);
        
        // Refresh the live queue data to show the updated assignment
        if (window.fetchLiveQueueData) {
          window.fetchLiveQueueData();
        }
        
        // Show success message
        alert('You have been assigned to this chat successfully!');
      } else {
        const error = await response.json();
        console.error('Failed to assign agent:', error);
        alert('Failed to assign agent: ' + error.message);
      }
    } catch (error) {
      console.error('Error assigning agent:', error);
      alert('Error assigning agent. Please try again.');
    }
  };

  // Count different types of chats using both new chatType and legacy fields
  const panicRoomCount = Array.isArray(sortedChats) ? sortedChats.filter(chat => chat.chatType === 'panic' || chat.isInPanicRoom).length : 0;
  // Only count reminders when there are NO unread customer messages
  const reminderCount = Array.isArray(sortedChats) ? sortedChats.filter(chat => {
    const messageBasedUnreadCount = chat.messages?.filter(msg => 
      msg.sender === 'customer' && !msg.readByAgent
    ).length || 0;
    const unread = chat.unreadCount || messageBasedUnreadCount;
    if (unread > 0) return false;
    return (chat.chatType === 'reminder' || chat.isReminder || chat.reminderHandled === false || chat.requiresFollowUp || chat.reminderSnoozedUntil);
  }).length : 0;
  const queueCount = Array.isArray(sortedChats) ? sortedChats.filter(chat => 
    (chat.chatType === 'queue' || (!chat.chatType && !chat.isInPanicRoom && !chat.isReminder)) &&
    !chat.isInPanicRoom && chat.chatType !== 'panic' && chat.chatType !== 'reminder'
  ).length : 0;
  const unreadCount = Array.isArray(sortedChats) ? sortedChats.filter(chat => {
    const unread = chat.unreadCount || chat.messages?.filter(msg => 
      msg.sender === 'customer' && !msg.readByAgent
    ).length || 0;
    return unread > 0;
  }).length : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-2 md:p-4 shadow-lg overflow-x-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg md:text-xl font-semibold text-white">Live Dashboard</h2>
          
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs md:text-sm transition-colors ${
                filterType === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All ({Array.isArray(sortedChats) ? sortedChats.length : 0})
            </button>
            {panicRoomCount > 0 && (
              <button 
                onClick={() => setFilterType('panic')}
                className={`px-3 py-1 rounded-lg text-xs md:text-sm transition-colors shadow-sm ${
                  filterType === 'panic' 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/25' 
                    : 'bg-gradient-to-r from-red-900/30 to-red-800/20 text-red-300 hover:from-red-800/40 hover:to-red-700/30 border border-red-500/30'
                }`}
              >
                🚨 Panic Room ({panicRoomCount})
              </button>
            )}
            {reminderCount > 0 && (
              <button 
                onClick={() => setFilterType('reminders')}
                className={`px-3 py-1 rounded-lg text-xs md:text-sm transition-colors shadow-sm ${
                  filterType === 'reminders' 
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-amber-500/25' 
                    : 'bg-gradient-to-r from-amber-900/30 to-yellow-800/20 text-amber-300 hover:from-amber-800/40 hover:to-yellow-700/30 border border-amber-500/30'
                }`}
              >
                ⏰ Reminders ({reminderCount})
              </button>
            )}
            {queueCount > 0 && (
              <button 
                onClick={() => setFilterType('queue')}
                className={`px-3 py-1 rounded-lg text-xs md:text-sm transition-colors shadow-sm ${
                  filterType === 'queue' 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/25' 
                    : 'bg-gradient-to-r from-cyan-900/25 to-blue-800/15 text-cyan-300 hover:from-cyan-800/35 hover:to-blue-700/25 border border-cyan-500/30'
                }`}
              >
                💬 Queue ({queueCount})
              </button>
            )}
            {unreadCount > 0 && (
              <button 
                onClick={() => setFilterType('unread')}
                className={`px-3 py-1 rounded-lg text-xs md:text-sm transition-colors shadow-sm ${
                  filterType === 'unread' 
                    ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-purple-500/25' 
                    : 'bg-gradient-to-r from-purple-900/25 to-violet-800/15 text-purple-300 hover:from-purple-800/35 hover:to-violet-700/25 border border-purple-500/30'
                }`}
              >
                📨 Unread ({unreadCount})
              </button>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            onClick={onCreateFirstContact}
            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 text-xs md:text-base"
          >
            <FaPlus />
            <span>Create First Contact</span>
          </button>
          {queueCount > 0 && (
            <button 
              onClick={handleWatchLiveClick}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 text-xs md:text-base"
            >
              <FaEye />
              <span>Watch Live Queue</span>
              {queueCount > 1 && (
                <span className="text-xs bg-blue-600 px-2 py-1 rounded-full">
                  {currentChatIndex + 1}/{queueCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700 text-xs md:text-sm">
          <thead className="bg-gray-900 text-gray-400 uppercase">
            <tr>
              <th className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap">User / Last Message</th>
              <th className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap">Escort Profile</th>
              <th className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap">Assigned Agent</th>
              <th className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap">Status</th>
              <th className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap">Unread Messages</th>
              <th className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap">Last Active</th>
              <th className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-300 divide-y divide-gray-700">
            {Array.isArray(sortedChats) && sortedChats.length > 0 ? sortedChats.map((chat) => {
              // Use consistent unread count calculation
              const messageBasedUnreadCount = chat.messages?.filter(msg => 
                msg.sender === 'customer' && !msg.readByAgent
              ).length || 0;
              const unreadCount = chat.unreadCount || messageBasedUnreadCount;
              const isReminderState = ((chat.chatType === 'reminder' || chat.isReminder || chat.reminderHandled === false || chat.requiresFollowUp || chat.reminderSnoozedUntil) && unreadCount === 0);
              
              const lastMessage = chat.lastMessage || chat.messages?.[chat.messages.length - 1];
              const userPresence = getUserPresence(chat.customerId?._id);
              
              // Determine row styling based on chat type - use both new chatType and legacy fields
              let rowStyling = 'border-l-4 hover:bg-gray-700/30 transition-colors';
              if (chat.chatType === 'panic' || chat.isInPanicRoom) {
                rowStyling += ' border-red-400 bg-gradient-to-r from-red-900/30 to-red-800/20';
              } else if ((chat.chatType === 'reminder' || chat.isReminder || 
                         chat.reminderHandled === false || chat.requiresFollowUp || chat.reminderSnoozedUntil) && unreadCount === 0) {
                rowStyling += ' border-amber-400 bg-gradient-to-r from-amber-900/30 to-yellow-800/20';
              } else {
                rowStyling += ' border-cyan-400 bg-gradient-to-r from-cyan-900/25 to-blue-800/15';
              }
              
              return (
                <tr key={chat._id} className={rowStyling}>
                  <td className="px-2 py-2 md:px-4 md:py-3 min-w-[160px] align-top">
                    <div className="flex items-start gap-2 md:gap-3 flex-col md:flex-row">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${userPresence.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                        {userPresence.isOnline && (
                          <span className="text-xs text-green-400">Online</span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`font-medium ${
                          chat.isInPanicRoom ? 'text-red-300 drop-shadow-sm' : 
                          isReminderState ? 'text-amber-300 drop-shadow-sm' : 
                          'text-cyan-100'
                        }`}>
                          {chat.customerId?.username || chat.customerName}
                        </span>
                        
                        {/* Status badges */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(chat.chatType === 'panic' || chat.isInPanicRoom) && (
                            <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2 py-1 rounded-full shadow-lg shadow-red-500/30 animate-pulse">
                              🚨 PANIC ROOM
                            </span>
                          )}
                          {isReminderState && (
                            <span className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-xs px-2 py-1 rounded-full shadow-md shadow-amber-500/30">
                              ⏰ REMINDER
                            </span>
                          )}
                        </div>
                        
                        {/* Additional info for panic room */}
                        {(chat.chatType === 'panic' || chat.isInPanicRoom) && chat.panicRoomReason && (
                          <span className="text-xs text-red-400 mt-1 font-medium">
                            Reason: {chat.panicRoomReason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        )}
                        
                        {/* Additional info for reminders */}
                        {(isReminderState || chat.chatType === 'reminder') && chat.reminderDue && unreadCount === 0 && (
                          <span className="text-xs text-amber-400 mt-1 font-medium">
                            Due: {formatDistanceToNow(new Date(chat.reminderDue), { addSuffix: true })}
                          </span>
                        )}
                        
                        {/* Message status indicators */}
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
                  <td className="px-2 py-2 md:px-4 md:py-3 min-w-[100px] align-top">
                    <div className="flex flex-col">
                      {chat.assignedAgent ? (
                        <>
                          <span className={`block font-medium truncate text-xs ${
                            chat.assignedAgent.isFromMessage 
                              ? 'text-amber-300' 
                              : 'text-cyan-200'
                          }`}>
                            {chat.assignedAgent.name}
                          </span>
                          {chat.assignedAgent.agentId && chat.assignedAgent.agentId !== 'Unknown' && (
                            <span className="text-xs text-gray-400 truncate">
                              ID: {chat.assignedAgent.agentId}
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-red-400">Unassigned</span>
                          <button
                            onClick={() => handleAssignAgent(chat._id)}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                            title="Assign to me"
                          >
                            Assign to me
                          </button>
                        </div>
                      )}
                    </div>
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
                      <span className="px-2 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full text-xs w-fit shadow-sm">
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
                          {isReminderState ? 'Handle Reminder' : unreadCount > 0 ? 'View Messages' : 'Open Chat'}
                        </span>
                      </button>
                      {!isReminderState && (
                        <button 
                          onClick={() => onPushBack(chat._id)}
                          className="p-2 bg-yellow-500 rounded-lg hover:bg-yellow-600 text-xs md:text-sm"
                          title="Push Back Chat"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="7" className="px-2 py-8 text-center text-gray-400">
                  {filterType === 'panic' && 'No panic room chats'}
                  {filterType === 'reminders' && 'No pending reminders'}
                  {filterType === 'queue' && 'No unread messages in queue'}
                  {filterType === 'unread' && 'No unread messages'}
                  {filterType === 'all' && 'No active chats, reminders, or panic room items'}
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
  // Chats to hide after agent reply (until customer replies again)
  const [suppressedChatIds, setSuppressedChatIds] = useState(new Set());
  
  const socketRef = useRef(null);

  // Initialize websocket connection
  useEffect(() => {
    // Fetch agent profile data
    const fetchAgentProfile = async () => {
      try {
        const agentData = await agentAuth.getProfile();
        setAgent(agentData);
      } catch (error) {
        console.error('Failed to fetch agent profile:', error);
      }
    };
    
    fetchAgentProfile();

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
        // Refresh live queue data
        if (window.fetchLiveQueueData) {
          window.fetchLiveQueueData();
        }
      }
      
  if (data.type === 'chat_message') {
        // Update chat in real-time when new messages arrive
        setChats(prevChats => {
          const updatedList = prevChats.map(chat => {
            if (chat._id === data.chatId) {
              const newMessage = {
                sender: data.sender,
                message: data.message,
                messageType: data.messageType || 'text',
                timestamp: data.timestamp,
                readByAgent: data.readByAgent || false,
                readByCustomer: data.readByCustomer || false,
                imageData: data.imageData,
                mimeType: data.mimeType,
                filename: data.filename
              };

              const updatedMessages = [...(chat.messages || []), newMessage];

              // Calculate unread count for customer messages
              const unreadCount = updatedMessages.filter(msg =>
                msg.sender === 'customer' && !msg.readByAgent
              ).length;

              const updatedChat = {
                ...chat,
                messages: updatedMessages,
                updatedAt: data.timestamp,
                lastActive: data.timestamp,
                // Update fields that the table displays
                unreadCount,
                hasNewMessages: unreadCount > 0,
                lastMessage: {
                  message: newMessage.messageType === 'image' ? '📷 Image' : newMessage.message,
                  messageType: newMessage.messageType,
                  sender: newMessage.sender,
                  timestamp: newMessage.timestamp,
                  readByAgent: newMessage.readByAgent
                },
                // Update last customer response if message is from customer
                ...(data.sender === 'customer' && {
                  lastCustomerResponse: data.timestamp
                }),
                // Update last agent response if message is from agent
                ...(data.sender === 'agent' && {
                  lastAgentResponse: data.timestamp
                })
              };

              // Ensure reminder is cleared immediately on agent reply
              if (data.sender === 'agent') {
                updatedChat.reminderHandled = true;
                updatedChat.reminderHandledAt = data.timestamp;
                updatedChat.reminderSnoozedUntil = undefined;
                updatedChat.requiresFollowUp = false;
              }

              console.log(`💬 Updated chat ${chat._id} with new message from ${data.sender}:`, {
                chatId: updatedChat._id,
                unreadCount: updatedChat.unreadCount,
                hasNewMessages: updatedChat.hasNewMessages,
                messagesLength: updatedChat.messages?.length,
                lastMessage: updatedChat.lastMessage
              });
              return updatedChat;
            }
            return chat;
          });

          // Requirement: once agent replies, remove the chat from the table (reminders, unread, and queue)
          const listAfterRemoval = data.sender === 'agent'
            ? updatedList.filter(c => c._id !== data.chatId)
            : updatedList;

          return listAfterRemoval;
        });

        // Maintain suppression map so refreshed data doesn't re-add the chat
        if (data.sender === 'agent') {
          setSuppressedChatIds(prev => {
            const next = new Set(prev);
            next.add(data.chatId);
            return next;
          });
        } else if (data.sender === 'customer') {
          // Customer replied again; allow chat to reappear
          setSuppressedChatIds(prev => {
            if (!prev.has(data.chatId)) return prev;
            const next = new Set(prev);
            next.delete(data.chatId);
            return next;
          });
        }

        // Refresh only for customer messages; agent messages already optimistically removed
        if (data.sender === 'customer') {
          console.log('🔄 Refreshing live queue due to customer message');
          if (window.fetchLiveQueueData) {
            setTimeout(() => window.fetchLiveQueueData(), 200);
          }
        }
      }
      
      if (data.type === 'messages_read') {
        // Update read status in real-time
        setChats(prevChats => {
          return prevChats.map(chat => {
            if (chat._id === data.chatId) {
              const updatedMessages = chat.messages.map(msg => ({
                ...msg,
                readByAgent: data.readBy === 'agent' ? true : msg.readByAgent,
                readByCustomer: data.readBy === 'customer' ? true : msg.readByCustomer
              }));
              
              // Recalculate unread count after read status update
              const unreadCount = updatedMessages.filter(msg => 
                msg.sender === 'customer' && !msg.readByAgent
              ).length;
              
              const updatedChat = {
                ...chat,
                messages: updatedMessages,
                unreadCount: unreadCount,
                hasNewMessages: unreadCount > 0
              };
              
              console.log(`👁️ Updated read status for chat ${chat._id}, unread count: ${unreadCount}`);
              return updatedChat;
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
    const unsubscribeOutgoing = websocketService.onOutgoing((out) => {
      if (out.type === 'chat_message' && out.sender === 'agent' && out.chatId) {
        // Optimistic remove: instantly drop from table
        setChats(prev => prev.filter(c => c._id !== out.chatId));
        setSuppressedChatIds(prev => {
          const next = new Set(prev);
          next.add(out.chatId);
          return next;
        });
      }
    });
    
    console.log('Connected to dashboard websockets');
    
    // Clean up on unmount
    return () => {
  unsubscribeMessage();
  unsubscribePresence();
  unsubscribeOutgoing && unsubscribeOutgoing();
      websocketService.disconnect();
      notificationService.stopMonitoring();
    };
  }, []);

  // Fetch initial dashboard data - OPTIMIZED with caching
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Check cache first for faster loading
        const cacheService = window.agentCacheService || { get: () => null, set: () => {} };
        
        const cachedDashboard = cacheService.get('dashboard_stats');
        const cachedQueue = cacheService.get('live_queue');
        const cachedEscorts = cacheService.get('my_escorts');

        // If we have cached data, use it immediately for fast UI
        if (cachedDashboard && cachedQueue && cachedEscorts) {
          console.log('🚀 Using cached dashboard data for instant loading');
          
          setStats({
            liveMessages: cachedDashboard.totalLiveMessages || 0,
            totalReminders: cachedDashboard.reminders?.length || 0,
            sentMessages: cachedDashboard.agentStats.totalMessagesSent || 0,
            onlineMembers: cachedDashboard.onlineCustomers || 0
          });
          setChats(cachedQueue);
          setMyEscorts(cachedEscorts);
          setReminders(cachedDashboard.reminders || []);
          
          setLoading(false); // Show UI immediately with cached data
        }

        // Fetch fresh data (this will update the UI if data has changed)
  const [dashboardStats, liveQueueRaw, escortData] = await Promise.all([
          agentAuth.getDashboardStats(),
          agentAuth.getLiveQueue(),
          agentAuth.getMyEscorts()
        ]);
  const liveQueue = Array.isArray(liveQueueRaw) ? liveQueueRaw : (Array.isArray(liveQueueRaw?.data) ? liveQueueRaw.data : []);

        // Cache the fresh data
        cacheService.set('dashboard_stats', dashboardStats, 2 * 60 * 1000); // 2 min cache
        cacheService.set('live_queue', liveQueue, 1 * 60 * 1000); // 1 min cache
        cacheService.set('my_escorts', escortData, 5 * 60 * 1000); // 5 min cache

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

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        if (error.response && error.response.status === 401) {
          navigate('/agent/login');
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchLiveQueueData = async () => {
      try {
        const response = await agentApi.get('/chats/live-queue-updates');
        const data = response?.data ?? {};
        const liveQueue = Array.isArray(data.liveQueue)
          ? data.liveQueue
          : Array.isArray(data)
            ? data
            : [];
        const metadata = data.metadata || {};

        setChats((Array.isArray(liveQueue) ? liveQueue : []).map(item => ({
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
          reminderHandled: typeof item.reminderHandled === 'boolean' ? item.reminderHandled : true,
          reminderSnoozedUntil: item.reminderSnoozedUntil,
          unreadCount: item.unreadCount,
          hasUnreadAgentMessages: item.hasUnreadAgentMessages,
          lastMessage: item.lastMessage
        })));

        // Update presence data
        const presenceMap = new Map();
        (Array.isArray(liveQueue) ? liveQueue : []).forEach(item => {
          if (item.customerId) {
            presenceMap.set(item.customerId.toString(), item.presence);
          }
        });
        setUserPresence(presenceMap);

        // Update stats
        setStats(prev => ({
          ...prev,
          onlineMembers: metadata.activeUsers || 0,
          liveMessages: metadata.totalChats || 0
        }));

        setPanicRoomCount(metadata.panicRoomCount || 0);

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
  }, [navigate, activeTab]);

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
      // The websocket will handle updating the UI
    } catch (error) {
      console.error('Failed to assign chat:', error);
    }
  };

  const handlePushBack = async (chatId) => {
    try {
      const hours = 2; // Default pushback time (2 hours)
      await agentAuth.pushBackChat(chatId, hours);
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

  const handleDeleteProfile = (deletedId) => {
    setMyEscorts(prev => prev.filter(e => e._id !== deletedId));
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

  const refreshDashboard = async () => {
    try {
      console.log('Refreshing dashboard...');
      
      // Fetch all dashboard data
  const [dashboardStats, liveQueueRaw, escortData] = await Promise.all([
        agentAuth.getDashboardStats(),
        agentAuth.getLiveQueue(),
        agentAuth.getMyEscorts()
      ]);
  const liveQueue = Array.isArray(liveQueueRaw) ? liveQueueRaw : (Array.isArray(liveQueueRaw?.data) ? liveQueueRaw.data : []);

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
      
      console.log('Dashboard refreshed successfully');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
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
  const response = await agentAuth.getLiveQueue();
  const liveQueue = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : []);
        setChats(liveQueue);
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

  // Only show non-suppressed chats in the table
  const visibleChats = useMemo(() => {
    if (!Array.isArray(chats)) return [];
    if (!suppressedChatIds || suppressedChatIds.size === 0) return chats;
    return chats.filter(c => !suppressedChatIds.has(c._id));
  }, [chats, suppressedChatIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 via-rose-200 to-pink-100 flex items-center justify-center">
        <div className="text-2xl text-rose-600 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-rose-200 border-t-rose-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-rose-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold mb-2">Loading Agent Dashboard</div>
            <div className="text-sm text-rose-500 animate-pulse">Fetching your latest data...</div>
          </div>
          <div className="w-64 bg-rose-200 rounded-full h-2">
            <div className="bg-rose-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
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
                title="Refresh Dashboard"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
              </button>
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
          
        {/* Live Dashboard - shows all chats, reminders, and panic room in one table */}
    {activeTab === 'dashboard' && (
          <LiveQueueTable 
      chats={visibleChats}
            reminders={reminders}
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
            onDeleteProfile={handleDeleteProfile}
          />
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