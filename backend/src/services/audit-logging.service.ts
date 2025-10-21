import { Request, Response, NextFunction } from 'express';
import CircuitBreaker from 'opossum';
import Queue from 'bull';
import { AuditLog } from '../models/audit-log.model';
import logger from '../utils/logger';
import { AUDIT_CONFIG } from '../config/audit.config';
import { config } from '../config/env.config';

/**
 * Audit Log Entry Interface
 */
export interface AuditLogEntry {
  userId?: string;
  tenantId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  ipAddress: string;
  userAgent: string;
  statusCode: number;
  requestBody?: any;
  responseData?: any;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category: 'auth' | 'user_management' | 'tenant_management' | 'data_access' | 'security' | 'system';
}

/**
 * Audit Logging Service
 * Comprehensive audit trail system for compliance and security
 */
class AuditLoggingService {
  private static instance: AuditLoggingService | null = null;
  private static creating = false;
  private isEnabled = true;
  private failureCount = 0;
  private lastFailure: Date | null = null;
  private circuitBreaker: CircuitBreaker;
  private auditQueue: Queue.Queue | null = null;
  private queueAvailable = false;

  private constructor() {
    // Private constructor for singleton
    
    // Initialize audit queue for async processing (with fallback)
    try {
      this.auditQueue = new Queue('audit-logs', {
        redis: {
          host: config.REDIS_HOST || 'localhost',
          port: config.REDIS_PORT || 6379
        }
      });

      // Process audit log jobs
      this.auditQueue.process(async (job) => {
        await this.processAuditLog(job.data);
      });

      // Queue event handlers
      this.auditQueue.on('failed', (job, err) => {
        logger.error('Audit queue job failed', {
          jobId: job.id,
          error: err.message,
          action: job.data.action
        });
      });

      this.auditQueue.on('completed', (job) => {
        logger.debug('Audit queue job completed', {
          jobId: job.id,
          action: job.data.action
        });
      });

      this.queueAvailable = true;
      logger.info('✅ Audit queue initialized (async mode)');
    } catch (error) {
      logger.warn('⚠️ Bull queue initialization failed, using direct save fallback', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      this.queueAvailable = false;
      
      // SECURITY: If REQUIRE_AUDIT_QUEUE is true, fail fast instead of fallback
      // This ensures production environments have proper audit infrastructure
      if (config.REQUIRE_AUDIT_QUEUE === 'true') {
        logger.error('❌ REQUIRE_AUDIT_QUEUE is enabled but queue initialization failed', {
          error: error instanceof Error ? error.message : String(error),
          config: {
            REDIS_HOST: config.REDIS_HOST,
            REDIS_PORT: config.REDIS_PORT
          }
        });
        
        // Exit process to prevent server from starting without audit queue
        process.exit(1);
      }
    }
    
    // Initialize circuit breaker for database operations
    this.circuitBreaker = new CircuitBreaker(this.saveToDatabase.bind(this), {
      timeout: AUDIT_CONFIG.DB_OPERATION_TIMEOUT,
      errorThresholdPercentage: 50,
      resetTimeout: 30000
    });

    this.circuitBreaker.on('open', () => {
      logger.error('🔴 Circuit breaker opened - audit logs temporarily unavailable');
    });

    this.circuitBreaker.on('halfOpen', () => {
      logger.warn('🟡 Circuit breaker half-open - testing database connection');
    });

    this.circuitBreaker.on('close', () => {
      logger.info('🟢 Circuit breaker closed - audit logging restored');
    });
  }

  /**
   * Get singleton instance (thread-safe)
   */
  public static getInstance(): AuditLoggingService {
    if (this.instance) {
      return this.instance;
    }
    
    if (this.creating) {
      throw new Error('AuditLoggingService is being initialized');
    }
    
    this.creating = true;
    this.instance = new AuditLoggingService();
    this.creating = false;
    
    return this.instance;
  }

  /**
   * Initialize audit logging service
   */
  public static async initialize(): Promise<void> {
    logger.info('Audit Logging Service initialized');
  }

  /**
   * Log an audit event (async queue + circuit breaker)
   */
  public async logEvent(entry: AuditLogEntry): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    // Prepare audit data outside try block for error handling
    const sanitizedRequestBody = this.truncateData(this.sanitizeData(entry.requestBody));
    const sanitizedResponseData = this.truncateData(entry.responseData);

    const auditData = {
      userId: entry.userId,
      tenantId: entry.tenantId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      method: entry.method,
      endpoint: entry.endpoint,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      statusCode: entry.statusCode,
      requestBody: sanitizedRequestBody,
      responseData: sanitizedResponseData,
      error: entry.error,
      metadata: entry.metadata || {},
      severity: entry.severity || this.determineSeverity(entry),
      category: entry.category,
    };

    try {
      // Use queue if available, otherwise direct save
      if (this.queueAvailable && this.auditQueue) {
        await this.auditQueue.add(auditData, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: false
        });

        logger.debug('Audit log queued (async)', {
          action: entry.action,
          category: entry.category
        });
      } else {
        // Fallback to direct save
        await this.circuitBreaker.fire(auditData);
        
        logger.debug('Audit log saved (direct)', {
          action: entry.action,
          category: entry.category
        });
      }
    } catch (error) {
      // Final fallback
      logger.warn('Primary save failed, attempting final fallback', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      try {
        await this.saveToDatabase(auditData);
      } catch (dbError) {
        this.failureCount++;
        this.lastFailure = new Date();
        
        logger.error('Failed to log audit event', {
          error: dbError instanceof Error ? dbError.message : String(dbError),
          failureCount: this.failureCount
        });
        
        if (this.failureCount >= AUDIT_CONFIG.ALERT_THRESHOLD) {
          await this.sendCriticalAlert({
            message: 'Audit logging system failure',
            failureCount: this.failureCount,
            lastFailure: this.lastFailure,
            error: dbError instanceof Error ? dbError.message : String(dbError)
          });
          this.failureCount = 0;
        }
      }
    }
  }

