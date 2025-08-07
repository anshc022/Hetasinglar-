import React, { useState, useEffect } from 'react';

const Notification = ({ message, type = 'info', duration = 4000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose && onClose(), 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-green-500 border-green-600',
    error: 'bg-red-500 border-red-600',
    warning: 'bg-yellow-500 border-yellow-600',
    info: 'bg-blue-500 border-blue-600'
  };

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg border text-white shadow-lg transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${typeStyles[type]}`}
    >
      <div className="flex items-center">
        <span className="mr-2 text-lg">{iconMap[type]}</span>
        <p className="flex-1">{message}</p>
        <button 
          onClick={() => setIsVisible(false)}
          className="ml-2 text-white hover:text-gray-200 focus:outline-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Notification;
