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
import { SubscriptionPlanController } from '../features/subscription-plan/subscription-plan.controller';
import {
  createSubscriptionPlanSchema,
  updateSubscriptionPlanSchema,
  getAllPlansSchema,
  getActivePlansSchema,
  getSubscriptionPlanSchema,
  deleteSubscriptionPlanSchema,
  updatePlanStatusSchema,
  reorderPlansSchema
} from '../features/subscription-plan/subscription-plan.schemas';
import {
  subscriptionPlanReadLimiter,
  subscriptionPlanWriteLimiter,
  subscriptionPlanReorderLimiter
} from '../middleware/subscription-plan-rate-limiters';

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

/**
 * ========================================
 * SUBSCRIPTION PLAN ROUTES
 * ========================================
 */

/**
 * @route   GET /api/v1/super-admin/subscription-plans
 * @desc    Get all subscription plans with optional pagination
 * @access  Super Admin Only
 */
router.get('/subscription-plans',
  subscriptionPlanReadLimiter,
  authenticateToken,
  requireSuperAdmin,
  validate(getAllPlansSchema),
  auditLog('subscription-plans.list', 'SubscriptionPlan'),
  SubscriptionPlanController.getPlans
);

/**
 * @route   GET /api/v1/super-admin/subscription-plans/active
 * @desc    Get active subscription plans only with optional pagination
 * @access  Super Admin Only
 */
router.get('/subscription-plans/active',
  subscriptionPlanReadLimiter,
  authenticateToken,
  requireSuperAdmin,
  validate(getActivePlansSchema),
  auditLog('subscription-plans.list-active', 'SubscriptionPlan'),
  SubscriptionPlanController.getActivePlans
);

/**
 * @route   PUT /api/v1/super-admin/subscription-plans/reorder
 * @desc    Reorder subscription plans
 * @access  Super Admin Only
 */
router.put('/subscription-plans/reorder',
  subscriptionPlanReorderLimiter,
  authenticateToken,
  requireSuperAdmin,
  validate(reorderPlansSchema),
  auditLog('subscription-plans.reorder', 'SubscriptionPlan'),
  SubscriptionPlanController.reorderPlans
);

/**
 * @route   POST /api/v1/super-admin/subscription-plans
 * @desc    Create new subscription plan
 * @access  Super Admin Only
 */
router.post('/subscription-plans',
  subscriptionPlanWriteLimiter,
  authenticateToken,
  requireSuperAdmin,
  validate(createSubscriptionPlanSchema),
  auditLog('subscription-plans.create', 'SubscriptionPlan'),
  SubscriptionPlanController.createPlan
);

/**
 * @route   PATCH /api/v1/super-admin/subscription-plans/:id/status
 * @desc    Update subscription plan status
 * @access  Super Admin Only
 */
router.patch('/subscription-plans/:id/status',
  subscriptionPlanWriteLimiter,
  authenticateToken,
  requireSuperAdmin,
  validate(updatePlanStatusSchema),
  auditLog('subscription-plans.update-status', 'SubscriptionPlan'),
  SubscriptionPlanController.updatePlanStatus
);

/**
 * @route   GET /api/v1/super-admin/subscription-plans/:id
 * @desc    Get single subscription plan
 * @access  Super Admin Only
 */
router.get('/subscription-plans/:id',
  subscriptionPlanReadLimiter,
  authenticateToken,
  requireSuperAdmin,
  validate(getSubscriptionPlanSchema),
  auditLog('subscription-plans.view', 'SubscriptionPlan'),
  SubscriptionPlanController.getPlan
);

/**
 * @route   PUT /api/v1/super-admin/subscription-plans/:id
 * @desc    Update subscription plan
 * @access  Super Admin Only
 */
router.put('/subscription-plans/:id',
  subscriptionPlanWriteLimiter,
  authenticateToken,
  requireSuperAdmin,
  validate(updateSubscriptionPlanSchema),
  auditLog('subscription-plans.update', 'SubscriptionPlan'),
  SubscriptionPlanController.updatePlan
);

/**
 * @route   DELETE /api/v1/super-admin/subscription-plans/:id
 * @desc    Delete subscription plan (soft delete)
 * @access  Super Admin Only
 */
router.delete('/subscription-plans/:id',
  subscriptionPlanWriteLimiter,
  authenticateToken,
  requireSuperAdmin,
  validate(deleteSubscriptionPlanSchema),
  auditLog('subscription-plans.delete', 'SubscriptionPlan'),
  SubscriptionPlanController.deletePlan
);

export default router;