/**
 * Super Admin Controller
 * Handles tenant management operations
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 1: No console.log (using logger)
 * - Rule 9: TypeScript strict (no 'any')
 * - Rule 10: Multi-tenant isolation (super admin can see all)
 */

import { Request, Response } from 'express';
import { SuperAdminService } from './super-admin.service';
import { ValidationUtils } from '../../utils/validation.utils';
import logger from '../../utils/logger';

/**
 * Super Admin Controller
 */
export class SuperAdminController {
  /**
   * Get all tenants
   * GET /api/v1/super-admin/tenants
   */
  static async getTenants(req: Request, res: Response): Promise<void> {
    try {
      const tenants = await SuperAdminService.getAllTenants();

      res.status(200).json({
        success: true,
        data: {
          tenants,
          count: tenants.length
        }
      });
    } catch (error) {
      logger.error('Get tenants failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'TENANTS_FETCH_FAILED',
          message: 'Failed to fetch tenants'
        }
      });
    }
  }

  /**
   * Create new tenant
   * POST /api/v1/super-admin/tenants
   */
  static async createTenant(req: Request, res: Response): Promise<void> {
    try {
      const tenant = await SuperAdminService.createTenant(req.body);

      logger.info('Tenant created successfully', {
        tenantId: tenant.id,
        tenantName: tenant.name,
        createdBy: req.user?.userId
      });

      res.status(201).json({
        success: true,
        data: {
          tenant,
          message: 'Tenant created successfully'
        }
      });
    } catch (error) {
      logger.error('Create tenant failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId,
        tenantData: req.body.name
      });

      const statusCode = error instanceof Error && error.message.includes('exists') ? 409 : 500;

      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 409 ? 'TENANT_EXISTS' : 'TENANT_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create tenant'
        }
      });
    }
  }

  /**
   * Get single tenant
   * GET /api/v1/super-admin/tenants/:id
   */
  static async getTenant(req: Request, res: Response): Promise<void> {
    try {
      const id = ValidationUtils.validateObjectId(req.params.id, 'Tenant ID');
      const tenant = await SuperAdminService.getTenantById(id);

      if (!tenant) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant not found'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { tenant }
      });
    } catch (error) {
      logger.error('Get tenant failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId: req.params.id,
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_FETCH_FAILED',
          message: 'Failed to fetch tenant'
        }
      });
    }
  }

  /**
   * Update tenant
   * PUT /api/v1/super-admin/tenants/:id
   */
  static async updateTenant(req: Request, res: Response): Promise<void> {
    try {
      const id = ValidationUtils.validateObjectId(req.params.id, 'Tenant ID');
      const tenant = await SuperAdminService.updateTenant(id, req.body);

      if (!tenant) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant not found'
          }
        });
        return;
      }

      logger.info('Tenant updated successfully', {
        tenantId: id,
        updatedBy: req.user?.userId
      });

      res.status(200).json({
        success: true,
        data: {
          tenant,
          message: 'Tenant updated successfully'
        }
      });
    } catch (error) {
      logger.error('Update tenant failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId: req.params.id,
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_UPDATE_FAILED',
          message: 'Failed to update tenant'
        }
      });
    }
  }

  /**
   * Delete tenant (soft delete)
   * DELETE /api/v1/super-admin/tenants/:id
   */
  static async deleteTenant(req: Request, res: Response): Promise<void> {
    try {
      const id = ValidationUtils.validateObjectId(req.params.id, 'Tenant ID');
      const result = await SuperAdminService.deleteTenant(id);

      if (!result) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant not found'
          }
        });
        return;
      }

      logger.info('Tenant deleted successfully', {
        tenantId: id,
        deletedBy: req.user?.userId
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Tenant deleted successfully'
        }
      });
    } catch (error) {
      logger.error('Delete tenant failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId: req.params.id,
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_DELETION_FAILED',
          message: 'Failed to delete tenant'
        }
      });
    }
  }

  /**
   * Get system analytics
   * GET /api/v1/super-admin/analytics
   */
  static async getAnalytics(_req: Request, res: Response): Promise<void> {
    try {
      const analytics = await SuperAdminService.getSystemAnalytics();

      res.status(200).json({
        success: true,
        data: { analytics }
      });
    } catch (error) {
      logger.error('Get analytics failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYTICS_FETCH_FAILED',
          message: 'Failed to fetch analytics'
        }
      });
    }
  }

  /**
   * Get system health
   * GET /api/v1/super-admin/system-health
   */
  static async getSystemHealth(_req: Request, res: Response): Promise<void> {
    try {
      const health = await SuperAdminService.getSystemHealth();

      res.status(200).json({
        success: true,
        data: { health }
      });
    } catch (error) {
      logger.error('Get system health failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Failed to check system health'
        }
      });
    }
  }
}
