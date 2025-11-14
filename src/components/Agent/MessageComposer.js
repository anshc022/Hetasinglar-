import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import { FaPaperPlane, FaSmile, FaMicrophone, FaStop, FaImages } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { emojiGroups, emojiGroupLabels, filterEmojiGroups } from '../../utils/emojiCollections';

const MessageComposer = memo(({ 
  onSendMessage, 
  isLoading = false, 
  disabled = false,
  placeholder = "Type your message...",
  showEmojiPicker = true,
  showAttachments = true,
  showVoiceNote = false,
  onTyping = null,
  onShowImageSelector = null
}) => {
  // Generate unique instance ID to prevent duplicates
  const instanceId = useRef(Math.random().toString(36).substr(2, 9)).current;
  
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const textareaRef = useRef(null);
  // Removed direct device upload inputs (file/image)
  const recordingIntervalRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const filteredEmojiEntries = useMemo(
    () => filterEmojiGroups(emojiGroups, emojiSearch),
    [emojiSearch]
  );
  const hasEmojiResults = filteredEmojiEntries.length > 0;

  useEffect(() => {
    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  useEffect(() => {
    if (!showEmojis) {
      setEmojiSearch('');
    }
  }, [showEmojis]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const handleSend = async () => {
    const messageToSend = message.trim();
    if (!messageToSend || disabled || isLoading || isRecording) return;

    setMessage('');
    
    if (onSendMessage) {
      await onSendMessage(messageToSend, 'text');
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Typing indicator
    if (onTyping) {
      onTyping(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emoji) => {
    const cursorPosition = textareaRef.current?.selectionStart || message.length;
    const newMessage = 
      message.slice(0, cursorPosition) + 
      emoji + 
      message.slice(cursorPosition);
    
    setMessage(newMessage);
    setShowEmojis(false);
    
    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(cursorPosition + emoji.length, cursorPosition + emoji.length);
    }, 0);
  };

  // Removed handleFileUpload (device uploads disabled)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Here you would implement actual voice recording
    } catch (error) {
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    
    if (recordingTime > 0) {
      // Here you would process the actual recording
      // For now, we'll send a placeholder
      await onSendMessage(`🎤 Voice message (${recordingTime}s)`, 'voice');
    }
    
    setRecordingTime(0);
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-transparent p-0">
      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-400 text-sm font-medium">Recording...</span>
            </div>
            <span className="text-white text-sm font-mono">{formatRecordingTime(recordingTime)}</span>
            <button
              onClick={stopRecording}
              className="ml-auto p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FaStop className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 rounded-lg bg-gray-700 p-3"
          >
            <div className="mb-3 flex items-center gap-2">
              <input
                type="text"
                value={emojiSearch}
                onChange={(event) => setEmojiSearch(event.target.value)}
                placeholder="Search emoji"
                className="flex-1 rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {emojiSearch && (
                <button
                  type="button"
                  onClick={() => setEmojiSearch('')}
                  className="text-xs font-medium text-gray-300 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
              {hasEmojiResults ? (
                filteredEmojiEntries.map(([groupKey, emojis]) => (
                  <div key={groupKey}>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {emojiGroupLabels[groupKey] || groupKey}
                    </p>
                    <div className="grid grid-cols-8 gap-2">
                      {emojis.map((emoji) => (
                        <button
                          key={`${groupKey}-${emoji}`}
                          type="button"
                          onClick={() => handleEmojiClick(emoji)}
                          className="rounded bg-gray-600/60 p-2 text-lg hover:bg-gray-500"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-300">No emoji found</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main composer */}
      <div className="flex items-end gap-3">
        {/* Attachment buttons (device upload removed, keep gallery) */}
        <div className="flex flex-col gap-2">
          {showAttachments && onShowImageSelector && (
            <button
              onClick={() => onShowImageSelector()}
              disabled={disabled || isLoading || isRecording}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              title="Select from gallery"
            >
              <FaImages className="w-4 h-4" />
            </button>
          )}
          {/* Voice note */}
          {showVoiceNote && (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled || isLoading}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                isRecording 
                  ? 'text-red-400 bg-red-900/30 hover:bg-red-900/50' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title={isRecording ? "Stop recording" : "Record voice message"}
            >
              <FaMicrophone className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isLoading || isRecording}
            className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            rows="1"
            style={{ maxHeight: '120px' }}
          />
          
          {/* No word count display anymore */}
          
          {/* Emoji button */}
          {showEmojiPicker && (
            <button
              type="button"
              onClick={() => setShowEmojis(!showEmojis)}
              disabled={disabled || isLoading || isRecording}
              className="absolute bottom-3 right-3 p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              title="Add emoji"
            >
              <FaSmile className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled || isLoading || isRecording}
          className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          title="Send message"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FaPaperPlane className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
});

export default React.memo(MessageComposer);
