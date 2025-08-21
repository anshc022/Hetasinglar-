import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../../services/api';
import AuthLayout from './AuthLayout';
import RecaptchaComponent from '../common/RecaptchaComponent';
import './AuthStyles.css';

const MaleIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 4v2h-2V4h2zm0-2h-2c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-10c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 2c2 0 3.61 1.55 3.61 3.46 0 1.91-1.61 3.46-3.61 3.46s-3.61-1.55-3.61-3.46C8.39 7.55 10 6 12 6z"/>
  </svg>
);

const FemaleIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C8.69 2 6 4.69 6 8c0 2.97 2.16 5.43 5 5.91v2.02h-2v2h2v2h2v-2h2v-2h-2v-2.02c2.84-.48 5-2.94 5-5.91 0-3.31-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
  </svg>
);

const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    sex: '',
    referral_code: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReferralFromUrl, setIsReferralFromUrl] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaError, setRecaptchaError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    available: null,
    message: ''
  });
  const [usernameTimeout, setUsernameTimeout] = useState(null);

  // Check for referral code in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const refCode = urlParams.get('ref') || urlParams.get('referral') || urlParams.get('code');
    
    if (refCode && refCode.trim()) {
      const cleanCode = refCode.trim();
      
      if (/^[a-zA-Z0-9_.-]+$/.test(cleanCode) && cleanCode.length >= 2 && cleanCode.length <= 100) {
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
      }
    }
  }, [location.search]);

  // Real-time username availability checking
  const checkUsernameAvailability = async (username) => {
    if (!username || username.trim().length < 3) {
      setUsernameStatus({
        checking: false,
        available: null,
        message: username.trim().length > 0 && username.trim().length < 3 ? 'Username must be at least 3 characters' : ''
      });
      return;
    }

    setUsernameStatus(prev => ({ ...prev, checking: true }));

    try {
      const result = await auth.checkUsername(username.trim());
      setUsernameStatus({
        checking: false,
        available: result.available,
        message: result.message
      });
    } catch (error) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: error.message || 'Error checking username availability'
      });
    }
  };

  // Handle username input change with debouncing
  const handleUsernameChange = (e) => {
    const username = e.target.value;
    setFormData(prev => ({ ...prev, username }));
    
    // Clear any existing field errors for username
    if (fieldErrors.username) {
      setFieldErrors(prev => ({ ...prev, username: undefined }));
    }

    // Clear existing timeout
    if (usernameTimeout) {
      clearTimeout(usernameTimeout);
    }

    // Set new timeout for username checking (500ms delay)
    const timeout = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500);

    setUsernameTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (usernameTimeout) {
        clearTimeout(usernameTimeout);
      }
    };
  }, [usernameTimeout]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setRecaptchaError('');
    setLoading(true);
    
    try {
      // Validate reCAPTCHA
      if (!recaptchaToken) {
        setRecaptchaError('Please complete the reCAPTCHA verification');
        setLoading(false);
        return;
      }

      // Validate username availability
      if (usernameStatus.available !== true) {
        if (usernameStatus.checking) {
          setError('Please wait while we check username availability');
        } else {
          setFieldErrors(prev => ({
            ...prev,
            username: usernameStatus.message || 'Please choose a valid username'
          }));
        }
        setLoading(false);
        return;
      }

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
        } else if (code.length < 2 || code.length > 100) {
          setFieldErrors(prev => ({
            ...prev,
            referral_code: 'Referral code must be between 2-100 characters'
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

  const handleSexSelection = (sex) => {
    setFormData({ ...formData, sex });
  };

  const handleRecaptchaVerify = (token) => {
    setRecaptchaToken(token);
    setRecaptchaError('');
  };

  const handleRecaptchaExpire = () => {
    setRecaptchaToken('');
    setRecaptchaError('reCAPTCHA expired. Please verify again.');
  };

  const handleRecaptchaError = () => {
    setRecaptchaToken('');
    setRecaptchaError('reCAPTCHA error. Please try again.');
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <motion.input
                    type="text"
                    placeholder="Choose username"
                    className={`w-full px-4 py-3 pr-10 rounded-xl glass-effect border-2 ${
                      fieldErrors.username 
                        ? 'border-red-400' 
                        : usernameStatus.available === true 
                          ? 'border-green-400' 
                          : usernameStatus.available === false 
                            ? 'border-red-400' 
                            : 'border-white/30'
                    } focus:border-rose-400 focus:ring-2 focus:ring-rose-200 placeholder-gray-500 text-gray-800 transition-all hover-lift`}
                    value={formData.username}
                    onChange={handleUsernameChange}
                    whileFocus={{ scale: 1.02 }}
                    required
                  />
                  
                  {/* Status Icon */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {usernameStatus.checking && (
                      <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {!usernameStatus.checking && usernameStatus.available === true && (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                    {!usernameStatus.checking && usernameStatus.available === false && formData.username.trim().length >= 3 && (
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    )}
                  </div>
                </div>
                
                {/* Status Messages */}
                {fieldErrors.username && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>
                )}
                {!fieldErrors.username && usernameStatus.message && (
                  <p className={`text-xs mt-1 ${
                    usernameStatus.available === true 
                      ? 'text-green-600' 
                      : usernameStatus.available === false 
                        ? 'text-red-500' 
                        : 'text-gray-500'
                  }`}>
                    {usernameStatus.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <motion.input
                  type="email"
                  placeholder="Enter your email"
                  className={`w-full px-4 py-3 rounded-xl glass-effect border-2 ${
                    fieldErrors.email ? 'border-red-400' : 'border-white/30'
                  } focus:border-rose-400 focus:ring-2 focus:ring-rose-200 placeholder-gray-500 text-gray-800 transition-all hover-lift`}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  whileFocus={{ scale: 1.02 }}
                  required
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              <motion.input
                type="date"
                className={`w-full px-4 py-3 rounded-xl glass-effect border-2 ${
                  fieldErrors.dateOfBirth ? 'border-red-400' : 'border-white/30'
                } focus:border-rose-400 focus:ring-2 focus:ring-rose-200 text-gray-600 transition-all hover-lift`}
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                whileFocus={{ scale: 1.02 }}
                required
              />
              {fieldErrors.dateOfBirth && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.dateOfBirth}</p>
              )}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Choose Your Gender</h3>
            
            <div className="flex justify-center gap-6">
              <motion.button
                type="button"
                onClick={() => handleSexSelection('male')}
                className={`p-6 rounded-2xl transition-all duration-300 flex flex-col items-center gap-3 font-medium ${
                  formData.sex === 'male'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-2xl scale-110 btn-glow'
                    : 'glass-effect text-gray-600 hover:bg-blue-50 border border-white/30'
                }`}
                whileHover={{ scale: formData.sex === 'male' ? 1.1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MaleIcon />
                <span className="text-lg">Male</span>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => handleSexSelection('female')}
                className={`p-6 rounded-2xl transition-all duration-300 flex flex-col items-center gap-3 font-medium ${
                  formData.sex === 'female'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-2xl scale-110 btn-glow'
                    : 'glass-effect text-gray-600 hover:bg-pink-50 border border-white/30'
                }`}
                whileHover={{ scale: formData.sex === 'female' ? 1.1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FemaleIcon />
                <span className="text-lg">Female</span>
              </motion.button>
            </div>

            {fieldErrors.sex && (
              <p className="text-red-500 text-xs text-center">{fieldErrors.sex}</p>
            )}
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Secure Your Account</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <motion.input
                type="password"
                placeholder="Create a strong password"
                className={`w-full px-4 py-3 rounded-xl glass-effect border-2 ${
                  fieldErrors.password ? 'border-red-400' : 'border-white/30'
                } focus:border-rose-400 focus:ring-2 focus:ring-rose-200 placeholder-gray-500 text-gray-800 transition-all hover-lift`}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                whileFocus={{ scale: 1.02 }}
                required
              />
              {fieldErrors.password && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <motion.input
                type="password"
                placeholder="Confirm your password"
                className={`w-full px-4 py-3 rounded-xl glass-effect border-2 ${
                  fieldErrors.confirmPassword ? 'border-red-400' : 'border-white/30'
                } focus:border-rose-400 focus:ring-2 focus:ring-rose-200 placeholder-gray-500 text-gray-800 transition-all hover-lift`}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                whileFocus={{ scale: 1.02 }}
                required
              />
              {fieldErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Referral Code (Optional)</label>
              <div className="relative">
                <motion.input
                  type="text"
                  placeholder={isReferralFromUrl ? "Auto-filled from link ✨" : "Enter referral code"}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all hover-lift ${
                    fieldErrors.referral_code ? 'border-red-400 glass-effect' : 
                    isReferralFromUrl ? 'border-green-400 bg-green-50/70' : 'border-white/30 glass-effect'
                  } focus:border-rose-400 focus:ring-2 focus:ring-rose-200 placeholder-gray-500 text-gray-800`}
                  value={formData.referral_code}
                  onChange={(e) => {
                    setFormData({...formData, referral_code: e.target.value.trim()});
                    setIsReferralFromUrl(false);
                  }}
                  whileFocus={{ scale: 1.02 }}
                />
                {formData.referral_code && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isReferralFromUrl ? (
                      <span className="text-green-500 text-lg">🔗</span>
                    ) : (
                      <span className="text-green-500 text-lg">✅</span>
                    )}
                  </div>
                )}
              </div>
              
              {fieldErrors.referral_code && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.referral_code}</p>
              )}
              
              {formData.referral_code && !fieldErrors.referral_code && (
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  ✅ {isReferralFromUrl ? 'Auto-detected from affiliate link!' : 'Referral code applied!'}
                </p>
              )}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <AuthLayout 
      title="Join HetaSinglar" 
      subtitle="Create your account and find love today ❤️"
    >
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-6">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                step <= currentStep
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step}
            </div>
            {step < 3 && (
              <div
                className={`w-12 h-1 mx-2 transition-all ${
                  step < currentStep ? 'bg-gradient-to-r from-rose-500 to-pink-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit}>
        {renderStepContent()}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl"
          >
            <p className="text-red-600 text-center text-sm flex items-center justify-center gap-2">
              ⚠️ {error}
            </p>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-6">
          {currentStep > 1 && (
            <motion.button
              type="button"
              onClick={prevStep}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Previous
            </motion.button>
          )}

          {currentStep < 3 ? (
            <motion.button
              type="button"
              onClick={nextStep}
              disabled={
                (currentStep === 1 && (!formData.username || !formData.email || !formData.dateOfBirth)) ||
                (currentStep === 2 && !formData.sex)
              }
              className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Next
            </motion.button>
          ) : (
            <>
              {/* reCAPTCHA Component for Step 3 */}
              <div className="mb-6 flex justify-center w-full">
                <RecaptchaComponent
                  onVerify={handleRecaptchaVerify}
                  onExpire={handleRecaptchaExpire}
                  onError={handleRecaptchaError}
                  theme="light"
                  size="normal"
                />
              </div>

              {/* reCAPTCHA Error Display */}
              {recaptchaError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 w-full"
                >
                  <p className="text-red-600 text-center text-sm flex items-center justify-center gap-2">
                    ⚠️ {recaptchaError}
                  </p>
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading || !recaptchaToken}
                className="flex-1 py-3 bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 text-white rounded-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 disabled:opacity-50 btn-glow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Create Account ✨'
              )}
            </motion.button>
            </>
          )}
        </div>
      </form>

      {/* Sign In Link */}
      <motion.div
        className="text-center mt-6 pt-6 border-t border-white/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-rose-600 hover:text-rose-700 font-semibold hover:underline transition-colors"
          >
            Sign In
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default RegisterPage;
