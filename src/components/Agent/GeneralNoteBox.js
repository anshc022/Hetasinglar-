import React, { useState } from 'react';

const GeneralNoteBox = ({ onAddNote, value, onChange }) => {
  const [expanded, setExpanded] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onAddNote();
      setExpanded(false);
    }
  };
    return (
    <div className="bg-gray-800/30 rounded-lg border border-gray-700/50 transition-all duration-300 ease-in-out overflow-hidden mb-2">
      {!expanded ? (
        <button 
          onClick={() => setExpanded(true)}
          className="w-full py-2 px-3 text-gray-400 hover:text-white flex items-center gap-2 justify-center border border-dashed border-gray-600/50 rounded-lg transition-colors duration-200 text-sm"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add general note (appears at top of chat)
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-2 animate-fadeIn">          <textarea
            value={value}
            onChange={onChange}
            placeholder="Add a general note about this customer or conversation..."
            className="w-full p-2 bg-gray-800/50 text-white rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 text-sm border border-gray-600/50"
            rows="2"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                handleSubmit(e);
              }
              if (e.key === 'Escape') {
                setExpanded(false);
              }
            }}
          />          <div className="flex justify-between gap-2 mt-2">
            <div className="text-xs text-gray-400">
              Ctrl+Enter to save
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Note
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default GeneralNoteBox;
