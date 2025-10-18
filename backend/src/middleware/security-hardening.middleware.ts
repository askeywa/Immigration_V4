import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Security Hardening Middleware Collection
 * Provides comprehensive security features: CSRF, XSS, Input Validation, etc.
 */

/**
 * CSRF Protection Middleware
 * Validates CSRF tokens for state-changing requests
 */
export const csrfProtection = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip CSRF for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Skip CSRF for API endpoints using JWT (they have their own protection)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return next();
    }

    // For session-based requests, validate CSRF token
    const csrfToken = req.headers['x-csrf-token'] as string;
    const sessionToken = req.session?.csrfToken;

    if (!csrfToken || csrfToken !== sessionToken) {
      logger.warn('CSRF token validation failed', {
        ip: req.ip,
        path: req.originalUrl.split('?')[0],
        method: req.method,
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_INVALID',
          message: 'Invalid CSRF token',
        },
      });
      return;
    }

    next();
  };
};

/**
 * XSS Protection Middleware
 * Sanitizes request data to prevent XSS attacks
 */
export const xssProtection = () => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
      }

      // Sanitize URL parameters
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params);
      }

      next();
    } catch (error) {
      logger.error('XSS protection error', {
        error: error instanceof Error ? error.message : String(error),
      });
      next(); // Fail open
    }
  };
};

/**
 * Sanitize an object recursively
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  return obj;
}

/**
 * Sanitize a string to prevent XSS
 */
function sanitizeString(str: string): string {
  if (!str) return str;

  // Remove dangerous HTML tags and attributes
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '');
}

/**
 * Content Type Validation
 * Ensures requests have appropriate content types
 */
export const contentTypeValidation = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Check content type for POST, PUT, PATCH
    const contentType = req.get('content-type');

    if (!contentType) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CONTENT_TYPE',
          message: 'Content-Type header is required',
        },
      });
      return;
    }

    // Allow JSON and form data
    const allowedTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
    ];

    const isAllowed = allowedTypes.some((type) => contentType.includes(type));

    if (!isAllowed) {
      logger.warn('Invalid content type', {
        contentType,
        ip: req.ip,
        path: req.originalUrl.split('?')[0],
      });

      res.status(415).json({
        success: false,
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Unsupported content type',
        },
      });
      return;
    }

    next();
  };
};

/**
 * Input Validation Middleware
 * Validates common input patterns
 */
export const inputValidation = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body size (already handled by express.json, but double-check)
      const bodySize = JSON.stringify(req.body).length;
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (bodySize > maxSize) {
        logger.warn('Request body too large', {
          size: bodySize,
          ip: req.ip,
        });

        res.status(413).json({
          success: false,
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: 'Request body is too large',
          },
        });
        return;
      }

      // Validate string lengths
      if (req.body && typeof req.body === 'object') {
        const violations = validateStringLengths(req.body);
        if (violations.length > 0) {
          logger.warn('String length validation failed', {
            violations,
            ip: req.ip,
          });

          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_INPUT_LENGTH',
              message: 'Input field exceeds maximum length',
              details: violations,
            },
          });
          return;
        }
      }

      next();
    } catch (error) {
      logger.error('Input validation error', {
        error: error instanceof Error ? error.message : String(error),
      });
      next(); // Fail open
    }
  };
};

/**
 * Validate string lengths in an object
 */
function validateStringLengths(obj: any, path = ''): string[] {
  const violations: string[] = [];
  const maxLength = 10000; // Maximum string length

  if (typeof obj === 'string' && obj.length > maxLength) {
    violations.push(`${path}: ${obj.length} characters (max: ${maxLength})`);
    return violations;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      violations.push(...validateStringLengths(item, `${path}[${index}]`));
    });
    return violations;
  }

  if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newPath = path ? `${path}.${key}` : key;
        violations.push(...validateStringLengths(obj[key], newPath));
      }
    }
  }

  return violations;
}

/**
 * Security Monitoring Middleware
 * Logs security-related events
 */
export const securityMonitoring = () => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Track suspicious patterns
    const suspiciousPatterns = [
      /\.\.\//g, // Path traversal
      /etc\/passwd/gi, // File access attempts
      /cmd\.exe/gi, // Command injection
      /exec\s*\(/gi, // Code injection
      /union\s+select/gi, // SQL injection (MongoDB doesn't use SQL, but still monitor)
    ];

    const fullUrl = `${req.method} ${req.originalUrl.split('?')[0]} ${JSON.stringify(req.body)}`;
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fullUrl)) {
        logger.warn('Suspicious request pattern detected', {
          pattern: pattern.toString(),
          method: req.method,
          path: req.originalUrl.split('?')[0],
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        break;
      }
    }

    next();
  };
};

/**
 * Request Size Limiter
 * Limits request body size
 */
export const requestSizeLimit = (_limit: string) => {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    // This is handled by express.json({ limit }), but we can add extra validation
    next();
  };
};

/**
 * Tenant Security Validation
 * Ensures tenant-specific security rules
 */
export const tenantSecurityValidation = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip for public endpoints
    const currentPath = req.originalUrl.split('?')[0];
    if (currentPath.includes('/health') || currentPath.includes('/auth/login')) {
      return next();
    }

    // Ensure tenantId is set for authenticated requests
    if (req.user && !(req as any).tenantId) {
      logger.error('Missing tenantId for authenticated request', {
        userId: (req.user as any).id,
        path: req.originalUrl.split('?')[0],
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_VALIDATION_FAILED',
          message: 'Tenant validation failed',
        },
      });
      return;
    }

    next();
  };
};

/**
 * Security Headers Middleware
 * Already handled by Helmet, but can add custom headers
 */
export const customSecurityHeaders = () => {
  return (_req: Request, res: Response, next: NextFunction): void => {
    // Add custom security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
  };
};

/**
 * Declare CSRF token in session
 */
declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
  }
}

