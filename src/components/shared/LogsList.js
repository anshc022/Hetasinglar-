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
    const rawCategory = typeof log?.category === 'string' ? log.category.trim() : '';
    const categoryKey = rawCategory || log?.categoryPreset || 'Uncategorized';

    if (!groups[categoryKey]) {
      groups[categoryKey] = [];
    }

    groups[categoryKey].push(log);
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
          {Object.entries(groupedLogs).map(([categoryKey, categoryLogs]) => {
            const displayCategory = categoryKey || 'Uncategorized';

            return (
              <div key={displayCategory} className="space-y-1.5">
                <h4 className="text-blue-300 text-xs font-semibold border-b border-gray-600/50 pb-1 uppercase tracking-wide">
                  {displayCategory}
                </h4>
                <div className="space-y-1.5">
                  {categoryLogs.map((log) => (
                    <div key={log._id} className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-200 text-[11px] font-semibold rounded-full uppercase tracking-wide">
                          {typeof log?.category === 'string' && log.category.trim() ? log.category : (log?.categoryPreset || 'Uncategorized')}
                        </span>
                        <div className="flex items-center gap-2">
                          {canEdit && onEditLog && (
                            <button
                              onClick={() => onEditLog(log)}
                              className="text-blue-300 hover:text-blue-200 p-1.5 rounded-full hover:bg-gray-600/60 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                              title="Edit log"
                              aria-label="Edit log"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && onDeleteLog && (
                            <button
                              onClick={() => onDeleteLog(log)}
                              className="text-red-300 hover:text-red-200 p-1.5 rounded-full hover:bg-gray-600/60 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400/60"
                              title="Delete log"
                              aria-label="Delete log"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-white text-xs leading-relaxed whitespace-pre-wrap break-words">
                        {log.content}
                      </p>
                      <div className="flex justify-between items-center mt-3 text-[11px] text-gray-400">
                        <span className="text-blue-200 font-medium">
                          {log.createdBy?.name || log.createdBy?.type || 'Agent'}
                        </span>
                        <span>
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LogsList;
