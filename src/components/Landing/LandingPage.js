import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSwedishTranslation } from '../../utils/swedishTranslations';
import Footer from '../Layout/Footer';
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

const ProfileCard = ({ name, delay, navigate, image }) => {
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
        onClick={() => navigate('/register')}
      >
        {t('sayHi')} 👋
      </motion.button>
    </div>
  </motion.div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useSwedishTranslation();
  const scrollRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const profiles = [
    { name: 'Gunilla', image: 'https://images.unsplash.com/photo-1494790108755-2616b612b550?w=400&h=600&fit=crop&crop=face' },
    { name: 'Eva', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face' },
    { name: 'Fanny', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face' },
    { name: 'Bettina', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face' },
    { name: 'Ulrika', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop&crop=face' },
    { name: 'Marianne', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face' },
    { name: 'Malin', image: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=600&fit=crop&crop=face' },
    { name: 'Madeleine', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face' },
    { name: 'Sabrina', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face' },
    { name: 'Julia', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face' },
    { name: 'Emma', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=600&fit=crop&crop=face' },
    { name: 'Sofia', image: 'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=400&h=600&fit=crop&crop=face' }
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
      description: "Our AI-powered algorithm finds your perfect match based on compatibility and shared interests."
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
                  onClick={() => navigate('/register')}
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
                        navigate('/register');
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

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <motion.button
                onClick={() => navigate('/register')}
                className="group px-12 py-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xl font-bold 
                  rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 btn-glow"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center gap-3">
                  {t('startDatingToday')}
                  <HeartIcon />
                </span>
              </motion.button>

              <motion.button
                onClick={() => navigate('/login')}
                className="group px-12 py-6 glass-effect border-2 border-white/40 text-gray-700 text-xl font-bold 
                  rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                {t('iHaveAccount')}
              </motion.button>
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
                    navigate={navigate}
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
              onClick={() => navigate('/register')}
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
              onClick={() => navigate('/register')}
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
