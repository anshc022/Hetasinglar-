import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const ComingSoon = () => {
  const location = useLocation();
  
  const getPageTitle = () => {
    const path = location.pathname;
    switch(path) {
      case '/about': return 'About Us';
      case '/how-it-works': return 'How It Works';
      case '/stories': return 'Success Stories';
      case '/blog': return 'Blog';
      case '/careers': return 'Careers';
      case '/help': return 'Help Center';
      case '/safety': return 'Safety Tips';
      case '/report': return 'Report Issues';
      case '/faq': return 'FAQ';
      case '/terms': return 'Terms of Service';
      case '/guidelines': return 'Community Guidelines';
      case '/data-protection': return 'Data Protection';
      default: return 'Coming Soon';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-lg shadow-xl p-8 text-center"
        >
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Content */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{getPageTitle()}</h1>
          <p className="text-xl text-gray-600 mb-8">Coming Soon!</p>
          
          <div className="mb-8">
            <p className="text-gray-600 mb-4">
              We're working hard to bring you this page. It will be available soon.
            </p>
            <p className="text-sm text-gray-500">
              In the meantime, feel free to explore our other features or contact us if you need assistance.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/" 
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go Home
            </Link>
            <Link 
              to="/contact" 
              className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Us
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ComingSoon;
