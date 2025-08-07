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
      <div className="border-b border-gray-200 p-4 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Sidebar - Chat Lists */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-white border border-gray-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                onClick={() => setSelectedChat(chat)}
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
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 h-[700px]">
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
    <div className="max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden"
      >
        {/* Profile Header */}
        <div className="relative h-48 bg-gradient-to-r from-rose-400 to-pink-500">
          <div className="absolute -bottom-16 left-8 flex items-end gap-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="h-32 w-32 rounded-xl bg-white p-1 shadow-lg"
            >
              <div className="h-full w-full rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-4xl font-bold">
                {user?.username.charAt(0).toUpperCase()}
              </div>
            </motion.div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white">{user?.username}</h2>
              <p className="text-white/80">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="mt-20 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Basic Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
                  <p className="text-gray-800">{profileData.username}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-gray-800">{profileData.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                  <p className="text-gray-800">
                    {new Date(profileData.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Gender</label>
                  <p className="text-gray-800 capitalize">{profileData.sex}</p>
                </div>
              </div>
            </div>

            {/* Right Column - Additional Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Additional Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                  <p className="text-gray-800">{profileData.location || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Interests</label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.interests && profileData.interests.length > 0 ? (
                      profileData.interests.map((interest, index) => (
                        <span 
                          key={index}
                          className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No interests added yet</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Bio</label>
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {profileData.bio || 'No bio added yet'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEditing(true)}
              className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Change Password
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              <p className="text-sm text-gray-500">Manage your alerts and notifications</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Privacy & Security</h3>
              <p className="text-sm text-gray-500">Control your privacy settings</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Language & Region</h3>
              <p className="text-sm text-gray-500">Set your preferred language</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const MembersSection = ({ setActiveSection, setSelectedChat }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredMembers = searchQuery 
    ? members.filter(member => 
        member.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.profession?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.interests?.some(interest => interest.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : members;

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
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse Members</h2>
        <p className="text-gray-600">Connect with amazing people and start conversations</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent shadow-sm"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Members Grid */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMembers.map((member) => (
            <motion.div
              key={member._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              {/* Profile Image */}
              <div className="relative h-48 bg-gradient-to-br from-rose-400 to-pink-500">
                {member.profileImage ? (
                  <img 
                    src={member.profileImage} 
                    alt={member.firstName || member.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                    {(member.firstName || member.username)?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  Available
                </div>
              </div>

              {/* Profile Info */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {member.firstName || member.username}
                </h3>
                
                {member.dateOfBirth && (
                  <p className="text-gray-600 text-sm mb-2">
                    Age: {new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear()}
                  </p>
                )}
                
                {(member.country || member.region) && (
                  <p className="text-gray-600 text-sm mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {[member.region, member.country].filter(Boolean).join(', ')}
                  </p>
                )}

                {member.profession && (
                  <p className="text-gray-700 text-sm mb-2">
                    <span className="font-medium">Profession:</span> {member.profession}
                  </p>
                )}

                {member.interests && member.interests.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {member.interests.slice(0, 3).map((interest, index) => (
                        <span key={index} className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-xs">
                          {interest}
                        </span>
                      ))}
                      {member.interests.length > 3 && (
                        <span className="text-gray-500 text-xs px-2 py-1">
                          +{member.interests.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleStartChat(member._id)}
                  className="w-full bg-rose-500 text-white py-2 px-4 rounded-lg hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Start Chat
                </button>
              </div>
            </motion.div>
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

const UserDashboard = () => {
  const { user, token, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeSection, setActiveSection] = useState('messages');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [userCoins, setUserCoins] = useState(0);

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleBuyCoins = () => {
    setActiveSection('subscription-plans');
  };

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
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <motion.aside 
        initial={{ width: isSidebarOpen ? "280px" : "0px" }}
        animate={{ width: isSidebarOpen ? "280px" : "0px" }}
        className={`bg-white border-r border-gray-200 h-screen flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out`}
      >
        <div className="h-full flex flex-col">
          {/* User Profile Section */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-gray-900 text-lg font-semibold truncate">
                  {user?.username}
                </h2>
                <p className="text-gray-500 text-sm truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {['Messages', 'Members', 'My Profile'].map((section) => (
              <motion.button
                key={section}
                onClick={() => setActiveSection(section.toLowerCase())}
                className={`w-full px-6 py-3 flex items-center space-x-3 ${
                  activeSection === section.toLowerCase()
                    ? 'bg-rose-50 text-rose-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex-shrink-0">
                  {section === 'Messages' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  )}
                  {section === 'Members' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                  {section === 'My Profile' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </span>
                <span className="flex-1 text-left">{section}</span>
                {section === 'Messages' && notifications.length > 0 && (
                  <span className="bg-rose-500 text-white text-xs px-2 py-1 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </motion.button>
            ))}

            {/* Buy Coins Button */}
            <motion.button
              onClick={handleBuyCoins}
              className="w-full px-6 py-3 flex items-center space-x-3 text-gray-600 hover:bg-gray-50"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex-shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 4a6 6 0 110 12 6 6 0 010-12z"/>
                </svg>
              </span>
              <span className="flex-1 text-left">Buy Coins</span>
            </motion.button>
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-100">
            <motion.button
              onClick={logout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v-8" />
              </svg>
              <span>Logout</span>
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 sticky top-0 z-10">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-800 ml-4">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </h1>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
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
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
