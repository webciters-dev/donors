/**
 * Redis Cache Utility
 * Provides caching layer for frequently accessed data
 * 
 * Usage:
 *   import { cacheGet, cacheSet, cacheDel } from './lib/cache.js';
 *   
 *   // Get cached data
 *   const user = await cacheGet('user:123');
 *   
 *   // Set cache with TTL
 *   await cacheSet('user:123', userData, 3600); // 1 hour
 *   
 *   // Delete cache
 *   await cacheDel('user:123');
 */

import { createClient } from 'redis';
import logger from './logger.js';

let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis client
 */
export async function initializeRedis() {
  // Skip if Redis is disabled
  if (process.env.ENABLE_REDIS !== 'true') {
    logger.info('Redis caching is disabled');
    return null;
  }
  
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 100, 3000); // Max 3 seconds between retries
        },
      },
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
      isConnected = false;
    });
    
    redisClient.on('connect', () => {
      logger.info('Redis client connected');
      isConnected = true;
    });
    
    redisClient.on('disconnect', () => {
      logger.warn('Redis client disconnected');
      isConnected = false;
    });
    
    await redisClient.connect();
    logger.info('Redis cache initialized', { url: redisUrl });
    
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis', { error: error.message });
    return null;
  }
}

/**
 * Get value from cache
 */
export async function cacheGet(key) {
  if (!isConnected || !redisClient) {
    return null;
  }
  
  try {
    const value = await redisClient.get(key);
    if (value) {
      logger.debug('Cache hit', { key });
      return JSON.parse(value);
    }
    logger.debug('Cache miss', { key });
    return null;
  } catch (error) {
    logger.error('Cache get error', { key, error: error.message });
    return null;
  }
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: 1 hour)
 */
export async function cacheSet(key, value, ttl = 3600) {
  if (!isConnected || !redisClient) {
    return false;
  }
  
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    logger.debug('Cache set', { key, ttl });
    return true;
  } catch (error) {
    logger.error('Cache set error', { key, error: error.message });
    return false;
  }
}

/**
 * Delete value from cache
 */
export async function cacheDel(key) {
  if (!isConnected || !redisClient) {
    return false;
  }
  
  try {
    await redisClient.del(key);
    logger.debug('Cache deleted', { key });
    return true;
  } catch (error) {
    logger.error('Cache delete error', { key, error: error.message });
    return false;
  }
}

/**
 * Delete multiple keys matching pattern
 */
export async function cacheDelPattern(pattern) {
  if (!isConnected || !redisClient) {
    return 0;
  }
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.debug('Cache pattern deleted', { pattern, count: keys.length });
      return keys.length;
    }
    return 0;
  } catch (error) {
    logger.error('Cache pattern delete error', { pattern, error: error.message });
    return 0;
  }
}

/**
 * Cache middleware for Express routes
 * Caches GET requests based on URL
 */
export function cacheMiddleware(ttl = 3600) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const cacheKey = `route:${req.originalUrl || req.url}`;
    
    try {
      const cachedResponse = await cacheGet(cacheKey);
      
      if (cachedResponse) {
        logger.debug('Serving from cache', { url: req.url });
        return res.json(cachedResponse);
      }
      
      // Store original json method
      const originalJson = res.json.bind(res);
      
      // Override json method to cache response
      res.json = function(data) {
        cacheSet(cacheKey, data, ttl).catch(err => {
          logger.error('Failed to cache response', { error: err.message });
        });
        return originalJson(data);
      };
      
      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message });
      next();
    }
  };
}

/**
 * Close Redis connection
 */
export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
}

export default {
  initializeRedis,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
  cacheMiddleware,
  closeRedis,
};
