/**
 * Tenant Admin Service
 * Business logic for team member and client management
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 9: TypeScript strict (no 'any')
 * - Rule 10: Multi-tenant isolation
 * - Rule 12: Validate ALL external data
 */

import bcrypt from 'bcryptjs';
import { TenantTeamMember, ITenantTeamMember } from '../../models/tenant-team-member.model';
import { User, IUser } from '../../models/user.model';
import { Tenant } from '../../models/tenant.model';
import { config } from '../../config/env.config';
import { HydratedDocument } from 'mongoose';
import { SecurityUtils } from '../../utils/auth.utils';
import { ValidationUtils } from '../../utils/validation.utils';

/**
 * Create Team Member Input Interface
 */
export interface CreateTeamMemberInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'visa_specialist' | 'work_permit_specialist' | 'case_manager';
  specializations?: string[];
  permissions?: string[];
}

/**
 * Update Team Member Input Interface
 */
export interface UpdateTeamMemberInput {
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'visa_specialist' | 'work_permit_specialist' | 'case_manager';
  specializations?: string[];
  permissions?: string[];
  isActive?: boolean;
}

/**
 * Team Member Response Interface
 */
export interface TeamMemberResponse {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  specializations: string[];
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create Client Input Interface
 */
export interface CreateClientInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  applicationType: 'visitor_visa' | 'study_visa' | 'work_permit' | 'permanent_residence' | 'family_sponsorship' | 'business_immigration';
  assignedTo?: string; // Team member ID
}

/**
 * Client Response Interface
 */
export interface ClientResponse {
  id: string;
  tenantId: string;
  assignedTo?: string;
  assignedToName?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  applicationType: string;
  status: string;
  emailVerified: boolean;
  applicationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tenant Admin Service
 */
export class TenantAdminService {
  /**
   * Get all team members for a tenant
   */
  static async getTeamMembers(tenantId: string): Promise<TeamMemberResponse[]> {
    const teamMembers = await TenantTeamMember.find({ 
      tenantId, 
      deletedAt: null 
    })
      .sort({ createdAt: -1 })
      .lean();

    return teamMembers.map(member => ({
      id: member._id.toString(),
      tenantId: member.tenantId.toString(),
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      role: member.role,
      specializations: member.specializations,
      permissions: member.permissions,
      isActive: member.isActive,
      lastLogin: member.lastLogin,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt
    }));
  }

  /**
   * Create new team member
   */
  static async createTeamMember(
    tenantId: string,
    input: CreateTeamMemberInput
  ): Promise<TeamMemberResponse> {
    // Check if tenant exists and is active
    const validatedTenantId = ValidationUtils.validateObjectId(tenantId, 'Tenant ID');
    const tenant = await Tenant.findById(validatedTenantId);
    if (!tenant || tenant.deletedAt) {
      throw new Error('Tenant not found');
    }

    // SECURITY FIX: Check if tenant status is active
    if (tenant.status !== 'active') {
      throw new Error('Tenant account is not active. Please contact support.');
    }

    // Check if team member limit is reached
    const currentCount = await TenantTeamMember.countDocuments({ 
      tenantId, 
      deletedAt: null 
    });

    if (!tenant.canAddTeamMember(currentCount)) {
      throw new Error('Team member limit reached for this tenant');
    }

    // Check if email already exists in this tenant
    const existingMember = await TenantTeamMember.findOne({
      tenantId,
      email: input.email.toLowerCase(),
      deletedAt: null
    });

    if (existingMember) {
      throw new Error('Team member with this email already exists in your organization');
    }

    // SECURITY FIX: Sanitize string inputs
    const sanitizedFirstName = SecurityUtils.sanitizeInput(input.firstName);
    const sanitizedLastName = SecurityUtils.sanitizeInput(input.lastName);

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, config.BCRYPT_SALT_ROUNDS);

    // Create team member
    const teamMember: HydratedDocument<ITenantTeamMember> = await TenantTeamMember.create({
      tenantId,
      email: input.email.toLowerCase(),
      password: hashedPassword,
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      role: input.role || 'case_manager',
      specializations: input.specializations || [],
      permissions: input.permissions || [],
      isActive: true
    });

