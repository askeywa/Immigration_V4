/**
 * Subscription Plan Service
 * API calls for subscription plan management
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
 * Paginated Response Interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Subscription Plan Data Interface
 */
export interface SubscriptionPlanData {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricing: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  limits: {
    maxTeamMembers: number;
    maxClients: number;
    maxStorage: number;
    apiCallsPerMonth: number;
    documentUploadsPerMonth: number;
  };
  features: {
    visitorVisa: boolean;
    studyVisa: boolean;
    workPermit: boolean;
    permanentResidence: boolean;
    familySponsorship: boolean;
    businessImmigration: boolean;
    customBranding: boolean;
    whiteLabel: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    advancedAnalytics: boolean;
    customIntegrations: boolean;
  };
  status: string;
  isPopular: boolean;
  sortOrder: number;
  trialDays: number;
  tenantsUsingPlan: number;
  monthlyPriceFormatted: string;
  yearlyPriceFormatted: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create Subscription Plan Input
 */
export interface CreateSubscriptionPlanInput {
  name: string;
  slug?: string;
  description: string;
  pricing: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  limits: {
    maxTeamMembers: number;
    maxClients: number;
    maxStorage: number;
    apiCallsPerMonth: number;
    documentUploadsPerMonth: number;
  };
  features?: {
    visitorVisa?: boolean;
    studyVisa?: boolean;
    workPermit?: boolean;
    permanentResidence?: boolean;
    familySponsorship?: boolean;
    businessImmigration?: boolean;
    customBranding?: boolean;
    whiteLabel?: boolean;
    prioritySupport?: boolean;
    apiAccess?: boolean;
    advancedAnalytics?: boolean;
    customIntegrations?: boolean;
  };
  status?: 'active' | 'inactive' | 'archived';
  isPopular?: boolean;
  sortOrder?: number;
  trialDays?: number;
}

/**
 * Update Subscription Plan Input
 */
export interface UpdateSubscriptionPlanInput {
  name?: string;
  slug?: string;
  description?: string;
  pricing?: {
    monthly?: number;
    yearly?: number;
    currency?: string;
  };
  limits?: {
    maxTeamMembers?: number;
    maxClients?: number;
    maxStorage?: number;
    apiCallsPerMonth?: number;
    documentUploadsPerMonth?: number;
  };
  features?: {
    visitorVisa?: boolean;
    studyVisa?: boolean;
    workPermit?: boolean;
    permanentResidence?: boolean;
    familySponsorship?: boolean;
    businessImmigration?: boolean;
    customBranding?: boolean;
    whiteLabel?: boolean;
    prioritySupport?: boolean;
    apiAccess?: boolean;
    advancedAnalytics?: boolean;
    customIntegrations?: boolean;
  };
  status?: 'active' | 'inactive' | 'archived';
  isPopular?: boolean;
  sortOrder?: number;
  trialDays?: number;
}

/**
 * Subscription Plan Service
 */
export class SubscriptionPlanService {
  /**
   * Get all subscription plans with optional pagination
   * @param page Page number (default: 1)
   * @param limit Items per page (default: 20)
   */
  static async getPlans(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<SubscriptionPlanData>>> {
    try {
      const response = await apiClient.get<PaginatedResponse<SubscriptionPlanData>>(
        `/api/v1/super-admin/subscription-plans?page=${page}&limit=${limit}`
      );

      // SECURITY FIX: Sanitize text fields from API response
      if (response.data && response.success) {
        response.data.data = response.data.data.map(plan => ({
          ...plan,
          name: DOMPurify.sanitize(plan.name),
          slug: DOMPurify.sanitize(plan.slug),
          description: DOMPurify.sanitize(plan.description)
        }));
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get active subscription plans only with optional pagination
   * @param page Page number (default: 1)
   * @param limit Items per page (default: 20)
   */
  static async getActivePlans(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<SubscriptionPlanData>>> {
    try {
      const response = await apiClient.get<PaginatedResponse<SubscriptionPlanData>>(
        `/api/v1/super-admin/subscription-plans/active?page=${page}&limit=${limit}`
      );

      // SECURITY FIX: Sanitize text fields from API response
      if (response.data && response.success) {
        response.data.data = response.data.data.map(plan => ({
          ...plan,
          name: DOMPurify.sanitize(plan.name),
          slug: DOMPurify.sanitize(plan.slug),
          description: DOMPurify.sanitize(plan.description)
        }));
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get subscription plan by ID
   */
  static async getPlan(planId: string): Promise<ApiResponse<{ plan: SubscriptionPlanData }>> {
    try {
      const response = await apiClient.get<{ plan: SubscriptionPlanData }>(
        `/api/v1/super-admin/subscription-plans/${planId}`
      );

      // SECURITY FIX: Sanitize text fields from API response
      if (response.data && response.success) {
        response.data.plan = {
          ...response.data.plan,
          name: DOMPurify.sanitize(response.data.plan.name),
          slug: DOMPurify.sanitize(response.data.plan.slug),
          description: DOMPurify.sanitize(response.data.plan.description)
        };
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new subscription plan
   */
  static async createPlan(
    input: CreateSubscriptionPlanInput
  ): Promise<ApiResponse<{ plan: SubscriptionPlanData; message: string }>> {
    try {
      // SECURITY FIX: Sanitize input before sending
      const sanitizedInput: CreateSubscriptionPlanInput = {
        ...input,
        name: DOMPurify.sanitize(input.name),
        slug: input.slug ? DOMPurify.sanitize(input.slug) : undefined,
        description: DOMPurify.sanitize(input.description)
      };

      const response = await apiClient.post<{ plan: SubscriptionPlanData; message: string }>(
        '/api/v1/super-admin/subscription-plans',
        sanitizedInput
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update subscription plan
   */
  static async updatePlan(
    planId: string,
    input: UpdateSubscriptionPlanInput
  ): Promise<ApiResponse<{ plan: SubscriptionPlanData; message: string }>> {
    try {
      // SECURITY FIX: Sanitize input before sending
      const sanitizedInput: UpdateSubscriptionPlanInput = {
        ...input
      };

      if (input.name) {
        sanitizedInput.name = DOMPurify.sanitize(input.name);
      }
      if (input.slug) {
        sanitizedInput.slug = DOMPurify.sanitize(input.slug);
      }
      if (input.description) {
        sanitizedInput.description = DOMPurify.sanitize(input.description);
      }

      const response = await apiClient.put<{ plan: SubscriptionPlanData; message: string }>(
        `/api/v1/super-admin/subscription-plans/${planId}`,
        sanitizedInput
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete subscription plan
   */
  static async deletePlan(planId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.delete<{ message: string }>(
        `/api/v1/super-admin/subscription-plans/${planId}`
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update plan status
   */
  static async updatePlanStatus(
    planId: string,
    status: 'active' | 'inactive' | 'archived'
  ): Promise<ApiResponse<{ plan: SubscriptionPlanData; message: string }>> {
    try {
      const response = await apiClient.patch<{ plan: SubscriptionPlanData; message: string }>(
        `/api/v1/super-admin/subscription-plans/${planId}/status`,
        { status }
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reorder subscription plans
   */
  static async reorderPlans(planIds: string[]): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.put<{ message: string }>(
        '/api/v1/super-admin/subscription-plans/reorder',
        { planIds }
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a slug is available
   */
  static async checkSlugAvailability(slug: string): Promise<{ available: boolean }> {
    try {
      const response = await apiClient.get<{ available: boolean }>(
        `/api/v1/super-admin/subscription-plans/check-slug/${slug}`
      );
      return response.data!;
    } catch (error) {
      // If endpoint doesn't exist, assume slug is available
      return { available: true };
    }
  }
}

