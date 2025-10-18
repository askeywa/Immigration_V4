/**
 * Tenant Admin Controller
 * Handles team member and client management operations
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 1: No console.log (using logger)
 * - Rule 9: TypeScript strict (no 'any')
 * - Rule 10: Multi-tenant isolation
 */

import { Request, Response } from 'express';
import { TenantAdminService } from './tenant-admin.service';
import { ValidationUtils } from '../../utils/validation.utils';
import logger from '../../utils/logger';

/**
 * Tenant Admin Controller
 */
export class TenantAdminController {
  /**
   * Get all team members
   * GET /api/v1/tenant-admin/team-members
   */
  static async getTeamMembers(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'TENANT_ID_MISSING',
            message: 'Tenant ID is required'
          }
        });
        return;
      }

      const teamMembers = await TenantAdminService.getTeamMembers(tenantId);

      res.status(200).json({
        success: true,
        data: {
          teamMembers,
          count: teamMembers.length
        }
      });
    } catch (error) {
      logger.error('Get team members failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId: req.user?.tenantId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'TEAM_MEMBERS_FETCH_FAILED',
          message: 'Failed to fetch team members'
        }
      });
    }
  }

  /**
   * Create new team member
   * POST /api/v1/tenant-admin/team-members
   */
  static async createTeamMember(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'TENANT_ID_MISSING',
            message: 'Tenant ID is required'
          }
        });
        return;
      }

      const teamMember = await TenantAdminService.createTeamMember(tenantId, req.body);

      logger.info('Team member created successfully', {
        teamMemberId: teamMember.id,
        tenantId,
        createdBy: req.user?.userId
      });

      res.status(201).json({
        success: true,
        data: {
          teamMember,
          message: 'Team member created successfully'
        }
      });
    } catch (error) {
      logger.error('Create team member failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId: req.user?.tenantId
      });

      const statusCode = error instanceof Error && error.message.includes('exists') ? 409 : 500;

      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 409 ? 'TEAM_MEMBER_EXISTS' : 'TEAM_MEMBER_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create team member'
        }
      });
    }
  }

  /**
   * Update team member
   * PUT /api/v1/tenant-admin/team-members/:id
   */
  static async updateTeamMember(req: Request, res: Response): Promise<void> {
    try {
      const id = ValidationUtils.validateObjectId(req.params.id, 'Team Member ID');
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'TENANT_ID_MISSING',
            message: 'Tenant ID is required'
          }
        });
        return;
      }

      const teamMember = await TenantAdminService.updateTeamMember(tenantId, id, req.body);

      if (!teamMember) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TEAM_MEMBER_NOT_FOUND',
            message: 'Team member not found'
          }
        });
        return;
      }

      logger.info('Team member updated successfully', {
        teamMemberId: id,
        tenantId,
        updatedBy: req.user?.userId
      });

      res.status(200).json({
        success: true,
        data: {
          teamMember,
          message: 'Team member updated successfully'
        }
      });
    } catch (error) {
      logger.error('Update team member failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        teamMemberId: req.params.id,
        tenantId: req.user?.tenantId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'TEAM_MEMBER_UPDATE_FAILED',
          message: 'Failed to update team member'
        }
      });
    }
  }

  /**
   * Delete team member (soft delete)
   * DELETE /api/v1/tenant-admin/team-members/:id
   */
  static async deleteTeamMember(req: Request, res: Response): Promise<void> {
    try {
      const id = ValidationUtils.validateObjectId(req.params.id, 'Team Member ID');
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'TENANT_ID_MISSING',
            message: 'Tenant ID is required'
          }
        });
        return;
      }

      const result = await TenantAdminService.deleteTeamMember(tenantId, id);

      if (!result) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TEAM_MEMBER_NOT_FOUND',
            message: 'Team member not found'
          }
        });
        return;
      }

      logger.info('Team member deleted successfully', {
        teamMemberId: id,
        tenantId,
        deletedBy: req.user?.userId
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Team member deleted successfully'
        }
      });
    } catch (error) {
      logger.error('Delete team member failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        teamMemberId: req.params.id,
        tenantId: req.user?.tenantId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'TEAM_MEMBER_DELETION_FAILED',
          message: 'Failed to delete team member'
        }
      });
    }
  }

  /**
   * Get all clients
   * GET /api/v1/tenant-admin/clients
   */
  static async getClients(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'TENANT_ID_MISSING',
            message: 'Tenant ID is required'
          }
        });
        return;
      }

      const clients = await TenantAdminService.getClients(tenantId);

      res.status(200).json({
        success: true,
        data: {
          clients,
          count: clients.length
        }
      });
    } catch (error) {
      logger.error('Get clients failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId: req.user?.tenantId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'CLIENTS_FETCH_FAILED',
          message: 'Failed to fetch clients'
        }
      });
    }
  }

  /**
   * Create new client
   * POST /api/v1/tenant-admin/clients
   */
  static async createClient(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'TENANT_ID_MISSING',
            message: 'Tenant ID is required'
          }
        });
        return;
      }

      const client = await TenantAdminService.createClient(tenantId, req.body);

      logger.info('Client created successfully', {
        clientId: client.id,
        tenantId,
        createdBy: req.user?.userId
      });

      res.status(201).json({
        success: true,
        data: {
          client,
          message: 'Client created successfully'
        }
      });
    } catch (error) {
      logger.error('Create client failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId: req.user?.tenantId
      });

      const statusCode = error instanceof Error && error.message.includes('exists') ? 409 : 500;

      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 409 ? 'CLIENT_EXISTS' : 'CLIENT_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create client'
        }
      });
    }
  }

  /**
   * Get tenant analytics
   * GET /api/v1/tenant-admin/analytics
   */
  static async getTenantAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'TENANT_ID_MISSING',
            message: 'Tenant ID is required'
          }
        });
        return;
      }

      const analytics = await TenantAdminService.getTenantAnalytics(tenantId);

      res.status(200).json({
        success: true,
        data: { analytics }
      });
    } catch (error) {
      logger.error('Get tenant analytics failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId: req.user?.tenantId
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
}
