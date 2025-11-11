import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/context/AuthContext';
import { ThemeProvider } from './components/context/ThemeContext';
import LandingPage from './components/Landing/LandingPage';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import PricingPage from './components/Landing/PricingPage';
import UserDashboard from './components/UserPage/UserDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPasswordPage from './components/Auth/ForgotPasswordPage';
import ResetPasswordPage from './components/Auth/ResetPasswordPage';
import AgentLogin from './components/Agent/AgentLogin';
import AgentDashboard from './components/Agent/AgentDashboard';
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminAddUpdateEscort from './components/Admin/AdminAddUpdateEscort';
import AddEscortProfile from './components/Agent/AddEscortProfile';
import ChatBox from './components/Agent/ChatBox';
import LiveQueueChat from './components/Agent/LiveQueueChat';
import CustomerProfile from './components/Agent/CustomerProfile';
import SubscriptionPlans from './components/UserPage/SubscriptionPlans';
import PrivacyPolicy from './components/Legal/PrivacyPolicy';
import CookiePolicy from './components/Legal/CookiePolicy';
import ContactUs from './components/Legal/ContactUs';
import ComingSoon from './components/Legal/ComingSoon';
import Terms from './components/Legal/Terms';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/subscription-plans" element={<SubscriptionPlans />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/agent/login" element={<AgentLogin />} />
          <Route path="/agent/dashboard" element={<AgentDashboard />} />
          <Route path="/agent/escorts/add" element={<AddEscortProfile />} />
          <Route path="/agent/live-queue/:escortId" element={<LiveQueueChat />} />
          <Route path="/agent/chat/:chatId" element={<ChatBox />} />
          <Route path="/agent/customers/:customerId" element={<CustomerProfile />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/escorts/add" element={<AdminAddUpdateEscort />} />
          <Route path="/admin/escorts/edit/:escortId" element={<AdminAddUpdateEscort />} />
          
          {/* Legal Pages */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/contact" element={<ContactUs />} />
          
          {/* Placeholder Pages */}
          <Route path="/about" element={<ComingSoon />} />
          <Route path="/how-it-works" element={<ComingSoon />} />
          <Route path="/stories" element={<ComingSoon />} />
          <Route path="/blog" element={<ComingSoon />} />
          <Route path="/careers" element={<ComingSoon />} />
          <Route path="/help" element={<ComingSoon />} />
          <Route path="/safety" element={<ComingSoon />} />
          <Route path="/report" element={<ComingSoon />} />
          <Route path="/faq" element={<ComingSoon />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/guidelines" element={<ComingSoon />} />
          <Route path="/data-protection" element={<ComingSoon />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}


export default App;
