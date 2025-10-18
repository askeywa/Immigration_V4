import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import TenantResolutionService from '../services/tenant-resolution.service';

/**
 * Data Isolation Middleware
 * Ensures strict tenant data isolation and prevents cross-tenant data leaks
 * CRITICAL for multi-tenant security
 */

/**
 * Comprehensive Tenant Resolution Middleware
 * Resolves and attaches tenant information to all requests
 */
export const comprehensiveTenantResolution = () => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Skip tenant resolution for public endpoints
      const publicPaths = ['/health', '/api/v1/auth/login', '/api/v1/auth/register'];
      const currentPath = req.originalUrl.split('?')[0];
      if (publicPaths.some((path) => currentPath.includes(path))) {
        return next();
      }

      const tenantService = TenantResolutionService.getInstance();
      const tenant = await tenantService.resolveTenantFromRequest(req);

      if (tenant) {
        // Attach tenant to request
        (req as any).tenantId = tenant.id;
        (req as any).tenant = tenant;

        logger.debug('Tenant resolved', {
          tenantId: tenant.id,
          domain: tenant.domain,
          path: req.originalUrl.split('?')[0],
        });
      } else {
        logger.warn('Tenant resolution failed', {
          host: req.get('host'),
          path: req.originalUrl.split('?')[0],
          user: req.user ? (req.user as any).id : null,
        });
      }

      next();
    } catch (error) {
      logger.error('Tenant resolution middleware error', {
        error: error instanceof Error ? error.message : String(error),
      });
      next(); // Continue without tenant info (endpoint will handle missing tenant)
    }
  };
};

/**
 * Tenant ID Enforcement Middleware
 * Ensures tenantId is present for protected endpoints
 */
export const tenantIdEnforcement = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip for public endpoints
    const publicPaths = ['/health', '/api/v1/auth/login', '/api/v1/auth/register'];
      if (publicPaths.some((path) => req.originalUrl.split('?')[0].includes(path))) {
      return next();
    }

    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      logger.error('Missing tenantId for protected endpoint', {
        path: req.originalUrl.split('?')[0],
        method: req.method,
        user: req.user ? (req.user as any).id : null,
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant identification required',
        },
      });
      return;
    }

    next();
  };
};

/**
 * Query Validation Middleware
 * Validates that database queries include tenantId filter
 */
export const queryValidation = () => {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    // This is a placeholder for query validation
    // In practice, this would be enforced at the model/service layer
    next();
  };
};

/**
 * Cross-Tenant Access Prevention Middleware
 * Validates that users can only access data from their own tenant
 */
export const crossTenantAccessPrevention = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const requestTenantId = (req as any).tenantId;
      const userTenantId = req.user ? (req.user as any).tenantId : null;

      // Skip if no user (public endpoint)
      if (!req.user) {
        return next();
      }

      // Skip for Super Admins (they can access all tenants)
      if (req.user && (req.user as any).userType === 'super_admin') {
        logger.debug('Super Admin bypass for cross-tenant check', {
          userId: (req.user as any).id,
        });
        return next();
      }

      // Validate tenant match
      if (requestTenantId && userTenantId && requestTenantId !== userTenantId) {
        logger.warn('Cross-tenant access attempt detected', {
          userId: (req.user as any).id,
          userTenantId,
          requestTenantId,
          path: req.originalUrl.split('?')[0],
        });

        res.status(403).json({
          success: false,
          error: {
            code: 'CROSS_TENANT_ACCESS_DENIED',
            message: 'Access to another tenant\'s data is not allowed',
          },
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Cross-tenant access prevention error', {
        error: error instanceof Error ? error.message : String(error),
      });
      next(); // Fail open (endpoint will handle authorization)
    }
  };
};

/**
 * Data Isolation Monitoring Middleware
 * Logs and monitors data isolation events
 */
export const dataIsolationMonitoring = () => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Track tenant-specific requests
      const tenantId = (req as any).tenantId;
      const userId = req.user ? (req.user as any).id : null;

      if (tenantId) {
        logger.debug('Data isolation check', {
          tenantId,
          userId,
          path: req.originalUrl.split('?')[0],
          method: req.method,
        });
      }

      next();
    } catch (error) {
      logger.error('Data isolation monitoring error', {
        error: error instanceof Error ? error.message : String(error),
      });
      next();
    }
  };
};

/**
 * Comprehensive Data Isolation Middleware
 * Combines all data isolation checks
 */
export const comprehensiveDataIsolation = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip for public endpoints
    const publicPaths = ['/health', '/api/v1/auth/login', '/api/v1/auth/register'];
      if (publicPaths.some((path) => req.originalUrl.split('?')[0].includes(path))) {
      return next();
    }

    try {
      // 1. Ensure tenantId is present
      const tenantId = (req as any).tenantId;
      if (!tenantId && req.user) {
        logger.error('Missing tenantId for authenticated request', {
          userId: (req.user as any).id,
          path: req.originalUrl.split('?')[0],
        });

        res.status(400).json({
          success: false,
          error: {
            code: 'TENANT_REQUIRED',
            message: 'Tenant identification required',
          },
        });
        return;
      }

      // 2. Validate cross-tenant access
      const userTenantId = req.user ? (req.user as any).tenantId : null;
      const isSuperAdmin = req.user && (req.user as any).userType === 'super_admin';

      if (tenantId && userTenantId && tenantId !== userTenantId && !isSuperAdmin) {
        logger.warn('Cross-tenant access attempt', {
          userId: (req.user as any).id,
          userTenantId,
          requestTenantId: tenantId,
        });

        res.status(403).json({
          success: false,
          error: {
            code: 'CROSS_TENANT_ACCESS_DENIED',
            message: 'Access denied',
          },
        });
        return;
      }

      // 3. Monitor isolation
      logger.debug('Data isolation validated', {
        tenantId,
        userId: req.user ? (req.user as any).id : null,
        path: req.originalUrl.split('?')[0],
      });

      next();
    } catch (error) {
      logger.error('Comprehensive data isolation error', {
        error: error instanceof Error ? error.message : String(error),
      });
      next(); // Fail open
    }
  };
};

/**
 * Row-Level Security Helper
 * Ensures all database queries include tenantId filter
 */
export const applyRowLevelSecurity = (query: any, tenantId: string): any => {
  if (!query) {
    return { tenantId };
  }

  // Ensure tenantId is in the query
  return {
    ...query,
    tenantId,
  };
};

/**
 * Extend Express Request to include tenant information
 */
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenant?: {
        id: string;
        domain: string;
        name: string;
        status: string;
        plan: string;
      };
    }
  }
}

