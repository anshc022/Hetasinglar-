import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FiMessageSquare, FiSmile, FiImage } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { escorts, chats, users as userApi } from '../../services/api';
import websocketService from '../../services/websocket';
import axios from 'axios';
import SubscriptionPlans from './SubscriptionPlans';
import ProfileSection from './ProfileSection';
import MembersSection from './MembersSection';
import LikedProfilesSection from './LikedProfilesSection';
import { IconWarning, IconUsers, IconHeartSpark, IconGlobe } from './UserIcons';
import config from '../../config/environment';
import ThemeToggle from '../ui/ThemeToggle';
import { useSwedishTranslation } from '../../utils/swedishTranslations';
import { emojiGroups, emojiGroupLabels, filterEmojiGroups } from '../../utils/emojiCollections';
import { compressImage, shouldCompressImage } from '../../utils/imageCompression';

const sectionTransition = { duration: 0.32, ease: [0.4, 0, 0.2, 1] };

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
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const { token } = useAuth();
  const [isSendingImage, setIsSendingImage] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const filteredEmojiEntries = useMemo(
    () => filterEmojiGroups(emojiGroups, emojiSearch),
    [emojiSearch]
  );
  const hasEmojiResults = filteredEmojiEntries.length > 0;
  
  // State for message editing
  const [editingMessage, setEditingMessage] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);

  const refreshCoinBalance = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const response = await axios.get(`${config.API_URL}/subscription/coins/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserCoins(response.data.balance);
    } catch (err) {
      console.error('Error fetching coins:', err);
    }
  }, [token]);

  useEffect(() => {
    // Fetch user's coin balance when component mounts
    refreshCoinBalance();
  }, [refreshCoinBalance]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat, scrollToBottom]);

  useEffect(() => {
    if (!showEmojis) {
      setEmojiSearch('');
    }
  }, [showEmojis]);

  useEffect(() => {
    if (userCoins <= 0) {
      setShowEmojis(false);
    }
  }, [userCoins]);

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

    const currentChatId = selectedChat.id;

    try {
      await chats.deleteMessage(currentChatId, message._id || messageIndex);

      const targetMessageId = message._id;
      const computePreview = (msg) => {
        if (!msg) return '';
        if (msg.messageType === 'image' || msg.text === '📷 Image' || msg.text?.startsWith('[Image:')) {
          return '📷 Image';
        }
        return msg.text || '';
      };
      const computeTimestamp = (msg, fallback) => {
        if (!msg) return fallback || '';
        if (msg.time) return msg.time;
        if (msg.createdAt) {
          try {
            return new Date(msg.createdAt).toLocaleString();
          } catch (err) {
            return fallback || '';
          }
        }
        return fallback || '';
      };
      let nextMessagesForParent = null;
      let nextLastMessageForParent = '';
      let nextTimeForParent = '';
      let shouldSyncParentChats = false;

      setSelectedChat(prev => {
        if (!prev || prev.id !== currentChatId) return prev;
        const filtered = prev.messages.filter((msg, idx) => {
          if (targetMessageId) {
            return msg._id !== targetMessageId;
          }
          return idx !== messageIndex;
        });
        const lastEntry = filtered[filtered.length - 1] || null;
        const nextLastMessage = computePreview(lastEntry);
        const nextTime = computeTimestamp(lastEntry, prev.time);

        nextMessagesForParent = filtered;
        nextLastMessageForParent = nextLastMessage;
        nextTimeForParent = nextTime;
        shouldSyncParentChats = true;

        return {
          ...prev,
          messages: filtered,
          lastMessage: nextLastMessage,
          time: nextTime
        };
      });

      if (onChatsUpdate && shouldSyncParentChats) {
        onChatsUpdate(prevChats => prevChats.map(chat => {
          if (chat.id !== currentChatId) {
            return chat;
          }

          const updatedChatMessages = nextMessagesForParent
            ? nextMessagesForParent
            : (chat.messages || []).filter((msg, idx) => {
                if (targetMessageId && msg?._id) {
                  return msg._id !== targetMessageId;
                }
                if (!targetMessageId && typeof messageIndex === 'number') {
                  return idx !== messageIndex;
                }
                return true;
              });

          const chatLastMessage = updatedChatMessages[updatedChatMessages.length - 1] || null;
          return {
            ...chat,
            messages: updatedChatMessages,
            lastMessage: nextLastMessageForParent || computePreview(chatLastMessage),
            time: nextTimeForParent || computeTimestamp(chatLastMessage, chat.time)
          };
        }));
      }

      setError(null);
      
    } catch (error) {
      console.error('Error deleting message:', error);
      setError(error.message || 'Failed to delete message');
    }
  };

  const handleEmojiClick = useCallback((emoji) => {
    setNewMessage((prev) => {
      const textarea = textareaRef.current;
      const cursor = textarea?.selectionStart ?? prev.length;
      const updated = prev.slice(0, cursor) + emoji + prev.slice(cursor);

      setTimeout(() => {
        if (textarea) {
          const nextCursor = cursor + emoji.length;
          textarea.focus();
          textarea.setSelectionRange(nextCursor, nextCursor);
        }
      }, 0);

      return updated;
    });
    setShowEmojis(false);
  }, [setShowEmojis, textareaRef]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    if (!selectedChat?.id) {
      setError('Please select a chat before sending a message.');
      return;
    }

    try {
      if (userCoins <= 0) {
        setError('You have no coins remaining. Please purchase coins to continue chatting.');
        return;
      }

        const messageText = newMessage.trim();
      const now = new Date();
      const timestampLabel = now.toLocaleString();
      const chatId = selectedChat.id;
        setNewMessage('');
        setShowEmojis(false);
        setError(null);
        setImageError(null);

      // ⚡ OPTIMISTIC UPDATE: Add message immediately for instant feel
      const clientId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      const optimisticMessage = {
        text: messageText,
        time: timestampLabel,
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
      setSelectedChat(prev => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          messages: [...(prev.messages || []), optimisticMessage],
          lastMessage: messageText,
          time: timestampLabel
        };
      });

      if (onChatsUpdate) {
        const optimisticMessageForList = { ...optimisticMessage };
        onChatsUpdate(prevChats => prevChats.map(chat => {
          if (chat.id !== chatId) {
            return chat;
          }
          return {
            ...chat,
            messages: [...(chat.messages || []), optimisticMessageForList],
            lastMessage: messageText,
            time: timestampLabel
          };
        }));
      }

      scrollToBottom();

      // Send the message via REST API (now in background)
      try {
        await chats.sendMessage(chatId, messageText, { clientId, messageType: 'text' });
        
        // ✅ Message sent successfully - update status
        // Keep isOptimistic=true until WebSocket echo arrives, so we can replace it instead of duplicating
        setSelectedChat(prev => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            messages: (prev.messages || []).map(msg => 
              msg.isOptimistic && msg.clientId === clientId 
                ? { ...msg, status: 'sent' }
                : msg
            )
          };
        });

        if (onChatsUpdate) {
          onChatsUpdate(prevChats => prevChats.map(chat => {
            if (chat.id !== chatId) {
              return chat;
            }
            return {
              ...chat,
              messages: (chat.messages || []).map(msg =>
                msg.isOptimistic && msg.clientId === clientId
                  ? { ...msg, status: 'sent' }
                  : msg
              )
            };
          }));
        }

        await refreshCoinBalance();
        
      } catch (sendError) {
        // ❌ Message failed - mark as failed and show retry option
        setSelectedChat(prev => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            messages: (prev.messages || []).map(msg => 
              msg.isOptimistic && msg.clientId === clientId 
                ? { ...msg, status: 'failed', isOptimistic: false }
                : msg
            )
          };
        });

        if (onChatsUpdate) {
          onChatsUpdate(prevChats => prevChats.map(chat => {
            if (chat.id !== chatId) {
              return chat;
            }
            return {
              ...chat,
              messages: (chat.messages || []).map(msg =>
                msg.isOptimistic && msg.clientId === clientId
                  ? { ...msg, status: 'failed', isOptimistic: false }
                  : msg
              )
            };
          }));
        }
        
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

    const handleImageButtonClick = () => {
      if (userCoins <= 0) {
        const message = 'You have no coins remaining. Please purchase coins to continue chatting.';
        setError(message);
        setImageError(message);
        return;
      }

      setImageError(null);
      fileInputRef.current?.click();
    };

    const readFileAsDataUrl = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    };

    const extractMimeType = (dataUrl, fallback = 'image/jpeg') => {
      if (typeof dataUrl !== 'string') {
        return fallback;
      }
      const match = dataUrl.match(/^data:(.*?);/);
      return match ? match[1] : fallback;
    };

    const handleImageChange = async (event) => {
      const file = event.target.files?.[0];
      if (event.target) {
        event.target.value = '';
      }

      if (!file) {
        return;
      }

      if (!selectedChat?.id) {
        setImageError('Please select a chat before sending an image.');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setImageError('Only image files are supported.');
        return;
      }

      const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setImageError('Image is too large (max 5MB).');
        return;
      }

      if (userCoins <= 0) {
        const message = 'You have no coins remaining. Please purchase coins to continue chatting.';
        setError(message);
        setImageError(message);
        return;
      }

      setIsSendingImage(true);
      setImageError(null);
      setError(null);

      try {
        let dataUrl;
        let finalMimeType = file.type || 'image/jpeg';
        let filename = file.name || `image-${Date.now()}.jpg`;
        const chatId = selectedChat.id;
        const now = new Date();
        const timestampLabel = now.toLocaleString();

        if (shouldCompressImage(file)) {
          const compressionResult = await compressImage(file);
          dataUrl = compressionResult.dataUrl;
          finalMimeType = extractMimeType(dataUrl, finalMimeType);
          if (finalMimeType === 'image/jpeg' && !/\.jpe?g$/i.test(filename)) {
            const baseName = filename.replace(/\.[^/.]+$/, '') || 'image';
            filename = `${baseName}-compressed.jpg`;
          }
        } else {
          dataUrl = await readFileAsDataUrl(file);
          finalMimeType = extractMimeType(dataUrl, finalMimeType);
        }

        const clientId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

        const optimisticImageMessage = {
          text: '',
          time: timestampLabel,
          isSent: true,
          status: 'sending',
          sender: 'customer',
          messageType: 'image',
          imageData: dataUrl,
          mimeType: finalMimeType,
          filename,
          readByAgent: false,
          readByCustomer: true,
          isOptimistic: true,
          clientId
        };

        setSelectedChat(prev => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            messages: [...(prev.messages || []), optimisticImageMessage],
            lastMessage: '📷 Image',
            time: timestampLabel
          };
        });

        if (onChatsUpdate) {
          const optimisticMessageForList = { ...optimisticImageMessage };
          onChatsUpdate(prevChats => prevChats.map(chat => {
            if (chat.id !== chatId) {
              return chat;
            }
            return {
              ...chat,
              messages: [...(chat.messages || []), optimisticMessageForList],
              lastMessage: '📷 Image',
              time: timestampLabel
            };
          }));
        }

        scrollToBottom();

        try {
          await chats.sendMessage(chatId, '', {
            clientId,
            messageType: 'image',
            imageData: dataUrl,
            mimeType: finalMimeType,
            filename
          });

          setSelectedChat(prev => {
            if (!prev) {
              return prev;
            }
            return {
              ...prev,
              messages: prev.messages.map(msg =>
                msg.isOptimistic && msg.clientId === clientId
                  ? { ...msg, status: 'sent' }
                  : msg
              )
            };
          });

          if (onChatsUpdate) {
            onChatsUpdate(prevChats => prevChats.map(chat => {
              if (chat.id !== chatId) {
                return chat;
              }
              return {
                ...chat,
                messages: (chat.messages || []).map(msg =>
                  msg.isOptimistic && msg.clientId === clientId
                    ? { ...msg, status: 'sent' }
                    : msg
                )
              };
            }));
          }

          await refreshCoinBalance();
        } catch (sendError) {
          setSelectedChat(prev => {
            if (!prev) {
              return prev;
            }
            return {
              ...prev,
              messages: prev.messages.map(msg =>
                msg.isOptimistic && msg.clientId === clientId
                  ? { ...msg, status: 'failed', isOptimistic: false }
                  : msg
              )
            };
          });
        
          if (onChatsUpdate) {
            onChatsUpdate(prevChats => prevChats.map(chat => {
              if (chat.id !== chatId) {
                return chat;
              }
              return {
                ...chat,
                messages: (chat.messages || []).map(msg =>
                  msg.isOptimistic && msg.clientId === clientId
                    ? { ...msg, status: 'failed', isOptimistic: false }
                    : msg
                )
              };
            }));
          }
          throw sendError;
        }

      } catch (uploadError) {
        console.error('Failed to send image:', uploadError);
        const message = uploadError.response?.data?.message || uploadError.message || 'Failed to send image';
        setImageError(message);
      } finally {
        setIsSendingImage(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
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
          <div className="mb-2 flex items-center gap-1 rounded bg-yellow-50 p-2 text-sm text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
            <IconWarning className="w-4 h-4" /> Warning: You have only {userCoins} coins remaining
          </div>
        )}

        <AnimatePresence>
          {showEmojis && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-3 rounded-2xl border border-rose-100/70 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-900/95"
            >
              <div className="mb-3 flex items-center gap-2">
                <input
                  type="text"
                  value={emojiSearch}
                  onChange={(event) => setEmojiSearch(event.target.value)}
                  placeholder="Search emoji"
                  className="flex-1 rounded-md border border-rose-200/70 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-rose-500 dark:focus:ring-rose-500/40"
                />
                {emojiSearch && (
                  <button
                    type="button"
                    onClick={() => setEmojiSearch('')}
                    className="text-xs font-medium text-rose-500 hover:text-rose-600 dark:text-rose-300 dark:hover:text-rose-200"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                {hasEmojiResults ? (
                  filteredEmojiEntries.map(([groupKey, emojis]) => (
                    <div key={groupKey}>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-400 dark:text-rose-300/80">
                        {emojiGroupLabels[groupKey] || groupKey}
                      </p>
                      <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
                        {emojis.map((emoji) => (
                          <button
                            key={`${groupKey}-${emoji}`}
                            type="button"
                            onClick={() => handleEmojiClick(emoji)}
                            className="rounded-xl bg-white/80 p-2 text-lg shadow-sm transition-colors hover:bg-rose-50 dark:bg-gray-800/70 dark:hover:bg-gray-700"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No emoji found</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={handleImageButtonClick}
            disabled={userCoins <= 0 || isSendingImage}
            className={`p-3 rounded-full transition-colors ${
              userCoins > 0 && !isSendingImage
                ? 'bg-white/80 text-rose-500 hover:bg-rose-50 shadow-sm dark:bg-gray-900/70 dark:text-rose-300 dark:hover:bg-gray-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
            }`}
            aria-label={isSendingImage ? 'Uploading image' : 'Send image'}
          >
            <FiImage className={`h-5 w-5 ${isSendingImage ? 'animate-pulse' : ''}`} />
          </button>
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                userCoins > 0 ? "Type a message..." : "You have no coins remaining. Please purchase coins to continue chatting."
              }
              disabled={userCoins <= 0}
              className="w-full max-h-32 min-h-[2.5rem] resize-none rounded-xl border border-transparent bg-white/80 px-4 py-3 pr-12 text-gray-800 shadow-sm transition focus:border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed dark:bg-gray-900/70 dark:text-gray-100 dark:focus:border-rose-500 dark:focus:ring-rose-500/40"
              rows={1}
            />
            <button
              type="button"
              onClick={() => setShowEmojis((prev) => !prev)}
              disabled={userCoins <= 0}
              className={`absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full text-rose-500 transition-colors ${
                userCoins > 0
                  ? 'hover:bg-rose-50 dark:hover:bg-gray-800'
                  : 'cursor-not-allowed text-gray-400 dark:text-gray-600'
              }`}
              aria-label="Add emoji"
            >
              <FiSmile className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || userCoins <= 0}
            className={`p-3 rounded-full ${
              newMessage.trim() && userCoins > 0
                ? 'bg-rose-500 text-white hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {(isSendingImage || imageError) && (
          <div className="mt-2 space-y-1 text-sm">
            {isSendingImage && (
              <div className="flex items-center gap-2 text-rose-500 dark:text-rose-300">
                <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse"></span>
                Uploading image...
              </div>
            )}
            {imageError && (
              <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.42 3.86a2 2 0 00-3.46 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {imageError}
              </div>
            )}
          </div>
        )}

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


    </>
  );
};

