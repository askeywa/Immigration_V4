/**
 * Cache Middleware
 * Provides HTTP response caching with Redis backend
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 1: No console.log (using logger)
 * - Rule 5: API timeouts (via Redis service)
 * - Rule 9: TypeScript strict (no 'any')
 */

import { Request, Response, NextFunction } from 'express';
import RedisService from '../services/redis.service';
import logger from '../utils/logger';

/**
 * Cache options interface
 */
interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string; // Custom cache key generator
  skipCache?: (req: Request) => boolean; // Skip cache condition
}

/**
 * Default cache key generator
 */
const defaultKeyGenerator = (req: Request): string => {
  const baseKey = `${req.method}:${req.originalUrl}`;
  
  // Include query parameters for GET requests
  if (req.method === 'GET' && Object.keys(req.query).length > 0) {
    const sortedQuery = Object.keys(req.query)
      .sort()
      .map(key => `${key}=${req.query[key]}`)
      .join('&');
    return `${baseKey}?${sortedQuery}`;
  }
  
  // Include user ID for authenticated requests
  if (req.user?.userId) {
    return `${baseKey}:user:${req.user.userId}`;
  }
  
  return baseKey;
};

/**
 * Cache middleware factory
 */
export const createCacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = defaultKeyGenerator,
    skipCache = () => false
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip caching for non-GET requests or if skip condition is met
    if (req.method !== 'GET' || skipCache(req)) {
      return next();
    }

    try {
      const redis = RedisService.getInstance();
      const cacheKey = `cache:${keyGenerator(req)}`;
      
      // Try to get cached response
      const cachedResponse = await redis.get(cacheKey);
      
      if (cachedResponse) {
        const parsedResponse = JSON.parse(cachedResponse);
        
        logger.debug('Cache hit', {
          key: cacheKey,
          method: req.method,
          url: req.originalUrl
        });
        
        res.status(parsedResponse.status).json(parsedResponse.data);
        return;
      }
      
      // Cache miss - continue to next middleware
      logger.debug('Cache miss', {
        key: cacheKey,
        method: req.method,
        url: req.originalUrl
      });
      
      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function(data: unknown): Response {
        // Cache the response
        const responseToCache = {
          status: res.statusCode,
          data
        };
        
        redis.set(cacheKey, JSON.stringify(responseToCache), ttl)
          .catch(error => {
            logger.error('Failed to cache response', {
              key: cacheKey,
              error: error instanceof Error ? error.message : String(error)
            });
          });
        
        return originalJson(data);
      };
      
      next();
    } catch (error) {
      logger.error('Cache middleware error', {
        error: error instanceof Error ? error.message : String(error),
        method: req.method,
        url: req.originalUrl
      });
      
      // Continue without caching on error
      next();
    }
  };
};

/**
 * Cache invalidation middleware
 */
export const createCacheInvalidationMiddleware = (patterns: string[] = []) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Skip cache invalidation for GET requests
    if (req.method === 'GET') {
      return next();
    }

    try {
      const redis = RedisService.getInstance();
      
      // Invalidate cache entries matching patterns
      for (const pattern of patterns) {
        await redis.delPattern(pattern);
      }
      
      logger.debug('Cache invalidated', {
        patterns,
        method: req.method,
        url: req.originalUrl
      });
      
      next();
    } catch (error) {
      logger.error('Cache invalidation error', {
        error: error instanceof Error ? error.message : String(error),
        patterns,
        method: req.method,
        url: req.originalUrl
      });
      
      // Continue even if cache invalidation fails
      next();
    }
  };
};

/**
 * Predefined cache configurations
 */
export const cacheConfigs = {
  // Short-term cache for frequently accessed data
  short: createCacheMiddleware({ ttl: 60 }), // 1 minute
  
  // Medium-term cache for moderately changing data
  medium: createCacheMiddleware({ ttl: 300 }), // 5 minutes
  
  // Long-term cache for rarely changing data
  long: createCacheMiddleware({ ttl: 1800 }), // 30 minutes
  
  // Cache for tenant-specific data
  tenantSpecific: createCacheMiddleware({
    ttl: 300,
    keyGenerator: (req: Request) => {
      const baseKey = defaultKeyGenerator(req);
      const tenantId = req.headers['x-tenant-id'] || 'no-tenant';
      return `${baseKey}:tenant:${tenantId}`;
    }
  }),
  
  // Cache for user-specific data
  userSpecific: createCacheMiddleware({
    ttl: 300,
    keyGenerator: (req: Request) => {
      const baseKey = defaultKeyGenerator(req);
      const userId = req.user?.userId || 'no-user';
      return `${baseKey}:user:${userId}`;
    }
  })
};