    return {
      id: teamMember._id.toString(),
      tenantId: teamMember.tenantId.toString(),
      email: teamMember.email,
      firstName: teamMember.firstName,
      lastName: teamMember.lastName,
      role: teamMember.role,
      specializations: teamMember.specializations,
      permissions: teamMember.permissions,
      isActive: teamMember.isActive,
      createdAt: teamMember.createdAt,
      updatedAt: teamMember.updatedAt
    };
  }

  /**
   * Update team member
   */
  static async updateTeamMember(
    tenantId: string,
    teamMemberId: string,
    input: UpdateTeamMemberInput
  ): Promise<TeamMemberResponse | null> {
    const teamMember = await TenantTeamMember.findOne({
      _id: teamMemberId,
      tenantId,
      deletedAt: null
    });

    if (!teamMember) {
      return null;
    }

    // SECURITY FIX: Sanitize string inputs before update
    if (input.firstName) teamMember.firstName = SecurityUtils.sanitizeInput(input.firstName);
    if (input.lastName) teamMember.lastName = SecurityUtils.sanitizeInput(input.lastName);
    if (input.role) teamMember.role = input.role;
    if (input.specializations) teamMember.specializations = input.specializations;
    if (input.permissions) teamMember.permissions = input.permissions;
    if (input.isActive !== undefined) teamMember.isActive = input.isActive;

    await teamMember.save();

    return {
      id: teamMember._id.toString(),
      tenantId: teamMember.tenantId.toString(),
      email: teamMember.email,
      firstName: teamMember.firstName,
      lastName: teamMember.lastName,
      role: teamMember.role,
      specializations: teamMember.specializations,
      permissions: teamMember.permissions,
      isActive: teamMember.isActive,
      lastLogin: teamMember.lastLogin,
      createdAt: teamMember.createdAt,
      updatedAt: teamMember.updatedAt
    };
  }

  /**
   * Delete team member (soft delete)
   * DATA INTEGRITY FIX: Prevent deletion if team member has assigned clients
   */
  static async deleteTeamMember(tenantId: string, teamMemberId: string): Promise<boolean> {
    const teamMember = await TenantTeamMember.findOne({
      _id: teamMemberId,
      tenantId,
      deletedAt: null
    });

    if (!teamMember) {
      return false;
    }

    // DATA INTEGRITY FIX: Check if team member has assigned clients
    const assignedClients = await User.countDocuments({
      tenantId,
      assignedTo: teamMemberId,
      deletedAt: null
    });

    if (assignedClients > 0) {
      throw new Error(
        `Cannot delete team member with ${assignedClients} assigned client${assignedClients > 1 ? 's' : ''}. Please reassign client${assignedClients > 1 ? 's' : ''} first.`
      );
    }

    // Soft delete
    teamMember.deletedAt = new Date();
    await teamMember.save();

    return true;
  }

