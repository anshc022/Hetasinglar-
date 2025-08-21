import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const HeartIcon = ({ className = "w-8 h-8" }) => (
  <svg className={`${className} text-rose-400`} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const CheckIcon = () => (
  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

const PricingPage = () => {
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
          <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-rose-50/80 to-pink-100/90"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-rose-100/50"></div>
        </motion.div>

        {/* Dynamic Floating Shapes */}
        <FloatingShape className="bg-gradient-to-r from-rose-400 to-pink-400 w-96 h-96 -top-48 -left-48" delay={0} />
        <FloatingShape className="bg-gradient-to-r from-pink-300 to-rose-300 w-80 h-80 top-1/3 -right-40" delay={2} />
        <FloatingShape className="bg-gradient-to-r from-red-300 to-rose-400 w-64 h-64 bottom-20 left-1/4" delay={4} />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 p-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-full px-8 py-4 flex items-center justify-between border border-white/40 shadow-xl"
          >
            <motion.div
              className="flex items-center gap-3 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              onClick={() => navigate('/')}
            >
              <HeartIcon className="w-10 h-10" />
              <span className="font-rouge text-3xl bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                HetaSinglar
              </span>
            </motion.div>
            
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => navigate('/')}
                className="text-gray-700 hover:text-rose-600 font-medium transition-colors"
              >
                Home
              </button>
              <button 
                onClick={() => navigate('/#features')}
                className="text-gray-700 hover:text-rose-600 font-medium transition-colors"
              >
                Features
              </button>
              <span className="text-rose-600 font-medium">
                Pricing
              </span>
            </div>

            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => navigate('/login')}
                className="px-6 py-2 text-gray-700 hover:text-rose-600 font-semibold transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Login
              </motion.button>
              <motion.button
                onClick={() => navigate('/register')}
                className="px-6 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold 
                  shadow-lg hover:shadow-xl transition-shadow"
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
                whileTap={{ scale: 0.95 }}
              >
                Join Now
              </motion.button>
            </div>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <motion.h1
              className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-red-600 
                bg-clip-text text-transparent leading-tight"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Choose Your Plan
            </motion.h1>
            
            <motion.p
              className="text-xl md:text-2xl text-gray-700 leading-relaxed max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Start for free or upgrade to premium for enhanced features and unlimited connections.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="relative z-10 py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            
            {/* Basic Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-effect rounded-2xl p-8 border border-white/40 shadow-xl hover-lift relative"
            >
              <div className="text-center space-y-6">
                <h3 className="text-2xl font-bold text-gray-800">Basic</h3>
                <div className="text-lg font-semibold text-gray-600">No subscription required!</div>
                
                <div className="space-y-4 text-left">
                  <p className="text-gray-700 leading-relaxed">
                    Perfect for those who want to try the service without any commitment.
                  </p>
                  
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3">
                      <CheckIcon />
                      <span className="text-gray-600">Secure one-time payment</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckIcon />
                      <span className="text-gray-600">No hidden fees</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <motion.button
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold 
                      shadow-lg hover:shadow-xl transition-shadow"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/register')}
                  >
                    Explore More
                  </motion.button>
                  
                  <motion.button
                    className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold 
                      shadow-lg hover:shadow-xl transition-shadow"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/register')}
                  >
                    Buy Credits
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-effect rounded-2xl p-8 border border-white/40 shadow-xl hover-lift"
            >
              <div className="text-center space-y-6">
                <h3 className="text-2xl font-bold text-gray-800">Free</h3>
                <div className="text-4xl font-bold text-gray-600">$0</div>
                <ul className="space-y-3 text-left">
                  {[
                    "Basic matching",
                    "5 likes per day",
                    "Limited messaging",
                    "Basic profile"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckIcon />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <motion.button
                  onClick={() => navigate('/register')}
                  className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold 
                    hover:border-gray-400 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Get Started
                </motion.button>
              </div>
            </motion.div>

            {/* Premium Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-effect rounded-2xl p-8 border-2 border-rose-300/50 shadow-xl hover-lift relative"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-bold">
                  Most Popular
                </span>
              </div>
              <div className="text-center space-y-6">
                <h3 className="text-2xl font-bold text-gray-800">Premium</h3>
                <div className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                  $29/mo
                </div>
                <ul className="space-y-3 text-left">
                  {[
                    "Unlimited likes",
                    "Advanced matching",
                    "Unlimited messaging",
                    "Premium features",
                    "No ads",
                    "Read receipts"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckIcon />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <motion.button
                  onClick={() => navigate('/register')}
                  className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold 
                    shadow-lg hover:shadow-xl transition-shadow"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Go Premium
                </motion.button>
              </div>
            </motion.div>

            {/* VIP Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-effect rounded-2xl p-8 border border-white/40 shadow-xl hover-lift"
            >
              <div className="text-center space-y-6">
                <h3 className="text-2xl font-bold text-gray-800">VIP</h3>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  $49/mo
                </div>
                <ul className="space-y-3 text-left">
                  {[
                    "Everything in Premium",
                    "Profile boost",
                    "Super likes",
                    "Priority support",
                    "Advanced filters",
                    "Incognito mode"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckIcon />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <motion.button
                  onClick={() => navigate('/register')}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold 
                    shadow-lg hover:shadow-xl transition-shadow"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Go VIP
                </motion.button>
              </div>
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
                rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 btn-glow"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center gap-3">
                Start Your Journey Today
                <HeartIcon className="w-6 h-6" />
              </span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 bg-gradient-to-t from-white via-rose-50/50 to-transparent">
        <div className="container mx-auto px-6">
          <div className="glass-effect rounded-2xl p-8 border border-white/40 shadow-xl">
            <div className="text-center space-y-8">
              <div className="border-t border-white/30 pt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-center gap-2">
                    <HeartIcon />
                    <span className="font-rouge text-2xl bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                      HetaSinglar
                    </span>
                    <HeartIcon />
                  </div>
                  <p className="text-gray-600 text-sm">
                    Find your perfect match with confidence and ease
                  </p>
                  <p className="text-gray-500 text-xs">
                    © 2024 HetaSinglar. All rights reserved. Made with ❤️ for meaningful connections.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
