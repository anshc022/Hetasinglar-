// Log API methods for agentApi.js
import axios from 'axios';
import config from '../config/environment';

// API URL configuration
const API_URL = config.API_URL;

// Create a dedicated API instance for logs to better debug issues
const logApiInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication
logApiInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('agentToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log(`[LogAPI] Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    return config;
  },
  error => {
    console.error('[LogAPI] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
logApiInstance.interceptors.response.use(
  response => {
    console.log(`[LogAPI] Response from ${response.config.url}:`, response.status);
    return response;
  },
  error => {
    console.error(`[LogAPI] Error response:`, error);
    return Promise.reject(error);
  }
);

// Add an initCheck function to verify API availability
const checkApiEndpoint = async () => {
  try {
    // Use a simple GET request to check if the logs API is available
    const healthCheck = await logApiInstance.get('/logs/health-check', { timeout: 2000 });
    console.log('Log API health check:', healthCheck.status);
    return true;
  } catch (error) {
    // Fall back to checking another endpoint if health check fails
    try {
      console.warn('Log API health check failed, trying alternative check');
      const altCheck = await logApiInstance.get('/api', { timeout: 2000 });
      return altCheck.status === 200 || altCheck.status === 404;
    } catch (altError) {
      console.error('Log API not available:', altError.message);
      return false;
    }
  }
};

// Export log management methods
export const logApiMethods = {
  // Initial API check
  checkApiAvailability: checkApiEndpoint,
  // Get logs for an escort (all chats - for backward compatibility)
  async getEscortLogs(escortId) {
    try {
      console.log(`Fetching logs for escort: ${escortId}`);
      const response = await logApiInstance.get(`/logs/escort/${escortId}`);
      return response.data.logs;
    } catch (error) {
      console.error('Error fetching escort logs:', error);
      throw error.response?.data || { message: 'Failed to fetch escort logs' };
    }
  },

  // Get chat-specific escort logs (NEW - recommended)
  async getChatEscortLogs(chatId) {
    try {
      console.log(`Fetching chat-specific escort logs for chat: ${chatId}`);
      const response = await logApiInstance.get(`/logs/chat/${chatId}/escort-logs`);
      return response.data.logs;
    } catch (error) {
      console.error('Error fetching chat-specific escort logs:', error);
      throw error.response?.data || { message: 'Failed to fetch chat-specific escort logs' };
    }
  },

  // Add a new chat-specific escort log (NEW - recommended)
  async addChatEscortLog(chatId, logData) {
    try {
      if (!chatId) {
        throw new Error('Invalid chat ID: ID cannot be empty');
      }
      
      if (!chatId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error(`Invalid chat ID format: ${chatId}`);
      }
      
      console.log(`Making POST request to: ${API_URL}/logs/chat/${chatId}/escort-logs`);
      console.log('With payload:', logData);
      
      const response = await logApiInstance.post(`/logs/chat/${chatId}/escort-logs`, logData, {
        timeout: 10000,
        headers: {
          'X-Debug-Info': 'Chat-specific escort log creation request'
        }
      });
      
      console.log('Chat-specific log response received:', response.status, response.data);
      return response.data;
    } catch (error) {
      console.error('Error in addChatEscortLog:', error);
      
      if (error.response) {
        console.error(`Status: ${error.response.status}, Data:`, error.response.data);
        
        if (error.response.status === 404) {
          throw new Error('Chat not found or API endpoint not available.');
        } else if (error.response.status === 401) {
          throw new Error('Authentication failed. Please check your token or login again.');
        }
        
        throw new Error(error.response.data?.message || `Server error (${error.response.status})`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw new Error('No response received from server. Please check if the server is running.');
      } else {
        console.error('Error setting up request:', error.message);
        throw new Error(error.message || 'Failed to add chat-specific escort log due to a network issue');
      }
    }
  },

  // Add a new log for an escort (backward compatibility)
  async addEscortLog(escortId, logData) {
    try {
      if (!escortId) {
        throw new Error('Invalid escort ID: ID cannot be empty');
      }
      
      if (!escortId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error(`Invalid escort ID format: ${escortId}`);
      }
      
      console.log(`Making POST request to: ${API_URL}/logs/escort/${escortId}`);
      console.log('With payload:', logData);
      
      // Ensure timeout is long enough
      const response = await logApiInstance.post(`/logs/escort/${escortId}`, logData, {
        timeout: 10000, // 10 seconds timeout
        headers: {
          'X-Debug-Info': 'Escort log creation request'
        }
      });
      
      console.log('Response received:', response.status, response.data);
      return response.data;
    } catch (error) {
      console.error('Error in addEscortLog:', error);
      
      // Enhanced error reporting
      if (error.response) {
        console.error(`Status: ${error.response.status}, Data:`, error.response.data);
        
        // Handle specific status codes
        if (error.response.status === 404) {
          throw new Error('API endpoint not found (404). The logs API might not be properly registered.');
        } else if (error.response.status === 401) {
          throw new Error('Authentication failed. Please check your token or login again.');
        }
        
        throw new Error(error.response.data?.message || `Server error (${error.response.status})`);
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received:', error.request);
        throw new Error('No response received from server. Please check if the server is running.');
      } else {
        // Something else happened while setting up the request
        console.error('Error setting up request:', error.message);
        throw new Error(error.message || 'Failed to add escort log due to a network issue');
      }
    }
  },

  // Get logs for a user
  async getUserLogs(userId) {
    try {
      console.log(`Fetching logs for user: ${userId}`);
      const response = await logApiInstance.get(`/logs/user/${userId}`);
      console.log('User logs response:', response.data);
      return response.data.logs || [];
    } catch (error) {
      console.error('Error fetching user logs:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user logs');
    }
  },

  // Add a new log for a user
  async addUserLog(userId, logData) {
    try {
      console.log(`Adding user log for: ${userId}`, logData);
      const response = await logApiInstance.post(`/logs/user/${userId}`, logData);
      console.log('User log added:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding user log:', error);
      throw new Error(error.response?.data?.message || 'Failed to add user log');
    }
  },

  // Edit an existing escort log
  async editEscortLog(logId, logData) {
    try {
      console.log(`Editing escort log: ${logId}`, logData);
      const response = await logApiInstance.put(`/logs/escort/${logId}`, logData);
      console.log('Escort log edited:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error editing escort log:', error);
      throw new Error(error.response?.data?.message || 'Failed to edit escort log');
    }
  },

  // Delete an escort log
  async deleteEscortLog(logId) {
    try {
      console.log(`Deleting escort log: ${logId}`);
      const response = await logApiInstance.delete(`/logs/escort/${logId}`);
      console.log('Escort log deleted:', response.status);
      return response.data;
    } catch (error) {
      console.error('Error deleting escort log:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete escort log');
    }
  },

  // Delete a user log
  async deleteUserLog(logId) {
    try {
      console.log(`Deleting user log: ${logId}`);
      const response = await logApiInstance.delete(`/logs/user/${logId}`);
      console.log('User log deleted:', response.status);
      return response.data;
    } catch (error) {
      console.error('Error deleting user log:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete user log');
    }
  },

  // Edit an existing user log
  async editUserLog(logId, logData) {
    try {
      console.log(`Editing user log: ${logId}`, logData);
      const response = await logApiInstance.put(`/logs/user/${logId}`, logData);
      console.log('User log edited:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error editing user log:', error);
      throw new Error(error.response?.data?.message || 'Failed to edit user log');
    }
  }
};

export default logApiMethods;
