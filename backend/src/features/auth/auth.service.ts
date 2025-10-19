/**
 * RCIC Authentication Service
 * Handles authentication for 4 user types: super_admin, tenant_admin, team_member, client
 * 
 * @module auth.service
 */

import { SuperAdmin } from '../../models/superadmin.model';
import { Tenant } from '../../models/tenant.model';
import { TenantTeamMember } from '../../models/tenant-team-member.model';
import { User } from '../../models/user.model';
import { AuditLog } from '../../models/audit-log.model';
import {
  PasswordUtils,
  JWTUtils
} from '../../utils/auth.utils';
import { ValidationUtils } from '../../utils/validation.utils';
import logger from '../../utils/logger';
import {
  AuthTokens,
  UserProfile,
  LoginCredentials
} from './types/auth.types';
import {
  AuthenticationError
} from './types/errors.types';

/**
 * RCIC Authentication Service
 * Handles authentication for all user types in the RCIC system
 */
export class AuthService {
  /**
   * Super Admin Login
   * 
   * @param credentials - Super admin login credentials
   * @returns Authentication tokens and user profile
   * @throws AuthenticationError - Invalid credentials
   */
  static async loginSuperAdmin(credentials: LoginCredentials): Promise<{
    tokens: AuthTokens;
    user: UserProfile;
  }> {
    try {
      const { email, password } = credentials;

      // Find super admin by email (with password field)
      const superAdmin = await SuperAdmin.findOne({ email: email.toLowerCase(), deletedAt: null }).select('+password +lockUntil');
      if (!superAdmin) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await PasswordUtils.comparePassword(password, superAdmin.password);
      if (!isPasswordValid) {
        await superAdmin.incrementLoginAttempts();
        throw new AuthenticationError('Invalid credentials');
      }

      // Check if account is active
      if (!superAdmin.isActiveAccount()) {
        throw new AuthenticationError('Account is inactive');
      }

      // Reset login attempts on successful login
      await superAdmin.resetLoginAttempts();

      // Update last login
      superAdmin.lastLogin = new Date();
      await superAdmin.save();

      // Generate tokens
      const tokens = await JWTUtils.generateTokens({
        userId: superAdmin._id.toString(),
        userType: 'super_admin',
        email: superAdmin.email,
        permissions: superAdmin.permissions
      });

      // Create user profile
      const userProfile: UserProfile = {
        id: superAdmin._id.toString(),
        email: superAdmin.email,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        userType: 'super_admin',
        role: 'super_admin',
        permissions: superAdmin.permissions,
        isActive: superAdmin.isActive,
        lastLogin: superAdmin.lastLogin,
        profile: superAdmin.profile,
        preferences: superAdmin.preferences
      };

      // Log successful login
      await AuditLog.create({
        userId: superAdmin._id,
        userType: 'super_admin',
        action: 'user.login',
        resource: 'SuperAdmin',
        resourceId: superAdmin._id,
        category: 'auth',
        method: 'POST',
        endpoint: '/api/v1/auth/login/super-admin',
        ipAddress: credentials.ipAddress || 'unknown',
        userAgent: credentials.userAgent || 'unknown',
        statusCode: 200,
        details: {
          email: superAdmin.email
        }
      });

      logger.info('Super admin login successful', { 
        userId: superAdmin._id, 
        email: superAdmin.email 
      });

      return { tokens, user: userProfile };

    } catch (error) {
      logger.error('Super admin login failed', { 
        email: credentials.email, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Tenant Admin Login
   * 
   * @param credentials - Tenant admin login credentials
   * @returns Authentication tokens and user profile
   * @throws AuthenticationError - Invalid credentials
   */
  static async loginTenantAdmin(credentials: LoginCredentials): Promise<{
    tokens: AuthTokens;
    user: UserProfile;
  }> {
    try {
      const { email, password } = credentials;

      // Find tenant by admin email (with password field)
      const tenant = await Tenant.findOne({ adminEmail: email.toLowerCase(), deletedAt: null }).select('+adminPassword +adminLockUntil');
      if (!tenant) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await PasswordUtils.comparePassword(password, tenant.adminPassword);
      if (!isPasswordValid) {
        await tenant.incrementAdminLoginAttempts();
        throw new AuthenticationError('Invalid credentials');
      }

      // Check if tenant is active
      if (!tenant.isActive()) {
        throw new AuthenticationError('Tenant account is inactive');
      }

      // Reset login attempts on successful login
      await tenant.resetAdminLoginAttempts();

      // Update last login
      tenant.adminLastLogin = new Date();
      await tenant.save();

      // Generate tokens
      const tokens = await JWTUtils.generateTokens({
        userId: tenant._id.toString(),
        userType: 'tenant_admin',
        tenantId: tenant._id.toString(),
        email: tenant.adminEmail,
        permissions: ['manage_team', 'view_clients', 'manage_settings']
      });

      // Create user profile
      const userProfile: UserProfile = {
        id: tenant._id.toString(),
        email: tenant.adminEmail,
        firstName: tenant.adminFirstName,
        lastName: tenant.adminLastName,
        userType: 'tenant_admin',
        role: 'admin',
        tenantId: tenant._id.toString(),
        tenantName: tenant.name,
        tenantDomain: tenant.domain,
        permissions: ['manage_team', 'view_clients', 'manage_settings'],
        isActive: tenant.isActive(),
        lastLogin: tenant.adminLastLogin,
        profile: {
          phone: tenant.metadata.phone,
          timezone: 'UTC'
        },
        preferences: {
          theme: 'system',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        }
      };

      // Log successful login
      await AuditLog.create({
        tenantId: tenant._id,
        userId: tenant._id,
        userType: 'tenant_admin',
        action: 'user.login',
        resource: 'Tenant',
        resourceId: tenant._id,
        category: 'auth',
        method: 'POST',
        endpoint: '/api/v1/auth/login/tenant-admin',
        ipAddress: credentials.ipAddress || 'unknown',
        userAgent: credentials.userAgent || 'unknown',
        statusCode: 200,
        details: {
          email: tenant.adminEmail
        }
      });

      logger.info('Tenant admin login successful', { 
        tenantId: tenant._id, 
        email: tenant.adminEmail 
      });

      return { tokens, user: userProfile };

    } catch (error) {
      logger.error('Tenant admin login failed', { 
        email: credentials.email, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Team Member Login
   * 
   * @param credentials - Team member login credentials
   * @returns Authentication tokens and user profile
   * @throws AuthenticationError - Invalid credentials
   */
  static async loginTeamMember(credentials: LoginCredentials): Promise<{
    tokens: AuthTokens;
    user: UserProfile;
  }> {
    try {
      const { email, password } = credentials;

      // Find team member by email (with password field)
      const teamMember = await TenantTeamMember.findOne({ email: email.toLowerCase(), deletedAt: null }).select('+password +lockUntil');
      if (!teamMember) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await PasswordUtils.comparePassword(password, teamMember.password);
      if (!isPasswordValid) {
        await teamMember.incrementLoginAttempts();
        throw new AuthenticationError('Invalid credentials');
      }

      // Check if account is active
      if (!teamMember.isActiveAccount()) {
        throw new AuthenticationError('Account is inactive');
      }

      // Reset login attempts on successful login
      await teamMember.resetLoginAttempts();

      // Update last login
      teamMember.lastLogin = new Date();
      await teamMember.save();

      // Get tenant information
      const teamMemberTenantId = ValidationUtils.validateObjectId(teamMember.tenantId.toString(), 'Tenant ID');
      const tenant = await Tenant.findById(teamMemberTenantId);
      if (!tenant) {
        throw new AuthenticationError('Tenant not found');
      }

      // Generate tokens
      const tokens = await JWTUtils.generateTokens({
        userId: teamMember._id.toString(),
        userType: 'team_member',
        tenantId: teamMember.tenantId.toString(),
        email: teamMember.email,
        permissions: teamMember.permissions
      });

      // Create user profile
      const userProfile: UserProfile = {
        id: teamMember._id.toString(),
        email: teamMember.email,
        firstName: teamMember.firstName,
        lastName: teamMember.lastName,
        userType: 'team_member',
        role: teamMember.role,
        tenantId: teamMember.tenantId.toString(),
        tenantName: tenant.name,
        tenantDomain: tenant.domain,
        permissions: teamMember.permissions,
        specializations: teamMember.specializations,
        isActive: teamMember.isActive,
        lastLogin: teamMember.lastLogin,
        profile: teamMember.profile,
        preferences: teamMember.preferences
      };

      // Log successful login
      await AuditLog.create({
        tenantId: teamMember.tenantId,
        userId: teamMember._id,
        userType: 'team_member',
        action: 'user.login',
        resource: 'TenantTeamMember',
        resourceId: teamMember._id,
        category: 'auth',
        method: 'POST',
        endpoint: '/api/v1/auth/login/team-member',
        ipAddress: credentials.ipAddress || 'unknown',
        userAgent: credentials.userAgent || 'unknown',
        statusCode: 200,
        details: {
          email: teamMember.email
        }
      });

      logger.info('Team member login successful', { 
        teamMemberId: teamMember._id, 
        tenantId: teamMember.tenantId,
        email: teamMember.email 
      });

      return { tokens, user: userProfile };

    } catch (error) {
      logger.error('Team member login failed', { 
        email: credentials.email, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Client Login
   * 
   * @param credentials - Client login credentials
   * @returns Authentication tokens and user profile
   * @throws AuthenticationError - Invalid credentials
   */
  static async loginClient(credentials: LoginCredentials): Promise<{
    tokens: AuthTokens;
    user: UserProfile;
  }> {
    try {
      const { email, password } = credentials;

      // Find client by email (with password field)
      const client = await User.findOne({ email: email.toLowerCase(), deletedAt: null }).select('+password +lockUntil');
      if (!client) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await PasswordUtils.comparePassword(password, client.password);
      if (!isPasswordValid) {
        await client.incrementLoginAttempts();
        throw new AuthenticationError('Invalid credentials');
      }

      // Check if account is active
      if (!client.isActive()) {
        throw new AuthenticationError('Account is inactive');
      }

      // Reset login attempts on successful login
      await client.resetLoginAttempts();

      // Update last login
      client.lastLogin = new Date();
      await client.save();

      // Get tenant information
      const clientTenantId = ValidationUtils.validateObjectId(client.tenantId.toString(), 'Tenant ID');
      const tenant = await Tenant.findById(clientTenantId);
      if (!tenant) {
        throw new AuthenticationError('Tenant not found');
      }

      // Generate tokens
      const tokens = await JWTUtils.generateTokens({
        userId: client._id.toString(),
        userType: 'client',
        tenantId: client.tenantId.toString(),
        email: client.email,
        permissions: ['view_own_profile', 'edit_own_profile', 'view_own_applications', 'upload_documents']
      });

      // Create user profile
      const userProfile: UserProfile = {
        id: client._id.toString(),
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        userType: 'client',
        role: 'client',
        tenantId: client.tenantId.toString(),
        tenantName: tenant.name,
        tenantDomain: tenant.domain,
        permissions: ['view_own_profile', 'edit_own_profile', 'view_own_applications', 'upload_documents'],
        isActive: client.isActive(),
        lastLogin: client.lastLogin,
        profile: client.profile,
        preferences: client.preferences
      };

      // Log successful login
      await AuditLog.create({
        tenantId: client.tenantId,
        userId: client._id,
        userType: 'client',
        action: 'user.login',
        resource: 'User',
        resourceId: client._id,
        category: 'auth',
        method: 'POST',
        endpoint: '/api/v1/auth/login/client',
        ipAddress: credentials.ipAddress || 'unknown',
        userAgent: credentials.userAgent || 'unknown',
        statusCode: 200,
        details: {
          email: client.email
        }
      });

      logger.info('Client login successful', { 
        clientId: client._id, 
        tenantId: client.tenantId,
        email: client.email 
      });

      return { tokens, user: userProfile };

    } catch (error) {
      logger.error('Client login failed', { 
        email: credentials.email, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Refresh Access Token
   * 
   * @param refreshToken - Refresh token
   * @returns New access token
   * @throws AuthenticationError - Invalid refresh token
   */
  static async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = JWTUtils.verifyRefreshToken(refreshToken);
      
      // Generate new access token
      const accessToken = await JWTUtils.generateAccessToken({
        userId: decoded.userId,
        userType: decoded.userType,
        tenantId: decoded.tenantId,
        email: decoded.email,
        permissions: decoded.permissions
      });

      logger.info('Token refreshed successfully', { 
        userId: decoded.userId, 
        userType: decoded.userType 
      });

      return { accessToken };

    } catch (error) {
      logger.error('Token refresh failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  /**
   * Logout User
   * 
   * @param userId - User ID
   * @param userType - User type
   * @param tenantId - Tenant ID (if applicable)
   */
  static async logout(userId: string, userType: string, tenantId?: string): Promise<void> {
    try {
      // Log logout action
      await AuditLog.create({
        tenantId: tenantId ? tenantId : undefined,
        userId: userId,
        userType: userType,
        action: 'user.logout',
        resource: 'User',
        resourceId: userId,
        details: {
          timestamp: new Date()
        }
      });

      logger.info('User logout successful', { 
        userId, 
        userType, 
        tenantId 
      });

    } catch (error) {
      logger.error('Logout failed', { 
        userId, 
        userType, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      // Don't throw error for logout failures
    }
  }

  /**
   * Get User Profile
   * 
   * @param userId - User ID
   * @param userType - User type
   * @param tenantId - Tenant ID (if applicable)
   * @returns User profile
   * @throws AuthenticationError - User not found
   */
  static async getProfile(userId: string, userType: string, _tenantId?: string): Promise<UserProfile> {
    try {
      // Validate userId (defense-in-depth, even though it comes from JWT)
      const validatedUserId = ValidationUtils.validateObjectId(userId, 'User ID');
      
      let userProfile: UserProfile;

      switch (userType) {
        case 'super_admin':
          const superAdmin = await SuperAdmin.findById(validatedUserId);
          if (!superAdmin) {
            throw new AuthenticationError('Super admin not found');
          }
          userProfile = {
            id: superAdmin._id.toString(),
            email: superAdmin.email,
            firstName: superAdmin.firstName,
            lastName: superAdmin.lastName,
            userType: 'super_admin',
            role: 'super_admin',
            permissions: superAdmin.permissions,
            isActive: superAdmin.isActive,
            lastLogin: superAdmin.lastLogin,
            profile: superAdmin.profile,
            preferences: superAdmin.preferences
          };
          break;

        case 'tenant_admin':
          const tenant = await Tenant.findById(validatedUserId);
          if (!tenant) {
            throw new AuthenticationError('Tenant not found');
          }
          userProfile = {
            id: tenant._id.toString(),
            email: tenant.adminEmail,
            firstName: tenant.adminFirstName,
            lastName: tenant.adminLastName,
            userType: 'tenant_admin',
            role: 'admin',
            tenantId: tenant._id.toString(),
            tenantName: tenant.name,
            tenantDomain: tenant.domain,
            permissions: ['manage_team', 'view_clients', 'manage_settings'],
            isActive: tenant.isActive(),
            lastLogin: tenant.adminLastLogin,
            profile: {
              phone: tenant.metadata.phone,
              timezone: 'UTC'
            },
            preferences: {
              theme: 'system',
              notifications: {
                email: true,
                push: true,
                sms: false
              }
            }
          };
          break;

        case 'team_member':
          const teamMember = await TenantTeamMember.findById(validatedUserId);
          if (!teamMember) {
            throw new AuthenticationError('Team member not found');
          }
          const validatedTenantId = ValidationUtils.validateObjectId(teamMember.tenantId.toString(), 'Tenant ID');
          const teamMemberTenant = await Tenant.findById(validatedTenantId);
          userProfile = {
            id: teamMember._id.toString(),
            email: teamMember.email,
            firstName: teamMember.firstName,
            lastName: teamMember.lastName,
            userType: 'team_member',
            role: teamMember.role,
            tenantId: teamMember.tenantId.toString(),
            tenantName: teamMemberTenant?.name || 'Unknown',
            tenantDomain: teamMemberTenant?.domain || 'Unknown',
            permissions: teamMember.permissions,
            specializations: teamMember.specializations,
            isActive: teamMember.isActive,
            lastLogin: teamMember.lastLogin,
            profile: teamMember.profile,
            preferences: teamMember.preferences
          };
          break;

        case 'client':
          const client = await User.findById(validatedUserId);
          if (!client) {
            throw new AuthenticationError('Client not found');
          }
          const validatedClientTenantId = ValidationUtils.validateObjectId(client.tenantId.toString(), 'Tenant ID');
          const clientTenant = await Tenant.findById(validatedClientTenantId);
          userProfile = {
            id: client._id.toString(),
            email: client.email,
            firstName: client.firstName,
            lastName: client.lastName,
            userType: 'client',
            role: 'client',
            tenantId: client.tenantId.toString(),
            tenantName: clientTenant?.name || 'Unknown',
            tenantDomain: clientTenant?.domain || 'Unknown',
            permissions: ['view_own_profile', 'edit_own_profile', 'view_own_applications', 'upload_documents'],
            isActive: client.isActive(),
            lastLogin: client.lastLogin,
            profile: client.profile,
            preferences: client.preferences
          };
          break;

        default:
          throw new AuthenticationError('Invalid user type');
      }

      return userProfile;

    } catch (error) {
      logger.error('Get profile failed', { 
        userId, 
        userType, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }
}
