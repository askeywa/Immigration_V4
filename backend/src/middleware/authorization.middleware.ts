/**
 * Authorization Middleware
 * Implements Role-Based Access Control (RBAC) for the RCIC system
 * 
 * Following CORE-CRITICAL Rule 23: Authorization ≠ Authentication
 * 
 * @module middleware/authorization
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger';

/**
 * Authorization Rules Configuration
 * Maps routes to allowed user types
 */
const AUTHORIZATION_RULES: Record<string, string[]> = {
  // User routes
  'GET:/users': ['super_admin', 'tenant_admin'],
  'POST:/users': ['super_admin', 'tenant_admin'],
  'GET:/users/:id': ['super_admin', 'tenant_admin', 'team_member'], // Self check in controller
  'PUT:/users/:id': ['super_admin', 'tenant_admin', 'team_member'], // Self check in controller
  'DELETE:/users/:id': ['super_admin', 'tenant_admin'],
  
  // Tenant routes
  'GET:/tenants': ['super_admin'],
  'POST:/tenants': ['super_admin'],
  'GET:/tenants/:id': ['super_admin', 'tenant_admin'], // Self check in controller
  'PUT:/tenants/:id': ['super_admin', 'tenant_admin'], // Self check in controller
  'DELETE:/tenants/:id': ['super_admin'],
  
  // Team member routes
  'GET:/team-members': ['super_admin', 'tenant_admin'],
  'POST:/team-members': ['super_admin', 'tenant_admin'],
  'GET:/team-members/:id': ['super_admin', 'tenant_admin', 'team_member'], // Self check
  'PUT:/team-members/:id': ['super_admin', 'tenant_admin', 'team_member'], // Self check
  'DELETE:/team-members/:id': ['super_admin', 'tenant_admin'],
  
  // Client routes
  'GET:/clients': ['super_admin', 'tenant_admin', 'team_member'],
  'POST:/clients': ['super_admin', 'tenant_admin', 'team_member'],
  'GET:/clients/:id': ['super_admin', 'tenant_admin', 'team_member', 'client'], // Access check in controller
  'PUT:/clients/:id': ['super_admin', 'tenant_admin', 'team_member', 'client'], // Access check in controller
  'DELETE:/clients/:id': ['super_admin', 'tenant_admin'],
  
  // Audit logs
  'GET:/security/audit-logs': ['super_admin', 'tenant_admin', 'team_member'],
  'GET:/security/events': ['super_admin'],
};

/**
 * Check if user can access route (basic role check)
 * This is the first layer - checks if user's ROLE is allowed
 */
export const authorizeRoute = () => {
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

    // Build route key (normalize path to match rules)
    const normalizedPath = req.route?.path || req.path;
    const routeKey = `${req.method}:${normalizedPath}`;
    const allowedRoles = AUTHORIZATION_RULES[routeKey];

    if (!allowedRoles) {
      // Route not in rules = allow (will be caught by 404 or other middleware)
      next();
      return;
    }

    // Check if user's role is allowed
    if (!allowedRoles.includes(req.user.userType)) {
      logger.warn('Authorization failed - insufficient role', {
        userId: req.user.userId,
        userType: req.user.userType,
        route: routeKey,
        allowedRoles,
        requestId: req.headers['x-request-id']
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource'
        }
      });
      return;
    }

    // Role check passed, proceed to resource ownership check (if needed)
    next();
  };
};

/**
 * Check resource ownership (for :id routes)
 * This is the second layer - checks if user can access THIS SPECIFIC resource
 */
