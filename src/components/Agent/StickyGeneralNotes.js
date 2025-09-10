import React, { useState } from 'react';

const StickyGeneralNotes = ({ notes, isVisible, setIsVisible, onDeleteNote, onAddNote }) => {
  const [newGeneralNote, setNewGeneralNote] = useState('');
  
  // Function to get agent color based on agent name
  const getAgentColor = (agentName) => {
    if (!agentName) return 'bg-blue-500 text-white';
    
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
  
  // More precise filtering for general notes - only explicit general notes
  const generalNotes = notes.filter((note) => {
    if (!note || !note.text) return false;
    
    // Only include notes that are explicitly marked as general
    return (
      note?.isGeneral === true ||  // Explicitly marked as general
      (typeof note?.text === 'string' && note.text.startsWith('[General]')) // Text starts with [General]
    );
  });
  
  // Debug logging to help identify the issue
  console.log('StickyGeneralNotes Debug:', { 
    totalNotes: notes.length, 
    generalNotes: generalNotes.length,
    isVisible: isVisible
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No date';
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getNoteText = (note) => {
    if (typeof note?.text !== 'string') return 'No content';
    return note.text.startsWith('[General]') ? note.text.substring(9).trim() : note.text;
  };
  
  // Always show the notes container, even if empty, so user can see the section
  return (
    <div className={`transition-all duration-300 ease-in-out ${isVisible ? 'animate-slideDown' : ''}`}>
      <div className="p-4 bg-transparent border-2 border-blue-500 rounded-xl shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-base flex items-center gap-3">
            <div className="p-2 bg-transparent border border-blue-500 rounded-lg">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            General Notes 
            <span className={`px-2 py-1 text-sm font-medium rounded-full border ${generalNotes.length > 0 ? 'border-blue-500 text-blue-400' : 'border-gray-600 text-gray-400'}`}>
              {generalNotes.length}
            </span>
          </h3>
          <button 
            onClick={() => setIsVisible(!isVisible)}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-200"
            title={isVisible ? "Collapse notes" : "Expand notes"}
          >
            <svg className={`w-5 h-5 transition-transform duration-300 ${isVisible ? '' : 'transform rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={isVisible 
                  ? "M5 15l7-7 7 7" 
                  : "M19 9l-7 7-7-7"} 
              />
            </svg>
          </button>
        </div>

        {/* Notes Grid + Add box */}
        <div className={`transition-all duration-300 ${isVisible ? 'max-h-[28rem] animate-fadeIn' : 'max-h-0 overflow-hidden'}`}>
          {/* Add General Note Inline */}
          {typeof onAddNote === 'function' && (
            <div className="mb-3 p-3 bg-transparent border border-gray-600 rounded-lg">
              <textarea
                value={newGeneralNote}
                onChange={(e) => setNewGeneralNote(e.target.value)}
                placeholder="Add a general note about this chat..."
                className="w-full p-2 bg-transparent text-white rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 text-sm resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    if (newGeneralNote.trim()) {
                      onAddNote(newGeneralNote);
                      setNewGeneralNote('');
                    }
                  }
                }}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setNewGeneralNote('')}
                  className="px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-700/50 rounded"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (newGeneralNote.trim()) {
                      onAddNote(newGeneralNote);
                      setNewGeneralNote('');
                    }
                  }}
                  className="px-3 py-1 text-xs bg-transparent border border-blue-500 text-blue-400 rounded hover:bg-blue-500/10"
                >
                  Add Note
                </button>
              </div>
            </div>
          )}
          {generalNotes.length > 0 ? (
            <div className="space-y-3 overflow-y-auto max-h-80">
              {generalNotes.map((note, index) => (
                <div 
                  key={`general-note-${index}`} 
                  className="group relative p-3 bg-transparent border border-gray-600 rounded-lg hover:border-blue-500 transition-all duration-200 hover:shadow-lg"
                >
                  {/* Note Content */}
                  <div className="mb-3">
                    <p className="text-white text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {getNoteText(note)}
                    </p>
                  </div>

                  {/* Note Meta Information */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getAgentColor(note.agentName || 'Agent')}`}>
                          {note.agentName || 'Agent'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-gray-400 flex flex-col items-end">
                        <span>{formatDate(note.timestamp)}</span>
                        <span className="text-xs opacity-75">{formatTime(note.timestamp)}</span>
                      </div>
                      
                      {note._id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNote(note._id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 rounded transition-all duration-200 hover:bg-red-900/20"
                          title="Delete note"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-transparent rounded-lg border border-gray-600">
              <div className="mb-3">
                <svg className="w-12 h-12 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm font-medium mb-1">No general notes yet</p>
              <p className="text-gray-500 text-xs">Start adding notes to see them here</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {isVisible && generalNotes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-600">
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>Total: {generalNotes.length} note{generalNotes.length !== 1 ? 's' : ''}</span>
              <span>Last updated: {formatDate(generalNotes[0]?.timestamp)}</span>
            </div>
          </div>
        )}
      </div>
        </div>
  );
};

export default StickyGeneralNotes;