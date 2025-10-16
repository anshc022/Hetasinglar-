import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resendOtp } from '../../services/api';
import { useSwedishTranslation } from '../../utils/swedishTranslations';
import AuthLayout from './AuthLayout';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useSwedishTranslation();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowVerificationPrompt(false);

    try {
      await login(formData.username, formData.password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      
      // Check if error is related to email verification
      if (err.message?.includes('email') && err.message?.includes('verif')) {
        setShowVerificationPrompt(true);
        setVerificationEmail(formData.username);
        setError(t('emailNotVerified'));
      } else {
        setError(err.message || t('loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await resendOtp({ email: verificationEmail });
      setError(t('verificationEmailSent'));
    } catch (err) {
      setError(t('verificationEmailFailed'));
    } finally {
      setResendLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <AuthLayout
      title={t('welcomeBack')}
      subtitle={t('signInToContinue')}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username Field */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
            {t('usernameOrEmail')}
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={t('enterUsernameOrEmail')}
            required
            disabled={loading}
          />
        </motion.div>

        {/* Password Field */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
            {t('password')}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={t('enterPassword')}
            required
            disabled={loading}
          />
          {/* Forgot Password Link */}
          <div className="mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-rose-600 hover:text-rose-700 hover:underline transition-colors font-medium"
            >
              {t('forgotPassword')}
            </Link>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl"
          >
            <p className="text-red-600 text-center text-sm flex items-center justify-center gap-2">
              ⚠️ {error}
            </p>
            
            {/* Verification Prompt */}
            {showVerificationPrompt && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-red-200"
              >
                <div className="text-center">
                  <p className="text-red-700 text-sm mb-3">
                    📧 {t('needVerifyEmail')}
                  </p>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {resendLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>{t('sending')}</span>
                      </div>
                    ) : (
                      t('resendVerificationEmail')
                    )}
                  </button>
                  <p className="text-gray-600 text-xs mt-2">
                    {t('or')} <Link to="/register" className="text-red-600 hover:underline">{t('createNewAccount')}</Link>
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={loading}
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
              <span>{t('signingIn')}</span>
            </div>
          ) : (
            <span className="flex items-center justify-center gap-2">
              {t('signIn')} ✨
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
          {t('dontHaveAccount')}{' '}
          <Link
            to="/register"
            className="text-rose-600 hover:text-rose-700 font-semibold hover:underline transition-colors"
          >
            {t('joinHetaSinglar')}
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default LoginPage;
