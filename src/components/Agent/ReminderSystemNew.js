import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaComments, FaClock, FaExclamationTriangle, FaCheck, FaPause, FaEye, FaInfoCircle, FaUser } from 'react-icons/fa';
import { format, differenceInHours, formatDistanceToNow } from 'date-fns';

const ReminderSystem = ({ chats, navigate, onMarkReminder, onSnoozeReminder }) => {
  const [selectedPriority, setSelectedPriority] = useState('all');

  // Filter chats that need reminders (customer hasn't responded after agent's message)
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
      
      // Check if last message was from agent and customer hasn't replied for 4+ hours
      if (lastMessage.sender === 'agent') {
        const hoursSinceLastMessage = differenceInHours(new Date(), new Date(lastMessage.timestamp));
        
        // Only show reminders if it's been 4+ hours since the last agent message
        // AND the message wasn't marked as a follow-up response
        return hoursSinceLastMessage >= 4 && !lastMessage.isFollowUpResponse;
      }
      
      return false;
    }).sort((a, b) => {
      // Sort by hours since last agent message (oldest first)
      const aLastAgent = [...a.messages].reverse().find(m => m.sender === 'agent');
      const bLastAgent = [...b.messages].reverse().find(m => m.sender === 'agent');
      
      if (!aLastAgent || !bLastAgent) return 0;
      
      return new Date(aLastAgent.timestamp) - new Date(bLastAgent.timestamp);
    });
  }, [chats]);

  // Filter by priority
  const filteredChats = useMemo(() => {
    if (selectedPriority === 'all') return unansweredChats;
    
    return unansweredChats.filter(chat => {
      const lastAgentMessage = [...chat.messages].reverse().find(m => m.sender === 'agent');
      const hoursSinceLastMessage = differenceInHours(new Date(), new Date(lastAgentMessage.timestamp));
      const priority = getReminderLevel(hoursSinceLastMessage).level;
      return priority === selectedPriority;
    });
  }, [unansweredChats, selectedPriority]);

  const getReminderLevel = (hoursSinceLastMessage) => {
    if (hoursSinceLastMessage >= 24) return { level: 'critical', color: 'bg-red-500', text: 'Critical', icon: FaExclamationTriangle };
    if (hoursSinceLastMessage >= 12) return { level: 'high', color: 'bg-orange-500', text: 'High', icon: FaExclamationTriangle };
    if (hoursSinceLastMessage >= 8) return { level: 'medium', color: 'bg-yellow-500', text: 'Medium', icon: FaClock };
    return { level: 'low', color: 'bg-blue-500', text: 'Low', icon: FaBell };
  };

  const getReminderCount = (hoursSinceLastMessage) => {
    return Math.floor(hoursSinceLastMessage / 4);
  };

  const getPriorityStats = () => {
    const stats = { critical: 0, high: 0, medium: 0, low: 0 };
    
    unansweredChats.forEach(chat => {
      const lastAgentMessage = [...chat.messages].reverse().find(m => m.sender === 'agent');
      const hoursSinceLastMessage = differenceInHours(new Date(), new Date(lastAgentMessage.timestamp));
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

  if (filteredChats.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Chat Reminders</h2>
            <p className="text-gray-400">Monitor unanswered customer chats</p>
          </div>
        </div>

        {/* Priority Filter */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All', count: unansweredChats.length },
            { key: 'critical', label: 'Critical', count: priorityStats.critical },
            { key: 'high', label: 'High', count: priorityStats.high },
            { key: 'medium', label: 'Medium', count: priorityStats.medium },
            { key: 'low', label: 'Low', count: priorityStats.low }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setSelectedPriority(filter.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPriority === filter.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        {/* Empty State */}
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <FaCheck className="mx-auto h-16 w-16 text-green-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">All Clear!</h3>
          <p className="text-gray-400 mb-4">
            No unanswered chats requiring follow-up at the moment.
          </p>
          <div className="text-sm text-gray-500">
            Reminders appear when customers haven't replied to agent messages for 4+ hours
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Chat Reminders</h2>
          <p className="text-gray-400">
            {filteredChats.length} chat{filteredChats.length !== 1 ? 's' : ''} need{filteredChats.length === 1 ? 's' : ''} your attention
          </p>
        </div>
      </div>

      {/* Priority Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All', count: unansweredChats.length },
          { key: 'critical', label: 'Critical', count: priorityStats.critical },
          { key: 'high', label: 'High', count: priorityStats.high },
          { key: 'medium', label: 'Medium', count: priorityStats.medium },
          { key: 'low', label: 'Low', count: priorityStats.low }
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setSelectedPriority(filter.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPriority === filter.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {filter.label} ({filter.count})
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
                  const lastAgentMessage = [...chat.messages].reverse().find(m => m.sender === 'agent');
                  const hoursSinceLastMessage = differenceInHours(new Date(), new Date(lastAgentMessage.timestamp));
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
                            "{lastAgentMessage?.message || 'No message'}"
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            by {lastAgentMessage?.senderName || 'Agent'}
                          </p>
                        </div>
                      </td>

                      {/* Time Elapsed */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-white">
                            {Math.floor(hoursSinceLastMessage)}h ago
                          </div>
                          <div className="text-xs text-gray-400">
                            {format(new Date(lastAgentMessage.timestamp), 'MMM dd, HH:mm')}
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
                            title="Follow up on this chat"
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
                                  onClick={() => handleSnooze(chat._id, 1)}
                                  className="block w-full text-left px-3 py-1 hover:bg-gray-700 rounded"
                                >
                                  1 hour
                                </button>
                                <button
                                  onClick={() => handleSnooze(chat._id, 4)}
                                  className="block w-full text-left px-3 py-1 hover:bg-gray-700 rounded"
                                >
                                  4 hours
                                </button>
                                <button
                                  onClick={() => handleSnooze(chat._id, 24)}
                                  className="block w-full text-left px-3 py-1 hover:bg-gray-700 rounded"
                                >
                                  1 day
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
            Reminders are created when customers don't respond to agent messages for 4+ hours.
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReminderSystem;
