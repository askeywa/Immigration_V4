import { Router } from 'express';
import { config } from '../config/env.config';

// Import feature routes
import authRoutes from '../features/auth/auth.routes';
import superAdminRoutes from './super-admin.routes';
import tenantAdminRoutes from './tenant-admin.routes';
import teamMemberRoutes from './team-member.routes';
import clientRoutes from './client.routes';
import sessionRoutes from './session.routes';
import securityRoutes from './security.routes';
import monitoringRoutes from './monitoring.routes';
import tenantBrandingRoutes from './tenant-branding.routes';

const router = Router();

/**
 * API Routes
 * All routes prefixed with /api/v1
 */

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: config.API_VERSION,
      environment: config.NODE_ENV
    }
  });
});

// API info
router.get('/info', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Canadian Immigration Portal API',
      version: config.API_VERSION,
      environment: config.NODE_ENV,
      endpoints: {
        auth: '/api/v1/auth',
        superAdmin: '/api/v1/super-admin',
        tenantAdmin: '/api/v1/tenant-admin',
        teamMember: '/api/v1/team-member',
        client: '/api/v1/client',
        health: '/api/v1/health',
        info: '/api/v1/info'
      },
      documentation: '/api/v1/docs',
      timestamp: new Date().toISOString()
    }
  });
});

// Feature routes
router.use('/auth', authRoutes);

// RCIC System Routes
router.use('/super-admin', superAdminRoutes);
router.use('/tenant-admin', tenantAdminRoutes);
router.use('/team-member', teamMemberRoutes);
router.use('/client', clientRoutes);

// System Routes
router.use('/sessions', sessionRoutes);
router.use('/security', securityRoutes);
router.use('/monitoring', monitoringRoutes);
router.use('/tenant', tenantBrandingRoutes);

export default router;
