/**
 * Super Admin Service
 * Business logic for tenant management
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 9: TypeScript strict (no 'any')
 * - Rule 10: Multi-tenant isolation (super admin bypasses)
 * - Rule 12: Validate ALL external data
 */

import bcrypt from 'bcryptjs';
import { Tenant, ITenant } from '../../models/tenant.model';
import { TenantTeamMember } from '../../models/tenant-team-member.model';
import { User } from '../../models/user.model';
import { config } from '../../config/env.config';
import { HydratedDocument } from 'mongoose';
import { SecurityUtils } from '../../utils/auth.utils';
import { ValidationUtils } from '../../utils/validation.utils';

/**
 * Create Tenant Input Interface
 */
export interface CreateTenantInput {
  name: string;
  domain: string;
  subdomain?: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  plan?: 'free' | 'basic' | 'premium' | 'enterprise';
  maxTeamMembers?: number;
  maxClients?: number;
  features?: {
    visitorVisa?: boolean;
    studyVisa?: boolean;
    workPermit?: boolean;
    permanentResidence?: boolean;
    familySponsorship?: boolean;
    businessImmigration?: boolean;
  };
  metadata?: {
    rcicNumber?: string;
    businessAddress?: string;
    phone?: string;
  };
}

/**
 * Update Tenant Input Interface
 */
export interface UpdateTenantInput {
  name?: string;
  domain?: string;
  subdomain?: string;
  status?: 'active' | 'inactive' | 'suspended';
  plan?: 'free' | 'basic' | 'premium' | 'enterprise';
  adminFirstName?: string;
  adminLastName?: string;
  maxTeamMembers?: number;
  maxClients?: number;
  features?: {
    visitorVisa?: boolean;
    studyVisa?: boolean;
    workPermit?: boolean;
    permanentResidence?: boolean;
    familySponsorship?: boolean;
    businessImmigration?: boolean;
  };
  metadata?: {
    rcicNumber?: string;
    businessAddress?: string;
    phone?: string;
  };
}

/**
 * Tenant Response Interface
 */
