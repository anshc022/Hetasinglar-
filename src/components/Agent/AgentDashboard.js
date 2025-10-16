import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { likeService } from '../../services/likeService';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { agentAuth, agentApi } from '../../services/agentApi';
import AgentEarnings from './AgentEarnings';
import AffiliateView from './AffiliateView';
import AffiliateManager from './AffiliateManager';
import ChatStatistics from './ChatStatistics';
import CreateFirstContact from './CreateFirstContact';
import NotificationPanel from './NotificationPanel';
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
  FaLink,
  FaTrash,
  FaClock
} from 'react-icons/fa';
import websocketService from '../../services/websocket';
import notificationService from '../../services/notificationService';
import { format, differenceInHours, formatDistanceToNow } from 'date-fns';

const Sidebar = ({ activeTab, setActiveTab, agent, panicRoomCount = 0 }) => {
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
              badge: panicRoomCount,
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
                        notif.type === 'like' ? 'bg-pink-500' :
                        notif.severity === 'high' ? 'bg-red-500' :
                        notif.severity === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <div>
                        {notif.type === 'like' ? (
                          <>
                            <p className="text-white">
                              {notif.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notif.timestamp && !isNaN(new Date(notif.timestamp))
                                ? formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })
                                : 'Date unavailable'
                              }
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-white">
                              <span className="font-semibold">{notif.customerName}</span> needs a follow-up
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                              Last message: {notif.lastMessage}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Due: {notif.followUpDue && !isNaN(new Date(notif.followUpDue)) 
                                ? formatDistanceToNow(new Date(notif.followUpDue), { addSuffix: true })
                                : notif.timestamp && !isNaN(new Date(notif.timestamp))
                                ? formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })
                                : 'Date unavailable'
                              }
                            </p>
                          </>
                        )}
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

