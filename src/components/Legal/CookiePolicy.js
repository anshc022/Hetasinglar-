import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-lg shadow-xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          {/* Content */}
          <div className="prose max-w-none text-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What are cookies?</h2>
            <p className="mb-6">
              Cookies are small data files that are placed on your computer or mobile device when you 
              visit a website. They are widely used to make websites work more efficiently and to 
              provide information to website owners.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How we use cookies</h2>
            <p className="mb-6">
              We use cookies for several purposes:
            </p>
            <ul className="list-disc ml-6 mb-6">
              <li>Authentication - to remember when you're logged in</li>
              <li>Preferences - to remember your settings and preferences</li>
              <li>Analytics - to understand how visitors use our site</li>
              <li>Performance - to improve site performance and user experience</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Types of cookies we use</h2>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Essential cookies</h3>
              <p className="mb-4">These cookies are necessary for the website to function properly.</p>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Analytics cookies</h3>
              <p className="mb-4">These help us understand how visitors interact with our website.</p>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Functional cookies</h3>
              <p className="mb-4">These enable enhanced functionality and personalization.</p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Managing cookies</h2>
            <p className="mb-6">
              You can control and/or delete cookies as you wish. You can delete all cookies that are 
              already on your computer and you can set most browsers to prevent them from being placed.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="mb-6">
              If you have any questions about our use of cookies, please contact us at cookies@hetasinglar.com
            </p>
          </div>

          {/* Back Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link 
              to="/" 
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CookiePolicy;
