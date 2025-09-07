import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import config from '../../config/environment';
import './AuthStyles.css';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid or missing reset token');
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch(`${config.API_URL}/auth/verify-reset-token/${token}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setTokenValid(true);
          setEmail(data.email);
        } else {
          setError(data.message || 'Invalid or expired reset token');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${config.API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Loading verification
  if (verifying) {
    return (
      <AuthLayout
        title="Verifying Reset Token... ⏳"
        subtitle="Please wait while we verify your reset link"
      >
        <div className="text-center space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto border-4 border-rose-500 border-t-transparent rounded-full"
          />
          <p className="text-gray-600">Verifying your reset token...</p>
        </div>
      </AuthLayout>
    );
  }

  // Invalid token
  if (!tokenValid) {
    return (
      <AuthLayout
        title="Invalid Reset Link ❌"
        subtitle="This password reset link is invalid or expired"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">❌</span>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800 text-sm">
              <strong>⚠️ {error}</strong><br/>
              Password reset links expire after 30 minutes for security.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              to="/forgot-password"
              className="block w-full py-3 bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 text-white text-center rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Request New Reset Link 📧
            </Link>

            <Link
              to="/login"
              className="block w-full py-3 bg-gray-200 text-gray-700 text-center rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  // Success message
  if (success) {
    return (
      <AuthLayout
        title="Password Reset! ✅"
        subtitle="Your password has been successfully updated"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">✅</span>
          </div>
          
          <div>
            <p className="text-gray-700 mb-4">
              Your password has been successfully reset!
            </p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800 text-sm">
                <strong>🎉 You're all set!</strong><br/>
                Redirecting you to login in a few seconds...
              </p>
            </div>
          </div>

          <Link
            to="/login"
            className="block w-full py-3 bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 text-white text-center rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Login Now ✨
          </Link>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Your Password 🔑"
      subtitle={`Create a new password for ${email}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* New Password Field */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
            New Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Enter your new password"
            required
            disabled={loading}
            minLength={6}
          />
        </motion.div>

        {/* Confirm Password Field */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Confirm your new password"
            required
            disabled={loading}
            minLength={6}
          />
        </motion.div>

        {/* Password Requirements */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4"
        >
          <p className="text-blue-800 text-sm">
            <strong>🔐 Password Requirements:</strong><br/>
            • At least 6 characters long<br/>
            • Make it strong and unique<br/>
            • Don't reuse old passwords
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-xl"
          >
            <p className="text-red-600 text-center text-sm flex items-center justify-center gap-2">
              ⚠️ {error}
            </p>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={loading || !formData.password || !formData.confirmPassword}
          className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-rose-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:-translate-y-1 focus:ring-4 focus:ring-rose-500/50"
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
              <span>Resetting Password...</span>
            </div>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Reset Password 🔑
            </span>
          )}
        </motion.button>
      </form>

      {/* Back to Login Link */}
      <motion.div
        className="text-center mt-6 pt-6 border-t border-white/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-gray-600">
          Remember your password?{' '}
          <Link
            to="/login"
            className="text-rose-600 hover:text-rose-700 font-semibold hover:underline transition-colors"
          >
            Back to Login
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
