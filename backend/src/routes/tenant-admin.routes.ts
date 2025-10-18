/**
 * Tenant Admin Routes
 * Handles team member and client management with proper tenant isolation
 * 
 * @module routes/tenant-admin
 */

import { Router } from 'express';
import { authenticateToken, requireTenantAdmin, auditLog } from '../middleware/auth.middleware';
import { checkResourceOwnership, enforceTenantIsolation } from '../middleware/authorization.middleware';
import { validate } from '../middleware/zod.middleware';
import { TenantAdminController } from '../features/tenant-admin/tenant-admin.controller';
import {
  createTeamMemberSchema,
  updateTeamMemberSchema,
  teamMemberIdSchema,
  createClientSchema
} from '../features/tenant-admin/tenant-admin.schemas';

const router = Router();

/**
 * Tenant Admin Routes
 * All routes require tenant admin authentication
 * All routes are automatically tenant-isolated
 */

/**
 * @route   GET /api/v1/tenant-admin/team-members
 * @desc    Get all team members for tenant
 * @access  Tenant Admin Only
 */
router.get('/team-members',
  authenticateToken,
  requireTenantAdmin,
  enforceTenantIsolation(),
  auditLog('team_members.list', 'TenantTeamMember'),
  TenantAdminController.getTeamMembers
);

/**
 * @route   POST /api/v1/tenant-admin/team-members
 * @desc    Create new team member
 * @access  Tenant Admin Only
 */
router.post('/team-members',
  authenticateToken,
  requireTenantAdmin,
  validate(createTeamMemberSchema),
  auditLog('team_members.create', 'TenantTeamMember'),
  TenantAdminController.createTeamMember
);

/**
 * @route   PUT /api/v1/tenant-admin/team-members/:id
 * @desc    Update team member
 * @access  Tenant Admin Only
 */
router.put('/team-members/:id',
  authenticateToken,
  requireTenantAdmin,
  checkResourceOwnership('team_member'),
  validate(updateTeamMemberSchema),
  auditLog('team_members.update', 'TenantTeamMember'),
  TenantAdminController.updateTeamMember
);

/**
 * @route   DELETE /api/v1/tenant-admin/team-members/:id
 * @desc    Delete team member (soft delete)
 * @access  Tenant Admin Only
 */
router.delete('/team-members/:id',
  authenticateToken,
  requireTenantAdmin,
  checkResourceOwnership('team_member'),
  validate(teamMemberIdSchema),
  auditLog('team_members.delete', 'TenantTeamMember'),
  TenantAdminController.deleteTeamMember
);

/**
 * @route   GET /api/v1/tenant-admin/clients
 * @desc    Get all clients for tenant
 * @access  Tenant Admin Only
 */
router.get('/clients',
  authenticateToken,
  requireTenantAdmin,
  enforceTenantIsolation(),
  auditLog('clients.list', 'User'),
  TenantAdminController.getClients
);

/**
 * @route   POST /api/v1/tenant-admin/clients
 * @desc    Create new client
 * @access  Tenant Admin Only
 */
router.post('/clients',
  authenticateToken,
  requireTenantAdmin,
  validate(createClientSchema),
  auditLog('clients.create', 'User'),
  TenantAdminController.createClient
);

/**
 * @route   GET /api/v1/tenant-admin/analytics
 * @desc    Get tenant analytics
 * @access  Tenant Admin Only
 */
router.get('/analytics',
  authenticateToken,
  requireTenantAdmin,
  auditLog('analytics.view_tenant', 'Analytics'),
  TenantAdminController.getTenantAnalytics
);

export default router;