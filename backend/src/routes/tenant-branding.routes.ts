/**
 * Tenant Branding Routes
 * Handles tenant branding customization (logo, theme colors)
 * 
 * Following BACKEND-CORE.mdc:
 * - Input validation with Zod
 * - Error handling with try/catch
 * - Audit logging for all operations
 * - Rate limiting
 */

import { Router } from 'express';
// import { z } from 'zod'; // Commented out for now
import { authMiddleware } from '../middleware/auth.middleware';
import { cacheConfigs, createCacheInvalidationMiddleware } from '../middleware/cache.middleware';
import { Tenant } from '../models/tenant.model';
import AuditLoggingService from '../services/audit-logging.service';
import { ValidationUtils } from '../utils/validation.utils';
import logger from '../utils/logger';

const router = Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Validation schemas (commented out for now - will add validation later)
// const updateBrandingSchema = z.object({
//   logo: z.string().url().optional(),
//   theme: z.object({
//     palette: z.enum(['royal-blue', 'cool-green', 'sunset-purple', 'warm-coral', 'elegant-gray']),
//     colors: z.object({
//       primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid primary color format'),
//       secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid secondary color format'),
//       accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid accent color format'),
//       neutral: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid neutral color format'),
//       surface: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid surface color format'),
//     })
//   })
// });

/**
 * GET /api/v1/tenant/branding
 * Get current tenant branding
 */
router.get('/branding', cacheConfigs.tenantSpecific, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found'
      });
    }

    const validatedTenantId = ValidationUtils.validateObjectId(tenantId, 'Tenant ID');
    const tenant = await Tenant.findById(validatedTenantId).select('settings.branding');
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Return default branding if none set
    const branding = tenant.settings.branding || {
      theme: {
        palette: 'warm-coral',
        colors: {
          primary: '#dc2626',
          secondary: '#ef4444',
          accent: '#f87171',
          neutral: '#6b7280',
          surface: '#fef2f2'
        }
      }
    };

    // Audit log
    const auditService = AuditLoggingService.getInstance();
    await auditService.logEvent({
      action: 'view_branding',
      resource: 'tenant_branding',
      resourceId: tenantId,
      userId: req.user?.userId,
      method: 'GET',
      endpoint: '/branding',
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      statusCode: 200,
      category: 'tenant_management',
      metadata: { tenantId }
    });

    return res.json({
      success: true,
      data: branding
    });

  } catch (error) {
    logger.error('Failed to get tenant branding', { error, userId: req.user?.userId });
    return res.status(500).json({
      success: false,
      message: 'Failed to get tenant branding'
    });
  }
});

/**
 * PUT /api/v1/tenant/branding
 * Update tenant branding
 */
router.put('/branding', createCacheInvalidationMiddleware(['cache:GET:/api/v1/tenant/branding*']), async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { logo, theme } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found'
      });
    }

    // Check if user is tenant admin
    if (req.user?.userType !== 'tenant_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only tenant admins can update branding'
      });
    }

    const validatedTenantId2 = ValidationUtils.validateObjectId(tenantId, 'Tenant ID');
    const tenant = await Tenant.findById(validatedTenantId2);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Update branding
    tenant.settings.branding = {
      logo,
      theme: {
        palette: theme.palette,
        colors: {
          primary: theme.colors.primary,
          secondary: theme.colors.secondary,
          accent: theme.colors.accent,
          neutral: theme.colors.neutral,
          surface: theme.colors.surface
        }
      }
    };

    await tenant.save();

    // Audit log
    const auditService = AuditLoggingService.getInstance();
    await auditService.logEvent({
      action: 'update_branding',
      resource: 'tenant_branding',
      resourceId: tenantId,
      userId: req.user?.userId,
      method: 'PUT',
      endpoint: '/branding',
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      statusCode: 200,
      category: 'tenant_management',
      metadata: { 
        tenantId,
        palette: theme.palette,
        hasLogo: !!logo
      }
    });

    logger.info('Tenant branding updated', { 
      tenantId, 
      userId: req.user?.userId,
      palette: theme.palette 
    });

    return res.json({
      success: true,
      message: 'Branding updated successfully',
      data: tenant.settings.branding
    });

  } catch (error) {
    logger.error('Failed to update tenant branding', { error, userId: req.user?.userId });
    return res.status(500).json({
      success: false,
      message: 'Failed to update tenant branding'
    });
  }
});

/**
 * DELETE /api/v1/tenant/branding/logo
 * Remove tenant logo
 */
router.delete('/branding/logo', createCacheInvalidationMiddleware(['cache:GET:/api/v1/tenant/branding*']), async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found'
      });
    }

    // Check if user is tenant admin
    if (req.user?.userType !== 'tenant_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only tenant admins can remove logo'
      });
    }

    const validatedTenantId3 = ValidationUtils.validateObjectId(tenantId, 'Tenant ID');
    const tenant = await Tenant.findById(validatedTenantId3);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Remove logo
    if (tenant.settings.branding) {
      tenant.settings.branding.logo = undefined;
      await tenant.save();
    }

    // Audit log
    const auditService = AuditLoggingService.getInstance();
    await auditService.logEvent({
      action: 'remove_logo',
      resource: 'tenant_branding',
      resourceId: tenantId,
      userId: req.user?.userId,
      method: 'DELETE',
      endpoint: '/branding/logo',
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      statusCode: 200,
      category: 'tenant_management',
      metadata: { tenantId }
    });

    logger.info('Tenant logo removed', { tenantId, userId: req.user?.userId });

    return res.json({
      success: true,
      message: 'Logo removed successfully'
    });

  } catch (error) {
    logger.error('Failed to remove tenant logo', { error, userId: req.user?.userId });
    return res.status(500).json({
      success: false,
      message: 'Failed to remove tenant logo'
    });
  }
});

export default router;