  /**
   * Process audit log from queue (with circuit breaker)
   */
  private async processAuditLog(auditData: any): Promise<void> {
    try {
      // Use circuit breaker for database operation
      await this.circuitBreaker.fire(auditData);
      
      // Reset failure counter on success
      this.failureCount = 0;
      
      logger.info('Audit log created', {
        action: auditData.action,
        category: auditData.category,
        severity: auditData.severity
      });
    } catch (error) {
      this.failureCount++;
      this.lastFailure = new Date();
      
      logger.error('Audit log processing failed', {
        error: error instanceof Error ? error.message : String(error),
        failureCount: this.failureCount
      });
      
      throw error; // Re-throw for queue retry
    }
  }

  /**
   * Save to database (wrapped by circuit breaker)
   */
  private async saveToDatabase(auditData: any): Promise<void> {
    await AuditLog.create(auditData);
  }

  /**
   * Sanitize data before logging (remove sensitive fields)
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = AUDIT_CONFIG.SENSITIVE_FIELDS;

    const sanitized: any = Array.isArray(data) ? [] : {};

    for (const key in data) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        continue;
      }

      const isSensitive = sensitiveFields.some((field) =>
        key.toLowerCase().includes(field.toLowerCase())
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        sanitized[key] = this.sanitizeData(data[key]);
      } else {
        sanitized[key] = data[key];
      }
    }

    return sanitized;
  }

  /**
   * Truncate data to prevent DoS attacks via large payloads
   */
  private truncateData(data: any, maxSize = AUDIT_CONFIG.MAX_REQUEST_BODY_SIZE): any {
    if (!data) return data;
    
    const json = JSON.stringify(data);
    
    if (json.length > maxSize) {
      return {
        _truncated: true,
        _originalSize: json.length,
        _preview: json.substring(0, maxSize) + '...'
      };
    }
    
    return data;
  }

