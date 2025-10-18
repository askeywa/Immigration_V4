/**
 * Super Admin Routes
 * Handles all super admin operations with proper tenant isolation
 * 
 * @module routes/super-admin
 */

import { Router } from 'express';
import { authenticateToken, requireSuperAdmin, auditLog } from '../middleware/auth.middleware';
import { validate } from '../middleware/zod.middleware';
import { SuperAdminController } from '../features/super-admin/super-admin.controller';
import {
  createTenantSchema,
  updateTenantSchema,
  getTenantSchema,
  deleteTenantSchema
} from '../features/super-admin/super-admin.schemas';

const router = Router();

/**
 * Super Admin Routes
 * All routes require super admin authentication
 */

/**
 * @route   GET /api/v1/super-admin/tenants
 * @desc    Get all tenants
 * @access  Super Admin Only
 */
router.get('/tenants',
  authenticateToken,
  requireSuperAdmin,
  auditLog('tenants.list', 'Tenant'),
  SuperAdminController.getTenants
);

/**
 * @route   GET /api/v1/super-admin/tenants/:id
 * @desc    Get single tenant
 * @access  Super Admin Only
 */
router.get('/tenants/:id',
  authenticateToken,
  requireSuperAdmin,
  validate(getTenantSchema),
  auditLog('tenants.view', 'Tenant'),
  SuperAdminController.getTenant
);

/**
 * @route   POST /api/v1/super-admin/tenants
 * @desc    Create new tenant
 * @access  Super Admin Only
 */
router.post('/tenants',
  authenticateToken,
  requireSuperAdmin,
  validate(createTenantSchema),
  auditLog('tenants.create', 'Tenant'),
  SuperAdminController.createTenant
);

/**
 * @route   PUT /api/v1/super-admin/tenants/:id
 * @desc    Update tenant
 * @access  Super Admin Only
 */
router.put('/tenants/:id',
  authenticateToken,
  requireSuperAdmin,
  validate(updateTenantSchema),
  auditLog('tenants.update', 'Tenant'),
  SuperAdminController.updateTenant
);

/**
 * @route   DELETE /api/v1/super-admin/tenants/:id
 * @desc    Delete tenant (soft delete)
 * @access  Super Admin Only
 */
router.delete('/tenants/:id',
  authenticateToken,
  requireSuperAdmin,
  validate(deleteTenantSchema),
  auditLog('tenants.delete', 'Tenant'),
  SuperAdminController.deleteTenant
);

/**
 * @route   GET /api/v1/super-admin/analytics
 * @desc    Get system analytics
 * @access  Super Admin Only
 */
router.get('/analytics',
  authenticateToken,
  requireSuperAdmin,
  auditLog('analytics.view', 'System'),
  SuperAdminController.getAnalytics
);

/**
 * @route   GET /api/v1/super-admin/system-health
 * @desc    Get system health
 * @access  Super Admin Only
 */
router.get('/system-health',
  authenticateToken,
  requireSuperAdmin,
  auditLog('system.health', 'System'),
  SuperAdminController.getSystemHealth
);

export default router;