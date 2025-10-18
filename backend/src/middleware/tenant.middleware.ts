/**
 * Tenant Middleware (SECURITY FIXED)
 * Resolves tenant context for RCIC system
 * 
 * Following CORE-CRITICAL Rule 10: Multi-tenant isolation
 * SECURITY FIX: Prevents tenant ID manipulation attacks
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Tenant } from '../models/tenant.model';
import { AuditLog } from '../models/audit-log.model';
import { ValidationUtils } from '../utils/validation.utils';
import logger from '../utils/logger';

/**
 * Extend Express Request interface to include tenant properties
 */
declare global {
  namespace Express {
    interface Request {
      tenant?: TenantInfo;
      tenantId?: string;
      tenantSource?: 'super_admin' | 'jwt' | 'header' | 'domain' | 'subdomain';
    }
  }
}

/**
 * Tenant Information Interface
 */
export interface TenantInfo {
  id: string;
  name: string;
  domain: string;
  status: string;
  plan: string;
}

/**
 * Resolve tenant middleware for RCIC system
 * 
 * Resolution order:
 * 1. Super Admin: No tenant required (system-wide access)
 * 2. JWT Token: tenantId from authenticated user
 * 3. X-Tenant-ID Header: Explicit tenant specification
 * 4. Domain/Subdomain: From request host
 */