  /**
   * Determine severity based on action and status code
   */
  private determineSeverity(entry: AuditLogEntry): 'low' | 'medium' | 'high' | 'critical' {
    // Critical severity for security-related failures
    if (entry.category === 'security' && entry.statusCode >= 400) {
      return 'critical';
    }

    // High severity for authentication failures
    if (entry.category === 'auth' && entry.statusCode >= 400) {
      return 'high';
    }

    // High severity for server errors
    if (entry.statusCode >= 500) {
      return 'high';
    }

    // Medium severity for client errors
    if (entry.statusCode >= 400) {
      return 'medium';
    }

    // Low severity for successful operations
    return 'low';
  }

  /**
   * Create audit middleware (fixed memory leak)
   */
  public static createAuditMiddleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // Prevent duplicate logging
      if ((req as any).__auditLogged) {
        next();
        return;
      }
      (req as any).__auditLogged = true;

      const startTime = Date.now();
      const originalSend = res.send;
      let responseData: any;
      let loggedOnce = false; // Additional safety

      // SECURITY: Use try-finally to ensure res.send is ALWAYS restored, even if exception thrown
      res.send = function (data: any) {
        try {
          responseData = data;
          return originalSend.call(this, data);
        } finally {
          res.send = originalSend; // ALWAYS restore, even on exception
        }
      };

      const finishHandler = async () => {
        // Double-check not logged
        if (loggedOnce) {
          return;
        }
        loggedOnce = true;
        
        try {
          const duration = Date.now() - startTime;
          const instance = AuditLoggingService.getInstance();

          if (!instance.shouldAudit(req, res)) {
            logger.debug('Audit skipped', { path: req.originalUrl, method: req.method });
            return;
          }
          
          logger.debug('Audit logging request', { path: req.originalUrl, method: req.method, status: res.statusCode });

          // Create audit entry
          const entry: AuditLogEntry = {
            userId: req.user ? (req.user as any).userId : undefined,
            tenantId: (req as any).tenantId,
            action: instance.extractAction(req),
            resource: instance.extractResource(req),
            resourceId: req.params.id,
            method: req.method as any,
            endpoint: req.originalUrl.split('?')[0], // Use originalUrl for full path
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('user-agent') || 'unknown',
            statusCode: res.statusCode,
            requestBody: req.body,
            responseData: instance.shouldLogResponse(req) ? responseData : undefined,
            metadata: {
              duration,
              sessionId: req.session?.id,
              userRole: req.user ? (req.user as any).userType : undefined,
              tenantDomain: (req as any).tenant?.domain,
            },
            category: instance.determineCategory(req),
          };
          
          logger.debug('Audit entry created', { action: entry.action, resource: entry.resource });

          // Fire and forget with error handling
          instance.logEvent(entry).catch(err => {
            logger.error('Audit log failed', { 
              error: err instanceof Error ? err.message : String(err),
              action: entry.action,
              resource: entry.resource
            });
          });
        } finally {
          // Ensure listener is removed
          res.removeListener('finish', finishHandler);
        }
      };

