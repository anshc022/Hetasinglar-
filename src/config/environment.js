// Environment configuration utility
const isDev = (process.env.NODE_ENV || 'development') === 'development';

// Production fallbacks - these should match your vercel.json
const PRODUCTION_FALLBACKS = {
  API_URL: 'https://apihetasinglar.duckdns.org/api',
  WS_URL: 'wss://apihetasinglar.duckdns.org',
  FRONTEND_URL: 'https://hetasinglar.vercel.app'
};

const config = {
  // API Configuration - Use environment variables with fallbacks
  API_URL: process.env.REACT_APP_API_URL || 
    (isDev ? 'http://localhost:5000/api' : PRODUCTION_FALLBACKS.API_URL),
  WS_URL: process.env.REACT_APP_WS_URL || 
    (isDev ? 'ws://localhost:5000' : PRODUCTION_FALLBACKS.WS_URL),
  FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || 
    (isDev ? 'http://localhost:8000' : PRODUCTION_FALLBACKS.FRONTEND_URL),
  
  // Environment info
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Platform detection
  isVercel: () => process.env.VERCEL === '1',
  isProduction: () => process.env.NODE_ENV === 'production',
  isDevelopment: () => (process.env.NODE_ENV || 'development') === 'development',
  
  // Get WebSocket URL based on API URL if WS_URL is not explicitly set
  getWebSocketUrl: () => {
    if (process.env.REACT_APP_WS_URL) {
      return process.env.REACT_APP_WS_URL;
    }
    
    // Auto-generate WebSocket URL from API URL
    const apiUrl = config.API_URL;
    if (!apiUrl) {
      console.warn('⚠️ No API URL configured. Please set REACT_APP_API_URL in your environment variables.');
      return isDev ? 'ws://localhost:5000' : null;
    }
    
    if (apiUrl.startsWith('https://')) {
      return apiUrl.replace('https://', 'wss://').replace('/api', '');
    } else if (apiUrl.startsWith('http://')) {
      return apiUrl.replace('http://', 'ws://').replace('/api', '');
    }
    
    console.warn('⚠️ Invalid API URL format. Falling back to development WebSocket URL.');
    return isDev ? 'ws://localhost:5000' : null;
  }
};

export default config;
