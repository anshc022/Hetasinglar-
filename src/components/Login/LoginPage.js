import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/api';
import RecaptchaComponent from '../common/RecaptchaComponent';
import '../Auth/AuthStyles.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaError, setRecaptchaError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRecaptchaError('');
    setLoading(true);

    // Validate reCAPTCHA
    if (!recaptchaToken) {
      setRecaptchaError('Please complete the reCAPTCHA verification');
      setLoading(false);
      return;
    }

    try {
      const response = await auth.login(formData.email, formData.password, recaptchaToken);
      localStorage.setItem('token', response.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      // Reset reCAPTCHA on error
      setRecaptchaToken('');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Welcome Back</h1>
        <p className="age-disclaimer">
          You must be 18+ to access this platform
        </p>
        {error && <div className="error-message">{error}</div>}
        {recaptchaError && <div className="error-message">{recaptchaError}</div>}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              minLength="8"
            />
          </div>
          
          {/* reCAPTCHA Component */}
          <div className="form-group recaptcha-group" style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
            <RecaptchaComponent
              onVerify={handleRecaptchaVerify}
              onExpire={handleRecaptchaExpire}
              onError={handleRecaptchaError}
              theme="light"
              size="normal"
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading || !recaptchaToken}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="auth-links">
          <a href="/auth/register">Create Account</a>
          <a href="/auth/forgot-password">Forgot Password?</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