const LiveQueueTable = ({ chats, onAssign, onPushBack, onRemoveFromTable, onOpenChat, navigate, onCreateFirstContact, userPresence = new Map(), likes = [], onMarkLikeAsRead, onDeleteLike, onStartChatFromLike, fetchLikesData, likesLoading }) => {
  // Store the current chat index for sequential viewing
  const [currentChatIndex, setCurrentChatIndex] = useState(0);
  const [filterType, setFilterType] = useState('all'); // 'all', 'panic', 'queue', 'unread', 'reminders', 'likes'
  
  // Delete last agent message in this chat (soft delete)
  const handleDeleteLastAgentMessage = async (chat) => {
    try {
      if (!chat?._id) return;
      const confirmDelete = window.confirm('Delete your last sent message for this chat?');
      if (!confirmDelete) return;

      // Fetch full chat to get message IDs and authorship
      const fullChat = await agentAuth.getChat(chat._id);
      const messages = Array.isArray(fullChat?.messages) ? fullChat.messages : [];
      // Find the last agent-authored, non-deleted message
      let lastIdx = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (m?.sender === 'agent' && !m?.isDeleted) {
          lastIdx = i;
          break;
        }
      }
      if (lastIdx === -1) {
        alert('No deletable agent message found.');
        return;
      }

  const messageIdOrIndex = messages[lastIdx]?._id || String(lastIdx);
  await agentAuth.deleteMessage(chat._id, messageIdOrIndex);

      // Optimistically update UI if we have messages in state
      // Otherwise, refresh live queue data
      if (window.fetchLiveQueueData) {
        setTimeout(() => window.fetchLiveQueueData(), 150);
      }
    } catch (error) {
      console.error('Delete last message failed:', error);
      const msg = error?.message || error?.response?.data?.message || 'Failed to delete message';
      alert(msg);
    }
  };

  // Move chat to Panic Room or remove from it
  const handleTogglePanicRoom = async (chat) => {
    try {
      if (!chat?._id) return;
      if (chat.isInPanicRoom || chat.chatType === 'panic') {
        const confirmRemove = window.confirm('Remove this chat from Panic Room?');
        if (!confirmRemove) return;
        await agentAuth.removeFromPanicRoom(chat._id, 'Removed via dashboard');
      } else {
        // Ask for a reason (simple prompt for now)
        const reason = window.prompt('Reason for Panic Room (e.g., AGENT_ESCALATION, ABUSE, FRAUD):', 'AGENT_ESCALATION') || 'AGENT_ESCALATION';
        const notes = window.prompt('Optional notes for Panic Room:', '') || undefined;
        await agentAuth.moveToPanicRoom(chat._id, reason, notes);
      }

      if (window.fetchLiveQueueData) {
        setTimeout(() => window.fetchLiveQueueData(), 150);
      }
    } catch (error) {
      console.error('Panic Room action failed:', error);
      const msg = error?.message || error?.response?.data?.message || 'Failed to update Panic Room';
      alert(msg);
    }
  };
  
  // Filter chats based on current filter - using chatType from backend
  const filteredChats = useMemo(() => {
    let allChats = Array.isArray(chats) ? [...chats] : [];
    
    // Apply filter type based on chatType from backend
    switch (filterType) {
      case 'panic':
        return allChats.filter(chat => chat.chatType === 'panic' || chat.isInPanicRoom);
      case 'queue':
        return allChats.filter(chat => {
          const unread = chat.unreadCount || 0;
          const lastMsg = chat.lastMessage;
          const needsResponseFromCustomer = lastMsg?.sender === 'customer';
          return (
            chat.chatType === 'queue' &&
            !chat.isInPanicRoom &&
            (unread > 0 || needsResponseFromCustomer)
          );
        });
      case 'unread':
        return allChats.filter(chat => {
          const unreadCount = chat.unreadCount || 0;
          return unreadCount > 0;
        });
      case 'reminders':
        return allChats.filter(chat => {
          const unread = chat.unreadCount || 0;
          return (chat.chatType === 'reminder' || chat.reminderActive) && 
                 unread === 0 && 
                 !chat.isInPanicRoom && 
                 chat.reminderHandled !== true;
        });
      case 'likes':
        // Show likes instead of chats
        return [];
      default:
        // Show active items: panic, unread, needs-response, reminders (no unread) 
        return allChats.filter(chat => {
          const unread = chat.unreadCount || 0;
          const isPanic = chat.chatType === 'panic' || chat.isInPanicRoom;
          const needsResponse = chat.lastMessage?.sender === 'customer';
          const isReminder = (chat.chatType === 'reminder' || chat.reminderActive) && 
                           unread === 0 && 
                           chat.reminderHandled !== true;
          return isPanic || unread > 0 || needsResponse || isReminder;
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

      // 3) Reminder chats (no unread) should appear after unread but before normal queue
      const aReminder = (a.chatType === 'reminder' || a.reminderActive) && 
                       aUnread === 0 && 
                       !aPanic && 
                       a.reminderHandled !== true;
      const bReminder = (b.chatType === 'reminder' || b.reminderActive) && 
                       bUnread === 0 && 
                       !bPanic && 
                       b.reminderHandled !== true;
      if (aReminder && !bReminder) return -1;
      if (!aReminder && bReminder) return 1;
      if (aReminder && bReminder) {
        // Older (longer inactivity) first: use hoursSinceLastCustomer desc
        const aHours = a.hoursSinceLastCustomer || 0;
        const bHours = b.hoursSinceLastCustomer || 0;
        if (aHours !== bHours) return bHours - aHours;
      }

      // 4) Use backend priority to break ties (higher first)
      if (a.priority && b.priority && a.priority !== b.priority) {
        return b.priority - a.priority;
      }

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

  // Function to handle Watch Now click - starts with first unread chat and auto-advances
  const handleWatchNowClick = () => {
    // Get all chats that need attention (broader criteria)
    const watchableChats = Array.isArray(sortedChats) ? sortedChats.filter(chat => {
      const unread = chat.unreadCount || 0;
      const hasUnreadMessages = chat.hasUnreadAgentMessages === false;
      const lastMessageFromCustomer = chat.lastMessage?.sender === 'customer';
      const notInPanicRoom = !chat.isInPanicRoom && chat.chatType !== 'panic';
      
      return notInPanicRoom && (
        unread > 0 || 
        hasUnreadMessages || 
        lastMessageFromCustomer ||
        chat.chatType === 'queue' ||
        chat.chatType === 'unread'
      );
    }) : [];
    
    if (watchableChats.length === 0) {
      alert('No chats available to watch');
      return;
    }
    
    // Always start with the first chat (highest priority)
    const firstChat = watchableChats[0];
    if (firstChat?.escortId?._id) {
      navigate(`/agent/live-queue/${firstChat.escortId._id}?chatId=${firstChat._id}&queue=${encodeURIComponent(JSON.stringify(watchableChats.map(c => c._id)))}&index=0&autoAdvance=true`);
    }
  };

  // Function to assign current agent to a chat
  const handleAssignAgent = async (chatId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/agent/chats/${chatId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('agentToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        
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

  // Base array for counts (all chats returned from server)
  const baseChats = Array.isArray(chats) ? chats : [];
  const panicRoomCount = baseChats.filter(c => c.chatType === 'panic' || c.isInPanicRoom).length;
  // Queue: chats with unreadCount > 0 (chatType 'queue') – excludes panic
  const queueCount = baseChats.filter(c => !c.isInPanicRoom && c.chatType === 'queue').length;
  // Unread: same definition for now (distinct logic could be added later if needed)
  const unreadCount = baseChats.filter(c => !c.isInPanicRoom && (c.unreadCount || 0) > 0).length;
  // Reminders: active reminder, no unread, not panic, and not handled by agent
  const reminderCount = baseChats.filter(c => 
    !c.isInPanicRoom && 
    (c.chatType === 'reminder' || c.reminderActive) && 
    (c.unreadCount || 0) === 0 && 
    c.reminderHandled !== true
  ).length;

  // Calculate total actionable chats (excluding idle chats, avoiding double counting)
  const actionableChats = baseChats.filter(c => {
    // Panic room chats
    if (c.chatType === 'panic' || c.isInPanicRoom) return true;
    
    // Skip panic room chats for other categories
    if (c.isInPanicRoom) return false;
    
    // Queue/Unread chats (unread messages)
    if ((c.unreadCount || 0) > 0) return true;
    
    // Active reminders that haven't been handled
    if ((c.chatType === 'reminder' || c.reminderActive) && 
        (c.unreadCount || 0) === 0 && 
        c.reminderHandled !== true) return true;
    
    return false;
  });
  const totalActionableCount = actionableChats.length;

  // Extract reminder chats for separate alert table (always from original chats order before sorting modifications for display clarity)
  const reminderChats = Array.isArray(chats) ? chats.filter(chat => {
    const unread = chat.unreadCount || 0;
    return (chat.chatType === 'reminder' || chat.reminderActive) && 
           unread === 0 && 
           !chat.isInPanicRoom && 
           chat.reminderHandled !== true;
  }).sort((a,b) => (b.hoursSinceLastCustomer || 0) - (a.hoursSinceLastCustomer || 0)) : [];

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
              All ({totalActionableCount})
            </button>
            <button 
              onClick={() => setFilterType('panic')}
              className={`px-3 py-1 rounded-lg text-xs md:text-sm transition-colors shadow-sm ${
                filterType === 'panic' 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/25' 
                  : 'bg-gradient-to-r from-red-900/30 to-red-800/20 text-red-300 hover:from-red-800/40 hover:to-red-700/30 border border-red-500/30'
              } ${panicRoomCount === 0 ? 'opacity-60' : ''}`}
              disabled={panicRoomCount === 0}
            >
              🚨 Panic Room ({panicRoomCount})
            </button>
            <button 
              onClick={() => setFilterType('queue')}
              className={`px-3 py-1 rounded-lg text-xs md:text-sm transition-colors shadow-sm ${
                filterType === 'queue' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/25' 
                  : 'bg-gradient-to-r from-cyan-900/25 to-blue-800/15 text-cyan-300 hover:from-cyan-800/35 hover:to-blue-700/25 border border-cyan-500/30'
              } ${queueCount === 0 ? 'opacity-60' : ''}`}
              disabled={queueCount === 0}
            >
              💬 Queue ({queueCount})
            </button>
            <button 
              onClick={() => setFilterType('unread')}
              className={`px-3 py-1 rounded-lg text-xs md:text-sm transition-colors shadow-sm ${
                filterType === 'unread' 
                  ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-purple-500/25' 
                  : 'bg-gradient-to-r from-purple-900/25 to-violet-800/15 text-purple-300 hover:from-purple-800/35 hover:to-violet-700/25 border border-purple-500/30'
              } ${unreadCount === 0 ? 'opacity-60' : ''}`}
              disabled={unreadCount === 0}
            >
              📨 Unread ({unreadCount})
            </button>
            <button 
              onClick={() => setFilterType('reminders')}
              className={`px-3 py-1 rounded-lg text-xs md:text-sm transition-colors shadow-sm ${
                filterType === 'reminders' 
                  ? 'bg-gradient-to-r from-red-500 via-rose-600 to-red-600 text-white shadow-red-500/40' 
                  : 'bg-gradient-to-r from-red-900/30 via-rose-800/20 to-red-800/10 text-red-300 hover:from-red-800/40 hover:via-rose-700/30 hover:to-red-700/20 border border-red-500/30'
              } ${reminderCount === 0 ? 'opacity-60' : ''}`}
              disabled={reminderCount === 0}
            >
              ⏰ Reminders ({reminderCount})
            </button>
            <button 
              onClick={() => setFilterType('likes')}
              className={`px-3 py-1 rounded-lg text-xs md:text-sm transition-colors shadow-sm ${
                filterType === 'likes' 
                  ? 'bg-gradient-to-r from-pink-500 via-rose-600 to-pink-600 text-white shadow-pink-500/40' 
                  : 'bg-gradient-to-r from-pink-900/30 via-rose-800/20 to-pink-800/10 text-pink-300 hover:from-pink-800/40 hover:via-rose-700/30 hover:to-pink-700/20 border border-pink-500/30'
              } ${likes.length === 0 ? 'opacity-60' : ''}`}
              disabled={likes.length === 0}
            >
              💕 Likes ({likes.length})
            </button>
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
          <button 
            onClick={() => {
              fetchLikesData();
              if (window.fetchLiveQueueData) {
                window.fetchLiveQueueData();
              }
            }}
            className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2 text-xs md:text-base"
            disabled={likesLoading}
          >
            <svg className={`w-4 h-4 ${likesLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{likesLoading ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
          {(queueCount > 0 || unreadCount > 0) && (
            <button 
              onClick={handleWatchNowClick}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 text-xs md:text-base"
            >
              <FaEye />
              <span>Watch Now</span>
              {(queueCount + unreadCount > 1) && (
                <span className="text-xs bg-blue-600 px-2 py-1 rounded-full">
                  {unreadCount > 0 ? `${unreadCount} unread` : `${queueCount} queue`}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        {/* Unified table: show reminder-specific columns when in reminders tab */}
        {filterType === 'reminders' ? (
          <table className="min-w-full divide-y divide-red-800 text-[11px] md:text-xs">
            <thead className="bg-red-900/70 text-red-200 uppercase">
              <tr>
                <th className="px-2 py-2 text-left">User</th>
                <th className="px-2 py-2 text-left">Escort</th>
                <th className="px-2 py-2 text-left">Hours Inactive</th>
                <th className="px-2 py-2 text-left">Reminders Sent</th>
                <th className="px-2 py-2 text-left">Last Agent Msg</th>
                <th className="px-2 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-800/60">
              {reminderChats.length > 0 ? reminderChats.map(chat => {
                const inactiveHours = Math.floor(chat.hoursSinceLastCustomer || 0);
                const lastAgent = chat.lastAgentResponse ? new Date(chat.lastAgentResponse) : null;
                return (
                  <tr key={`remtab-${chat._id}`} className="hover:bg-red-800/40 transition-colors">
                    <td className="px-2 py-2 font-medium text-red-100 whitespace-nowrap max-w-[140px] truncate">{chat.customerId?.username || chat.customerName || 'User'}</td>
                    <td className="px-2 py-2 text-red-200 whitespace-nowrap max-w-[140px] truncate">{chat.escortId?.firstName || chat.escortName || 'Escort'}</td>
                    <td className="px-2 py-2 text-red-200 font-semibold">{inactiveHours}h</td>
                    <td className="px-2 py-2 text-red-300">{chat.reminderCount || 1}</td>
                    <td className="px-2 py-2 text-red-300 whitespace-nowrap">{lastAgent ? format(lastAgent, 'PP p') : '-'}</td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => navigate(`/agent/live-queue/${chat.escortId._id}?chatId=${chat._id}`)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] shadow shadow-red-900/50"
                      >
                        Open Chat
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="px-2 py-6 text-center text-red-300">No reminder chats</td>
                </tr>
              )}
            </tbody>
          </table>
        ) : filterType === 'likes' ? (
          <table className="min-w-full divide-y divide-pink-700 text-xs md:text-sm">
            <thead className="bg-pink-900/70 text-pink-200 uppercase">
              <tr>
                <th className="px-2 py-2 text-left">User</th>
                <th className="px-2 py-2 text-left">Liked Escort</th>
                <th className="px-2 py-2 text-left">Liked Date</th>
                <th className="px-2 py-2 text-left">Status</th>
                <th className="px-2 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-800/60">
              {likes.length > 0 ? likes.map(like => (
                <tr key={like._id} className="hover:bg-pink-800/40 transition-colors">
                  <td className="px-2 py-2 font-medium text-pink-100 whitespace-nowrap max-w-[140px] truncate">
                    {like.userFullName || like.userName}
                  </td>
                  <td className="px-2 py-2 text-pink-200 whitespace-nowrap max-w-[140px] truncate">
                    {like.escortName}
                  </td>
                  <td className="px-2 py-2 text-pink-300 whitespace-nowrap">
                    {new Date(like.likedAt).toLocaleDateString()}
                  </td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      like.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {like.status}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => onStartChatFromLike && onStartChatFromLike(like._id)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs shadow"
                        title="Start Chat"
                      >
                        💬 Chat
                      </button>
                      <button
                        onClick={() => onMarkLikeAsRead && onMarkLikeAsRead(like._id)}
                        className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs shadow"
                        title="Mark as Read"
                      >
                        ✓ Read
                      </button>
                      <button
                        onClick={() => onDeleteLike && onDeleteLike(like._id)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs shadow"
                        title="Delete"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-2 py-6 text-center text-pink-300">No likes yet</td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700 text-xs lg:text-sm">
              <thead className="bg-gray-900 text-gray-400 uppercase">
                <tr>
                  <th className="px-2 py-2 lg:px-4 lg:py-3 text-left min-w-[180px] sm:min-w-[200px]">User / Last Message</th>
                  <th className="px-2 py-2 lg:px-4 lg:py-3 text-left min-w-[120px] hidden sm:table-cell">Escort Profile</th>
                  <th className="px-2 py-2 lg:px-4 lg:py-3 text-left min-w-[130px] hidden md:table-cell">Assigned Agent</th>
                  <th className="px-2 py-2 lg:px-4 lg:py-3 text-left min-w-[100px]">Status</th>
                  <th className="px-2 py-2 lg:px-4 lg:py-3 text-left min-w-[120px] hidden lg:table-cell">Messages/Likes</th>
                  <th className="px-2 py-2 lg:px-4 lg:py-3 text-left min-w-[120px] hidden xl:table-cell">Last Active</th>
                  <th className="px-2 py-2 lg:px-4 lg:py-3 text-left min-w-[150px]">Actions</th>
                </tr>
              </thead>
            <tbody className="text-gray-300 divide-y divide-gray-700">
              {/* Render all chats */}
              {Array.isArray(sortedChats) && sortedChats.length > 0 && sortedChats.map((chat) => {
              // Use backend unread count
              const unreadCount = chat.unreadCount || 0;
              
              const lastMessage = chat.lastMessage || chat.messages?.[chat.messages.length - 1];
              const userPresence = getUserPresence(chat.customerId?._id);
              
              // Determine row styling based on chat type
              let rowStyling = 'border-l-4 hover:bg-gray-700/30 transition-colors';
              if (chat.chatType === 'panic' || chat.isInPanicRoom) {
                rowStyling += ' border-red-400 bg-gradient-to-r from-red-900/30 to-red-800/20';
              } else if ((chat.chatType === 'reminder' || chat.reminderActive) && (chat.unreadCount || 0) === 0 && chat.reminderHandled !== true) {
                rowStyling += ' border-red-500 bg-gradient-to-r from-red-900/25 via-red-800/20 to-red-700/15 animate-pulse';
              } else {
                rowStyling += ' border-cyan-400 bg-gradient-to-r from-cyan-900/25 to-blue-800/15';
              }
              
              return (
                <tr key={chat._id} className={rowStyling}>
                  <td className="px-2 py-2 lg:px-4 lg:py-3 align-top">
                    <div className="flex items-start gap-2 lg:gap-3 flex-col lg:flex-row">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${userPresence.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                        {userPresence.isOnline && (
                          <span className="text-xs text-green-400">Online</span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`font-medium ${
                          chat.isInPanicRoom ? 'text-red-300 drop-shadow-sm' : 
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
                          {(chat.chatType === 'reminder' || chat.reminderActive) && (chat.unreadCount || 0) === 0 && !chat.isInPanicRoom && chat.reminderHandled !== true && (
                            <span className="bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white text-xs px-2 py-1 rounded-full shadow shadow-red-600/40 flex items-center gap-1">
                              ⏰ REMINDER
                              {typeof chat.hoursSinceLastCustomer === 'number' && (
                                <span className="text-[10px] font-normal opacity-90">{Math.floor(chat.hoursSinceLastCustomer)}h</span>
                              )}
                            </span>
                          )}
                        </div>
                        
                        {/* Additional info for panic room */}
                        {(chat.chatType === 'panic' || chat.isInPanicRoom) && chat.panicRoomReason && (
                          <span className="text-xs text-red-400 mt-1 font-medium">
                            Reason: {chat.panicRoomReason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                        {(chat.chatType === 'reminder' || chat.reminderActive) && unreadCount === 0 && !chat.isInPanicRoom && chat.reminderHandled !== true && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-red-300">Waiting customer reply</span>
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
                  <td className="px-2 py-2 lg:px-4 lg:py-3 align-top hidden sm:table-cell">
                    <span className="block font-semibold text-white truncate">
                      {chat.escortId?.firstName || chat.escortId?.name || chat.escortName || 'N/A'}
                    </span>
                  </td>
                  <td className="px-2 py-2 lg:px-4 lg:py-3 align-top hidden md:table-cell">
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
                  <td className="px-2 py-2 lg:px-4 lg:py-3 align-top">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        userPresence.isOnline ? 'bg-green-500 text-white' : 'bg-gray-600 text-white'
                      }`}>
                        {userPresence.isOnline ? 'Online' : 'Offline'}
                      </span>
                      {!userPresence.isOnline && userPresence.lastSeen && (
                        <span className="text-xs text-gray-400">
                          {userPresence.lastSeen && !isNaN(new Date(userPresence.lastSeen)) 
                            ? formatDistanceToNow(new Date(userPresence.lastSeen), { addSuffix: true })
                            : 'Recently'
                          }
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 lg:px-4 lg:py-3 align-top hidden lg:table-cell">
                    <div className="flex flex-col gap-1">
                      {unreadCount > 0 && (
                        <span className="px-2 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full text-xs w-fit shadow-sm">
                          💬 {unreadCount} unread
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 lg:px-4 lg:py-3 align-top hidden xl:table-cell">
                    <span className="block text-xs text-gray-400">
                      {format(new Date(chat.lastActive || chat.createdAt), 'PPp')}
                    </span>
                  </td>
                  <td className="px-2 py-2 lg:px-4 lg:py-3 align-top">
                    <div className="flex flex-col lg:flex-row gap-1 lg:gap-2">
                      <button 
                        onClick={() => navigate(`/agent/live-queue/${chat.escortId._id}?chatId=${chat._id}`)}
                        className="p-1.5 lg:p-2 text-white rounded-lg flex items-center justify-center lg:gap-2 bg-blue-500 hover:bg-blue-600 text-xs"
                        title="Open Live Chat"
                      >
                        <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="hidden lg:inline">
                          {unreadCount > 0 ? 'View Messages' : 'Open Chat'}
                        </span>
                      </button>
                      {/* Panic Room toggle */}
                      <button
                        onClick={() => handleTogglePanicRoom(chat)}
                        className={`p-1.5 lg:p-2 rounded-lg text-white text-xs ${chat.isInPanicRoom || chat.chatType === 'panic' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'}`}
                        title={chat.isInPanicRoom || chat.chatType === 'panic' ? 'Remove from Panic Room' : 'Move to Panic Room'}
                      >
                        <FaExclamationTriangle className="w-3 h-3 lg:w-4 lg:h-4" />
                      </button>
                      {/* Remove from dashboard table */}
                      <button
                        onClick={() => onRemoveFromTable(chat)}
                        className="p-1.5 lg:p-2 bg-red-600 rounded-lg hover:bg-red-700 text-white text-xs"
                        title="Remove from Dashboard"
                      >
                        <FaTrash className="w-3 h-3 lg:w-4 lg:h-4" />
                      </button>
                      <button 
                        onClick={() => onPushBack(chat._id)}
                        className="p-1.5 lg:p-2 bg-yellow-500 rounded-lg hover:bg-yellow-600 text-xs"
                        title="Push Back Chat"
                      >
                        <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}              {/* Now render all likes as additional rows */}
              {Array.isArray(likes) && likes.length > 0 && likes.map(like => {
                // Safely handle date formatting
                const likeDate = like.likedAt || like.createdAt;
                const isValidDate = likeDate && !isNaN(new Date(likeDate));
                
                return (
                <tr key={`like-${like._id}`} className="border-l-4 border-pink-400 bg-gradient-to-r from-pink-900/25 to-rose-800/15 hover:bg-pink-800/30 transition-colors">
                  <td className="px-2 py-2 md:px-4 md:py-3 min-w-[160px] align-top">
                    <div className="flex items-start gap-2 md:gap-3 flex-col md:flex-row">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-pink-500" />
                        <span className="text-xs text-pink-400">❤️ Like</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-pink-100">
                          {like.userFullName || like.userName}
                        </span>
                        <span className="block text-xs text-pink-300 mt-1">
                          Liked {like.escortName}
                        </span>
                        <span className="block text-xs text-gray-400 mt-1">
                          {isValidDate ? new Date(likeDate).toLocaleDateString() : 'Date unavailable'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-2 py-2 md:px-4 md:py-3 min-w-[120px] align-top">
                    <span className="block font-semibold text-pink-200 truncate">
                      {like.escortName}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-2 py-2 md:px-4 md:py-3 min-w-[100px] align-top">
                    <span className="text-xs text-pink-300">System</span>
                  </td>
                  <td className="hidden lg:table-cell px-2 py-2 md:px-4 md:py-3 align-top">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      like.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {like.status}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell px-2 py-2 md:px-4 md:py-3 align-top">
                    <span className="px-2 py-1 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-full text-xs w-fit shadow-sm">
                      💕 New Like
                    </span>
                  </td>
                  <td className="hidden xl:table-cell px-2 py-2 md:px-4 md:py-3 align-top">
                    <span className="block text-xs text-gray-400">
                      {isValidDate ? format(new Date(likeDate), 'PPp') : 'Date unavailable'}
                    </span>
                  </td>
                  <td className="px-2 py-2 md:px-4 md:py-3 align-top">
                    <div className="flex flex-col md:flex-row gap-2">
                      <button
                        onClick={() => onStartChatFromLike && onStartChatFromLike(like._id)}
                        className="p-1.5 lg:p-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs shadow flex items-center gap-1"
                        title="Start Chat"
                      >
                        <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                        </svg>
                        <span className="hidden sm:inline">Chat</span>
                      </button>
                      <button
                        onClick={() => onMarkLikeAsRead && onMarkLikeAsRead(like._id)}
                        className="p-1.5 lg:p-2 bg-green-600 hover:bg-green-500 text-white rounded text-xs shadow"
                        title="Mark as Read"
                      >
                        <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="hidden sm:inline ml-1">Read</span>
                      </button>
                      <button
                        onClick={() => onDeleteLike && onDeleteLike(like._id)}
                        className="p-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs shadow"
                        title="Delete"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
              
              {/* Show empty state only if no chats AND no likes */}
              {(!Array.isArray(sortedChats) || sortedChats.length === 0) && (!Array.isArray(likes) || likes.length === 0) && (
                <tr>
                  <td colSpan="3" className="px-2 py-8 text-center text-gray-400">
                    {filterType === 'panic' && 'No panic room chats'}
                    {filterType === 'queue' && 'No unread messages in queue'}
                    {filterType === 'unread' && 'No unread messages'}
                    {filterType === 'all' && 'No active chats, likes, or panic room items'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
};


const AgentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    liveMessages: 0,
    sentMessages: 0,
    onlineMembers: 0
  });
  const [chats, setChats] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [agent, setAgent] = useState(null);
  const [myEscorts, setMyEscorts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showCreateFirstContact, setShowCreateFirstContact] = useState(false);
  const [panicRoomCount, setPanicRoomCount] = useState(0);
  const [userPresence, setUserPresence] = useState(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEscortForImages, setSelectedEscortForImages] = useState(null);
  // Chats to hide after agent reply (until customer replies again)
  const [suppressedChatIds, setSuppressedChatIds] = useState(new Set());
  // Likes state
  const [likes, setLikes] = useState([]);
  const [likesLoading, setLikesLoading] = useState(false);
  
  // Fetch likes data for agent dashboard
  const fetchLikesData = useCallback(async () => {
    try {
      console.log('🔄 Fetching likes data...');
      setLikesLoading(true);
      const likesResponse = await likeService.getAgentLikes(
        localStorage.getItem('agentToken'),
        'active',
        50
      );
      console.log('✅ Likes data fetched:', likesResponse);
      setLikes(likesResponse.likes || []);
    } catch (error) {
      console.error('❌ Failed to fetch likes data:', error);
    } finally {
      setLikesLoading(false);
    }
  }, []);
  
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
      if (data.type === 'queue:update' || data.type === 'live_queue_update') {
        // Refresh live queue data
        if (window.fetchLiveQueueData) {
          window.fetchLiveQueueData();
        }
      }
      
      if (data.type === 'new_chat_created') {
        // Handle new chat creation - refresh the entire dashboard
        if (window.fetchLiveQueueData) {
          window.fetchLiveQueueData();
        }
        // Also trigger a full refresh to ensure we get the new chat
        setTimeout(() => refreshDashboard(), 1000);
      }
      
      if (data.type === 'reminder_updates') {
        // Refresh live queue to surface updated reminderActive statuses
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

              // Decide new chatType locally only for immediate UX; backend will correct on next fetch
              let newChatType = chat.chatType;
              if (data.sender === 'customer') {
                // Customer message means unread; represent as queue if not panic
                if (!chat.isInPanicRoom && chat.chatType !== 'panic') {
                  newChatType = 'queue';
                }
              } else if (data.sender === 'agent') {
                // Agent reply clears unread from perspective; if there are still unreadCount > 0 after filter it stays queue else becomes idle
                if (unreadCount === 0 && !chat.isInPanicRoom) {
                  newChatType = 'idle';
                }
              }

              const updatedChat = {
                ...chat,
                messages: updatedMessages,
                updatedAt: data.timestamp,
                lastActive: data.timestamp,
                unreadCount,
                hasNewMessages: unreadCount > 0,
                lastMessage: {
                  message: newMessage.messageType === 'image' ? '📷 Image' : newMessage.message,
                  messageType: newMessage.messageType,
                  sender: newMessage.sender,
                  timestamp: newMessage.timestamp,
                  readByAgent: newMessage.readByAgent
                },
                ...(data.sender === 'customer' && {
                  lastCustomerResponse: data.timestamp,
                  reminderActive: false,
                  reminderHandled: false // Reset when customer replies
                }),
                ...(data.sender === 'agent' && {
                  lastAgentResponse: data.timestamp,
                  reminderHandled: true, // Mark as handled when agent replies
                  reminderActive: false  // Also clear reminderActive
                }),
                chatType: newChatType
              };

              return updatedChat;
            }
            return chat;
          });

          // Do NOT remove chat automatically; rely on filtering so counts remain consistent
          return updatedList;
        });

        // Maintain suppression map so refreshed data doesn't re-add the chat
        if (data.sender === 'agent') {
          // No longer suppress chats; keep them visible for status review

          // Auto-advance to next unread chat if currently watching
          const currentUrl = window.location.href;
          const urlParams = new URLSearchParams(window.location.search);
          const autoAdvance = urlParams.get('autoAdvance') === 'true';
          
          if (autoAdvance && currentUrl.includes('/agent/live-queue/')) {
            // Get remaining unread/queue chats
            setTimeout(() => {
              // Get current chats from state to find remaining chats
              const currentChats = JSON.parse(sessionStorage.getItem('agentChats') || '[]');
              const remainingChats = Array.isArray(currentChats) ? currentChats.filter(chat => 
                chat._id !== data.chatId && 
                ((chat.unreadCount > 0 || chat.hasUnreadAgentMessages === false || chat.chatType === 'queue') && 
                 !chat.isInPanicRoom)
              ) : [];
              
              if (remainingChats.length > 0) {
                const nextChat = remainingChats[0];
                if (nextChat?.escortId?._id) {
                  window.location.href = `/agent/live-queue/${nextChat.escortId._id}?chatId=${nextChat._id}&queue=${encodeURIComponent(JSON.stringify(remainingChats.map(c => c._id)))}&index=0&autoAdvance=true`;
                }
              } else {
                // No more chats, return to dashboard
                window.location.href = '/agent/dashboard';
              }
            }, 1000); // Short delay to allow state updates
          }
        } else if (data.sender === 'customer') {
          // Customer replied again; allow chat to reappear
          setSuppressedChatIds(prev => {
            if (!prev.has(data.chatId)) return prev;
            const next = new Set(prev);
            next.delete(data.chatId);
            return next;
          });
        }

        // Refresh live queue data to update counts and filters
        if (window.fetchLiveQueueData) {
          if (data.sender === 'customer') {
            setTimeout(() => window.fetchLiveQueueData(), 200);
          } else if (data.sender === 'agent') {
            // Clear specific cache entries and refresh immediately when agent replies
            const cacheService = window.agentCacheService || { delete: () => {} };
            cacheService.delete?.('live_queue');
            cacheService.delete?.('dashboard_stats');
            setTimeout(() => window.fetchLiveQueueData(), 50);
          }
        }
      }
      
      if (data.type === 'messages_read') {
        // Update read status in real-time
        setChats(prevChats => {
          return prevChats.map(chat => {
            if (chat._id === data.chatId) {
              const updatedMessages = Array.isArray(chat.messages) ? chat.messages.map(msg => ({
                ...msg,
                readByAgent: data.readBy === 'agent' ? true : msg.readByAgent,
                readByCustomer: data.readBy === 'customer' ? true : msg.readByCustomer
              })) : [];
              
              // Recalculate unread count after read status update
              const unreadCount = updatedMessages.filter(msg => 
                msg.sender === 'customer' && !msg.readByAgent
              ).length;
              
              const updatedChat = {
                ...chat,
                messages: updatedMessages,
                unreadCount: unreadCount,
                hasNewMessages: unreadCount > 0,
                // CRITICAL: Preserve chatType from backend
                chatType: chat.chatType
              };
              
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
      
      // Handle new likes in real-time
      if (data.type === 'new_like') {
        console.log('Received new like notification:', data);
        // Refresh likes data to get the new like
        fetchLikesData();
        
        // Optional: Show a notification for the new like
        if (data.data) {
          setNotifications(prevNotifs => {
            const newNotif = {
              id: `like-${data.data.likeId}`,
              chatId: data.data.likeId,
              type: 'like',
              message: `${data.data.userName} liked ${data.data.escortName}`,
              timestamp: data.data.timestamp,
              read: false
            };
            return [newNotif, ...prevNotifs.slice(0, 9)]; // Keep only latest 10 notifications
          });
        }
      }
    };

    // Handle presence updates
    const presenceHandler = (data) => {
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
        const cachedEscorts = cacheService.get('all_escorts'); // Changed from 'my_escorts' to 'all_escorts'

        // If we have cached data, use it immediately for fast UI
        if (cachedDashboard && cachedQueue && cachedEscorts) {
          setStats({
            liveMessages: cachedDashboard.totalLiveMessages || 0,
            sentMessages: cachedDashboard.agentStats.totalMessagesSent || 0,
            onlineMembers: cachedDashboard.onlineCustomers || 0
          });
          setChats(cachedQueue);
          setMyEscorts(cachedEscorts);
          
          setLoading(false); // Show UI immediately with cached data
        }

        // Fetch fresh data (this will update the UI if data has changed)
        const [dashboardStats, liveQueueRaw, escortData] = await Promise.all([
          agentAuth.getDashboardStats(),
          agentAuth.getLiveQueue(),
          agentAuth.getAllEscorts() // Changed from getMyEscorts to getAllEscorts
        ]);
        const liveQueue = Array.isArray(liveQueueRaw) ? liveQueueRaw : (Array.isArray(liveQueueRaw?.data) ? liveQueueRaw.data : []);

        // Cache the fresh data
        cacheService.set('dashboard_stats', dashboardStats, 2 * 60 * 1000); // 2 min cache
        cacheService.set('live_queue', liveQueue, 1 * 60 * 1000); // 1 min cache
        cacheService.set('all_escorts', escortData, 5 * 60 * 1000); // 5 min cache - changed from 'my_escorts' to 'all_escorts'

        setStats({
          liveMessages: dashboardStats.totalLiveMessages || 0,
          sentMessages: dashboardStats.agentStats.totalMessagesSent || 0,
          onlineMembers: dashboardStats.onlineCustomers || 0
        });

        setChats(liveQueue);
        setMyEscorts(escortData);
        
        // Fetch initial likes data
        fetchLikesData();

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
        // Use existing agentAuth helper so we get chatType, reminderActive, etc.
        const liveQueue = await agentAuth.getLiveQueue();
        
        const normalized = Array.isArray(liveQueue) ? liveQueue.map(c => ({
          ...c,
          // Guarantee presence of fields used by UI
          unreadCount: c.unreadCount || 0,
          reminderActive: !!c.reminderActive,
          reminderCount: c.reminderCount || 0,
          chatType: c.chatType || (c.isInPanicRoom ? 'panic' : (c.unreadCount > 0 ? 'queue' : (c.reminderActive ? 'reminder' : 'idle')))
        })) : [];
        setChats(normalized);
        // Presence map
        const presenceMap = new Map();
        normalized.forEach(chat => {
          if (chat.customerId?._id) {
            presenceMap.set(chat.customerId._id.toString(), {
              isOnline: chat.isUserActive || false,
              lastSeen: chat.lastActive || chat.updatedAt,
              status: chat.isUserActive ? 'online' : 'offline'
            });
          }
        });
        setUserPresence(presenceMap);
      } catch (e) {
        console.error('Failed to fetch live queue (corrected endpoint):', e);
      }
    };

    // Store fetchLiveQueueData in a ref so it can be called from WebSocket handlers
    window.fetchLiveQueueData = fetchLiveQueueData;

    // Store auto-advance function for use by live queue pages
    window.autoAdvanceToNextChat = () => {
      // Get current chats from sessionStorage to avoid closure issues
      const currentChats = JSON.parse(sessionStorage.getItem('agentChats') || '[]');
      const remainingChats = Array.isArray(currentChats) ? currentChats.filter(chat => 
        (chat.unreadCount > 0 || chat.hasUnreadAgentMessages === false || chat.chatType === 'queue') && 
        !chat.isInPanicRoom
      ) : [];
      
      if (remainingChats.length > 0) {
        const nextChat = remainingChats[0];
        if (nextChat?.escortId?._id) {
          window.location.href = `/agent/live-queue/${nextChat.escortId._id}?chatId=${nextChat._id}&queue=${encodeURIComponent(JSON.stringify(remainingChats.map(c => c._id)))}&index=0&autoAdvance=true`;
          return true;
        }
      }
      return false; // No more chats available
    };

    fetchDashboardData();
    
    // Fetch likes data
    fetchLikesData();
    
    // Remove auto-polling - use manual refresh button instead
    // const interval = setInterval(() => {
    //   fetchLiveQueueData();
    // }, 15000); // Poll every 15 seconds
    
    // return () => clearInterval(interval);
  }, [navigate, activeTab, fetchLikesData]);

  // Sync chats to sessionStorage for auto-advance functionality
  useEffect(() => {
    if (Array.isArray(chats)) {
      sessionStorage.setItem('agentChats', JSON.stringify(chats));
    }
  }, [chats]);

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

  // Remove chat from dashboard table (hide from view)
  const handleRemoveChatFromTable = (chat) => {
    const confirmRemove = window.confirm('Remove this chat from the dashboard table?');
    if (!confirmRemove) return;
    
    // Add chat ID to suppressed list to hide it from view
    setSuppressedChatIds(prev => {
      const next = new Set(prev);
      next.add(chat._id);
      return next;
    });
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
      // Clear any potential caches
      const cacheService = window.agentCacheService || { clear: () => {} };
      if (typeof cacheService.clear === 'function') {
        cacheService.clear();
      }
      
      // Add a small delay to ensure database operations are completed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fetch all dashboard data
      const [dashboardStats, liveQueueRaw, escortData] = await Promise.all([
        agentAuth.getDashboardStats(),
        agentAuth.getLiveQueue(),
        agentAuth.getAllEscorts() // Changed from getMyEscorts to getAllEscorts
      ]);
      const liveQueue = Array.isArray(liveQueueRaw) ? liveQueueRaw : (Array.isArray(liveQueueRaw?.data) ? liveQueueRaw.data : []);

      // Update stats
      setStats({
        liveMessages: dashboardStats.totalLiveMessages || 0,
        sentMessages: dashboardStats.agentStats.totalMessagesSent || 0,
        onlineMembers: dashboardStats.onlineCustomers || 0
      });

      // Update chats
      setChats(liveQueue);
      setMyEscorts(escortData);

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

  // Like handlers
  const handleMarkLikeAsRead = async (likeId) => {
    try {
      await likeService.markLikeAsRead(likeId, localStorage.getItem('agentToken'));
      // Refresh likes data
      fetchLikesData();
    } catch (error) {
      console.error('Failed to mark like as read:', error);
      alert('Failed to mark like as read');
    }
  };

  const handleDeleteLike = async (likeId) => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this like entry?');
      if (!confirmDelete) return;
      
      await likeService.deleteLike(likeId, localStorage.getItem('agentToken'));
      // Refresh likes data
      fetchLikesData();
    } catch (error) {
      console.error('Failed to delete like:', error);
      alert('Failed to delete like');
    }
  };

  const handleStartChatFromLike = async (likeId) => {
    try {
      const response = await likeService.startChatFromLike(likeId, localStorage.getItem('agentToken'));
      if (response.chatId) {
        // Navigate to the chat
        navigate(`/agent/chat/${response.chatId}`);
      }
    } catch (error) {
      console.error('Failed to start chat from like:', error);
      alert('Failed to start chat');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        agent={agent} 
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
          
        {/* Live Dashboard - shows all chats and panic room in one table */}
    {activeTab === 'dashboard' && (
          <LiveQueueTable 
            chats={visibleChats}
            onAssign={handleAssignChat}
            onPushBack={handlePushBack}
            onRemoveFromTable={handleRemoveChatFromTable}
            onOpenChat={handleOpenChat}
            onCreateFirstContact={handleCreateFirstContact}
            navigate={navigate}
            userPresence={userPresence}
            likes={likes}
            onMarkLikeAsRead={handleMarkLikeAsRead}
            onDeleteLike={handleDeleteLike}
            onStartChatFromLike={handleStartChatFromLike}
            fetchLikesData={fetchLikesData}
            likesLoading={likesLoading}
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

        {activeTab === 'panic room' && (
          <PanicRoomTab onChatSelect={handleOpenChat} />
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