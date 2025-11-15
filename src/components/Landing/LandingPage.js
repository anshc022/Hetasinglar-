import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSwedishTranslation } from '../../utils/swedishTranslations';
import Footer from '../Layout/Footer';
import { auth } from '../../services/api';
import './LandingPage.css';

const HeartIcon = ({ className = "w-8 h-8" }) => (
  <svg className={`${className} text-rose-400`} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const StarIcon = () => (
  <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const CheckIcon = () => (
  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const sanitizeReferralCode = (value = '') => value.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 50);

const FloatingShape = ({ className, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full mix-blend-multiply filter blur-xl opacity-15 ${className}`}
    animate={{
      y: [0, 50, 0],
      x: [0, 30, 0],
      scale: [1, 1.3, 1],
      rotate: [0, 180, 360],
    }}
    transition={{
      duration: 12 + delay,
      repeat: Infinity,
      ease: "easeInOut",
      delay: delay
    }}
  />
);

const TestimonialCard = ({ name, image, rating, text, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-effect rounded-2xl p-6 shadow-xl border border-white/40 hover-lift flex-shrink-0 w-80 mx-4"
  >
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 flex items-center justify-center">
        <span className="text-white font-bold text-lg">{name[0]}</span>
      </div>
      <div>
        <h4 className="font-semibold text-gray-800">{name}</h4>
        <div className="flex gap-1">
          {[...Array(rating)].map((_, i) => (
            <StarIcon key={i} />
          ))}
        </div>
      </div>
    </div>
    <p className="text-gray-700 italic">"{text}"</p>
  </motion.div>
);

const ProfileCard = ({ name, delay, onRegister, image }) => {
  const { t } = useSwedishTranslation();
  
  return (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover-lift group cursor-pointer w-64"
    whileHover={{ scale: 1.02, y: -5 }}
  >
    {/* Profile Image */}
    <div className="relative">
      <div className="w-full h-80 bg-gray-200 overflow-hidden">
        {image ? (
          <img 
            src={image} 
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-4xl">
            {name[0]}
          </div>
        )}
      </div>
      {/* Online indicator */}
      <div className="absolute top-3 right-3 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-md animate-pulse"></div>
    </div>
    
    {/* Profile Info */}
    <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center">
      {/* Name */}
      <h3 className="text-xl font-bold mb-1">{name}</h3>
      
      {/* Status */}
      <div className="flex items-center justify-center gap-2 text-white/90">
        <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium">{t('activeNow')}</span>
      </div>
    </div>

    {/* Hover overlay with action button */}
    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
      <motion.button
        className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold 
          shadow-lg hover:shadow-xl transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onRegister && onRegister()}
      >
        {t('sayHi')} 👋
      </motion.button>
    </div>
  </motion.div>
  );
};

// Inline authentication panel (Login + Register + OTP verify) embedded into landing hero
const InlineAuthPanel = ({ onClose, referralCode = '', onReferralChange, isReferralPrefilled }) => {
  const { t } = useSwedishTranslation();
  const { login, setAuthData } = require('../context/AuthContext').useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'verify'
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    dateOfBirth: '',
    sex: ''
  });
  // OTP flow removed
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const resetMessages = () => { setError(null); setInfo(null); };

  const handleReferralInput = (value) => {
    if (typeof onReferralChange === 'function') {
      onReferralChange(value);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!form.username || !form.password) {
      setError(t('loginFailed')); return;
    }
    try {
      setLoading(true);
      const res = await login(form.username, form.password);
      navigate('/dashboard');
      onClose && onClose();
    } catch (err) {
      setError(err?.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!form.username || !form.email || !form.password) {
      setError('Username, email & password required'); return;
    }
    try {
      setLoading(true);
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        dateOfBirth: form.dateOfBirth || undefined,
        sex: form.sex || undefined
      };
      const trimmedReferral = referralCode ? referralCode.trim() : '';
      if (trimmedReferral) {
        payload.referral_code = trimmedReferral;
      }
      const res = await auth.register(payload);
      // Direct registration: if token returned, log in immediately
      if (res?.access_token && res?.user) {
        setAuthData(res.user, res.access_token);
        navigate('/dashboard');
        onClose && onClose();
        return;
      }
      // Fallback: switch to login
      setInfo('Registered successfully');
      setMode('login');
    } catch (err) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // OTP verify/resend removed

  const commonInputClasses = "w-full px-4 py-3 rounded-xl bg-white/80 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition text-gray-800 placeholder-gray-400";

  return (
    <div className="relative max-w-xl mx-auto mt-10">
      <div className="absolute -inset-1 bg-gradient-to-r from-rose-400 via-pink-500 to-fuchsia-500 rounded-3xl opacity-30 blur"></div>
      <div className="relative rounded-3xl bg-white/90 backdrop-blur-xl p-8 shadow-2xl border border-white/40">
        {/* Tabs */}
        <div className="flex justify-between mb-6">
          <button
            className={`flex-1 py-3 font-semibold rounded-xl mr-2 transition ${mode==='login' ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => { setMode('login'); resetMessages(); }}
            aria-selected={mode==='login'}
          >{t('login')}</button>
          <button
            className={`flex-1 py-3 font-semibold rounded-xl ml-2 transition ${mode==='register' ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => { setMode('register'); resetMessages(); }}
            aria-selected={mode==='register'}
          >{t('joinNow')}</button>
        </div>

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4" aria-label="Login form">
            <input
              name="username"
              autoComplete="username"
              placeholder={t('usernameOrEmail')}
              className={commonInputClasses}
              value={form.username}
              onChange={handleChange}
            />
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder={t('password')}
              className={commonInputClasses}
              value={form.password}
              onChange={handleChange}
            />
            {error && <div className="text-rose-600 text-sm font-medium" role="alert">{error}</div>}
            {info && <div className="text-green-600 text-sm font-medium" role="status">{info}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-60"
            >{loading ? t('signingIn') : t('signIn')}</button>
            <div className="text-center text-sm text-gray-600">
              <button type="button" onClick={() => navigate('/forgot-password')} className="text-rose-600 hover:underline">
                {t('forgotPassword')}
              </button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4" aria-label="Registration form">
            <input
              name="username"
              placeholder={t('chooseUsername')}
              className={commonInputClasses}
              value={form.username}
              onChange={handleChange}
            />
            <input
              name="email"
              type="email"
              placeholder={t('enterEmail')}
              className={commonInputClasses}
              value={form.email}
              onChange={handleChange}
            />
            <input
              name="password"
              type="password"
              placeholder={t('enterPassword')}
              className={commonInputClasses}
              value={form.password}
              onChange={handleChange}
            />
            <div className="flex gap-4">
              <input
                name="dateOfBirth"
                type="date"
                className={`${commonInputClasses} flex-1`}
                value={form.dateOfBirth}
                onChange={handleChange}
              />
              <select
                name="sex"
                className={`${commonInputClasses} flex-1`}
                value={form.sex}
                onChange={handleChange}
              >
                <option value="">{t('chooseGender')}</option>
                <option value="male">{t('male')}</option>
                <option value="female">{t('female')}</option>
              </select>
            </div>
            {error && <div className="text-rose-600 text-sm font-medium" role="alert">{error}</div>}
            {info && <div className="text-green-600 text-sm font-medium" role="status">{info}</div>}
            <div>
              <div className="relative">
                <input
                  name="referral_code"
                  placeholder="Referral code (optional)"
                  className={commonInputClasses}
                  value={referralCode}
                  onChange={(e) => handleReferralInput(e.target.value)}
                />
                {referralCode && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg">✓</span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Have a referral code? Enter it now and we will apply it automatically.
              </p>
              {isReferralPrefilled && referralCode && (
                <p className="text-green-600 text-xs font-semibold mt-1">
                  Referral code {referralCode} applied automatically! 🎉
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-60"
            >{loading ? t('sending') : t('joinNow')}</button>
          </form>
        )}

        {/* OTP verify UI removed */}

        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
          aria-label="Close auth panel"
        >×</button>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useSwedishTranslation();
  const scrollRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [isReferralPrefilled, setIsReferralPrefilled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refParam = params.get('ref');
    if (!refParam) {
      return;
    }
    const sanitized = sanitizeReferralCode(refParam);
    if (!sanitized) {
      return;
    }
    setReferralCode(prev => (prev === sanitized ? prev : sanitized));
    setIsReferralPrefilled(true);
    auth.trackAffiliateClick(sanitized).catch(() => {});
  }, [location.search]);

  const handleReferralChange = (value) => {
    setReferralCode(sanitizeReferralCode(value));
    setIsReferralPrefilled(false);
  };

  const handleRegisterNavigation = () => {
    const trimmed = referralCode.trim();
    const query = trimmed ? `?ref=${encodeURIComponent(trimmed)}` : '';
    navigate(`/register${query}`);
  };

  const profiles = [
    { name: 'Astrid', image: '/landing-img/5ac8806f-e80e-4af9-92cc-e37b9fbf0fed.jpg' },
    { name: 'Ingrid', image: '/landing-img/7ed1154c-b35d-4c57-8b68-2ffe1d143a16.jpg' },
    { name: 'Linnea', image: '/landing-img/136a8039-eef3-41b3-ab30-0126bc6fc765.jpg' },
    { name: 'Maja', image: '/landing-img/942730c6-4909-4c40-89ef-fbf682938170.jpg' },
    { name: 'Saga', image: '/landing-img/95dbfe18-a2ee-47da-b326-870b1c22db6e.jpg' },
    { name: 'Elin', image: '/landing-img/ae1343ca-1367-453a-8628-7a2bea97ffac.jpg' },
    { name: 'Elsa', image: '/landing-img/b971d777-91ee-4186-9ed5-cccb3f036be6.jpg' },
    { name: 'Wilma', image: '/landing-img/e65a4651-5ce3-404e-9680-c7ddeba266be.jpg' },
    { name: 'Alva', image: '/landing-img/e92b3e30-b1b9-4fa7-99e6-38ffd4ce39bd.jpg' },
    { name: 'Ebba', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face' },
    { name: 'Vera', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=600&fit=crop&crop=face' },
    { name: 'Klara', image: 'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=400&h=600&fit=crop&crop=face' }
  ];

  const testimonials = [
    {
      name: "Anna Lindberg",
      rating: 5,
      text: t('testimonial1')
    },
    {
      name: "Erik Svensson",
      rating: 5,
      text: t('testimonial2')
    },
    {
      name: "Maria Johansson",
      rating: 5,
      text: t('testimonial3')
    },
    {
      name: "Lars Andersson", 
      rating: 5,
      text: t('testimonial4')
    },
    {
      name: "Lisa Anderson",
      rating: 5,
      text: "Amazing experience! The quality of matches and the platform itself exceeded all my expectations."
    },
    {
      name: "David Kim",
      rating: 5,
      text: "Finally, a dating platform that actually works! Met the love of my life here. Couldn't be happier!"
    }
  ];

  // Duplicate profiles for infinite scroll effect
  const infiniteProfiles = [...profiles, ...profiles];

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollSpeed = 1; // pixels per frame
    let animationId;
    let isPaused = false;

    const autoScroll = () => {
      if (!isPaused && scrollContainer) {
        scrollContainer.scrollLeft += scrollSpeed;
        
        // Reset scroll position when we've scrolled through first set
        const cardWidth = 280; // 256px width + 24px gap
        const totalWidth = profiles.length * cardWidth;
        
        if (scrollContainer.scrollLeft >= totalWidth) {
          scrollContainer.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(autoScroll);
    };

    // Start auto-scroll
    animationId = requestAnimationFrame(autoScroll);

    // Pause on hover
    const handleMouseEnter = () => { isPaused = true; };
    const handleMouseLeave = () => { isPaused = false; };

    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (scrollContainer) {
        scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
        scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [profiles.length]);

  // Auto-scrolling testimonials
  useEffect(() => {
    const scrollContainer = testimonialsRef.current;
    if (!scrollContainer) return;

    let scrollSpeed = 0.8; // slower speed for testimonials
    let animationId;
    let isPaused = false;

    const autoScroll = () => {
      if (!isPaused && scrollContainer) {
        scrollContainer.scrollLeft += scrollSpeed;
        
        // Reset scroll position when we've scrolled through first set
        const cardWidth = 400; // estimated testimonial card width + gap
        const totalWidth = testimonials.length * cardWidth;
        
        if (scrollContainer.scrollLeft >= totalWidth) {
          scrollContainer.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(autoScroll);
    };

    // Start auto-scroll
    animationId = requestAnimationFrame(autoScroll);

    // Pause on hover
    const handleMouseEnter = () => { isPaused = true; };
    const handleMouseLeave = () => { isPaused = false; };

    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (scrollContainer) {
        scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
        scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [testimonials.length]);

  const features = [
    {
      icon: "💕",
      title: "Smart Matching",
      description: "Find your perfect match by browsing profiles and connecting with people who share your interests."
    },
    {
      icon: "🔒",
      title: "Safe & Secure",
      description: "Your privacy and safety are our top priority with end-to-end encryption and verified profiles."
    },
    {
      icon: "💬",
      title: "Instant Chat",
      description: "Connect instantly with real-time messaging, voice calls, and video chats with your matches."
    },
    {
      icon: "🌟",
      title: "Premium Experience",
      description: "Enjoy ad-free browsing, unlimited likes, and exclusive features for premium members."
    }
  ];

  // Auto-scrolling testimonials ref
  const testimonialsRef = useRef(null);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-rose-50 to-pink-50">
      {/* Enhanced Background */}
      <div className="fixed inset-0 -z-10">
        {/* Clean Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-rose-50/60 to-pink-100/70"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-rose-100/40"></div>

        {/* Dynamic Floating Shapes */}
        <FloatingShape className="bg-gradient-to-r from-rose-400 to-pink-400 w-96 h-96 -top-48 -left-48" delay={0} />
        <FloatingShape className="bg-gradient-to-r from-pink-300 to-rose-300 w-80 h-80 top-1/3 -right-40" delay={2} />
        <FloatingShape className="bg-gradient-to-r from-red-300 to-rose-400 w-64 h-64 bottom-20 left-1/4" delay={4} />
        <FloatingShape className="bg-gradient-to-r from-purple-300 to-pink-300 w-48 h-48 top-1/2 left-1/2" delay={6} />
        
        {/* Floating Hearts with SVG */}
        <motion.div
          className="absolute top-1/4 right-1/4"
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <img 
            src="/img/Heart.svg" 
            alt="Heart" 
            className="w-16 h-16 text-rose-400 opacity-70"
          />
        </motion.div>
        <motion.div
          className="absolute bottom-1/3 left-1/3"
          animate={{ y: [0, -15, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 2 }}
        >
          <img 
            src="/img/Heart.svg" 
            alt="Heart" 
            className="w-20 h-20 text-rose-400 opacity-60"
          />
        </motion.div>
        <motion.div
          className="absolute top-2/3 right-1/3"
          animate={{ y: [0, -25, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay: 1 }}
        >
          <img 
            src="/img/Heart.svg" 
            alt="Heart" 
            className="w-12 h-12 text-pink-400 opacity-50"
          />
        </motion.div>
      </div>

      {/* Combined Navigation + Hero Section */}
      <section className="relative z-10 min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900">
        {/* Navigation */}
        <div className="relative z-20 p-4 md:p-6">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-full px-4 md:px-8 py-3 md:py-4 flex items-center justify-between border border-white/20 shadow-xl"
            >
              {/* Logo */}
              <motion.div
                className="flex items-center gap-2 md:gap-3"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <HeartIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                <span className="font-rouge text-xl md:text-3xl bg-gradient-to-r from-white via-pink-200 to-rose-200 bg-clip-text text-transparent">
                  HetaSinglar
                </span>
              </motion.div>
              
              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-8">
                <a href="#features" className="text-white/90 hover:text-white font-medium transition-colors">
                  {t('features')}
                </a>
                <a href="#testimonials" className="text-white/90 hover:text-white font-medium transition-colors">
                  {t('reviews')}
                </a>
                <button 
                  onClick={() => navigate('/pricing')} 
                  className="text-white/90 hover:text-white font-medium transition-colors"
                >
                  {t('pricing')}
                </button>
              </div>

              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center gap-2 md:gap-4">
                <motion.button
                  onClick={() => navigate('/login')}
                  className="px-3 md:px-6 py-2 text-white/90 hover:text-white font-semibold transition-colors text-sm md:text-base"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('login')}
                </motion.button>
                <motion.button
                  onClick={handleRegisterNavigation}
                  className="px-3 md:px-6 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold 
                    shadow-lg hover:shadow-xl transition-shadow text-sm md:text-base"
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('joinNow')}
                </motion.button>
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-white/90 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </motion.button>
            </motion.div>

            {/* Mobile Menu */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ 
                opacity: isMobileMenuOpen ? 1 : 0, 
                height: isMobileMenuOpen ? 'auto' : 0 
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden mt-4"
            >
              {isMobileMenuOpen && (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                  {/* Mobile Navigation Links */}
                  <div className="flex flex-col space-y-4 mb-6">
                    <a 
                      href="#features" 
                      className="text-white/90 hover:text-white font-medium transition-colors py-2 border-b border-white/20"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('features')}
                    </a>
                    <a 
                      href="#testimonials" 
                      className="text-white/90 hover:text-white font-medium transition-colors py-2 border-b border-white/20"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('reviews')}
                    </a>
                    <button 
                      onClick={() => {
                        navigate('/pricing');
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-left text-white/90 hover:text-white font-medium transition-colors py-2 border-b border-white/20"
                    >
                      {t('pricing')}
                    </button>
                  </div>

                  {/* Mobile Auth Buttons */}
                  <div className="flex flex-col space-y-3">
                    <motion.button
                      onClick={() => {
                        navigate('/login');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full py-3 text-white/90 hover:text-white font-semibold transition-colors border border-white/30 rounded-xl"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {t('login')}
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        handleRegisterNavigation();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold 
                        shadow-lg hover:shadow-xl transition-shadow"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {t('joinNow')}
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-6 text-center pt-12 pb-32">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute top-32 left-20 w-40 h-40 flex items-center justify-center"
              animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 12, repeat: Infinity }}
            >
              <img 
                src="/img/Heart.svg" 
                alt="Heart" 
                className="w-32 h-32 opacity-40 filter blur-sm"
                style={{ filter: 'hue-rotate(270deg) saturate(0.8)' }}
              />
            </motion.div>
            <motion.div
              className="absolute bottom-32 right-20 w-48 h-48 flex items-center justify-center"
              animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
              transition={{ duration: 15, repeat: Infinity }}
            >
              <img 
                src="/img/Heart.svg" 
                alt="Heart" 
                className="w-40 h-40 opacity-30 filter blur-sm"
                style={{ filter: 'hue-rotate(320deg) saturate(1.2)' }}
              />
            </motion.div>
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 flex items-center justify-center"
              animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 8, repeat: Infinity }}
            >
              <img 
                src="/img/Heart.svg" 
                alt="Heart" 
                className="w-28 h-28 filter blur-sm"
                style={{ filter: 'hue-rotate(300deg) saturate(1.5)' }}
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto space-y-8 relative z-10"
          >
            <motion.h1
              className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-white via-pink-200 to-rose-200 
                bg-clip-text text-transparent leading-tight"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              {t('heroTitle')}
            </motion.h1>
            
            <motion.p
              className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {t('heroSubtitle')}
            </motion.p>

            {/* Inline authentication panel replaces separate CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <InlineAuthPanel
                referralCode={referralCode}
                onReferralChange={handleReferralChange}
                isReferralPrefilled={isReferralPrefilled}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Find Your Flirt Section */}
      <section id="features" className="relative z-10 py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-gray-800 mb-6">
              {t('findYourFlirt')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Newly Registered Women
            </p>
          </motion.div>

          {/* Women Profiles Auto-Scrolling Carousel */}
          <div className="relative">
            <div 
              ref={scrollRef}
              className="flex gap-6 overflow-x-hidden pb-4" 
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitScrollbar: { display: 'none' }
              }}
            >
              {infiniteProfiles.map((profile, index) => (
                <div key={`${profile.name}-${index}`} className="flex-shrink-0">
                  <ProfileCard
                    name={profile.name}
                    image={profile.image}
                    delay={0} // Remove staggered animation for auto-scroll
                    onRegister={handleRegisterNavigation}
                  />
                </div>
              ))}
            </div>
            
            <style jsx>{`
              .flex::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="text-center mt-16"
          >
            <motion.button
                onClick={handleRegisterNavigation}
              className="px-12 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xl font-bold 
                rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 btn-glow"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center gap-3">
                Meet More Women
                <HeartIcon className="w-6 h-6" />
              </span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* It All Starts With a Chat Section */}
      <section className="relative z-10 py-32 bg-gradient-to-br from-purple-900 via-pink-900 to-red-900">
        <div className="container mx-auto px-6">
          {/* Background decorative hearts */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute top-20 left-10 w-32 h-32 bg-purple-600/30 rounded-full"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-20 right-10 w-40 h-40 bg-pink-600/30 rounded-full"
              animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
              transition={{ duration: 10, repeat: Infinity }}
            />
          </div>

          {/* Section Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-white mb-8">
              It all starts with a chat
            </h2>
          </motion.div>

          {/* Two Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Card 1 - Dating Site */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-center text-white shadow-2xl relative overflow-hidden"
            >
              {/* Top corner accent */}
              <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-400 transform rotate-45 -translate-x-8 -translate-y-8"></div>
              
              {/* Heart icon with character */}
              <div className="mb-6">
                <div className="relative mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  {/* Character inside heart */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">😊</span>
                  </div>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-4">
                One of Sweden's best<br />dating sites
              </h3>
            </motion.div>

            {/* Card 2 - Easy Flirting */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-center text-white shadow-2xl relative overflow-hidden"
            >
              {/* Top corner accent */}
              <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-400 transform rotate-45 -translate-x-8 -translate-y-8"></div>
              
              {/* Heart icon with laptop */}
              <div className="mb-6">
                <div className="relative mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  {/* Laptop icon inside heart */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
                    </svg>
                  </div>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-4">
                Finding a flirt has never<br />been so easy before
              </h3>
            </motion.div>
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-16"
          >
            <motion.button
              onClick={handleRegisterNavigation}
              className="px-12 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xl font-bold 
                rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center gap-3">
                Start Chatting Today
                <HeartIcon className="w-6 h-6" />
              </span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-gray-800 mb-6">
              {t('peopleLove')} <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">HetaSinglar</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Testimonials
            </p>
          </motion.div>

          {/* Horizontal Scrolling Testimonials */}
          <div className="relative">
            <div 
              ref={testimonialsRef}
              className="flex overflow-x-auto scrollbar-hide gap-6 pb-4"
              style={{ 
                scrollBehavior: 'smooth',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {/* Duplicate testimonials for infinite scroll */}
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <TestimonialCard
                  key={`${testimonial.name}-${index}`}
                  name={testimonial.name}
                  rating={testimonial.rating}
                  text={testimonial.text}
                  delay={0}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

  {/* Professional Access Portals removed by request */}

      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default LandingPage;
