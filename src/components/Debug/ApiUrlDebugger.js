import React, { useEffect } from 'react';
import config from '../../config/environment';
import axios from 'axios';

const ApiUrlDebugger = () => {
  useEffect(() => {
    console.log('🔍 API URL Debug Information:');
    console.log('config.API_URL:', config.API_URL);
    console.log('axios.defaults.baseURL:', axios.defaults.baseURL);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('Is Vercel:', config.isVercel && config.isVercel());
    
    // Test URL construction
    const testUrl = axios.defaults.baseURL + '/api/admin/assignments';
    console.log('🎯 Test URL would be:', testUrl);
    
    // Check for malformed URLs
    if (testUrl.includes('undefined') || testUrl.includes('null') || testUrl.includes('//api')) {
      console.error('❌ Malformed URL detected!');
    } else {
      console.log('✅ URL looks good');
    }
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '50px', 
      right: '10px', 
      background: '#f0f0f0', 
      padding: '10px', 
      border: '1px solid #ccc',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <h4>API Debug Info</h4>
      <div><strong>API URL:</strong> {config.API_URL}</div>
      <div><strong>Base URL:</strong> {axios.defaults.baseURL}</div>
      <div><strong>Environment:</strong> {process.env.NODE_ENV}</div>
      <div><strong>Test URL:</strong> {axios.defaults.baseURL}/api/admin/assignments</div>
    </div>
  );
};

export default ApiUrlDebugger;
