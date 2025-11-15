import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../../services/api';
import { useSwedishTranslation } from '../../utils/swedishTranslations';
import { SWEDISH_REGION_OPTIONS } from '../../constants/swedishRegions';
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
  const { login, setAuthData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useSwedishTranslation();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    sex: '',
    referral_code: '',
    firstName: '',
    lastName: '',
    region: '',
    description: '',
    profilePhoto: '',
    acceptPolicy: false
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReferralFromUrl, setIsReferralFromUrl] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaError, setRecaptchaError] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: undefined }));
  };


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

      // Validate password match
      if (formData.password !== formData.confirmPassword) {
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
        setLoading(false);
        return;
      }

      if (!formData.firstName.trim()) {
        setFieldErrors(prev => ({ ...prev, firstName: 'First name is required' }));
        setLoading(false);
        return;
      }

      if (!formData.lastName.trim()) {
        setFieldErrors(prev => ({ ...prev, lastName: 'Last name is required' }));
        setLoading(false);
        return;
      }

      if (!formData.region) {
        setFieldErrors(prev => ({ ...prev, region: 'Please select your region' }));
        setLoading(false);
        return;
      }

      if (!formData.description || formData.description.trim().length < 10) {
        setFieldErrors(prev => ({ ...prev, description: 'Add a short description (min 10 characters)' }));
        setLoading(false);
        return;
      }

      if (!formData.profilePhoto) {
        setFieldErrors(prev => ({ ...prev, profilePhoto: 'Please upload a profile photo' }));
        setLoading(false);
        return;
      }

      if (!formData.acceptPolicy) {
        setFieldErrors(prev => ({ ...prev, acceptPolicy: 'Please confirm you have read the policy' }));
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

      // Register new user (no OTP verification)
      const registerData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        dateOfBirth: formData.dateOfBirth,
        sex: formData.sex,
        referral_code: formData.referral_code,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        region: formData.region,
        description: formData.description.trim(),
        profilePhoto: formData.profilePhoto,
        acceptPolicy: formData.acceptPolicy
      };

      const response = await auth.register(registerData);
      // Direct registration path: if token returned, login immediately
      if (response?.access_token && response?.user) {
        // Optional: show welcome bonus info if provided by backend
        if (response?.welcomeBonus && Number(response.welcomeBonus) > 0) {
          try {
            // Keep it lightweight without adding dependencies
            alert(`Välkommen! Du fick +${response.welcomeBonus} mynt i välkomstbonus.`);
          } catch (e) {
            // no-op if alerts are blocked
          }
        }

        setAuthData(response.user, response.access_token);
        navigate('/dashboard', { replace: true });
        return;
      }
      // Fallback: attempt login
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
    updateField('sex', sex);
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
                <label className="block text-sm font-medium text-gray-700 mb-2">First name</label>
                <motion.input
                  type="text"
                  placeholder="Enter your first name"
                  className={`w-full px-4 py-3 rounded-xl glass-effect border-2 ${
                    fieldErrors.firstName ? 'border-red-400' : 'border-white/30'
                  } focus:border-rose-400 focus:ring-2 focus:ring-rose-200 placeholder-gray-500 text-gray-800 transition-all hover-lift`}
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  whileFocus={{ scale: 1.02 }}
                  required
                />
                {fieldErrors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last name</label>
                <motion.input
                  type="text"
                  placeholder="Enter your last name"
                  className={`w-full px-4 py-3 rounded-xl glass-effect border-2 ${
                    fieldErrors.lastName ? 'border-red-400' : 'border-white/30'
                  } focus:border-rose-400 focus:ring-2 focus:ring-rose-200 placeholder-gray-500 text-gray-800 transition-all hover-lift`}
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  whileFocus={{ scale: 1.02 }}
                  required
                />
                {fieldErrors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('username')}</label>
                <motion.input
                  type="text"
                  placeholder={t('chooseUsername')}
                  className={`w-full px-4 py-3 rounded-xl glass-effect border-2 ${
                    fieldErrors.username ? 'border-red-400' : 'border-white/30'
                  } focus:border-rose-400 focus:ring-2 focus:ring-rose-200 placeholder-gray-500 text-gray-800 transition-all hover-lift`}
                  value={formData.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  whileFocus={{ scale: 1.02 }}
                  required
                />
                {fieldErrors.username && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('email')}</label>
                <motion.input
                  type="email"
                  placeholder={t('enterEmail')}
                  className={`w-full px-4 py-3 rounded-xl glass-effect border-2 ${
                    fieldErrors.email ? 'border-red-400' : 'border-white/30'
                  } focus:border-rose-400 focus:ring-2 focus:ring-rose-200 placeholder-gray-500 text-gray-800 transition-all hover-lift`}
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  whileFocus={{ scale: 1.02 }}
                  required
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('dateOfBirth')}</label>
              <motion.input
                type="date"
                className={`w-full px-4 py-3 rounded-xl glass-effect border-2 ${
                  fieldErrors.dateOfBirth ? 'border-red-400' : 'border-white/30'
                } focus:border-rose-400 focus:ring-2 focus:ring-rose-200 text-gray-600 transition-all hover-lift`}
                value={formData.dateOfBirth}
                onChange={(e) => updateField('dateOfBirth', e.target.value)}
                whileFocus={{ scale: 1.02 }}
                required
              />
              {fieldErrors.dateOfBirth && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.dateOfBirth}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
              <motion.select
                className={`w-full px-4 py-3 rounded-xl glass-effect border-2 ${
                  fieldErrors.region ? 'border-red-400' : 'border-white/30'
                } focus:border-rose-400 focus:ring-2 focus:ring-rose-200 text-gray-800 transition-all hover-lift bg-white/70`}
                value={formData.region}
                onChange={(e) => updateField('region', e.target.value)}
                whileFocus={{ scale: 1.02 }}
                required
              >
                <option value="">Select your region</option>
                {SWEDISH_REGION_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </motion.select>
              {fieldErrors.region && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.region}</p>
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('chooseGender')}</h3>
            
            <div className="flex justify-center gap-6">
              <motion.button
                type="button"
                onClick={() => handleSexSelection('male')}
                className={`p-6 rounded-2xl transition-all duration-300 flex flex-col items-center gap-3 font-medium ${
                  formData.sex === 'male'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-2xl scale-110 transform hover:scale-105 hover:-translate-y-1 focus:ring-4 focus:ring-blue-500/50'
                    : 'glass-effect text-gray-600 hover:bg-blue-50 border border-white/30'
                }`}
                whileHover={{ scale: formData.sex === 'male' ? 1.1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MaleIcon />
                <span className="text-lg">{t('male')}</span>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => handleSexSelection('female')}
                className={`p-6 rounded-2xl transition-all duration-300 flex flex-col items-center gap-3 font-medium ${
                  formData.sex === 'female'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-2xl scale-110 transform hover:scale-105 hover:-translate-y-1 focus:ring-4 focus:ring-pink-500/50'
                    : 'glass-effect text-gray-600 hover:bg-pink-50 border border-white/30'
                }`}
                whileHover={{ scale: formData.sex === 'female' ? 1.1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FemaleIcon />
                <span className="text-lg">{t('female')}</span>
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
                onChange={(e) => updateField('password', e.target.value)}
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
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                whileFocus={{ scale: 1.02 }}
                required
              />
              {fieldErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Describe yourself</label>
              <motion.textarea
                placeholder="Share a short description"
                className={`w-full px-4 py-3 rounded-xl glass-effect border-2 ${
                  fieldErrors.description ? 'border-red-400' : 'border-white/30'
                } focus:border-rose-400 focus:ring-2 focus:ring-rose-200 placeholder-gray-500 text-gray-800 transition-all min-h-[120px] hover-lift`}
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                whileFocus={{ scale: 1.02 }}
                required
              />
              {fieldErrors.description && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
              <motion.input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className={`w-full px-4 py-3 rounded-xl glass-effect border-2 ${
                  fieldErrors.profilePhoto ? 'border-red-400' : 'border-white/30'
                } focus:border-rose-400 focus:ring-2 focus:ring-rose-200 text-gray-800 transition-all hover-lift bg-white/80`}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    updateField('profilePhoto', '');
                    setPhotoPreview('');
                    return;
                  }
                  if (file.size > 2 * 1024 * 1024) {
                    updateField('profilePhoto', '');
                    setFieldErrors(prev => ({ ...prev, profilePhoto: 'Please upload an image smaller than 2MB' }));
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = typeof reader.result === 'string' ? reader.result : '';
                    updateField('profilePhoto', result);
                    setPhotoPreview(result);
                  };
                  reader.readAsDataURL(file);
                }}
              />
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="w-20 h-20 rounded-full object-cover mt-3 border border-rose-200"
                />
              )}
              {fieldErrors.profilePhoto && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.profilePhoto}</p>
              )}
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 rounded border border-rose-200"
                checked={formData.acceptPolicy}
                onChange={(e) => updateField('acceptPolicy', e.target.checked)}
              />
              <p className="text-sm text-gray-600">
                I have read and accept the{' '}
                <button
                  type="button"
                  className="text-rose-600 hover:underline"
                  onClick={() => window.open('/privacy', '_blank', 'noopener')}
                >
                  user policy
                </button>
                .
              </p>
            </div>
            {fieldErrors.acceptPolicy && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.acceptPolicy}</p>
            )}

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
                    updateField('referral_code', e.target.value.trim());
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

            {/* reCAPTCHA Component - Better positioned in step 3 */}
            <div className="mt-8 mb-6 w-full overflow-hidden">
              <div className="flex justify-center px-2 w-full">
                <div className="recaptcha-mobile-wrapper">
                  <RecaptchaComponent
                    onVerify={handleRecaptchaVerify}
                    onExpire={handleRecaptchaExpire}
                    onError={handleRecaptchaError}
                    theme="light"
                    size="normal"
                  />
                </div>
              </div>
              {/* reCAPTCHA Error Display */}
              {recaptchaError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 px-4"
                >
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-red-600 text-center text-sm flex items-center justify-center gap-2">
                      ⚠️ {recaptchaError}
                    </p>
                  </div>
                </motion.div>
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
      title={t('joinHetaSinglarTitle')} 
      subtitle={t('createAccountFindLove')}
    >
      {/* Registration Form */}
      <>
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
                  (currentStep === 1 && (!formData.username || !formData.email || !formData.dateOfBirth || !formData.firstName || !formData.lastName || !formData.region)) ||
                  (currentStep === 2 && !formData.sex)
                }
                className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Next
              </motion.button>
            ) : (
              <motion.button
                type="submit"
                disabled={loading || !recaptchaToken}
                className="flex-1 py-3 bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 text-white rounded-xl font-bold shadow-2xl hover:shadow-rose-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:-translate-y-1 focus:ring-4 focus:ring-rose-500/50"
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
      </>
    </AuthLayout>
  );
};

export default RegisterPage;
