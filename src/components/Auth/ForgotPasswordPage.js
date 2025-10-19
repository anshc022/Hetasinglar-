import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import config from '../../config/environment';
import { useSwedishTranslation } from '../../utils/swedishTranslations';
import './AuthStyles.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { t } = useSwedishTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${config.API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSent(true);
      } else {
        setError(data.message || t('failedToSendResetEmail'));
      }
    } catch (err) {
      setError(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title={t('emailSent')}
        subtitle={t('checkInboxForInstructions')}
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
              {t('sentResetInstructionsTo')}
            </p>
            <p className="font-semibold text-rose-600 bg-rose-50 px-4 py-2 rounded-lg">
              {email}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800 text-sm">
              <strong>{t('whatsNext')}</strong><br/>
              {t('resetSteps').split('\\n').map((step, index) => (
                <React.Fragment key={index}>
                  {step}<br/>
                </React.Fragment>
              ))}
            </p>
          </div>

          <div className="space-y-4">
            <motion.button
              onClick={() => {
                setSent(false);
                setEmail('');
                setError('');
              }}
              className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('sendAnotherResetEmail')}
            </motion.button>

            <Link
              to="/login"
              className="block w-full py-3 bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 text-white text-center rounded-xl font-bold hover:shadow-lg transition-all"
            >
              {t('backToLogin')}
            </Link>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('forgotPasswordTitle')}
      subtitle={t('forgotPasswordSubtitle')}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
            {t('emailAddress')}
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={t('enterEmailAddress')}
            required
            disabled={loading}
          />
          <p className="text-sm text-gray-500 mt-2">
            {t('sendResetLink')}
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
          disabled={loading || !email.trim()}
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
              <span>{t('sendingResetEmail')}</span>
            </div>
          ) : (
            <span className="flex items-center justify-center gap-2">
              {t('sendResetEmail')}
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
          {t('rememberPassword')}{' '}
          <Link
            to="/login"
            className="text-rose-600 hover:text-rose-700 font-semibold hover:underline transition-colors"
          >
            {t('backToLoginLink')}
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
