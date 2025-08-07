import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config/environment';

const CorsTestComponent = () => {
  const [corsStatus, setCorsStatus] = useState('Testing...');
  const [corsDetails, setCorsDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    testCors();
  }, []);

  const testCors = async () => {
    try {
      setCorsStatus('Testing CORS...');
      setError(null);

      // Test basic API connectivity
      const response = await axios.get(`${config.API_URL.replace('/api', '')}/api/cors-test`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      setCorsStatus('✅ CORS Working');
      setCorsDetails(response.data);
      
      console.log('🟢 CORS Test Successful:', response.data);
      
    } catch (err) {
      setCorsStatus('❌ CORS Failed');
      setError({
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      
      console.error('🔴 CORS Test Failed:', err);
    }
  };

  const retryTest = () => {
    testCors();
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: error ? '#ffebee' : corsDetails ? '#e8f5e8' : '#fff3e0',
      border: `2px solid ${error ? '#f44336' : corsDetails ? '#4caf50' : '#ff9800'}`,
      borderRadius: '8px',
      padding: '12px',
      minWidth: '250px',
      maxWidth: '400px',
      fontSize: '12px',
      zIndex: 9999,
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '8px',
        color: error ? '#d32f2f' : corsDetails ? '#2e7d32' : '#e65100'
      }}>
        CORS Status: {corsStatus}
      </div>
      
      <div style={{ marginBottom: '8px', fontSize: '11px' }}>
        <strong>API URL:</strong> {config.API_URL}
      </div>
      
      {corsDetails && (
        <div style={{ fontSize: '10px', color: '#666' }}>
          <div><strong>Origin:</strong> {corsDetails.origin}</div>
          <div><strong>Time:</strong> {new Date(corsDetails.timestamp).toLocaleTimeString()}</div>
          <div><strong>Message:</strong> {corsDetails.message}</div>
        </div>
      )}
      
      {error && (
        <div style={{ fontSize: '10px', color: '#d32f2f', marginTop: '8px' }}>
          <div><strong>Error:</strong> {error.message}</div>
          {error.status && <div><strong>Status:</strong> {error.status} {error.statusText}</div>}
        </div>
      )}
      
      <button 
        onClick={retryTest}
        style={{
          marginTop: '8px',
          padding: '4px 8px',
          fontSize: '10px',
          border: 'none',
          borderRadius: '4px',
          background: '#2196f3',
          color: 'white',
          cursor: 'pointer'
        }}
      >
        Retry Test
      </button>
      
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          marginTop: '8px', 
          fontSize: '9px', 
          color: '#666',
          borderTop: '1px solid #ddd',
          paddingTop: '4px'
        }}>
          <div>Environment: {config.NODE_ENV}</div>
          <div>Is Production: {config.isProduction() ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

export default CorsTestComponent;
