import config from '../config/environment';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.messageCallbacks = new Set();
    this.typingCallbacks = new Set();
    this.seenMessages = new Set();
    this.notificationCallbacks = new Set();
    this.presenceCallbacks = new Set();
    this.liveQueueCallbacks = new Set();
  this.outgoingCallbacks = new Set();
    this.activityInterval = null;
    this.userId = null;
    this.currentChatId = null;
    this.isAgent = false;
    this.messageQueue = [];
    this.agentMetadata = null;
    this.connectionPromise = null;
  }

  setUserId(userId) {
    this.userId = userId;
    this.isAgent = userId === 'agent';
    console.log('WebSocket client info set:', { userId, isAgent: this.isAgent });
    this.sendClientInfo();
  }

  setCurrentChatId(chatId) {
    if (this.currentChatId === chatId) {
      return;
    }
    this.currentChatId = chatId;
    this.sendClientInfo();
  }

  identifyAgent(agentData = {}) {
    this.isAgent = true;
    const inferredId = agentData._id || agentData.id || this.userId || 'agent';
    this.userId = inferredId;
    this.agentMetadata = {
      id: agentData._id || agentData.id || inferredId,
      code: agentData.agentId || agentData.agentCode || agentData.code || null,
      name: agentData.name || agentData.fullName || 'Agent'
    };
    this.sendClientInfo();
  }

  sendClientInfo() {
    if (!this.userId) {
      return;
    }

    const payload = {
      type: 'client_info',
      userId: this.userId,
      role: this.isAgent ? 'agent' : 'customer',
      chatId: this.currentChatId || null
    };

    if (this.isAgent && this.agentMetadata) {
      if (this.agentMetadata.id) {
        payload.agentId = this.agentMetadata.id;
      }
      if (this.agentMetadata.code) {
        payload.agentCode = this.agentMetadata.code;
      }
      if (this.agentMetadata.name) {
        payload.agentName = this.agentMetadata.name;
      }
    }

    // Keep only the latest client_info payload in the queue
    this.messageQueue = this.messageQueue.filter(msg => msg.type !== 'client_info');

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
      } catch (err) {
        console.error('Error sending client info:', err?.message || err);
      }
    } else {
      this.messageQueue.push(payload);
    }
  }

  connect() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        if (this.ws?.readyState === WebSocket.OPEN) {
          resolve(this.ws);
          return;
        }

        const wsUrl = config.getWebSocketUrl();
        // Connecting to WebSocket
        this.ws = new WebSocket(wsUrl);
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // WebSocket message received
            this.handleMessage(data);
          } catch (parseError) {
            console.error('Error parsing WebSocket message:', parseError.message);
          }
        };

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          reconnectAttempts = 0; // Reset reconnect attempts on successful connection
          
          this.sendClientInfo();
          
          while (this.messageQueue.length > 0) {
            let currentMessage = this.messageQueue.shift();
            try {
              this.ws.send(JSON.stringify(currentMessage));
            } catch (queueError) {
              console.error('Error sending queued message:', queueError.message);
              this.messageQueue.unshift(currentMessage);
              break;
            }
          }
          
          this.startActivityUpdates();
          resolve(this.ws);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.stopActivityUpdates();
          this.connectionPromise = null;

          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`Attempting to reconnect in ${delay}ms...`);
            reconnectAttempts++;
            setTimeout(() => this.connect(), delay);
          } else {
            console.error('Max reconnection attempts reached');
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          // Don't reject here, let onclose handle reconnection
        };
      } catch (connectionError) {
        console.error('Error creating WebSocket connection:', connectionError.message);
        this.connectionPromise = null;
        reject(connectionError);
      }
    });

    return this.connectionPromise;
  }

  startActivityUpdates() {
    this.stopActivityUpdates();
    
    if (!this.isAgent) { // Only send activity updates for regular users
      this.activityInterval = setInterval(() => {
        this.sendActivity();
      }, 30000);
      
      this.sendActivity();
    }
  }

  stopActivityUpdates() {
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
      this.activityInterval = null;
    }
  }

  async sendActivity() {
    const message = {
      type: 'user_activity',
      userId: this.userId,
      timestamp: new Date().toISOString()
    };

    try {
      await this.sendMessage(null, message);
    } catch (error) {
      console.error('Failed to send activity update:', error);
    }
  }

  sendMessage(chatId, data) {
    let messageData;

    if (typeof data === 'string') {
      // Simple text message
      messageData = {
        type: 'chat_message',
        chatId,
        message: data,
        sender: this.isAgent ? 'agent' : 'customer',
  timestamp: new Date().toISOString(),
  clientId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      };
    } else {
      // Complex message object (could include image data)
      messageData = {
        type: 'chat_message',
        chatId,
        message: data.message,
        messageType: data.messageType || 'text',
        sender: this.isAgent ? 'agent' : 'customer',
  timestamp: new Date().toISOString(),
  clientId: data.clientId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...data // Spread to include any additional fields like imageData, mimeType, filename
      };
    }

    // Notify outgoing subscribers immediately for optimistic UI updates
    try {
      this.outgoingCallbacks.forEach(cb => {
        try { cb(messageData); } catch (e) { console.error('Outgoing callback error:', e); }
      });
    } catch {}

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', messageData);
      this.ws.send(JSON.stringify(messageData));
    } else {
      console.error('WebSocket is not connected');
      // Queue the message for when connection is restored
      this.messageQueue.push({
        chatId,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  onMessage(callback) {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onNotification(callback) {
    this.notificationCallbacks.add(callback);
    return () => {
      this.notificationCallbacks.delete(callback);
    };
  }

  onPresence(callback) {
    this.presenceCallbacks.add(callback);
    return () => {
      this.presenceCallbacks.delete(callback);
    };
  }

  onLiveQueueUpdate(callback) {
    this.liveQueueCallbacks.add(callback);
    return () => {
      this.liveQueueCallbacks.delete(callback);
    };
  }

  // Subscribe to outgoing chat messages for optimistic UI updates
  onOutgoing(callback) {
    this.outgoingCallbacks.add(callback);
    return () => {
      this.outgoingCallbacks.delete(callback);
    };
  }

  // Send message read status
  markMessagesAsRead(chatId, sender = 'agent') {
    const message = {
      type: 'message_read',
      chatId,
      sender,
      timestamp: new Date().toISOString()
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  handleMessage(data) {
    // Handle presence updates
    if (data.type === 'user_presence') {
      this.presenceCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Presence callback error:', error);
        }
      });
      return;
    }

    // Handle activity updates
    if (data.type === 'user_activity_update') {
      this.presenceCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Activity callback error:', error);
        }
      });
      return;
    }

    // Handle messages read updates
    if (data.type === 'messages_read') {
      this.messageCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Messages read callback error:', error);
        }
      });
      return;
    }

    // Handle live queue updates for agent dashboard
    if (data.type === 'queue:update' || data.type === 'live_queue_update') {
      this.liveQueueCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Live queue callback error:', error);
        }
      });
      return;
    }

    if (data.type === 'notifications_update') {
      this.notificationCallbacks.forEach(callback => {
        try {
          callback(data.notifications);
        } catch (error) {
          console.error('Notification callback error:', error);
        }
      });
      return;
    }

    // Handle other message types
    this.messageCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Message callback error:', error);
      }
    });
  }

  disconnect() {
    this.stopActivityUpdates();
    if (this.ws) {
      this.ws.close();
    }
    this.messageQueue = [];
    this.connectionPromise = null;
  }
}

const websocketService = new WebSocketService();
export default websocketService;
