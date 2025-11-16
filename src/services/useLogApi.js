import { useState, useEffect, useCallback } from 'react';
import { logApiMethods } from './logApiMethods';

/**
 * Custom hook for managing logs API interactions
 * This hook provides a simple interface for working with escort and user logs
 */
export const useLogApi = () => {
  const [isApiAvailable, setIsApiAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Check API availability on mount
  useEffect(() => {
    const checkApi = async () => {
      try {
        const available = await logApiMethods.checkApiAvailability();
        setIsApiAvailable(available);
        if (!available) {
          console.warn('Logs API is not available');
        }
      } catch (err) {
        console.error('Error checking API availability:', err);
        setIsApiAvailable(false);
      }
    };
    
    checkApi();
  }, []);
  
  // Fetch escort logs (all chats - backward compatibility)
  const getEscortLogs = useCallback(async (escortId) => {
    if (!isApiAvailable) {
      return [];
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const logs = await logApiMethods.getEscortLogs(escortId);
      setIsLoading(false);
      return logs || [];
    } catch (err) {
      console.error('Error fetching escort logs:', err);
      setError(err.message || 'Failed to fetch escort logs');
      setIsLoading(false);
      return [];
    }
  }, [isApiAvailable]);

  // Fetch chat-specific escort logs (NEW - recommended)
  const getChatEscortLogs = useCallback(async (chatId) => {
    if (!isApiAvailable) {
      return [];
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const logs = await logApiMethods.getChatEscortLogs(chatId);
      setIsLoading(false);
      return logs || [];
    } catch (err) {
      console.error('Error fetching chat-specific escort logs:', err);
      setError(err.message || 'Failed to fetch chat-specific escort logs');
      setIsLoading(false);
      return [];
    }
  }, [isApiAvailable]);
  
  // Add chat-specific escort log (NEW - recommended)
  const addChatEscortLog = useCallback(async (chatId, logData) => {
    if (!isApiAvailable) {
      throw new Error('Logs API is not available');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await logApiMethods.addChatEscortLog(chatId, logData);
      setIsLoading(false);
      return result;
    } catch (err) {
      console.error('Error adding chat-specific escort log:', err);
      setError(err.message || 'Failed to add chat-specific escort log');
      setIsLoading(false);
      throw err;
    }
  }, [isApiAvailable]);

  // Add escort log (backward compatibility)
  const addEscortLog = useCallback(async (escortId, logData) => {
    if (!isApiAvailable) {
      throw new Error('Logs API is not available');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await logApiMethods.addEscortLog(escortId, logData);
      setIsLoading(false);
      return result;
    } catch (err) {
      console.error('Error adding escort log:', err);
      setError(err.message || 'Failed to add escort log');
      setIsLoading(false);
      throw err;
    }
  }, [isApiAvailable]);
  
  // Delete escort log
  const deleteEscortLog = useCallback(async (logId) => {
    if (!isApiAvailable) {
      throw new Error('Logs API is not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await logApiMethods.deleteEscortLog(logId);
      setIsLoading(false);
      return result;
    } catch (err) {
      console.error('Error deleting escort log:', err);
      setError(err.message || 'Failed to delete escort log');
      setIsLoading(false);
      throw err;
    }
  }, [isApiAvailable]);

  // Delete user log
  const deleteUserLog = useCallback(async (logId) => {
    if (!isApiAvailable) {
      throw new Error('Logs API is not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await logApiMethods.deleteUserLog(logId);
      setIsLoading(false);
      return result;
    } catch (err) {
      console.error('Error deleting user log:', err);
      setError(err.message || 'Failed to delete user log');
      setIsLoading(false);
      throw err;
    }
  }, [isApiAvailable]);

  // Edit escort log
  const editEscortLog = useCallback(async (logId, logData) => {
    if (!isApiAvailable) {
      throw new Error('Log API is not available');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await logApiMethods.editEscortLog(logId, logData);
      setIsLoading(false);
      return result;
    } catch (err) {
      console.error('Error editing escort log:', err);
      setError(err.message || 'Failed to edit escort log');
      setIsLoading(false);
      throw err;
    }
  }, [isApiAvailable]);
  
  // Fetch user logs
  const getUserLogs = useCallback(async (userId) => {
    if (!isApiAvailable) {
      return [];
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const logs = await logApiMethods.getUserLogs(userId);
      setIsLoading(false);
      return logs || [];
    } catch (err) {
      console.error('Error fetching user logs:', err);
      setError(err.message || 'Failed to fetch user logs');
      setIsLoading(false);
      return [];
    }
  }, [isApiAvailable]);
  
  // Add user log
  const addUserLog = useCallback(async (userId, logData) => {
    if (!isApiAvailable) {
      throw new Error('Logs API is not available');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await logApiMethods.addUserLog(userId, logData);
      setIsLoading(false);
      return result;
    } catch (err) {
      console.error('Error adding user log:', err);
      setError(err.message || 'Failed to add user log');
      setIsLoading(false);
      throw err;
    }
  }, [isApiAvailable]);

  // Edit user log
  const editUserLog = useCallback(async (logId, logData) => {
    if (!isApiAvailable) {
      throw new Error('Log API is not available');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await logApiMethods.editUserLog(logId, logData);
      setIsLoading(false);
      return result;
    } catch (err) {
      console.error('Error editing user log:', err);
      setError(err.message || 'Failed to edit user log');
      setIsLoading(false);
      throw err;
    }
  }, [isApiAvailable]);
  
  return {
    isApiAvailable,
    isLoading,
    error,
    getEscortLogs,
    getChatEscortLogs,
    addEscortLog,
    addChatEscortLog,
    deleteEscortLog,
    deleteUserLog,
    editEscortLog,
    getUserLogs,
    addUserLog,
    editUserLog
  };
};
