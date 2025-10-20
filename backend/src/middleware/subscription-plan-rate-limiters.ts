/**
 * Subscription Plan Rate Limiters
 * Tiered rate limiting for subscription plan endpoints
 * 
 * Development: Very high limits for testing
 * Production: Conservative limits for security
 * 
 * Read operations: 1000 requests/minute (dev) / 100 requests/minute (prod)
 * Write operations: 1000 requests/minute (dev) / 20 requests/minute (prod)
 * Reorder operations: 100 requests per 5 minutes (dev) / 5 requests per 5 minutes (prod)
 */

import RateLimitService from '../services/rate-limit.service';

const rateLimitService = RateLimitService.getInstance();

// Development-friendly rate limits
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Read operations rate limiter (GET requests)
 * 100 requests per minute - generous for read operations
 */
export const subscriptionPlanReadLimiter = rateLimitService.createRateLimitMiddleware({
  maxRequests: isDevelopment ? 1000 : 100,
  windowMs: 1 * 60 * 1000, // 1 minute
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise IP
    return req.user?.userId || req.ip || 'unknown';
  }
});

/**
 * Write operations rate limiter (POST, PUT, PATCH, DELETE)
 * 20 requests per minute - more restrictive for write operations
 */
export const subscriptionPlanWriteLimiter = rateLimitService.createRateLimitMiddleware({
  maxRequests: isDevelopment ? 1000 : 20,
  windowMs: 1 * 60 * 1000, // 1 minute
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'unknown';
  }
});

/**
 * Reorder operations rate limiter (bulk operations)
 * 5 requests per 5 minutes - very restrictive for bulk operations
 */
export const subscriptionPlanReorderLimiter = rateLimitService.createRateLimitMiddleware({
  maxRequests: isDevelopment ? 100 : 5,
  windowMs: 5 * 60 * 1000, // 5 minutes
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'unknown';
  }
});

