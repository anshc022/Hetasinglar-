import React, { useState, useEffect, useCallback } from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { escorts, chats } from '../../services/api';
import { likeService } from '../../services/likeService';
import websocketService from '../../services/websocket';
import axios from 'axios';
import SubscriptionPlans from './SubscriptionPlans';
import config from '../../config/environment';
import { MagnetLines } from '../ui/MagnetLines';
import ThemeToggle from '../ui/ThemeToggle';
import { useSwedishTranslation } from '../../utils/swedishTranslations';

// Reusable SVG Icon components (replacing emoji usage for consistent styling)
const IconWarning = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>
);
const IconFemale = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 13v8m0 0H9m3 0h3" />
  </svg>
);
const IconMale = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="10" cy="14" r="5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 5l-5 5m0-5h5v5" />
  </svg>
);
const IconCake = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v4M8 3v4m8-4v4M4 11h16M5 11l1 9h12l1-9M8 15h8" />
  </svg>
);
const IconHeartSpark = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21s-1-.55-2.35-1.57C6.4 17.24 4 15.09 4 12.28 4 10 5.79 8 8.05 8c1.31 0 2.54.62 3.31 1.67A4.07 4.07 0 0114.69 8C16.95 8 18.74 10 18.74 12.28c0 2.81-2.4 4.96-6.55 9.18L12 21z" />
  </svg>
);
const IconUsers = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M17 3a4 4 0 110 8 4 4 0 010-8zM7 3a4 4 0 110 8 4 4 0 010-8z" />
  </svg>
);
const IconPin = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11.5a3 3 0 100-6 3 3 0 000 6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7-7.5 11-7.5 11s-7.5-4-7.5-11a7.5 7.5 0 1115 0z" />
  </svg>
);
const IconBubble = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v7a2 2 0 01-2 2h-5l-4 4v-4z" />
  </svg>
);
const IconGlobe = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
  </svg>
);

