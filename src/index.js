import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import axios from 'axios';
import config from './config/environment';

// Configure axios default base URL
// Remove '/api' from the end if present to avoid duplication
let baseURL = config.API_URL;
if (baseURL.endsWith('/api')) {
  baseURL = baseURL.slice(0, -4); // Remove '/api' from the end
}
axios.defaults.baseURL = baseURL;
console.log('🔧 Axios configured with base URL:', axios.defaults.baseURL);
console.log('🔍 Original API_URL:', config.API_URL);
console.log('🎯 Final requests will go to:', `${axios.defaults.baseURL}/api/...`);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // Temporarily disabled StrictMode to prevent duplicate renders in development
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
