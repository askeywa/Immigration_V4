/**
 * Client Routes
 * Handles client operations with proper tenant isolation
 * 
 * @module routes/client
 */

import { Router, Request, Response } from 'express';
import { authenticateToken, requireClient, auditLog, requirePermission } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/zod.middleware';
import { cacheConfigs } from '../middleware/cache.middleware';
import { z } from 'zod';
import { schemas } from '../utils/zod.schemas';
import { ValidationUtils } from '../utils/validation.utils';
import logger from '../utils/logger';

const router = Router();

/**
 * Client Controllers
 * These will be implemented in separate controller files
 */
class ClientController {
  /**
   * Get my profile
   * GET /api/v1/client/my-profile
   */
  static async getMyProfile(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement client profile retrieval logic
      // Will use req.tenantId and req.user?.userId
      res.status(200).json({
        success: true,
        data: {
          profile: {},
          message: 'Profile retrieved successfully'
        }
      });
    } catch (error) {
      logger.error('Get client profile failed', { 
        tenantId: req.tenantId,
        userId: req.user?.userId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'PROFILE_RETRIEVAL_FAILED',
          message: 'Failed to retrieve profile'
        }
      });
    }
  }

  /**
   * Update my profile
   * PUT /api/v1/client/my-profile
   */
  static async updateMyProfile(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Will use req.tenantId and req.user?.userId
      // TODO: Implement client profile update logic
      res.status(200).json({
        success: true,
        data: {
          profile: {},
          message: 'Profile updated successfully'
        }
      });
    } catch (error) {
      logger.error('Update client profile failed', { 
        tenantId: req.tenantId,
        userId: req.user?.userId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'PROFILE_UPDATE_FAILED',
          message: 'Failed to update profile'
        }
      });
    }
  }

  /**
   * Get my applications
   * GET /api/v1/client/my-applications
   */
  static async getMyApplications(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Will use req.tenantId and req.user?.userId
      // TODO: Implement client applications retrieval logic
      res.status(200).json({
        success: true,
        data: {
          applications: [],
          message: 'Applications retrieved successfully'
        }
      });
    } catch (error) {
      logger.error('Get client applications failed', { 
        tenantId: req.tenantId,
        userId: req.user?.userId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'APPLICATIONS_RETRIEVAL_FAILED',
          message: 'Failed to retrieve applications'
        }
      });
    }
  }

  /**
   * Create application
   * POST /api/v1/client/applications
   */
  static async createApplication(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Will use req.tenantId and req.user?.userId
      // TODO: Implement client application creation logic
      res.status(201).json({
        success: true,
        data: {
          application: {},
          message: 'Application created successfully'
        }
      });
    } catch (error) {
      logger.error('Create client application failed', { 
        tenantId: req.tenantId,
        userId: req.user?.userId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'APPLICATION_CREATION_FAILED',
          message: 'Failed to create application'
        }
      });
    }
  }

  /**
   * Update application
   * PUT /api/v1/client/applications/:id
   */
  static async updateApplication(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Will use req.params.id, req.tenantId, and req.user?.userId
      // TODO: Implement client application update logic
      res.status(200).json({
        success: true,
        data: {
          application: {},
          message: 'Application updated successfully'
        }
      });
    } catch (error) {
      const applicationId = req.params.id ? ValidationUtils.validateObjectId(req.params.id, 'Application ID') : undefined;
      logger.error('Update client application failed', { 
        tenantId: req.tenantId,
        userId: req.user?.userId,
        applicationId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'APPLICATION_UPDATE_FAILED',
          message: 'Failed to update application'
        }
      });
    }
  }

  /**
   * Upload document
   * POST /api/v1/client/documents
   */
  static async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Will use req.tenantId and req.user?.userId
      // TODO: Implement client document upload logic
      res.status(201).json({
        success: true,
        data: {
          document: {},
          message: 'Document uploaded successfully'
        }
      });
    } catch (error) {
      logger.error('Upload client document failed', { 
        tenantId: req.tenantId,
        userId: req.user?.userId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'DOCUMENT_UPLOAD_FAILED',
          message: 'Failed to upload document'
        }
      });
    }
  }

  /**
   * Get application status
   * GET /api/v1/client/applications/:id/status
   */
  static async getApplicationStatus(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Will use req.params.id, req.tenantId, and req.user?.userId
      // TODO: Implement application status retrieval logic
      res.status(200).json({
        success: true,
        data: {
          status: {},
          message: 'Application status retrieved successfully'
        }
      });
    } catch (error) {
      const applicationId = req.params.id ? ValidationUtils.validateObjectId(req.params.id, 'Application ID') : undefined;
      logger.error('Get application status failed', { 
        tenantId: req.tenantId,
        userId: req.user?.userId,
        applicationId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'STATUS_RETRIEVAL_FAILED',
          message: 'Failed to retrieve application status'
        }
      });
    }
  }

  /**
   * Change password
   * PUT /api/v1/client/change-password
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Will use req.tenantId and req.user?.userId
      // TODO: Implement client password change logic
      res.status(200).json({
        success: true,
        data: {
          message: 'Password changed successfully'
        }
      });
    } catch (error) {
      logger.error('Change client password failed', { 
        tenantId: req.tenantId,
        userId: req.user?.userId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'PASSWORD_CHANGE_FAILED',
          message: 'Failed to change password'
        }
      });
    }
  }
}

/**
 * Validation Schemas
 */
