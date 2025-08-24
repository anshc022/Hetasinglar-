/**
 * Agent Dashboard Cache Service
 * Caches dashboard data to prevent unnecessary API calls when switching tabs
 */
class AgentCacheService {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.defaultCacheDuration = 5 * 60 * 1000; // 5 minutes default cache
  }

  /**
   * Set cache with timestamp
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} duration - Cache duration in milliseconds (optional)
   */
  set(key, data, duration = this.defaultCacheDuration) {
    this.cache.set(key, data);
    this.cacheTimestamps.set(key, {
      timestamp: Date.now(),
      duration: duration
    });
    
    console.log(`🗄️ Cached data for key: ${key}`);
  }

  /**
   * Get cached data if still valid
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null if expired/not found
   */
  get(key) {
    if (!this.cache.has(key) || !this.cacheTimestamps.has(key)) {
      return null;
    }

    const { timestamp, duration } = this.cacheTimestamps.get(key);
    const isExpired = Date.now() - timestamp > duration;

    if (isExpired) {
      this.delete(key);
      console.log(`⏰ Cache expired for key: ${key}`);
      return null;
    }

    console.log(`✅ Cache hit for key: ${key}`);
    return this.cache.get(key);
  }

  /**
   * Check if cache exists and is valid
   * @param {string} key - Cache key
   * @returns {boolean} True if cache exists and is valid
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete specific cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
    console.log(`🗑️ Deleted cache for key: ${key}`);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.cacheTimestamps.clear();
    console.log('🧹 Cleared all cache');
  }

  /**
   * Invalidate cache by pattern
   * @param {string} pattern - Pattern to match keys
   */
  invalidatePattern(pattern) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    console.log(`🎯 Invalidated cache for pattern: ${pattern}`);
  }

  /**
   * Get cache info for debugging
   * @returns {object} Cache statistics
   */
  getInfo() {
    const now = Date.now();
    const info = {
      totalEntries: this.cache.size,
      entries: []
    };

    for (const [key, { timestamp, duration }] of this.cacheTimestamps) {
      const age = now - timestamp;
      const remaining = duration - age;
      const isExpired = remaining <= 0;

      info.entries.push({
        key,
        age: Math.round(age / 1000), // in seconds
        remaining: Math.round(remaining / 1000), // in seconds
        isExpired,
        size: JSON.stringify(this.cache.get(key)).length
      });
    }

    return info;
  }

  /**
   * Get cached data or fetch and cache it
   * @param {string} key - Cache key
   * @param {function} fetchFunction - Function to fetch data if not cached
   * @param {number} duration - Cache duration in milliseconds (optional)
   * @returns {Promise<any>} Cached or fresh data
   */
  async getOrFetch(key, fetchFunction, duration = this.defaultCacheDuration) {
    const cachedData = this.get(key);
    
    if (cachedData !== null) {
      return cachedData;
    }

    console.log(`📡 Fetching fresh data for key: ${key}`);
    try {
      const freshData = await fetchFunction();
      this.set(key, freshData, duration);
      return freshData;
    } catch (error) {
      console.error(`❌ Failed to fetch data for key: ${key}`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const agentCache = new AgentCacheService();

// Cache keys constants
export const CACHE_KEYS = {
  DASHBOARD_STATS: 'dashboard_stats',
  LIVE_QUEUE: 'live_queue',
  MY_ESCORTS: 'my_escorts',
  AGENT_PROFILE: 'agent_profile',
  EARNINGS: 'earnings',
  AFFILIATE_STATS: 'affiliate_stats',
  CHAT_STATISTICS: 'chat_statistics',
  PANIC_ROOM: 'panic_room',
  ASSIGNED_CUSTOMERS: (agentId) => `assigned_customers_${agentId}`,
  REMINDERS: 'reminders'
};

// Cache durations
export const CACHE_DURATIONS = {
  SHORT: 2 * 60 * 1000,      // 2 minutes
  MEDIUM: 5 * 60 * 1000,     // 5 minutes  
  LONG: 10 * 60 * 1000,      // 10 minutes
  VERY_LONG: 30 * 60 * 1000  // 30 minutes
};

export default agentCache;
