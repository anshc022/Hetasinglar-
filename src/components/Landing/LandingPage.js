import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../../services/api';

const MaleIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 4v2h-2V4h2zm0-2h-2c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-10c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 2c2 0 3.61 1.55 3.61 3.46 0 1.91-1.61 3.46-3.61 3.46s-3.61-1.55-3.61-3.46C8.39 7.55 10 6 12 6z"/>
  </svg>
);

const FemaleIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C8.69 2 6 4.69 6 8c0 2.97 2.16 5.43 5 5.91v2.02h-2v2h2v2h2v-2h2v-2h-2v-2.02c2.84-.48 5-2.94 5-5.91 0-3.31-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
  </svg>
);

const FloatingShape = ({ className }) => (
  <motion.div
    className={`absolute rounded-full mix-blend-multiply filter blur-xl opacity-70 ${className}`}
    animate={{
      y: [0, 30, 0],
      scale: [1, 1.1, 1],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

const LandingPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '', // Changed from email
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    email: '', // Keep email for registration
    sex: '', // Add sex field
    referral_code: '' // Add referral code field
  });

  // Check for referral code in URL parameters when component loads
  useEffect(() => {
    console.log('LandingPage mounted, checking URL for referral code...');
    console.log('Current location search:', location.search);
    
    const urlParams = new URLSearchParams(location.search);
    const refCode = urlParams.get('ref') || urlParams.get('referral') || urlParams.get('code');
    
    console.log('Extracted referral code from URL:', refCode);
    
    if (refCode && refCode.trim()) {
      const cleanCode = refCode.trim();
      
      // Validate the referral code format (allow both old format with timestamp and new simple format)
      if (/^[a-zA-Z0-9_.-]+$/.test(cleanCode) && cleanCode.length >= 2 && cleanCode.length <= 100) {
        console.log('Referral code is valid, setting in form data:', cleanCode);
        
        setFormData(prev => ({
          ...prev,
          referral_code: cleanCode
        }));
        
        setIsReferralFromUrl(true);
        
        // Track the affiliate click
        auth.trackAffiliateClick(cleanCode).then(() => {
          console.log('Affiliate click tracked successfully');
        }).catch(error => {
          console.log('Affiliate click tracking failed:', error);
        });
        
        console.log('Referral code auto-filled from URL:', cleanCode);
      } else {
        console.warn('Invalid referral code format in URL:', refCode);
        console.log('Code length:', cleanCode.length);
        console.log('Regex test result:', /^[a-zA-Z0-9_.-]+$/.test(cleanCode));
      }
    } else {
      console.log('No referral code found in URL');
    }
  }, [location.search]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReferralFromUrl, setIsReferralFromUrl] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    sex: '',
    referral_code: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    
    try {
      // Validate password match
      if (formData.password !== formData.confirmPassword) {
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
        setLoading(false);
        return;
      }

      // Validate referral code if provided
      if (formData.referral_code && formData.referral_code.trim()) {
        const code = formData.referral_code.trim();
        if (!/^[a-zA-Z0-9_.-]+$/.test(code)) {
          setFieldErrors(prev => ({
            ...prev,
            referral_code: 'Referral code can only contain letters, numbers, underscores, dots, and dashes'
          }));
          setLoading(false);
          return;
        } else if (code.length < 2) {
          setFieldErrors(prev => ({
            ...prev,
            referral_code: 'Referral code must be at least 2 characters'
          }));
          setLoading(false);
          return;
        } else if (code.length > 100) {
          setFieldErrors(prev => ({
            ...prev,
            referral_code: 'Referral code must be less than 100 characters'
          }));
          setLoading(false);
          return;
        }
      }

      // Register new user
      const registerData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        dateOfBirth: formData.dateOfBirth,
        sex: formData.sex,
        referral_code: formData.referral_code
      };

      await auth.register(registerData);
      
      // Auto login after successful registration
      const loginResponse = await login(formData.username, formData.password);
      
      if (loginResponse.access_token) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.errors) {
        // Handle validation errors
        const newFieldErrors = {};
        err.errors.forEach(error => {
          newFieldErrors[error.path] = error.msg;
        });
        setFieldErrors(newFieldErrors);
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    // Implement social login logic here
    console.log(`Logging in with ${provider}`);
  };

  const handleQuickLogin = async (e) => {
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
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/auth/forgot-password');
  };

  const handleSexSelection = (sex) => {
    setFormData({ ...formData, sex });
  };

  const formVariants = {
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Full-page background image with adjusted overlay */}
      <div className="fixed inset-0 -z-10">
        <motion.img
          src="/img/pexels-dana-tentis-118658-364382.jpg"
          alt="Background"
          className="absolute w-full h-full object-cover opacity-90"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.9 }}
          transition={{ duration: 1.5 }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-rose-100/50 to-white/60 backdrop-blur-[1px]"></div>
        
        {/* Adjusted Floating shapes */}
        <FloatingShape className="bg-pink-300/10 w-96 h-96 -top-20 -left-20" />
        <FloatingShape className="bg-rose-300/10 w-96 h-96 top-1/2 -right-20" />
        <FloatingShape className="bg-red-300/10 w-72 h-72 bottom-20 left-1/3" />
      </div>

      {/* Main Content with Integrated Navigation */}
      <section className="relative z-10 min-h-screen pt-8">
        {/* Integrated Navigation Area */}
        <div className="container mx-auto px-6 mb-16">
          <div className="flex justify-between items-center">
            {/* Updated Logo with Card */}
            <motion.div
              className="backdrop-blur-xl bg-white/30 p-3 rounded-xl border border-white/50 shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.h1 
                className="font-['Rouge_Script'] text-5xl bg-gradient-to-r from-red-600 via-rose-500 to-pink-600 bg-clip-text text-transparent drop-shadow-xl leading-none cursor-pointer"
              >
                HetaSinglar
              </motion.h1>
            </motion.div>

            <div className="flex items-center gap-4">
              <form onSubmit={handleQuickLogin} className="flex items-center gap-4">
                <div className="relative group">
                  <input
                    type="text" // Changed from email to text
                    placeholder="Username" // Changed from Email Address to Username
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-44 px-4 py-2.5 rounded-lg border border-white/50 focus:ring-2 focus:ring-rose-400 focus:border-transparent text-sm
                      bg-white/70 backdrop-blur-sm transition-all duration-300 outline-none group-hover:shadow-md"
                    required
                  />
                </div>
                <div className="relative group">
                  <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-44 px-4 py-2.5 rounded-lg border border-white/50 focus:ring-2 focus:ring-rose-400 focus:border-transparent text-sm
                      bg-white/70 backdrop-blur-sm transition-all duration-300 outline-none group-hover:shadow-md"
                    required
                  />
                  <motion.div 
                    className="absolute -bottom-7 right-0 flex items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span role="img" aria-label="key" className="text-base">🔑</span>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-medium"
                    >
                      Forgot Password?
                    </button>
                  </motion.div>
                </div>
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 via-rose-500 to-pink-600 text-white rounded-lg font-medium text-sm
                    hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? '...' : 'Login'}
                </motion.button>
              </form>
            </div>
          </div>
        </div>

        {/* Main Content Section */}
        <div className="container mx-auto px-4 flex flex-col lg:flex-row justify-between items-start gap-12">
          {/* Enhanced Left side content with better text visibility */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-[40%] pr-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              <h2 className="text-7xl font-['Italiana'] text-gray-900 tracking-wide leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]">
                Find Your <span className="text-rose-600 font-bold bg-white/50 px-2 rounded-lg backdrop-blur-sm">Perfect Match</span>
              </h2>
              <div className="w-40 h-1.5 bg-gradient-to-r from-red-500 to-transparent rounded-full"></div>
              <div className="space-y-6 backdrop-blur-sm bg-white/30 p-6 rounded-xl border border-white/50">
                <p className="text-3xl text-gray-800 leading-relaxed font-semibold drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)] max-w-lg">
                  Join thousands of singles finding meaningful connections every day
                </p>
                <p className="text-2xl text-rose-600 font-bold drop-shadow-[0_2px_2px_rgba(255,255,255,0.5)]">
                  Join the best flirting site ever
                </p>
                <p className="text-xl text-gray-800 font-medium drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
                  Looking for flirty chat? HetaSinglar is the easiest site. Try your luck and join!
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Updated Right side - Sign Up Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-[45%] max-w-md ml-auto mr-0 lg:mr-8 relative lg:sticky lg:top-24"
          >
            <div className="backdrop-blur-xl bg-white/50 p-6 rounded-2xl shadow-2xl border border-white/50">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Create Account</h2>
              
              {/* Simplified Google Sign Up Button */}
              <div className="mb-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSocialLogin('google')}
                  className="w-full py-2 px-4 flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-all border border-white/50 text-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                    <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
                    <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
                    <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
                  </svg>
                  <span className="text-gray-700">Continue with Google</span>
                </motion.button>
              </div>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300/50"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white/50 backdrop-blur-sm text-gray-600">or</span>
                </div>
              </div>

              {/* Updated Sign Up Form */}
              <motion.form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <input
                      type="text"
                      placeholder="Username"
                      className={`w-full px-4 py-2 rounded-lg bg-white/70 backdrop-blur-sm border ${
                        fieldErrors.username ? 'border-red-400' : 'border-white/50'
                      } focus:ring-2 focus:ring-rose-400 focus:border-transparent placeholder-gray-500 text-sm`}
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      required
                    />
                    {fieldErrors.username && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <input
                      type="email"
                      placeholder="Email"
                      className={`w-full px-4 py-2 rounded-lg bg-white/70 backdrop-blur-sm border ${
                        fieldErrors.email ? 'border-red-400' : 'border-white/50'
                      } focus:ring-2 focus:ring-rose-400 focus:border-transparent placeholder-gray-500 text-sm`}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                    {fieldErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                    )}
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <input
                    type="date"
                    placeholder="Date of Birth"
                    className={`w-full px-4 py-2 rounded-lg bg-white/70 backdrop-blur-sm border ${
                      fieldErrors.dateOfBirth ? 'border-red-400' : 'border-white/50'
                    } focus:ring-2 focus:ring-rose-400 focus:border-transparent text-gray-500 text-sm`}
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    required
                  />
                  {fieldErrors.dateOfBirth && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.dateOfBirth}</p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <label className="text-sm text-gray-600 block text-center">Select Sex</label>
                  <div className="flex justify-center gap-3">
                    <motion.button
                      type="button"
                      onClick={() => handleSexSelection('male')}
                      className={`p-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                        formData.sex === 'male'
                          ? 'bg-blue-500 text-white shadow-lg scale-105'
                          : 'bg-white/70 text-gray-600 hover:bg-blue-100'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MaleIcon />
                      <span className="text-sm font-medium">Male</span>
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => handleSexSelection('female')}
                      className={`p-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                        formData.sex === 'female'
                          ? 'bg-pink-500 text-white shadow-lg scale-105'
                          : 'bg-white/70 text-gray-600 hover:bg-pink-100'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FemaleIcon />
                      <span className="text-sm font-medium">Female</span>
                    </motion.button>
                  </div>
                  {fieldErrors.sex && (
                    <p className="text-red-500 text-xs mt-1 text-center">{fieldErrors.sex}</p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <input
                    type="password"
                    placeholder="Password"
                    className={`w-full px-4 py-2 rounded-lg bg-white/70 backdrop-blur-sm border ${
                      fieldErrors.password ? 'border-red-400' : 'border-white/50'
                    } focus:ring-2 focus:ring-rose-400 focus:border-transparent placeholder-gray-500 text-sm`}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                  {fieldErrors.password && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    className={`w-full px-4 py-2 rounded-lg bg-white/70 backdrop-blur-sm border ${
                      fieldErrors.confirmPassword ? 'border-red-400' : 'border-white/50'
                    } focus:ring-2 focus:ring-rose-400 focus:border-transparent placeholder-gray-500 text-sm`}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                  )}
                </motion.div>

                {/* Referral Code Input */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={isReferralFromUrl ? "Auto-filled from link" : "Referral Code (optional)"}
                      className={`w-full px-4 py-2 rounded-lg backdrop-blur-sm border ${
                        fieldErrors.referral_code ? 'border-red-400' : 
                        isReferralFromUrl ? 'border-green-400 bg-green-50/70' : 'border-white/50 bg-white/70'
                      } focus:ring-2 focus:ring-rose-400 focus:border-transparent placeholder-gray-500 text-sm`}
                      value={formData.referral_code}
                      onChange={(e) => {
                        setFormData({...formData, referral_code: e.target.value.trim()});
                        setIsReferralFromUrl(false); // Remove auto-fill styling when user types
                      }}
                    />
                    {formData.referral_code && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {isReferralFromUrl ? (
                          <span className="text-blue-500 text-lg" title="Auto-filled from affiliate link">🔗</span>
                        ) : (
                          <span className="text-green-500 text-lg">✓</span>
                        )}
                      </div>
                    )}
                  </div>
                  {fieldErrors.referral_code && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.referral_code}</p>
                  )}
                  {formData.referral_code && !fieldErrors.referral_code && isReferralFromUrl && (
                    <p className="text-blue-600 text-xs mt-1">
                      🔗 Referral code automatically detected from your affiliate link!
                    </p>
                  )}
                  {formData.referral_code && !fieldErrors.referral_code && !isReferralFromUrl && (
                    <p className="text-green-600 text-xs mt-1">
                      ✓ Referral code applied! You'll be connected with your referring agent.
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    {isReferralFromUrl ? 
                      "This code was automatically filled from your affiliate link." :
                      "Have a referral code? Enter it here to get connected with your agent."
                    }
                  </p>
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-red-600 via-rose-500 to-pink-600 text-white rounded-lg font-semibold text-lg
                    hover:shadow-lg transition-all duration-300 disabled:opacity-50 backdrop-blur-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  {loading ? 'Creating Account...' : 'Create Free Account'}
                </motion.button>
              </motion.form>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 mt-4 text-center text-sm"
                >
                  {error}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Simplified Chat Preview Section */}
      <section className="relative z-10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Message 1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-4"
            >
              <div className="bg-gradient-to-r from-rose-100 to-rose-200 rounded-2xl p-4 max-w-md shadow-lg">
                <p className="text-gray-800 text-lg">Hey there! 😊</p>
                <span className="text-xs text-gray-600 mt-2 block">02 Sep 11:09</span>
              </div>
            </motion.div>

            {/* Message 2 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-end gap-4"
            >
              <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl p-4 max-w-md shadow-lg">
                <p className="text-lg">Hi! How are you? 😊</p>
                <span className="text-xs text-white/90 mt-2 block">02 Sep 11:13</span>
              </div>
            </motion.div>

            {/* Message 3 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex gap-4"
            >
              <div className="bg-gradient-to-r from-rose-100 to-rose-200 rounded-2xl p-4 max-w-md shadow-lg">
                <p className="text-gray-800 text-lg">You have a really interesting profile and I love your pictures!</p>
                <span className="text-xs text-gray-600 mt-2 block">02 Sep 11:17</span>
              </div>
            </motion.div>

            {/* Message 4 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="flex justify-end gap-4"
            >
              <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl p-4 max-w-md shadow-lg">
                <p className="text-lg">Aww that's so sweet of you! Thank you!!! 💕</p>
                <span className="text-xs text-white/90 mt-2 block">02 Sep 11:19</span>
              </div>
            </motion.div>

            {/* Simplified Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="text-center mt-12"
            >
              <p className="text-2xl text-gray-800 font-medium mb-6">
                Feel at home... and chat with thousands of active users!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-red-600 via-rose-500 to-pink-600 text-white rounded-full 
                  font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Chatting Now
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Update the bottom section before closing div */}
      <footer className="relative z-10 py-8 bg-white/30 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Access Portals</p>
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={() => navigate('/agent/login')}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg
                    hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center gap-2">
                    <span role="img" aria-label="agent">👨‍💼</span>
                    Agent Login
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => navigate('/admin/login')}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg
                    hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center gap-2">
                    <span role="img" aria-label="admin">👑</span>
                    Admin Login
                  </div>
                </motion.button>
              </div>
            </div>

            <p className="text-sm text-gray-500 mt-4">
              © 2024 HetaSinglar. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
