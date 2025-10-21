import Redis, { RedisOptions } from 'ioredis';
import { config, isDevelopment } from '../config/env.config';
import logger from '../utils/logger';

/**
 * Redis Service with In-Memory Fallback
 * Provides caching, session storage, and rate limiting support
 * Falls back to in-memory storage if Redis is unavailable (localhost development)
 */
class RedisService {
  private static instance: RedisService;
  private client: Redis | null = null;
  private isConnected = false;
  private useInMemoryFallback = false;
  
  // In-memory fallback storage
  private memoryStore: Map<string, { value: string; expiry: number | null }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  /**
   * Initialize Redis connection with fallback
   */
  public async initialize(): Promise<void> {
    try {
      const redisOptions: RedisOptions = {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
        lazyConnect: true, // Don't connect immediately
      };

      this.client = new Redis(redisOptions);

      // Event handlers
      this.client.on('connect', () => {
        this.isConnected = true;
        this.useInMemoryFallback = false;
        logger.info('Redis connected successfully', {
          host: config.REDIS_HOST,
          port: config.REDIS_PORT,
        });
      });

      this.client.on('error', (error: Error) => {
        this.isConnected = false;
        logger.error('Redis connection error', { 
          error: error.message,
          fallback: 'Using in-memory storage',
        });
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });

      // Try to connect
      await this.client.connect();

    } catch (error) {
      this.isConnected = false;
      this.useInMemoryFallback = true;
      
      if (isDevelopment) {
        logger.warn('Redis unavailable - Using in-memory fallback for localhost', {
          error: error instanceof Error ? error.message : String(error),
        });
        this.startMemoryCleanup();
      } else {
        logger.error('Redis connection failed in production', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error; // Fail in production if Redis is unavailable
      }
    }
  }

  /**
   * Start cleanup interval for in-memory storage
   */
  private startMemoryCleanup(): void {
    // Cleanup expired keys every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.memoryStore.entries()) {
        if (data.expiry && data.expiry < now) {
          this.memoryStore.delete(key);
        }
      }
    }, 60000);
  }

  /**
   * Set a key-value pair with optional TTL
   */
  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        if (ttlSeconds) {
          await this.client.setex(key, ttlSeconds, value);
        } else {
          await this.client.set(key, value);
        }
      } else {
        // In-memory fallback
        const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
        this.memoryStore.set(key, { value, expiry });
      }
    } catch (error) {
      logger.error('Redis SET error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      // Fallback to in-memory on error
      const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
      this.memoryStore.set(key, { value, expiry });
    }
  }

  /**
   * Get a value by key
   */
  public async get(key: string): Promise<string | null> {
    try {
      if (this.isConnected && this.client) {
        return await this.client.get(key);
      } else {
        // In-memory fallback
        const data = this.memoryStore.get(key);
        if (!data) return null;
        
        // Check expiry
        if (data.expiry && data.expiry < Date.now()) {
          this.memoryStore.delete(key);
          return null;
        }
        
        return data.value;
      }
    } catch (error) {
      logger.error('Redis GET error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Delete a key
   */
  public async del(key: string): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        await this.client.del(key);
      } else {
        this.memoryStore.delete(key);
      }
    } catch (error) {
      logger.error('Redis DEL error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Delete keys matching a pattern
   */
  public async delPattern(pattern: string): Promise<number> {
    try {
      if (this.isConnected && this.client) {
        const keys = await this.client.keys(pattern);
        if (keys.length === 0) return 0;
        
        const result = await this.client.del(...keys);
        logger.debug('Deleted cache keys', { pattern, count: result });
        return result;
      } else {
        // In-memory fallback - delete matching keys
        let deletedCount = 0;
        for (const key of this.memoryStore.keys()) {
          if (this.matchPattern(key, pattern)) {
            this.memoryStore.delete(key);
            deletedCount++;
          }
        }
        logger.debug('Deleted cache keys (memory)', { pattern, count: deletedCount });
        return deletedCount;
      }
    } catch (error) {
      logger.error('Redis DEL pattern error', {
        pattern,
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  /**
   * Simple pattern matching for in-memory fallback
   */
  private matchPattern(key: string, pattern: string): boolean {
    // Convert Redis pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(key);
  }

  /**
   * Check if a key exists
   */
  public async exists(key: string): Promise<boolean> {
    try {
      if (this.isConnected && this.client) {
        const result = await this.client.exists(key);
        return result === 1;
      } else {
        const data = this.memoryStore.get(key);
        if (!data) return false;
        
        // Check expiry
        if (data.expiry && data.expiry < Date.now()) {
          this.memoryStore.delete(key);
          return false;
        }
        
        return true;
      }
    } catch (error) {
      logger.error('Redis EXISTS error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Increment a counter
   */
  public async incr(key: string): Promise<number> {
    try {
      if (this.isConnected && this.client) {
        return await this.client.incr(key);
      } else {
        // In-memory fallback
        const data = this.memoryStore.get(key);
        const currentValue = data ? parseInt(data.value, 10) || 0 : 0;
        const newValue = currentValue + 1;
        this.memoryStore.set(key, { value: String(newValue), expiry: data?.expiry || null });
        return newValue;
      }
    } catch (error) {
      logger.error('Redis INCR error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  /**
   * Set expiry on a key
   */
  public async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        await this.client.expire(key, ttlSeconds);
      } else {
        const data = this.memoryStore.get(key);
        if (data) {
          data.expiry = Date.now() + ttlSeconds * 1000;
        }
      }
    } catch (error) {
      logger.error('Redis EXPIRE error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Delete keys by pattern
   */
  public async deletePattern(pattern: string): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } else {
        // In-memory fallback
        const regex = new RegExp(pattern.replace('*', '.*'));
        for (const key of this.memoryStore.keys()) {
          if (regex.test(key)) {
            this.memoryStore.delete(key);
          }
        }
      }
    } catch (error) {
      logger.error('Redis DELETE_PATTERN error', {
        pattern,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get connection status
   */
  public getStatus(): { connected: boolean; fallback: boolean } {
    return {
      connected: this.isConnected,
      fallback: this.useInMemoryFallback,
    };
  }

  /**
   * Disconnect from Redis
   */
  public async disconnect(): Promise<void> {
    try {
      // Clear cleanup interval
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }

      // Disconnect Redis client
      if (this.client) {
        await this.client.quit();
        this.client = null;
      }

      // Clear in-memory store
      this.memoryStore.clear();
      
      this.isConnected = false;
      logger.info('Redis disconnected successfully');
    } catch (error) {
      logger.error('Redis disconnect error', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{ status: string; latency: number | null }> {
    try {
      if (this.isConnected && this.client) {
        const start = Date.now();
        await this.client.ping();
        const latency = Date.now() - start;
        return { status: 'connected', latency };
      } else {
        return { 
          status: this.useInMemoryFallback ? 'in-memory-fallback' : 'disconnected', 
          latency: null 
        };
      }
    } catch (error) {
      return { status: 'error', latency: null };
    }
  }
}

export default RedisService;

