import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, profile } from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthPage = () => {
  const location = useLocation();
  const [activeForm, setActiveForm] = useState('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check URL parameters to determine initial form
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const shouldShowSignup = urlParams.get('signup');
    const refCode = urlParams.get('ref');
    
    if (shouldShowSignup === 'true' || refCode) {
      setActiveForm('signup');
    }
  }, [location.search]);

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      setError('');
      const response = await auth.login(email, password);
      localStorage.setItem('token', response.access_token);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    try {
      setLoading(true);
      setError('');
      const response = await auth.register(userData);
      localStorage.setItem('token', response.access_token);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email) => {
    try {
      setLoading(true);
      setError('');
      await auth.forgotPassword(email);
      setActiveForm('login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Password reset request failed');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (activeForm) {
      case 'login':
        return (
          <LoginSection 
            onSignupClick={() => setActiveForm('signup')}
            onForgotClick={() => setActiveForm('forgot')}
          />
        );
      case 'signup':
        return (
          <SignupSection 
            onLoginClick={() => setActiveForm('login')}
          />
        );
      case 'forgot':
        return (
          <ForgotSection 
            onBackClick={() => setActiveForm('login')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-rose-200 to-pink-100 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeForm}
          initial="enter"
          animate="center"
          exit="exit"
          variants={slideVariants}
          transition={{ duration: 0.4 }}
        >
          {renderForm()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const LoginSection = ({ onSignupClick, onForgotClick }) => {
  const [formData, setFormData] = useState({
    username: '', // Changed from email to username
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      try {
        setLoading(true);
        const response = await auth.login(formData.username, formData.password);
        localStorage.setItem('token', response.access_token);
        window.location.href = '/dashboard';
      } catch (error) {
        setErrors({ 
          submit: error.response?.data?.detail || 'Invalid username or password'
        });
      } finally {
        setLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-8">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">Welcome Back</h2>
      
      {errors.submit && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text" // Changed from email to text
            placeholder="Username or Email"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.username ? 'border-red-300' : 'border-rose-200'
            } focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition`}
            disabled={loading}
            required
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-500">{errors.username}</p>
          )}
        </div>

        <div>
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.password ? 'border-red-300' : 'border-rose-200'
            } focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition`}
            disabled={loading}
            required
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-500 to-pink-600 text-white rounded-lg 
            hover:opacity-90 transition duration-300 flex items-center justify-center"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            'Login'
          )}
        </button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <button
          onClick={onForgotClick}
          className="text-rose-600 hover:text-rose-700 text-sm"
          disabled={loading}
        >
          Forgot Password?
        </button>
        <div className="text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={onSignupClick}
            className="text-rose-600 hover:text-rose-700 font-semibold"
            disabled={loading}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

const SignupSection = ({ onLoginClick }) => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    full_name: '',
    username: '', // Added username field
    email: '',
    password: '',
    referral_code: '', // Added referral code field
    accept_terms: false
  });
  const [errors, setErrors] = useState({});

  // Check for referral code in URL parameters when component loads
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setFormData(prev => ({
        ...prev,
        referral_code: refCode
      }));
      
      // Track the affiliate click
      auth.trackAffiliateClick(refCode).catch(error => {
        // Silently handle affiliate click tracking errors
      });
    }
  }, [location.search]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers and underscores';
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Invalid email address';
    }
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!formData.accept_terms) {
      newErrors.accept_terms = 'You must accept the terms and conditions';
    }
    // Referral code is optional, but if provided, validate format
    if (formData.referral_code && formData.referral_code.trim()) {
      const code = formData.referral_code.trim();
      // Allow alphanumeric characters, underscores, and basic agent ID formats
      if (!/^[a-zA-Z0-9_.-]+$/.test(code)) {
        newErrors.referral_code = 'Referral code can only contain letters, numbers, underscores, dots, and dashes';
      } else if (code.length < 2) {
        newErrors.referral_code = 'Referral code must be at least 2 characters';
      } else if (code.length > 50) {
        newErrors.referral_code = 'Referral code must be less than 50 characters';
      }
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await auth.register(formData);
        localStorage.setItem('token', response.access_token);
        window.location.href = '/dashboard';
      } catch (error) {
        setErrors({ submit: error.response?.data?.detail || 'Registration failed' });
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-8">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">Create Account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name Input */}
        <div>
          <input
            type="text"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition"
            required
          />
          {errors.full_name && (
            <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
          )}
        </div>

        {/* Username Input - New */}
        <div>
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase()})}
            className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition"
            required
          />
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">{errors.username}</p>
          )}
        </div>

        {/* Email Input */}
        <div>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition"
            required
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition"
            required
            minLength={8}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        {/* Referral Code Input */}
        <div>
          <div className="relative">
            <input
              type="text"
              placeholder="Referral Code (optional)"
              value={formData.referral_code}
              onChange={(e) => setFormData({...formData, referral_code: e.target.value.trim()})}
              className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition"
            />
            {formData.referral_code && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-green-500 text-lg">✓</span>
              </div>
            )}
          </div>
          {errors.referral_code && (
            <p className="text-red-500 text-sm mt-1">{errors.referral_code}</p>
          )}
          {formData.referral_code && !errors.referral_code && (
            <p className="text-green-600 text-xs mt-1">
              ✓ Referral code applied! You'll be assigned to the referring agent.
            </p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            Have a referral code? Enter it here to get connected with your referring agent.
          </p>
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            checked={formData.accept_terms}
            onChange={(e) => setFormData({...formData, accept_terms: e.target.checked})}
            className="mt-1.5"
          />
          <label htmlFor="terms" className="text-sm text-gray-600">
            I accept the{' '}
            <a href="/terms" className="text-rose-600 hover:text-rose-700 underline" target="_blank">
              Terms & Conditions
            </a>
            {' '}and{' '}
            <a href="/privacy" className="text-rose-600 hover:text-rose-700 underline" target="_blank">
              Privacy Policy
            </a>
          </label>
        </div>
        {errors.accept_terms && (
          <p className="text-red-500 text-sm">{errors.accept_terms}</p>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="text-red-500 text-center text-sm">{errors.submit}</div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-500 to-pink-600 text-white rounded-lg 
            hover:opacity-90 transition duration-300 mt-4"
        >
          Create Account
        </button>

        {/* Login Link */}
        <div className="text-center mt-4">
          <span className="text-gray-600">Already have an account? </span>
          <button
            type="button"
            onClick={onLoginClick}
            className="text-rose-600 hover:text-rose-700 font-semibold"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
};

const ForgotSection = ({ onBackClick }) => {
  const [step, setStep] = useState('email'); // email, otp, newPassword
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const startResendTimer = () => {
    setResendDisabled(true);
    setResendTimer(30); // 30 seconds cooldown
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [resendTimer]);

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);
    try {
      await auth.resendOTP(usernameOrEmail);
      startResendTimer();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail.trim()) {
      setError('Please enter your email or username');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await auth.forgotPassword(usernameOrEmail.trim());
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP');
      if (Array.isArray(err.response?.data?.detail)) {
        setError(err.response.data.detail[0]?.msg || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await auth.verifyOTP(usernameOrEmail, otp.trim());
      setStep('newPassword');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP');
      if (Array.isArray(err.response?.data?.detail)) {
        setError(err.response.data.detail[0]?.msg || 'Invalid OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await auth.resetPassword(usernameOrEmail, otp, newPassword);
      alert('Password reset successful');
      onBackClick();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password');
      if (Array.isArray(err.response?.data?.detail)) {
        setError(err.response.data.detail[0]?.msg || 'Failed to reset password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-8">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">Reset Password</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={handleSubmitEmail} className="space-y-4">
          <p className="text-gray-600 text-center mb-6">
            Enter your email address or username
          </p>
          <input
            type="text"
            placeholder="Email or Username"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition duration-300"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <p className="text-gray-600 text-center mb-6">
            Enter the OTP sent to your email
          </p>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition"
            required
          />
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition duration-300"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendDisabled || loading}
              className="w-full py-2 text-rose-600 hover:text-rose-700 disabled:text-gray-400"
            >
              {resendDisabled 
                ? `Resend OTP in ${resendTimer}s` 
                : 'Resend OTP'}
            </button>
          </div>
        </form>
      )}

      {step === 'newPassword' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-gray-600 text-center mb-6">
            Enter your new password
          </p>
          <input
            type="password"
            placeholder="New Password (min 8 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition"
            required
            minLength={8}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition duration-300"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={onBackClick}
          className="text-rose-600 hover:text-rose-700 font-semibold"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
