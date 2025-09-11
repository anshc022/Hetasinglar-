// Like service for handling like-related API calls
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const likeService = {
  // User functions
  async likeEscort(escortId, token) {
    const response = await fetch(`${API_BASE_URL}/likes/escort/${escortId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to like escort');
    }

    return response.json();
  },

  async unlikeEscort(escortId, token) {
    const response = await fetch(`${API_BASE_URL}/likes/escort/${escortId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to unlike escort');
    }

    return response.json();
  },

  async getUserLikes(token, page = 1, limit = 20) {
    const response = await fetch(`${API_BASE_URL}/likes/user/my-likes?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch liked profiles');
    }

    return response.json();
  },

  async checkLikeStatus(escortId, token) {
    const response = await fetch(`${API_BASE_URL}/likes/check/${escortId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check like status');
    }

    return response.json();
  },

  // Agent functions
  async getAgentLikes(token, status = 'active', limit = 50) {
    const response = await fetch(`${API_BASE_URL}/likes/agent/live-likes?status=${status}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch likes');
    }

    return response.json();
  },

  async markLikeAsRead(likeId, token) {
    const response = await fetch(`${API_BASE_URL}/likes/${likeId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to mark like as read');
    }

    return response.json();
  },

  async deleteLike(likeId, token) {
    const response = await fetch(`${API_BASE_URL}/likes/${likeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete like');
    }

    return response.json();
  },

  async startChatFromLike(likeId, token) {
    const response = await fetch(`${API_BASE_URL}/likes/${likeId}/start-chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start chat');
    }

    return response.json();
  },

  async getEscortLikes(escortId, token, page = 1, limit = 20) {
    const response = await fetch(`${API_BASE_URL}/likes/escort/${escortId}/likes?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch escort likes');
    }

    return response.json();
  }
};