const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    profile: z.object({
      phone: z.string().optional(),
      dateOfBirth: z.string().optional(),
      nationality: z.string().optional(),
      address: z.string().optional(),
      emergencyContact: z.object({
        name: z.string(),
        phone: z.string(),
        relationship: z.string()
      }).optional()
    }).optional(),
    preferences: z.object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      notifications: z.object({
        email: z.boolean().optional(),
        push: z.boolean().optional(),
        sms: z.boolean().optional()
      }).optional()
    }).optional()
  })
});

const createApplicationSchema = z.object({
  body: z.object({
    type: z.enum(['visitor_visa', 'study_visa', 'work_permit', 'permanent_residence', 'family_sponsorship', 'business_immigration']),
    status: z.enum(['draft', 'submitted', 'in_review', 'approved', 'rejected', 'in_progress']).default('draft'),
    notes: z.string().optional(),
    documents: z.array(z.string()).default([])
  })
});

const updateApplicationSchema = z.object({
  body: z.object({
    status: z.enum(['draft', 'submitted', 'in_review', 'approved', 'rejected', 'in_progress']).optional(),
    notes: z.string().optional(),
    documents: z.array(z.string()).optional()
  })
});

const applicationIdSchema = z.object({
  params: z.object({
    id: schemas.objectId
  })
});

const uploadDocumentSchema = z.object({
  body: z.object({
    applicationId: schemas.objectId.optional(),
    documentType: z.string().min(1, 'Document type is required'),
    fileName: z.string().min(1, 'File name is required'),
    fileSize: z.number().min(1, 'File size must be greater than 0'),
    mimeType: z.string().min(1, 'MIME type is required')
  })
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: schemas.strongPassword,
    confirmPassword: z.string()
  }).refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: "Passwords don't match",
      path: ['confirmPassword']
    }
  ).refine(
    (data) => data.currentPassword !== data.newPassword,
    {
      message: 'New password must be different from current password',
      path: ['newPassword']
    }
  )
});

/**
 * Client Routes
 * All routes require client authentication and are tenant-isolated
 */

/**
 * @route   GET /api/v1/client/my-profile
 * @desc    Get my profile
 * @access  Client Only
 */
router.get('/my-profile',
  cacheConfigs.userSpecific, // Cache user-specific profile for 5 minutes
  authenticateToken,
  requireClient,
  auditLog('profile.view_own', 'User'),
  ClientController.getMyProfile
);

/**
 * @route   PUT /api/v1/client/my-profile
 * @desc    Update my profile
 * @access  Client Only
 */
router.put('/my-profile',
  authenticateToken,
  requireClient,
  requirePermission('edit_own_profile'),
  validateBody(updateProfileSchema),
  auditLog('profile.update_own', 'User'),
  ClientController.updateMyProfile
);

/**
 * @route   GET /api/v1/client/my-applications
 * @desc    Get my applications
 * @access  Client Only
 */
router.get('/my-applications',
  cacheConfigs.userSpecific, // Cache user-specific applications for 5 minutes
  authenticateToken,
  requireClient,
  auditLog('applications.view_own', 'Application'),
  ClientController.getMyApplications
);

/**
 * @route   POST /api/v1/client/applications
 * @desc    Create application
 * @access  Client Only
 */
router.post('/applications',
  authenticateToken,
  requireClient,
  validateBody(createApplicationSchema),
  auditLog('applications.create', 'Application'),
  ClientController.createApplication
);

/**
 * @route   PUT /api/v1/client/applications/:id
 * @desc    Update application
 * @access  Client Only
 */
router.put('/applications/:id',
  authenticateToken,
  requireClient,
  validateParams(applicationIdSchema),
  validateBody(updateApplicationSchema),
  auditLog('applications.update_own', 'Application'),
  ClientController.updateApplication
);

/**
 * @route   GET /api/v1/client/applications/:id/status
 * @desc    Get application status
 * @access  Client Only
 */
router.get('/applications/:id/status',
  authenticateToken,
  requireClient,
  validateParams(applicationIdSchema),
  auditLog('applications.view_status', 'Application'),
  ClientController.getApplicationStatus
);

/**
 * @route   POST /api/v1/client/documents
 * @desc    Upload document
 * @access  Client Only
 */
router.post('/documents',
  authenticateToken,
  requireClient,
  requirePermission('upload_documents'),
  validateBody(uploadDocumentSchema),
  auditLog('documents.upload_own', 'Document'),
  ClientController.uploadDocument
);

/**
 * @route   PUT /api/v1/client/change-password
 * @desc    Change password
 * @access  Client Only
 */
router.put('/change-password',
  authenticateToken,
  requireClient,
  validateBody(changePasswordSchema),
  auditLog('password.change', 'User'),
  ClientController.changePassword
);

export default router;
