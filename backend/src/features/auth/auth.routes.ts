import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticateToken, optionalAuth, authRateLimit } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/zod.middleware';
import { cacheConfigs } from '../../middleware/cache.middleware';
import {
  superAdminLoginSchema,
  tenantAdminLoginSchema,
  teamMemberLoginSchema,
  clientLoginSchema,
  refreshTokenSchema
} from './auth.schemas';

const router = Router();

/**
 * RCIC Authentication Routes
 * All routes prefixed with /api/v1/auth
 */

// Rate limiter
const authLimiter = authRateLimit;

/**
 * @route   POST /api/v1/auth/login/super-admin
 * @desc    Super admin login
 * @access  Public
 */
router.post('/login/super-admin', 
  authLimiter,
  validate(superAdminLoginSchema),
  AuthController.loginSuperAdmin
);

/**
 * @route   POST /api/v1/auth/login/tenant-admin
 * @desc    Tenant admin login
 * @access  Public
 */
router.post('/login/tenant-admin', 
  authLimiter,
  validate(tenantAdminLoginSchema),
  AuthController.loginTenantAdmin
);

/**
 * @route   POST /api/v1/auth/login/team-member
 * @desc    Team member login
 * @access  Public
 */
router.post('/login/team-member', 
  authLimiter,
  validate(teamMemberLoginSchema),
  AuthController.loginTeamMember
);

/**
 * @route   POST /api/v1/auth/login/client
 * @desc    Client login
 * @access  Public
 */
router.post('/login/client', 
  authLimiter,
  validate(clientLoginSchema),
  AuthController.loginClient
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', 
  validate(refreshTokenSchema),
  AuthController.refreshToken
);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', 
  cacheConfigs.userSpecific, // Cache user-specific profile data for 5 minutes
  authenticateToken,
  AuthController.getProfile
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', 
  optionalAuth, // Optional auth for graceful logout
  AuthController.logout
);

/**
 * @route   GET /api/v1/auth/health
 * @desc    Authentication service health check
 * @access  Public
 */
router.get('/health', 
  cacheConfigs.short, // Cache health check for 1 minute
  AuthController.healthCheck
);

export default router;