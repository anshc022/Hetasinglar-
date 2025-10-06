import axios from 'axios';
import config from '../config/environment';

// Use environment-based API URL
const API_URL = config.API_URL;

console.log('🌐 API Configuration:', {
  API_URL,
  Environment: config.NODE_ENV,
  IsProduction: config.isProduction()
});

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      throw new Error('No token available to refresh');
    }

    const response = await axios.post(`${API_URL}/auth/refresh-token`, {
      token: currentToken
    });

    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    
    onTokenRefreshed(access_token);
    isRefreshing = false;
    
    return access_token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    isRefreshing = false;
    auth.logout(); // Force logout if token refresh fails
    window.location.href = '/login?expired=true'; // Redirect to login with expired flag
    throw error;
  }
};

// Add auth token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors, particularly for token expiration
api.interceptors.response.use(
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

export const auth = {
  async register(userData) {
    try {
      const registrationData = {
        username: userData.username.toLowerCase(),
        email: userData.email.toLowerCase(),
        password: userData.password,
        full_name: userData.full_name
      };

      // Add referral code if provided
      if (userData.referral_code && userData.referral_code.trim()) {
        registrationData.referral_code = userData.referral_code.trim();
      }

      // Add optional fields if they exist
      if (userData.dateOfBirth) {
        registrationData.dateOfBirth = userData.dateOfBirth;
      }
      if (userData.sex) {
        registrationData.sex = userData.sex;
      }

      const response = await api.post('/auth/register', registrationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async login(username, password) {
    try {
      const response = await api.post('/auth/login', { 
        username: username.toLowerCase(), 
        password 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async verifyOtp(data) {
    try {
      const response = await api.post('/auth/verify-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async resendOtp(data) {
    try {
      const response = await api.post('/auth/resend-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
  },

  // Track affiliate link clicks
  async trackAffiliateClick(affiliateCode) {
    try {
      const response = await api.post('/affiliate/track-click', {
        affiliateCode
      });
      return response.data;
    } catch (error) {
      // Don't throw error for tracking - just log it
      console.error('Affiliate click tracking error:', error);
      return null;
    }
  }
};

export const escorts = {
  async getEscortProfiles(options = {}) {
    try {
      const { full = true, params = {} } = options;
      const searchParams = new URLSearchParams({ ...(full ? { full: 'true' } : {}), ...params });
      const url = `/agents/escorts/active${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getEscortProfile(id) {
    try {
      const response = await api.get(`/escorts/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export const chats = {
  async getChats() {
    try {
      const response = await api.get('/chats/user');
      console.log('Fetched user chats:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get chats error:', error);
      throw error.response?.data || { message: 'Failed to fetch chats' };
    }
  },

  async getEscortChat(escortId) {
    try {
      const response = await api.get(`/chats/user/escort/${escortId}`);
      return response.data;
    } catch (error) {
      console.error('Get escort chat error:', error);
      throw error.response?.data || { message: 'Failed to fetch chat' };
    }
  },

  async sendMessage(chatId, message, options = {}) {
    try {
      console.log('Sending message to chat:', chatId, message);
      
      const response = await api.post(`/chats/${chatId}/message`, { 
        message: message,
        ...(options.clientId ? { clientId: options.clientId } : {})
      });
      
      console.log('Message sent response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Send message error:', error);
      throw error.response?.data || { message: 'Failed to send message' };
    }
  },

  async startChat(escortId) {
    try {
      console.log('Starting chat with escort:', escortId);
      const response = await api.post('/chats/start', { escortId });
      console.log('Chat started:', response.data);
      return response.data;
    } catch (error) {
      console.error('Start chat error:', error);
      throw error.response?.data || { message: 'Failed to start chat' };
    }
  },

  async markMessagesAsRead(chatId) {
    try {
      const response = await api.post(`/chats/${chatId}/mark-read`);
      return response.data;
    } catch (error) {
      console.error('Mark messages read error:', error);
      throw error.response?.data || { message: 'Failed to mark messages as read' };
    }
  },

  async editMessage(chatId, messageId, message) {
    try {
      console.log('Editing message:', chatId, messageId, message);
      const response = await api.put(`/chats/${chatId}/message/${messageId}`, { message });
      console.log('Message edited:', response.data);
      return response.data;
    } catch (error) {
      console.error('Edit message error:', error);
      throw error.response?.data || { message: 'Failed to edit message' };
    }
  },

  async deleteMessage(chatId, messageId) {
    try {
      console.log('Deleting message:', chatId, messageId);
      const response = await api.delete(`/chats/${chatId}/message/${messageId}`);
      console.log('Message deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('Delete message error:', error);
      throw error.response?.data || { message: 'Failed to delete message' };
    }
  }
};

// Individual function exports for convenience
export const verifyOtp = auth.verifyOtp;
export const resendOtp = auth.resendOtp;

export default api;
