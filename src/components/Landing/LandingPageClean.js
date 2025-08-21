import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
    className="glass-effect rounded-2xl p-6 shadow-xl border border-white/40 hover-lift"
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

const FeatureCard = ({ icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-effect rounded-2xl p-8 text-center shadow-xl border border-white/40 hover-lift group"
  >
    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </motion.div>
);

const LandingPage = () => {
  const navigate = useNavigate();

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

  const testimonials = [
    {
      name: "Sarah Johnson",
      rating: 5,
      text: "I found my soulmate on HetaSinglar! The platform is amazing and the matching system really works."
    },
    {
      name: "Mike Chen",
      rating: 5,
      text: "Best dating app I've ever used. Met my girlfriend here and we're planning our future together!"
    },
    {
      name: "Emma Davis",
      rating: 5,
      text: "The user experience is incredible. Clean, modern interface and genuine people. Highly recommended!"
    }
  ];

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
        <FloatingShape className="bg-gradient-to-r from-purple-300 to-pink-300 w-48 h-48 top-1/2 left-1/2" delay={6} />
        
        {/* Floating Hearts */}
        <motion.div
          className="absolute top-1/4 right-1/4"
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <HeartIcon />
        </motion.div>
        <motion.div
          className="absolute bottom-1/3 left-1/3"
          animate={{ y: [0, -15, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 2 }}
        >
          <HeartIcon />
        </motion.div>
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
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <HeartIcon className="w-10 h-10" />
              <span className="font-rouge text-3xl bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                HetaSinglar
              </span>
            </motion.div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-rose-600 font-medium transition-colors">
                Features
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-rose-600 font-medium transition-colors">
                Reviews
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-rose-600 font-medium transition-colors">
                Pricing
              </a>
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
      <section className="relative z-10 pt-20 pb-32">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <motion.h1
              className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-red-600 
                bg-clip-text text-transparent leading-tight"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Find Your Perfect Match
            </motion.h1>
            
            <motion.p
              className="text-xl md:text-2xl text-gray-700 leading-relaxed max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Join millions of people discovering meaningful connections through our 
              AI-powered matching system. Your soulmate is just a click away.
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
                  Start Dating Today
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
                I Have an Account
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              {[
                { number: "2M+", label: "Active Users" },
                { number: "500K+", label: "Success Stories" },
                { number: "95%", label: "Satisfaction Rate" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="glass-effect rounded-2xl p-6 border border-white/40 shadow-xl"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-gray-800 mb-6">
              Why Choose HetaSinglar?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of online dating with our cutting-edge features designed to help you find meaningful connections.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
              />
            ))}
          </div>
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
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real people, real love stories. See what our community has to say about finding their perfect match.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                name={testimonial.name}
                rating={testimonial.rating}
                text={testimonial.text}
                delay={index * 0.2}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-gray-800 mb-6">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start for free or upgrade to premium for enhanced features and unlimited connections.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
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
              transition={{ delay: 0.2 }}
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
              transition={{ delay: 0.3 }}
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
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 py-32">
        <div className="container mx-auto px-6">
          <div className="glass-effect rounded-3xl p-16 text-center border border-white/40 shadow-2xl max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                Ready to Find Love?
              </h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Join millions of singles who have found their perfect match on HetaSinglar. 
                Your love story starts here.
              </p>
              <motion.button
                onClick={() => navigate('/register')}
                className="group px-16 py-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-2xl font-bold 
                  rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 btn-glow"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center gap-4">
                  Start Chatting Now
                  <HeartIcon />
                </span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="relative z-10 py-12 bg-gradient-to-t from-white via-rose-50/50 to-transparent">
        <div className="container mx-auto px-6">
          <div className="glass-effect rounded-2xl p-8 border border-white/40 shadow-xl">
            <div className="text-center space-y-8">
              {/* Access Portals */}
              <div>
                <motion.h4 
                  className="text-xl font-semibold text-gray-700 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Professional Access Portals
                </motion.h4>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <motion.button
                    onClick={() => navigate('/agent/login')}
                    className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold
                      shadow-xl hover:shadow-2xl transition-all duration-300 btn-glow flex items-center gap-3"
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">👨‍💼</span>
                    <span>Agent Portal</span>
                  </motion.button>

                  <motion.button
                    onClick={() => navigate('/admin/login')}
                    className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl font-semibold
                      shadow-xl hover:shadow-2xl transition-all duration-300 btn-glow flex items-center gap-3"
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">👑</span>
                    <span>Admin Panel</span>
                  </motion.button>
                </div>
              </div>

              {/* Brand and Copyright */}
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

export default LandingPage;
