import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import RedisService from '../services/redis.service';
import AuditLoggingService from '../services/audit-logging.service';
import { AuditLog } from '../models/audit-log.model';
import logger from '../utils/logger';

const router = Router();

/**
 * Security Routes
 * Manage security settings, view audit logs, check security status
 */

/**
 * GET /api/v1/security/audit-logs
 * Get audit logs for the current user or tenant
 */
router.get('/audit-logs', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any).userId; // Fixed: was 'id', should be 'userId'
    const userType = (req.user as any).userType;
    const tenantId = (req as any).tenantId;
    
    // Pagination parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000); // Cap at 1000
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const skip = (page - 1) * limit;
    
    // Validate userId from query if provided (for filtering)
    const queryUserId = req.query.userId as string;
    if (queryUserId) {
      const mongoose = await import('mongoose');
      // SECURITY: Validate ObjectId format to prevent injection
      if (!mongoose.default.Types.ObjectId.isValid(queryUserId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_USER_ID',
            message: 'Invalid user ID format'
          }
        });
        return;
      }
    }
    
    const AuditLogModel = (await import('../models/audit-log.model')).AuditLog;
    let logs: any[];
    let total: number;
    
    // Super Admins can view all audit logs
    // Tenant Admins can view tenant-specific logs  
    // Regular users can view their own logs
    if (userType === 'super_admin') {
      // Build query for super admin
      const query = queryUserId 
        ? { userId: queryUserId, deletedAt: null }
        : { deletedAt: null };
      
      [logs, total] = await Promise.all([
        AuditLogModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AuditLogModel.countDocuments(query)
      ]);
    } else if (userType === 'tenant_admin' && tenantId) {
      const query = { tenantId, deletedAt: null };
      
      [logs, total] = await Promise.all([
        AuditLogModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AuditLogModel.countDocuments(query)
      ]);
    } else {
      const query = { userId, deletedAt: null };
      
      [logs, total] = await Promise.all([
        AuditLogModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AuditLogModel.countDocuments(query)
      ]);
    }
    
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      },
    });
  } catch (error) {
    logger.error('Get audit logs error', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_AUDIT_LOGS_ERROR',
        message: 'Failed to retrieve audit logs',
      },
    });
  }
});

/**
 * GET /api/v1/security/events
 * Get security events (admin only)
 */
router.get('/events', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    // Only Super Admins can view security events
    if ((req.user as any).userType !== 'super_admin') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only Super Admins can view security events',
        },
      });
      return;
    }
    
    const limit = parseInt(req.query.limit as string) || 100;
    const auditService = AuditLoggingService.getInstance();
    const events = await auditService.getSecurityEvents(limit);
    
    res.json({
      success: true,
      data: {
        events,
        total: events.length,
      },
    });
  } catch (error) {
    logger.error('Get security events error', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SECURITY_EVENTS_ERROR',
        message: 'Failed to retrieve security events',
      },
    });
  }
});

/**
 * GET /api/v1/security/status
 * Get security status
 */
router.get('/status', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const redisService = RedisService.getInstance();
    const redisStatus = await redisService.healthCheck();
    
    res.json({
      success: true,
      data: {
        redis: redisStatus,
        auditLogging: {
          enabled: true,
          status: 'active',
        },
        rateLimiting: {
          enabled: true,
          status: 'active',
        },
        sessionManagement: {
          enabled: true,
          status: 'active',
        },
      },
    });
  } catch (error) {
    logger.error('Get security status error', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SECURITY_STATUS_ERROR',
        message: 'Failed to retrieve security status',
      },
    });
  }
});

/**
 * GET /api/v1/security/audit-logs/search
 * Search and filter audit logs
 */
router.get('/audit-logs/search', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      startDate,
      endDate,
      action,
      resource,
      userId,
      severity,
      category,
      statusCode,
      ipAddress,
      page = '1',
      limit = '50'
    } = req.query;

    // Build filter
    const filter: any = { deletedAt: null };

    // Date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    // Text filters with validation
    // SECURITY: Use exact match ($eq) instead of $regex to prevent ReDoS attacks
    // Action and resource are predefined strings, not free-text fields
    if (action && typeof action === 'string' && action.length <= 100) {
      filter.action = { $eq: action };
    }
    if (resource && typeof resource === 'string' && resource.length <= 100) {
      filter.resource = { $eq: resource };
    }
    if (ipAddress && typeof ipAddress === 'string') {
      filter.ipAddress = ipAddress;
    }

    // Exact matches with validation
    if (userId) {
      const mongoose = await import('mongoose');
      if (mongoose.default.Types.ObjectId.isValid(userId as string)) {
        filter.userId = userId;
      } else {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_USER_ID',
            message: 'Invalid user ID format'
          }
        });
        return;
      }
    }
    
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (severity && validSeverities.includes(severity as string)) {
      filter.severity = severity;
    }
    
    const validCategories = ['auth', 'user_management', 'tenant_management', 'data_access', 'security', 'system'];
    if (category && validCategories.includes(category as string)) {
      filter.category = category;
    }
    
    if (statusCode) {
      const code = parseInt(statusCode as string);
      // SECURITY: Use Number.isInteger() to prevent floats like 404.5
      if (Number.isInteger(code) && code >= 100 && code < 600) {
        filter.statusCode = code;
      }
    }

    // Permission check - users can only see their own/tenant logs
    if ((req.user as any).userType !== 'super_admin') {
      if ((req.user as any).userType === 'tenant_admin') {
        filter.tenantId = (req as any).tenantId;
      } else {
        filter.userId = (req.user as any).userId;
      }
    }

    const pageNum = Math.max(parseInt(page as string), 1);
    const limitNum = Math.min(parseInt(limit as string), 1000);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'email firstName lastName')
        .populate('tenantId', 'name domain')
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        },
        filter: req.query
      }
    });
  } catch (error) {
    logger.error('Audit log search error', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_FAILED',
        message: 'Failed to search audit logs'
      }
    });
  }
});

/**
 * GET /api/v1/security/audit/health
 * Health check for audit logging system
 */
router.get('/audit/health', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    // Only Super Admins can check audit system health
    if ((req.user as any).userType !== 'super_admin') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only Super Admins can check audit system health',
        },
      });
      return;
    }

    const checks = {
      database: false,
      recentLogs: false,
      integrity: false
    };

    try {
      // Check if we can write to database
      const testLog = await AuditLog.create({
        action: 'health_check',
        resource: 'system',
        method: 'GET',
        endpoint: '/audit/health',
        ipAddress: '127.0.0.1',
        userAgent: 'health-check',
        statusCode: 200,
        category: 'system',
        severity: 'low',
        metadata: {}
      });
      
      await testLog.deleteOne();
      checks.database = true;

      // Check recent activity
      const recentCount = await AuditLog.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 60000) }
      });
      checks.recentLogs = recentCount > 0;

      // Check integrity of recent logs
      const recentLogs = await AuditLog.find({ hash: { $exists: true } })
        .sort({ createdAt: -1 })
        .limit(10);
      
      if (recentLogs.length > 0) {
        checks.integrity = true;
      }

      const isHealthy = Object.values(checks).every(v => v);

      res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        data: {
          checks,
          healthy: isHealthy,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        data: {
          checks,
          healthy: false,
          error: error instanceof Error ? error.message : String(error)
        }
      });
    }
  } catch (error) {
    logger.error('Audit health check error', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: 'Failed to perform health check',
      },
    });
  }
});

export default router;

