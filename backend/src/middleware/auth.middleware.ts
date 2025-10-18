/**
 * RCIC Authentication Middleware
 * Handles JWT authentication and authorization for all user types
 * 
 * @module middleware/auth
 */

import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/auth.utils';
import logger from '../utils/logger';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.config';

/**
 * Extend Express Request interface to include user and tenant
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        userType: 'super_admin' | 'tenant_admin' | 'team_member' | 'client';
        tenantId?: string;
        email: string;
        permissions: string[];
      };
      tenantId?: string;
      requestId?: string;
    }
  }
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user info to request
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REQUIRED',
          message: 'Access token is required'
        }
      });
      return;
    }

    // Validate Bearer format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Token must be in format: Bearer <token>'
        }
      });
      return;
    }

    const token = parts[1];
    
    // Validate token length (JWT is typically 100-500 chars)
    if (token.length < 20 || token.length > 1000) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Token format is invalid'
        }
      });
      return;
    }

    // Verify token
    const decoded = JWTUtils.verifyAccessToken(token);
    
    // Validate decoded payload
    if (!decoded.userId || !decoded.userType || !decoded.email) {
      throw new Error('Invalid token payload');
    }

    // Extract user information from token
    const { userId, userType, tenantId, email, permissions } = decoded;

    // Attach user info to request
    req.user = {
      userId,
      userType,
      tenantId,
      email,
      permissions: permissions || []
    };

    // Set tenantId for non-super-admin users
    if (userType !== 'super_admin' && tenantId) {
      req.tenantId = tenantId;
    }

    logger.debug('User authenticated', { 
      userId, 
      userType, 
      tenantId,
      email 
    });

    next();
  } catch (error) {
    logger.error('Authentication failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
};

/**
 * Optional Authentication Middleware
 * Verifies JWT token if present, but doesn't require it
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      // Validate Bearer format
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        
        // Validate token length
        if (token.length >= 20 && token.length <= 1000) {
          // Verify token if present and valid
          const decoded = JWTUtils.verifyAccessToken(token);
          
          // Validate decoded payload
          if (decoded.userId && decoded.userType && decoded.email) {
            // Extract user information from token
            const { userId, userType, tenantId, email, permissions } = decoded;

            // Attach user info to request
            req.user = {
              userId,
              userType,
              tenantId,
              email,
              permissions: permissions || []
            };

            // Set tenantId for non-super-admin users
            if (userType !== 'super_admin' && tenantId) {
              req.tenantId = tenantId;
            }
          }
        }
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens
    logger.debug('Optional authentication failed', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next();
  }
};

/**
 * Super Admin Only Middleware
 * Requires super admin authentication
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required'
      }
    });
    return;
  }

  if (req.user.userType !== 'super_admin') {
    res.status(403).json({
      success: false,
      error: {
        code: 'SUPER_ADMIN_REQUIRED',
        message: 'Super admin access required'
      }
    });
    return;
  }

  next();
};

/**
 * Tenant Admin Only Middleware
 * Requires tenant admin authentication
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
export const requireTenantAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required'
      }
    });
    return;
  }

  if (req.user.userType !== 'tenant_admin') {
    res.status(403).json({
      success: false,
      error: {
        code: 'TENANT_ADMIN_REQUIRED',
        message: 'Tenant admin access required'
      }
    });
    return;
  }

  next();
};

/**
 * Team Member Only Middleware
 * Requires team member authentication
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
export const requireTeamMember = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required'
      }
    });
    return;
  }

  if (req.user.userType !== 'team_member') {
    res.status(403).json({
      success: false,
      error: {
        code: 'TEAM_MEMBER_REQUIRED',
        message: 'Team member access required'
      }
    });
    return;
  }

  next();
};

/**
 * Client Only Middleware
 * Requires client authentication
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
export const requireClient = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required'
      }
    });
    return;
  }

  if (req.user.userType !== 'client') {
    res.status(403).json({
      success: false,
      error: {
        code: 'CLIENT_REQUIRED',
        message: 'Client access required'
      }
    });
    return;
  }

  next();
};

/**
 * Permission-based Authorization Middleware (Enhanced)
 * Checks if user has required permission with validation
 * 
 * @param requiredPermissions - Required permissions (supports multiple)
 * @returns Middleware function
 */
export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
      return;
    }

    // Validate permission format
    const invalidPermissions = requiredPermissions.filter(
      perm => !perm || typeof perm !== 'string' || perm.length > 100
    );
    
    if (invalidPermissions.length > 0) {
      logger.error('Invalid permission format', {
        invalidPermissions,
        requestId: req.requestId
      });
      res.status(500).json({
        success: false,
        error: {
          code: 'INVALID_PERMISSION_FORMAT',
          message: 'Internal error: Invalid permission configuration'
        }
      });
      return;
    }

    // Super admin has all permissions
    if (req.user.userType === 'super_admin') {
      next();
      return;
    }

    // Check if user has ANY of the required permissions
    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.some(perm => 
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      logger.warn('Permission denied', {
        userId: req.user.userId,
        userType: req.user.userType,
        required: requiredPermissions,
        has: userPermissions,
        resource: req.originalUrl.split('?')[0],
        requestId: req.requestId
      });
      
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to perform this action',
          required: requiredPermissions // Help frontend handle gracefully
        }
      });
      return;
    }

    next();
  };
};

/**
 * Rate Limiting for Authentication Endpoints (IP-based)
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.RATE_LIMIT_AUTH_MAX, // Use environment variable for auth rate limit
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
  // SECURITY: Removed skip condition to prevent bypass if NODE_ENV misconfigured
  // For development, configure separate rate limits via environment variables
});

/**
 * User-based Rate Limiting (for authenticated requests)
 * Prevents attacks with rotating proxies or distributed attacks
 */
export const userRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per user
  keyGenerator: (req: Request) => {
    // Use userId if authenticated, otherwise IP
    return req.user?.userId || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logger.warn('User rate limit exceeded', {
      userId: req.user?.userId,
      userType: req.user?.userType,
      ip: req.ip,
      path: req.originalUrl.split('?')[0]
    });
    
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.'
      }
    });
  },
  standardHeaders: true,
  legacyHeaders: false
  // SECURITY: Removed skip condition to prevent bypass if NODE_ENV misconfigured
  // For development, configure separate rate limits via environment variables
});

/**
 * Rate Limiting for Password Reset
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset attempts, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * DEPRECATED: Audit Logging Middleware
 * 
 * This middleware has been removed to prevent duplication.
 * Audit logging is now handled globally by AuditLoggingService.createAuditMiddleware()
 * configured in server.ts.
 * 
 * If you need route-specific audit logging, use:
 * - requirePermission() for access control
 * - AuditLoggingService.getInstance().logEvent() for custom audit events
 * 
 * @deprecated Use AuditLoggingService.createAuditMiddleware() instead
 */
export const auditLog = (_action: string, _resource: string) => {
  return async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // No-op: Global audit middleware handles all logging
    next();
  };
};

// Export alias for common usage
export const authMiddleware = authenticateToken;