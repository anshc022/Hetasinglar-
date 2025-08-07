import React, { useState, useEffect, useRef } from 'react';
import agentApi, { agentAuth } from '../../services/agentApi';
import websocketService from '../../services/websocket';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format, differenceInHours } from 'date-fns';
import GeneralNoteBox from './GeneralNoteBox';
import StickyGeneralNotes from './StickyGeneralNotes';
import MessageComposer from './MessageComposer';
import PushBackDialog from './PushBackDialog';
import FirstContactButton from './FirstContactButton';
import LogModal from '../shared/LogModal';
import LogsList from '../shared/LogsList';
import { useLogApi } from '../../services/useLogApi';
import Notification from '../common/Notification';
import ImageSelector from './ImageSelector';

const ReminderBadge = ({ dueDate }) => {
  const hours = differenceInHours(new Date(dueDate), new Date());
  let color = 'bg-yellow-500';
  if (hours <= 2) color = 'bg-red-500';
  else if (hours <= 4) color = 'bg-orange-500';
  
  return (
    <span className={`${color} text-white text-xs px-2 py-1 rounded-full ml-2`}>
      Follow up in {hours}h
    </span>
  );
};

const ChatActions = ({ 
  onQuit, 
  onAddReminder, 
  onToggleNotes, 
  onToggleGeneralNotes, 
  showGeneralNotes,
  onPushBack,
  onFirstContact,
  onUnassign,
  onMoveToPanicRoom,
  onRemoveFromPanicRoom,
  onTogglePanicNotes,
  customerName,
  escortName,
  isInPanicRoom
}) => (
  <div className="flex gap-2 flex-wrap">
    {/* First Contact Button */}
    <FirstContactButton
      onSendFirstContact={onFirstContact}
      customerName={customerName}
      escortName={escortName}
    />
    
    {/* Push Back Button */}
    <button
      onClick={onPushBack}
      className="p-2 text-yellow-400 hover:text-yellow-300 rounded-lg hover:bg-yellow-900/30 transition-colors"
      title="Push Back Chat"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>

    {/* Unassign Button */}
    <button
      onClick={onUnassign}
      className="p-2 text-orange-400 hover:text-orange-300 rounded-lg hover:bg-orange-900/30 transition-colors"
      title="Unassign Me"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </button>

    {/* Panic Room Button */}
    {isInPanicRoom ? (
      <button
        onClick={onRemoveFromPanicRoom}
        className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-900/30 transition-colors"
        title="Remove from Panic Room"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </button>
    ) : (
      <button
        onClick={onMoveToPanicRoom}
        className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-900/30 transition-colors"
        title="Move to Panic Room"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 17.333 3.924 19 5.464 19z" />
        </svg>
      </button>
    )}

    {/* Panic Room Notes Button (only if in panic room) */}
    {isInPanicRoom && (
      <button
        onClick={onTogglePanicNotes}
        className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-900/30 transition-colors"
        title="Panic Room Notes"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>
    )}

    <div className="border-l border-gray-600 mx-2"></div>

    <button
      onClick={onToggleGeneralNotes}
      className={`p-2 rounded-lg transition-colors ${showGeneralNotes 
        ? 'text-blue-300 hover:text-blue-200 bg-blue-900/30 hover:bg-blue-900/50' 
        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'}`}
      title={showGeneralNotes ? "Hide General Notes" : "Show General Notes"}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </button>
    <button
      onClick={onToggleNotes}
      className="p-2 text-gray-400 hover:text-gray-300 rounded-lg hover:bg-gray-700/50"
      title="Add Notes"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
    <button
      onClick={onQuit}
      className="p-2 text-gray-400 hover:text-gray-300 rounded-lg hover:bg-gray-700/50"
      title="Close Chat"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

const NotesSection = ({ notes, newNote, setNewNote, onAddNote, showInput, onDeleteNote }) => {  return (
    <div className="bg-gray-800/50 rounded-lg p-4 mt-4">
      <h3 className="text-white text-lg font-semibold mb-4">Message Notes</h3>
      <div className="text-xs text-gray-400 mb-3">Message-specific notes appear here. General notes appear in the chat.</div>
        {showInput && (
        <div className="mb-4">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                onAddNote();
              }
            }}
            placeholder="Add a note about this customer... (Ctrl+Enter to save)"
            className="w-full p-2 bg-gray-700 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            rows="3"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={onAddNote}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Note
            </button>
          </div>
        </div>
      )}
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {notes && notes.filter(note => !note.isGeneral && !note.text.startsWith('[General]')).length > 0 ? (
          notes
            .filter(note => !note.isGeneral && !note.text.startsWith('[General]'))
            .map((note, index) => (
              <div 
                key={index} 
                className="p-3 bg-gray-700/50 rounded-lg"
              >
                <p className="text-white whitespace-pre-wrap">{note.text}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-blue-300">{note.agentName || 'Agent'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {new Date(note.timestamp).toLocaleString()}
                    </span>
                    {note._id && (
                      <button
                        onClick={() => onDeleteNote(note._id)}
                        className="text-red-400 hover:text-red-300 ml-2"
                        title="Delete note"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="text-gray-400 text-center py-4">
            No message notes yet. Add notes to specific messages.
          </div>
        )}
      </div>
    </div>
  );
};

const MessageReminderBadge = ({ message, onAddQuickNote }) => {
  const [showInput, setShowInput] = useState(false);
  const [reminderText, setReminderText] = useState('');
  
  const handleSaveReminder = () => {
    if (reminderText.trim()) {
      onAddQuickNote(reminderText);
      setReminderText('');
      setShowInput(false);
    }
  };
  
  return (
    <div className="mt-1 flex items-center">
      {!showInput ? (
        <button 
          onClick={() => setShowInput(true)}
          className="text-xs text-gray-400 hover:text-blue-400 flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Add reminder about this message
        </button>
      ) : (
        <div className="flex items-center w-full gap-2">
          <input
            type="text"
            value={reminderText}
            onChange={(e) => setReminderText(e.target.value)}
            placeholder="Note what this is about..."
            className="text-xs p-1 bg-gray-700 text-white rounded w-full"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveReminder();
              } else if (e.key === 'Escape') {
                setShowInput(false);
              }
            }}
          />
          <button 
            onClick={handleSaveReminder}
            className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
          >
            Save
          </button>
          <button 
            onClick={() => setShowInput(false)}
            className="text-xs text-gray-400"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

const ChatBox = ({ onMessageSent, isFollowUp }) => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [userDetails, setUserDetails] = useState({
    username: 'N/A',
    email: 'N/A',
    gender: 'N/A',
    age: 'N/A',
    memberSince: 'N/A',
    coins: 'N/A'
  });
  const messagesEndRef = useRef(null);
  const [pushBackOptions] = useState([
    { label: '2h', hours: 2 },
    { label: '4h', hours: 4 },
    { label: '8h', hours: 8 }
  ]);
  // State for comments/notes
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
    // State for general notes
  const [generalNote, setGeneralNote] = useState('');
  const [showGeneralNotes, setShowGeneralNotes] = useState(true);
  // State for the current agent
  const [currentAgent, setCurrentAgent] = useState(null);
  // New state for the additional components
  const [showPushBackDialog, setShowPushBackDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [escortProfile, setEscortProfile] = useState(null);
  
  // State for log modals
  const [showEscortLogModal, setShowEscortLogModal] = useState(false);
  const [showUserLogModal, setShowUserLogModal] = useState(false);
  
  // Edit states
  const [editingLog, setEditingLog] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  // State for storing logs
  const [escortLogs, setEscortLogs] = useState([]);
  const [userLogs, setUserLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // State for message editing
  const [editingMessage, setEditingMessage] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);

  // Panic Room states
  const [showPanicRoomDialog, setShowPanicRoomDialog] = useState(false);
  const [panicRoomReason, setPanicRoomReason] = useState('');
  const [showPanicRoomNotes, setShowPanicRoomNotes] = useState(false);
  const [panicRoomNote, setPanicRoomNote] = useState('');
  
  // Notification state
  const [notification, setNotification] = useState(null);
  
  // Image selector state
  const [showImageSelector, setShowImageSelector] = useState(false);

  const {
    addEscortLog,
    addUserLog,
    editEscortLog,
    editUserLog,
    getEscortLogs,
    getUserLogs,
    isLoading: logIsLoading,
    error: logError,
  } = useLogApi();

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);  // Memoized callback to prevent MessageComposer re-renders
  
  // Notification helper - defined early to avoid hoisting issues
  const showNotification = React.useCallback((message, type = 'info') => {
    setNotification({ message, type });
  }, []);
  
  // Image handling - defined before memoizedSendMessage to avoid hoisting issues
  const handleSendImage = React.useCallback(async (image) => {
    if (!selectedChat || !image) return;
    
    setIsLoading(true);
    try {
      const chatId = selectedChat._id;
      
      // Send image message using the same endpoint as text messages
      await agentApi.post(`/chats/${chatId}/message`, { 
        message: '',
        messageType: 'image',
        imageData: image.imageData,
        mimeType: image.mimeType,
        filename: image.filename
      });
      
      // Mark messages as read
      await agentApi.post(`/chats/${chatId}/mark-read`);
      
      showNotification('Image sent successfully', 'success');
      
      // Send via WebSocket for real-time updates
      websocketService.sendMessage(selectedChat._id, {
        type: 'chat_message',
        chatId: selectedChat._id,
        message: '',
        sender: 'agent',
        messageType: 'image',
        imageData: image.imageData,
        mimeType: image.mimeType,
        filename: image.filename,
        timestamp: new Date()
      });

      // Update local state immediately for better UX
      const newMessage = {
        message: '',
        messageType: 'image',
        imageData: image.imageData,
        mimeType: image.mimeType,
        filename: image.filename,
        timestamp: new Date(),
        sender: 'agent',
        senderName: currentAgent?.name || 'Agent',
        readByAgent: true,
        readByCustomer: false
      };

      setSelectedChat(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage],
        lastMessage: `📷 Image`,
        updatedAt: new Date()
      }));

      // Scroll to bottom after adding the image
      setTimeout(scrollToBottom, 100);
      
    } catch (error) {
      console.error('Error sending image:', error);
      showNotification('Failed to send image', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedChat, currentAgent, scrollToBottom]);

  const memoizedSendMessage = React.useCallback(async (messageText, messageType = 'text', file = null) => {
    if (!selectedChat || !selectedChat._id) {
      return;
    }
    
    setIsLoading(true);
    try {
      const chatId = selectedChat._id;
      
      // Handle image messages differently
      if (messageType === 'image' && file) {
        // For image messages, use the dedicated image handling
        // Don't set loading state here as handleSendImage manages it
        await handleSendImage(file);
        return;
      }
      
      // Always send the message via API first
      // Try the regular message endpoint first, fallback to first-contact for agents
      let messageResponse;
      try {
        messageResponse = await agentApi.post(`/chats/${chatId}/message`, { 
          message: messageText,
          messageType: messageType 
        });
      } catch (messageError) {
        // Fallback to first-contact endpoint for agents
        messageResponse = await agentApi.post(`/chats/${chatId}/first-contact`, { 
          message: messageText
        });
      }
      
      await agentApi.post(`/chats/${chatId}/mark-read`);
      
      // Call the parent's onMessageSent callback if provided (for auto-redirect)
      if (onMessageSent) {
        onMessageSent(messageText);
      }

      // Send via WebSocket for real-time updates
      websocketService.sendMessage(selectedChat._id, {
        type: 'chat_message',
        chatId: selectedChat._id,
        message: messageText,
        sender: 'agent',
        isFollowUp: isFollowUp, // Include follow-up flag
        timestamp: new Date()
      });

      // Update local state immediately for better UX
      const newMessage = {
        message: messageText,
        timestamp: new Date(),
        sender: 'agent',
        senderName: currentAgent?.name || 'Agent',
        readByAgent: true,
        readByCustomer: false
      };

      setSelectedChat(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage],
        lastMessage: messageText,
        updatedAt: new Date()
      }));

      scrollToBottom();
    } catch (error) {
      // Still call onMessageSent even if there's an error, so the redirect works
      if (onMessageSent) {
        onMessageSent(messageText);
      }
      
      setError(`Failed to send message: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedChat, currentAgent, scrollToBottom, onMessageSent]);

  // Memoized MessageComposer props to prevent re-renders
  const messageComposerProps = React.useMemo(() => ({
    onSendMessage: memoizedSendMessage,
    isLoading: isLoading,
    disabled: false,
    placeholder: "Type your message...",
    showEmojiPicker: true,
    showAttachments: true,
    showVoiceNote: true,
    onShowImageSelector: () => setShowImageSelector(true)
  }), [memoizedSendMessage, isLoading]);

  const handleChatSelection = async (chat) => {
    if (!chat || !chat._id) {
      setError('Invalid chat selected');
      return;
    }

    setSelectedChat(chat);
    const customerInfo = chat.customerId || {};
    setUserDetails({
      username: customerInfo.username || chat.customerName || 'N/A',
      email: customerInfo.email || 'N/A',
      gender: customerInfo.gender || 'N/A',
      age: customerInfo.age || 'N/A',
      createdAt: customerInfo.createdAt || chat.createdAt || 'N/A',
      coins: customerInfo.coins?.balance || 0,
      memberSince: customerInfo.createdAt ? new Date(customerInfo.createdAt).toLocaleDateString() : 'N/A'
    });

    // Set notes from chat comments initially
    setNotes(chat.comments || []);
    setShowNoteInput(false);
    setGeneralNote(''); // Reset general note when changing chats
    
    // Clear previous logs
    setEscortLogs([]);
    setUserLogs([]);
    
    // Load the latest notes from the backend
    try {
      const notesData = await agentAuth.getChatNotes(chat._id);
      if (notesData && notesData.comments) {
        setNotes(notesData.comments);
      }
    } catch (error) {
      // Don't set error state here as it's not critical
    }
    
    // Fetch logs for escort and user if IDs are available
    if (chat.escortId?._id) {
      fetchEscortLogs(chat.escortId._id);
    }
    if (chat.customerId?._id) {
      fetchUserLogs(chat.customerId._id);
    }
  };

  useEffect(() => {
    const fetchInitialChats = async () => {
      try {
        const escortId = params.escortId;
        const chatId = searchParams.get('chatId'); // Get chatId from query parameters
        
        if (!escortId) {
          setError('No escort profile selected. Please select an escort profile to view their live queue.');
          return;
        }
        const data = await agentAuth.getLiveQueue(escortId);
        setChats(data);
        setError(null);
        
        // Fetch escort profile information
        try {
          const escortData = await agentAuth.getEscortProfile(escortId);
          setEscortProfile(escortData);
        } catch (error) {
          // Error fetching escort profile is not critical
        }
        
        // If a specific chat ID was provided in the URL, select it even if it has no unread messages
        if (chatId) {
          const chatToSelect = data.find(c => c._id === chatId);
          if (chatToSelect) {
            await handleChatSelection(chatToSelect);
            setTimeout(() => scrollToBottom(), 100); // Slight delay to ensure messages are rendered
          } else {
            // Try to fetch the specific chat directly
            try {
              const specificChat = await agentAuth.getChat(chatId);
              
              if (specificChat) {
                // Add the specific chat to the chats list if it's not already there
                const updatedChats = [...data];
                if (!updatedChats.find(c => c._id === chatId)) {
                  updatedChats.unshift(specificChat); // Add to beginning
                }
                setChats(updatedChats);
                await handleChatSelection(specificChat);
                setTimeout(() => scrollToBottom(), 100);
              } else {
                throw new Error('Chat not found');
              }
            } catch (directFetchError) {
              // Fallback: Try to refetch the queue with the specific chatId
              try {
                const refreshedData = await agentAuth.getLiveQueue(escortId, chatId);
                const refreshedChat = refreshedData.find(c => c._id === chatId);
                
                if (refreshedChat) {
                  setChats(refreshedData);
                  await handleChatSelection(refreshedChat);
                  setTimeout(() => scrollToBottom(), 100);
                } else {
                  setError('Chat not available. It may have been closed, reassigned to another agent, or you may not have permission to access it.');
                }
              } catch (refreshError) {
                setError('Failed to load chat. Please try refreshing the page or return to dashboard.');
              }
            }
          }
        }
      } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to load the live queue';
        setError(errorMessage);
      }
    };

    // Identify as agent when connecting
    websocketService.setUserId('agent');
    websocketService.connect();
    
    const messageHandler = (data) => {
      if (data.type === 'chat_message') {
        const newMessage = {
          message: data.message,
          timestamp: new Date(data.timestamp),
          sender: data.sender,
          senderName: data.senderName,
          readByAgent: data.readByAgent,
          readByCustomer: data.readByCustomer,
          // Include image-specific data if present
          messageType: data.messageType,
          imageData: data.imageData,
          mimeType: data.mimeType,
          filename: data.filename
        };

        setChats(prevChats => {
          return prevChats.map(chat => {
            if (chat._id === data.chatId) {
              // Show appropriate last message for image messages (no filename)
              const lastMessage = data.messageType === 'image' 
                ? `📷 Image`
                : data.message;
              
              return {
                ...chat,
                messages: [...chat.messages, newMessage],
                lastMessage: lastMessage,
                updatedAt: new Date(data.timestamp)
              };
            }
            return chat;
          });
        });

        // Update selected chat if this is the active chat
        if (selectedChat?._id === data.chatId) {
          const lastMessage = data.messageType === 'image' 
            ? `📷 Image`
            : data.message;
            
          setSelectedChat(prev => ({
            ...prev,
            messages: [...prev.messages, newMessage],
            lastMessage: lastMessage,
            updatedAt: new Date(data.timestamp)
          }));
          scrollToBottom();
        }
      }
    };
    
    const unsubscribe = websocketService.onMessage(messageHandler);
    
    fetchInitialChats();
    const refreshInterval = setInterval(fetchInitialChats, 30000);
    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [params.escortId, searchParams, scrollToBottom]);

  useEffect(() => {
    if (selectedChat?.customerId) {
      setUserDetails({
        username: selectedChat.customerId.username || 'N/A',
        email: selectedChat.customerId.email || 'N/A',
        gender: selectedChat.customerId.gender || 'N/A',
        age: selectedChat.customerId.age || 'N/A',
        memberSince: selectedChat.customerId.createdAt 
          ? new Date(selectedChat.customerId.createdAt).toLocaleDateString()
          : 'N/A',
        coins: selectedChat.customerId.coins?.balance || 0
      });

      console.log('User coins data:', selectedChat.customerId.coins); // Debug log to verify coins data
    }
  }, [selectedChat]);

  useEffect(() => {
    if (selectedChat?._id) {
      // When chat is selected/changed, mark messages as read
      agentAuth.markMessagesAsRead(selectedChat._id)
        .then(() => {
          // Update the unread count in the chats list
          setChats(prevChats => 
            prevChats.map(chat => {
              if (chat._id === selectedChat._id) {
                return {
                  ...chat,
                  messages: chat.messages.map(msg => ({
                    ...msg,
                    readByAgent: true
                  }))
                };
              }
              return chat;
            })
          );

          // Also send WebSocket message to update read status in real-time
          if (websocketService.ws && websocketService.ws.readyState === WebSocket.OPEN) {
            websocketService.markMessagesAsRead(selectedChat._id, 'agent');
          }
        })
        .catch(error => {
          // Failed to mark messages as read, not critical
        });
    }
  }, [selectedChat?._id]);

  const handleFirstContact = async (chatId) => {
    if (!message.trim()) return;
    
    try {
      // Send via WebSocket first
      websocketService.sendMessage(chatId, {
        type: 'chat_message',
        chatId: chatId,
        message: message.trim(),
        sender: 'agent',
        timestamp: new Date(),
        requiresResponse: true,
        responseTimeout: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
      });

      // Also make the API call to update status
      await agentAuth.makeFirstContact(chatId, message);

      setMessage('');
      scrollToBottom();
    } catch (error) {
      setError('Failed to send message');
    }
  };

  const handlePushBack = async (hours) => {
    if (!selectedChat) return;
    try {
      await agentAuth.pushBackChat(selectedChat._id, hours);
      setChats(prev => prev.filter(chat => chat._id !== selectedChat._id));
      setSelectedChat(null);
    } catch (error) {
      setError('Failed to push back chat');
    }
  };

  // New handler for the push back dialog
  const handlePushBackDialog = () => {
    setShowPushBackDialog(true);
  };

  const handlePushBackConfirm = async (pushBackData) => {
    if (!selectedChat) return;
    
    setIsLoading(true);
    try {
      await agentAuth.pushBackChat(selectedChat._id, pushBackData.minutes / 60);
      
      // Remove the chat from the list and clear selection
      setChats(prev => prev.filter(chat => chat._id !== selectedChat._id));
      setSelectedChat(null);
      setShowPushBackDialog(false);
      setError(null); // Clear any previous errors
      
    } catch (error) {
      const errorMessage = error?.message || 'Failed to push back chat. Please try again.';
      setError(errorMessage);
      // Don't close the dialog on error so user can retry
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for first contact with template
  const handleFirstContactMessage = async (messageText) => {
    if (!selectedChat) return;
    
    setIsLoading(true);
    try {
      // Send via WebSocket first
      websocketService.sendMessage(selectedChat._id, {
        type: 'chat_message',
        chatId: selectedChat._id,
        message: messageText,
        sender: 'agent',
        timestamp: new Date(),
        requiresResponse: true,
        responseTimeout: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
      });

      // Also make the API call
      await agentAuth.makeFirstContact(selectedChat._id, messageText);

      scrollToBottom();
    } catch (error) {
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for unassigning from chat
  const handleUnassignChat = async () => {
    if (!selectedChat) return;
    
    if (!window.confirm('Are you sure you want to unassign yourself from this chat?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await agentAuth.unassignChat(selectedChat._id);
      setChats(prev => prev.filter(chat => chat._id !== selectedChat._id));
      setSelectedChat(null);
    } catch (error) {
      setError('Failed to unassign from chat');
    } finally {
      setIsLoading(false);
    }
  };

  // Panic Room handlers
  const handleMoveToPanicRoom = () => {
    setShowPanicRoomDialog(true);
  };

  const handleConfirmMoveToPanicRoom = async () => {
    if (!selectedChat || !panicRoomReason.trim()) return;
    
    // Check if chat is already in panic room
    if (selectedChat.isInPanicRoom) {
      showNotification('This chat is already in the panic room. No duplicate entries allowed.', 'warning');
      setShowPanicRoomDialog(false);
      return;
    }
    
    setIsLoading(true);
    try {
      await agentAuth.moveToPanicRoom(selectedChat._id, panicRoomReason, '');
      
      // Update local state
      setSelectedChat(prev => ({
        ...prev,
        isInPanicRoom: true,
        panicRoomReason: panicRoomReason,
        panicRoomMovedBy: currentAgent?.name || 'Agent',
        panicRoomMovedAt: new Date()
      }));
      
      // Update chats list as well
      setChats(prev => prev.map(chat => 
        chat._id === selectedChat._id 
          ? { ...chat, isInPanicRoom: true, panicRoomReason: panicRoomReason, panicRoomMovedAt: new Date() }
          : chat
      ));
      
      setShowPanicRoomDialog(false);
      setPanicRoomReason('');
      setError(null);
      
      // Show success notification
      showNotification('Chat moved to panic room successfully', 'success');
    } catch (error) {
      // Handle duplicate panic room entries with a more user-friendly message
      if (error.response?.data?.isAlreadyInPanicRoom || error.response?.status === 400) {
        showNotification('This chat is already in the panic room. No duplicate entries allowed.', 'error');
      } else {
        showNotification(`Failed to move chat to panic room: ${error.response?.data?.message || error.message}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromPanicRoom = async () => {
    if (!selectedChat) return;
    
    if (!window.confirm('Are you sure you want to remove this chat from the panic room?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await agentAuth.removeFromPanicRoom(selectedChat._id, '');
      
      // Update local state
      setSelectedChat(prev => ({
        ...prev,
        isInPanicRoom: false,
        panicRoomReason: null,
        panicRoomMovedBy: null,
        panicRoomMovedAt: null
      }));
      
      // Update chats list as well
      setChats(prev => prev.map(chat => 
        chat._id === selectedChat._id 
          ? { ...chat, isInPanicRoom: false, panicRoomReason: null, panicRoomMovedAt: null }
          : chat
      ));
      
      setError(null);
      
      // Show success notification
      showNotification('Chat removed from panic room successfully', 'success');
    } catch (error) {
      showNotification(`Failed to remove chat from panic room: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePanicRoomNotes = () => {
    setShowPanicRoomNotes(!showPanicRoomNotes);
  };

  const handleAddPanicRoomNote = async () => {
    if (!panicRoomNote.trim() || !selectedChat) return;
    
    setIsLoading(true);
    try {
      await agentAuth.addPanicRoomNote(selectedChat._id, panicRoomNote);
      
      // Add to local notes (this will be replaced with proper note fetching)
      const newNote = {
        text: panicRoomNote,
        timestamp: new Date(),
        agentName: currentAgent?.name || 'Agent',
        type: 'panic_room'
      };
      
      setNotes(prev => [...prev, newNote]);
      setPanicRoomNote('');
      setError(null);
    } catch (error) {
      setError(`Failed to add panic room note: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuitChat = () => {
    setSelectedChat(null);
    navigate('/agent/dashboard');
  };

  const handleAddReminder = async (text) => {
    try {
      await agentAuth.addReminder({
        chatId: selectedChat._id,
        text,
        dueDate: new Date()
      });
      // Refresh chat data
    } catch (error) {
      setError('Failed to add reminder.');
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const messageDate = new Date(date);
    return format(messageDate, 'PPp');
  };

  // Calculate message counts for In/Out display
  const getMessageCounts = () => {
    if (!selectedChat?.messages) {
      return { inCount: 0, outCount: 0 };
    }

    const inCount = selectedChat.messages.filter(msg => 
      msg.sender === 'customer' && !msg.isDeleted
    ).length;
    
    const outCount = selectedChat.messages.filter(msg => 
      msg.sender === 'agent' && !msg.isDeleted
    ).length;

    return { inCount, outCount };
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFirstContact(selectedChat._id);
    }
  };
  // Toggle the note input field
  const handleToggleNotes = () => {
    setShowNoteInput(!showNoteInput);
  };  
  
  // Add a new note to the chat
  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedChat) return;
    
    try {
      // Create a new note object for local state
      const noteObj = {
        text: newNote,
        timestamp: new Date(),
        agentName: currentAgent?.name || 'You' // Will be replaced by the server with actual agent name
      };
      
      // Add to local state immediately for UI feedback
      setNotes([...notes, noteObj]);
      
      // Clear the input field
      setNewNote('');
      
      // Send to backend using the dedicated API
      const response = await agentAuth.addChatNote(selectedChat._id, newNote.trim());
      
      // Update notes with the actual data from the server
      setNotes(response.allNotes);
      
      // Update the selected chat with the new comment
      setSelectedChat({
        ...selectedChat,
        comments: response.allNotes
      });
    } catch (error) {
      setError('Failed to add note');
    }
  };

  // Add a general note to the chat
  const handleAddGeneralNote = async () => {
    if (!generalNote.trim() || !selectedChat) return;
    
    try {
      // Create a new note object for local state with special tag for general notes
      const noteObj = {
        text: `[General] ${generalNote.trim()}`,
        timestamp: new Date(),
        agentName: currentAgent?.name || 'You', // Will be replaced by the server with actual agent name
        isGeneral: true
      };
      
      // Add to local state immediately for UI feedback
      setNotes([...notes, noteObj]);
      
      // Clear the input field
      setGeneralNote('');
      
      // Send to backend using the dedicated API
      const response = await agentAuth.addChatNote(selectedChat._id, noteObj.text);
      
      // Update notes with the actual data from the server
      setNotes(response.allNotes);
      
      // Update the selected chat with the new comment
      setSelectedChat({
        ...selectedChat,
        comments: response.allNotes
      });
    } catch (error) {
      setError('Failed to add general note');
    }
  };

  // Add a note to a specific message
  const handleAddMessageNote = async (messageIndex, text) => {
    if (!text.trim() || !selectedChat) return;
    
    try {
      const response = await agentAuth.addMessageNote(selectedChat._id, messageIndex, text.trim());
      
      // Update the selectedChat with the new message note
      setSelectedChat(prev => {
        const updatedMessages = [...prev.messages];
        updatedMessages[messageIndex].note = response.note;
        return {
          ...prev,
          messages: updatedMessages
        };
      });
    } catch (error) {
      setError('Failed to add note to message');
    }
  };

  // Delete a chat note (works for both regular and general notes)
  const handleDeleteChatNote = async (noteId) => {
    if (!selectedChat || !noteId) return;
    
    try {
      const response = await agentAuth.deleteChatNote(selectedChat._id, noteId);
      
      // Update notes in state with the response data
      setNotes(response.allNotes);
      
      // Update the selected chat with the updated comments
      setSelectedChat({
        ...selectedChat,
        comments: response.allNotes
      });
    } catch (error) {
      setError('Failed to delete note');
    }
  };

  // Delete a message note
  const handleDeleteMessageNote = async (messageIndex) => {
    if (!selectedChat) return;
    
    try {
      const response = await agentAuth.deleteMessageNote(selectedChat._id, messageIndex);
      
      // Update the selectedChat with the deleted message note
      setSelectedChat(prev => {
        const updatedMessages = [...prev.messages];
        updatedMessages[messageIndex].note = undefined; // Remove the note
        return {
          ...prev,
          messages: updatedMessages
        };
      });
    } catch (error) {
      setError('Failed to delete message note');
    }
  };

  // Fetch agent profile on component mount
  useEffect(() => {
    const fetchAgentProfile = async () => {
      try {
        const agentData = await agentAuth.getProfile();
        setCurrentAgent(agentData);
      } catch (error) {
        // Failed to fetch agent profile, not critical
      }
    };
    
    fetchAgentProfile();
  }, []);

  // Handle message editing
  const handleStartEditMessage = (messageIndex, currentMessage) => {
    const message = selectedChat.messages[messageIndex];
    
    // Agents can only edit their own messages
    if (message.sender !== 'agent') {
      setError('You can only edit your own messages');
      return;
    }
    
    setEditingMessageId(message._id);
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
      const response = await agentAuth.editMessage(
        selectedChat._id,
        editingMessageId,
        editMessageText.trim()
      );

      // Update local state
      setSelectedChat(prev => ({
        ...prev,
        messages: prev.messages.map((msg, idx) => {
          if (idx === editingMessage) {
            return {
              ...msg,
              message: editMessageText.trim(),
              isEdited: true,
              editedAt: new Date()
            };
          }
          return msg;
        })
      }));

      // Clear editing state
      handleCancelEditMessage();
      
    } catch (error) {
      console.error('Error editing message:', error);
      setError(error.message || 'Failed to edit message. You can only edit your own messages.');
    }
  };

  const handleDeleteMessage = async (messageIndex) => {
    const message = selectedChat.messages[messageIndex];
    
    // Agents can only delete their own messages
    if (message.sender !== 'agent') {
      setError('You can only delete your own messages');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await agentAuth.deleteMessage(selectedChat._id, message._id);

      // Update local state
      setSelectedChat(prev => ({
        ...prev,
        messages: prev.messages.map((msg, idx) => {
          if (idx === messageIndex) {
            return {
              ...msg,
              message: '[This message has been deleted]',
              isDeleted: true,
              deletedAt: new Date()
            };
          }
          return msg;
        })
      }));
      
    } catch (error) {
      console.error('Error deleting message:', error);
      setError(error.message || 'Failed to delete message. You can only delete your own messages.');
    }
  };

  // Add a new log for the escort
  const handleAddEscortLog = async (logData) => {
    if (!selectedChat?.escortId?._id) {
      setError('Cannot add log: No escort selected or escort ID is missing');
      return false;
    }
    
    setIsLoading(true);
    try {
      // Validate log data before sending
      if (!logData || !logData.category || !logData.content) {
        throw new Error('Log must have both category and content');
      }
      
      console.log(`Sending escort log to: /api/logs/escort/${selectedChat.escortId._id}`);
      console.log('Log data:', logData);
      
      // Send log data to backend
      const response = await addEscortLog(selectedChat.escortId._id, logData);
      
      // Clear any previous errors
      setError(null);
      
      // Refetch the logs to show the newly added one
      await fetchEscortLogs(selectedChat.escortId._id);
      
      console.log('Log successfully added:', response);
      
      // Show success feedback
      // You could add a toast notification here if you have a toast system
      
    } catch (error) {
      console.error('Error adding escort log:', error);
      
      // Extract more detailed error information from the error object
      let errorMessage = 'Unknown error';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response) {
        // Handle axios error with response
        if (error.response.status === 404) {
          errorMessage = 'API endpoint not found. The logs route may not be properly configured on the server.';
        } else {
          errorMessage = `Server error (${error.response.status}): ${error.response.data?.message || error.response.statusText || 'Unknown server error'}`;
        }
      }
      
      setError('Failed to add escort log: ' + errorMessage);
      
      // Keep modal open if there was an error
      return false;
    } finally {
      setIsLoading(false);
    }
    
    // Return true to indicate success (modal will close)
    return true;
  };

  // Handle editing an escort log
  const handleEditEscortLog = (log) => {
    setEditingLog(log);
    setEditMode(true);
    setShowEscortLogModal(true);
  };

  // Handle submitting an edited escort log
  const handleSubmitEditedLog = async (logData) => {
    if (!editingLog?._id) {
      setError('Cannot edit log: No log selected');
      return false;
    }
    
    setIsLoading(true);
    try {
      // Validate log data before sending
      if (!logData || !logData.category || !logData.content) {
        throw new Error('Log must have both category and content');
      }
      
      console.log(`Editing escort log: ${editingLog._id}`);
      console.log('Updated log data:', logData);
      
      // Send updated log data to backend
      const response = await editEscortLog(editingLog._id, logData);
      
      // Clear any previous errors
      setError(null);
      
      // Refetch the logs to show the updated one
      if (selectedChat?.escortId?._id) {
        await fetchEscortLogs(selectedChat.escortId._id);
      }
      
      console.log('Log successfully updated:', response);
      
      // Show success feedback
      // You could add a toast notification here if you have a toast system
      
    } catch (error) {
      console.error('Error updating escort log:', error);
      
      // Extract more detailed error information from the error object
      let errorMessage = 'Unknown error';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response) {
        // Handle axios error with response
        if (error.response.status === 404) {
          errorMessage = 'Log not found or you do not have permission to edit it.';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to edit this log.';
        } else {
          errorMessage = `Server error (${error.response.status}): ${error.response.data?.message || error.response.statusText || 'Unknown server error'}`;
        }
      }
      
      setError('Failed to update escort log: ' + errorMessage);
      
      // Keep modal open if there was an error
      return false;
    } finally {
      setIsLoading(false);
    }
    
    // Return true to indicate success (modal will close)
    return true;
  };

  // Add a new log for the user/customer
  const handleAddUserLog = async (logData) => {
    if (!selectedChat?.customerId?._id) {
      setError('Cannot add log: No user selected or user ID is missing');
      return;
    }
    
    setIsLoading(true);
    try {
      // Validate log data before sending
      if (!logData || !logData.category || !logData.content) {
        throw new Error('Log must have both category and content');
      }
      
      // Send log data to backend
      const response = await addUserLog(selectedChat.customerId._id, logData);
      
      // Clear any previous errors
      setError(null);
      
      // Refetch the logs to show the newly added one
      await fetchUserLogs(selectedChat.customerId._id);
      
      // Show success feedback
      // You could add a toast notification here if you have a toast system
      
    } catch (error) {
      console.error('Error adding user log:', error);
      setError('Failed to add user log: ' + (error.message || 'Unknown error. Please check the console for details.'));
      
      // Keep modal open if there was an error
      return false;
    } finally {
      setIsLoading(false);
    }
    
    // Return true to indicate success (modal will close)
    return true;
  };

  // Handle editing a user log
  const handleEditUserLog = (log) => {
    setEditingLog(log);
    setEditMode(true);
    setShowUserLogModal(true);
  };

  // Handle submitting an edited user log
  const handleSubmitEditedUserLog = async (logData) => {
    if (!editingLog?._id) {
      setError('Cannot edit log: No log selected');
      return false;
    }
    
    setIsLoading(true);
    try {
      // Validate log data before sending
      if (!logData || !logData.category || !logData.content) {
        throw new Error('Log must have both category and content');
      }
      
      console.log(`Editing user log: ${editingLog._id}`);
      console.log('Updated log data:', logData);
      
      // Send updated log data to backend
      const response = await editUserLog(editingLog._id, logData);
      
      // Clear any previous errors
      setError(null);
      
      // Refetch the logs to show the updated one
      if (selectedChat?.customerId?._id) {
        await fetchUserLogs(selectedChat.customerId._id);
      }
      
      console.log('User log successfully updated:', response);
      
      // Show success feedback
      // You could add a toast notification here if you have a toast system
      
    } catch (error) {
      console.error('Error updating user log:', error);
      
      // Extract more detailed error information from the error object
      let errorMessage = 'Unknown error';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response) {
        // Handle axios error with response
        if (error.response.status === 404) {
          errorMessage = 'Log not found or you do not have permission to edit it.';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to edit this log.';
        } else {
          errorMessage = `Server error (${error.response.status}): ${error.response.data?.message || error.response.statusText || 'Unknown server error'}`;
        }
      }
      
      setError('Failed to update user log: ' + errorMessage);
      
      // Keep modal open if there was an error
      return false;
    } finally {
      setIsLoading(false);
    }
    
    // Return true to indicate success (modal will close)
    return true;
  };

  // Fetch escort logs
  const fetchEscortLogs = async (escortId) => {
    if (!escortId) {
      console.warn('Cannot fetch escort logs: No escort ID provided');
      return;
    }

    setLoadingLogs(true);
    try {
      const logs = await getEscortLogs(escortId);
      setEscortLogs(logs);
    } catch (error) {
      console.error('Error fetching escort logs:', error);
      setError('Failed to fetch escort logs: ' + (error.message || 'Unknown error'));
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch user logs
  const fetchUserLogs = async (userId) => {
    if (!userId) {
      console.warn('Cannot fetch user logs: No user ID provided');
      return;
    }

    setLoadingLogs(true);
    try {
      const logs = await getUserLogs(userId);
      setUserLogs(logs);
    } catch (error) {
      console.error('Error fetching user logs:', error);
      setError('Failed to fetch user logs: ' + (error.message || 'Unknown error'));
    } finally {
      setLoadingLogs(false);
    }
  };

  const chatListItems = chats.map(chat => {
    const unreadCount = chat.messages?.filter(msg => 
      msg.sender === 'customer' && !msg.readByAgent
    ).length || 0;

    const needsFollowUp = chat.requiresFollowUp && chat.followUpDue;
    
    return (
      <div
        key={chat._id}
        onClick={() => handleChatSelection(chat)}
        className={`p-3 rounded-lg cursor-pointer transition-colors ${
          selectedChat?._id === chat._id 
            ? 'bg-blue-600 text-white' 
            : needsFollowUp
            ? 'bg-yellow-800/30 text-gray-300 hover:bg-yellow-700/30'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
      >
        <div className="font-semibold">
          {chat.customerId?.username || chat.customerName}
        </div>
        <div className="text-sm opacity-75">
          {formatDate(chat.createdAt)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {chat.isInPanicRoom && (
            <div className="mt-1">
              <div className="inline-flex items-center px-2 py-1 bg-red-500 text-white text-xs rounded-full mb-1">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 17.333 3.924 19 5.464 19z" />
                </svg>
                PANIC ROOM
              </div>
              {chat.panicRoomReason && (
                <div className="text-xs text-red-300 truncate max-w-[120px]" title={chat.panicRoomReason}>
                  {chat.panicRoomReason}
                </div>
              )}
              {(chat.panicRoomEnteredAt || chat.panicRoomMovedAt) && (
                <div className="text-xs text-gray-400">
                  {formatDate(chat.panicRoomEnteredAt || chat.panicRoomMovedAt)}
                </div>
              )}
            </div>
          )}
          {unreadCount > 0 && (
            <div className="mt-1 inline-block px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              {unreadCount} new
            </div>
          )}
          {needsFollowUp && (
            <ReminderBadge dueDate={chat.followUpDue} />
          )}
          {chat.customerId?.coins?.balance !== undefined && (
            <div className="mt-1 inline-flex items-center px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
            {chat.customerId.coins.balance}
            </div>
          )}
        </div>
      </div>
    );
  });

  // Handle closing modals and resetting edit state
  const handleCloseEscortLogModal = () => {
    setShowEscortLogModal(false);
    setEditingLog(null);
    setEditMode(false);
  };

  const handleCloseUserLogModal = () => {
    setShowUserLogModal(false);
    setEditingLog(null);
    setEditMode(false);
  };

  return (
    <div className="grid grid-cols-12 gap-2 h-screen bg-gray-900 p-2">
      {/* Chat List and Escort Profile */}
      <div className="col-span-3 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg overflow-y-auto border border-gray-700">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/agent/dashboard')}
              className="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-white">Chat Box</h2>
          </div>

          {/* Escort Profile Section */}
          {params.escortId && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-white text-lg font-semibold mb-4">Escort Profile</h3>
              <div className="space-y-3">
                <div className="flex justify-center mb-4">
                  {selectedChat?.escortId?.profileImage ? (
                    <img 
                      src={selectedChat.escortId.profileImage} 
                      alt="Profile" 
                      className="w-32 h-32 rounded-full object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white text-4xl">
                      {selectedChat?.escortId?.firstName?.[0] || '?'}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mb-4 w-full">
                  <div>
                    <label className="text-gray-400 text-sm">Name</label>
                    <p className="text-white">{selectedChat?.escortId?.firstName || 'N/A'}</p>
                  </div>
                  {selectedChat?.escortId?._id && (
                    <button
                      onClick={() => setShowEscortLogModal(true)}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add New Logs
                    </button>
                  )}
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Gender</label>
                  <p className="text-white">{selectedChat?.escortId?.gender || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Location</label>
                  <p className="text-white">{selectedChat?.escortId?.region ? `${selectedChat.escortId.region}, ${selectedChat.escortId.country}` : selectedChat?.escortId?.country || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Profession</label>
                  <p className="text-white">{selectedChat?.escortId?.profession || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Interests</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedChat?.escortId?.interests?.map((interest, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                        {interest}
                      </span>
                    )) || 'N/A'}
                  </div>
                </div>

                {/* Escort Logs Section */}
                {selectedChat?.escortId?._id && (
                  <LogsList
                    logs={escortLogs}
                    isLoading={loadingLogs}
                    title="Escort Logs"
                    emptyMessage="No logs available for this escort"
                    onEditLog={handleEditEscortLog}
                    canEdit={true}
                  />
                )}
              </div>
            </div>
          )}

          {/* Chat List */}
          <div className="space-y-2">
            {chatListItems}
          </div>
        </div>
      </div>

      {/* Active Chat */}
      <div className="col-span-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg flex flex-col h-[calc(100vh-1rem)] border border-gray-700">
        {error && (
          <div className="p-4 bg-red-500/20 text-red-100 text-sm border-b border-red-500/30">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium mb-1">Chat Not Available</div>
                <div className="text-xs opacity-90">{error}</div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                  title="Refresh page"
                >
                  Refresh
                </button>
                <button
                  onClick={() => navigate('/agent/dashboard')}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                  title="Return to dashboard"
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-gray-700 bg-gray-800/50 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                    {(selectedChat.customerId?.username || selectedChat.customerName).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      {selectedChat.customerId?.username || selectedChat.customerName}
                      {selectedChat.isInPanicRoom && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 17.333 3.924 19 5.464 19z" />
                          </svg>
                          PANIC ROOM
                        </span>
                      )}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <p className={`text-xs ${selectedChat.isUserActive ? 'text-green-400' : 'text-gray-400'}`}>
                        {selectedChat.isUserActive ? 'Online' : 'Offline'}
                      </p>
                      {selectedChat.customerId?.coins?.balance !== undefined && (
                        <p className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        {selectedChat.customerId.coins.balance}
                        </p>
                      )}
                      {/* In/Out Message Counter */}
                      {(() => {
                        const { inCount, outCount } = getMessageCounts();
                        return (
                          <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                              </svg>
                              <span>In: {inCount}</span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                              <span>Out: {outCount}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <ChatActions
                  onQuit={handleQuitChat}
                  onToggleNotes={handleToggleNotes}
                  onToggleGeneralNotes={() => setShowGeneralNotes(!showGeneralNotes)}
                  showGeneralNotes={showGeneralNotes}
                  onPushBack={handlePushBackDialog}
                  onFirstContact={handleFirstContactMessage}
                  onUnassign={handleUnassignChat}
                  onMoveToPanicRoom={handleMoveToPanicRoom}
                  onRemoveFromPanicRoom={handleRemoveFromPanicRoom}
                  onTogglePanicNotes={handleTogglePanicRoomNotes}
                  customerName={selectedChat.customerId?.username || selectedChat.customerName || 'Customer'}
                  escortName={escortProfile?.firstName || 'Escort'}
                  isInPanicRoom={selectedChat.isInPanicRoom || false}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-3 bg-gray-900/30" style={{ overflow: 'visible' }}>
              {/* General Notes Section - Using Sticky Component */}
              <StickyGeneralNotes 
                notes={notes} 
                isVisible={showGeneralNotes} 
                setIsVisible={setShowGeneralNotes} 
                onDeleteNote={handleDeleteChatNote}
              />

              {/* Panic Room Information Box */}
              {selectedChat.isInPanicRoom && (
                <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 17.333 3.924 19 5.464 19z" />
                        </svg>
                        <span className="text-red-400 font-semibold">This chat is in PANIC ROOM</span>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveFromPanicRoom}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                      title="Remove from Panic Room"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Revoke
                    </button>
                  </div>
                  <div className="mt-3 text-sm text-gray-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-400">Reason:</span>
                        <span className="ml-2 text-red-300">{selectedChat.panicRoomReason || 'Manual Review'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Moved:</span>
                        <span className="ml-2 text-gray-300">
                          {selectedChat.panicRoomEnteredAt || selectedChat.panicRoomMovedAt ? (
                            formatDate(selectedChat.panicRoomEnteredAt || selectedChat.panicRoomMovedAt)
                          ) : (
                            'Recently'
                          )}
                        </span>
                      </div>
                      {selectedChat.panicRoomMovedBy && (
                        <div>
                          <span className="text-gray-400">By:</span>
                          <span className="ml-2 text-gray-300">{selectedChat.panicRoomMovedBy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Display regular messages */}
              {selectedChat.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.sender === 'agent' ? 'justify-end' : 'justify-start'
                  }`}
                  style={{ overflow: 'visible', position: 'relative' }}
                >
                  {msg.sender !== 'agent' && (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white text-sm mr-2 self-end">
                      {msg.senderName ? msg.senderName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="flex flex-col max-w-[70%] relative overflow-visible">
                    <div
                      className={`px-4 py-2 rounded-xl relative group overflow-visible ${
                        msg.sender === 'agent'
                          ? 'bg-blue-600 text-white ml-2 hover:bg-blue-700'
                          : 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                      } ${msg.isDeleted ? 'opacity-50 bg-gray-600' : ''}`}
                    >
                      {/* Fixed Edit/Delete buttons - always visible for agent's own messages */}
                      {!msg.isDeleted && msg.sender === 'agent' && (
                        <div className="absolute -top-10 -right-2 bg-white rounded-lg flex shadow-xl border-2 border-gray-400 z-[9999]">
                          <button
                            onClick={() => handleStartEditMessage(idx, msg.message)}
                            className="p-2 text-gray-800 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-l-lg"
                            title="Edit your message"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <div className="w-px bg-gray-400"></div>
                          <button
                            onClick={() => handleDeleteMessage(idx)}
                            className="p-2 text-gray-800 hover:text-red-600 hover:bg-red-50 transition-colors rounded-r-lg"
                            title="Delete your message"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Message content - show edit input or regular message */}
                      {editingMessage === idx ? (
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
                          {msg.messageType === 'image' && (msg.imageData || msg.filename) ? (
                            <div className="space-y-2">
                              <div className="relative">
                                <img
                                  src={msg.imageData || `/uploads/chat/${msg.filename}`}
                                  alt={msg.filename || 'Sent image'}
                                  className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity border border-gray-600"
                                  onClick={() => {
                                    const newWindow = window.open();
                                    newWindow.document.write(`
                                      <html>
                                        <head><title>${msg.filename || 'Image'}</title></head>
                                        <body style=\"margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000;\">
                                          <img src=\"${msg.imageData || `/uploads/chat/${msg.filename}`}\" style=\"max-width:100%;max-height:100%;object-fit:contain;\" alt=\"${msg.filename || 'Image'}\" />
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
                                <div className="hidden items-center justify-center h-32 bg-gray-600 rounded-lg border border-gray-500">
                                  <div className="text-center text-gray-400">
                                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 17.333 3.924 19 5.464 19z" />
                                    </svg>
                                    <p className="text-xs">Image failed to load</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : msg.message?.startsWith('[Image:') && msg.message?.endsWith(']') ? (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-3 p-3 bg-gray-600/50 rounded-lg border border-gray-500">
                                <svg className="w-10 h-10 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div>
                                  <p className="text-sm font-medium text-blue-300">Image sent</p>
                                  <p className="text-xs opacity-75">{msg.message.replace(/^\[Image:\s*/, '').replace(/\]$/, '')}</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.message}</p>
                          )}
                          <div className="flex justify-between items-center mt-1 opacity-75 text-xs">
                            <div className="flex items-center gap-1">
                              <span>{msg.senderName}</span>
                              {msg.isEdited && (
                                <span className="text-xs text-gray-400 italic">(edited)</span>
                              )}
                            </div>
                            <div className="flex items-center">
                              {/* Remove edit icon for image messages */}
                              {!msg.isDeleted && msg.sender === 'agent' && msg.messageType !== 'image' && (
                                <div className="flex mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleStartEditMessage(idx, msg.message)}
                                    className="p-1 text-gray-200 hover:text-white transition-colors"
                                    title="Edit your message"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMessage(idx)}
                                    className="p-1 ml-1 text-gray-200 hover:text-white transition-colors"
                                    title="Delete your message"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                              <span>{formatDate(msg.timestamp)}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                      {/* Message note display */}
                    {msg.note && (
                      <div className="px-3 py-1 mt-1 bg-yellow-500/20 text-yellow-300 rounded-lg text-xs">
                        <div className="flex justify-between">
                          <span className="font-medium">Note: {msg.note.text}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs opacity-75">
                              {new Date(msg.note.timestamp).toLocaleTimeString()}
                            </span>
                            <button
                              onClick={() => handleDeleteMessageNote(idx)}
                              className="text-red-400 hover:text-red-300 ml-1"
                              title="Delete note"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Only show add note option for customer messages */}
                    {msg.sender === 'customer' && !msg.note && (
                      <MessageReminderBadge 
                        message={msg}
                        onAddQuickNote={(text) => handleAddMessageNote(idx, text)}
                      />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-gray-700 bg-gray-800/50">
              {/* Add general note box at the top of the chat input area */}
              <GeneralNoteBox
                value={generalNote}
                onChange={(e) => setGeneralNote(e.target.value)}
                onAddNote={handleAddGeneralNote}
              />                {/* Message Composer - Single instance only */}
              <MessageComposer
                key={`composer-${selectedChat?._id}`}
                {...messageComposerProps}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>Select a chat from the queue</p>
          </div>
        )}
      </div>

      {/* User Details Panel */}
      <div className="col-span-3 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg overflow-y-auto border border-gray-700">
        {selectedChat ? (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-semibold">User Details</h3>
              {selectedChat?.customerId?._id && (
                <button
                  onClick={() => setShowUserLogModal(true)}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Logs
                </button>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Username</label>
                <p className="text-white">{userDetails.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <p className="text-white">{userDetails.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Gender</label>
                <p className="text-white">{userDetails.gender}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Age</label>
                <p className="text-white">{userDetails.age}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Member Since</label>
                <p className="text-white">{userDetails.memberSince}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Coins Balance</label>
                <p className="flex items-center text-white">
                  <span className="inline-block mr-2 text-yellow-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {userDetails.coins !== 'N/A' ? userDetails.coins : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p>Select a chat to view user details</p>
          </div>
        )}

        {/* Chat Statistics */}
        {selectedChat && (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-white text-lg font-semibold mb-4">Chat Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Total Messages</label>
                <p className="text-white">{selectedChat.messages?.length || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Messages In</label>
                <p className="text-white text-green-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  {getMessageCounts().inCount}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Messages Out</label>
                <p className="text-white text-blue-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  {getMessageCounts().outCount}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Chat Started</label>
                <p className="text-white">
                  {new Date(selectedChat.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Last Active</label>
                <p className="text-white">
                  {selectedChat.messages?.length > 0 
                    ? formatDate(selectedChat.messages[selectedChat.messages.length - 1].timestamp)
                    : 'No messages'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User Logs Section */}
        {selectedChat?.customerId?._id && (
          <LogsList
            logs={userLogs}
            isLoading={loadingLogs}
            title="User Logs"
            emptyMessage="No logs available for this user"
            onEditLog={handleEditUserLog}
            canEdit={true}
          />
        )}

        {/* Agent Notes Section */}
        {selectedChat && (
          <NotesSection 
            notes={notes}
            newNote={newNote}
            setNewNote={setNewNote}
            onAddNote={handleAddNote}
            showInput={showNoteInput}
            onDeleteNote={handleDeleteChatNote}
          />        )}

        {/* Panic Room Notes Section */}
        {selectedChat && selectedChat.isInPanicRoom && showPanicRoomNotes && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 17.333 3.924 19 5.464 19z" />
              </svg>
              Panic Room Notes
            </h3>
            
            {selectedChat.panicRoomReason && (
              <div className="mb-3 p-3 bg-red-800/30 rounded border border-red-500/50">
                <span className="text-sm text-red-300">Reason: </span>
                <span className="text-white">{selectedChat.panicRoomReason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </div>
            )}
            
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {notes.filter(note => note.type === 'panic_room').map((note, idx) => (
                <div key={idx} className="bg-red-800/20 p-3 rounded border border-red-500/30">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm text-red-300">{note.agentName}</span>
                    <span className="text-xs text-red-400">{format(new Date(note.timestamp), 'PPp')}</span>
                  </div>
                  <p className="text-white text-sm">{note.text}</p>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={panicRoomNote}
                onChange={(e) => setPanicRoomNote(e.target.value)}
                placeholder="Add internal note about this panic room case..."
                className="flex-1 px-3 py-2 bg-gray-700 border border-red-500/50 rounded text-white placeholder-red-300/70 focus:outline-none focus:ring-2 focus:ring-red-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddPanicRoomNote()}
              />
              <button
                onClick={handleAddPanicRoomNote}
                disabled={!panicRoomNote.trim() || isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                Add Note
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Push Back Dialog */}
      <PushBackDialog
        isOpen={showPushBackDialog}
        onClose={() => setShowPushBackDialog(false)}
        onConfirm={handlePushBackConfirm}
        customerName={selectedChat?.customerId?.username || selectedChat?.customerName || 'Customer'}
        isLoading={isLoading}
      />

      {/* Panic Room Dialog */}
      {showPanicRoomDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Move to Panic Room</h3>
            <p className="text-gray-300 mb-4">
              This will move the chat to the panic room for special handling. 
              The customer will be removed from the automatic queue.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason for Panic Room:
              </label>
              <select
                value={panicRoomReason}
                onChange={(e) => setPanicRoomReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select a reason...</option>
                <option value="new_customer">New customer needing onboarding</option>
                <option value="unclear_behavior">Unclear or suspicious behavior</option>
                <option value="technical_issues">Technical problems</option>
                <option value="investigation_needed">Investigation required</option>
                <option value="special_handling">Requires special handling</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPanicRoomDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMoveToPanicRoom}
                disabled={isLoading || !panicRoomReason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Moving...' : 'Move to Panic Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escort Log Modal */}
      <LogModal 
        isOpen={showEscortLogModal}
        onClose={handleCloseEscortLogModal}
        onSubmit={editMode ? handleSubmitEditedLog : handleAddEscortLog}
        subjectName={selectedChat?.escortId?.firstName || 'Escort'}
        subjectType="escort"
        isLoading={isLoading}
        editMode={editMode}
        initialData={editingLog}
      />

      {/* User Log Modal */}
      <LogModal 
        isOpen={showUserLogModal}
        onClose={handleCloseUserLogModal}
        onSubmit={editMode ? handleSubmitEditedUserLog : handleAddUserLog}
        subjectName={selectedChat?.customerId?.username || selectedChat?.customerName || 'User'}
        subjectType="user"
        isLoading={isLoading}
        editMode={editMode}
        initialData={editingLog}
      />
      
      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      {/* Image Selector */}
      <ImageSelector
        isOpen={showImageSelector}
        onClose={() => setShowImageSelector(false)}
        onSelectImage={(image) => console.log('Selected image:', image)}
        onSendImage={handleSendImage}
        escortProfileId={selectedChat?.escortId?._id || escortProfile?._id}
      />
    </div>
  );
};

export default React.memo(ChatBox);