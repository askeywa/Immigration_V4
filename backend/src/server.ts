import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import morgan from 'morgan';
import session from 'express-session';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config, isProduction, isDevelopment } from './config/env.config';
import logger from './utils/logger';

// Import services
import RedisService from './services/redis.service';
import RateLimitService from './services/rate-limit.service';
import SessionService from './services/session.service';
import TenantResolutionService from './services/tenant-resolution.service';
import PerformanceMonitoringService from './services/performance-monitoring.service';
import AuditLoggingService from './services/audit-logging.service';

// Import middleware
import {
  xssProtection,
  contentTypeValidation,
  inputValidation,
  securityMonitoring,
  customSecurityHeaders,
} from './middleware/security-hardening.middleware';
import {
  comprehensiveTenantResolution,
  comprehensiveDataIsolation,
} from './middleware/data-isolation.middleware';

// Import routes
import apiRoutes from './routes/api.routes';

const app = express();
const PORT = config.PORT;

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// ==================== REQUEST ID TRACKING ====================
// Add unique request ID for correlation and tracing
app.use((req, res, next) => {
  req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('X-Request-ID', req.requestId || '');
  next();
});

// ==================== LOGGING ====================
// Morgan HTTP request logging with request ID
app.use(morgan((isDevelopment ? 'dev' : 'combined') as any, {
  stream: {
    write: (message: string) => {
      logger.info(message.trim(), { source: 'morgan' });
    },
  },
  skip: (req: any) => {
    // Skip health checks and static assets
    return req.path === '/health' || req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$/);
  },
}));

// ==================== SECURITY MIDDLEWARE ====================
// Custom security headers
app.use(customSecurityHeaders());

// Helmet with strict CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));

// CORS configuration with dynamic whitelist
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    if (config.ALLOWED_DOMAINS.some(domain => origin.includes(domain))) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// ==================== BODY PARSING ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== SECURITY HARDENING ====================
// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// XSS Protection
app.use(xssProtection());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Content Type Validation
app.use(contentTypeValidation());

// Input Validation
app.use(inputValidation());

// Security Monitoring
app.use(securityMonitoring());

// ==================== PERFORMANCE ====================
// Compression
app.use(compression());

// Performance Monitoring Middleware
app.use(PerformanceMonitoringService.createMonitoringMiddleware());

// ==================== RATE LIMITING ====================
// Global rate limiter
const rateLimitService = RateLimitService.getInstance();
app.use(rateLimitService.createRateLimitMiddleware({
  maxRequests: config.RATE_LIMIT_MAX_REQUESTS,
  windowMs: config.RATE_LIMIT_WINDOW_MS,
}));

// ==================== AUDIT LOGGING ====================
// Audit middleware (logs all API requests)
app.use(AuditLoggingService.createAuditMiddleware());

// ==================== BASIC HEALTH CHECK ====================
// Basic health check (no dependencies)
app.get('/health', (_req, res) => {
  res.json({ 
    success: true, 
    message: 'Canadian Immigration Portal API is running',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ==================== API ROUTES ====================
// API routes with tenant resolution and data isolation
app.use(`/api/${config.API_VERSION}`, apiRoutes);

// ==================== FRONTEND SERVING ====================
// Serve frontend static files (if built)
const frontendDistPath = path.join(__dirname, '../../frontend/dist');

// Serve static files from React build
app.use(express.static(frontendDistPath, {
  maxAge: isProduction ? '1d' : 0,
  etag: true,
  lastModified: true,
  index: false, // Don't auto-serve index.html
}));

// SPA fallback: Serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  const currentPath = req.originalUrl.split('?')[0];
  
  // Skip if it's an API route
  if (currentPath.startsWith('/api/')) {
    return next();
  }
  
  // Skip if it's a static asset
  if (currentPath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$/)) {
    return next();
  }
  
  // Serve index.html for client-side routing
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      logger.error('Error serving index.html', { 
        error: err.message,
        path: currentPath,
      });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'FRONTEND_NOT_FOUND',
          message: 'Frontend not built. Run: cd frontend && npm run build',
        },
      });
    }
  });
});

// ==================== ERROR HANDLERS ====================
// 404 handler (for API routes only)
app.use((req, res, next) => {
  const currentPath = req.originalUrl.split('?')[0];
  
  // This should only catch API routes that weren't handled
  if (currentPath.startsWith('/api/')) {
    logger.warn('API route not found', { 
      method: req.method, 
      path: currentPath, 
      ip: req.ip 
    });
    
    res.status(404).json({ 
      success: false, 
      error: { 
        code: 'NOT_FOUND', 
        message: `API route ${currentPath} not found`
      } 
    });
    return;
  }
  
  next();
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Server error', { 
    error: err.message, 
    stack: err.stack,
    method: req.method,
    path: req.originalUrl.split('?')[0],
    ip: req.ip,
  });
  
  res.status(500).json({ 
    success: false, 
    error: { 
      code: 'SERVER_ERROR', 
      message: isProduction ? 'Internal server error' : err.message,
      ...(isProduction ? {} : { stack: err.stack }),
    } 
  });
});

