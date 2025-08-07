import React, { useState, useEffect } from 'react';
import { 
  FaBell, 
  FaTimes, 
  FaUser, 
  FaCheck, 
  FaCheckDouble,
  FaTrash,
  FaClock
} from 'react-icons/fa';
import notificationService from '../../services/notificationService';

const NotificationPanel = ({ onNavigateToFirstContact }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load existing notifications
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadNotifications().length);

    // Listen for new notifications
    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    notificationService.addListener(handleNewNotification);

    // Cleanup
    return () => {
      notificationService.removeListener(handleNewNotification);
    };
  }, []);

  const markAsRead = (notificationId) => {
    notificationService.markAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearAll = () => {
    notificationService.clearAll();
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleCustomerClick = (customer) => {
    setIsOpen(false);
    onNavigateToFirstContact && onNavigateToFirstContact(customer);
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new-customer':
        return <FaUser className="text-green-400" />;
      default:
        return <FaBell className="text-blue-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white transition-colors"
      >
        <FaBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                  title="Mark all as read"
                >
                  <FaCheckDouble className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={clearAll}
                className="text-red-400 hover:text-red-300 text-sm"
                title="Clear all"
              >
                <FaTrash className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <FaBell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-700 last:border-b-0 ${
                      !notification.read 
                        ? 'bg-blue-500/10 border-l-4 border-l-blue-500' 
                        : 'hover:bg-gray-700/50'
                    } transition-colors`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium ${
                            !notification.read ? 'text-white' : 'text-gray-300'
                          }`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400 flex items-center">
                              <FaClock className="w-3 h-3 mr-1" />
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-blue-400 hover:text-blue-300"
                                title="Mark as read"
                              >
                                <FaCheck className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        
                        {/* Customer-specific actions */}
                        {notification.type === 'new-customer' && notification.customer && (
                          <div className="mt-2">
                            <button
                              onClick={() => handleCustomerClick(notification.customer)}
                              className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full transition-colors"
                            >
                              Create First Contact
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-700 text-center">
              <span className="text-xs text-gray-400">
                {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
