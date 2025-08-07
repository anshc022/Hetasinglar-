import axios from 'axios';
import config from '../config/environment';

const API_URL = config.API_URL;

// Track if we are currently refreshing a token
let isRefreshing = false;
let refreshSubscribers = [];

// Function to subscribe failed requests for retry after token refresh
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Function to execute all pending requests after token refresh
const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Function to refresh auth token
const refreshAuthToken = async () => {
  // Prevent multiple simultaneous refresh requests
  if (isRefreshing) {
    return new Promise(resolve => {
      subscribeTokenRefresh(token => {
        resolve(token);
      });
    });
  }

  isRefreshing = true;

  try {
    const currentToken = localStorage.getItem('agentToken');
    if (!currentToken) {
      throw new Error('No token available to refresh');
    }

    const response = await axios.post(`${API_URL}/auth/refresh-token`, {
      token: currentToken
    });

    const { access_token } = response.data;
    localStorage.setItem('agentToken', access_token);
    
    onTokenRefreshed(access_token);
    isRefreshing = false;
    
    return access_token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    isRefreshing = false;
    agentAuth.logout(); // Force logout if token refresh fails
    window.location.href = '/agent/login?expired=true'; // Redirect to login with expired flag
    throw error;
  }
};

const agentApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

agentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('agentToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`Request to ${config.url} with auth: Bearer ${token.substring(0, 15)}...`);
  } else {
    console.warn(`Request to ${config.url} has no auth token!`);
  }
  return config;
});

// Handle response errors, particularly for token expiration
agentApi.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // If error is due to token expiration and we haven't attempted refresh yet
    if (error.response?.status === 401 && 
        error.response?.data?.code === 'TOKEN_EXPIRED' && 
        !originalRequest._retry) {
      
      originalRequest._retry = true;
      
      try {
        const token = await refreshAuthToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    // For other errors, just reject the promise
    return Promise.reject(error);
  }
);

