import axios from 'axios';
import config from '../config/environment';

const API_URL = config.API_URL;

const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminAuth = {
  async login(credentials) {
    try {
      const response = await adminApi.post('/admin/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  async getDashboardStats() {
    try {
      const [basicStats, subscriptionStats] = await Promise.all([
        adminApi.get('/admin/dashboard'),
        adminApi.get('/admin/subscription-stats') // Corrected path
      ]);

      return {
        ...basicStats.data,
        subscriptionStats: subscriptionStats.data
      };
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch dashboard data' };
    }
  },

  async getAgents() {
    try {
      const response = await adminApi.get('/admin/agents');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch agents' };
    }
  },

  async createAgent(agentData) {
    try {
      const response = await adminApi.post('/admin/agents', agentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create agent' };
    }
  },

  async updateAgent(id, agentData) {
    try {
      const response = await adminApi.put(`/admin/agents/${id}`, agentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update agent' };
    }
  },

  async deleteAgent(id) {
    try {
      const response = await adminApi.delete(`/admin/agents/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete agent' };
    }
  },

  async updateAgentPermissions(agentId, permissions) {
    try {
      const response = await adminApi.patch(`/admin/agents/${agentId}/permissions`, permissions);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update permissions' };
    }
  },

  async getSubscriptionStats() {
    try {
      const response = await adminApi.get('/admin/subscription-stats'); // Corrected path
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch subscription stats' };
    }
  },

  async getSubscriptionPlans() {
    try {
      const response = await adminApi.get('/admin/subscription-plans');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch subscription plans' };
    }
  },

  async createSubscriptionPlan(planData) {
    try {
      const response = await adminApi.post('/admin/subscription-plans', planData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create subscription plan' };
    }
  },

  async updateSubscriptionPlan(planId, planData) {
    try {
      const response = await adminApi.put(`/admin/subscription-plans/${planId}`, planData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update subscription plan' };
    }
  },

  async deleteSubscriptionPlan(planId) {
    try {
      await adminApi.delete(`/admin/subscription-plans/${planId}`);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete subscription plan' };
    }  },

  async getProfile() {
    try {
      const response = await adminApi.get('/admin/profile');
      return response.data;
    } catch (error) {
      // If profile endpoint doesn't exist, return basic info from token
      const token = localStorage.getItem('adminToken');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return {
            id: payload.adminId,
            adminId: 'admin',
            name: 'Administrator',
            role: 'admin'
          };
        } catch (e) {
          throw error.response?.data || { message: 'Failed to get profile' };
        }
      }
      throw error.response?.data || { message: 'Failed to get profile' };
    }
  },

  async getCoinPurchases() {
    try {
      const response = await adminApi.get('/admin/coin-purchases');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch coin purchases' };
    }
  },

  async getAffiliateLinks() {
    try {
      const response = await adminApi.get('/admin/affiliate-links');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch affiliate links' };
    }
  },

  async getAffiliateReferrals() {
    try {
      const response = await adminApi.get('/admin/affiliate-referrals');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch affiliate referrals' };
    }
  },

  async getAffiliateStats() {
    try {
      const response = await adminApi.get('/admin/affiliate-stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch affiliate statistics' };
    }
  },

  // Escort Management
  async getEscorts() {
    try {
      const response = await adminApi.get('/admin/escorts');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch escorts' };
    }
  },

  async getEscortProfile(escortId) {
    try {
      const response = await adminApi.get(`/admin/escorts/${escortId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch escort profile' };
    }
  },

  async createEscortProfile(escortData) {
    try {
      const response = await adminApi.post('/admin/escorts', escortData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create escort profile' };
    }
  },

  async updateEscortProfile(escortId, escortData) {
    try {
      const response = await adminApi.put(`/admin/escorts/${escortId}`, escortData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update escort profile' };
    }
  },

  async deleteEscort(escortId) {
    try {
      const response = await adminApi.delete(`/admin/escorts/${escortId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete escort' };
    }
  },

  async toggleEscortStatus(escortId, isActive) {
    try {
      const response = await adminApi.patch(`/admin/escorts/${escortId}/status`, { isActive });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update escort status' };
    }
  },

  async verifyEscort(escortId, isVerified) {
    try {
      const response = await adminApi.patch(`/admin/escorts/${escortId}/verify`, { isVerified });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update escort verification' };
    }
  },

  logout() {
    localStorage.removeItem('adminToken');
  }
};

export default adminApi;
