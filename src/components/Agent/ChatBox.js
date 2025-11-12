import React, { useState, useEffect, useRef } from 'react';
import agentApi, { agentAuth } from '../../services/agentApi';
import websocketService from '../../services/websocket';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format, differenceInHours } from 'date-fns';
import StickyGeneralNotes from './StickyGeneralNotes';
import MessageComposer from './MessageComposer';
import PushBackDialog from './PushBackDialog';
import FirstContactButton from './FirstContactButton';
import LogModal from '../shared/LogModal';
import LogsList from '../shared/LogsList';
import { useLogApi } from '../../services/useLogApi';
import Notification from '../common/Notification';
import ImageSelector from './ImageSelector';

// Add custom animations for sidebar sliding
const styles = `
  @keyframes slideInLeft {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in-left {
    animation: slideInLeft 0.3s ease-out forwards;
  }
  
  .animate-slide-in-right {
    animation: slideInRight 0.3s ease-out forwards;
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('chatbox-animations')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'chatbox-animations';
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

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

const CoinAlert = ({ coinBalance, isVisible = true, className = "" }) => {
  if (!isVisible || coinBalance === undefined || coinBalance === null || coinBalance === 'N/A') {
    return null;
  }

  const coinsLeft = parseInt(coinBalance) || 0;
  let alertType = null;
  let alertMessage = "";
  let alertColor = "";
  let icon = null;

  // Determine alert type based on coin balance
  if (coinsLeft === 0) {
    alertType = "no-coins";
    alertMessage = "⚠️ User has NO COINS! Cannot send messages.";
    alertColor = "bg-red-600 border-red-500 text-white";
    icon = (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
  } else if (coinsLeft <= 5) {
    alertType = "low-coins";
    alertMessage = `⚠️ Low coins: Only ${coinsLeft} left. User may run out soon!`;
    alertColor = "bg-orange-600 border-orange-500 text-white";
    icon = (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
  } else if (coinsLeft <= 10) {
    alertType = "medium-coins";
    alertMessage = `💰 Moderate coins: ${coinsLeft} remaining.`;
    alertColor = "bg-yellow-600 border-yellow-500 text-white";
    icon = (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
      </svg>
    );
  }

  if (!alertType) return null;

  return (
    <div className={`${alertColor} border-2 rounded-lg p-3 mb-4 flex items-center gap-3 ${className}`}>
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{alertMessage}</p>
        {coinsLeft === 0 && (
          <p className="text-xs mt-1 opacity-90">
            Recommend user to purchase more coins to continue chatting.
          </p>
        )}
        {coinsLeft <= 5 && coinsLeft > 0 && (
          <p className="text-xs mt-1 opacity-90">
            Consider notifying user to purchase more coins soon.
          </p>
        )}
      </div>
      <div className="flex-shrink-0 text-xl font-bold">
        {coinsLeft}
      </div>
    </div>
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
  onWatchLiveQueue,
  customerName,
  escortName,
  isInPanicRoom,
  isViewMode = false,
  isMobile = false
}) => (
  <div className={`flex gap-2 ${isMobile ? 'flex-wrap justify-center' : 'flex-wrap'}`}>
    {/* Watch Live Queue Button - Only show in view mode */}
    {isViewMode && onWatchLiveQueue && (
      <button
        onClick={onWatchLiveQueue}
        className={`${isMobile ? 'px-2 py-1.5' : 'px-3 py-2'} bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg`}
        title="Enter Live Queue System"
      >
        <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        {!isMobile && <span>Watch Live Queue</span>}
      </button>
    )}
    
    {/* First Contact Button */}
    <FirstContactButton
      onSendFirstContact={onFirstContact}
      customerName={customerName}
      escortName={escortName}
    />
    
    {/* Push Back Button */}
    <button
      onClick={onPushBack}
      className={`${isMobile ? 'p-1.5' : 'p-2'} text-yellow-400 hover:text-yellow-300 rounded-lg hover:bg-yellow-900/30 transition-colors`}
      title="Push Back Chat"
    >
      <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>

    {/* Unassign Button */}
    <button
      onClick={onUnassign}
      className={`${isMobile ? 'p-1.5' : 'p-2'} text-orange-400 hover:text-orange-300 rounded-lg hover:bg-orange-900/30 transition-colors`}
      title="Unassign Me"
    >
      <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </button>

    {/* Panic Room Button */}
    {isInPanicRoom ? (
      <button
        onClick={onRemoveFromPanicRoom}
        className={`${isMobile ? 'p-1.5' : 'p-2'} text-red-400 hover:text-red-300 rounded-lg hover:bg-red-900/30 transition-colors`}
        title="Remove from Panic Room"
      >
        <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </button>
    ) : (
      <button
        onClick={onMoveToPanicRoom}
        className={`${isMobile ? 'p-1.5' : 'p-2'} text-red-400 hover:text-red-300 rounded-lg hover:bg-red-900/30 transition-colors`}
        title="Move to Panic Room"
      >
        <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 17.333 3.924 19 5.464 19z" />
        </svg>
      </button>
    )}

    {/* Panic Room Notes Button (only if in panic room) */}
    {isInPanicRoom && (
      <button
        onClick={onTogglePanicNotes}
        className={`${isMobile ? 'p-1.5' : 'p-2'} text-red-400 hover:text-red-300 rounded-lg hover:bg-red-900/30 transition-colors`}
        title="Panic Room Notes"
      >
        <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>
    )}

    <div className="border-l border-gray-600 mx-2"></div>

    <button
      onClick={onToggleGeneralNotes}
      className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg transition-colors ${showGeneralNotes 
        ? 'text-blue-300 hover:text-blue-200 bg-blue-900/30 hover:bg-blue-900/50' 
        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'}`}
      title={showGeneralNotes ? "Hide General Notes" : "Show General Notes"}
    >
      <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </button>
    <button
      onClick={onToggleNotes}
      className={`${isMobile ? 'p-1.5' : 'p-2'} text-gray-400 hover:text-gray-300 rounded-lg hover:bg-gray-700/50`}
      title="Add Notes"
    >
      <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
    <button
      onClick={onQuit}
      className={`${isMobile ? 'p-1.5' : 'p-2'} text-gray-400 hover:text-gray-300 rounded-lg hover:bg-gray-700/50`}
      title="Close Chat"
    >
      <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  
  // Determine if we're in view mode (regular chat route)
  const isViewMode = !!params.chatId && !params.escortId; // If only chatId exists, we're in view mode
  
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

  // Helper: normalize legacy notes so they appear as General Notes if none explicitly tagged
  const normalizeGeneralNotes = (arr = []) => {
    if (!Array.isArray(arr) || arr.length === 0) return [];
    const hasExplicitGeneral = arr.some(n => (n?.isGeneral === true) || (typeof n?.text === 'string' && n.text.startsWith('[General]')));
    if (hasExplicitGeneral) return arr; // Already properly tagged
    // Fallback: treat all existing notes as general (legacy data) so they become visible
    return arr.map(n => ({ ...n, isGeneral: true }));
  };

  // Ensure notes are fetched soon after a chat is selected (even if initial chat object lacked comments)
  useEffect(() => {
    if (!selectedChat?._id) return;
    if (notes.length > 0) return; // Already have notes
    let cancelled = false;
    const fetchNotes = async (attempt = 1) => {
      try {
        console.log(`[NotesFetcher] Fetching notes (attempt ${attempt}) chat=${selectedChat._id}`);
        const notesData = await agentAuth.getChatNotes(selectedChat._id);
        if (!cancelled && notesData?.comments) {
          if (notesData.comments.length) {
            setNotes(normalizeGeneralNotes(notesData.comments));
            console.log('[NotesFetcher] Loaded notes count:', notesData.comments.length);
          } else {
            console.log('[NotesFetcher] No notes returned yet');
          }
        }
      } catch (e) {
        console.warn('[NotesFetcher] Failed attempt', attempt, e?.message || e);
        if (attempt < 3 && !cancelled) setTimeout(() => fetchNotes(attempt + 1), attempt * 600);
      }
    };
    // slight delay to allow auth/token readiness
    const t = setTimeout(() => fetchNotes(), 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [selectedChat?._id]);
  // Mobile sidebar states
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [mobileSidebarType, setMobileSidebarType] = useState(''); // 'chats', 'user', 'escort'
  // State for the current agent
  const [currentAgent, setCurrentAgent] = useState(null);
  
  // Function to get agent color based on agent name
  const getAgentColor = (agentName) => {
    if (!agentName) return 'bg-red-500 text-white';
    
    const colors = [
      'bg-red-500 text-white',
      'bg-blue-500 text-white', 
      'bg-green-500 text-white',
      'bg-purple-500 text-white',
      'bg-orange-500 text-white',
      'bg-pink-500 text-white'
    ];
    
    // Simple hash function to assign consistent colors
    let hash = 0;
    for (let i = 0; i < agentName.length; i++) {
      hash = agentName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  // New state for the additional components
  const [showPushBackDialog, setShowPushBackDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [escortProfile, setEscortProfile] = useState(null);
  
  // Chat list expansion state
  const [showAllChats, setShowAllChats] = useState(false);
  
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
    console.log('🔍 [ChatBox] handleSendImage called with:', {
      imageExists: !!image,
      selectedChatExists: !!selectedChat,
      imageData: image ? {
        filename: image.filename,
        mimeType: image.mimeType,
        hasImageData: !!image.imageData,
        imageDataLength: image.imageData?.length
      } : null
    });
    
    if (!selectedChat || !image) {
      console.warn('⚠️ [ChatBox] Missing selectedChat or image');
      return;
    }
    
    setIsLoading(true);
    try {
      const chatId = selectedChat._id;
      console.log('🔍 [ChatBox] Sending image to chat:', chatId);
      
      // ⚡ OPTIMISTIC UPDATE: Add image message immediately
      const optimisticImageMessage = {
        message: '',
        messageType: 'image',
        imageData: image.imageData,
        mimeType: image.mimeType,
        filename: image.filename,
        timestamp: new Date(),
        sender: 'agent',
        senderName: currentAgent?.name || 'Agent',
        readByAgent: true,
        readByCustomer: false,
        status: 'sending',
        isOptimistic: true
      };

      setSelectedChat(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), optimisticImageMessage],
          lastMessage: `📷 Image`,
          updatedAt: new Date()
        };
      });

      // Scroll to bottom after adding the image
      setTimeout(scrollToBottom, 100);
      
      // Send image message via API
      const messagePayload = { 
        message: '',
        messageType: 'image',
        imageData: image.imageData,
        mimeType: image.mimeType,
        filename: image.filename
      };
      
      console.log('🔍 [ChatBox] Sending message payload:', {
        ...messagePayload,
        imageData: `[${messagePayload.imageData?.length} chars]`
      });
      
      try {
        const apiResponse = await agentApi.post(`/chats/${chatId}/message`, messagePayload);
        console.log('✅ [ChatBox] Message sent successfully:', apiResponse.status);
        
        // Mark messages as read
        await agentApi.post(`/chats/${chatId}/mark-read`);
        
        // ✅ Update optimistic message to sent
        setSelectedChat(prev => ({
          ...prev,
          messages: (prev.messages || []).map(msg => 
            msg.isOptimistic && msg.filename === image.filename 
              ? { ...msg, status: 'sent', isOptimistic: false }
              : msg
          )
        }));
        
        showNotification('Image sent successfully', 'success');
        
      } catch (sendError) {
        console.error('❌ [ChatBox] Failed to send image message:', sendError);
        console.error('❌ [ChatBox] Send error response:', sendError.response?.data);
        console.error('❌ [ChatBox] Send error status:', sendError.response?.status);
        
        // ❌ Mark image message as failed
        setSelectedChat(prev => ({
          ...prev,
          messages: (prev.messages || []).map(msg => 
            msg.isOptimistic && msg.filename === image.filename 
              ? { ...msg, status: 'failed', isOptimistic: false }
              : msg
          )
        }));
        
        throw sendError;
      }
      
    } catch (error) {
      console.error('❌ [ChatBox] Error sending image:', error);
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

      // ⚡ INSTANT MESSAGING: Optimistic update first
      const clientId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      const optimisticMessage = {
        message: messageText,
        timestamp: new Date(),
        sender: 'agent',
        senderName: currentAgent?.name || 'Agent',
        readByAgent: true,
        readByCustomer: false,
        status: 'sending',
        isOptimistic: true,
        clientId
      };

      // Add optimistic message immediately
      setSelectedChat(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), optimisticMessage]
        };
      });
      
      scrollToBottom();
      
      // Send via API only (fast response)
      try {
        let messageResponse;
        try {
          messageResponse = await agentApi.post(`/chats/${chatId}/message`, { 
            message: messageText,
            messageType: messageType,
            clientId
          });
        } catch (messageError) {
          // Fallback to first-contact endpoint for agents
          messageResponse = await agentApi.post(`/chats/${chatId}/first-contact`, { 
            message: messageText,
            clientId
          });
        }
        
        await agentApi.post(`/chats/${chatId}/mark-read`);
        
        // ✅ Update optimistic message to sent but keep isOptimistic=true until WebSocket echo replaces it
        setSelectedChat(prev => ({
          ...prev,
          messages: (prev.messages || []).map(msg => 
            msg.isOptimistic && msg.message === messageText 
              ? { ...msg, status: 'sent' }
              : msg
          )
        }));
        
        // Call the parent's onMessageSent callback if provided (for auto-redirect)
        if (onMessageSent) {
          onMessageSent(messageText);
        }
        
      } catch (sendError) {
        // ❌ Mark message as failed
        setSelectedChat(prev => ({
          ...prev,
          messages: (prev.messages || []).map(msg => 
            msg.isOptimistic && msg.message === messageText 
              ? { ...msg, status: 'failed', isOptimistic: false }
              : msg
          )
        }));
        
        // Check if error is about insufficient coins
        if (sendError.response?.data?.type === 'INSUFFICIENT_COINS') {
          showNotification(
            `❌ User has insufficient coins (${sendError.response.data.userCoins} left). User needs to purchase more coins to continue chatting.`,
            'error'
          );
        }
        
        throw sendError;
      }

      // Note: Removed WebSocket sendMessage call to prevent duplication

    } catch (error) {
      // Still call onMessageSent even if there's an error, so the redirect works
      if (onMessageSent) {
        onMessageSent(messageText);
      }
      
      // Handle coin-specific errors
      if (error.response?.data?.type === 'INSUFFICIENT_COINS') {
        setError(`❌ Customer has insufficient coins (${error.response.data.userCoins} remaining). Customer needs to purchase more coins to continue chatting.`);
        showNotification(
          `Customer has ${error.response.data.userCoins} coins left and needs to purchase more to continue chatting.`,
          'error'
        );
      } else {
        setError(`Failed to send message: ${error.response?.data?.message || error.message}`);
      }
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
    showVoiceNote: false,
    onShowImageSelector: () => setShowImageSelector(true)
  }), [memoizedSendMessage, isLoading]);

  const handleChatSelection = async (chat) => {
    if (!chat || !chat._id) {
      setError('Invalid chat selected');
      return;
    }
    // Ensure we have full chat details (global live-queue items may not include messages)
    let fullChat = chat;
    if (!Array.isArray(chat.messages)) {
      try {
        const fetched = await agentAuth.getChat(chat._id);
        if (fetched) fullChat = fetched;
      } catch (e) {
        // Non-fatal; continue with the partial chat object
      }
    }

    setSelectedChat(fullChat);
    setShowMobileSidebar(false); // Close mobile sidebar when chat is selected
    const customerInfo = fullChat.customerId || {};
    setUserDetails({
      username: customerInfo.username || fullChat.customerName || 'N/A',
      email: customerInfo.email || 'N/A',
      gender: customerInfo.gender || 'N/A',
      age: customerInfo.age || 'N/A',
      createdAt: customerInfo.createdAt || fullChat.createdAt || 'N/A',
      coins: customerInfo.coins?.balance || 0,
      memberSince: customerInfo.createdAt ? new Date(customerInfo.createdAt).toLocaleDateString() : 'N/A'
    });

  // Set notes from chat comments initially (normalize legacy notes so they show)
  setNotes(normalizeGeneralNotes(fullChat.comments || []));
    setShowNoteInput(false);
    setGeneralNote(''); // Reset general note when changing chats
    
    // Clear previous logs
    setEscortLogs([]);
    setUserLogs([]);
    
    // Load the latest notes from the backend
    try {
      const notesData = await agentAuth.getChatNotes(fullChat._id);
      if (notesData && notesData.comments) {
        console.log('Loading chat notes:', notesData.comments);
        setNotes(normalizeGeneralNotes(notesData.comments));
      }
    } catch (error) {
      // Don't set error state here as it's not critical
    }
    
    // Fetch logs for escort and user if IDs are available
    if (fullChat.escortId?._id) {
      fetchEscortLogs(fullChat.escortId._id);
    }
    if (fullChat.customerId?._id) {
      fetchUserLogs(fullChat.customerId._id);
    }
  };

  useEffect(() => {
    const fetchInitialChats = async () => {
      try {
        // VIEW MODE: Load single chat directly
        if (isViewMode) {
          const chatId = params.chatId;
          setError(null);
          
          try {
            const chat = await agentAuth.getChat(chatId);
            if (chat) {
              setChats([chat]);
              await handleChatSelection(chat);
              setTimeout(() => scrollToBottom(), 100);
            } else {
              setError('Chat not found.');
            }
          } catch (error) {
            console.error('Error loading chat:', error);
            setError('Failed to load chat. It may have been deleted or you may not have permission to access it.');
          }
          return;
        }
        
        // QUEUE MODE: Original queue loading logic
        const escortId = params.escortId;
        const chatId = searchParams.get('chatId'); // Get chatId from query parameters
        
        if (!escortId) {
          setError('No escort profile selected. Please select an escort profile to view their live queue.');
          return;
        }
        // Fetch escort-scoped live queue
        const escortResponse = await agentAuth.getLiveQueue(escortId);
        const normalized = Array.isArray(escortResponse)
          ? escortResponse
          : (Array.isArray(escortResponse?.data) ? escortResponse.data : []);
        setChats(normalized);
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
          const chatToSelect = normalized.find(c => c._id === chatId);
          if (chatToSelect) {
            await handleChatSelection(chatToSelect);
            // Removed auto-scroll to bottom since messages are now newest-first
          } else {
            // Try to fetch the specific chat directly
            try {
              const specificChat = await agentAuth.getChat(chatId);
              
              if (specificChat) {
                // Add the specific chat to the chats list if it's not already there
                const updatedChats = [...normalized];
                if (!updatedChats.find(c => c._id === chatId)) {
                  updatedChats.unshift(specificChat); // Add to beginning
                }
                setChats(updatedChats);
                await handleChatSelection(specificChat);
                // Removed auto-scroll to bottom since messages are now newest-first
              } else {
                throw new Error('Chat not found');
              }
            } catch (directFetchError) {
              // Fallback: Try to refetch the queue with the specific chatId
              try {
                const refreshedData = await agentAuth.getLiveQueue(escortId, chatId);
                const normalizedRefetch = Array.isArray(refreshedData)
                  ? refreshedData
                  : (Array.isArray(refreshedData?.data) ? refreshedData.data : []);
                const refreshedChat = normalizedRefetch.find(c => c._id === chatId);
                
                if (refreshedChat) {
                  setChats(normalizedRefetch);
                  await handleChatSelection(refreshedChat);
                  // Removed auto-scroll to bottom since messages are now newest-first
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
        // When the escort-specific queue 404s due to not authorized, fall back to global queue
        const msg = error?.message || error?.response?.data?.message || '';
        const isEscortUnauthorized = /escort profile not found|not authorized/i.test(msg);
        if (isEscortUnauthorized) {
          try {
            const globalResponse = await agentAuth.getLiveQueue();
            const normalizedGlobal = Array.isArray(globalResponse)
              ? globalResponse
              : (Array.isArray(globalResponse?.data) ? globalResponse.data : []);
            setChats(normalizedGlobal);

            // Try to select the requested chat if a chatId param exists
            const chatIdParam = searchParams.get('chatId');
            if (chatIdParam) {
              const found = normalizedGlobal.find(c => c._id === chatIdParam);
              if (found) {
                await handleChatSelection(found);
                // Removed auto-scroll to bottom since messages are now newest-first
                setError(null);
              } else {
                // Try direct fetch of the chat and add/select it
                try {
                  const specificChat = await agentAuth.getChat(chatIdParam);
                  if (specificChat) {
                    const updated = [specificChat, ...normalizedGlobal.filter(c => c._id !== chatIdParam)];
                    setChats(updated);
                    await handleChatSelection(specificChat);
                    // Removed auto-scroll to bottom since messages are now newest-first
                    setError(null);
                  } else {
                    setError('Chat not available. It may have been closed, reassigned, or you may not have permission to access it.');
                  }
                } catch (directFetchErr) {
                  setError('Chat not available. It may have been closed, reassigned, or you may not have permission to access it.');
                }
              }
            } else {
              // No specific chat requested; show a non-blocking notice
              setError(null);
            }
          } catch (fallbackError) {
            const fallbackMsg = fallbackError?.message || fallbackError?.response?.data?.message || 'Failed to load the live queue';
            setError(fallbackMsg);
          }
        } else {
          const errorMessage = error?.response?.data?.message || msg || 'Failed to load the live queue';
          setError(errorMessage);
        }
      }
    };

    // Identify as agent when connecting
    websocketService.connect();
  websocketService.identifyAgent({});
    
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
          filename: data.filename,
          status: 'sent' // Real messages from WebSocket are already sent
        };

        setChats(prevChats => {
          return prevChats.map(chat => {
            if (chat._id === data.chatId) {
              // 🔄 SMART UPDATE: Replace optimistic message if it exists, or add new message
              const updatedMessages = [...(chat.messages || [])];
              
              // Find matching optimistic message (same content and sender)
              const optimisticIndex = updatedMessages.findIndex(msg => 
                msg.isOptimistic && (
                  (data.clientId && msg.clientId && msg.clientId === data.clientId) ||
                  (
                    msg.sender === data.sender && 
                    ((data.messageType === 'image' && msg.filename === data.filename) ||
                     (data.messageType !== 'image' && msg.message === data.message))
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
                    (data.messageType !== 'image' && msg.message === data.message)
                  )
                );
                if (existingIndex === -1) {
                  updatedMessages.push(newMessage);
                }
              }
              
              // Show appropriate last message for image messages (no filename)
              const lastMessage = data.messageType === 'image' 
                ? `📷 Image`
                : data.message;
              
              return {
                ...chat,
                messages: updatedMessages,
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
            
          setSelectedChat(prev => {
            if (!prev) return prev;
            
            // 🔄 SMART UPDATE: Replace optimistic message if it exists, or add new message
            const updatedMessages = [...(prev.messages || [])];
            
            // Find matching optimistic message (same content and sender)
            const optimisticIndex = updatedMessages.findIndex(msg => 
              msg.isOptimistic && (
                (data.clientId && msg.clientId && msg.clientId === data.clientId) ||
                (
                  msg.sender === data.sender && 
                  ((data.messageType === 'image' && msg.filename === data.filename) ||
                   (data.messageType !== 'image' && msg.message === data.message))
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
                  (data.messageType !== 'image' && msg.message === data.message)
                )
              );
              if (existingIndex === -1) {
                updatedMessages.push(newMessage);
              }
            }
            
            return {
              ...prev,
              messages: updatedMessages,
              lastMessage: lastMessage,
              updatedAt: new Date(data.timestamp)
            };
          });
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
                  messages: (chat.messages || []).map(msg => ({
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
  // Make the API call to update status (server will broadcast over WebSocket)
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
  // Make the API call (server will broadcast over WebSocket)
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

  const handleWatchLiveQueue = () => {
    if (selectedChat && selectedChat.escortId) {
      // Navigate to the live queue with the current chat
      const escortId = selectedChat.escortId._id || selectedChat.escortId;
      navigate(`/agent/live-queue/${escortId}?chatId=${selectedChat._id}`);
    } else {
      showNotification('Unable to enter live queue. Chat or escort information is missing.', 'error');
    }
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
      
  // Update notes with the actual data from the server (preserve general tagging)
  setNotes(normalizeGeneralNotes(response.allNotes));
      
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
  const handleAddGeneralNote = async (textParam) => {
    const text = typeof textParam === 'string' ? textParam : generalNote;
    if (!text?.trim() || !selectedChat) return;
    
    try {
      // Create a new note object for local state with special tag for general notes
      const noteObj = {
        text: `[General] ${text.trim()}`,
        timestamp: new Date(),
        agentName: currentAgent?.name || 'You', // Will be replaced by the server with actual agent name
        isGeneral: true
      };
      
      // Add to local state immediately for UI feedback
      setNotes([...notes, noteObj]);
      
      // Clear the input field
      setGeneralNote('');
      
      // Send to backend using the dedicated API - include isGeneral flag
      const response = await agentAuth.addChatNote(selectedChat._id, {
        text: noteObj.text,
        isGeneral: true
      });
      
  // Update notes with the actual data from the server (preserve general tagging)
  setNotes(normalizeGeneralNotes(response.allNotes));
      
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
  setNotes(normalizeGeneralNotes(response.allNotes));
      
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
        websocketService.identifyAgent(agentData);
      } catch (error) {
        // Failed to fetch agent profile, not critical
      }
    };
    
    fetchAgentProfile();
  }, []);

  useEffect(() => {
    if (!currentAgent) {
      return;
    }

    const chatId = selectedChat?._id || null;

    if (chatId) {
      websocketService.setCurrentChatId(chatId);
    } else {
      websocketService.setCurrentChatId(null);
    }

    return () => {
      if (chatId) {
        websocketService.setCurrentChatId(null);
      }
    };
  }, [selectedChat?._id, currentAgent?._id]);

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
        messages: (prev.messages || []).map((msg, idx) => {
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

      // Update local state - completely remove deleted messages from view
      setSelectedChat(prev => ({
        ...prev,
        messages: (prev.messages || []).filter((msg, idx) => idx !== messageIndex)
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

  // Handle deleting an escort log
  const handleDeleteEscortLog = async (log) => {
    if (!window.confirm('Are you sure you want to delete this log?')) {
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('agentToken');
      const response = await fetch(`http://localhost:5000/api/logs/escort/${log._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Debug-Info': 'Escort log deletion request'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete log');
      }

      // Refresh escort logs
      if (selectedChat?.escortId?._id) {
        fetchEscortLogs(selectedChat.escortId._id);
      }

      showNotification('Log deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting escort log:', error);
      setError(`Failed to delete log: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
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

  // Handle deleting a user log
  const handleDeleteUserLog = async (log) => {
    if (!window.confirm('Are you sure you want to delete this log?')) {
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('agentToken');
      const response = await fetch(`http://localhost:5000/api/logs/user/${log._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Debug-Info': 'User log deletion request'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete log');
      }

      // Refresh user logs
      if (selectedChat?.customerId?._id) {
        fetchUserLogs(selectedChat.customerId._id);
      }

      showNotification('Log deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting user log:', error);
      setError(`Failed to delete log: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
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
        className={`p-2.5 rounded-lg cursor-pointer transition-colors border ${
          selectedChat?._id === chat._id 
            ? 'bg-blue-600 text-white border-blue-500' 
            : needsFollowUp
            ? 'bg-yellow-800/20 text-gray-300 hover:bg-yellow-700/30 border-yellow-600/30'
            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-gray-700/50'
        }`}
      >
        <div className="flex justify-between items-start mb-1">
          <div className="font-medium text-sm truncate flex-1 mr-2">
            {chat.customerId?.username || chat.customerName}
          </div>
          <div className="text-xs opacity-75 whitespace-nowrap">
            {formatDate(chat.createdAt)}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-1 mt-1.5">
          {chat.isInPanicRoom && (
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                <svg className="w-2.5 h-2.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 17.333 3.924 19 5.464 19z" />
                </svg>
                PANIC
              </div>
              {chat.panicRoomReason && (
                <div className="text-xs text-red-300 truncate max-w-[100px]" title={chat.panicRoomReason}>
                  {chat.panicRoomReason}
                </div>
              )}
            </div>
          )}
          {unreadCount > 0 && (
            <div className="inline-block px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {unreadCount}
            </div>
          )}
          {needsFollowUp && (
            <ReminderBadge dueDate={chat.followUpDue} />
          )}
          {chat.customerId?.coins?.balance !== undefined && (
            (() => {
              const coinBalance = parseInt(chat.customerId.coins.balance) || 0;
              let bgColor = 'bg-yellow-500/20 text-yellow-300';
              let alertIcon = null;
              
              if (coinBalance === 0) {
                bgColor = 'bg-red-500/30 text-red-200';
                alertIcon = (
                  <svg className="h-2.5 w-2.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                );
              } else if (coinBalance <= 5) {
                bgColor = 'bg-orange-500/30 text-orange-200';
                alertIcon = (
                  <svg className="h-2.5 w-2.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                );
              }
              
              return (
                <div className={`inline-flex items-center px-1.5 py-0.5 text-xs rounded-full ${bgColor}`} title={`User has ${coinBalance} coins`}>
                  {alertIcon}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  {chat.customerId.coins.balance}
                </div>
              );
            })()
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
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-2 min-h-screen bg-gray-900 p-1">
  {/* Chat List and Escort Profile */}
  <div className="hidden lg:block lg:col-span-3 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/agent/dashboard')}
              className="p-1.5 text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-sm font-medium text-white">Chat Box</h2>
          </div>

          {/* Escort Profile Section */}
          {selectedChat?.escortId && (
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Escort Profile
              </h3>
              <div className="space-y-2">
                <div className="flex justify-center mb-3">
                  {selectedChat?.escortId?.profileImage ? (
                    <img 
                      src={selectedChat.escortId.profileImage} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-pink-500"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white text-lg font-medium border-2 border-pink-500">
                      {selectedChat?.escortId?.firstName?.[0] || '?'}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center mb-3">
                  <div className="flex-1">
                    <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                      <span className="text-xs text-gray-400">Name</span>
                      <span className="text-white text-xs font-medium">{selectedChat?.escortId?.firstName || 'N/A'}</span>
                    </div>
                  </div>
                  {selectedChat?.escortId?._id && (
                    <button
                      onClick={() => setShowEscortLogModal(true)}
                      className="ml-2 flex items-center gap-1 px-2 py-1 bg-pink-600 hover:bg-pink-700 text-white text-xs rounded transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Logs
                    </button>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                    <span className="text-xs text-gray-400">Gender</span>
                    <span className="text-white text-xs">{selectedChat?.escortId?.gender || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                    <span className="text-xs text-gray-400">Location</span>
                    <span className="text-white text-xs truncate ml-2" title={selectedChat?.escortId?.region ? `${selectedChat.escortId.region}, ${selectedChat.escortId.country}` : selectedChat?.escortId?.country || 'N/A'}>
                      {selectedChat?.escortId?.region ? `${selectedChat.escortId.region}, ${selectedChat.escortId.country}` : selectedChat?.escortId?.country || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                    <span className="text-xs text-gray-400">Profession</span>
                    <span className="text-white text-xs">{selectedChat?.escortId?.profession || 'N/A'}</span>
                  </div>
                  <div className="py-1">
                    <span className="text-xs text-gray-400 block mb-1">Interests</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedChat?.escortId?.interests?.length > 0 ? selectedChat.escortId.interests.map((interest, index) => (
                        <span key={index} className="px-2 py-0.5 bg-pink-500/20 text-pink-300 rounded-full text-xs">
                          {interest}
                        </span>
                      )) : (
                        <span className="text-white text-xs">N/A</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Escort Logs Section */}
                {selectedChat?.escortId?._id && (
                  <div className="mt-3">
                    <LogsList
                      logs={escortLogs}
                      isLoading={loadingLogs}
                      title="Escort Logs"
                      emptyMessage="No logs available for this escort"
                      onEditLog={handleEditEscortLog}
                      onDeleteLog={handleDeleteEscortLog}
                      canEdit={true}
                      canDelete={true}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Active Chats
              </h3>
              {chats.length > 3 && (
                <button
                  onClick={() => setShowAllChats(!showAllChats)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {showAllChats ? 'Show Less' : `Show All (${chats.length})`}
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {showAllChats ? chatListItems : chatListItems.slice(0, 3)}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Column: Header + Notes + Chat stacked */}
      <div className="lg:col-span-6 lg:col-start-4 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header with user info and controls - at the very top */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-t-xl shadow-lg border border-gray-700 border-b-0">
              <div className="hidden lg:block p-2 bg-gray-800/50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                      {(selectedChat.customerId?.username?.[0] || selectedChat.customerName?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-sm font-medium text-white flex items-center gap-2">
                        {selectedChat.customerId?.username || selectedChat.customerName}
                        {selectedChat.isInPanicRoom && (
                          <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 17.333 3.924 19 5.464 19z" />
                            </svg>
                            PANIC
                          </span>
                        )}
                      </h2>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`${selectedChat.isUserActive ? 'text-green-400' : 'text-gray-400'}`}>
                          {selectedChat.isUserActive ? 'Online' : 'Offline'}
                        </span>
                        {selectedChat.customerId?.coins?.balance !== undefined && (
                          (() => {
                            const coinBalance = parseInt(selectedChat.customerId.coins.balance) || 0;
                            let bgColor = 'bg-yellow-500/20 text-yellow-300';
                            let alertIcon = null;
                            
                            if (coinBalance === 0) {
                              bgColor = 'bg-red-500/30 text-red-200';
                              alertIcon = (
                                <svg className="h-2.5 w-2.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              );
                            } else if (coinBalance <= 5) {
                              bgColor = 'bg-orange-500/30 text-orange-200';
                              alertIcon = (
                                <svg className="h-2.5 w-2.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              );
                            }
                            
                            return (
                              <span className={`px-1.5 py-0.5 rounded-full flex items-center ${bgColor}`} title={`User has ${coinBalance} coins`}>
                                {alertIcon}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                </svg>
                                {selectedChat.customerId.coins.balance}
                              </span>
                            );
                          })()
                        )}
                        {(() => {
                          const { inCount, outCount } = getMessageCounts();
                          return (
                            <div className="flex items-center gap-2">
                              <span className="text-green-400">In: {inCount}</span>
                              <span className="text-blue-400">Out: {outCount}</span>
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
                    onWatchLiveQueue={handleWatchLiveQueue}
                    customerName={selectedChat.customerId?.username || selectedChat.customerName || 'Customer'}
                    escortName={escortProfile?.firstName || 'Escort'}
                    isInPanicRoom={selectedChat.isInPanicRoom || false}
                    isViewMode={isViewMode}
                  />
                </div>
              </div>
            </div>

            {/* General Notes (middle section) */}
            <div className="border-x border-gray-700 bg-gray-800/20">
              <StickyGeneralNotes
                notes={notes}
                isVisible={showGeneralNotes}
                setIsVisible={setShowGeneralNotes}
                onDeleteNote={handleDeleteChatNote}
                onAddNote={handleAddGeneralNote}
              />
            </div>

            {/* Mobile Header + Actions - Show only on mobile/tablet */}
            <div className="lg:hidden bg-gray-800/50 backdrop-blur-sm border border-gray-700 border-t-0">
              {/* Mobile Header */}
              <div className="p-3 sm:p-4 border-b border-gray-700 bg-gray-800/50">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => navigate('/agent/dashboard')}
                    className="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <h2 className="text-lg font-semibold text-white">Chat Box</h2>
                  <div className="w-10"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                    {(selectedChat.customerId?.username?.[0] || selectedChat.customerName?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium truncate text-sm">
                        {selectedChat.customerId?.username || selectedChat.customerName}
                      </h3>
                      {selectedChat.isInPanicRoom && (
                        <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 17.333 3.924 19 5.464 19z" />
                          </svg>
                          PANIC
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={selectedChat.isUserActive ? 'text-green-400' : 'text-gray-400'}>
                        {selectedChat.isUserActive ? 'Online' : 'Offline'}
                      </span>
                      {selectedChat.customerId?.coins?.balance !== undefined && (
                        (() => {
                          const coinBalance = parseInt(selectedChat.customerId.coins.balance) || 0;
                          let bgColor = 'bg-yellow-500/20 text-yellow-300';
                          let alertIcon = null;
                          
                          if (coinBalance === 0) {
                            bgColor = 'bg-red-500/30 text-red-200';
                            alertIcon = (
                              <svg className="h-2.5 w-2.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            );
                          } else if (coinBalance <= 5) {
                            bgColor = 'bg-orange-500/30 text-orange-200';
                            alertIcon = (
                              <svg className="h-2.5 w-2.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            );
                          }
                          
                          return (
                            <span className={`px-1.5 py-0.5 rounded-full flex items-center ${bgColor}`} title={`User has ${coinBalance} coins`}>
                              {alertIcon}
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                              </svg>
                              {selectedChat.customerId.coins.balance}
                            </span>
                          );
                        })()
                      )}
                      {(() => {
                        const { inCount, outCount } = getMessageCounts();
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-green-400">In: {inCount}</span>
                            <span className="text-blue-400">Out: {outCount}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                {/* Mobile Actions - Inside the mobile header */}
                <div className="mt-3 flex gap-1 sm:gap-2 flex-wrap justify-center">
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
                    onWatchLiveQueue={handleWatchLiveQueue}
                    customerName={selectedChat.customerId?.username || selectedChat.customerName || 'Customer'}
                    escortName={escortProfile?.firstName || 'Escort'}
                    isInPanicRoom={selectedChat.isInPanicRoom || false}
                    isViewMode={isViewMode}
                    isMobile={true}
                  />
                </div>
              </div>
            </div>

            {/* Composer at top of chat box */}
            <div className="p-2 border-b border-gray-700 bg-gray-800/30">
              <MessageComposer key={`composer-${selectedChat?._id}`} {...messageComposerProps} />
            </div>

            {/* Messages Section (scrolls inside chat box with fixed height) */}
            <div className="h-[55vh] md:h-[60vh] overflow-y-auto p-2 space-y-3 bg-gray-900/30 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              <div ref={messagesEndRef} />
              
              {/* Coin Alert - Show coin balance alert to agent */}
              <CoinAlert 
                coinBalance={selectedChat.customerId?.coins?.balance} 
                className="mx-1"
              />
              
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

              {([...(selectedChat?.messages || [])].reverse()).filter(msg => !msg.isDeleted).map((msg, idx) => {
                const origIndex = (selectedChat?.messages?.length || 0) - 1 - idx;
                return (
                  <div key={msg._id || origIndex} className="mb-3">
                    {/* Sender Label */}
                    <div className={`text-xs font-medium mb-1 px-1 ${
                      msg.sender === 'agent' ? 'text-right' : 'text-left text-yellow-400'
                    }`}>
                      {msg.sender === 'agent' ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getAgentColor(currentAgent?.name || 'Agent')}`}>
                          {currentAgent?.name || 'Agent'}
                        </span>
                      ) : (
                        msg.senderName || selectedChat?.customerId?.username || 'User'
                      )}
                    </div>
                    
                    {/* Message Bubble */}
                    <div
                      className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                      style={{ overflow: 'visible', position: 'relative' }}
                    >
                      <div className="flex flex-col max-w-[85%] sm:max-w-[70%] relative overflow-visible">
                        <div
                          className={`px-4 py-3 rounded-lg relative group overflow-visible border-2 ${
                            msg.sender === 'agent'
                              ? 'border-red-400 bg-transparent text-white'
                              : 'border-yellow-400 bg-transparent text-white'
                          } ${msg.isDeleted ? 'opacity-50' : ''}`}
                          style={{ wordBreak: 'break-word' }}
                        >
                        {editingMessage === origIndex ? (
                          <div className="space-y-2">
                            <textarea
                              value={editMessageText}
                              onChange={(e) => setEditMessageText(e.target.value)}
                              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                              rows="3"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button onClick={handleSaveEditMessage} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors">Save</button>
                              <button onClick={handleCancelEditMessage} className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {msg.messageType === 'image' && (msg.imageData || msg.filename) ? (
                              <div className="space-y-2">
                                <div className="relative">
                                  <img
                                    src={msg.imageData || `/uploads/chat/${msg.filename}`}
                                    alt={msg.filename || 'Sent image'}
                                    className="max-w-full max-h-32 sm:max-h-48 md:max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity border border-gray-600"
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
                            
                            {/* Time stamp at bottom right */}
                            <div className={`flex justify-end mt-2`}>
                              <span className="text-xs opacity-75">{formatDate(msg.timestamp)}</span>
                              {!msg.isDeleted && msg.sender === 'agent' && msg.messageType !== 'image' && (
                                <div className="flex ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleStartEditMessage(origIndex, msg.message)} className="p-1 text-gray-200 hover:text-white transition-colors" title="Edit your message">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button onClick={() => handleDeleteMessage(origIndex)} className="p-1 ml-1 text-gray-200 hover:text-white transition-colors" title="Delete your message">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                        </div>
                        
                        {msg.note && (
                          <div className="px-3 py-1 mt-1 bg-yellow-500/20 text-yellow-300 rounded-lg text-xs">
                            <div className="flex justify-between">
                              <span className="font-medium">Note: {msg.note.text}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs opacity-75">{new Date(msg.note.timestamp).toLocaleTimeString()}</span>
                                <button onClick={() => handleDeleteMessageNote(origIndex)} className="text-red-400 hover:text-red-300 ml-1" title="Delete note">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {msg.sender === 'customer' && !msg.note && (
                            <MessageReminderBadge message={msg} onAddQuickNote={(text) => handleAddMessageNote(origIndex, text)} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
  <div className="hidden lg:block lg:col-span-3 lg:col-start-10 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
        {selectedChat ? (
          <div className="p-3">
            {/* User Profile Image - Compact */}
            <div className="flex justify-center mb-3">
              {selectedChat?.customerId?.profileImage ? (
                <img 
                  src={selectedChat.customerId.profileImage} 
                  alt="User Profile" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-lg font-medium border-2 border-blue-500">
                  {selectedChat?.customerId?.username?.[0]?.toUpperCase() || userDetails.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white text-sm font-medium">User Details</h3>
              {selectedChat?.customerId?._id && (
                <button
                  onClick={() => setShowUserLogModal(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Logs
                </button>
              )}
            </div>

            {/* Minimal User Info */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                <span className="text-xs text-gray-400">Username</span>
                <span className="text-white text-xs font-medium truncate ml-2">{userDetails.username}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                <span className="text-xs text-gray-400">Email</span>
                <span className="text-white text-xs truncate ml-2" title={userDetails.email}>{userDetails.email}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                <span className="text-xs text-gray-400">Gender</span>
                <span className="text-white text-xs">{userDetails.gender}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                <span className="text-xs text-gray-400">Age</span>
                <span className="text-white text-xs">{userDetails.age}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                <span className="text-xs text-gray-400">Member Since</span>
                <span className="text-white text-xs">{userDetails.memberSince}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 bg-yellow-600/10 rounded px-2">
                <span className="text-xs text-yellow-400 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  Coins
                </span>
                <span className="text-white text-xs font-medium">{userDetails.coins !== 'N/A' ? userDetails.coins : 'N/A'}</span>
              </div>
            </div>

            {/* User Logs Section */}
            {selectedChat?.customerId?._id && (
              <div className="mt-3">
                <LogsList
                  logs={userLogs}
                  isLoading={loadingLogs}
                  title="User Logs"
                  emptyMessage="No logs available for this user"
                  onEditLog={handleEditUserLog}
                  onDeleteLog={handleDeleteUserLog}
                  canEdit={true}
                  canDelete={true}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p>Select a chat to view user details</p>
          </div>
        )}

        {/* Chat Statistics */}
        {selectedChat && (
          <div className="bg-gray-800/50 rounded-lg p-3 mt-3">
            <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Chat Stats
            </h3>
            <div className="space-y-2">
              {/* Message counts in one line */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Messages</span>
                <span className="text-white font-medium">{selectedChat.messages?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  In
                </span>
                <span className="text-green-400 font-medium">{getMessageCounts().inCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  Out
                </span>
                <span className="text-blue-400 font-medium">{getMessageCounts().outCount}</span>
              </div>
              
              {/* Divider */}
              <div className="border-t border-gray-600/50 my-2"></div>
              
              {/* Timestamps in compact format */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Started</span>
                  <span className="text-white text-right">
                    {new Date(selectedChat.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Last Active</span>
                  <span className="text-white text-right">
                    {selectedChat.messages?.length > 0 
                      ? new Date(selectedChat.messages[selectedChat.messages.length - 1].timestamp).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'No messages'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
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
      
      {/* Mobile Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 lg:hidden flex flex-col gap-2 z-40">
        {/* Escort Profile Image Button */}
        {selectedChat?.escortId && (
          <button
            onClick={() => {
              setMobileSidebarType('escort');
              setShowMobileSidebar(true);
            }}
            className="w-12 h-12 bg-gradient-to-br from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 border-2 border-pink-500/30"
            title="Escort Profile & Logs"
          >
            {selectedChat?.escortId?.profileImage ? (
              <img 
                src={selectedChat.escortId.profileImage} 
                alt="Escort Profile" 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white text-sm font-medium">
                {selectedChat?.escortId?.firstName?.[0] || '?'}
              </div>
            )}
          </button>
        )}
        
        {/* User Details Button */}
        <button
          onClick={() => {
            setMobileSidebarType('user');
            setShowMobileSidebar(true);
          }}
          className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          title="User Details"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
        
        {/* Chat List Button */}
        <button
          onClick={() => {
            setMobileSidebarType('chats');
            setShowMobileSidebar(true);
          }}
          className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          title="Chat List"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
        
        {/* Escort Profile Button (only if escort chat) */}
        {params.escortId && (
          <button
            onClick={() => {
              setMobileSidebarType('escort');
              setShowMobileSidebar(true);
            }}
            className="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
            title="Escort Profile"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          {/* Sidebar Container with Animation */}
          <div className={`fixed inset-y-0 w-80 max-w-[90vw] bg-gray-800 shadow-xl overflow-y-auto touch-pan-y transform transition-all duration-300 ease-out ${
            mobileSidebarType === 'escort' 
              ? 'left-0 animate-slide-in-left' 
              : mobileSidebarType === 'user'
              ? 'right-0 animate-slide-in-right'
              : 'left-0 animate-slide-in-left'
          }`}>
            {/* Sidebar Header */}
            <div className={`p-4 border-b border-gray-700 flex items-center justify-between backdrop-blur sticky top-0 ${
              mobileSidebarType === 'escort' 
                ? 'bg-gradient-to-r from-pink-800/90 to-purple-800/90' 
                : mobileSidebarType === 'user'
                ? 'bg-gradient-to-r from-blue-800/90 to-purple-800/90'
                : 'bg-gray-800/90'
            }`}>
              <h3 className="text-white font-semibold flex items-center gap-2">
                {mobileSidebarType === 'escort' && (
                  <>
                    <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Escort Profile
                  </>
                )}
                {mobileSidebarType === 'user' && (
                  <>
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    User Details
                  </>
                )}
                {mobileSidebarType === 'chats' && (
                  <>
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat List
                  </>
                )}
              </h3>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Sidebar Content */}
            <div className="p-4">
              {mobileSidebarType === 'chats' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        navigate('/agent/dashboard');
                        setShowMobileSidebar(false);
                      }}
                      className="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </button>
                    <h2 className="text-lg font-semibold text-white">Chats</h2>
                    <div className="w-10"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="space-y-3">
                      {chatListItems}
                    </div>
                  </div>
                </div>
              )}
              
              {mobileSidebarType === 'user' && selectedChat && (
                <div>
                  {/* User Profile Image - Compact */}
                  <div className="flex justify-center mb-3">
                    {selectedChat?.customerId?.profileImage ? (
                      <img 
                        src={selectedChat.customerId.profileImage} 
                        alt="User Profile" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-lg font-medium border-2 border-blue-500">
                        {selectedChat?.customerId?.username?.[0]?.toUpperCase() || userDetails.username?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  {/* Minimal User Info */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                      <span className="text-xs text-gray-400">Username</span>
                      <span className="text-white text-xs font-medium truncate ml-2">{userDetails.username}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                      <span className="text-xs text-gray-400">Email</span>
                      <span className="text-white text-xs truncate ml-2" title={userDetails.email}>{userDetails.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                      <span className="text-xs text-gray-400">Gender</span>
                      <span className="text-white text-xs">{userDetails.gender}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                      <span className="text-xs text-gray-400">Age</span>
                      <span className="text-white text-xs">{userDetails.age}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                      <span className="text-xs text-gray-400">Member Since</span>
                      <span className="text-white text-xs">{userDetails.memberSince}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 bg-yellow-600/10 rounded px-2">
                      <span className="text-xs text-yellow-400 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        Coins
                      </span>
                      <span className="text-white text-xs font-medium">{userDetails.coins !== 'N/A' ? userDetails.coins : 'N/A'}</span>
                    </div>
                  </div>
                  
                  {/* Chat Statistics */}
                  <div className="mt-6 bg-gray-800/50 rounded-lg p-3">
                    <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Chat Stats
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Messages</span>
                        <span className="text-white font-medium">{selectedChat.messages?.length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 flex items-center gap-1">
                          <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                          </svg>
                          In
                        </span>
                        <span className="text-green-400 font-medium">{getMessageCounts().inCount}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 flex items-center gap-1">
                          <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          Out
                        </span>
                        <span className="text-blue-400 font-medium">{getMessageCounts().outCount}</span>
                      </div>
                      
                      <div className="border-t border-gray-600/50 my-2"></div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Started</span>
                        <span className="text-white text-right">
                          {new Date(selectedChat.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* User Logs Section */}
                  <div className="mt-6 bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white text-sm font-medium flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        User Logs
                      </h3>
                      {selectedChat?.customerId?._id && (
                        <button
                          onClick={() => {
                            setShowMobileSidebar(false);
                            setShowUserLogModal(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Log
                        </button>
                      )}
                    </div>
                    
                    {/* Display User Logs */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {userLogs.length > 0 ? (
                        userLogs.slice(0, 3).map((log) => (
                          <div key={log._id} className="bg-gray-700/50 rounded p-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-white text-xs mb-1 line-clamp-2">{log.content}</p>
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                  <span>{log.agentId?.firstName || 'Unknown'}</span>
                                  <span>{format(new Date(log.createdAt), 'MMM dd, HH:mm')}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setEditingLog(log);
                                  setEditMode(true);
                                  setShowMobileSidebar(false);
                                  setShowUserLogModal(true);
                                }}
                                className="text-blue-400 hover:text-blue-300 p-0.5 ml-2"
                                title="Edit Log"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-400">
                          <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-xs">No logs available</p>
                          <p className="text-xs mt-1 opacity-75">Tap "Add Log" to create</p>
                        </div>
                      )}
                      
                      {/* Show more logs indicator */}
                      {userLogs.length > 3 && (
                        <div className="text-center py-2">
                          <button
                            onClick={() => {
                              setShowMobileSidebar(false);
                              setShowUserLogModal(true);
                            }}
                            className="text-blue-400 hover:text-blue-300 text-xs underline"
                          >
                            View all {userLogs.length} logs
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {mobileSidebarType === 'escort' && selectedChat?.escortId && (
                <div>
                  {/* Escort Profile Image - Compact */}
                  <div className="flex justify-center mb-3">
                    {selectedChat?.escortId?.profileImage ? (
                      <img 
                        src={selectedChat.escortId.profileImage} 
                        alt="Escort Profile" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-pink-500"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white text-lg font-medium border-2 border-pink-500">
                        {selectedChat?.escortId?.firstName?.[0] || '?'}
                      </div>
                    )}
                  </div>

                  {/* Escort Basic Info */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                      <span className="text-xs text-gray-400">Name</span>
                      <span className="text-white text-xs font-medium truncate ml-2">{selectedChat?.escortId?.firstName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                      <span className="text-xs text-gray-400">Gender</span>
                      <span className="text-white text-xs">{selectedChat?.escortId?.gender || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                      <span className="text-xs text-gray-400">Location</span>
                      <span className="text-white text-xs truncate ml-2" title={selectedChat?.escortId?.region ? `${selectedChat.escortId.region}, ${selectedChat.escortId.country}` : selectedChat?.escortId?.country || 'N/A'}>
                        {selectedChat?.escortId?.region ? `${selectedChat.escortId.region}, ${selectedChat.escortId.country}` : selectedChat?.escortId?.country || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                      <span className="text-xs text-gray-400">Profession</span>
                      <span className="text-white text-xs">{selectedChat?.escortId?.profession || 'N/A'}</span>
                    </div>
                    <div className="py-1">
                      <span className="text-xs text-gray-400 block mb-1">Interests</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedChat?.escortId?.interests?.length > 0 ? selectedChat.escortId.interests.map((interest, index) => (
                          <span key={index} className="px-2 py-0.5 bg-pink-500/20 text-pink-300 rounded-full text-xs">
                            {interest}
                          </span>
                        )) : (
                          <span className="text-white text-xs">N/A</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Chat Statistics */}
                  <div className="mt-6 bg-gray-800/50 rounded-lg p-3">
                    <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Chat Stats
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Messages</span>
                        <span className="text-white font-medium">{selectedChat.messages?.length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 flex items-center gap-1">
                          <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                          </svg>
                          In
                        </span>
                        <span className="text-green-400 font-medium">{getMessageCounts().inCount}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 flex items-center gap-1">
                          <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          Out
                        </span>
                        <span className="text-blue-400 font-medium">{getMessageCounts().outCount}</span>
                      </div>
                      
                      <div className="border-t border-gray-600/50 my-2"></div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Started</span>
                        <span className="text-white text-right">
                          {new Date(selectedChat.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Escort Logs Section */}
                  <div className="mt-6 bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white text-sm font-medium flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Escort Logs
                      </h3>
                      {selectedChat?.escortId?._id && (
                        <button
                          onClick={() => {
                            setShowMobileSidebar(false);
                            setShowEscortLogModal(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-pink-600 hover:bg-pink-700 text-white text-xs rounded transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Log
                        </button>
                      )}
                    </div>
                    
                    {/* Display Escort Logs */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {escortLogs.length > 0 ? (
                        escortLogs.slice(0, 3).map((log) => (
                          <div key={log._id} className="bg-gray-700/50 rounded p-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-white text-xs mb-1 line-clamp-2">{log.content}</p>
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                  <span>{log.agentId?.firstName || 'Unknown'}</span>
                                  <span>{format(new Date(log.createdAt), 'MMM dd, HH:mm')}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setEditingLog(log);
                                  setEditMode(true);
                                  setShowMobileSidebar(false);
                                  setShowEscortLogModal(true);
                                }}
                                className="text-pink-400 hover:text-pink-300 p-0.5 ml-2"
                                title="Edit Log"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-400">
                          <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-xs">No logs available</p>
                          <p className="text-xs mt-1 opacity-75">Tap "Add Log" to create</p>
                        </div>
                      )}
                      
                      {/* Show more logs indicator */}
                      {escortLogs.length > 3 && (
                        <div className="text-center py-2">
                          <button
                            onClick={() => {
                              setShowMobileSidebar(false);
                              setShowEscortLogModal(true);
                            }}
                            className="text-pink-400 hover:text-pink-300 text-xs underline"
                          >
                            View all {escortLogs.length} logs
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
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
