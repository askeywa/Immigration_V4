import { Request, Response, NextFunction } from 'express';
import RedisService from './redis.service';
import { config } from '../config/env.config';
import logger from '../utils/logger';

/**
 * Advanced Rate Limiting Service
 * Provides flexible rate limiting with Redis/in-memory storage
 * Supports different limits for different endpoints
 */
class RateLimitService {
  private static instance: RateLimitService;
  private redis: RedisService;

  private constructor() {
    this.redis = RedisService.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  /**
   * Initialize rate limiting service
   */
  public static async initialize(): Promise<void> {
    logger.info('Rate Limiting Service initialized');
  }

  /**
   * Generate rate limit key
   */
  private getRateLimitKey(identifier: string, endpoint: string): string {
    return `ratelimit:${identifier}:${endpoint}`;
  }

  /**
   * Check rate limit
   * @returns { allowed: boolean, remaining: number, resetTime: number }
   */
  public async checkRateLimit(
    identifier: string,
    endpoint: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const key = this.getRateLimitKey(identifier, endpoint);
      const ttlSeconds = Math.ceil(windowMs / 1000);

      // Get current count
      const currentValue = await this.redis.get(key);
      const count = currentValue ? parseInt(currentValue, 10) : 0;

      if (count >= maxRequests) {
        // Rate limit exceeded
        return {
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + windowMs,
        };
      }

      // Increment counter
      const newCount = await this.redis.incr(key);

      // Set expiry on first request
      if (newCount === 1) {
        await this.redis.expire(key, ttlSeconds);
      }

      return {
        allowed: true,
        remaining: Math.max(0, maxRequests - newCount),
        resetTime: Date.now() + windowMs,
      };
    } catch (error) {
      logger.error('Rate limit check error', {
        identifier,
        endpoint,
        error: error instanceof Error ? error.message : String(error),
      });
      
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: Date.now() + windowMs,
      };
    }
  }

  /**
   * Reset rate limit for a specific identifier and endpoint
   */
  public async resetRateLimit(identifier: string, endpoint: string): Promise<void> {
    try {
      const key = this.getRateLimitKey(identifier, endpoint);
      await this.redis.del(key);
      
      logger.debug('Rate limit reset', { identifier, endpoint });
    } catch (error) {
      logger.error('Rate limit reset error', {
        identifier,
        endpoint,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Create rate limit middleware
   */
  public createRateLimitMiddleware(options: {
    maxRequests?: number;
    windowMs?: number;
    keyGenerator?: (req: Request) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
  } = {}) {
    const {
      maxRequests = config.RATE_LIMIT_MAX_REQUESTS,
      windowMs = config.RATE_LIMIT_WINDOW_MS,
      keyGenerator = (req: Request) => req.ip || 'unknown',
      skipSuccessfulRequests = false,
      skipFailedRequests = false,
    } = options;

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const identifier = keyGenerator(req);
        const endpoint = req.originalUrl.split('?')[0];

        // Check rate limit
        const { allowed, remaining, resetTime } = await this.checkRateLimit(
          identifier,
          endpoint,
          maxRequests,
          windowMs
        );

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());

        if (!allowed) {
          logger.warn('Rate limit exceeded', {
            identifier,
            endpoint,
            ip: req.ip,
          });

          res.status(429).json({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests, please try again later',
              retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
            },
          });
          return;
        }

        // Handle skipSuccessfulRequests and skipFailedRequests
        if (skipSuccessfulRequests || skipFailedRequests) {
          const originalJson = res.json.bind(res);
          
          res.json = function (data: any) {
            const statusCode = res.statusCode;
            const isSuccess = statusCode >= 200 && statusCode < 300;
            const isFailure = statusCode >= 400;

            // Decrement counter if we should skip this type of request
            if ((skipSuccessfulRequests && isSuccess) || (skipFailedRequests && isFailure)) {
              const key = RateLimitService.getInstance().getRateLimitKey(identifier, endpoint);
              RedisService.getInstance().get(key).then((value) => {
                if (value) {
                  const count = parseInt(value, 10);
                  if (count > 0) {
                    RedisService.getInstance().set(key, String(count - 1), windowMs / 1000);
                  }
                }
              }).catch((error) => {
                logger.error('Failed to decrement rate limit', {
                  error: error instanceof Error ? error.message : String(error),
                });
              });
            }

            return originalJson(data);
          };
        }

        next();
      } catch (error) {
        logger.error('Rate limit middleware error', {
          error: error instanceof Error ? error.message : String(error),
        });
        
        // Fail open - allow request if middleware fails
        next();
      }
    };
  }

  /**
   * Create auth-specific rate limiter (stricter limits)
   */
  public createAuthRateLimiter() {
    return this.createRateLimitMiddleware({
      maxRequests: config.RATE_LIMIT_AUTH_MAX,
      windowMs: 15 * 60 * 1000, // 15 minutes
      keyGenerator: (req: Request) => {
        // Use email if provided, otherwise IP
        const email = req.body?.email || req.ip || 'unknown';
        return `auth:${email}`;
      },
      skipSuccessfulRequests: true, // Only count failed login attempts
    });
  }

  /**
   * Get rate limit status for an identifier
   */
  public async getRateLimitStatus(identifier: string, endpoint: string): Promise<{
    currentCount: number;
    maxRequests: number;
    resetTime: number | null;
  }> {
    try {
      const key = this.getRateLimitKey(identifier, endpoint);
      const value = await this.redis.get(key);
      const currentCount = value ? parseInt(value, 10) : 0;

      return {
        currentCount,
        maxRequests: config.RATE_LIMIT_MAX_REQUESTS,
        resetTime: value ? Date.now() + config.RATE_LIMIT_WINDOW_MS : null,
      };
    } catch (error) {
      logger.error('Get rate limit status error', {
        identifier,
        endpoint,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        currentCount: 0,
        maxRequests: config.RATE_LIMIT_MAX_REQUESTS,
        resetTime: null,
      };
    }
  }
}

export default RateLimitService;

