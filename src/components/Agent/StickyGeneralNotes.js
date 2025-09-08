import React from 'react';

const StickyGeneralNotes = ({ notes, isVisible, setIsVisible, onDeleteNote }) => {
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
    isVisible: isVisible,
    allNotes: notes.map((n, idx) => ({ 
      index: idx,
      text: n.text?.substring(0, 50) + (n.text?.length > 50 ? '...' : ''), 
      isGeneral: n.isGeneral,
      startsWithGeneral: n.text?.startsWith('[General]'),
      hasText: !!n.text,
      textType: typeof n.text
    })),
    filteredGeneralNotes: generalNotes.map((n, idx) => ({ 
      index: idx,
      text: n.text?.substring(0, 50) + (n.text?.length > 50 ? '...' : ''), 
      isGeneral: n.isGeneral,
      hasText: !!n.text,
      textType: typeof n.text,
      agentName: n.agentName,
      timestamp: n.timestamp
    }))
  });
  
  // Always show the notes container, even if empty, so user can see the section
  return (
    <div className={`transition-all duration-300 ease-in-out ${isVisible ? 'animate-slideDown' : ''}`}>
      <div className="p-2 bg-gray-800/50 border border-gray-700/50 rounded-lg backdrop-blur">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-medium text-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            General Notes 
            <span className={`px-1.5 py-0.5 text-xs rounded-full ${generalNotes.length > 0 ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
              {generalNotes.length}
            </span>
            {!isVisible && generalNotes.length > 0 && (
              <span className="text-xs text-gray-400">- Click to expand</span>
            )}
          </h3>
          <button 
            onClick={() => setIsVisible(!isVisible)}
            className="text-gray-400 hover:text-white p-1 rounded-md transition-colors"
            title={isVisible ? "Collapse notes" : "Expand notes"}
          >
            <svg className={`w-3 h-3 transition-transform duration-300 ${isVisible ? '' : 'transform rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  <div className={`space-y-1.5 overflow-y-auto transition-all duration-300 ${isVisible ? 'max-h-32 animate-fadeIn' : 'max-h-0 overflow-hidden'}`}>
          {generalNotes.length > 0 ? (
            generalNotes.map((note, index) => (
              <div key={`general-note-${index}`} className="p-2 bg-gray-700/30 border border-gray-600/30 rounded-lg">
                <p className="text-white text-xs leading-relaxed whitespace-pre-wrap break-words">{
                  typeof note?.text === 'string'
                    ? (note.text.startsWith('[General]') ? note.text.substring(9).trim() : note.text)
                    : 'No content'
                }</p>
                <div className="flex justify-between items-center mt-1.5 text-xs">
                  <span className="text-blue-400 font-medium">{note.agentName || 'Agent'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">
                      {note.timestamp ? new Date(note.timestamp).toLocaleString() : 'No date'}
                    </span>
                    {note._id && (
                      <button
                        onClick={() => onDeleteNote(note._id)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete note"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-xs text-center py-2 bg-gray-800/30 rounded-lg border border-gray-600/30">
              <svg className="w-5 h-5 mx-auto mb-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              No general notes yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickyGeneralNotes;