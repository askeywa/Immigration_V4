/**
 * Subscription Plan Controller
 * Handles subscription plan management operations
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 1: No console.log (using logger)
 * - Rule 9: TypeScript strict (no 'any')
 * - Rule 10: Multi-tenant isolation (super admin can see all)
 */

import { Request, Response } from 'express';
import { SubscriptionPlanService } from './subscription-plan.service';
import { ValidationUtils } from '../../utils/validation.utils';
import logger from '../../utils/logger';
import {
  SubscriptionPlanError
} from './errors/subscription-plan.errors';

/**
 * Subscription Plan Controller
 */
export class SubscriptionPlanController {
  /**
   * Get all subscription plans with optional pagination
   * GET /api/v1/super-admin/subscription-plans?page=1&limit=20
   */
  static async getPlans(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await SubscriptionPlanService.getAllPlans(page, limit);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get subscription plans failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'PLANS_FETCH_FAILED',
          message: 'Failed to fetch subscription plans'
        }
      });
    }
  }

  /**
   * Get active subscription plans only with optional pagination
   * GET /api/v1/super-admin/subscription-plans/active?page=1&limit=20
   */
  static async getActivePlans(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await SubscriptionPlanService.getActivePlans(page, limit);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get active subscription plans failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'PLANS_FETCH_FAILED',
          message: 'Failed to fetch active subscription plans'
        }
      });
    }
  }

  /**
   * Create new subscription plan
   * POST /api/v1/super-admin/subscription-plans
   */
  static async createPlan(req: Request, res: Response): Promise<void> {
    try {
      const plan = await SubscriptionPlanService.createPlan(
        req.body,
        req.user?.userId || '',
        req.user?.userType || ''
      );

      logger.info('Subscription plan created successfully', {
        planId: plan.id,
        planName: plan.name,
        createdBy: req.user?.userId
      });

      res.status(201).json({
        success: true,
        data: {
          plan,
          message: 'Subscription plan created successfully'
        }
      });
    } catch (error) {
      logger.error('Create subscription plan failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId,
        planData: req.body.name
      });

      // Handle custom errors with proper status codes
      if (error instanceof SubscriptionPlanError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'PLAN_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create subscription plan'
        }
      });
    }
  }

  /**
   * Get single subscription plan
   * GET /api/v1/super-admin/subscription-plans/:id
   */
  static async getPlan(req: Request, res: Response): Promise<void> {
    try {
      const id = ValidationUtils.validateObjectId(req.params.id, 'Plan ID');
      const plan = await SubscriptionPlanService.getPlanById(id);

      if (!plan) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PLAN_NOT_FOUND',
            message: 'Subscription plan not found'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { plan }
      });
    } catch (error) {
      logger.error('Get subscription plan failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        planId: req.params.id,
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'PLAN_FETCH_FAILED',
          message: 'Failed to fetch subscription plan'
        }
      });
    }
  }

  /**
   * Update subscription plan
   * PUT /api/v1/super-admin/subscription-plans/:id
   */
  static async updatePlan(req: Request, res: Response): Promise<void> {
    try {
      const id = ValidationUtils.validateObjectId(req.params.id, 'Plan ID');
      const plan = await SubscriptionPlanService.updatePlan(
        id, 
        req.body,
        req.user?.userId || '',
        req.user?.userType || ''
      );

      if (!plan) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PLAN_NOT_FOUND',
            message: 'Subscription plan not found'
          }
        });
        return;
      }

      logger.info('Subscription plan updated successfully', {
        planId: id,
        updatedBy: req.user?.userId
      });

      res.status(200).json({
        success: true,
        data: {
          plan,
          message: 'Subscription plan updated successfully'
        }
      });
    } catch (error) {
      logger.error('Update subscription plan failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        planId: req.params.id,
        userId: req.user?.userId
      });

      // Handle custom errors with proper status codes
      if (error instanceof SubscriptionPlanError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'PLAN_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update subscription plan'
        }
      });
    }
  }

  /**
   * Delete subscription plan (soft delete)
   * DELETE /api/v1/super-admin/subscription-plans/:id
   */
  static async deletePlan(req: Request, res: Response): Promise<void> {
    try {
      const id = ValidationUtils.validateObjectId(req.params.id, 'Plan ID');
      const result = await SubscriptionPlanService.deletePlan(
        id,
        req.user?.userId || '',
        req.user?.userType || ''
      );

      if (!result) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PLAN_NOT_FOUND',
            message: 'Subscription plan not found'
          }
        });
        return;
      }

      logger.info('Subscription plan deleted successfully', {
        planId: id,
        deletedBy: req.user?.userId
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Subscription plan deleted successfully'
        }
      });
    } catch (error) {
      logger.error('Delete subscription plan failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        planId: req.params.id,
        userId: req.user?.userId
      });

      // Handle custom errors with proper status codes
      if (error instanceof SubscriptionPlanError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'PLAN_DELETION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to delete subscription plan'
        }
      });
    }
  }

  /**
   * Update plan status
   * PATCH /api/v1/super-admin/subscription-plans/:id/status
   */
  static async updatePlanStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = ValidationUtils.validateObjectId(req.params.id, 'Plan ID');
      const { status } = req.body;

      const plan = await SubscriptionPlanService.updatePlanStatus(
        id, 
        status,
        req.user?.userId || '',
        req.user?.userType || ''
      );

      if (!plan) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PLAN_NOT_FOUND',
            message: 'Subscription plan not found'
          }
        });
        return;
      }

      logger.info('Subscription plan status updated successfully', {
        planId: id,
        newStatus: status,
        updatedBy: req.user?.userId
      });

      res.status(200).json({
        success: true,
        data: {
          plan,
          message: 'Plan status updated successfully'
        }
      });
    } catch (error) {
      logger.error('Update plan status failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        planId: req.params.id,
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'STATUS_UPDATE_FAILED',
          message: 'Failed to update plan status'
        }
      });
    }
  }

  /**
   * Reorder subscription plans
   * PUT /api/v1/super-admin/subscription-plans/reorder
   */
  static async reorderPlans(req: Request, res: Response): Promise<void> {
    try {
      const { planIds } = req.body;
      await SubscriptionPlanService.reorderPlans(
        planIds,
        req.user?.userId || '',
        req.user?.userType || ''
      );

      logger.info('Subscription plans reordered successfully', {
        planCount: planIds.length,
        reorderedBy: req.user?.userId
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Plans reordered successfully'
        }
      });
    } catch (error) {
      logger.error('Reorder subscription plans failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'REORDER_FAILED',
          message: 'Failed to reorder subscription plans'
        }
      });
    }
  }
}

