import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaComments, FaClock, FaExclamationTriangle, FaCheck, FaPause, FaInfoCircle, FaUser, FaQuestionCircle, FaTimes } from 'react-icons/fa';
import { format, differenceInHours, formatDistanceToNow } from 'date-fns';

const ReminderSystem = ({ chats, navigate, onMarkReminder, onSnoozeReminder }) => {
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showInfoPopup, setShowInfoPopup] = useState(false);

  // Define helper functions for reminder priority levels
  const getReminderLevel = (hoursSinceLastMessage) => {
    if (hoursSinceLastMessage >= 56) return { level: 'critical', color: 'bg-red-500', text: 'Critical', icon: FaExclamationTriangle };
    if (hoursSinceLastMessage >= 36) return { level: 'high', color: 'bg-orange-500', text: 'High', icon: FaExclamationTriangle };
    if (hoursSinceLastMessage >= 24) return { level: 'medium', color: 'bg-yellow-500', text: 'Medium', icon: FaClock };
    return { level: 'low', color: 'bg-blue-500', text: 'New', icon: FaBell }; // 6+ hours
  };

  const getReminderCount = (hoursSinceLastMessage) => {
    return Math.floor(hoursSinceLastMessage / 6); // Count reminders every 6 hours
  };

  // Filter chats that need reminders (unanswered customer messages)
  const unansweredChats = useMemo(() => {
    return chats.filter(chat => {
      if (!chat.messages || chat.messages.length === 0) return false;
      
      // Skip if reminder is snoozed
      if (chat.reminderSnoozedUntil && new Date(chat.reminderSnoozedUntil) > new Date()) {
        return false;
      }
      
      // Skip if reminder was already handled
      if (chat.reminderHandled) {
        return false;
      }
      
      // Get the last message
      const lastMessage = chat.messages[chat.messages.length - 1];
      
      // Only show reminders for unanswered customer messages
      if (lastMessage.sender === 'customer') {
        const hoursSinceLastMessage = differenceInHours(new Date(), new Date(lastMessage.timestamp));
        
        // Show reminders for customer messages waiting 6+ hours for reply
        return hoursSinceLastMessage >= 6;
      }
      
      return false;
    }).sort((a, b) => {
      // Sort by most urgent first (longest waiting time)
      const aLastMessage = a.messages[a.messages.length - 1];
      const bLastMessage = b.messages[b.messages.length - 1];
      
      const aHours = differenceInHours(new Date(), new Date(aLastMessage.timestamp));
      const bHours = differenceInHours(new Date(), new Date(bLastMessage.timestamp));
      
      return bHours - aHours;
    });
  }, [chats]);

  // Filter by priority
  const filteredChats = useMemo(() => {
    if (selectedPriority === 'all') return unansweredChats;
    
    return unansweredChats.filter(chat => {
      if (!chat.messages || chat.messages.length === 0) return false;

      const lastMessage = chat.messages[chat.messages.length - 1];
      const hoursSinceLastMessage = differenceInHours(new Date(), new Date(lastMessage.timestamp));
      const priority = getReminderLevel(hoursSinceLastMessage).level;
      return priority === selectedPriority;
    });
  }, [unansweredChats, selectedPriority]);

  const getPriorityStats = () => {
    const stats = { critical: 0, high: 0, medium: 0, low: 0 };
    
    unansweredChats.forEach(chat => {
      if (!chat.messages || chat.messages.length === 0) return;
      
      const lastMessage = chat.messages[chat.messages.length - 1];
      const hoursSinceLastMessage = differenceInHours(new Date(), new Date(lastMessage.timestamp));
      const priority = getReminderLevel(hoursSinceLastMessage).level;
      stats[priority]++;
    });
    
    return stats;
  };

  const priorityStats = getPriorityStats();

  const handleFollowUp = (chat) => {
    if (onMarkReminder) {
      onMarkReminder(chat._id);
    }
    // Navigate to the chat
    navigate(`/agent/live-queue/${chat.escortId._id}?chatId=${chat._id}&followUp=true`);
  };

  const handleSnooze = (chatId, hours) => {
    if (onSnoozeReminder) {
      onSnoozeReminder(chatId, hours);
    }
  };

  // Info Popup Component
  const InfoPopup = () => (
    <AnimatePresence>
      {showInfoPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowInfoPopup(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FaInfoCircle className="text-blue-400" />
                How Reminders Work
              </h3>
              <button
                onClick={() => setShowInfoPopup(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="space-y-4 text-gray-300">
              <div>
                <h4 className="font-semibold text-white mb-2">📋 Simple Reminder System</h4>
                <p className="text-sm">
                  Reminders appear after <strong>6+ hours</strong> when a customer message needs your attention.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">🎯 Priority Levels</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">New</span>
                    <span>6-24 hours waiting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Medium</span>
                    <span>24-36 hours waiting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs">High</span>
                    <span>36-56 hours waiting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">Critical</span>
                    <span>56+ hours waiting</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">🔄 Follow-up Process</h4>
                <ul className="text-sm space-y-1">
                  <li>• Click <strong>"Follow Up"</strong> to respond to the customer</li>
                  <li>• Reminder is temporarily removed from the list</li>
                  <li>• When customer replies again, a new reminder cycle begins if needed</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">😴 Snooze Options</h4>
                <p className="text-sm">
                  Use <strong>"Snooze"</strong> to temporarily hide reminders for 1 hour, 4 hours, or 1 day.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">📊 Reminder Counter</h4>
                <p className="text-sm">
                  Shows how many 3-hour cycles have passed since the customer's message.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInfoPopup(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (filteredChats.length === 0) {
    return (
      <div className="space-y-6">
        <InfoPopup />
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              Chat Reminders
              <button
                onClick={() => setShowInfoPopup(true)}
                className="text-gray-400 hover:text-blue-400 transition-colors"
                title="How do reminders work?"
              >
                <FaQuestionCircle className="h-5 w-5" />
              </button>
            </h2>
            <p className="text-gray-400">Monitor unanswered customer messages</p>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <FaCheck className="mx-auto h-16 w-16 text-green-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">All Clear!</h3>
          <p className="text-gray-400 mb-4">
            No unanswered customer messages at the moment.
          </p>
          <div className="text-sm text-gray-500">
            Reminders appear when customer messages need a response
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InfoPopup />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            Chat Reminders
            <button
              onClick={() => setShowInfoPopup(true)}
              className="text-gray-400 hover:text-blue-400 transition-colors"
              title="How do reminders work?"
            >
              <FaQuestionCircle className="h-5 w-5" />
            </button>
          </h2>
          <p className="text-gray-400">
            {filteredChats.length} message{filteredChats.length !== 1 ? 's' : ''} need{filteredChats.length === 1 ? 's' : ''} your response
          </p>
        </div>
      </div>

      {/* Priority Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          {
            key: 'all',
            label: 'All',
            count: unansweredChats.length
          },
          {
            key: 'critical',
            label: 'Critical',
            count: priorityStats.critical
          },
          {
            key: 'high',
            label: 'High',
            count: priorityStats.high
          },
          {
            key: 'medium',
            label: 'Medium',
            count: priorityStats.medium
          },
          {
            key: 'low',
            label: 'Low',
            count: priorityStats.low
          }
        ].map((filterItem) => (
          <button
            key={filterItem.key}
            onClick={() => setSelectedPriority(filterItem.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPriority === filterItem.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {filterItem.label} ({filterItem.count})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-gray-400 text-sm uppercase bg-gray-900">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Last Message</th>
                <th className="px-6 py-4">Time Elapsed</th>
                <th className="px-6 py-4">Reminders</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <AnimatePresence>
                {filteredChats.map((chat) => {
                  const lastMessage = chat.messages[chat.messages.length - 1];
                  const hoursSinceLastMessage = differenceInHours(new Date(), new Date(lastMessage.timestamp));
                  const reminderLevel = getReminderLevel(hoursSinceLastMessage);
                  const reminderCount = getReminderCount(hoursSinceLastMessage);
                  const Icon = reminderLevel.icon;

                  return (
                    <motion.tr
                      key={chat._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors"
                    >
                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                            <FaUser className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {chat.customerName || chat.customerId?.username || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {chat.escortId?.firstName || 'Escort'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${reminderLevel.color}`}>
                            <Icon className="h-3 w-3" />
                            {reminderLevel.text}
                          </span>
                        </div>
                      </td>

                      {/* Last Message */}
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-300 truncate">
                            "{lastMessage?.message || 'No message'}"
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            From: Customer
                          </p>
                        </div>
                      </td>

                      {/* Time Elapsed */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-white">
                            {(() => {
                              const totalHours = Math.floor(hoursSinceLastMessage);
                              const days = Math.floor(totalHours / 24);
                              const hours = totalHours % 24;
                              const minutes = Math.floor((hoursSinceLastMessage % 1) * 60);
                              
                              if (days > 0) {
                                return `${days}d ${hours}h ${minutes}m ago`;
                              } else if (hours > 0) {
                                return `${hours}h ${minutes}m ago`;
                              } else {
                                return `${minutes}m ago`;
                              }
                            })()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {format(new Date(lastMessage.timestamp), 'MMM dd, HH:mm')}
                          </div>
                        </div>
                      </td>

                      {/* Reminders */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-700 text-white px-2 py-1 rounded text-sm font-medium">
                            {reminderCount}
                          </span>
                          <span className="text-xs text-gray-400">
                            reminder{reminderCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleFollowUp(chat)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                            title="Reply to this customer"
                          >
                            <FaComments className="h-3 w-3 mr-1 inline" />
                            Follow Up
                          </button>
                          
                          <div className="relative group">
                            <button
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors"
                              title="Snooze reminder"
                            >
                              <FaPause className="h-3 w-3 mr-1 inline" />
                              Snooze
                            </button>
                            
                            <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-sm rounded-lg shadow-lg z-10 whitespace-nowrap">
                              <div className="p-2 space-y-1">
                                <button
                                  onClick={() => handleSnooze(chat._id, 6)}
                                  className="block w-full text-left px-3 py-1 hover:bg-gray-700 rounded"
                                >
                                  6 hours
                                </button>
                                <button
                                  onClick={() => handleSnooze(chat._id, 24)}
                                  className="block w-full text-left px-3 py-1 hover:bg-gray-700 rounded"
                                >
                                  24 hours
                                </button>
                                <button
                                  onClick={() => handleSnooze(chat._id, 36)}
                                  className="block w-full text-left px-3 py-1 hover:bg-gray-700 rounded"
                                >
                                  36 hours
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Info */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <FaInfoCircle />
          <span>
            Showing {filteredChats.length} of {unansweredChats.length} reminders. 
            Reminders appear when customers haven't received a reply for 1+ hours.
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReminderSystem;
