/**
 * Tenant Admin Service
 * API calls for team member and client management
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 3: XSS prevention (DOMPurify sanitization)
 * - Rule 5: API timeouts (via apiClient)
 * - Rule 9: TypeScript strict (no 'any')
 * - Rule 10: Multi-tenant isolation
 */

import DOMPurify from 'dompurify';
import { apiClient } from './api-client';
import { ApiResponse } from '../types/api.types';

/**
 * Team Member Data Interface
 */
export interface TeamMemberData {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'visa_specialist' | 'work_permit_specialist' | 'case_manager';
  specializations: string[];
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Client Data Interface
 */
export interface ClientData {
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
 * Create Team Member Input
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
 * Create Client Input
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
  assignedTo?: string;
}

/**
 * Tenant Analytics Interface
 */
export interface TenantAnalytics {
  totalTeamMembers: number;
  activeTeamMembers: number;
  totalClients: number;
  activeClients: number;
  clientsByType: Record<string, number>;
  clientsByStatus: Record<string, number>;
}

/**
 * Tenant Admin Service
 */
export class TenantAdminService {
  /**
   * Get all team members
   */
  static async getTeamMembers(): Promise<ApiResponse<{ teamMembers: TeamMemberData[]; count: number }>> {
    return apiClient.get<{ teamMembers: TeamMemberData[]; count: number }>('/api/v1/tenant-admin/team-members');
  }

  /**
   * Create new team member
   */
  static async createTeamMember(input: CreateTeamMemberInput): Promise<ApiResponse<{ teamMember: TeamMemberData; message: string }>> {
    // XSS Prevention - CORE-CRITICAL Rule 3
    const sanitizedInput = {
      email: DOMPurify.sanitize(input.email.trim().toLowerCase()),
      password: input.password, // Don't sanitize password
      firstName: DOMPurify.sanitize(input.firstName.trim()),
      lastName: DOMPurify.sanitize(input.lastName.trim()),
      role: input.role || 'case_manager',
      specializations: input.specializations || [],
      permissions: input.permissions || []
    };

    return apiClient.post<{ teamMember: TeamMemberData; message: string }>(
      '/api/v1/tenant-admin/team-members',
      sanitizedInput
    );
  }

  /**
   * Update team member
   */
  static async updateTeamMember(
    teamMemberId: string,
    input: Partial<CreateTeamMemberInput>
  ): Promise<ApiResponse<{ teamMember: TeamMemberData; message: string }>> {
    // XSS Prevention - CORE-CRITICAL Rule 3
    const sanitizedId = DOMPurify.sanitize(teamMemberId);
    const sanitizedInput: Partial<CreateTeamMemberInput> = {};

    if (input.firstName) sanitizedInput.firstName = DOMPurify.sanitize(input.firstName.trim());
    if (input.lastName) sanitizedInput.lastName = DOMPurify.sanitize(input.lastName.trim());
    if (input.role) sanitizedInput.role = input.role;
    if (input.specializations) sanitizedInput.specializations = input.specializations;
    if (input.permissions) sanitizedInput.permissions = input.permissions;

    return apiClient.put<{ teamMember: TeamMemberData; message: string }>(
      `/api/v1/tenant-admin/team-members/${sanitizedId}`,
      sanitizedInput
    );
  }

  /**
   * Delete team member
   */
  static async deleteTeamMember(teamMemberId: string): Promise<ApiResponse<{ message: string }>> {
    // XSS Prevention - CORE-CRITICAL Rule 3
    const sanitizedId = DOMPurify.sanitize(teamMemberId);
    return apiClient.delete<{ message: string }>(`/api/v1/tenant-admin/team-members/${sanitizedId}`);
  }

  /**
   * Get all clients
   */
  static async getClients(): Promise<ApiResponse<{ clients: ClientData[]; count: number }>> {
    return apiClient.get<{ clients: ClientData[]; count: number }>('/api/v1/tenant-admin/clients');
  }

  /**
   * Create new client
   */
  static async createClient(input: CreateClientInput): Promise<ApiResponse<{ client: ClientData; message: string }>> {
    // XSS Prevention - CORE-CRITICAL Rule 3 & Rule 12: Validate ALL external data
    const sanitizedInput = {
      email: DOMPurify.sanitize(input.email.trim().toLowerCase()),
      password: input.password, // Don't sanitize password
      firstName: DOMPurify.sanitize(input.firstName.trim()),
      lastName: DOMPurify.sanitize(input.lastName.trim()),
      phone: input.phone ? DOMPurify.sanitize(input.phone.trim()) : undefined,
      dateOfBirth: input.dateOfBirth ? DOMPurify.sanitize(input.dateOfBirth) : undefined,
      nationality: input.nationality ? DOMPurify.sanitize(input.nationality.trim()) : undefined,
      applicationType: input.applicationType,
      assignedTo: input.assignedTo ? DOMPurify.sanitize(input.assignedTo) : undefined
    };

    return apiClient.post<{ client: ClientData; message: string }>(
      '/api/v1/tenant-admin/clients',
      sanitizedInput
    );
  }

  /**
   * Get tenant analytics
   */
  static async getAnalytics(): Promise<ApiResponse<{ analytics: TenantAnalytics }>> {
    return apiClient.get<{ analytics: TenantAnalytics }>('/api/v1/tenant-admin/analytics');
  }
}