export const resolveTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let tenant: typeof Tenant.prototype | null = null;
    let tenantSource: 'super_admin' | 'jwt' | 'header' | 'domain' | 'subdomain' = 'header';

    // 1. Super Admin: Can use X-Tenant-ID to impersonate
    if (req.user?.userType === 'super_admin') {
      const tenantIdHeader = req.headers['x-tenant-id'];
      
      // Validate and sanitize X-Tenant-ID header
      if (tenantIdHeader) {
        // SECURITY: Header values can be string[] or string, validate upfront
        if (Array.isArray(tenantIdHeader)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_TENANT_HEADER',
              message: 'X-Tenant-ID must be a single value, not an array'
            }
          });
          return;
        }
        
        // Validate input type
        if (typeof tenantIdHeader !== 'string') {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_TENANT_HEADER',
              message: 'X-Tenant-ID must be a string'
            }
          });
          return;
        }
        
        // Sanitize and validate ObjectId format
        const sanitized = tenantIdHeader.trim();
        
        if (sanitized.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(sanitized)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_TENANT_ID',
              message: 'Invalid tenant ID format'
            }
          });
          return;
        }
        
        try {
          tenant = await Tenant.findById(sanitized);
        } catch (error) {
          logger.error('Tenant lookup failed', {
            error: error instanceof Error ? error.message : String(error),
            tenantId: sanitized
          });
          
          res.status(500).json({
            success: false,
            error: {
              code: 'TENANT_LOOKUP_FAILED',
              message: 'Failed to lookup tenant'
            }
          });
          return;
        }
        
        if (tenant) {
          tenantSource = 'header';
          req.tenant = {
            id: tenant._id.toString(),
            name: tenant.name,
            domain: tenant.domain,
            status: tenant.status,
            plan: tenant.plan
          };
          req.tenantId = tenant._id.toString();
          req.tenantSource = tenantSource;
          
          logger.debug('Tenant resolution: Super Admin impersonation', { 
            tenantId: tenant._id.toString(),
            tenantName: tenant.name 
          });
        }
      } else {
        tenantSource = 'super_admin';
        req.tenantSource = tenantSource;
        logger.debug('Tenant resolution: Super Admin - no tenant required');
      }
      next();
      return;
    }

    // 2. Regular users: ONLY use JWT tenant (ignore headers for security)
    if (req.user?.tenantId) {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(req.user.tenantId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TENANT_ID',
            message: 'Invalid tenant ID in token'
          }
        });
        return;
      }

      const jwtTenantId = ValidationUtils.validateObjectId(req.user.tenantId, 'JWT Tenant ID');
      tenant = await Tenant.findById(jwtTenantId);
      tenantSource = 'jwt';
      
      // ⚠️ SECURITY: Verify header matches JWT if provided
      const tenantIdHeader = req.headers['x-tenant-id'] as string;
      if (tenantIdHeader && tenantIdHeader !== req.user.tenantId) {
        logger.warn('Tenant ID mismatch attack detected', {
          userId: req.user.userId,
          jwtTenant: req.user.tenantId,
          headerTenant: tenantIdHeader,
          ip: req.ip
        });
        
        res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_MISMATCH',
            message: 'Tenant access denied'
          }
        });
        return;
      }
      
      if (tenant) {
        logger.debug('Tenant resolution: JWT', { 
          tenantId: tenant._id.toString(),
          tenantName: tenant.name 
        });
      }
    }

    // 3. Domain/Subdomain (only for unauthenticated requests)
    if (!tenant && !req.user) {
      const host = req.get('host') || '';
      const [subdomain] = host.split('.');
      
      // Try subdomain first
      tenant = await Tenant.findOne({ subdomain, deletedAt: null });
      if (tenant) {
        tenantSource = 'subdomain';
        logger.debug('Tenant resolution: Subdomain', { 
          subdomain,
          tenantId: tenant._id.toString(),
          tenantName: tenant.name 
        });
      } else {
        // Try full domain
        tenant = await Tenant.findOne({ domain: host, deletedAt: null });
        if (tenant) {
          tenantSource = 'domain';
          logger.debug('Tenant resolution: Domain', { 
            domain: host,
            tenantId: tenant._id.toString(),
            tenantName: tenant.name 
          });
        }
      }
    }

    // Tenant not found
    if (!tenant) {
      logger.warn('Tenant resolution failed', { 
        userType: req.user?.userType,
        userId: req.user?.userId,
        host: req.get('host')
      });
      
      res.status(400).json({
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: 'Tenant not found or not specified'
        }
      });
      return;
    }

    // Check tenant status
    if (tenant.status !== 'active') {
      logger.warn('Inactive tenant access attempt', { 
        tenantId: tenant._id.toString(),
        status: tenant.status 
      });
      
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_INACTIVE',
          message: 'This tenant account is not active'
        }
      });
      return;
    }

    // Attach tenant info to request
    req.tenant = {
      id: tenant._id.toString(),
      name: tenant.name,
      domain: tenant.domain,
      status: tenant.status,
      plan: tenant.plan
    };
    req.tenantId = tenant._id.toString();
    req.tenantSource = tenantSource;

    // Log tenant resolution
    await AuditLog.create({
      userId: req.user?.userId ? req.user.userId : undefined,
      tenantId: tenant._id,
      action: 'tenant_resolved',
      resource: 'tenant',
      resourceId: tenant._id.toString(),
      method: req.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      endpoint: req.originalUrl.split('?')[0],
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      statusCode: 200,
      category: 'tenant_management',
      severity: 'low',
      metadata: {
        source: tenantSource,
        userType: req.user?.userType
      }
    });

    next();
  } catch (error) {
    logger.error('Tenant resolution error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.userId,
      requestId: req.requestId
    });
    
    // Don't reveal internal errors to user
    res.status(400).json({
      success: false,
      error: {
        code: 'TENANT_REQUIRED',
        message: 'Unable to determine tenant context. Please specify tenant or check your access.',
        // In development only:
        ...(process.env.NODE_ENV === 'development' && {
          debug: error instanceof Error ? error.message : undefined
        })
      }
    });
  }
};

/**
 * Require tenant middleware
 * Ensures a tenant is attached to the request
 */
export const requireTenant = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Super Admin: Skip tenant requirement
  if (req.user?.userType === 'super_admin') {
    next();
    return;
  }

  if (!req.tenantId || !req.tenant) {
    res.status(400).json({
      success: false,
      error: {
        code: 'TENANT_REQUIRED',
        message: 'Tenant context is required for this operation'
      }
    });
    return;
  }

  next();
};

/**
 * Validate tenant access
 * Ensures user has access to the tenant
 */
export const validateTenantAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Super Admin: Has access to all tenants
  if (req.user?.userType === 'super_admin') {
    next();
    return;
  }

  // Check if user's tenant matches the requested tenant
  if (req.user?.tenantId !== req.tenantId) {
    logger.warn('Tenant access violation attempt', {
      userId: req.user?.userId,
      userTenantId: req.user?.tenantId,
      requestedTenantId: req.tenantId
    });

    res.status(403).json({
      success: false,
      error: {
        code: 'TENANT_ACCESS_DENIED',
        message: 'Access denied to this tenant'
      }
    });
    return;
  }

  next();
};