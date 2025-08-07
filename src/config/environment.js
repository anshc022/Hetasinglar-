// Environment configuration utility
const config = {
  // API Configuration
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  WS_URL: process.env.REACT_APP_WS_URL || 'ws://localhost:5000',
  
  // Environment info
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Helper methods
  isProduction: () => process.env.NODE_ENV === 'production',
  isDevelopment: () => process.env.NODE_ENV === 'development',
  
  // Get WebSocket URL based on API URL if WS_URL is not explicitly set
  getWebSocketUrl: () => {
    if (process.env.REACT_APP_WS_URL) {
      return process.env.REACT_APP_WS_URL;
    }
    
    // Auto-generate WebSocket URL from API URL
    const apiUrl = config.API_URL;
    if (apiUrl.startsWith('https://')) {
      return apiUrl.replace('https://', 'wss://').replace('/api', '');
    } else if (apiUrl.startsWith('http://')) {
      return apiUrl.replace('http://', 'ws://').replace('/api', '');
    }
    
    return 'ws://localhost:5000';
  }
};

export default config;