      res.once('finish', finishHandler); // Use 'once' instead of 'on'
      next();
    };
  }

  /**
   * Determine if request should be audited
   */
  private shouldAudit(req: Request, res: Response): boolean {
    // Use originalUrl to get full path including /api/v1
    const fullPath = req.originalUrl.split('?')[0];
    
    // Don't audit health checks
    if (fullPath === '/health' || fullPath === '/api/v1/health') {
      return false;
    }

    // Don't audit static assets
    if (fullPath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$/)) {
      return false;
    }

    // Always audit ALL API requests
    if (fullPath.startsWith('/api/')) {
      return true;
    }

    // Audit failed requests
    if (res.statusCode >= 400) {
      return true;
    }

    return false;
  }

  /**
   * Determine if response should be logged
   */
  private shouldLogResponse(req: Request): boolean {
    const fullPath = req.originalUrl.split('?')[0];
    
    // Don't log response data for GET requests (can be large)
    if (req.method === 'GET') {
      return false;
    }

    // Don't log file uploads/downloads
    if (fullPath.includes('/files') || fullPath.includes('/upload')) {
      return false;
    }

    return true;
  }

  /**
   * Extract action from request
   */
  private extractAction(req: Request): string {
    const method = req.method.toLowerCase();
    const resource = this.extractResource(req);

    switch (method) {
      case 'post':
        return `create_${resource}`;
      case 'put':
      case 'patch':
        return `update_${resource}`;
      case 'delete':
        return `delete_${resource}`;
      case 'get':
        return `view_${resource}`;
      default:
        return `${method}_${resource}`;
    }
  }

  /**
   * Extract resource from request path
   */
  private extractResource(req: Request): string {
    // Use originalUrl to get full path
    const fullPath = req.originalUrl.split('?')[0];
    const pathParts = fullPath.split('/').filter(Boolean);
    
    // Skip 'api' and version
    const resourceIndex = pathParts.findIndex((part) => !part.includes('api') && !part.match(/^v\d+$/));
    
    if (resourceIndex >= 0) {
      return pathParts[resourceIndex];
    }

    return 'unknown';
  }

  /**
   * Determine category from request
   */
  private determineCategory(req: Request): 'auth' | 'user_management' | 'tenant_management' | 'data_access' | 'security' | 'system' {
    // Use originalUrl to get full path
    const fullPath = req.originalUrl.split('?')[0].toLowerCase();

    if (fullPath.includes('/auth')) {
      return 'auth';
    }

    if (fullPath.includes('/users') || fullPath.includes('/team-members')) {
      return 'user_management';
    }

    if (fullPath.includes('/tenants') || fullPath.includes('/super-admin')) {
      return 'tenant_management';
    }

    if (fullPath.includes('/security') || fullPath.includes('/sessions')) {
      return 'security';
    }

    if (fullPath.includes('/health') || fullPath.includes('/monitoring')) {
      return 'system';
    }

    return 'data_access';
  }

  /**
   * Get audit logs for a user
   */
  public async getUserAuditLogs(userId: string, limit = 100): Promise<any[]> {
    try {
      return await AuditLog.find({ userId, deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      logger.error('Get user audit logs error', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Get audit logs for a tenant
   */
  public async getTenantAuditLogs(tenantId: string, limit = 100): Promise<any[]> {
    try {
      return await AuditLog.find({ tenantId, deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      logger.error('Get tenant audit logs error', {
        tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Get security events
   */
  public async getSecurityEvents(limit = 100): Promise<any[]> {
    try {
      return await AuditLog.find({
        category: 'security',
        severity: { $in: ['high', 'critical'] },
        deletedAt: null,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      logger.error('Get security events error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Enable/disable audit logging
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    logger.info(`Audit logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Cleanup resources (call on server shutdown)
   */
  public async cleanup(): Promise<void> {
    try {
      logger.info('Cleaning up audit logging service...');
      
      // Wait for queue to finish processing (if available)
      if (this.auditQueue) {
        await this.auditQueue.close();
        logger.info('✅ Audit queue closed');
      }
      
      logger.info('✅ Audit logging service cleaned up');
    } catch (error) {
      logger.error('Audit cleanup error', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Send critical alert for audit system failures
   */
  private async sendCriticalAlert(details: {
    message: string;
    failureCount: number;
    lastFailure: Date | null;
    error: string;
  }): Promise<void> {
    try {
      logger.error('🚨 CRITICAL: Audit Logging System Failure', {
        failureCount: details.failureCount,
        lastFailure: details.lastFailure,
        error: details.error,
        threshold: AUDIT_CONFIG.ALERT_THRESHOLD
      });
      
      // In production, send to alerting system (Slack, PagerDuty, etc.)
      // For now, just log critically
      // TODO: Integrate with alerting service when available
    } catch (alertError) {
      logger.error('Failed to send alert', {
        error: alertError instanceof Error ? alertError.message : String(alertError)
      });
    }
  }
}

export default AuditLoggingService;