export interface TenantResponse {
  id: string;
  name: string;
  domain: string;
  subdomain?: string;
  status: string;
  plan: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminLastLogin?: Date;
  maxTeamMembers: number;
  maxClients: number;
  currentTeamMembers: number;
  currentClients: number;
  features: {
    visitorVisa: boolean;
    studyVisa: boolean;
    workPermit: boolean;
    permanentResidence: boolean;
    familySponsorship: boolean;
    businessImmigration: boolean;
  };
  metadata?: {
    rcicNumber?: string;
    businessAddress?: string;
    phone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Super Admin Service
 */
export class SuperAdminService {
  /**
   * Get all tenants
   * FIXED: Optimized to use aggregation instead of N+1 queries
   */
  static async getAllTenants(): Promise<TenantResponse[]> {
    const tenants = await Tenant.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .lean();

    // PERFORMANCE FIX: Use aggregation pipelines instead of N+1 queries
    // Single query for all team member counts
    const teamMemberCounts = await TenantTeamMember.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$tenantId', count: { $sum: 1 } } }
    ]);

    // Single query for all client counts
    const clientCounts = await User.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$tenantId', count: { $sum: 1 } } }
    ]);

    // Create lookup maps for O(1) access
    const teamCountMap = new Map(
      teamMemberCounts.map((item: { _id: unknown; count: number }) => [
        String(item._id),
        item.count
      ])
    );
    
    const clientCountMap = new Map(
      clientCounts.map((item: { _id: unknown; count: number }) => [
        String(item._id),
        item.count
      ])
    );

    // Map results with counts from lookup maps
    return tenants.map(tenant => ({
      id: tenant._id.toString(),
      name: tenant.name,
      domain: tenant.domain,
      subdomain: tenant.subdomain,
      status: tenant.status,
      plan: tenant.plan,
      adminEmail: tenant.adminEmail,
      adminFirstName: tenant.adminFirstName,
      adminLastName: tenant.adminLastName,
      adminLastLogin: tenant.adminLastLogin,
      maxTeamMembers: tenant.settings.maxTeamMembers,
      maxClients: tenant.settings.maxClients,
      currentTeamMembers: teamCountMap.get(tenant._id.toString()) || 0,
      currentClients: clientCountMap.get(tenant._id.toString()) || 0,
      features: tenant.subscription.features,
      metadata: tenant.metadata,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt
    }));
  }

  /**
   * Get tenant by ID
   * PERFORMANCE FIX: Use Promise.all for parallel count queries
   */
  static async getTenantById(tenantId: string): Promise<TenantResponse | null> {
    const validatedTenantId = ValidationUtils.validateObjectId(tenantId, 'Tenant ID');
    const tenant = await Tenant.findById(validatedTenantId).lean();

    if (!tenant || tenant.deletedAt) {
      return null;
    }

    // PERFORMANCE FIX: Execute count queries in parallel
    const [teamMemberCount, clientCount] = await Promise.all([
      TenantTeamMember.countDocuments({
        tenantId: tenant._id,
        deletedAt: null
      }),
      User.countDocuments({
        tenantId: tenant._id,
        deletedAt: null
      })
    ]);

    return {
      id: tenant._id.toString(),
      name: tenant.name,
      domain: tenant.domain,
      subdomain: tenant.subdomain,
      status: tenant.status,
      plan: tenant.plan,
      adminEmail: tenant.adminEmail,
      adminFirstName: tenant.adminFirstName,
      adminLastName: tenant.adminLastName,
      adminLastLogin: tenant.adminLastLogin,
      maxTeamMembers: tenant.settings.maxTeamMembers,
      maxClients: tenant.settings.maxClients,
      currentTeamMembers: teamMemberCount,
      currentClients: clientCount,
      features: tenant.subscription.features,
      metadata: tenant.metadata,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt
    };
  }

  /**
   * Create new tenant
   */
  static async createTenant(input: CreateTenantInput): Promise<TenantResponse> {
    // Check if tenant with domain already exists
    const existingTenant = await Tenant.findOne({
      $or: [
        { domain: input.domain },
        { adminEmail: input.adminEmail.toLowerCase() }
      ],
      deletedAt: null
    });

    if (existingTenant) {
      if (existingTenant.domain === input.domain) {
        throw new Error('Tenant with this domain already exists');
      }
      if (existingTenant.adminEmail === input.adminEmail.toLowerCase()) {
        throw new Error('Tenant with this admin email already exists');
      }
    }

    // SECURITY FIX: Sanitize all string inputs
    const sanitizedName = SecurityUtils.sanitizeInput(input.name);
    const sanitizedDomain = SecurityUtils.sanitizeInput(input.domain.toLowerCase());
    const sanitizedSubdomain = input.subdomain ? SecurityUtils.sanitizeInput(input.subdomain.toLowerCase()) : undefined;
    const sanitizedAdminFirstName = SecurityUtils.sanitizeInput(input.adminFirstName);
    const sanitizedAdminLastName = SecurityUtils.sanitizeInput(input.adminLastName);

    // Hash admin password
    const hashedPassword = await bcrypt.hash(input.adminPassword, config.BCRYPT_SALT_ROUNDS);

    // Create tenant
    const tenant: HydratedDocument<ITenant> = await Tenant.create({
      name: sanitizedName,
      domain: sanitizedDomain,
      subdomain: sanitizedSubdomain,
      status: 'active',
      plan: input.plan || 'basic',
      adminEmail: input.adminEmail.toLowerCase(),
      adminPassword: hashedPassword,
      adminFirstName: sanitizedAdminFirstName,
      adminLastName: sanitizedAdminLastName,
      settings: {
        maxTeamMembers: input.maxTeamMembers || 5,
        maxClients: input.maxClients || 100,
        maxStorage: 1024, // 1GB default
        features: [],
        allowSelfRegistration: false,
        requireEmailVerification: true,
        branding: {}
      },
      subscription: {
        plan: input.plan || 'basic',
        maxTeamMembers: input.maxTeamMembers || 5,
        maxClients: input.maxClients || 100,
        features: {
          visitorVisa: input.features?.visitorVisa ?? true,
          studyVisa: input.features?.studyVisa ?? true,
          workPermit: input.features?.workPermit ?? true,
          permanentResidence: input.features?.permanentResidence ?? true,
          familySponsorship: input.features?.familySponsorship ?? true,
          businessImmigration: input.features?.businessImmigration ?? false
        }
      },
      metadata: input.metadata || {}
    });

    return {
      id: tenant._id.toString(),
      name: tenant.name,
      domain: tenant.domain,
      subdomain: tenant.subdomain,
      status: tenant.status,
      plan: tenant.plan,
      adminEmail: tenant.adminEmail,
      adminFirstName: tenant.adminFirstName,
      adminLastName: tenant.adminLastName,
      maxTeamMembers: tenant.settings.maxTeamMembers,
      maxClients: tenant.settings.maxClients,
      currentTeamMembers: 0,
      currentClients: 0,
      features: tenant.subscription.features,
      metadata: tenant.metadata,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt
    };
  }

  /**
   * Update tenant
   */
  static async updateTenant(
    tenantId: string,
    input: UpdateTenantInput
  ): Promise<TenantResponse | null> {
    const validatedTenantId = ValidationUtils.validateObjectId(tenantId, 'Tenant ID');
    const tenant = await Tenant.findById(validatedTenantId);

    if (!tenant || tenant.deletedAt) {
      return null;
    }

    // SECURITY FIX: Sanitize string inputs before update
    if (input.name) tenant.name = SecurityUtils.sanitizeInput(input.name);
    if (input.domain) tenant.domain = SecurityUtils.sanitizeInput(input.domain.toLowerCase());
    if (input.subdomain !== undefined) {
      tenant.subdomain = input.subdomain ? SecurityUtils.sanitizeInput(input.subdomain.toLowerCase()) : undefined;
    }
    if (input.status) tenant.status = input.status;
    if (input.plan) {
      tenant.plan = input.plan;
      tenant.subscription.plan = input.plan;
    }
    if (input.adminFirstName) tenant.adminFirstName = SecurityUtils.sanitizeInput(input.adminFirstName);
    if (input.adminLastName) tenant.adminLastName = SecurityUtils.sanitizeInput(input.adminLastName);

    // Update settings
    if (input.maxTeamMembers !== undefined) {
      tenant.settings.maxTeamMembers = input.maxTeamMembers;
      tenant.subscription.maxTeamMembers = input.maxTeamMembers;
    }
    if (input.maxClients !== undefined) {
      tenant.settings.maxClients = input.maxClients;
      tenant.subscription.maxClients = input.maxClients;
    }

    // Update features
    if (input.features) {
      tenant.subscription.features = {
        ...tenant.subscription.features,
        ...input.features
      };
    }

    // Update metadata
    if (input.metadata) {
      tenant.metadata = {
        ...tenant.metadata,
        ...input.metadata
      };
    }

    await tenant.save();

    const teamMemberCount = await TenantTeamMember.countDocuments({
      tenantId: tenant._id,
      deletedAt: null
    });

    const clientCount = await User.countDocuments({
      tenantId: tenant._id,
      deletedAt: null
    });

    return {
      id: tenant._id.toString(),
      name: tenant.name,
      domain: tenant.domain,
      subdomain: tenant.subdomain,
      status: tenant.status,
      plan: tenant.plan,
      adminEmail: tenant.adminEmail,
      adminFirstName: tenant.adminFirstName,
      adminLastName: tenant.adminLastName,
      adminLastLogin: tenant.adminLastLogin,
      maxTeamMembers: tenant.settings.maxTeamMembers,
      maxClients: tenant.settings.maxClients,
      currentTeamMembers: teamMemberCount,
      currentClients: clientCount,
      features: tenant.subscription.features,
      metadata: tenant.metadata,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt
    };
  }

  /**
   * Delete tenant (soft delete)
   * DATA INTEGRITY FIX: Prevent deletion if tenant has existing data
   */
  static async deleteTenant(tenantId: string): Promise<boolean> {
    const validatedTenantId = ValidationUtils.validateObjectId(tenantId, 'Tenant ID');
    const tenant = await Tenant.findById(validatedTenantId);

    if (!tenant || tenant.deletedAt) {
      return false;
    }

    // DATA INTEGRITY FIX: Check if tenant has any team members or clients
    const teamMemberCount = await TenantTeamMember.countDocuments({ 
      tenantId, 
      deletedAt: null 
    });
    
    const clientCount = await User.countDocuments({ 
      tenantId, 
      deletedAt: null 
    });

    if (teamMemberCount > 0 || clientCount > 0) {
      throw new Error(
        `Cannot delete tenant with existing data. Please delete all team members (${teamMemberCount}) and clients (${clientCount}) first.`
      );
    }

    // Soft delete the tenant
    tenant.deletedAt = new Date();
    await tenant.save();

    return true;
  }

  /**
   * Get system analytics
   */
  static async getSystemAnalytics(): Promise<{
    totalTenants: number;
    activeTenants: number;
    totalTeamMembers: number;
    totalClients: number;
    tenantsByPlan: Record<string, number>;
  }> {
    const totalTenants = await Tenant.countDocuments({ deletedAt: null });
    const activeTenants = await Tenant.countDocuments({ status: 'active', deletedAt: null });
    const totalTeamMembers = await TenantTeamMember.countDocuments({ deletedAt: null });
    const totalClients = await User.countDocuments({ deletedAt: null });

    const tenantsByPlan = await Tenant.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$plan', count: { $sum: 1 } } }
    ]);

    const planCounts: Record<string, number> = {};
    tenantsByPlan.forEach((item: { _id: string; count: number }) => {
      planCounts[item._id] = item.count;
    });

    return {
      totalTenants,
      activeTenants,
      totalTeamMembers,
      totalClients,
      tenantsByPlan: planCounts
    };
  }

  /**
   * Get system health
   */
  static async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    database: 'connected' | 'disconnected';
    uptime: number;
  }> {
    // Check database connection
    let dbStatus: 'connected' | 'disconnected' = 'connected';
    try {
      await Tenant.findOne().limit(1);
    } catch {
      dbStatus = 'disconnected';
    }

    return {
      status: dbStatus === 'connected' ? 'healthy' : 'down',
      database: dbStatus,
      uptime: process.uptime()
    };
  }
}
