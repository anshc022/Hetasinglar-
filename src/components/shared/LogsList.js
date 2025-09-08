import React from 'react';
import { format } from 'date-fns';
import { FaEdit, FaTrash } from 'react-icons/fa';

const LogsList = ({ 
  logs = [], 
  isLoading, 
  title = "Logs", 
  emptyMessage = "No logs available",
  onEditLog = null, // Callback for editing a log
  onDeleteLog = null, // Callback for deleting a log
  canEdit = false, // Whether edit functionality is enabled
  canDelete = false // Whether delete functionality is enabled
}) => {
  // Helper function to format dates
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, HH:mm');
    } catch (error) {
      return dateString || 'Unknown';
    }
  };

  // Group logs by category for better organization
  const groupedLogs = logs.reduce((groups, log) => {
    if (!groups[log.category]) {
      groups[log.category] = [];
    }
    groups[log.category].push(log);
    return groups;
  }, {});

  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {title}
      </h3>

      {isLoading ? (
        <div className="flex justify-center py-3">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-gray-400 text-center py-3 text-xs">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(groupedLogs).map(([category, categoryLogs]) => (
            <div key={category} className="space-y-1.5">
              <h4 className="text-blue-400 text-xs font-medium border-b border-gray-600/50 pb-1">{category}</h4>
              <div className="space-y-1.5">
                {categoryLogs.map((log) => (
                  <div key={log._id} className="bg-gray-700/30 rounded-lg p-2 border border-gray-600/30">
                    <p className="text-white text-xs leading-relaxed whitespace-pre-wrap break-words">{log.content}</p>
                    <div className="flex justify-between items-center mt-2 text-xs">
                      <span className="text-blue-400 font-medium">
                        {log.createdBy?.name || log.createdBy?.type || 'Agent'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">
                          {formatDate(log.createdAt)}
                        </span>
                        <div className="flex items-center gap-1">
                          {canEdit && onEditLog && (
                            <button
                              onClick={() => onEditLog(log)}
                              className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-gray-600/50 transition-colors"
                              title="Edit log"
                            >
                              <FaEdit className="w-3 h-3" />
                            </button>
                          )}
                          {canDelete && onDeleteLog && (
                            <button
                              onClick={() => onDeleteLog(log)}
                              className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-600/50 transition-colors"
                              title="Delete log"
                            >
                              <FaTrash className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LogsList;