// ==================== SERVICE INITIALIZATION ====================
/**
 * Initialize all services
 */
const initializeServices = async (): Promise<void> => {
  try {
    logger.info('Initializing services...');

    // Initialize Redis Service
    try {
      await RedisService.getInstance().initialize();
      logger.info('✅ Redis Service initialized');
    } catch (error) {
      logger.warn('⚠️  Redis Service initialization failed (using in-memory fallback)', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Initialize Rate Limiting Service
    await RateLimitService.initialize();
    logger.info('✅ Rate Limiting Service initialized');

    // Initialize Session Management Service
    await SessionService.initialize();
    logger.info('✅ Session Service initialized');
    
    // Configure session middleware AFTER SessionService initialization
    app.use(session(SessionService.getInstance().createSessionMiddleware()));
    app.use(SessionService.getInstance().sessionActivityTracking());
    app.use(SessionService.getInstance().sessionSecurityPolicy());
    logger.info('✅ Session middleware configured');

    // Initialize Tenant Resolution Service
    await TenantResolutionService.initialize();
    logger.info('✅ Tenant Resolution Service initialized');
    
    // Configure tenant resolution middleware
    app.use(comprehensiveTenantResolution());
    logger.info('✅ Tenant resolution middleware configured');

    // Configure data isolation middleware
    app.use(comprehensiveDataIsolation());
    logger.info('✅ Data isolation middleware configured');

    // Initialize Performance Monitoring Service
    PerformanceMonitoringService.initialize();
    logger.info('✅ Performance Monitoring Service initialized');

    // Initialize Audit Logging Service
    await AuditLoggingService.initialize();
    logger.info('✅ Audit Logging Service initialized');

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Service initialization failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

// ==================== SERVER STARTUP ====================
/**
 * Start the server
 * Connect to MongoDB first, then initialize services, then start Express server
 */
const startServer = async (): Promise<void> => {
  try {
    logger.info('🚀 Starting Canadian Immigration Portal Server...', {
      environment: config.NODE_ENV,
      port: PORT,
      nodeVersion: process.version,
    });

    // Step 1: Connect to MongoDB
    const { connectDatabase, disconnectDatabase } = await import('./config/database');
    await connectDatabase();
    logger.info('✅ Database connected successfully');
    
    // Step 1.5: Verify database is actually working (not just connected)
    // SECURITY: Test query execution before accepting requests
    try {
      const mongoose = await import('mongoose');
      const testDoc = await mongoose.default.connection.collection('_health_check').insertOne({ 
        test: 1, 
        timestamp: new Date() 
      });
      await mongoose.default.connection.collection('_health_check').deleteOne({ 
        _id: testDoc.insertedId 
      });
      logger.info('✅ Database health check passed - queries executing correctly');
    } catch (healthError) {
      logger.error('❌ Database health check failed - database not operational', {
        error: healthError instanceof Error ? healthError.message : String(healthError)
      });
      throw new Error('Database health check failed. Server cannot start.');
    }
    
    // Step 2: Initialize all services
    await initializeServices();
    
    // Step 3: Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`, {
        port: PORT,
        apiDocs: `http://localhost:${PORT}/api/${config.API_VERSION}/health`,
        environment: config.NODE_ENV,
      });
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`👋 ${signal} received - Shutting down gracefully...`);
      
      server.close(async () => {
        logger.info('✅ HTTP server closed');
        
        try {
          // Cleanup audit queue
          await AuditLoggingService.getInstance().cleanup();
          logger.info('✅ Audit logging cleaned up');
          
          // Disconnect Redis
          await RedisService.getInstance().disconnect();
          logger.info('✅ Redis disconnected');
          
          // Cleanup Performance Monitoring
          PerformanceMonitoringService.getInstance().cleanup();
          logger.info('✅ Performance monitoring cleaned up');
          
          // Disconnect database
          await disconnectDatabase();
          logger.info('✅ Database disconnected');
          
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', {
            error: error instanceof Error ? error.message : String(error),
          });
          process.exit(1);
        }
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    logger.error('❌ Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
};

// ==================== ERROR HANDLING ====================
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('❌ Unhandled Promise Rejection', {
    error: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  
  if (isProduction) {
    logger.warn('⚠️  Continuing despite unhandled promise rejection in production');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('❌ Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  
  // Give time for logging before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle process warnings
process.on('warning', (warning) => {
  logger.warn('⚠️  Process Warning', {
    name: warning.name,
    message: warning.message,
    stack: warning.stack,
  });
});

// ==================== START THE SERVER ====================
startServer();

export default app;