  /**
   * Get all clients for a tenant
   */
  static async getClients(tenantId: string): Promise<ClientResponse[]> {
    const clients = await User.find({ 
      tenantId, 
      deletedAt: null 
    })
      .populate<{ assignedTo: { _id: unknown; firstName: string; lastName: string; email: string } | null }>('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    return clients.map(client => ({
      id: client._id.toString(),
      tenantId: client.tenantId.toString(),
      assignedTo: client.assignedTo ? String(client.assignedTo._id) : undefined,
      assignedToName: client.assignedTo 
        ? `${client.assignedTo.firstName} ${client.assignedTo.lastName}` 
        : undefined,
      email: client.email,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.profile?.phone,
      dateOfBirth: client.profile?.dateOfBirth ? String(client.profile.dateOfBirth) : undefined,
      nationality: client.profile?.nationality,
      applicationType: client.applicationType,
      status: client.status,
      emailVerified: client.emailVerified,
      applicationStatus: client.application.status,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    }));
  }

  /**
   * Create new client
   */
  static async createClient(
    tenantId: string,
    input: CreateClientInput
  ): Promise<ClientResponse> {
    // Check if tenant exists and is active
    const validatedTenantId2 = ValidationUtils.validateObjectId(tenantId, 'Tenant ID');
    const tenant = await Tenant.findById(validatedTenantId2);
    if (!tenant || tenant.deletedAt) {
      throw new Error('Tenant not found');
    }

    // SECURITY FIX: Check if tenant status is active
    if (tenant.status !== 'active') {
      throw new Error('Tenant account is not active. Please contact support.');
    }

    // Check if client limit is reached
    const currentCount = await User.countDocuments({ 
      tenantId, 
      deletedAt: null 
    });

    if (!tenant.canAddClient(currentCount)) {
      throw new Error('Client limit reached for this tenant');
    }

    // Check if email already exists in this tenant
    const existingClient = await User.findOne({
      tenantId,
      email: input.email.toLowerCase(),
      deletedAt: null
    });

    if (existingClient) {
      throw new Error('Client with this email already exists in your organization');
    }

    // If assignedTo is provided, verify the team member exists and is active
    if (input.assignedTo) {
      const teamMember = await TenantTeamMember.findOne({
        _id: input.assignedTo,
        tenantId,
        deletedAt: null
      });

      if (!teamMember) {
        throw new Error('Assigned team member not found');
      }

      // SECURITY FIX: Check if team member is active
      if (!teamMember.isActive) {
        throw new Error('Cannot assign client to inactive team member');
      }
    }

    // SECURITY FIX: Sanitize string inputs
    const sanitizedFirstName = SecurityUtils.sanitizeInput(input.firstName);
    const sanitizedLastName = SecurityUtils.sanitizeInput(input.lastName);
    const sanitizedPhone = input.phone ? SecurityUtils.sanitizeInput(input.phone) : undefined;
    const sanitizedNationality = input.nationality ? SecurityUtils.sanitizeInput(input.nationality) : undefined;

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, config.BCRYPT_SALT_ROUNDS);

    // Create client
    const client: HydratedDocument<IUser> = await User.create({
      tenantId,
      assignedTo: input.assignedTo,
      email: input.email.toLowerCase(),
      password: hashedPassword,
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      applicationType: input.applicationType,
      status: 'pending',
      emailVerified: false,
      loginAttempts: 0,
      profile: {
        phone: sanitizedPhone,
        dateOfBirth: input.dateOfBirth,
        nationality: sanitizedNationality
      },
      application: {
        type: input.applicationType,
        status: 'draft',
        documents: [],
        priority: 'medium'
      },
      preferences: {
        theme: 'system',
        notifications: {
          email: true,
          push: false,
          sms: false
        }
      }
    });

    return {
      id: client._id.toString(),
      tenantId: client.tenantId.toString(),
      assignedTo: client.assignedTo?.toString(),
      email: client.email,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.profile?.phone,
      dateOfBirth: client.profile?.dateOfBirth ? String(client.profile.dateOfBirth) : undefined,
      nationality: client.profile?.nationality,
      applicationType: client.applicationType,
      status: client.status,
      emailVerified: client.emailVerified,
      applicationStatus: client.application.status,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    };
  }

  /**
   * Get tenant analytics
   * PERFORMANCE FIX: Optimize queries with Promise.all
   */
  static async getTenantAnalytics(tenantId: string): Promise<{
    totalTeamMembers: number;
    activeTeamMembers: number;
    totalClients: number;
    activeClients: number;
    clientsByType: Record<string, number>;
    clientsByStatus: Record<string, number>;
  }> {
    // PERFORMANCE FIX: Execute all queries in parallel
    const [
      totalTeamMembers,
      activeTeamMembers,
      totalClients,
      activeClients,
      clientsByTypeResult,
      clientsByStatusResult
    ] = await Promise.all([
      TenantTeamMember.countDocuments({ tenantId, deletedAt: null }),
      TenantTeamMember.countDocuments({ tenantId, isActive: true, deletedAt: null }),
      User.countDocuments({ tenantId, deletedAt: null }),
      User.countDocuments({ tenantId, status: 'active', deletedAt: null }),
      // Clients by application type
      User.aggregate([
        { $match: { tenantId, deletedAt: null } },
        { $group: { _id: '$applicationType', count: { $sum: 1 } } }
      ]),
      // Clients by status
      User.aggregate([
        { $match: { tenantId, deletedAt: null } },
        { $group: { _id: '$application.status', count: { $sum: 1 } } }
      ])
    ]);

    const clientsByType: Record<string, number> = {};
    clientsByTypeResult.forEach((item: { _id: string; count: number }) => {
      clientsByType[item._id] = item.count;
    });

    const clientsByStatus: Record<string, number> = {};
    clientsByStatusResult.forEach((item: { _id: string; count: number }) => {
      clientsByStatus[item._id] = item.count;
    });

    return {
      totalTeamMembers,
      activeTeamMembers,
      totalClients,
      activeClients,
      clientsByType,
      clientsByStatus
    };
  }
}
