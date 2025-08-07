import React from 'react';

const StickyGeneralNotes = ({ notes, isVisible, setIsVisible, onDeleteNote }) => {
  const generalNotes = notes.filter(note => note.isGeneral || note.text.startsWith('[General]'));
  
  // If there are no general notes, don't render anything
  if (generalNotes.length === 0) {
    return null;
  }

  return (
    <div className={`sticky top-0 z-20 transition-all duration-300 ease-in-out ${isVisible ? 'animate-slideDown' : ''}`}>
      <div className="mb-4 p-3 bg-gray-800/95 border border-blue-600/20 rounded-lg shadow-lg backdrop-blur">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-blue-300 font-medium text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            General Notes ({generalNotes.length})
          </h3>
          <button 
            onClick={() => setIsVisible(!isVisible)}
            className="text-blue-300 hover:text-blue-200 p-1 rounded-md transition-colors"
            title={isVisible ? "Collapse notes" : "Expand notes"}
          >
            <svg className={`w-4 h-4 transition-transform duration-300 ${isVisible ? '' : 'transform rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className={`space-y-2 overflow-y-auto transition-all duration-300 ${isVisible ? 'max-h-[150px] animate-fadeIn' : 'max-h-0 overflow-hidden'}`}>
          {generalNotes.map((note, index) => (
            <div key={`general-note-${index}`} className="p-2 bg-blue-900/30 border border-blue-700/30 rounded-lg">
              <p className="text-white text-sm whitespace-pre-wrap">{note.text.startsWith('[General]') ? note.text.substring(9) : note.text}</p>
              <div className="flex justify-between items-center mt-1 text-xs">
                <span className="text-blue-300">{note.agentName || 'Agent'}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">
                    {new Date(note.timestamp).toLocaleString()}
                  </span>
                  {note._id && (
                    <button
                      onClick={() => onDeleteNote(note._id)}
                      className="text-red-400 hover:text-red-300"
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default StickyGeneralNotes;
