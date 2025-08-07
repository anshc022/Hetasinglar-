import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/context/AuthContext';
import LandingPage from './components/Landing/LandingPage';
import UserDashboard from './components/UserPage/UserDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPassword from './components/Auth/ForgotPassword';
import AgentLogin from './components/Agent/AgentLogin';
import AgentDashboard from './components/Agent/AgentDashboard';
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';
import AddEscortProfile from './components/Agent/AddEscortProfile';
import ChatBox from './components/Agent/ChatBox';
import LiveQueueChat from './components/Agent/LiveQueueChat';
import CustomerProfile from './components/Agent/CustomerProfile';
import SubscriptionPlans from './components/UserPage/SubscriptionPlans';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<LandingPage />} />
          <Route path="/subscription-plans" element={<SubscriptionPlans />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/agent/login" element={<AgentLogin />} />
          <Route path="/agent/dashboard" element={<AgentDashboard />} />
          <Route path="/agent/escorts/add" element={<AddEscortProfile />} />
          <Route path="/agent/live-queue/:escortId" element={<LiveQueueChat />} />
          <Route path="/agent/chat/:chatId" element={<ChatBox />} />
          <Route path="/agent/customers/:customerId" element={<CustomerProfile />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