export const agentAuth = {
  async login(agentId, password) {
    try {
      console.log('Login attempt:', { agentId });
      const response = await agentApi.post('/agents/login', { agentId, password });
      if (response.data.access_token) {
        localStorage.setItem('agentToken', response.data.access_token);
        localStorage.setItem('agent', JSON.stringify(response.data.agent));
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  async getDashboardStats() {
    try {
      const response = await agentApi.get('/agents/dashboard');
      return response.data;
    } catch (error) {
      console.error('Dashboard error:', error);
      throw error.response?.data || error;
    }
  },

  async getLiveQueue(escortId, chatId) {
    try {
      let url = '/chats/live-queue';
      if (escortId) {
        url = `/chats/live-queue/${escortId}`;
        if (chatId) {
          url += `/${chatId}`;
        }
      }
      const response = await agentApi.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async makeFirstContact(chatId, message) {
    try {
      console.log('Making first contact:', { chatId, message }); // Debug log
      const response = await agentApi.post(`/chats/${chatId}/first-contact`, { 
        message: message 
      });
      return response.data;
    } catch (error) {
      console.error('First contact error:', error);
      throw error.response?.data || { 
        message: 'Failed to make first contact'
      };
    }
  },

  async unassignChat(chatId) {
    try {
      const response = await agentApi.post(`/agents/chats/${chatId}/unassign`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  async pushBackChat(chatId, hours) {
    try {
      const response = await agentApi.post(`/chats/push-back/${chatId}`, { hours });
      return response.data;
    } catch (error) {
      console.error('Push back error:', error);
      throw error.response?.data || error;
    }
  },

  async assignChat(chatId, agentId) {
    try {
      const response = await agentApi.post(`/agents/chats/${chatId}/assign`, { agentId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async addReminder(reminder) {
    try {
      const response = await agentApi.post('/agents/reminders', reminder);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getEscortProfile(id) {
    try {
      const response = await agentApi.get(`/agents/escorts/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async createEscortProfile(profileData) {
    try {
      const response = await agentApi.post('/agents/escorts', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async updateEscortProfile(escortId, profileData) {
    try {
      const response = await agentApi.put(`/agents/escorts/${escortId}`, profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getMyEscorts() {
    try {
      const response = await agentApi.get('/agents/my-escorts');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async updateChatInfo(chatId, updates) {
    try {
      console.log('Updating chat:', chatId, updates); // Debug log
      const response = await agentApi.patch(`/agents/chats/${chatId}/info`, updates);
      return response.data;
    } catch (error) {
      console.error('Update chat error:', error);
      throw error.response?.data || error;
    }
  },

  async getChat(chatId) {
    try {
      const response = await agentApi.get(`/chats/${chatId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async markMessagesAsRead(chatId) {
    try {
      const response = await agentApi.post(`/chats/${chatId}/mark-read`);
      return response.data;
    } catch (error) {
      console.error('Mark messages read error:', error);
      throw error.response?.data || error;
    }
  },

  async getProfile() {
    try {
      const response = await agentApi.get('/agents/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error.response?.data || error;
    }
  },

  async markReminderComplete(reminderId) {
    try {
      const response = await agentApi.post(`/agents/reminders/${reminderId}/complete`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async refreshToken() {
    try {
      return await refreshAuthToken();
    } catch (error) {
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('agentToken');
    localStorage.removeItem('agent');
  },

  async addChatNote(chatId, text) {
    try {
      const response = await agentApi.post(`/chats/${chatId}/notes`, { text });
      return response.data;
    } catch (error) {
      console.error('Add chat note error:', error);
      throw error.response?.data || error;
    }
  },
  
  async getChatNotes(chatId) {
    try {
      const response = await agentApi.get(`/chats/${chatId}/notes`);
      return response.data;
    } catch (error) {
      console.error('Get chat notes error:', error);
      throw error.response?.data || error;
    }
  },

  async addMessageNote(chatId, messageIndex, text) {
    try {
      const response = await agentApi.post(`/chats/${chatId}/messages/${messageIndex}/note`, { text });
      return response.data;
    } catch (error) {
      console.error('Add message note error:', error);
      throw error.response?.data || error;
    }
  },

  async deleteChatNote(chatId, noteId) {
    try {
      const response = await agentApi.delete(`/chats/${chatId}/notes/${noteId}`);
      return response.data;
    } catch (error) {
      console.error('Delete chat note error:', error);
      throw error.response?.data || error;
    }
  },

  async deleteMessageNote(chatId, messageIndex) {
    try {
      const response = await agentApi.delete(`/chats/${chatId}/messages/${messageIndex}/note`);
      return response.data;
    } catch (error) {
      console.error('Delete message note error:', error);
      throw error.response?.data || error;
    }
  },

  async getChatStatistics(params = {}) {
    try {
      // Get the agent ID from localStorage if not provided in params
      if (!params.agentId) {
        const agent = JSON.parse(localStorage.getItem('agent') || '{}');
        // Handle both old and new agent data structures
        const agentId = agent._id || agent.id;
        if (!agentId) {
          throw new Error('No agent ID available');
        }
        params.agentId = agentId;
      }

      // Ensure dateRange is set if no specific dates provided
      if (!params.startDate && !params.endDate && !params.dateRange) {
        params.dateRange = 'last7days';
      }

      const queryString = new URLSearchParams(params).toString();
      
      const response = await agentApi.get(`/chats/detailed-stats${queryString ? `?${queryString}` : ''}`);
      
      return response.data;
    } catch (error) {
      console.error('Get chat statistics error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Please log in again to view chat statistics.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to view these statistics.');
      } else if (error.response?.status === 404) {
        throw new Error('Could not find agent information.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid request parameters.');
      } else if (error.message === 'No agent ID available') {
        throw new Error('Agent information not found. Please log in again.');
      }
      
      throw new Error(error.response?.data?.message || 'Failed to fetch chat statistics.');
    }
  },

  async exportChatStatistics(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await agentApi.get(`/chats/export-stats${queryString ? `?${queryString}` : ''}`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Export chat statistics error:', error);
      throw error.response?.data || error;
    }
  },

  // File upload methods for MessageComposer
  async uploadFile(chatId, file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await agentApi.post(`/chats/${chatId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('File upload error:', error);
      throw error.response?.data || error;
    }
  },

  async uploadVoiceMessage(chatId, audioBlob, duration) {
    try {
      const formData = new FormData();
      formData.append('voice', audioBlob, 'voice-message.webm');
      if (duration) {
        formData.append('duration', duration.toString());
      }
      
      const response = await agentApi.post(`/chats/${chatId}/voice`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Voice upload error:', error);
      throw error.response?.data || error;
    }
  },

  // Affiliate API methods
  async getAffiliateDashboard(agentId) {
    try {
      const response = await agentApi.get(`/affiliate/dashboard/${agentId}`);
      return response.data;
    } catch (error) {
      console.error('Affiliate dashboard error:', error);
      throw error.response?.data || error;
    }
  },

  async getAffiliateCommissionStats(agentId, params = {}) {
    try {
      const response = await agentApi.get(`/affiliate/commission-stats/${agentId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Affiliate commission stats error:', error);
      throw error.response?.data || error;
    }
  },

  async getAffiliateCustomers(agentId, params = {}) {
    try {
      const response = await agentApi.get(`/affiliate/customers/${agentId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Affiliate customers error:', error);
      throw error.response?.data || error;
    }
  },

  async getAffiliateCustomerDetails(customerId, agentId) {
    try {
      const response = await agentApi.get(`/affiliate/customer/${customerId}/details`, {
        params: { agentId }
      });
      return response.data;
    } catch (error) {
      console.error('Affiliate customer details error:', error);
      throw error.response?.data || error;
    }
  },

  // First Contact API methods
  async getNewCustomers(params = {}) {
    try {
      const response = await agentApi.get('/first-contact/new-customers', { params });
      return response.data;
    } catch (error) {
      console.error('Get new customers error:', error);
      throw error.response?.data || error;
    }
  },

  async getAvailableEscorts(params = {}) {
    try {
      const response = await agentApi.get('/first-contact/available-escorts', { params });
      return response.data;
    } catch (error) {
      console.error('Get available escorts error:', error);
      throw error.response?.data || error;
    }
  },

  async createFirstContact(data) {
    try {
      const response = await agentApi.post('/first-contact/create-contact', data);
      return response.data;
    } catch (error) {
      console.error('Create first contact error:', error);
      throw error.response?.data || error;
    }
  },

  async getDomains() {
    try {
      const response = await agentApi.get('/first-contact/domains');
      return response.data;
    } catch (error) {
      console.error('Get domains error:', error);
      throw error.response?.data || error;
    }
  },

  async getRecentContacts(params = {}) {
    try {
      const response = await agentApi.get('/first-contact/recent-contacts', { params });
      return response.data;
    } catch (error) {
      console.error('Get recent contacts error:', error);
      throw error.response?.data || error;
    }
  },

  async getFirstContactStats(params = {}) {
    try {
      const response = await agentApi.get('/first-contact/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Get first contact stats error:', error);
      throw error.response?.data || error;
    }
  },

  // Edit message
  editMessage: async (chatId, messageId, message) => {
    try {
      const response = await agentApi.put(`/chats/${chatId}/message/${messageId}`, { message });
      return response.data;
    } catch (error) {
      console.error('Edit message error:', error);
      throw error.response?.data || error;
    }
  },

  // Delete message
  deleteMessage: async (chatId, messageId) => {
    try {
      const response = await agentApi.delete(`/chats/${chatId}/message/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Delete message error:', error);
      throw error.response?.data || error;
    }
  },

  // Panic Room methods
  async moveToPanicRoom(chatId, reason, notes) {
    try {
      const response = await agentApi.post(`/agents/chats/${chatId}/panic-room`, { reason, notes });
      return response.data;
    } catch (error) {
      console.error('Move to panic room error:', error);
      throw error.response?.data || error;
    }
  },

  async removeFromPanicRoom(chatId, notes) {
    try {
      const response = await agentApi.post(`/agents/chats/${chatId}/remove-panic-room`, { notes });
      return response.data;
    } catch (error) {
      console.error('Remove from panic room error:', error);
      throw error.response?.data || error;
    }
  },

  async getPanicRoomChats() {
    try {
      const response = await agentApi.get('/agents/chats/panic-room');
      return response.data;
    } catch (error) {
      console.error('Get panic room chats error:', error);
      throw error.response?.data || error;
    }
  },

  async addPanicRoomNote(chatId, text) {
    try {
      const response = await agentApi.post(`/agents/chats/${chatId}/panic-room/notes`, { text });
      return response.data;
    } catch (error) {
      console.error('Add panic room note error:', error);
      throw error.response?.data || error;
    }
  },

  // Image management methods
  async uploadImages(images) {
    try {
      const response = await agentApi.post('/agents/images/upload', { images });
      return response.data;
    } catch (error) {
      console.error('Upload images error:', error);
      throw error.response?.data || error;
    }
  },

  async getImages(escortProfileId = null) {
    try {
      const url = escortProfileId 
        ? `/agents/images?escortProfileId=${escortProfileId}`
        : '/agents/images';
      const response = await agentApi.get(url);
      return response.data;
    } catch (error) {
      console.error('Get images error:', error);
      throw error.response?.data || error;
    }
  },

  async deleteImage(imageId) {
    try {
      const response = await agentApi.delete(`/agents/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error('Delete image error:', error);
      throw error.response?.data || error;
    }
  },

  async updateImage(imageId, data) {
    try {
      const response = await agentApi.put(`/agents/images/${imageId}`, data);
      return response.data;
    } catch (error) {
      console.error('Update image error:', error);
      throw error.response?.data || error;
    }
  },

  // Generic DELETE method for API calls
  async delete(endpoint) {
    try {
      const response = await agentApi.delete(endpoint);
      return response.data;
    } catch (error) {
      console.error(`DELETE ${endpoint} error:`, error);
      throw error.response?.data || error;
    }
  },

  // Get assigned customers for an agent
  async getAssignedCustomers(agentId) {
    try {
      console.log('Requesting assigned customers for agent ID:', agentId);
      const response = await agentApi.get(`/agents/agent-customers/${agentId}`);
      console.log('Raw response from server:', response);
      return response.data || response; // Handle different response structures
    } catch (error) {
      console.error('Get assigned customers error:', error);
      throw error;
    }
  },
};

// Create agentAffiliate object with affiliate-related methods
export const agentAffiliate = {
  async createAffiliateLink() {
    try {
      const response = await agentApi.post('/affiliate/create-link');
      return response.data;
    } catch (error) {
      console.error('Create affiliate link error:', error);
      throw error.response?.data || error;
    }
  },
  async getMyAffiliateLink() {
    try {
      const response = await agentApi.get('/affiliate/my-link');
      return response.data;
    } catch (error) {
      console.error('Get affiliate link error:', error);
      throw error.response?.data || error;
    }
  },
  async getAffiliateReferrals() {
    try {
      const response = await agentApi.get('/affiliate/referrals');
      return response.data;
    } catch (error) {
      console.error('Get affiliate referrals error:', error);
      throw error.response?.data || error;
    }
  },
  async getAffiliateStats() {
    try {
      const response = await agentApi.get('/affiliate/stats');
      return response.data;
    } catch (error) {
      console.error('Get affiliate stats error:', error);
      throw error.response?.data || error;
    }
  },
  async revokeAffiliateLink() {
    try {
      const response = await agentApi.post('/affiliate/revoke');
      return response.data;
    } catch (error) {
      console.error('Revoke affiliate link error:', error);
      throw error.response?.data || error;
    }
  },
  async regenerateAffiliateLink() {
    try {
      const response = await agentApi.post('/affiliate/regenerate');
      return response.data;
    } catch (error) {
      console.error('Regenerate affiliate link error:', error);
      throw error.response?.data || error;
    }
  }
};

// Export named exports for compatibility
export { agentApi };
// Export both the agentAuth object and the agentApi instance  
export default agentApi;
