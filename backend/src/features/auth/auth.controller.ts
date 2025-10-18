import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import logger from '../../utils/logger';

/**
 * RCIC Authentication Controller
 * Handles HTTP requests for authentication endpoints for all user types
 */
export class AuthController {
  /**
   * Super Admin Login
   * POST /api/v1/auth/login/super-admin
   */
  static async loginSuperAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const result = await AuthService.loginSuperAdmin({
        email,
        password,
        ipAddress,
        userAgent
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
          message: 'Super admin login successful'
        }
      });
    } catch (error) {
      logger.error('Super admin login controller error:', error);
      
      res.status(401).json({
        success: false,
        error: {
          code: 'SUPER_ADMIN_LOGIN_FAILED',
          message: error instanceof Error ? error.message : 'Super admin login failed'
        }
      });
    }
  }

  /**
   * Tenant Admin Login
   * POST /api/v1/auth/login/tenant-admin
   */
  static async loginTenantAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const result = await AuthService.loginTenantAdmin({
        email,
        password,
        ipAddress,
        userAgent
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
          message: 'Tenant admin login successful'
        }
      });
    } catch (error) {
      logger.error('Tenant admin login controller error:', error);
      
      res.status(401).json({
        success: false,
        error: {
          code: 'TENANT_ADMIN_LOGIN_FAILED',
          message: error instanceof Error ? error.message : 'Tenant admin login failed'
        }
      });
    }
  }

  /**
   * Team Member Login
   * POST /api/v1/auth/login/team-member
   */
  static async loginTeamMember(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const result = await AuthService.loginTeamMember({
        email,
        password,
        ipAddress,
        userAgent
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
          message: 'Team member login successful'
        }
      });
    } catch (error) {
      logger.error('Team member login controller error:', error);
      
      res.status(401).json({
        success: false,
        error: {
          code: 'TEAM_MEMBER_LOGIN_FAILED',
          message: error instanceof Error ? error.message : 'Team member login failed'
        }
      });
    }
  }

  /**
   * Client Login
   * POST /api/v1/auth/login/client
   */
  static async loginClient(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const result = await AuthService.loginClient({
        email,
        password,
        ipAddress,
        userAgent
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
          message: 'Client login successful'
        }
      });
    } catch (error) {
      logger.error('Client login controller error:', error);
      
      res.status(401).json({
        success: false,
        error: {
          code: 'CLIENT_LOGIN_FAILED',
          message: error instanceof Error ? error.message : 'Client login failed'
        }
      });
    }
  }

  /**
   * Refresh Access Token
   * POST /api/v1/auth/refresh
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: {
            code: 'REFRESH_TOKEN_REQUIRED',
            message: 'Refresh token is required'
          }
        });
        return;
      }

      const result = await AuthService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          message: 'Token refreshed successfully'
        }
      });
    } catch (error) {
      logger.error('Token refresh controller error:', error);
      
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: error instanceof Error ? error.message : 'Token refresh failed'
        }
      });
    }
  }

  /**
   * Logout User
   * POST /api/v1/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { userId, userType, tenantId } = req.user || {};

      if (!userId || !userType) {
        res.status(400).json({
          success: false,
          error: {
            code: 'LOGOUT_FAILED',
            message: 'User information not found'
          }
        });
        return;
      }

      await AuthService.logout(userId, userType, tenantId);

      res.status(200).json({
        success: true,
        data: {
          message: 'Logout successful'
        }
      });
    } catch (error) {
      logger.error('Logout controller error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: error instanceof Error ? error.message : 'Logout failed'
        }
      });
    }
  }

  /**
   * Get User Profile
   * GET /api/v1/auth/profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId, userType, tenantId } = req.user || {};

      if (!userId || !userType) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const userProfile = await AuthService.getProfile(userId, userType, tenantId);

      res.status(200).json({
        success: true,
        data: {
          user: userProfile,
          message: 'Profile retrieved successfully'
        }
      });
    } catch (error) {
      logger.error('Get profile controller error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'PROFILE_RETRIEVAL_FAILED',
          message: error instanceof Error ? error.message : 'Failed to retrieve profile'
        }
      });
    }
  }

  /**
   * Health Check
   * GET /api/v1/auth/health
   */
  static async healthCheck(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: {
        message: 'Authentication service is healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  }
}