const MessageItem = ({ chat, isSelected, onClick }) => {
  const { t } = useSwedishTranslation();
  
  return (
  <motion.div
    onClick={onClick}
    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
      isSelected 
        ? 'border border-pink-300/60 dark:border-pink-400/50 shadow-lg shadow-pink-200/40 dark:shadow-pink-500/20 transform scale-[1.02]' 
        : 'bg-white/70 dark:bg-gray-800/70 hover:bg-white/80 dark:hover:bg-gray-800/60 border border-transparent hover:transform hover:scale-[1.01] hover:shadow-md'
    }`}
    style={isSelected ? {
      background: 'linear-gradient(145deg, rgba(236,72,153,0.6) 0%, rgba(244,114,182,0.7) 50%, rgba(251,113,133,0.6) 100%)',
      backdropFilter: 'blur(15px)',
      boxShadow: '0 4px 20px rgba(236, 72, 153, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
    } : {
      backdropFilter: 'blur(10px)'
    }}
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.98 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="h-14 w-14 rounded-full overflow-hidden">
          {chat.profileImage ? (
            <img 
              src={chat.profileImage} 
              alt={chat.escortName} 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
              {chat.escortName?.charAt(0).toUpperCase()}
            </div>
          )}
          {chat.isOnline && (
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <h3 className={`font-semibold truncate ${isSelected ? 'text-white drop-shadow-sm' : 'text-gray-800 dark:text-gray-200'}`}>{chat.escortName}</h3>
          <span className={`text-xs flex-shrink-0 ${isSelected ? 'text-pink-100' : 'text-gray-500 dark:text-gray-400'}`}>{chat.time}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {chat.isTyping ? (
            <div className="flex items-center gap-0.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSelected ? 'bg-pink-200' : 'bg-rose-400'}`}></div>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSelected ? 'bg-pink-200' : 'bg-rose-400'}`} style={{ animationDelay: '0.2s' }}></div>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSelected ? 'bg-pink-200' : 'bg-rose-400'}`} style={{ animationDelay: '0.4s' }}></div>
              <span className={`text-xs ml-1 ${isSelected ? 'text-pink-100' : 'text-rose-500'}`}>{t('typing')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 w-full">
              <p className={`text-sm truncate ${isSelected ? 'text-pink-50 drop-shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}>{chat.lastMessage}</p>
            </div>
          )}
        </div>
      </div>
      {chat.messages.some(m => !m.isSent && !m.readByCustomer) && (
        <div className="flex-shrink-0 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
          {chat.messages.filter(m => !m.isSent && !m.readByCustomer).length}
        </div>
      )}
    </div>
  </motion.div>
  );
};

const ChatBox = ({ selectedChat, setSelectedChat, setActiveSection, onBack, onChatsUpdate }) => {
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState(null);
  const [userCoins, setUserCoins] = useState(0);
  const messagesEndRef = React.useRef(null);
  const { token } = useAuth();
  
  // State for message editing
  const [editingMessage, setEditingMessage] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);

  useEffect(() => {
    // Fetch user's coin balance when component mounts
    const fetchCoins = async () => {
      try {
        const response = await axios.get(`${config.API_URL}/subscription/coins/balance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserCoins(response.data.balance);
      } catch (err) {
        console.error('Error fetching coins:', err);
      }
    };
    fetchCoins();
  }, [token]);

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat, scrollToBottom]);

  useEffect(() => {
    if (!selectedChat?.id) return;

    websocketService.setCurrentChatId(selectedChat.id);
    websocketService.connect();

    // Mark messages as read when user opens a chat
    const markAsRead = async () => {
      try {
        await chats.markMessagesAsRead(selectedChat.id);
        
        // Send WebSocket notification that customer read the messages
        if (websocketService.ws && websocketService.ws.readyState === WebSocket.OPEN) {
          websocketService.markMessagesAsRead(selectedChat.id, 'customer');
        }

        // Update local message status
        setSelectedChat(prev => ({
          ...prev,
          messages: prev.messages.map(msg => ({
            ...msg,
            status: msg.isSent ? msg.status : 'read'
          }))
        }));

        // Update parent's allUserChats to reflect read status
        if (onChatsUpdate) {
          onChatsUpdate(prevChats => {
            return prevChats.map(chat => {
              if (chat.id === selectedChat.id) {
                return {
                  ...chat,
                  messages: chat.messages?.map(msg => ({
                    ...msg,
                    readByCustomer: !msg.isSent ? true : msg.readByCustomer
                  })) || []
                };
              }
              return chat;
            });
          });
        }
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    };

    markAsRead();

    const messageUnsub = websocketService.onMessage((data) => {
      if (data.type === 'chat_message' && selectedChat?.id === data.chatId) {
        const newMessage = {
          text: data.messageType === 'image' ? '📷 Image' : data.message,
          time: new Date(data.timestamp).toLocaleString(),
          isSent: data.sender === 'customer',
          status: data.readByAgent ? 'read' : 'sent',
          sender: data.sender,
          // Include image-specific fields
          messageType: data.messageType,
          imageData: data.imageData,
          mimeType: data.mimeType,
          filename: data.filename
        };
        
        setSelectedChat(prev => {
          if (!prev) return prev;
          
          // 🔄 SMART UPDATE: Replace optimistic message if it exists, or add new message
          const updatedMessages = [...prev.messages];
          
          // Find matching optimistic message (prefer clientId when available)
          const optimisticIndex = updatedMessages.findIndex(msg => 
            msg.isOptimistic && (
              (data.clientId && msg.clientId && msg.clientId === data.clientId) ||
              (
                msg.sender === data.sender && 
                ((data.messageType === 'image' && msg.filename === data.filename) ||
                 (data.messageType !== 'image' && msg.text === data.message))
              )
            )
          );
          
          if (optimisticIndex !== -1) {
            // Replace optimistic message with real one
            updatedMessages[optimisticIndex] = { ...newMessage, isOptimistic: false };
          } else {
            // Prevent duplicates: skip if an identical non-optimistic message already exists
            const existingIndex = updatedMessages.findIndex(msg =>
              !msg.isOptimistic &&
              msg.sender === data.sender &&
              (msg.messageType || 'text') === (data.messageType || 'text') &&
              (
                (data.messageType === 'image' && msg.filename === data.filename) ||
                (data.messageType !== 'image' && msg.text === data.message)
              )
            );
            if (existingIndex === -1) {
              updatedMessages.push(newMessage);
            }
          }
          
          return {
            ...prev,
            messages: updatedMessages,
            lastMessage: data.messageType === 'image' ? '📷 Image' : data.message,
            time: new Date(data.timestamp).toLocaleString()
          };
        });

        scrollToBottom();
      }

      // Handle read status updates
      if (data.type === 'messages_read' && selectedChat?.id === data.chatId) {
        if (data.readBy === 'agent') {
          // Agent read our messages, update status to 'read'
          setSelectedChat(prev => ({
            ...prev,
            messages: prev.messages.map(msg => ({
              ...msg,
              status: msg.isSent ? 'read' : msg.status
            }))
          }));
        }
      }
    });

    // Handle message deletion events
    const deletionUnsub = websocketService.onMessage((data) => {
      if (data.type === 'messageDeleted' && selectedChat?.id === data.chatId) {
        setSelectedChat(prev => {
          if (!prev) return prev;
          
          // Remove the deleted message from the user's view
          return {
            ...prev,
            messages: prev.messages.filter(msg => msg._id !== data.messageId)
          };
        });
      }
    });

    return () => {
      messageUnsub();
      deletionUnsub();
      websocketService.disconnect();
    };
  }, [selectedChat?.id, setSelectedChat, scrollToBottom]);

  // Handle message editing for users
  const handleStartEditMessage = (messageIndex, currentMessage) => {
    const message = selectedChat.messages[messageIndex];
    // Users can only edit their own messages (sent messages)
    if (!message.isSent) {
      setError('You can only edit your own messages');
      return;
    }
    
    // Show confirmation dialog about coin cost
    const confirmed = window.confirm(
      'Editing a message will cost 1 coin. Are you sure you want to continue?'
    );
    
    if (!confirmed) {
      return;
    }
    
    setEditingMessageId(message._id || messageIndex); // Fallback to index if no _id
    setEditMessageText(currentMessage);
    setEditingMessage(messageIndex);
  };

  const handleCancelEditMessage = () => {
    setEditingMessage(null);
    setEditMessageText('');
    setEditingMessageId(null);
  };

  const handleSaveEditMessage = async () => {
    if (!editMessageText.trim()) {
      setError('Message cannot be empty');
      return;
    }

    try {
      await chats.editMessage(selectedChat.id, editingMessageId, editMessageText.trim());

      // Update local state
      setSelectedChat(prev => ({
        ...prev,
        messages: prev.messages.map((msg, idx) => {
          if (idx === editingMessage) {
            return {
              ...msg,
              text: editMessageText.trim(),
              isEdited: true,
              editedAt: new Date()
            };
          }
          return msg;
        })
      }));

      // Clear editing state
      handleCancelEditMessage();
      setError(null);
      
    } catch (error) {
      console.error('Error editing message:', error);
      
      // Handle insufficient coins error
      if (error.response?.data?.type === 'INSUFFICIENT_COINS') {
        const errorData = error.response.data;
        setError(`Insufficient coins: You have ${errorData.userCoins} coins but need ${errorData.coinsRequired} coins to edit this message. Please purchase more coins.`);
      } else {
        setError(error.response?.data?.message || error.message || 'Failed to edit message');
      }
    }
  };

  const handleDeleteMessage = async (messageIndex) => {
    const message = selectedChat.messages[messageIndex];
    
    // Users can only delete their own messages
    if (!message.isSent) {
      setError('You can only delete your own messages');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this message? Coins will not be refunded.')) {
      return;
    }

    try {
      await chats.deleteMessage(selectedChat.id, message._id || messageIndex);

      // Update local state
      setSelectedChat(prev => ({
        ...prev,
        messages: prev.messages.map((msg, idx) => {
          if (idx === messageIndex) {
            return {
              ...msg,
              text: '[This message has been deleted]',
              isDeleted: true,
              deletedAt: new Date()
            };
          }
          return msg;
        })
      }));

      setError(null);
      
    } catch (error) {
      console.error('Error deleting message:', error);
      setError(error.message || 'Failed to delete message');
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      if (userCoins <= 0) {
        setError('You have no coins remaining. Please purchase coins to continue chatting.');
        return;
      }

      const messageText = newMessage.trim();
      setNewMessage('');
      setError(null);

      // ⚡ OPTIMISTIC UPDATE: Add message immediately for instant feel
      const clientId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      const optimisticMessage = {
        text: messageText,
        time: new Date().toLocaleString(),
        isSent: true,
        status: 'sending', // Show as sending until confirmed
        sender: 'customer',
        messageType: 'text',
        readByAgent: false,
        readByCustomer: true,
        isOptimistic: true, // Flag to identify optimistic messages
        clientId
      };

      // Add optimistic message to UI immediately
      setSelectedChat(prev => ({
        ...prev,
        messages: [...(prev?.messages || []), optimisticMessage],
        lastMessage: messageText,
        time: new Date().toLocaleString()
      }));

      scrollToBottom();

      // Send the message via REST API (now in background)
      try {
        await chats.sendMessage(selectedChat.id, messageText, { clientId });
        
        // ✅ Message sent successfully - update status
        // Keep isOptimistic=true until WebSocket echo arrives, so we can replace it instead of duplicating
        setSelectedChat(prev => ({
          ...prev,
          messages: prev.messages.map(msg => 
            msg.isOptimistic && msg.text === messageText 
              ? { ...msg, status: 'sent' }
              : msg
          )
        }));
        
        // Update coin balance after sending
        const coinResponse = await axios.get(`${config.API_URL}/subscription/coins/balance`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setUserCoins(coinResponse.data.balance);
        
      } catch (sendError) {
        // ❌ Message failed - mark as failed and show retry option
        setSelectedChat(prev => ({
          ...prev,
          messages: prev.messages.map(msg => 
            msg.isOptimistic && msg.text === messageText 
              ? { ...msg, status: 'failed', isOptimistic: false }
              : msg
          )
        }));
        
        throw sendError; // Re-throw to be caught by outer catch
      }
      
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMessage = err.response?.data?.message || 'Failed to send message';
      setError(errorMessage);
      
      if (err.response?.data?.type === 'INSUFFICIENT_COINS') {
        setError('You need coins to send messages. Please purchase more coins to continue chatting.');
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!selectedChat) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  const messages = selectedChat.messages || [];

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-gray-200 dark:border-gray-600 p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back button for mobile */}
            <button
              type="button"
              onClick={() => onBack && onBack()}
              className="lg:hidden mr-1 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Back to chats"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{selectedChat.escortName}</h3>
            <span className={`w-2 h-2 rounded-full ${selectedChat.isOnline ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <span className="flex items-center">
              <svg className="w-4 h-4 text-yellow-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 4a6 6 0 110 12 6 6 0 010-12z"/>
              </svg>
              {userCoins} coins
            </span>
            {userCoins <= 5 && userCoins > 0 && (
              <span className="text-yellow-600 dark:text-yellow-400 text-xs flex items-center gap-1"><IconWarning className="w-3.5 h-3.5" /> Low balance</span>
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-gray-50 to-rose-50 dark:from-gray-800 dark:to-gray-900">
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {messages.filter(msg => !msg.isDeleted).map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.isSent ? 'justify-end' : 'justify-start'} items-end gap-2`}
          >
            <div className={`max-w-[70%] relative group ${
              msg.isSent ? 'bg-rose-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100'
            } rounded-2xl px-4 py-2 shadow-sm`}>
              
              {/* Edit/Delete buttons for user's own messages */}
              {msg.isSent && msg.messageType !== 'image' && msg.text !== '📷 Image' && (
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 rounded-lg flex">
                  <button
                    onClick={() => handleStartEditMessage(index, msg.text)}
                    className="p-1 text-gray-300 hover:text-blue-400 transition-colors"
                    title="Edit message"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(index)}
                    className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                    title="Delete message (coins will not be refunded)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}

              {!msg.isSent && <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{selectedChat.escortName}</div>}
              
              {/* Message content - show edit input or regular message */}
              {editingMessage === index ? (
                <div className="space-y-2">
                  <textarea
                    value={editMessageText}
                    onChange={(e) => setEditMessageText(e.target.value)}
                    className="w-full p-2 bg-gray-700 dark:bg-gray-600 text-white rounded border border-gray-600 dark:border-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none resize-none"
                    rows="3"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEditMessage}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded text-sm transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEditMessage}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800 text-white rounded text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Display image preview for image messages */}
                  {(msg.messageType === 'image' || msg.text === '📷 Image') && (msg.imageData || msg.filename) ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <img
                          src={msg.imageData || `/uploads/chat/${msg.filename}`}
                          alt={msg.filename || 'Sent image'}
                          className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            const newWindow = window.open();
                            newWindow.document.write(`
                              <html>
                                <head><title>${msg.filename || 'Image'}</title></head>
                                <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000;">
                                  <img src="${msg.imageData || `/uploads/chat/${msg.filename}`}" style="max-width:100%;max-height:100%;object-fit:contain;" alt="${msg.filename || 'Image'}" />
                                </body>
                              </html>
                            `);
                          }}
                          title="Click to view full size"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        {/* Error fallback */}
                        <div className="hidden items-center justify-center h-32 bg-gray-200 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                          <div className="text-center text-gray-500 dark:text-gray-400">
                            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 17.333 3.924 19 5.464 19z" />
                            </svg>
                            <p className="text-xs">Image failed to load</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : msg.text?.startsWith('[Image:') && msg.text?.endsWith(']') ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                        <svg className="w-10 h-10 text-blue-400 dark:text-blue-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Image sent</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{msg.text.replace(/^\[Image:\s*/, '').replace(/\]$/, '')}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  )}
                  <div className="text-xs mt-1 opacity-70 flex justify-end items-center gap-1">
                    <div className="flex items-center gap-1">
                      {msg.isEdited && msg.isSent && (
                        <span className="text-xs italic">(edited)</span>
                      )}
                      {/* ⚡ INSTANT MESSAGING: Status indicators */}
                      {msg.isSent && (
                        <span className="flex items-center gap-1">
                          {msg.status === 'sending' && (
                            <>
                              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"></div>
                              <span className="text-gray-400 dark:text-gray-500">Sending...</span>
                            </>
                          )}
                          {msg.status === 'sent' && (
                            <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {msg.status === 'read' && (
                            <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {msg.status === 'failed' && (
                            <>
                              <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              <span className="text-red-500 text-xs cursor-pointer hover:underline" onClick={() => {
                                // Retry sending the message
                                chats.sendMessage(selectedChat.id, msg.text).catch(console.error);
                              }}>Retry</span>
                            </>
                          )}
                        </span>
                      )}
                      <span>{msg.time}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
  <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        {userCoins <= 5 && userCoins > 0 && (
          <div className="mb-2 text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 p-2 rounded flex items-center gap-1">
            <IconWarning className="w-4 h-4" /> Warning: You have only {userCoins} coins remaining
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              userCoins > 0 ? "Type a message..." : "You have no coins remaining. Please purchase coins to continue chatting."
            }
            disabled={userCoins <= 0}
            className="w-full px-4 py-3 resize-none bg-transparent focus:outline-none max-h-32 min-h-[2.5rem] disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || userCoins <= 0}
            className={`p-3 rounded-full ${
              newMessage.trim() && userCoins > 0
                ? 'bg-rose-500 text-white hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        {userCoins <= 0 && (
          <div className="mt-2 text-center">
            <button 
              onClick={() => setActiveSection('subscription-plans')}
              className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 text-sm"
            >
              Purchase coins to continue chatting
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatSection = ({ selectedChat, setSelectedChat, setActiveSection, onChatsUpdate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userChats, setUserChats] = useState([]);
  const [error, setError] = useState(null);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const data = await chats.getChats();
        // Format the chat data to include messages directly
        const formattedChats = data.map(chat => {
          const chatData = chat.chats[0];
          const messages = chatData?.messages || [];
          
          // Find the last message and format it properly for display
          let lastMessage = chatData?.lastMessage;
          if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.messageType === 'image') {
              lastMessage = '📷 Image';
            }
          }
          
          return {
            ...chat,
            messages: messages.map(msg => ({
              ...msg,
              // Ensure image messages have proper fields
              messageType: msg.messageType || 'text',
              imageData: msg.imageData,
              mimeType: msg.mimeType,
              filename: msg.filename
            })),
            id: chatData?.id,
            lastMessage: lastMessage,
            time: chatData?.time
          };
        });
        setUserChats(formattedChats);
        // Update parent component with chat data for unread count calculation
        if (onChatsUpdate) {
          onChatsUpdate(formattedChats);
        }
      } catch (error) {
        console.error('Failed to fetch chats:', error);
        setError('Failed to load chats');
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredChats = searchQuery 
    ? userChats.filter(chat => 
        chat.escortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.messages.some(m => 
          m.text.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : userChats;

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setShowChatOnMobile(true);
    }
  };

  // If a chat is preselected (e.g., from Members), show conversation on mobile automatically
  useEffect(() => {
    if (selectedChat && typeof window !== 'undefined' && window.innerWidth < 1024) {
      setShowChatOnMobile(true);
    }
  }, [selectedChat]);

  return (
    <>
      {/* Mobile layout: single pane with toggle between list and chat */}
      <div className="lg:hidden">
        {!showChatOnMobile ? (
          <div 
            className="rounded-xl shadow-lg shadow-pink-200/50 dark:shadow-gray-900/50 border border-pink-200/40 dark:border-gray-600/40 overflow-hidden transition-colors duration-300 bg-white/80 dark:bg-gray-800/80"
            style={{
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px 0 rgba(244, 114, 182, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Glass overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-100/30 via-transparent to-rose-200/20 dark:from-gray-800/30 dark:via-transparent dark:to-gray-700/20 pointer-events-none rounded-xl transition-colors duration-300"></div>
            
            <div className="p-4 border-b border-pink-200/40 dark:border-gray-600/40 bg-pink-50/20 dark:bg-gray-800/20 backdrop-blur-sm transition-colors duration-300">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-pink-200/50 dark:border-gray-600/50 focus:ring-2 focus:ring-pink-400 dark:focus:ring-pink-500 focus:border-transparent transition-all duration-150 text-gray-800 dark:text-gray-200 placeholder-pink-400 dark:placeholder-gray-400 bg-white/70 dark:bg-gray-800/70"
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.7) 0%, rgba(252,231,243,0.6) 100%)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 2px 10px rgba(244, 114, 182, 0.1)'
                  }}
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-400 hover:text-pink-600 transition-colors duration-150"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {filteredChats.length > 0 ? (
              <div className="p-4 space-y-2 h-[65vh] overflow-y-auto">
                {filteredChats.map(chat => (
                  <MessageItem
                    key={chat.escortId}
                    chat={chat}
                    isSelected={selectedChat?.escortId === chat.escortId}
                    onClick={() => handleSelectChat(chat)}
                  />
                ))}
              </div>
            ) : (
              <div className="h-[65vh] flex flex-col items-center justify-center text-pink-600 p-4">
                <svg className="w-16 h-16 text-pink-300 mb-4 drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-center font-medium">No messages found</p>
                <p className="text-sm text-center mt-2 text-pink-500">Start a conversation with an escort in the Members tab</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/40 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 h-[75vh]">
            {selectedChat ? (
              <ChatBox 
                selectedChat={selectedChat}
                setSelectedChat={setSelectedChat}
                setActiveSection={setActiveSection}
                onBack={() => setShowChatOnMobile(false)}
                onChatsUpdate={onChatsUpdate}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 p-6">
                <svg className="w-24 h-24 text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-700 mb-2">Your Messages</h3>
                <p className="text-center max-w-sm text-gray-500">Select a chat or find new connections in the Members tab</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop layout: two-pane */}
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Sidebar - Chat Lists with Pink Glass Morphism */}
        <div 
          className="rounded-xl shadow-lg shadow-pink-200/50 dark:shadow-gray-900/50 border border-pink-200/40 dark:border-gray-600/40 overflow-hidden bg-white/80 dark:bg-gray-800/80"
          style={{
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px 0 rgba(244, 114, 182, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          }}
        >
          {/* Glass overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-100/30 dark:from-gray-700/20 via-transparent to-rose-200/20 dark:to-gray-800/20 pointer-events-none rounded-xl"></div>
          
        <div className="p-4 border-b border-pink-200/40 dark:border-gray-600/40 bg-pink-50/20 dark:bg-gray-800/20 backdrop-blur-sm relative z-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-pink-200/50 dark:border-gray-600/50 focus:ring-2 focus:ring-pink-400 dark:focus:ring-pink-500 focus:border-transparent transition-all duration-150 text-gray-800 dark:text-gray-200 placeholder-pink-400 dark:placeholder-gray-400"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.7) 0%, rgba(252,231,243,0.6) 100%)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 10px rgba(244, 114, 182, 0.1)'
              }}
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pink-400 dark:text-pink-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-400 dark:text-pink-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors duration-150"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {filteredChats.length > 0 ? (
          <div className="p-4 space-y-2 h-[600px] overflow-y-auto relative z-10">
            {filteredChats.map(chat => (
              <MessageItem
                key={chat.escortId}
                chat={chat}
                  isSelected={selectedChat?.escortId === chat.escortId}
                  onClick={() => handleSelectChat(chat)}
              />
            ))}
          </div>
        ) : (
          <div className="h-[600px] flex flex-col items-center justify-center text-pink-600 p-4 relative z-10">
            <svg className="w-16 h-16 text-pink-300 mb-4 drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-center font-medium">No messages found</p>
            <p className="text-sm text-center mt-2 text-pink-500">Start a conversation with an escort in the Members tab</p>
          </div>
        )}
        </div>

        {/* Right - Chat Area */}
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 dark:border-gray-600/50 h-[700px]">
          {selectedChat ? (
            <ChatBox 
              selectedChat={selectedChat}
              setSelectedChat={setSelectedChat}
              setActiveSection={setActiveSection}
              error={error}
              onChatsUpdate={onChatsUpdate}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-6">
              <svg className="w-24 h-24 text-gray-300 dark:text-gray-600 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Your Messages</h3>
              <p className="text-center max-w-sm text-gray-500 dark:text-gray-400">Select a chat or find new connections in the Members tab</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
      >
        <motion.button
          className="w-14 h-14 rounded-full shadow-2xl border border-pink-300/40 backdrop-blur-md flex items-center justify-center group"
          style={{
            background: 'linear-gradient(145deg, rgba(244,114,182,0.9) 0%, rgba(236,72,153,0.95) 100%)',
            boxShadow: '0 8px 32px rgba(244, 114, 182, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
          }}
          whileHover={{ 
            scale: 1.1,
            boxShadow: '0 12px 40px rgba(244, 114, 182, 0.6)',
            rotate: 5
          }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <motion.svg 
            className="w-6 h-6 text-white drop-shadow-sm" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            whileHover={{ y: -2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </motion.svg>
        </motion.button>
      </motion.div>

      {/* Enhanced Background Particles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-pink-300/20 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>
    </>
  );
};

// Profile Detail Modal Component
const ProfileModal = ({ member, isOpen, onClose }) => {
  if (!isOpen || !member) return null;

  // Calculate age from dateOfBirth
  const age = member.dateOfBirth ? new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear() : null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="relative">
          {/* Profile Image */}
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
          
          {/* Status Badge */}
          {member.status && (
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                member.status === 'active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
              </span>
            </div>
          )}
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Name and Basic Info */}
          <div className="text-center border-b border-gray-200 dark:border-gray-600 pb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {member.firstName || member.username}
            </h2>
            {age && (
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">{age} years old</p>
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

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
              Personal Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Relationship Status */}
              {member.relationshipStatus && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Relationship</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      member.relationshipStatus === 'Single' ? 'bg-green-400' :
                      member.relationshipStatus === 'In Relationship' ? 'bg-yellow-400' :
                      member.relationshipStatus === 'Married' ? 'bg-red-400' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-gray-900 dark:text-gray-100">
                      {member.relationshipStatus}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Gender */}
              {member.gender && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Gender</span>
                  <span className="text-gray-900 dark:text-gray-100 capitalize">{member.gender}</span>
                </div>
              )}
              
              {/* Profession */}
              {member.profession && (
                <div className="col-span-2">
                  <span className="text-gray-500 dark:text-gray-400 block">Profession</span>
                  <span className="text-gray-900 dark:text-gray-100">{member.profession}</span>
                </div>
              )}
              
              {/* Height */}
              {member.height && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Height</span>
                  <span className="text-gray-900 dark:text-gray-100">{member.height} cm</span>
                </div>
              )}
              
              {/* Serial Number (if present) */}
              {member.serialNumber && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">ID</span>
                  <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">#{member.serialNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Interests */}
          {member.interests && member.interests.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
                Interests
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

          {/* Description/About Me */}
          {member.description && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
                About Me
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {member.description}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={() => {
                // TODO: Implement start chat functionality
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700 text-white rounded-lg font-medium transition-colors"
            >
              Start Chat
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ProfileSection = ({ user }) => {
  return (
    <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 dark:border-gray-600/50 p-6">
      {/* Simple Header */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-600">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
          {user?.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{user?.username}</h2>
          <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
        </div>
      </div>

      {/* Simple Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth:</span>
            <p className="text-gray-800 dark:text-gray-200">{new Date(user?.dateOfBirth).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender:</span>
            <p className="text-gray-800 dark:text-gray-200 capitalize">{user?.sex}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Location:</span>
            <p className="text-gray-800 dark:text-gray-200">{user?.location || 'Not specified'}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Bio:</span>
            <p className="text-gray-800 dark:text-gray-200">{user?.bio || 'No bio added yet'}</p>
          </div>
        </div>
      </div>

      {/* Change Password Button */}
      <div className="flex justify-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
        <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          Change Password
        </button>
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
  const [likeLoading, setLikeLoading] = useState(new Set()); // Track which profiles are being liked/unliked
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
  const LIKES_PAGE_SIZE = 500;

  const fetchAllLikedEscortIds = useCallback(async (authToken) => {
    if (!authToken) {
      return new Set();
    }

    const likedSet = new Set();
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const likeResponse = await likeService.getUserLikes(authToken, currentPage, LIKES_PAGE_SIZE);

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
  }, [LIKES_PAGE_SIZE]);

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

        const escortsPromise = escorts.getEscortProfiles({ full: true });
        const likesPromise = token ? fetchAllLikedEscortIds(token) : Promise.resolve(new Set());

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
    // Prevent multiple simultaneous requests for the same profile
    if (likeLoading.has(memberId)) {
      return;
    }

    try {
      // Add to loading set
      setLikeLoading(prev => new Set([...prev, memberId]));
      
      const isCurrentlyLiked = likedProfiles.has(memberId);
      
      if (isCurrentlyLiked) {
        await likeService.unlikeEscort(memberId, token);
        setLikedProfiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(memberId);
          return newSet;
        });
      } else {
        await likeService.likeEscort(memberId, token);
        setLikedProfiles(prev => new Set([...prev, memberId]));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      alert('Failed to update like status: ' + (err.message || 'Unknown error'));
    } finally {
      // Remove from loading set
      setLikeLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
    }
  };

  // Profile modal handlers
  const handleProfileClick = (member) => {
    setSelectedProfile(member);
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedProfile(null);
  };

  const filteredMembers = members.filter(member => {
    // Search query filter
    if (searchQuery && !member.username?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !member.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !member.country?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !member.region?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !member.profession?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !member.interests?.some(interest => interest.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }

    // Age filter
    if (filters.ageMin || filters.ageMax) {
      const age = member.dateOfBirth ? new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear() : null;
      if (filters.ageMin && age && age < parseInt(filters.ageMin)) return false;
      if (filters.ageMax && age && age > parseInt(filters.ageMax)) return false;
    }

    // Location filter
    if (filters.location && !member.country?.toLowerCase().includes(filters.location.toLowerCase()) &&
        !member.region?.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }

    return true;
  });

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
      {/* Compact Search Header */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 rounded-xl shadow-lg border border-pink-300/50 dark:border-pink-500/30 overflow-hidden transition-colors duration-300">
        {/* Main Header */}
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
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                <span className="text-sm font-medium">Filters</span>
                <motion.svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ rotate: showFilters ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </motion.svg>
              </motion.button>
            </div>
          </div>

          {/* Main Search Bar */}
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

        {/* Expandable Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-6 pb-6 border-t border-white/20">
                <div className="pt-4">
                  {/* Quick Filter Chips - Mobile */}
                  <div className="block sm:hidden mb-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, lookingFor: prev.lookingFor === 'female' ? '' : 'female' }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          filters.lookingFor === 'female' 
                            ? 'bg-white text-pink-600' 
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        <span className="flex items-center gap-1"><IconFemale className="w-4 h-4" /> Women</span>
                      </button>
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, lookingFor: prev.lookingFor === 'male' ? '' : 'male' }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          filters.lookingFor === 'male' 
                            ? 'bg-white text-pink-600' 
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        <span className="flex items-center gap-1"><IconMale className="w-4 h-4" /> Men</span>
                      </button>
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, ageMin: prev.ageMin ? '' : '18', ageMax: prev.ageMax ? '' : '30' }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          filters.ageMin || filters.ageMax 
                            ? 'bg-white text-pink-600' 
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        <span className="flex items-center gap-1"><IconCake className="w-4 h-4" /> 18-30</span>
                      </button>
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, relationStatus: prev.relationStatus === 'single' ? '' : 'single' }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          filters.relationStatus === 'single' 
                            ? 'bg-white text-pink-600' 
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        <span className="flex items-center gap-1"><IconHeartSpark className="w-4 h-4" /> Single</span>
                      </button>
                    </div>
                  </div>

                  {/* Desktop Advanced Filters */}
                  <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Looking For */}
                    <div>
                      <label className="block text-xs font-medium text-white/90 mb-2 uppercase tracking-wide">Looking For</label>
                      <select
                        value={filters.lookingFor}
                        onChange={(e) => setFilters(prev => ({ ...prev, lookingFor: e.target.value }))}
                        className="w-full px-3 py-3 rounded-lg border-0 bg-white/95 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-white/50 text-sm appearance-none cursor-pointer shadow-lg"
                      >
                        <option value="">All Genders</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>

                    {/* Relationship Status */}
                    <div>
                      <label className="block text-xs font-medium text-white/90 mb-2 uppercase tracking-wide">Relationship Status</label>
                      <select
                        value={filters.relationStatus}
                        onChange={(e) => setFilters(prev => ({ ...prev, relationStatus: e.target.value }))}
                        className="w-full px-3 py-3 rounded-lg border-0 bg-white/95 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-white/50 text-sm appearance-none cursor-pointer shadow-lg"
                      >
                        <option value="">Any Status</option>
                        <option value="single">Single</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                        <option value="separated">Separated</option>
                      </select>
                    </div>

                    {/* Age Range */}
                    <div>
                      <label className="block text-xs font-medium text-white/90 mb-2 uppercase tracking-wide">Age Range</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="18"
                          value={filters.ageMin}
                          onChange={(e) => setFilters(prev => ({ ...prev, ageMin: e.target.value }))}
                          className="w-full px-2 py-3 rounded-lg border-0 bg-white/95 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-white/50 text-sm text-center shadow-lg"
                          min="18"
                          max="99"
                        />
                        <input
                          type="number"
                          placeholder="99"
                          value={filters.ageMax}
                          onChange={(e) => setFilters(prev => ({ ...prev, ageMax: e.target.value }))}
                          className="w-full px-2 py-3 rounded-lg border-0 bg-white/95 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-white/50 text-sm text-center shadow-lg"
                          min="18"
                          max="99"
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-xs font-medium text-white/90 mb-2 uppercase tracking-wide">Location</label>
                      <select
                        value={filters.location}
                        onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
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

                  {/* Action Buttons */}
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
                      
                      {(searchQuery || Object.values(filters).some(v => v)) && (
                        <span className="text-xs px-3 py-1 bg-white/30 text-white rounded-full">
                          Active filters
                        </span>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Members Grid */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member._id}
              onClick={() => handleProfileClick(member)}
              className="bg-white/20 dark:bg-gray-800/30 backdrop-blur-lg rounded-2xl shadow-lg shadow-pink-200/40 dark:shadow-gray-900/40 border border-white/30 dark:border-gray-600/30 hover:shadow-2xl hover:shadow-pink-300/60 dark:hover:shadow-gray-700/60 hover:bg-white/30 dark:hover:bg-gray-700/40 hover:border-pink-200/50 dark:hover:border-gray-500/50 transition-all duration-300 overflow-hidden group relative transform hover:scale-105 cursor-pointer"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.25) 0%, rgba(252,231,243,0.35) 50%, rgba(254,202,202,0.25) 100%)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px 0 rgba(244, 114, 182, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                y: -8,
                rotateY: 5,
                boxShadow: "0 20px 40px rgba(244, 114, 182, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Glass effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-pink-100/20 pointer-events-none rounded-2xl"></div>
              <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-2xl"></div>
              
              {/* Profile Image - Enhanced with glassy styling */}
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
                
                {/* Glassy overlay with pink tints */}
                <div className="absolute inset-0 bg-gradient-to-t from-pink-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                  <div className="flex space-x-3">
                    {/* Enhanced Glassy Like Button */}
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
                        likeLoading.has(member._id) ? "Loading..." :
                        likedProfiles.has(member._id) ? "Unlike" : "Like"
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
                        fill={likedProfiles.has(member._id) ? "currentColor" : "none"} 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>

                    {/* Enhanced Glassy Chat Button */}
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
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.3) 0%, rgba(244,114,182,0.2) 100%)',
                        backdropFilter: 'blur(15px)',
                        boxShadow: '0 4px 20px rgba(244, 114, 182, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                      }}
                    >
                      <FiMessageSquare className="w-5 h-5 text-white drop-shadow-sm" />
                    </button>
                  </div>
                </div>

                {/* Enhanced Glassy Age Badge */}
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

                {/* Glassy Online Status Indicator */}
                <div 
                  className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
                  style={{
                    boxShadow: '0 0 10px rgba(34, 197, 94, 0.5), 0 2px 4px rgba(244, 114, 182, 0.2)'
                  }}
                ></div>
              </div>

              {/* Enhanced Glassy Profile Info */}
              <div className="p-3 sm:p-4 relative z-10 bg-white/10 dark:bg-gray-700/20 backdrop-blur-sm rounded-b-2xl">
                {/* Username with age */}
                <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-100 leading-tight mb-1 drop-shadow-sm">
                  <span className="truncate block">{member.firstName || member.username}</span>
                  {member.dateOfBirth && (
                    <span className="text-xs font-normal text-gray-600 dark:text-gray-400 block">
                      {new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear()} years old
                    </span>
                  )}
                </h3>
                
                {/* Location with enhanced styling */}
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate mb-2">
                  <IconPin className="w-3.5 h-3.5 text-pink-400 dark:text-pink-300 flex-shrink-0 drop-shadow-sm" />
                  <span className="truncate drop-shadow-sm">{member.country || member.region || 'Unknown'}</span>
                </div>

                {/* Enhanced Profile Stats */}
                <div className="hidden sm:flex flex-col gap-2 mt-3 text-xs">
                  {/* Online Status */}
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-1 text-green-700 dark:text-green-400 px-2 py-1 rounded-full border border-white/30 dark:border-gray-600/30"
                      style={{
                        background: 'linear-gradient(145deg, rgba(34,197,94,0.15) 0%, rgba(255,255,255,0.25) 100%)',
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
                          background: 'linear-gradient(145deg, rgba(255,255,255,0.25) 0%, rgba(244,114,182,0.15) 100%)',
                          backdropFilter: 'blur(8px)',
                          boxShadow: '0 2px 8px rgba(244, 114, 182, 0.15)'
                        }}
                      >
                        {member.profession}
                      </span>
                    )}
                  </div>
                  
                  {/* Relationship Status */}
                  {member.relationshipStatus && (
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        member.relationshipStatus === 'single' ? 'bg-green-400' :
                        member.relationshipStatus === 'in_relationship' ? 'bg-yellow-400' :
                        member.relationshipStatus === 'married' ? 'bg-red-400' : 'bg-gray-400'
                      }`}></div>
                      <span className="text-gray-600 dark:text-gray-400 capitalize text-xs">
                        {member.relationshipStatus.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  {/* Tap for details hint */}
                  <div className="flex items-center gap-1 text-xs text-pink-400 dark:text-pink-300 opacity-70">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Tap for details</span>
                  </div>
                </div>

                {/* Enhanced Glassy Mobile Action Buttons */}
                <div className="flex sm:hidden justify-center space-x-2 mt-3 pt-3 border-t border-white/30 dark:border-gray-600/30">
                  {/* Glassy Like Button */}
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
                      likeLoading.has(member._id) ? "Loading..." :
                      likedProfiles.has(member._id) ? "Unlike" : "Like"
                    }
                    style={{
                      background: likedProfiles.has(member._id) 
                        ? 'linear-gradient(145deg, rgba(239,68,68,0.25) 0%, rgba(220,38,38,0.15) 100%)'
                        : 'linear-gradient(145deg, rgba(255,255,255,0.25) 0%, rgba(229,231,235,0.35) 100%)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 15px rgba(244, 114, 182, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <svg className="w-4 h-4 drop-shadow-sm" fill={likedProfiles.has(member._id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>

                  {/* Enhanced Glassy Chat Button */}
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
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="text-lg sm:text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No members found</h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            {searchQuery ? 'Try adjusting your search terms or filters' : 'No members available at the moment'}
          </p>
          {(searchQuery || Object.values(filters).some(v => v)) && (
            <button 
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700 text-white rounded-lg transition-colors text-sm"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal 
        member={selectedProfile}
        isOpen={showProfileModal}
        onClose={handleCloseProfileModal}
      />
    </div>
  );
};

const LikedProfilesSection = ({ setActiveSection, setSelectedChat, handleStartChat }) => {
  const [likedProfiles, setLikedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const { token } = useAuth();
  const { t } = useSwedishTranslation();

  useEffect(() => {
    const fetchLikedProfiles = async () => {
      try {
        setLoading(true);
        const response = await likeService.getUserLikes(token, currentPage, 20);
        setLikedProfiles(response.likes);
        setPagination(response.pagination);
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
      setLikedProfiles(prev => prev.filter(like => like.escortId._id !== escortId));
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
      {/* Header */}
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

      {/* Liked Profiles Grid */}
      {likedProfiles.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
          {likedProfiles.map((like) => (
            <motion.div
              key={like._id}
              className="bg-white/20 dark:bg-gray-800/30 backdrop-blur-lg rounded-2xl shadow-lg shadow-pink-200/40 dark:shadow-gray-900/40 border border-white/30 dark:border-gray-600/30 hover:shadow-2xl hover:shadow-pink-300/60 dark:hover:shadow-gray-700/60 hover:bg-white/30 dark:hover:bg-gray-700/40 hover:border-pink-200/50 dark:hover:border-gray-500/50 transition-all duration-300 overflow-hidden group relative transform hover:scale-105"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.25) 0%, rgba(252,231,243,0.35) 50%, rgba(254,202,202,0.25) 100%)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(236, 72, 153, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0 }}
            >
              {/* Glass overlay effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-pink-100/20 pointer-events-none rounded-2xl"></div>
              <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-2xl"></div>
              
              {/* Profile Image */}
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
                
                {/* Unlike button overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-pink-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                  <div className="flex space-x-3">
                    {/* Unlike Button */}
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
                      <svg className="w-5 h-5 text-white drop-shadow-sm group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        <path d="M6 8L18 8M6 16L18 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>

                    {/* Chat Button */}
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

              {/* Profile Info */}
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
                        : like.escortId.country || 'Location not specified'
                      }
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
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-white/80 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
          >
            Previous
          </button>
          <span className="px-3 py-1 bg-rose-500 text-white rounded-lg">
            {currentPage} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
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

const UserDashboard = () => {
  const { user, token, logout } = useAuth();
  const { t } = useSwedishTranslation();
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeSection, setActiveSection] = useState('members');
  const [userCoins, setUserCoins] = useState(0);
  const [allUserChats, setAllUserChats] = useState([]); // Add state to track all chats

  // Initialize chat data on component mount (not just when chat tab is opened)
  useEffect(() => {
    const fetchAllChats = async () => {
      try {
        const data = await chats.getChats();
        const formattedChats = data.map(chat => {
          const chatData = chat.chats[0];
          const messages = chatData?.messages || [];
          
          let lastMessage = chatData?.lastMessage;
          if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.messageType === 'image') {
              lastMessage = '📷 Image';
            }
          }
          
          return {
            ...chat,
            messages: messages.map(msg => ({
              ...msg,
              messageType: msg.messageType || 'text',
              imageData: msg.imageData,
              mimeType: msg.mimeType,
              filename: msg.filename
            })),
            id: chatData?.id,
            lastMessage: lastMessage,
            time: chatData?.time
          };
        });
        setAllUserChats(formattedChats);
      } catch (error) {
        console.error('Failed to fetch chats for badge:', error);
      }
    };

    fetchAllChats();
  }, []);

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Function to show web notification
  const showWebNotification = (escortName, message, profileImage) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`New message from ${escortName}`, {
        body: message,
        icon: profileImage || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'chat-message', // This replaces previous notifications
        requireInteraction: false,
        silent: false
      });

      // Auto close after 2 seconds
      setTimeout(() => {
        notification.close();
      }, 2000);

      // Handle click to open chat
      notification.onclick = () => {
        window.focus();
        setActiveSection('messages');
        notification.close();
      };
    }
  };

  // Function to calculate total unread messages
  const getTotalUnreadCount = () => {
    return allUserChats.reduce((total, chat) => {
      const unreadCount = chat.messages?.filter(m => !m.isSent && !m.readByCustomer).length || 0;
      return total + unreadCount;
    }, 0);
  };

  // Listen for WebSocket messages to update unread count in real-time
  useEffect(() => {
    const messageUnsub = websocketService.onMessage((data) => {
      if (data.type === 'chat_message' && data.sender === 'agent') {
        // Update the allUserChats when we receive a new message from agent
        setAllUserChats(prevChats => {
          return prevChats.map(chat => {
            if (chat.id === data.chatId) {
              const newMessage = {
                text: data.messageType === 'image' ? '📷 Image' : data.message,
                time: new Date(data.timestamp).toLocaleString(),
                isSent: false, // Message from agent
                readByCustomer: false, // Mark as unread
                sender: data.sender,
                messageType: data.messageType,
                imageData: data.imageData,
                mimeType: data.mimeType,
                filename: data.filename
              };

              // Show web notification for new message
              const displayMessage = data.messageType === 'image' ? '📷 Sent an image' : data.message;
              showWebNotification(chat.escortName, displayMessage, chat.profileImage);

              return {
                ...chat,
                messages: [...(chat.messages || []), newMessage],
                lastMessage: data.messageType === 'image' ? '📷 Image' : data.message,
                time: new Date(data.timestamp).toLocaleString()
              };
            }
            return chat;
          });
        });
      }

      // Handle when messages are marked as read
      if (data.type === 'messages_read' && data.readBy === 'customer') {
        setAllUserChats(prevChats => {
          return prevChats.map(chat => {
            if (chat.id === data.chatId) {
              return {
                ...chat,
                messages: chat.messages?.map(msg => ({
                  ...msg,
                  readByCustomer: !msg.isSent ? true : msg.readByCustomer // Mark agent messages as read
                })) || []
              };
            }
            return chat;
          });
        });
      }
    });

    return () => {
      if (messageUnsub) messageUnsub();
    };
  }, []);

  // Handle starting a chat with a member (supports prefill merge)
  const handleStartChat = async (memberId, prefill = {}) => {
    try {
      // Create or get existing chat with this member
      const response = await chats.startChat(memberId);
      
      // Switch to messages section and select the chat
      if (response && response.chatId) {
        // Get member info from the escorts service to create proper chat data
        let memberInfo = null;
        try {
          const escortProfiles = await escorts.getEscortProfiles({ full: true });
          const allMembers = escortProfiles.data || escortProfiles || [];
          memberInfo = allMembers.find(m => m._id === memberId);
        } catch (err) {
          console.error('Error fetching member info:', err);
        }
        
        const chatData = {
          id: response.chatId,
          escortId: memberId,
          escortName: memberInfo?.firstName || memberInfo?.username || prefill.escortName || response.escortName || 'Member',
          profileImage: memberInfo?.profileImage || prefill.profileImage || response.profileImage,
          messages: [],
          isOnline: true,
          time: new Date().toLocaleString()
        };

        // If we've already optimistically selected this member, merge the new id
        setSelectedChat(prev => {
          if (prev && (prev.escortId === memberId)) {
            return { ...prev, id: response.chatId };
          }
          return chatData;
        });
        
        // Ensure we are on messages tab
        setActiveSection('messages');
        
        console.log('🎯 Chat started successfully:', chatData);
      }
    } catch (err) {
      console.error('❌ Error starting chat:', err);
      alert('Failed to start chat. Please try again.');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeSection !== 'messages') {
      setSelectedChat(null);
    }
  }, [activeSection]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const userRes = await axios.get(`${config.API_URL}/subscription/coins/balance`, { headers });
        setUserCoins(userRes.data.balance);
      } catch (err) {
        console.error('Error fetching user coins:', err);
      }
    };

    if (user && token) {
      fetchUserData();
    }
  }, [user, token]);

  const handlePurchaseSuccess = (newCoinBalance) => {
    setUserCoins(newCoinBalance);
    // You could add a toast notification here instead of the alert
    // toast.success('Coins purchased successfully!');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 mb-4 mx-auto">
            <div className="w-full h-full rounded-full border-4 border-rose-500 border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300">
            {loading ? 'Preparing your dashboard...' : 'Please sign in to continue'}
          </h2>
        </motion.div>
      </div>
    );
  }



  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-rose-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 transition-colors duration-300">
      {/* MagnetLines Background - Above everything but below content */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <MagnetLines
          rows={12}
          columns={12}
          containerSize="100vw"
          lineColor="#f472b6"
          lineWidth="2px"
          lineHeight="40px"
          baseAngle={-5}
          className="w-full h-full opacity-30 dark:opacity-20"
        />
      </div>

      {/* Enhanced Background */}
      <div className="fixed inset-0 -z-10">
        {/* Clean Gradient Background - Subtle Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-rose-50/40 to-pink-100/50 dark:from-gray-900/90 dark:via-gray-800/60 dark:to-slate-900/70 transition-colors duration-300"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-rose-100/30 dark:from-gray-900/40 dark:via-transparent dark:to-purple-900/20 transition-colors duration-300"></div>

        {/* Floating Elements positioned above magnet lines */}
        <div className="absolute inset-0" style={{ zIndex: -1 }}>
          {/* Dynamic Floating Shapes */}
          <motion.div
            className="absolute rounded-full mix-blend-multiply filter blur-xl opacity-15 bg-gradient-to-r from-rose-400 to-pink-400 w-96 h-96 -top-48 -left-48"
            animate={{
              y: [0, 50, 0],
              x: [0, 30, 0],
              scale: [1, 1.3, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute rounded-full mix-blend-multiply filter blur-xl opacity-15 bg-gradient-to-r from-pink-300 to-rose-300 w-80 h-80 top-1/3 -right-40"
            animate={{
              y: [0, 50, 0],
              x: [0, 30, 0],
              scale: [1, 1.3, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
          <motion.div
            className="absolute rounded-full mix-blend-multiply filter blur-xl opacity-15 bg-gradient-to-r from-red-300 to-rose-400 w-64 h-64 bottom-20 left-1/4"
            animate={{
              y: [0, 50, 0],
              x: [0, 30, 0],
              scale: [1, 1.3, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
          />
          <motion.div
            className="absolute rounded-full mix-blend-multiply filter blur-xl opacity-15 bg-gradient-to-r from-purple-300 to-pink-300 w-48 h-48 top-1/2 left-1/2"
            animate={{
              y: [0, 50, 0],
              x: [0, 30, 0],
              scale: [1, 1.3, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 6
            }}
          />
        </div>
      </div>

      {/* Top Header */}
      <motion.header 
        className="relative z-10 bg-white/50 dark:bg-gray-900/60 backdrop-blur-sm shadow-lg border-b border-rose-200/50 dark:border-gray-700/50 transition-colors duration-300"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-rose-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">HetaSinglar</h1>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-1 sm:space-x-3">
              {/* Theme Toggle */}
              <ThemeToggle size="small" />
              
              {/* Country Flag - Hidden on very small screens */}
              <div className="hidden sm:flex items-center space-x-2">
                <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400"><IconGlobe className="w-4 h-4" /> US</span>
              </div>
              
              {/* Help - Hidden on mobile */}
              <button className="hidden md:flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{t('help')}</span>
              </button>
              
              {/* Logout */}
              <motion.button
                onClick={logout}
                className="flex items-center space-x-1 bg-rose-500 dark:bg-rose-600 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-rose-600 dark:hover:bg-rose-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v-8" />
                </svg>
                <span className="text-xs sm:text-sm">{t('logout')}</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Navigation Tabs */}
      <nav className="relative z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border-b border-rose-200/50 dark:border-gray-600/50 overflow-x-auto transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Navigation Tabs */}
            <div className="flex space-x-2 sm:space-x-6 lg:space-x-8 min-w-max">
              {[
                              { key: 'members', label: t('members'), icon: <IconUsers className="w-4 h-4 sm:w-5 sm:h-5" /> },
                              { key: 'messages', label: t('chat'), icon: <FiMessageSquare className="w-4 h-4 sm:w-5 sm:h-5" /> , badge: getTotalUnreadCount() > 0 ? getTotalUnreadCount() : null },
                              { key: 'liked-profiles', label: t('liked'), icon: <IconHeartSpark className="w-4 h-4 sm:w-5 sm:h-5" /> }
                            ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key)}
                  className={`relative flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 ${
                    activeSection === tab.key
                      ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <span className="text-sm sm:text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-xs">{tab.label.substring(0, 4)}</span>
                  {tab.badge && (
                    <span className="absolute -top-1 -right-1 sm:-top-1 sm:-right-2 bg-rose-500 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full min-w-[16px] sm:min-w-[20px] h-4 sm:h-5 flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-1 sm:space-x-3 lg:space-x-4 ml-2">
              {/* Coins Display */}
              <div className="flex items-center space-x-1 sm:space-x-2 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 sm:px-4 sm:py-2 rounded-full border border-yellow-200 dark:border-yellow-600/30 transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 4a6 6 0 110 12 6 6 0 010-12z"/>
                </svg>
                <span className="text-xs sm:text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  <span className="hidden sm:inline">{userCoins} {t('credits')}</span>
                  <span className="sm:hidden">{userCoins}</span>
                </span>
              </div>

              {/* Buy Credits Button */}
              <button
                onClick={() => setActiveSection('subscription-plans')}
                className="bg-rose-500 dark:bg-rose-600 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-rose-600 dark:hover:bg-rose-700 transition-all duration-200 font-medium text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">{t('buyCredits')}</span>
                <span className="sm:hidden">{t('buy')}</span>
              </button>

              {/* Profile Button */}
              <button
                onClick={() => setActiveSection('my profile')}
                className="flex items-center space-x-1 sm:space-x-2 bg-purple-500 dark:bg-purple-600 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-purple-600 dark:hover:bg-purple-700 transition-all duration-200 text-xs sm:text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">{t('profile')}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6">
        <div className="min-h-[70vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="w-full"
            >
              {activeSection === 'messages' && (
                <ChatSection 
                  selectedChat={selectedChat} 
                  setSelectedChat={setSelectedChat}
                  setActiveSection={setActiveSection}
                  onChatsUpdate={setAllUserChats} // Add callback to update parent chat data
                />
              )}

              {activeSection === 'members' && (
                <MembersSection 
                  setActiveSection={setActiveSection}
                  setSelectedChat={setSelectedChat}
                  handleStartChat={handleStartChat}
                />
              )}

              {activeSection === 'liked-profiles' && (
                <LikedProfilesSection 
                  setActiveSection={setActiveSection}
                  setSelectedChat={setSelectedChat}
                  handleStartChat={handleStartChat}
                />
              )}

              {activeSection === 'subscription-plans' && (
                <SubscriptionPlans 
                  isInDashboard={true}
                  onPurchaseSuccess={handlePurchaseSuccess}
                />
              )}

              {activeSection === 'my profile' && <ProfileSection user={user} />}
            </motion.div>
          </AnimatePresence>
        </div>
        </main>
      </div>
    );
  };

export default UserDashboard;
