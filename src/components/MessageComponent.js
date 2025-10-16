import React from 'react';

// Updated Message Component that properly handles deleted messages
const MessageComponent = ({ message, currentUser, isAdmin = false }) => {
  // Don't render deleted messages for regular users
  if (message.isDeleted && !isAdmin) {
    return null;
  }

  // For admin view, show deleted message indicator
  if (message.isDeleted && isAdmin) {
    return (
      <div className="message-item deleted-message admin-only">
        <div className="message-content">
          <span className="text-gray-500 italic text-sm">
            [Message deleted by {message.deletedBy === message.sender ? 'sender' : 'admin'} at {new Date(message.deletedAt).toLocaleString()}]
          </span>
        </div>
      </div>
    );
  }

  // Regular message display
  const isOwnMessage = message.sender === currentUser?.id;
  
  return (
    <div className={`message-item ${isOwnMessage ? 'own-message' : 'other-message'}`}>
      <div className="message-content">
        <p className="message-text">{message.content}</p>
        <span className="message-time">
          {new Date(message.createdAt).toLocaleTimeString()}
        </span>
        
        {/* Delete button only for own messages */}
        {isOwnMessage && !message.isDeleted && (
          <button
            onClick={() => handleDeleteMessage(message._id)}
            className="delete-message-btn"
            title="Delete message"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
};

// Updated MessageList component
const MessageList = ({ messages, currentUser, isAdmin = false }) => {
  // Filter out deleted messages for non-admin users
  const visibleMessages = isAdmin 
    ? messages 
    : messages.filter(msg => !msg.isDeleted);

  return (
    <div className="messages-container">
      {visibleMessages.map(message => (
        <MessageComponent
          key={message._id}
          message={message}
          currentUser={currentUser}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
};

// Updated message fetching function
export const fetchMessages = async (chatId, isAdmin = false) => {
  try {
    const response = await fetch(`/api/messages/${chatId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch messages');
    }
    
    // Backend should already filter, but double-check on frontend for non-admins
    if (!isAdmin && data.messages) {
      return data.messages.filter(msg => !msg.isDeleted);
    }
    
    return data.messages || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

// Updated delete message function
export const deleteMessage = async (messageId) => {
  try {
    const response = await fetch(`/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete message');
    }
    
    return data;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

// CSS styles for deleted messages (add to your stylesheet)
const styles = `
.message-item {
  margin: 8px 0;
  padding: 12px;
  border-radius: 8px;
}

.own-message {
  background-color: #007bff;
  color: white;
  margin-left: auto;
  margin-right: 16px;
  max-width: 70%;
}

.other-message {
  background-color: #f1f1f1;
  color: #333;
  margin-left: 16px;
  margin-right: auto;
  max-width: 70%;
}

.deleted-message.admin-only {
  background-color: #ffe6e6;
  border: 1px dashed #ff6b6b;
  opacity: 0.7;
}

.delete-message-btn {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  margin-left: 8px;
  font-size: 12px;
}

.delete-message-btn:hover {
  opacity: 1;
}

.message-text {
  margin: 0;
  word-wrap: break-word;
}

.message-time {
  font-size: 0.8em;
  opacity: 0.7;
  margin-left: 8px;
}
`;

export { MessageComponent, MessageList, styles };
export default MessageComponent;