const UserDashboard = () => {
  const { user, token, logout, setAuthData } = useAuth();

  useEffect(() => {
    if (!user?.id && !user?._id) {
      return;
    }

    const resolvedId = (user._id || user.id || '').toString();
    if (!resolvedId) {
      return;
    }

    websocketService.setUserId(resolvedId);
    websocketService.connect();

    return () => {
      try {
        websocketService.setCurrentChatId(null);
      } catch (err) {
        console.error('Failed to reset chat context on cleanup:', err);
      }
    };
  }, [user?._id, user?.id]);
  const setAuthDataRef = useRef(setAuthData);

  useEffect(() => {
    setAuthDataRef.current = setAuthData;
  }, [setAuthData]);
  const { t } = useSwedishTranslation();
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeSection, setActiveSection] = useState('members');
  const [userCoins, setUserCoins] = useState(0);
  const [allUserChats, setAllUserChats] = useState([]); // Add state to track all chats
  const contentRef = useRef(null);

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
    const node = contentRef.current;
    if (!node) {
      return;
    }

    try {
      node.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    } catch (err) {
      // Gracefully ignore environments without smooth scroll support
    }
  }, [activeSection]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    const hydrateProfile = async () => {
      try {
        const response = await userApi.getProfile();
        if (isMounted && response?.user) {
          setAuthDataRef.current?.(response.user, token);
        }
      } catch (err) {
        console.error('Error refreshing user profile:', err);
      }
    };

    hydrateProfile();

    return () => {
      isMounted = false;
    };
  }, [token]);

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
      {/* Lightweight patterned background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-rose-50/45 to-pink-100/50 dark:from-gray-900/90 dark:via-gray-800/60 dark:to-slate-900/70"></div>
        <motion.div
          className="absolute inset-0 opacity-40 dark:opacity-20"
          style={{
            backgroundImage: [
              'repeating-linear-gradient(90deg, rgba(244, 114, 182, 0.16) 0 3px, transparent 3px 45px)',
              'repeating-linear-gradient(0deg, rgba(244, 114, 182, 0.16) 0 3px, transparent 3px 45px)'
            ].join(', '),
            backgroundSize: '60px 60px'
          }}
          animate={{
            backgroundPosition: ['0px 0px, 0px 0px', '60px 60px, 60px 60px']
          }}
          transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
        ></motion.div>
        <motion.div
          className="absolute inset-0 opacity-25 dark:opacity-15"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(236, 72, 153, 0.18) 15%, transparent 55%), linear-gradient(225deg, rgba(56, 189, 248, 0.12) 15%, transparent 55%)',
            backgroundSize: '160px 160px'
          }}
          animate={{ backgroundPosition: ['0px 0px', '160px 160px'] }}
          transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
        ></motion.div>
        <motion.div
          className="absolute inset-0 opacity-30 dark:opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.2) 0%, transparent 65%), radial-gradient(circle at 70% 70%, rgba(236, 72, 153, 0.18) 0%, transparent 70%)'
          }}
          animate={{ scale: [1, 1.04, 1], opacity: [0.25, 0.32, 0.25] }}
          transition={{ duration: 55, repeat: Infinity, ease: 'easeInOut' }}
        ></motion.div>
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
              <h1 className="text-lg sm:text-2xl font-bold font-rouge text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-400 to-purple-400 dark:from-rose-200 dark:via-pink-300 dark:to-purple-300 drop-shadow-sm">HetaSinglar</h1>
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
      <nav className="relative z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border-b border-rose-200/50 dark:border-gray-600/50 overflow-x-auto overflow-y-visible transition-colors duration-300">
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
                  className={`relative rounded-full flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 ${
                    activeSection === tab.key
                      ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  {activeSection === tab.key && (
                    <motion.span
                      layoutId="user-dashboard-tab-indicator"
                      className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-rose-500/15 via-pink-500/10 to-purple-500/15 backdrop-blur-md"
                      transition={sectionTransition}
                    />
                  )}
                  <span className="text-sm sm:text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-xs">{tab.label.substring(0, 4)}</span>
                  {tab.badge && (
                    <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 bg-rose-500 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full min-w-[16px] sm:min-w-[20px] h-4 sm:h-5 flex items-center justify-center shadow-md">
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
              ref={contentRef}
              layout
              initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
              transition={sectionTransition}
              className="relative w-full rounded-3xl bg-white/75 dark:bg-gray-900/55 border border-white/50 dark:border-gray-700/50 shadow-xl shadow-rose-100/40 dark:shadow-none backdrop-blur-xl px-3 sm:px-6 py-4 sm:py-6 transition-all duration-300"
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



