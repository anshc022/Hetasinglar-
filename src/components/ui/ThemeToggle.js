import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// Sun icon for light mode
const SunIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);

// Moon icon for dark mode
const MoonIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const ThemeToggle = ({ className = '', showLabel = false, size = 'default' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  const sizeClasses = {
    small: 'w-10 h-6',
    default: 'w-14 h-7',
    large: 'w-16 h-8'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    default: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDarkMode ? 'Dark' : 'Light'} Mode
        </span>
      )}
      
      <motion.button
        onClick={toggleTheme}
        className={`
          ${sizeClasses[size]} 
          relative rounded-full p-1 transition-all duration-300 ease-in-out
          ${isDarkMode 
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-purple-500/25' 
            : 'bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg shadow-yellow-500/25'
          }
          hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2
          ${isDarkMode ? 'focus:ring-purple-500' : 'focus:ring-yellow-500'}
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className={`
            ${size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-6 h-6' : 'w-5 h-5'}
            bg-white rounded-full shadow-md flex items-center justify-center
            transition-all duration-300 ease-in-out
          `}
          animate={{
            x: isDarkMode 
              ? (size === 'small' ? 16 : size === 'large' ? 24 : 20)
              : 0
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <motion.div
            initial={false}
            animate={{ 
              rotate: isDarkMode ? 360 : 0,
              scale: isDarkMode ? 0.8 : 1
            }}
            transition={{ duration: 0.3 }}
            className={`${isDarkMode ? 'text-indigo-600' : 'text-yellow-600'}`}
          >
            {isDarkMode ? (
              <MoonIcon className={iconSizes[size]} />
            ) : (
              <SunIcon className={iconSizes[size]} />
            )}
          </motion.div>
        </motion.div>
      </motion.button>
    </div>
  );
};

export default ThemeToggle;