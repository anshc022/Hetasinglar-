import React from 'react';
import { format } from 'date-fns';
import { FaEdit } from 'react-icons/fa';

const LogsList = ({ 
  logs = [], 
  isLoading, 
  title = "Logs", 
  emptyMessage = "No logs available",
  onEditLog = null, // Callback for editing a log
  canEdit = false // Whether edit functionality is enabled
}) => {
  // Helper function to format dates
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'PPpp');
    } catch (error) {
      return dateString || 'Unknown date';
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
    <div className="bg-gray-800/50 rounded-lg p-4 mt-4">
      <h3 className="text-white text-lg font-semibold mb-3">{title}</h3>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-gray-400 text-center py-4">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedLogs).map(([category, categoryLogs]) => (
            <div key={category} className="bg-gray-700/50 rounded-lg p-3">
              <h4 className="text-blue-300 text-md font-medium mb-2">{category}</h4>
              <div className="space-y-3">
                {categoryLogs.map((log) => (
                  <div key={log._id} className="bg-gray-700 rounded-lg p-3">
                    <p className="text-white whitespace-pre-wrap break-words">{log.content}</p>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                      <span>
                        By: {log.createdBy?.type || 'Agent'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>
                          {formatDate(log.createdAt)}
                        </span>
                        {canEdit && onEditLog && (
                          <button
                            onClick={() => onEditLog(log)}
                            className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-gray-600 transition-colors"
                            title="Edit log"
                          >
                            <FaEdit className="w-3 h-3" />
                          </button>
                        )}
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
