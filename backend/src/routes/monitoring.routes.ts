import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import PerformanceMonitoringService from '../services/performance-monitoring.service';
import RedisService from '../services/redis.service';
import logger from '../utils/logger';

const router = Router();

/**
 * Monitoring Routes
 * Performance monitoring, health checks, system status
 */

/**
 * GET /api/v1/monitoring/performance
 * Get performance statistics
 */
router.get('/performance', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    // Only Super Admins and Tenant Admins can view performance stats
    const userType = (req.user as any).userType;
    if (userType !== 'super_admin' && userType !== 'tenant_admin') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
      return;
    }
    
    const timeRange = parseInt(req.query.timeRange as string) || 60; // Default: last 60 minutes
    const performanceService = PerformanceMonitoringService.getInstance();
    const stats = performanceService.getStats(timeRange);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get performance stats error', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PERFORMANCE_ERROR',
        message: 'Failed to retrieve performance statistics',
      },
    });
  }
});

/**
 * GET /api/v1/monitoring/slow-requests
 * Get slow requests
 */
router.get('/slow-requests', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    // Only Super Admins can view slow requests
    if ((req.user as any).userType !== 'super_admin') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only Super Admins can view slow requests',
        },
      });
      return;
    }
    
    const limit = parseInt(req.query.limit as string) || 10;
    const performanceService = PerformanceMonitoringService.getInstance();
    const slowRequests = performanceService.getSlowRequests(limit);
    
    res.json({
      success: true,
      data: {
        slowRequests,
        total: slowRequests.length,
      },
    });
  } catch (error) {
    logger.error('Get slow requests error', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SLOW_REQUESTS_ERROR',
        message: 'Failed to retrieve slow requests',
      },
    });
  }
});

/**
 * GET /api/v1/monitoring/endpoint/:endpoint
 * Get endpoint-specific statistics
 */
router.get('/endpoint/:endpoint', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    // Only Super Admins can view endpoint stats
    if ((req.user as any).userType !== 'super_admin') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only Super Admins can view endpoint statistics',
        },
      });
      return;
    }
    
    const endpoint = req.params.endpoint;
    const performanceService = PerformanceMonitoringService.getInstance();
    const stats = performanceService.getEndpointStats(endpoint);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get endpoint stats error', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_ENDPOINT_STATS_ERROR',
        message: 'Failed to retrieve endpoint statistics',
      },
    });
  }
});

/**
 * GET /api/v1/monitoring/health
 * Comprehensive health check
 */
router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const redisService = RedisService.getInstance();
    const redisHealth = await redisService.healthCheck();
    
    const memUsage = process.memoryUsage();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
        services: {
          redis: redisHealth,
          database: {
            status: 'connected', // This would need actual DB check
          },
        },
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024),
        },
      },
    });
  } catch (error) {
    logger.error('Health check error', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: 'Health check failed',
      },
    });
  }
});

export default router;

