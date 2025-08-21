import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const FloatingShape = ({ className, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full mix-blend-multiply filter blur-xl opacity-20 ${className}`}
    animate={{
      y: [0, 40, 0],
      x: [0, 20, 0],
      scale: [1, 1.2, 1],
      rotate: [0, 180, 360],
    }}
    transition={{
      duration: 10 + delay,
      repeat: Infinity,
      ease: "easeInOut",
      delay: delay
    }}
  />
);

const HeartIcon = ({ className = "w-6 h-6" }) => (
  <svg className={`${className} text-rose-400`} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const AuthLayout = ({ children, title, subtitle }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-rose-50 to-pink-50">
      {/* Enhanced Background */}
      <div className="fixed inset-0 -z-10">
        {/* Background Image */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2 }}
        >
          <img
            src="/img/pexels-dana-tentis-118658-364382.jpg"
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-rose-50/75 to-pink-100/85"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-rose-100/40"></div>
        </motion.div>

        {/* Floating Shapes */}
        <FloatingShape className="bg-gradient-to-r from-rose-400 to-pink-400 w-96 h-96 -top-48 -left-48" delay={0} />
        <FloatingShape className="bg-gradient-to-r from-pink-300 to-rose-300 w-80 h-80 top-1/3 -right-40" delay={2} />
        <FloatingShape className="bg-gradient-to-r from-red-300 to-rose-400 w-64 h-64 bottom-20 left-1/4" delay={4} />
        <FloatingShape className="bg-gradient-to-r from-purple-300 to-pink-300 w-48 h-48 top-1/2 left-1/2" delay={6} />
        
        {/* Floating Hearts */}
        <motion.div
          className="absolute top-1/4 right-1/4"
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <HeartIcon className="w-8 h-8" />
        </motion.div>
        <motion.div
          className="absolute bottom-1/3 left-1/3"
          animate={{ y: [0, -15, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 2 }}
        >
          <HeartIcon className="w-8 h-8" />
        </motion.div>
      </div>

      {/* Navigation */}
      <motion.nav 
        className="relative z-10 p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo */}
          <motion.div
            className="group cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
          >
            <div className="glass-effect rounded-2xl p-4 shadow-2xl border border-white/30 hover-lift">
              <h1 className="font-rouge text-5xl bg-gradient-to-r from-rose-600 via-pink-500 to-red-500 bg-clip-text text-transparent drop-shadow-lg">
                HetaSinglar
              </h1>
              <p className="text-sm text-gray-600 text-center font-medium mt-1">Find Your Perfect Match</p>
            </div>
          </motion.div>

          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate('/login')}
              className="px-6 py-2 text-gray-700 hover:text-rose-600 font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Sign In
            </motion.button>
            <motion.button
              onClick={() => navigate('/register')}
              className="px-6 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Join Now
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] p-6">
        <div className="w-full max-w-md">
          {/* Title Section */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
            {subtitle && <p className="text-gray-600">{subtitle}</p>}
          </motion.div>

          {/* Form Container */}
          <motion.div
            className="glass-effect rounded-3xl p-8 shadow-2xl border border-white/40"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {children}
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.footer
        className="relative z-10 py-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <HeartIcon className="w-4 h-4" />
          <span className="text-sm">© 2024 HetaSinglar. Made with love for meaningful connections.</span>
          <HeartIcon className="w-4 h-4" />
        </div>
      </motion.footer>
    </div>
  );
};

export default AuthLayout;
