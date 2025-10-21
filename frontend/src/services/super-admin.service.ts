/**
 * Super Admin Service
 * API calls for tenant management
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 3: XSS prevention (DOMPurify sanitization)
 * - Rule 5: API timeouts (via apiClient)
 * - Rule 9: TypeScript strict (no 'any')
 */

import DOMPurify from 'dompurify';
import { apiClient } from './api-client';
import { ApiResponse } from '../types/api.types';

/**
 * Tenant Data Interface
 */
export interface TenantData {
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
 * Create Tenant Input
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
 * Update Tenant Input
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
 * System Analytics Interface
 */
export interface SystemAnalytics {
  totalTenants: number;
  activeTenants: number;
  totalTeamMembers: number;
  totalClients: number;
  tenantsByPlan: Record<string, number>;
}

/**
 * Super Admin Service
 */
export class SuperAdminService {
  /**
   * Get all tenants
   */
  static async getTenants(): Promise<ApiResponse<{ tenants: TenantData[]; count: number }>> {
    return apiClient.get<{ tenants: TenantData[]; count: number }>('/api/v1/super-admin/tenants');
  }

  /**
   * Get single tenant
   */
  static async getTenant(tenantId: string): Promise<ApiResponse<{ tenant: TenantData }>> {
    // XSS Prevention - CORE-CRITICAL Rule 3
    const sanitizedId = DOMPurify.sanitize(tenantId);
    return apiClient.get<{ tenant: TenantData }>(`/api/v1/super-admin/tenants/${sanitizedId}`);
  }

  /**
   * Create new tenant
   */
  static async createTenant(input: CreateTenantInput): Promise<ApiResponse<{ tenant: TenantData; message: string }>> {
    // XSS Prevention - CORE-CRITICAL Rule 3
    const sanitizedInput = {
      name: DOMPurify.sanitize(input.name.trim()),
      domain: DOMPurify.sanitize(input.domain.trim().toLowerCase()),
      subdomain: input.subdomain ? DOMPurify.sanitize(input.subdomain.trim().toLowerCase()) : undefined,
      adminEmail: DOMPurify.sanitize(input.adminEmail.trim().toLowerCase()),
      adminPassword: input.adminPassword, // Don't sanitize password
      adminFirstName: DOMPurify.sanitize(input.adminFirstName.trim()),
      adminLastName: DOMPurify.sanitize(input.adminLastName.trim()),
      plan: input.plan,
      maxTeamMembers: input.maxTeamMembers,
      maxClients: input.maxClients,
      features: input.features,
      metadata: input.metadata ? {
        rcicNumber: input.metadata.rcicNumber ? DOMPurify.sanitize(input.metadata.rcicNumber) : undefined,
        businessAddress: input.metadata.businessAddress ? DOMPurify.sanitize(input.metadata.businessAddress) : undefined,
        phone: input.metadata.phone ? DOMPurify.sanitize(input.metadata.phone) : undefined
      } : undefined
    };

    return apiClient.post<{ tenant: TenantData; message: string }>(
      '/api/v1/super-admin/tenants',
      sanitizedInput
    );
  }

  /**
   * Update tenant
   */
  static async updateTenant(
    tenantId: string,
    input: UpdateTenantInput
  ): Promise<ApiResponse<{ tenant: TenantData; message: string }>> {
    // XSS Prevention - CORE-CRITICAL Rule 3
    const sanitizedId = DOMPurify.sanitize(tenantId);
    const sanitizedInput: UpdateTenantInput = {};

    if (input.name) sanitizedInput.name = DOMPurify.sanitize(input.name.trim());
    if (input.domain) sanitizedInput.domain = DOMPurify.sanitize(input.domain.trim().toLowerCase());
    if (input.subdomain) sanitizedInput.subdomain = DOMPurify.sanitize(input.subdomain.trim().toLowerCase());
    if (input.status) sanitizedInput.status = input.status;
    if (input.plan) sanitizedInput.plan = input.plan;
    if (input.adminFirstName) sanitizedInput.adminFirstName = DOMPurify.sanitize(input.adminFirstName.trim());
    if (input.adminLastName) sanitizedInput.adminLastName = DOMPurify.sanitize(input.adminLastName.trim());
    if (input.maxTeamMembers !== undefined) sanitizedInput.maxTeamMembers = input.maxTeamMembers;
    if (input.maxClients !== undefined) sanitizedInput.maxClients = input.maxClients;
    if (input.features) sanitizedInput.features = input.features;
    if (input.metadata) {
      sanitizedInput.metadata = {
        rcicNumber: input.metadata.rcicNumber ? DOMPurify.sanitize(input.metadata.rcicNumber) : undefined,
        businessAddress: input.metadata.businessAddress ? DOMPurify.sanitize(input.metadata.businessAddress) : undefined,
        phone: input.metadata.phone ? DOMPurify.sanitize(input.metadata.phone) : undefined
      };
    }

    return apiClient.put<{ tenant: TenantData; message: string }>(
      `/api/v1/super-admin/tenants/${sanitizedId}`,
      sanitizedInput
    );
  }

  /**
   * Delete tenant
   */
  static async deleteTenant(tenantId: string): Promise<ApiResponse<{ message: string }>> {
    // XSS Prevention - CORE-CRITICAL Rule 3
    const sanitizedId = DOMPurify.sanitize(tenantId);
    return apiClient.delete<{ message: string }>(`/api/v1/super-admin/tenants/${sanitizedId}`);
  }

  /**
   * Get system analytics
   */
  static async getAnalytics(): Promise<ApiResponse<{ analytics: SystemAnalytics }>> {
    return apiClient.get<{ analytics: SystemAnalytics }>('/api/v1/super-admin/analytics');
  }

  /**
   * Get system health
   */
  static async getSystemHealth(): Promise<ApiResponse<{
    health: {
      status: 'healthy' | 'degraded' | 'down';
      database: 'connected' | 'disconnected';
      uptime: number;
    }
  }>> {
    return apiClient.get<{
      health: {
        status: 'healthy' | 'degraded' | 'down';
        database: 'connected' | 'disconnected';
        uptime: number;
      }
    }>('/api/v1/super-admin/system-health');
  }
}
