import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Performance Metrics Interface
 */
interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
  memoryUsage: NodeJS.MemoryUsage;
}

/**
 * Performance Statistics
 */
interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  slowestEndpoint: string;
  fastestEndpoint: string;
  errorRate: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
}

/**
 * Performance Monitoring Service
 * Tracks API performance, memory usage, and response times
 * Lightweight alternative to New Relic for development
 */
class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics
  private readonly SLOW_THRESHOLD_MS = 1000; // 1 second
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Initialize performance monitoring
   */
  public static initialize(): void {
    const instance = PerformanceMonitoringService.getInstance();
    instance.startCleanup();
    logger.info('Performance Monitoring Service initialized');
  }

  /**
   * Start cleanup interval
   */
  private startCleanup(): void {
    // Clean up old metrics every 5 minutes
    this.cleanupInterval = setInterval(() => {
      if (this.metrics.length > this.MAX_METRICS) {
        this.metrics = this.metrics.slice(-this.MAX_METRICS);
        logger.debug('Performance metrics cleaned up', {
          remaining: this.metrics.length,
        });
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Record a performance metric
   */
  public recordMetric(metric: PerformanceMetric): void {
    try {
      this.metrics.push(metric);

      // Log slow requests
      if (metric.duration > this.SLOW_THRESHOLD_MS) {
        logger.warn('Slow request detected', {
          endpoint: metric.endpoint,
          method: metric.method,
          duration: metric.duration,
          statusCode: metric.statusCode,
        });
      }

      // Keep metrics within limit
      if (this.metrics.length > this.MAX_METRICS) {
        this.metrics.shift(); // Remove oldest
      }
    } catch (error) {
      logger.error('Failed to record metric', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get performance statistics
   */
  public getStats(timeRange?: number): PerformanceStats {
    try {
      // Filter metrics by time range (in minutes)
      let metricsToAnalyze = this.metrics;
      if (timeRange) {
        const cutoffTime = Date.now() - timeRange * 60 * 1000;
        metricsToAnalyze = this.metrics.filter(
          (m) => m.timestamp.getTime() > cutoffTime
        );
      }

      if (metricsToAnalyze.length === 0) {
        return this.getEmptyStats();
      }

      // Calculate statistics
      const totalRequests = metricsToAnalyze.length;
      const totalDuration = metricsToAnalyze.reduce((sum, m) => sum + m.duration, 0);
      const averageResponseTime = totalDuration / totalRequests;

      // Find slowest and fastest endpoints
      const endpointDurations: Map<string, number[]> = new Map();
      metricsToAnalyze.forEach((metric) => {
        const key = `${metric.method} ${metric.endpoint}`;
        if (!endpointDurations.has(key)) {
          endpointDurations.set(key, []);
        }
        endpointDurations.get(key)!.push(metric.duration);
      });

      let slowestEndpoint = '';
      let slowestAvg = 0;
      let fastestEndpoint = '';
      let fastestAvg = Infinity;

      endpointDurations.forEach((durations, endpoint) => {
        const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        if (avg > slowestAvg) {
          slowestAvg = avg;
          slowestEndpoint = endpoint;
        }
        if (avg < fastestAvg) {
          fastestAvg = avg;
          fastestEndpoint = endpoint;
        }
      });

      // Calculate error rate
      const errorCount = metricsToAnalyze.filter((m) => m.statusCode >= 400).length;
      const errorRate = (errorCount / totalRequests) * 100;

      // Get current memory usage
      const memUsage = process.memoryUsage();

      return {
        totalRequests,
        averageResponseTime: Math.round(averageResponseTime),
        slowestEndpoint: `${slowestEndpoint} (${Math.round(slowestAvg)}ms)`,
        fastestEndpoint: `${fastestEndpoint} (${Math.round(fastestAvg)}ms)`,
        errorRate: Math.round(errorRate * 100) / 100,
        memoryUsage: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024),
        },
      };
    } catch (error) {
      logger.error('Failed to get performance stats', {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.getEmptyStats();
    }
  }

  /**
   * Get empty stats
   */
  private getEmptyStats(): PerformanceStats {
    const memUsage = process.memoryUsage();
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      slowestEndpoint: 'N/A',
      fastestEndpoint: 'N/A',
      errorRate: 0,
      memoryUsage: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
      },
    };
  }

  /**
   * Get endpoint-specific stats
   */
  public getEndpointStats(endpoint: string): {
    totalRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    errorRate: number;
  } {
    try {
      const endpointMetrics = this.metrics.filter((m) => m.endpoint === endpoint);

      if (endpointMetrics.length === 0) {
        return {
          totalRequests: 0,
          averageResponseTime: 0,
          minResponseTime: 0,
          maxResponseTime: 0,
          errorRate: 0,
        };
      }

      const totalRequests = endpointMetrics.length;
      const durations = endpointMetrics.map((m) => m.duration);
      const averageResponseTime =
        durations.reduce((sum, d) => sum + d, 0) / totalRequests;
      const minResponseTime = Math.min(...durations);
      const maxResponseTime = Math.max(...durations);
      const errorCount = endpointMetrics.filter((m) => m.statusCode >= 400).length;
      const errorRate = (errorCount / totalRequests) * 100;

      return {
        totalRequests,
        averageResponseTime: Math.round(averageResponseTime),
        minResponseTime: Math.round(minResponseTime),
        maxResponseTime: Math.round(maxResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
      };
    } catch (error) {
      logger.error('Failed to get endpoint stats', {
        endpoint,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        errorRate: 0,
      };
    }
  }

  /**
   * Get slow requests
   */
  public getSlowRequests(limit = 10): PerformanceMetric[] {
    try {
      return [...this.metrics]
        .filter((m) => m.duration > this.SLOW_THRESHOLD_MS)
        .sort((a, b) => b.duration - a.duration)
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get slow requests', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Create monitoring middleware
   */
  public static createMonitoringMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const startTime = Date.now();

      // Capture response
      const originalSend = res.send;
      res.send = function (data: any) {
        const duration = Date.now() - startTime;
        const endMemory = process.memoryUsage();

        // Record metric
        const instance = PerformanceMonitoringService.getInstance();
        instance.recordMetric({
          endpoint: req.originalUrl.split('?')[0],
          method: req.method,
          duration,
          statusCode: res.statusCode,
          timestamp: new Date(),
          memoryUsage: endMemory,
        });

        // Add performance headers
        res.setHeader('X-Response-Time', `${duration}ms`);

        return originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    try {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }
      this.metrics = [];
      logger.info('Performance Monitoring Service cleaned up');
    } catch (error) {
      logger.error('Performance monitoring cleanup error', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export default PerformanceMonitoringService;

