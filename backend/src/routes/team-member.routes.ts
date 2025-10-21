/**
 * Team Member Routes
 * Handles team member operations with proper tenant isolation
 * 
 * @module routes/team-member
 */

import { Router, Request, Response } from 'express';
import { authenticateToken, requireTeamMember, auditLog, requirePermission } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/zod.middleware';
import { cacheConfigs, createCacheInvalidationMiddleware } from '../middleware/cache.middleware';
import { z } from 'zod';
import { schemas } from '../utils/zod.schemas';
import { ValidationUtils } from '../utils/validation.utils';
import logger from '../utils/logger';

const router = Router();

/**
 * Team Member Controllers
 * These will be implemented in separate controller files
 */
class TeamMemberController {
  /**
   * Get assigned clients
   * GET /api/v1/team-member/my-clients
   */
  static async getMyClients(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Will use req.tenantId and req.user?.userId
      // TODO: Implement assigned clients listing logic
      res.status(200).json({
        success: true,
        data: {
          clients: [],
          message: 'Assigned clients retrieved successfully'
        }
      });
    } catch (error) {
      logger.error('Get assigned clients failed', { 
        tenantId: req.tenantId,
        userId: req.user?.userId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'CLIENTS_RETRIEVAL_FAILED',
          message: 'Failed to retrieve assigned clients'
        }
      });
    }
  }

  /**
   * Create client
   * POST /api/v1/team-member/clients
   */
  static async createClient(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Will use req.tenantId and req.user?.userId
      // TODO: Implement client creation logic
      res.status(201).json({
        success: true,
        data: {
          client: {},
          message: 'Client created successfully'
        }
      });
    } catch (error) {
      logger.error('Create client failed', { 
        tenantId: req.tenantId,
        userId: req.user?.userId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'CLIENT_CREATION_FAILED',
          message: 'Failed to create client'
        }
      });
    }
  }

  /**
   * Update client
   * PUT /api/v1/team-member/clients/:id
   */
  static async updateClient(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Will use req.params.id, req.tenantId, and req.user?.userId
      // TODO: Implement client update logic
      res.status(200).json({
        success: true,
        data: {
          client: {},
          message: 'Client updated successfully'
        }
      });
    } catch (error) {
      const clientId = req.params.id ? ValidationUtils.validateObjectId(req.params.id, 'Client ID') : undefined;
      logger.error('Update client failed', { 
        tenantId: req.tenantId,
        userId: req.user?.userId,
        clientId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'CLIENT_UPDATE_FAILED',
          message: 'Failed to update client'
        }
      });
    }
  }

  /**
   * Get applications
   * GET /api/v1/team-member/applications
   */
  static async getApplications(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Will use req.tenantId and req.user?.userId
      // TODO: Implement applications listing logic
      res.status(200).json({
        success: true,
        data: {
          applications: [],
          message: 'Applications retrieved successfully'
        }
      });
    } catch (error) {
      logger.error('Get applications failed', { 
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
   * POST /api/v1/team-member/applications
   */
  static async createApplication(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Will use req.tenantId and req.user?.userId
      // TODO: Implement application creation logic
      res.status(201).json({
        success: true,
        data: {
          application: {},
          message: 'Application created successfully'
        }
      });
    } catch (error) {
      logger.error('Create application failed', { 
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
   * PUT /api/v1/team-member/applications/:id
   */
  static async updateApplication(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Will use req.params.id, req.tenantId, and req.user?.userId
      // TODO: Implement application update logic
      res.status(200).json({
        success: true,
        data: {
          application: {},
          message: 'Application updated successfully'
        }
      });
    } catch (error) {
      const applicationId = req.params.id ? ValidationUtils.validateObjectId(req.params.id, 'Application ID') : undefined;
      logger.error('Update application failed', { 
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
   * POST /api/v1/team-member/documents
   */
  static async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Will use req.tenantId and req.user?.userId
      // TODO: Implement document upload logic
      res.status(201).json({
        success: true,
        data: {
          document: {},
          message: 'Document uploaded successfully'
        }
      });
    } catch (error) {
      logger.error('Upload document failed', { 
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
}

/**
 * Validation Schemas
 */
const createClientSchema = z.object({
  body: z.object({
    email: schemas.secureEmail,
    password: schemas.strongPassword,
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    applicationType: z.enum(['visitor_visa', 'study_visa', 'work_permit', 'permanent_residence', 'family_sponsorship', 'business_immigration']),
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
    }).optional()
  })
});

const updateClientSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    applicationType: z.enum(['visitor_visa', 'study_visa', 'work_permit', 'permanent_residence', 'family_sponsorship', 'business_immigration']).optional(),
    status: z.enum(['active', 'inactive', 'pending', 'suspended']).optional(),
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
    application: z.object({
      status: z.enum(['draft', 'submitted', 'in_review', 'approved', 'rejected', 'in_progress']).optional(),
      notes: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
    }).optional()
  })
});

const clientIdSchema = z.object({
  params: z.object({
    id: schemas.objectId
  })
});

const createApplicationSchema = z.object({
  body: z.object({
    clientId: schemas.objectId,
    type: z.enum(['visitor_visa', 'study_visa', 'work_permit', 'permanent_residence', 'family_sponsorship', 'business_immigration']),
    status: z.enum(['draft', 'submitted', 'in_review', 'approved', 'rejected', 'in_progress']).default('draft'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    notes: z.string().optional(),
    documents: z.array(z.string()).default([])
  })
});

const updateApplicationSchema = z.object({
  body: z.object({
    status: z.enum(['draft', 'submitted', 'in_review', 'approved', 'rejected', 'in_progress']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
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
    clientId: schemas.objectId,
    applicationId: schemas.objectId.optional(),
    documentType: z.string().min(1, 'Document type is required'),
    fileName: z.string().min(1, 'File name is required'),
    fileSize: z.number().min(1, 'File size must be greater than 0'),
    mimeType: z.string().min(1, 'MIME type is required')
  })
});

/**
 * Team Member Routes
 * All routes require team member authentication and are tenant-isolated
 */

/**
 * @route   GET /api/v1/team-member/my-clients
 * @desc    Get assigned clients
 * @access  Team Member Only
 */
router.get('/my-clients',
  cacheConfigs.userSpecific, // Cache user-specific assigned clients for 5 minutes
  authenticateToken,
  requireTeamMember,
  auditLog('clients.list_assigned', 'User'),
  TeamMemberController.getMyClients
);

/**
 * @route   POST /api/v1/team-member/clients
 * @desc    Create client
 * @access  Team Member Only
 */
router.post('/clients',
  createCacheInvalidationMiddleware(['cache:GET:/api/v1/team-member/my-clients*']), // Invalidate assigned clients cache
  authenticateToken,
  requireTeamMember,
  requirePermission('create_clients'),
  validateBody(createClientSchema),
  auditLog('clients.create', 'User'),
  TeamMemberController.createClient
);

/**
 * @route   PUT /api/v1/team-member/clients/:id
 * @desc    Update client
 * @access  Team Member Only
 */
router.put('/clients/:id',
  authenticateToken,
  requireTeamMember,
  requirePermission('edit_clients'),
  validateParams(clientIdSchema),
  validateBody(updateClientSchema),
  auditLog('clients.update', 'User'),
  TeamMemberController.updateClient
);

/**
 * @route   GET /api/v1/team-member/applications
 * @desc    Get applications
 * @access  Team Member Only
 */
router.get('/applications',
  cacheConfigs.userSpecific, // Cache user-specific applications for 5 minutes
  authenticateToken,
  requireTeamMember,
  auditLog('applications.list', 'Application'),
  TeamMemberController.getApplications
);

/**
 * @route   POST /api/v1/team-member/applications
 * @desc    Create application
 * @access  Team Member Only
 */
router.post('/applications',
  authenticateToken,
  requireTeamMember,
  requirePermission('create_applications'),
  validateBody(createApplicationSchema),
  auditLog('applications.create', 'Application'),
  TeamMemberController.createApplication
);

/**
 * @route   PUT /api/v1/team-member/applications/:id
 * @desc    Update application
 * @access  Team Member Only
 */
router.put('/applications/:id',
  authenticateToken,
  requireTeamMember,
  requirePermission('edit_applications'),
  validateParams(applicationIdSchema),
  validateBody(updateApplicationSchema),
  auditLog('applications.update', 'Application'),
  TeamMemberController.updateApplication
);

/**
 * @route   POST /api/v1/team-member/documents
 * @desc    Upload document
 * @access  Team Member Only
 */
router.post('/documents',
  authenticateToken,
  requireTeamMember,
  requirePermission('upload_documents'),
  validateBody(uploadDocumentSchema),
  auditLog('documents.upload', 'Document'),
  TeamMemberController.uploadDocument
);

export default router;
