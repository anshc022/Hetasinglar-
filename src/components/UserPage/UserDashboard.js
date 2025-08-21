import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { escorts, chats } from '../../services/api';
import websocketService from '../../services/websocket';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SubscriptionPlans from './SubscriptionPlans';
import config from '../../config/environment';

const MessageItem = ({ chat, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={`p-4 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors hover:bg-gray-50 ${
      isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className="relative flex-shrink-0">
        <div className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-gray-100">
          {chat.profileImage ? (
            <img 
              src={chat.profileImage} 
              alt={chat.escortName} 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
              {chat.escortName?.charAt(0).toUpperCase()}
            </div>
          )}
          {chat.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-gray-900 truncate text-sm">{chat.escortName}</h3>
          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{chat.time}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {chat.isTyping ? (
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-xs text-blue-500 font-medium">typing...</span>
              </div>
            ) : (
              <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
            )}
          </div>
          {chat.messages.some(m => !m.isSent && !m.readByCustomer) && (
            <div className="flex-shrink-0 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium ml-2">
              {chat.messages.filter(m => !m.isSent && !m.readByCustomer).length}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const ChatBox = ({ selectedChat, setSelectedChat, setActiveSection }) => {
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
        
        setSelectedChat(prev => ({
          ...prev,
          messages: [...(prev?.messages || []), newMessage],
          lastMessage: data.messageType === 'image' ? '📷 Image' : data.message,
          time: new Date(data.timestamp).toLocaleString()
        }));

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

      // Send the message
      websocketService.sendMessage(selectedChat.id, messageText);
      await chats.sendMessage(selectedChat.id, messageText);
      
      const message = {
        text: messageText,
        time: new Date().toLocaleString(),
        isSent: true,
        sender: 'customer',
        status: 'sent'
      };

      setSelectedChat(prev => ({
        ...prev,
        messages: [...(prev?.messages || []), message],
        lastMessage: messageText,
        time: new Date().toLocaleString()
      }));

      // Update coin balance after sending
      const coinResponse = await axios.get(`${config.API_URL}/subscription/coins/balance`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setUserCoins(coinResponse.data.balance);
      
      scrollToBottom();
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
      <div className="border-b border-gray-100 p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-gray-100">
              {selectedChat.profileImage ? (
                <img 
                  src={selectedChat.profileImage} 
                  alt={selectedChat.escortName} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {selectedChat.escortName?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{selectedChat.escortName}</h3>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${selectedChat.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                <span className="text-xs text-gray-500">
                  {selectedChat.isOnline ? 'Online' : 'Last seen recently'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
              <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 4a6 6 0 110 12 6 6 0 010-12z"/>
              </svg>
              <span className="font-medium">{userCoins}</span>
              <span className="text-gray-500">coins</span>
            </div>
            {userCoins <= 5 && userCoins > 0 && (
              <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-200">
                ⚠️ Low balance
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.isSent ? 'justify-end' : 'justify-start'} items-end gap-2`}
            >
              {!msg.isSent && (
                <div className="h-6 w-6 rounded-full overflow-hidden flex-shrink-0">
                  {selectedChat.profileImage ? (
                    <img 
                      src={selectedChat.profileImage} 
                      alt={selectedChat.escortName} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                      {selectedChat.escortName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              )}
              
              <div className={`max-w-[70%] relative group ${
                msg.isSent 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-900 border border-gray-200'
              } rounded-2xl px-4 py-2.5 shadow-sm ${msg.isDeleted ? 'opacity-50 bg-gray-400' : ''}`}>
                
                {/* Edit/Delete buttons for user's own messages */}
                {msg.isSent && !msg.isDeleted && msg.messageType !== 'image' && msg.text !== '📷 Image' && (
                  <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 rounded-lg flex shadow-lg">
                    <button
                      onClick={() => handleStartEditMessage(index, msg.text)}
                      className="p-1.5 text-gray-300 hover:text-blue-400 transition-colors"
                      title="Edit message (costs 1 coin)"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(index)}
                      className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                      title="Delete message (no refund)"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Message content - show edit input or regular message */}
                {editingMessage === index ? (
                  <div className="space-y-3">
                    <textarea
                      value={editMessageText}
                      onChange={(e) => setEditMessageText(e.target.value)}
                      className="w-full p-3 bg-gray-100 text-gray-900 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none resize-none"
                      rows="3"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEditMessage}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEditMessage}
                        className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors font-medium"
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
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <svg className="w-8 h-8 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-blue-700">Image sent</p>
                            <p className="text-xs text-blue-600">{msg.text.replace(/^\[Image:\s*/, '').replace(/\]$/, '')}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs mt-2 opacity-70">
                      <div className="flex items-center gap-1">
                        {msg.isEdited && (
                          <span className="italic text-xs">(edited)</span>
                        )}
                        <span>{msg.time}</span>
                      </div>
                      {msg.isSent && (
                        <div className="flex items-center">
                          {msg.status === 'read' ? (
                            <svg className="w-3 h-3 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="border-t border-gray-100 p-4 bg-white">
        {userCoins <= 5 && userCoins > 0 && (
          <div className="mb-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 17.333 3.924 19 5.464 19z" />
            </svg>
            <span>Warning: You have only {userCoins} coins remaining</span>
          </div>
        )}
        
        <div className="flex items-end gap-3">
          <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                userCoins > 0 ? "Type your message..." : "You need coins to send messages. Purchase coins to continue."
              }
              disabled={userCoins <= 0}
              className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none max-h-32 min-h-[2.5rem] disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500"
              rows={1}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || userCoins <= 0}
            className={`p-3 rounded-xl transition-all duration-200 ${
              newMessage.trim() && userCoins > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        {userCoins <= 0 && (
          <div className="mt-3 text-center">
            <button 
              onClick={() => setActiveSection('subscription-plans')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Purchase Coins
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

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-200px)]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        {/* Left Sidebar - Chat Lists */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          {/* Search Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              <div className="text-sm text-gray-500">{filteredChats.length} chats</div>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Chat List */}
          {filteredChats.length > 0 ? (
            <div className="flex-1 overflow-y-auto">
              {filteredChats.map(chat => (
                <MessageItem
                  key={chat.escortId}
                  chat={chat}
                  isSelected={selectedChat?.escortId === chat.escortId}
                  onClick={() => setSelectedChat(chat)}
                />
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-500">
              <div className="bg-gray-100 rounded-full p-4 mb-4">
                <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">No conversations found</h3>
              <p className="text-sm text-center text-gray-500">Start chatting with members from the Members tab</p>
            </div>
          )}
        </div>

        {/* Right - Chat Area */}
        <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          {selectedChat ? (
            <ChatBox 
              selectedChat={selectedChat}
              setSelectedChat={setSelectedChat}
              setActiveSection={setActiveSection}
              error={error}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500">
              <div className="bg-gray-100 rounded-full p-6 mb-6">
                <svg className="w-12 h-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Messages</h3>
              <p className="text-center max-w-sm text-gray-500 mb-4">
                Select a conversation from the sidebar to start chatting, or browse members to find new connections.
              </p>
              <button
                onClick={() => setActiveSection('members')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Browse Members
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Professional Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-semibold shadow-sm">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user?.username}</h1>
              <p className="text-gray-600 text-lg">{user?.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Active
                </span>
                <span className="text-gray-500 text-sm">Member since {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Username</label>
                <p className="text-gray-900 font-medium mt-1">{profileData.username}</p>
              </div>
              
              <div className="border-b border-gray-100 pb-3">
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Email Address</label>
                <p className="text-gray-900 font-medium mt-1">{profileData.email}</p>
              </div>
              
              <div className="border-b border-gray-100 pb-3">
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Date of Birth</label>
                <p className="text-gray-900 font-medium mt-1">
                  {profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : 'Not provided'}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Gender</label>
                <p className="text-gray-900 font-medium mt-1 capitalize">{profileData.sex || 'Not specified'}</p>
              </div>
              
              <div className="border-b border-gray-100 pb-3">
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Location</label>
                <p className="text-gray-900 font-medium mt-1">{profileData.location || 'Not specified'}</p>
              </div>
              
              <div className="border-b border-gray-100 pb-3">
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Interests</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {profileData.interests && profileData.interests.length > 0 ? (
                    profileData.interests.map((interest, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm italic">No interests added yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Bio Section */}
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">About Me</label>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {profileData.bio || 'No bio added yet. Tell others about yourself!'}
              </p>
            </div>
          </div>
        </div>

        {/* Account Settings Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Security</p>
                  <p className="text-sm text-gray-500">Change password</p>
                </div>
              </button>
              
              <button className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Notifications</p>
                  <p className="text-sm text-gray-500">Manage alerts</p>
                </div>
              </button>
              
              <button className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Privacy</p>
                  <p className="text-sm text-gray-500">Control visibility</p>
                </div>
              </button>
            </div>
          </div>
          
          {/* Account Statistics */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Profile Views</span>
                <span className="font-semibold text-gray-900">142</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Connections</span>
                <span className="font-semibold text-gray-900">28</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Messages Sent</span>
                <span className="font-semibold text-gray-900">156</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

const MembersSection = ({ setActiveSection, setSelectedChat, onViewProfile }) => {
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

  const handleStartChat = async (memberId) => {
    try {
      // Create or get existing chat with this member
      const response = await chats.startChat(memberId);
      
      // Switch to messages section and select the chat
      if (response && response.chatId) {
        // Find the member info to create a chat object
        const member = members.find(m => m._id === memberId);
        const chatData = {
          id: response.chatId,
          escortName: member?.firstName || member?.username || 'Unknown',
          profileImage: member?.profileImage,
          messages: [],
          isOnline: true,
          time: new Date().toLocaleString()
        };
        
        setSelectedChat(chatData);
        setActiveSection('messages');
      }
    } catch (err) {
      console.error('Error starting chat:', err);
      alert('Failed to start chat. Please try again.');
    }
  };

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
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-rose-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Find Your Perfect Match</h3>
            </div>
            <span className="text-sm text-gray-500">{filteredMembers.length} members found</span>
          </div>
        </div>

        {/* Filter Form */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="xl:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Looking For */}
            <div className="xl:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Looking For</label>
              <select
                value={filters.lookingFor}
                onChange={(e) => setFilters(prev => ({ ...prev, lookingFor: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm appearance-none cursor-pointer"
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
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm appearance-none cursor-pointer"
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
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm appearance-none cursor-pointer"
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
                  className="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm text-center"
                  min="18"
                  max="99"
                />
                <input
                  type="number"
                  placeholder="99"
                  value={filters.ageMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, ageMax: e.target.value }))}
                  className="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm text-center"
                  min="18"
                  max="99"
                />
              </div>
            </div>

            {/* Location */}
            <div className="xl:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Location</label>
              <select
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm appearance-none cursor-pointer"
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
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-4 mb-3 sm:mb-0">
              <button
                onClick={resetFilters}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm font-medium">Reset Filters</span>
              </button>
              
              {(searchQuery || Object.values(filters).some(v => v)) && (
                <span className="text-xs px-2 py-1 bg-rose-100 text-rose-700 rounded-full">
                  Filters active
                </span>
              )}
            </div>

            <button
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:from-rose-600 hover:to-purple-700 transition-all duration-150 shadow-md hover:shadow-lg font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search Members</span>
            </button>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredMembers.map((member) => (
            <div
              key={member._id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200"
            >
              {/* Pink Header Strip */}
              <div className="h-3 bg-gradient-to-r from-pink-400 to-pink-500"></div>
              
              {/* Profile Image - Full Size */}
              <div className="relative aspect-[3/4] bg-gray-100">
                {member.profileImage ? (
                  <img 
                    src={member.profileImage} 
                    alt={member.firstName || member.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 text-5xl font-bold">
                    {(member.firstName || member.username)?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Profile Info - Blue Footer */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                {/* Username */}
                <h3 className="text-lg font-semibold text-center mb-1 truncate">
                  {member.firstName || member.username}
                </h3>
                
                {/* Location */}
                <p className="text-blue-100 text-sm text-center mb-3 truncate">
                  {member.country || 'Location not set'}
                </p>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-2">
                  {/* Heart/Like Button */}
                  <button
                    className="w-10 h-10 bg-white/20 rounded-md flex items-center justify-center hover:bg-white/30 transition-colors duration-150"
                    title="Like"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>

                  {/* View Profile Button */}
                  <button
                    onClick={() => onViewProfile(member)}
                    className="w-10 h-10 bg-white/20 rounded-md flex items-center justify-center hover:bg-white/30 transition-colors duration-150"
                    title="View Profile"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>

                  {/* Chat Button */}
                  <button
                    onClick={() => handleStartChat(member._id)}
                    className="w-10 h-10 bg-white/20 rounded-md flex items-center justify-center hover:bg-white/30 transition-colors duration-150"
                    title="Message"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </button>

                  {/* Star/Favorite Button */}
                  <button
                    className="w-10 h-10 bg-white/20 rounded-md flex items-center justify-center hover:bg-white/30 transition-colors duration-150"
                    title="Favorite"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No members found</h3>
          <p className="text-gray-500">
            {searchQuery ? 'Try adjusting your search terms' : 'No members available at the moment'}
          </p>
        </div>
      )}
    </div>
  );
};

// Detailed Profile Modal Component
const DetailedProfileModal = ({ profile, isOpen, onClose, onStartChat, onToggleFavorite }) => {
  if (!isOpen || !profile) return null;

  const handleStartChat = () => {
    onStartChat(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="relative">
          {/* Background Image */}
          <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Profile Image and Basic Info */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-white bg-white">
                  {profile.profileImage ? (
                    <img 
                      src={profile.profileImage} 
                      alt={profile.firstName} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                      {profile.firstName?.charAt(0).toUpperCase() || profile.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {profile.isOnline && (
                  <div className="absolute bottom-1 right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              
              <div className="text-white mb-2">
                <h1 className="text-2xl font-bold">{profile.firstName || profile.username}</h1>
                <div className="flex items-center gap-4 text-sm opacity-90">
                  <span>{profile.age ? `${profile.age} years old` : 'Age not specified'}</span>
                  {profile.country && <span>📍 {profile.country}</span>}
                  <span className={`flex items-center gap-1 ${profile.isOnline ? 'text-green-300' : 'text-gray-300'}`}>
                    <span className={`w-2 h-2 rounded-full ${profile.isOnline ? 'bg-green-300' : 'bg-gray-300'}`}></span>
                    {profile.isOnline ? 'Online now' : 'Last seen recently'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* About Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  About Me
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {profile.description || `Hi! I'm ${profile.firstName || profile.username}. I'm here to chat and have fun conversations with you!`}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.profession && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-1">Profession</h4>
                    <p className="text-gray-600">{profile.profession}</p>
                  </div>
                )}
                
                {profile.relationshipStatus && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-1">Relationship Status</h4>
                    <p className="text-gray-600 capitalize">{profile.relationshipStatus}</p>
                  </div>
                )}
                
                {profile.height && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-1">Height</h4>
                    <p className="text-gray-600">{profile.height} cm</p>
                  </div>
                )}
                
                {profile.gender && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-1">Gender</h4>
                    <p className="text-gray-600 capitalize">{profile.gender}</p>
                  </div>
                )}
              </div>

              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-4">
              
              {/* Quick Stats */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Profile Stats</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Response Time</span>
                    <span className="font-medium text-gray-900">{profile.responseTime || '< 5 min'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rating</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-900">{profile.rating || '4.8'}</span>
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Messages</span>
                    <span className="font-medium text-gray-900">{profile.totalMessages || '856'}</span>
                  </div>
                </div>
              </div>

              {/* Languages */}
              {profile.languages && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Languages</h4>
                  <div className="space-y-2">
                    {profile.languages.map((lang, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-gray-700">{lang}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleStartChat}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Start Chat
                </button>
                
                <button
                  onClick={() => onToggleFavorite(profile)}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Add to Favorites
                </button>
              </div>

            </div>
          </div>
        </div>
      </motion.div>
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
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

  const handleBuyCoins = () => {
    setActiveSection('subscription-plans');
  };

  const handlePurchaseSuccess = (newCoinBalance) => {
    setUserCoins(newCoinBalance);
    // You could add a toast notification here instead of the alert
    // toast.success('Coins purchased successfully!');
  };

  // Profile modal handlers
  const handleViewProfile = async (member) => {
    try {
      const profileData = await escorts.getEscortProfile(member._id);
      setSelectedProfile(profileData);
      setIsProfileModalOpen(true);
    } catch (error) {
      console.error('Error fetching profile details:', error);
      // Fallback to basic profile data if detailed fetch fails
      setSelectedProfile(member);
      setIsProfileModalOpen(true);
    }
  };

  const handleCloseProfile = () => {
    setIsProfileModalOpen(false);
    setSelectedProfile(null);
  };

  const handleStartChatFromProfile = (profile) => {
    // Create a mock chat object for starting a conversation
    const newChat = {
      escortId: profile._id,
      escortName: profile.firstName || profile.username,
      profileImage: profile.profileImage,
      messages: [],
      isOnline: profile.isOnline,
      lastMessage: '',
      time: new Date().toLocaleString()
    };
    
    setSelectedChat(newChat);
    setActiveSection('messages');
  };

  const handleToggleFavorite = (profile) => {
    // TODO: Implement favorite functionality with backend
    console.log('Toggle favorite for:', profile.firstName || profile.username);
    // This would typically make an API call to add/remove from favorites
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">HetaSinglar</h1>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              {/* Country Flag */}
              <div className="flex items-center space-x-2">
                <span className="text-lg">🇺🇸</span>
                <span className="text-sm text-gray-600">US</span>
              </div>
              
              {/* Help */}
              <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Help</span>
              </button>
              
              {/* Logout */}
              <motion.button
                onClick={logout}
                className="flex items-center space-x-1 bg-rose-500 text-white px-3 py-2 rounded-lg hover:bg-rose-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v-8" />
                </svg>
                <span className="text-sm">Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Navigation Tabs */}
            <div className="flex space-x-8">
              {[
                { key: 'members', label: 'Members', icon: '👥' },
                { key: 'messages', label: 'Chat', icon: '💬', badge: notifications.length > 0 ? notifications.length : null },
                { key: 'matches', label: 'Match', icon: '💖' },
                { key: 'favourites', label: 'Favourites', icon: '⭐' }
              ].map((tab) => (
                <motion.button
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key)}
                  className={`relative flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeSection === tab.key
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Coins Display */}
              <div className="flex items-center space-x-2 bg-yellow-50 px-4 py-2 rounded-full border border-yellow-200">
                <svg className="w-5 h-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 4a6 6 0 110 12 6 6 0 010-12z"/>
                </svg>
                <span className="text-sm font-medium text-yellow-700">{userCoins} Credits</span>
              </div>

              {/* Buy Credits Button */}
              <motion.button
                onClick={() => setActiveSection('subscription-plans')}
                className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Buy Credits
              </motion.button>

              {/* Profile Button */}
              <motion.button
                onClick={() => setActiveSection('my profile')}
                className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile</span>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                  onViewProfile={handleViewProfile}
                />
              )}

              {activeSection === 'matches' && (
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <svg className="w-16 h-16 text-rose-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">Find Your Match</h3>
                    <p className="text-gray-500">Discover compatible people based on your preferences and interests.</p>
                    <button className="mt-4 px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors">
                      Start Matching
                    </button>
                  </div>
                </div>
              )}

              {activeSection === 'favourites' && (
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <svg className="w-16 h-16 text-yellow-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">Your Favourites</h3>
                    <p className="text-gray-500">Keep track of members you're interested in.</p>
                    <button 
                      onClick={() => setActiveSection('members')}
                      className="mt-4 px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
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

        {/* Profile Modal */}
        {isProfileModalOpen && (
          <DetailedProfileModal
            profile={selectedProfile}
            isOpen={isProfileModalOpen}
            onClose={handleCloseProfile}
            onStartChat={handleStartChatFromProfile}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </div>
    );
  };

export default UserDashboard;
