import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { escorts, chats } from '../../services/api';
import websocketService from '../../services/websocket';
import axios from 'axios';
import SubscriptionPlans from './SubscriptionPlans';
import config from '../../config/environment';

const MessageItem = ({ chat, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-lg cursor-pointer transition-colors ${
      isSelected ? 'bg-rose-100' : 'bg-white/70'
    }`}
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
          <h3 className="font-semibold text-gray-800 truncate">{chat.escortName}</h3>
          <span className="text-xs text-gray-500 flex-shrink-0">{chat.time}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {chat.isTyping ? (
            <div className="flex items-center gap-0.5">
              <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <span className="text-xs text-rose-500 ml-1">typing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 w-full">
              <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
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
  </div>
);

const ChatBox = ({ selectedChat, setSelectedChat, setActiveSection, onBack }) => {
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

    return () => {
      messageUnsub();
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
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  const messages = selectedChat.messages || [];

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back button for mobile */}
            <button
              type="button"
              onClick={() => onBack && onBack()}
              className="lg:hidden mr-1 p-2 rounded-md hover:bg-gray-100"
              aria-label="Back to chats"
            >
              <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h3 className="font-semibold text-gray-800">{selectedChat.escortName}</h3>
            <span className={`w-2 h-2 rounded-full ${selectedChat.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <span className="flex items-center">
              <svg className="w-4 h-4 text-yellow-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 4a6 6 0 110 12 6 6 0 010-12z"/>
              </svg>
              {userCoins} coins
            </span>
            {userCoins <= 5 && userCoins > 0 && (
              <span className="text-yellow-600 text-xs">⚠️ Low balance</span>
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-gray-50 to-rose-50">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.isSent ? 'justify-end' : 'justify-start'} items-end gap-2`}
          >
            <div className={`max-w-[70%] relative group ${
              msg.isSent ? 'bg-rose-500 text-white' : 'bg-white text-gray-800'
            } rounded-2xl px-4 py-2 shadow-sm ${msg.isDeleted ? 'opacity-50 bg-gray-400' : ''}`}>
              
              {/* Edit/Delete buttons for user's own messages */}
              {msg.isSent && !msg.isDeleted && msg.messageType !== 'image' && msg.text !== '📷 Image' && (
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

              {!msg.isSent && <div className="text-xs text-gray-600 mb-1">{selectedChat.escortName}</div>}
              
              {/* Message content - show edit input or regular message */}
              {editingMessage === index ? (
                <div className="space-y-2">
                  <textarea
                    value={editMessageText}
                    onChange={(e) => setEditMessageText(e.target.value)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                    rows="3"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEditMessage}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEditMessage}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
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
                        <div className="hidden items-center justify-center h-32 bg-gray-200 rounded-lg border border-gray-300">
                          <div className="text-center text-gray-500">
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
                      <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg border border-gray-300">
                        <svg className="w-10 h-10 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-blue-600">Image sent</p>
                          <p className="text-xs text-gray-500">{msg.text.replace(/^\[Image:\s*/, '').replace(/\]$/, '')}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  )}
                  <div className="text-xs mt-1 opacity-70 flex justify-end items-center gap-1">
                    <div className="flex items-center gap-1">
                      {msg.isEdited && (
                        <span className="text-xs italic">(edited)</span>
                      )}
                      {/* ⚡ INSTANT MESSAGING: Status indicators */}
                      {msg.isSent && (
                        <span className="flex items-center gap-1">
                          {msg.status === 'sending' && (
                            <>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                              <span className="text-gray-400">Sending...</span>
                            </>
                          )}
                          {msg.status === 'sent' && (
                            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
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
  <div className="border-t border-gray-200 p-4 bg-white/90 backdrop-blur-sm">
        {userCoins <= 5 && userCoins > 0 && (
          <div className="mb-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
            ⚠️ Warning: You have only {userCoins} coins remaining
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
                ? 'bg-rose-500 text-white hover:bg-rose-600' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
              className="text-rose-500 hover:text-rose-600 text-sm"
            >
              Purchase coins to continue chatting
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatSection = ({ selectedChat, setSelectedChat, setActiveSection }) => {
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
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all duration-150"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-150"
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
              <div className="h-[65vh] flex flex-col items-center justify-center text-gray-500 p-4">
                <svg className="w-16 h-16 text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-center">No messages found</p>
                <p className="text-sm text-center mt-2">Start a conversation with an escort in the Members tab</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-[75vh]">
            {selectedChat ? (
              <ChatBox 
                selectedChat={selectedChat}
                setSelectedChat={setSelectedChat}
                setActiveSection={setActiveSection}
                onBack={() => setShowChatOnMobile(false)}
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
        {/* Left Sidebar - Chat Lists */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all duration-150"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-150"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {filteredChats.length > 0 ? (
          <div className="p-4 space-y-2 h-[600px] overflow-y-auto">
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
          <div className="h-[600px] flex flex-col items-center justify-center text-gray-500 p-4">
            <svg className="w-16 h-16 text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-center">No messages found</p>
            <p className="text-sm text-center mt-2">Start a conversation with an escort in the Members tab</p>
          </div>
        )}
        </div>

        {/* Right - Chat Area */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-[700px]">
          {selectedChat ? (
            <ChatBox 
              selectedChat={selectedChat}
              setSelectedChat={setSelectedChat}
              setActiveSection={setActiveSection}
              error={error}
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
      </div>
    </>
  );
};

const ProfileSection = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    dateOfBirth: user?.dateOfBirth || '',
    sex: user?.sex || '',
    bio: user?.bio || '',
    location: user?.location || '',
    interests: user?.interests || []
  });

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden"
      >
        {/* Profile Header */}
        <div className="relative h-32 sm:h-48 bg-gradient-to-r from-rose-400 to-pink-500">
          <div className="absolute -bottom-12 sm:-bottom-16 left-4 sm:left-8 flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="h-24 w-24 sm:h-32 sm:w-32 rounded-xl bg-white p-1 shadow-lg"
            >
              <div className="h-full w-full rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-2xl sm:text-4xl font-bold">
                {user?.username.charAt(0).toUpperCase()}
              </div>
            </motion.div>
            <div className="mb-2 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">{user?.username}</h2>
              <p className="text-white/80 text-sm sm:text-base">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="mt-16 sm:mt-20 p-4 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Basic Information
              </h3>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
                  <p className="text-gray-800 text-sm sm:text-base">{profileData.username}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-gray-800 text-sm sm:text-base break-all">{profileData.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                  <p className="text-gray-800 text-sm sm:text-base">
                    {new Date(profileData.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Gender</label>
                  <p className="text-gray-800 capitalize text-sm sm:text-base">{profileData.sex}</p>
                </div>
              </div>
            </div>

            {/* Right Column - Additional Info */}
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Additional Information
              </h3>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                  <p className="text-gray-800 text-sm sm:text-base">{profileData.location || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Interests</label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.interests && profileData.interests.length > 0 ? (
                      profileData.interests.map((interest, index) => (
                        <span 
                          key={index}
                          className="bg-rose-100 text-rose-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm"
                        >
                          {interest}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 text-xs sm:text-sm">No interests added yet</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Bio</label>
                  <p className="text-gray-800 whitespace-pre-wrap text-sm sm:text-base">
                    {profileData.bio || 'No bio added yet'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Change Password
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-white/50"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-rose-100 text-rose-600 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Notifications</h3>
              <p className="text-xs sm:text-sm text-gray-500">Manage your alerts and notifications</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-white/50"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-rose-100 text-rose-600 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Privacy & Security</h3>
              <p className="text-xs sm:text-sm text-gray-500">Control your privacy settings</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-white/50 sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-rose-100 text-rose-600 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Language & Region</h3>
              <p className="text-xs sm:text-sm text-gray-500">Set your preferred language</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const MembersSection = ({ setActiveSection, setSelectedChat, handleStartChat }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    lookingFor: '',
    relationStatus: '',
    hasChildren: '',
    ageMin: '',
    ageMax: '',
    location: ''
  });

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await escorts.getEscortProfiles();
        setMembers(response.data || response || []);
      } catch (err) {
        console.error('Error fetching members:', err);
        setError('Failed to load members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

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
    setFilters({
      lookingFor: '',
      relationStatus: '',
      hasChildren: '',
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
      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-rose-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-lg font-semibold text-gray-800">Find Your Perfect Match</h3>
            </div>
            <span className="text-xs sm:text-sm text-gray-500">{filteredMembers.length} found</span>
          </div>
        </div>

        {/* Mobile-First Search */}
        <div className="p-3 sm:p-6">
          {/* Main Search Bar - Always Visible */}
          <div className="mb-3 sm:mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search members by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm shadow-sm"
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

          {/* Quick Filter Chips - Mobile Optimized */}
          <div className="block sm:hidden mb-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, lookingFor: prev.lookingFor === 'female' ? '' : 'female' }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filters.lookingFor === 'female' 
                    ? 'bg-rose-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                👩 Women
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, lookingFor: prev.lookingFor === 'male' ? '' : 'male' }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filters.lookingFor === 'male' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                👨 Men
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, ageMin: prev.ageMin ? '' : '18', ageMax: prev.ageMax ? '' : '30' }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filters.ageMin || filters.ageMax 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🎂 18-30
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, relationStatus: prev.relationStatus === 'single' ? '' : 'single' }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filters.relationStatus === 'single' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                💝 Single
              </button>
            </div>
          </div>

          {/* Advanced Filters - Collapsible on Mobile */}
          <div className="sm:block">
            <details className="sm:hidden group">
              <summary className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <span className="text-sm font-medium text-gray-700">Advanced Filters</span>
                <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-3 space-y-3">
                {/* Mobile Advanced Filters */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Age Range</label>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="number"
                        placeholder="18"
                        value={filters.ageMin}
                        onChange={(e) => setFilters(prev => ({ ...prev, ageMin: e.target.value }))}
                        className="w-full px-2 py-2 rounded-lg border border-gray-200 focus:ring-1 focus:ring-rose-500 text-xs text-center"
                        min="18"
                        max="99"
                      />
                      <input
                        type="number"
                        placeholder="99"
                        value={filters.ageMax}
                        onChange={(e) => setFilters(prev => ({ ...prev, ageMax: e.target.value }))}
                        className="w-full px-2 py-2 rounded-lg border border-gray-200 focus:ring-1 focus:ring-rose-500 text-xs text-center"
                        min="18"
                        max="99"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Relationship</label>
                    <select
                      value={filters.relationStatus}
                      onChange={(e) => setFilters(prev => ({ ...prev, relationStatus: e.target.value }))}
                      className="w-full px-2 py-2 rounded-lg border border-gray-200 focus:ring-1 focus:ring-rose-500 text-xs"
                    >
                      <option value="">Any</option>
                      <option value="single">Single</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Children</label>
                    <select
                      value={filters.hasChildren}
                      onChange={(e) => setFilters(prev => ({ ...prev, hasChildren: e.target.value }))}
                      className="w-full px-2 py-2 rounded-lg border border-gray-200 focus:ring-1 focus:ring-rose-500 text-xs"
                    >
                      <option value="">Any</option>
                      <option value="0">None</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                    <select
                      value={filters.location}
                      onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-2 py-2 rounded-lg border border-gray-200 focus:ring-1 focus:ring-rose-500 text-xs"
                    >
                      <option value="">All</option>
                      <option value="usa">🇺🇸 USA</option>
                      <option value="canada">🇨🇦 Canada</option>
                      <option value="uk">🇬🇧 UK</option>
                      <option value="australia">🇦🇺 Australia</option>
                    </select>
                  </div>
                </div>
              </div>
            </details>

            {/* Desktop Filters */}
            <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
              {/* Looking For */}
              <div className="xl:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Looking For</label>
                <select
                  value={filters.lookingFor}
                  onChange={(e) => setFilters(prev => ({ ...prev, lookingFor: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm appearance-none cursor-pointer"
                >
                  <option value="">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* Relation Status */}
              <div className="xl:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Relationship Status</label>
                <select
                  value={filters.relationStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, relationStatus: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm appearance-none cursor-pointer"
                >
                  <option value="">Any Status</option>
                  <option value="single">Single</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                  <option value="separated">Separated</option>
                </select>
              </div>

              {/* Children */}
              <div className="xl:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Children</label>
                <select
                  value={filters.hasChildren}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasChildren: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm appearance-none cursor-pointer"
                >
                  <option value="">Any</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="more">5+ More</option>
                </select>
              </div>

              {/* Age Range */}
              <div className="xl:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Age Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="18"
                    value={filters.ageMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, ageMin: e.target.value }))}
                    className="w-full px-2 sm:px-3 py-2 sm:py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm text-center"
                    min="18"
                    max="99"
                  />
                  <input
                    type="number"
                    placeholder="99"
                    value={filters.ageMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, ageMax: e.target.value }))}
                    className="w-full px-2 sm:px-3 py-2 sm:py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm text-center"
                    min="18"
                    max="99"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="xl:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Location</label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm appearance-none cursor-pointer"
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
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-0">
              <button
                onClick={resetFilters}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-150 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="font-medium">Reset</span>
              </button>
              
              {(searchQuery || Object.values(filters).some(v => v)) && (
                <span className="text-xs px-2 py-1 bg-rose-100 text-rose-700 rounded-full">
                  Active filters
                </span>
              )}
            </div>

            <div className="hidden sm:block">
              <button
                className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:from-rose-600 hover:to-purple-700 transition-all duration-150 shadow-md hover:shadow-lg font-medium text-sm"
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

      {/* Members Grid */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
          {filteredMembers.map((member) => (
            <div
              key={member._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              {/* Profile Image - Optimized for Mobile */}
              <div className="relative aspect-[3/4] bg-gray-100">
                {member.profileImage ? (
                  <img 
                    src={member.profileImage} 
                    alt={member.firstName || member.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 text-xl sm:text-2xl lg:text-3xl font-bold">
                    {(member.firstName || member.username)?.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {/* Quick Action Overlay - Shows on Hover/Touch */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    {/* Heart/Like Button */}
                    <button
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-150 shadow-lg"
                      title="Like"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>

                    {/* Chat Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Immediately switch to Chat tab for instant UX
                        setActiveSection('messages'); 
                        // Optimistically select this member's chat (no id yet)
                        setSelectedChat({
                          escortId: member._id,
                          escortName: member.firstName || member.username || 'Member',
                          profileImage: member.profileImage,
                          messages: [],
                          isOnline: true,
                          time: new Date().toLocaleString()
                        });
                        // Start or fetch the chat in background and merge id when ready
                        handleStartChat(member._id, {
                          escortName: member.firstName || member.username || 'Member',
                          profileImage: member.profileImage
                        });
                      }}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-150 shadow-lg"
                      title="Message"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Age Badge - Top Right */}
                {member.dateOfBirth && (
                  <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                    {new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear()}
                  </div>
                )}
              </div>

              {/* Profile Info - Minimal Footer */}
              <div className="p-2 sm:p-3">
                {/* Username */}
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 truncate leading-tight">
                  {member.firstName || member.username}
                </h3>
                
                {/* Location - Smaller on Mobile */}
                <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">
                  📍 {member.country || member.region || 'Unknown'}
                </p>

                {/* Quick Stats - Only on Desktop */}
                <div className="hidden sm:flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>💬 Active</span>
                  {member.profession && (
                    <span className="truncate max-w-20">{member.profession}</span>
                  )}
                </div>

                {/* Mobile Action Buttons - Bottom */}
                <div className="flex sm:hidden justify-center space-x-3 mt-2 pt-2 border-t border-gray-100">
                  {/* Like Button */}
                  <button
                    className="flex-1 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-md flex items-center justify-center transition-colors"
                    title="Like"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>

                  {/* Chat Button */}
                  <button
                    onClick={() => { 
                      // Immediately switch to Chat tab for instant UX
                      setActiveSection('messages'); 
                      // Optimistically select this member's chat (no id yet)
                      setSelectedChat({
                        escortId: member._id,
                        escortName: member.firstName || member.username || 'Member',
                        profileImage: member.profileImage,
                        messages: [],
                        isOnline: true,
                        time: new Date().toLocaleString()
                      });
                      // Start or fetch the chat in background and merge id when ready
                      handleStartChat(member._id, {
                        escortName: member.firstName || member.username || 'Member',
                        profileImage: member.profileImage
                      });
                    }}
                    className="flex-1 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center justify-center transition-colors"
                    title="Message"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="text-lg sm:text-xl font-medium text-gray-700 mb-2">No members found</h3>
          <p className="text-sm sm:text-base text-gray-500">
            {searchQuery ? 'Try adjusting your search terms or filters' : 'No members available at the moment'}
          </p>
          {(searchQuery || Object.values(filters).some(v => v)) && (
            <button 
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const UserDashboard = () => {
  const { user, token, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeSection, setActiveSection] = useState('members');
  const [notifications, setNotifications] = useState([]);
  const [userCoins, setUserCoins] = useState(0);

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
          const escortProfiles = await escorts.getEscortProfiles();
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 mb-4 mx-auto">
            <div className="w-full h-full rounded-full border-4 border-rose-500 border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-medium text-gray-700">
            {loading ? 'Preparing your dashboard...' : 'Please sign in to continue'}
          </h2>
        </motion.div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Top Header */}
      <header className="bg-white shadow-lg border-b-2 border-gradient-to-r from-rose-500 to-purple-600">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-rose-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">HetaSinglar</h1>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-1 sm:space-x-3">
              {/* Country Flag - Hidden on very small screens */}
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-lg">🇺🇸</span>
                <span className="text-sm text-gray-600">US</span>
              </div>
              
              {/* Help - Hidden on mobile */}
              <button className="hidden md:flex items-center space-x-1 text-gray-600 hover:text-gray-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Help</span>
              </button>
              
              {/* Logout */}
              <motion.button
                onClick={logout}
                className="flex items-center space-x-1 bg-rose-500 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-rose-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v-8" />
                </svg>
                <span className="text-xs sm:text-sm">Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <nav className="bg-white shadow-sm border-b border-gray-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Navigation Tabs */}
            <div className="flex space-x-2 sm:space-x-6 lg:space-x-8 min-w-max">
              {[
                { key: 'members', label: 'Members', icon: '👥' },
                { key: 'messages', label: 'Chat', icon: '💬', badge: notifications.length > 0 ? notifications.length : null },
                { key: 'matches', label: 'Match', icon: '💖' },
                { key: 'favourites', label: 'Favourites', icon: '⭐' }
              ].map((tab) => (
                <motion.button
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key)}
                  className={`relative flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                    activeSection === tab.key
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-sm sm:text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-xs">{tab.label.substring(0, 4)}</span>
                  {tab.badge && (
                    <span className="absolute -top-1 -right-1 sm:-top-1 sm:-right-2 bg-rose-500 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full min-w-[16px] sm:min-w-[20px] h-4 sm:h-5 flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-1 sm:space-x-3 lg:space-x-4 ml-2">
              {/* Coins Display */}
              <div className="flex items-center space-x-1 sm:space-x-2 bg-yellow-50 px-2 py-1 sm:px-4 sm:py-2 rounded-full border border-yellow-200">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 4a6 6 0 110 12 6 6 0 010-12z"/>
                </svg>
                <span className="text-xs sm:text-sm font-medium text-yellow-700">
                  <span className="hidden sm:inline">{userCoins} Credits</span>
                  <span className="sm:hidden">{userCoins}</span>
                </span>
              </div>

              {/* Buy Credits Button */}
              <motion.button
                onClick={() => setActiveSection('subscription-plans')}
                className="bg-rose-500 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-rose-600 transition-colors font-medium text-xs sm:text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="hidden sm:inline">Buy Credits</span>
                <span className="sm:hidden">Buy</span>
              </motion.button>

              {/* Profile Button */}
              <motion.button
                onClick={() => setActiveSection('my profile')}
                className="flex items-center space-x-1 sm:space-x-2 bg-purple-500 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-purple-600 transition-colors text-xs sm:text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">Profile</span>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
              {activeSection === 'messages' && (
                <ChatSection 
                  selectedChat={selectedChat} 
                  setSelectedChat={setSelectedChat}
                  setActiveSection={setActiveSection}
                  setNotifications={setNotifications}
                />
              )}

              {activeSection === 'members' && (
                <MembersSection 
                  setActiveSection={setActiveSection}
                  setSelectedChat={setSelectedChat}
                  handleStartChat={handleStartChat}
                />
              )}

              {activeSection === 'matches' && (
                <div className="text-center py-8 sm:py-16">
                  <div className="max-w-sm sm:max-w-md mx-auto px-4">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 text-rose-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-lg sm:text-xl font-medium text-gray-700 mb-2">Find Your Match</h3>
                    <p className="text-sm sm:text-base text-gray-500 mb-4">Discover compatible people based on your preferences and interests.</p>
                    <button className="px-4 sm:px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm sm:text-base">
                      Start Matching
                    </button>
                  </div>
                </div>
              )}

              {activeSection === 'favourites' && (
                <div className="text-center py-8 sm:py-16">
                  <div className="max-w-sm sm:max-w-md mx-auto px-4">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <h3 className="text-lg sm:text-xl font-medium text-gray-700 mb-2">Your Favourites</h3>
                    <p className="text-sm sm:text-base text-gray-500 mb-4">Keep track of members you're interested in.</p>
                    <button 
                      onClick={() => setActiveSection('members')}
                      className="px-4 sm:px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm sm:text-base"
                    >
                      Browse Members
                    </button>
                  </div>
                </div>
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
        </main>
      </div>
    );
  };

export default UserDashboard;