export const checkResourceOwnership = (resourceType: 'user' | 'tenant' | 'client' | 'team_member' | 'case') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' }
      });
      return;
    }

    // Super admin bypasses all ownership checks
    if (req.user.userType === 'super_admin') {
      next();
      return;
    }

    const resourceId = req.params.id;

    // Validate ObjectId
    if (!resourceId || !mongoose.Types.ObjectId.isValid(resourceId)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid resource ID' }
      });
      return;
    }

    try {
      let hasAccess = false;

      switch (resourceType) {
        case 'user':
        case 'team_member':
          // Can access if it's themselves
          hasAccess = req.user.userId === resourceId;
          
          // Tenant admin can access users in their tenant
          if (!hasAccess && req.user.userType === 'tenant_admin' && req.user.tenantId) {
            const User = (await import('../models/user.model')).User;
            const targetUser = await User.findById(resourceId).select('tenantId');
            hasAccess = targetUser?.tenantId?.toString() === req.user.tenantId;
          }
          break;

        case 'tenant':
          // Can only access their own tenant
          hasAccess = req.user.tenantId === resourceId;
          break;

        case 'client':
          // Client can access themselves
          if (req.user.userType === 'client') {
            hasAccess = req.user.userId === resourceId;
          }
          
          // Tenant admin can access clients in their tenant
          if (!hasAccess && req.user.userType === 'tenant_admin' && req.user.tenantId) {
            const { User } = await import('../models/user.model');
            const client = await User.findById(resourceId).select('tenantId');
            hasAccess = client?.tenantId?.toString() === req.user.tenantId;
          }
          
          // Team member can access assigned clients (requires Assignment model)
          if (!hasAccess && req.user.userType === 'team_member') {
            // TODO: Implement Assignment model - currently blocking team_member client access to force implementation
            // This prevents accidental privilege leaks by failing fast instead of granting tenant-wide access
            logger.error('Assignment model not implemented - team member client access blocked', {
              userId: req.user.userId,
              clientId: resourceId,
              requestId: req.headers['x-request-id']
            });
            
            throw new Error('Assignment model not implemented. Team members cannot access clients until proper assignment tracking is in place.');
          }
          break;

        case 'case':
          // Similar logic for cases (TODO: implement when Case model exists)
          if (req.user.userType === 'tenant_admin' && req.user.tenantId) {
            // TODO: Implement when Case model is created
            // const Case = (await import('../models/case.model')).Case;
            // const caseDoc = await Case.findById(resourceId).select('tenantId');
            // hasAccess = caseDoc?.tenantId?.toString() === req.user.tenantId;
            hasAccess = true; // Temporary: allow tenant admin
          }
          
          if (!hasAccess && req.user.userType === 'team_member') {
            // TODO: Implement assignment-based case access
            hasAccess = true; // Temporary: allow team member
          }
          
          if (!hasAccess && req.user.userType === 'client') {
            // TODO: Implement when Case model is created
            // const Case = (await import('../models/case.model')).Case;
            // const caseDoc = await Case.findById(resourceId).select('clientId');
            // hasAccess = caseDoc?.clientId?.toString() === req.user.userId;
            hasAccess = true; // Temporary: allow client
          }
          break;
      }

      if (!hasAccess) {
        logger.warn('Resource access denied - ownership check failed', {
          userId: req.user.userId,
          userType: req.user.userType,
          resourceType,
          resourceId,
          requestId: req.headers['x-request-id']
        });

        res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'You do not have access to this resource'
          }
        });
        return;
      }

      // Ownership check passed
      next();
    } catch (error) {
      logger.error('Authorization check failed', {
        error: error instanceof Error ? error.message : String(error),
        resourceType,
        resourceId,
        userId: req.user.userId,
        requestId: req.headers['x-request-id']
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Failed to verify access'
        }
      });
    }
  };
};

/**
 * Tenant isolation check - ensures user can only access their own tenant's data
 * Use this for list endpoints (e.g., GET /clients)
 */
export const enforceTenantIsolation = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' }
      });
      return;
    }

    // Super admin can access all tenants
    if (req.user.userType === 'super_admin') {
      next();
      return;
    }

    // All other users must have tenantId
    if (!req.user.tenantId) {
      logger.error('Missing tenantId for non-super-admin user', {
        userId: req.user.userId,
        userType: req.user.userType,
        requestId: req.headers['x-request-id']
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_ISOLATION_VIOLATION',
          message: 'Access denied - tenant context required'
        }
      });
      return;
    }

    // Tenant isolation enforced - proceed
    next();
  };
};

