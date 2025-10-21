import session from 'express-session';
import connectMongo from 'connect-mongo';
import { config } from '../config/env.config';
import logger from '../utils/logger';
import RedisService from './redis.service';
import { Request, Response, NextFunction } from 'express';

/**
 * Session Management Service
 * Handles user sessions with MongoDB and Redis support
 * Provides session tracking and security features
 */
class SessionService {
  private static instance: SessionService;
  private sessionStore: session.Store | null = null;
  private redis: RedisService;

  private constructor() {
    this.redis = RedisService.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Initialize session service
   */
  public static async initialize(): Promise<void> {
    const instance = SessionService.getInstance();
    
    try {
      // Create MongoDB session store
      instance.sessionStore = connectMongo.create({
        mongoUrl: config.MONGO_URI,
        collectionName: 'sessions',
        ttl: config.SESSION_EXPIRE / 1000, // Convert ms to seconds
        autoRemove: 'native', // Let MongoDB handle cleanup
        touchAfter: 24 * 3600, // Update session only once in 24 hours
      });

      logger.info('Session Service initialized', {
        store: 'MongoDB',
        ttl: config.SESSION_EXPIRE / 1000,
      });
    } catch (error) {
      logger.error('Session Service initialization failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create session middleware
   */
  public createSessionMiddleware(): session.SessionOptions {
    if (!this.sessionStore) {
      throw new Error('Session store not initialized. Call initialize() first.');
    }

    return {
      secret: config.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: this.sessionStore,
      cookie: {
        secure: config.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true, // Prevent XSS
        maxAge: config.SESSION_EXPIRE,
        sameSite: 'strict', // CSRF protection
      },
      name: 'rcic.sid', // Custom session ID name
    };
  }

  /**
   * Track session activity
   */
  public sessionActivityTracking() {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      if (req.session && req.user) {
        const userId = (req.user as any).id;
        const sessionKey = `session:activity:${userId}`;

        try {
          // Update last activity timestamp
          await this.redis.set(
            sessionKey,
            JSON.stringify({
              userId,
              lastActivity: new Date().toISOString(),
              ip: req.ip,
              userAgent: req.get('user-agent'),
            }),
            3600 // 1 hour TTL
          );
        } catch (error) {
          logger.error('Session activity tracking error', {
            userId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      next();
    };
  }

  /**
   * Session security policy
   * Enforces session security rules
   */
  public sessionSecurityPolicy() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (req.session && req.user) {
        const userId = (req.user as any).id;
        const sessionKey = `session:security:${userId}`;

        try {
          // Get stored session security info
          const stored = await this.redis.get(sessionKey);
          
          if (stored) {
            const securityInfo = JSON.parse(stored);
            
            // Check for session hijacking (IP change)
            if (securityInfo.ip !== req.ip) {
              logger.warn('Suspicious session activity - IP change detected', {
                userId,
                oldIp: securityInfo.ip,
                newIp: req.ip,
              });
              
              // Destroy session on suspicious activity
              req.session.destroy((error) => {
                if (error) {
                  logger.error('Session destruction error', {
                    error: error.message,
                  });
                }
              });
              
              res.status(401).json({
                success: false,
                error: {
                  code: 'SESSION_HIJACK_DETECTED',
                  message: 'Suspicious activity detected. Please login again.',
                },
              });
              return;
            }

            // Check for user agent change
            if (securityInfo.userAgent !== req.get('user-agent')) {
              logger.warn('Suspicious session activity - User agent change', {
                userId,
                oldAgent: securityInfo.userAgent,
                newAgent: req.get('user-agent'),
              });
            }
          } else {
            // Store initial session security info
            await this.redis.set(
              sessionKey,
              JSON.stringify({
                userId,
                ip: req.ip,
                userAgent: req.get('user-agent'),
                createdAt: new Date().toISOString(),
              }),
              config.SESSION_EXPIRE / 1000
            );
          }
        } catch (error) {
          logger.error('Session security policy error', {
            userId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      next();
    };
  }

  /**
   * Get active sessions for a user
   */
  public async getActiveSessions(userId: string): Promise<any[]> {
    try {
      const pattern = `session:activity:${userId}`;
      const sessionData = await this.redis.get(pattern);
      
      if (!sessionData) {
        return [];
      }

      return [JSON.parse(sessionData)];
    } catch (error) {
      logger.error('Get active sessions error', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Terminate all sessions for a user
   */
  public async terminateUserSessions(userId: string): Promise<void> {
    try {
      // Clear session activity
      await this.redis.deletePattern(`session:activity:${userId}`);
      
      // Clear session security info
      await this.redis.deletePattern(`session:security:${userId}`);
      
      logger.info('User sessions terminated', { userId });
    } catch (error) {
      logger.error('Terminate user sessions error', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Clean up expired sessions
   */
  public async cleanupExpiredSessions(): Promise<void> {
    try {
      // MongoDB store handles this automatically with TTL
      logger.debug('Session cleanup triggered');
    } catch (error) {
      logger.error('Session cleanup error', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get session statistics
   */
  public async getSessionStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
  }> {
    try {
      // This would require querying the MongoDB sessions collection
      // For now, return placeholder data
      return {
        totalSessions: 0,
        activeSessions: 0,
      };
    } catch (error) {
      logger.error('Get session stats error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        totalSessions: 0,
        activeSessions: 0,
      };
    }
  }
}

// Extend Express session to include custom properties
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    tenantId?: string;
    userType?: string;
    loginAt?: string;
  }
}

export default SessionService;

