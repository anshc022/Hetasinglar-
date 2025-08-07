import axios from 'axios';
import config from '../config/environment';

const BASE_URL = `${config.API_URL}/subscription`;

// Create axios instance with base configuration
const subscriptionAxios = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
subscriptionAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get all available subscription plans
export const getSubscriptionPlans = async () => {
  try {
    const response = await subscriptionAxios.get('/plans');
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
};

// Get user's current subscription
export const getUserSubscription = async () => {
  try {
    const response = await subscriptionAxios.get('/user');
    return response.data;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    throw error;
  }
};

// Purchase a subscription plan
export const purchaseSubscription = async (planType) => {
  try {
    const response = await subscriptionAxios.post('/purchase', { planType });
    return response.data;
  } catch (error) {
    console.error('Error purchasing subscription:', error);
    throw error;
  }
};

// Cancel subscription
export const cancelSubscription = async () => {
  try {
    const response = await subscriptionAxios.post('/cancel');
    return response.data;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

// Update message count after sending a message
export const updateMessageCount = async () => {
  try {
    const response = await subscriptionAxios.post('/update-message-count');
    return response.data;
  } catch (error) {
    console.error('Error updating message count:', error);
    throw error;
  }
};

// Get available coin packages
export const getCoinPackages = async () => {
  try {
    const response = await subscriptionAxios.get('/plans', {
      params: { type: 'coin_package' }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching coin packages:', error);
    throw error;
  }
};

// Purchase coins package
export const purchaseCoinPackage = async (packageId) => {
  try {
    const response = await subscriptionAxios.post('/purchase/coins', { packageId });
    return response.data;
  } catch (error) {
    console.error('Error purchasing coin package:', error);
    throw error;
  }
};

// Get user's coin balance
export const getUserCoins = async () => {
  try {
    const response = await subscriptionAxios.get('/coins/balance');
    return response.data;
  } catch (error) {
    console.error('Error fetching user coins:', error);
    throw error;
  }
};

const subscriptionApi = {
  getSubscriptionPlans,
  getUserSubscription,
  purchaseSubscription,
  cancelSubscription,
  updateMessageCount,
  getCoinPackages,
  purchaseCoinPackage,
  getUserCoins
};

export default subscriptionApi;