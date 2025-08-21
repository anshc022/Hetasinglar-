import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from './AuthLayout';
import './AuthStyles.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginResponse = await login(formData.username, formData.password);
      if (loginResponse.access_token) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/auth/forgot-password');
  };

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to continue your journey ❤️"
    >
      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
          <motion.input
            type="text"
            placeholder="Enter your username"
            className="w-full px-4 py-3 rounded-xl glass-effect border-2 border-white/30 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 placeholder-gray-500 text-gray-800 transition-all hover-lift"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            whileFocus={{ scale: 1.02 }}
            required
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <motion.input
            type="password"
            placeholder="Enter your password"
            className="w-full px-4 py-3 rounded-xl glass-effect border-2 border-white/30 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 placeholder-gray-500 text-gray-800 transition-all hover-lift"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            whileFocus={{ scale: 1.02 }}
            required
          />
        </motion.div>

        {/* Forgot Password */}
        <div className="text-right">
          <motion.button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-rose-600 hover:text-rose-700 hover:underline font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
          >
            🔑 Forgot your password?
          </motion.button>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-50 border border-red-200 rounded-xl"
          >
            <p className="text-red-600 text-center text-sm flex items-center justify-center gap-2">
              ⚠️ {error}
            </p>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 disabled:opacity-50 btn-glow"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
              />
              <span>Signing In...</span>
            </div>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Sign In ✨
            </span>
          )}
        </motion.button>
      </form>

      {/* Sign Up Link */}
      <motion.div
        className="text-center mt-6 pt-6 border-t border-white/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-gray-600">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-rose-600 hover:text-rose-700 font-semibold hover:underline transition-colors"
          >
            Join HetaSinglar
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default LoginPage;
