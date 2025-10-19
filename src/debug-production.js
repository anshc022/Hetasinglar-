// Production Frontend Debug Script
// This script helps debug production connection issues

const config = {
  API_URL: 'https://apihetasinglar.duckdns.org/api',
  WS_URL: 'wss://apihetasinglar.duckdns.org',
  FRONTEND_URL: 'http://hetasinglar.se'
};

async function debugProductionConnection() {
  console.log('🔍 Debugging Production Connection...\n');
  
  // Test 1: API Health Check
  console.log('📡 Testing API Health...');
  try {
    const response = await fetch(`${config.API_URL}/health`);
    const data = await response.json();
    console.log('✅ API Health:', data.status);
    console.log('📊 API Info:', {
      environment: data.environment,
      uptime: data.uptime,
      services: data.services
    });
  } catch (error) {
    console.error('❌ API Health Failed:', error.message);
    return;
  }
  
  // Test 2: CORS Preflight
  console.log('\n🌐 Testing CORS...');
  try {
    const response = await fetch(`${config.API_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': config.FRONTEND_URL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log('✅ CORS Response Status:', response.status);
    console.log('📋 CORS Headers:', {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
    });
  } catch (error) {
    console.error('❌ CORS Test Failed:', error.message);
  }
  
  // Test 3: WebSocket Connection
  console.log('\n🔌 Testing WebSocket...');
  try {
    const ws = new WebSocket(config.WS_URL);
    
    ws.onopen = () => {
      console.log('✅ WebSocket Connected');
      ws.close();
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket Error:', error);
    };
    
    ws.onclose = () => {
      console.log('🔌 WebSocket Closed');
    };
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        console.error('❌ WebSocket Connection Timeout');
        ws.close();
      }
    }, 5000);
    
  } catch (error) {
    console.error('❌ WebSocket Test Failed:', error.message);
  }
  
  // Test 4: Environment Variables
  console.log('\n🔧 Environment Check...');
  console.log('📋 Environment Variables:', {
    NODE_ENV: process.env.NODE_ENV,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    REACT_APP_WS_URL: process.env.REACT_APP_WS_URL,
    REACT_APP_FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL
  });
  
  // Test 5: Network Information
  console.log('\n🌐 Network Information...');
  console.log('📍 User Agent:', navigator.userAgent);
  console.log('🔒 Location Protocol:', window.location.protocol);
  console.log('🏠 Location Host:', window.location.host);
  console.log('🌍 Location Origin:', window.location.origin);
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.debugProductionConnection = debugProductionConnection;
  console.log('🔧 Production Debug Tool Loaded!');
  console.log('📝 Run: debugProductionConnection()');
}

// For Node.js testing
if (typeof module !== 'undefined') {
  module.exports = { debugProductionConnection, config };
}
