class NotificationService {
  constructor() {
    this.listeners = [];
    this.notifications = [];
    this.checkInterval = null;
    this.lastCheck = new Date();
  }

  // Add listener for notifications
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  notifyListeners(notification) {
    this.listeners.forEach(listener => listener(notification));
  }

  // Start checking for new customers
  startMonitoring(agentApi) {
    this.agentApi = agentApi;
    
    // Check immediately
    this.checkNewCustomers();
    
    // Set up interval to check every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkNewCustomers();
    }, 30000);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Check for new customers
  async checkNewCustomers() {
    if (!this.agentApi) return;

    try {
      // Check for customers registered in the last 5 minutes
      const response = await this.agentApi.getNewCustomers({ 
        hours: 0.1 // 6 minutes in hours
      });

      const newCustomers = response.newCustomers || [];
      
      // Filter customers that are newer than our last check
      const recentCustomers = newCustomers.filter(customer => 
        new Date(customer.createdAt) > this.lastCheck
      );

      // Create notifications for new customers
      recentCustomers.forEach(customer => {
        const notification = {
          id: `new-customer-${customer._id}`,
          type: 'new-customer',
          title: 'New Customer Registered!',
          message: `${customer.username} just signed up`,
          customer: customer,
          timestamp: new Date(),
          read: false,
          priority: 'high'
        };

        this.addNotification(notification);
      });

      this.lastCheck = new Date();
    } catch (error) {
      console.error('Error checking for new customers:', error);
    }
  }

  // Add notification
  addNotification(notification) {
    this.notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    // Notify listeners
    this.notifyListeners(notification);

    // Show browser notification if permission granted
    this.showBrowserNotification(notification);
  }

  // Show browser notification
  showBrowserNotification(notification) {
    if (notification.type === 'new-customer' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
              tag: notification.id
            });
          }
        });
      }
    }
  }

  // Get all notifications
  getNotifications() {
    return this.notifications;
  }

  // Get unread notifications
  getUnreadNotifications() {
    return this.notifications.filter(n => !n.read);
  }

  // Mark notification as read
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
  }

  // Clear old notifications (older than 24 hours)
  clearOldNotifications() {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);
    
    this.notifications = this.notifications.filter(n => 
      new Date(n.timestamp) > cutoff
    );
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
