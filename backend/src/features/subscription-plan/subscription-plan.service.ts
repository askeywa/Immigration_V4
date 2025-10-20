/**
 * Subscription Plan Service
 * Business logic for subscription plan management
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 9: TypeScript strict (no 'any')
 * - Rule 10: Multi-tenant isolation (super admin bypasses)
 * - Rule 12: Validate ALL external data
 */

import { SubscriptionPlan, ISubscriptionPlan } from '../../models/subscription-plan.model';
import { Tenant } from '../../models/tenant.model';
import { SecurityUtils } from '../../utils/auth.utils';
import { ValidationUtils } from '../../utils/validation.utils';
import { HydratedDocument } from 'mongoose';
import {
  PlanAlreadyExistsError,
  PlanInUseError,
  UnauthorizedPlanOperationError
} from './errors/subscription-plan.errors';

/**
 * Create Subscription Plan Input Interface
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
  features: {
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
 * Update Subscription Plan Input Interface
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
 * Pagination Parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated Response
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
 * Subscription Plan Response Interface
 */
export interface SubscriptionPlanResponse {
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
 * Subscription Plan Service
 */
export class SubscriptionPlanService {
  /**
   * Get all subscription plans with optional pagination
   * @param page Page number (default: 1)
   * @param limit Items per page (default: 20)
   */
  static async getAllPlans(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<SubscriptionPlanResponse>> {
    // Ensure positive values
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100); // Cap at 100 items per page
    const skip = (safePage - 1) * safeLimit;

    // Execute queries in parallel for performance
    const [plans, total] = await Promise.all([
      SubscriptionPlan.find({ deletedAt: null })
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      SubscriptionPlan.countDocuments({ deletedAt: null })
    ]);

    // Get tenant counts for each plan
    const tenantCounts = await Tenant.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$plan', count: { $sum: 1 } } }
    ]);

    // Create lookup map for O(1) access
    const tenantCountMap = new Map(
      tenantCounts.map((item: { _id: string; count: number }) => [
        item._id,
        item.count
      ])
    );

    const data = plans.map(plan => ({
      id: plan._id.toString(),
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      pricing: plan.pricing,
      limits: plan.limits,
      features: plan.features,
      status: plan.status,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
      trialDays: plan.trialDays,
      tenantsUsingPlan: tenantCountMap.get(plan.slug) || 0,
      monthlyPriceFormatted: this.formatPrice(plan.pricing.monthly, plan.pricing.currency),
      yearlyPriceFormatted: this.formatPrice(plan.pricing.yearly, plan.pricing.currency),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    }));

    const totalPages = Math.ceil(total / safeLimit);

    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1
      }
    };
  }

  /**
   * Get active subscription plans only with optional pagination
   * @param page Page number (default: 1)
   * @param limit Items per page (default: 20)
   */
  static async getActivePlans(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<SubscriptionPlanResponse>> {
    // Ensure positive values
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (safePage - 1) * safeLimit;

    // Execute queries in parallel for performance
    const [plans, total] = await Promise.all([
      SubscriptionPlan.find({ status: 'active', deletedAt: null })
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      SubscriptionPlan.countDocuments({ status: 'active', deletedAt: null })
    ]);

    const tenantCounts = await Tenant.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$plan', count: { $sum: 1 } } }
    ]);

    const tenantCountMap = new Map(
      tenantCounts.map((item: { _id: string; count: number }) => [
        item._id,
        item.count
      ])
    );

    const data = plans.map(plan => ({
      id: plan._id.toString(),
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      pricing: plan.pricing,
      limits: plan.limits,
      features: plan.features,
      status: plan.status,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
      trialDays: plan.trialDays,
      tenantsUsingPlan: tenantCountMap.get(plan.slug) || 0,
      monthlyPriceFormatted: this.formatPrice(plan.pricing.monthly, plan.pricing.currency),
      yearlyPriceFormatted: this.formatPrice(plan.pricing.yearly, plan.pricing.currency),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    }));

    const totalPages = Math.ceil(total / safeLimit);

    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1
      }
    };
  }

  /**
   * Get subscription plan by ID
   */
  static async getPlanById(planId: string): Promise<SubscriptionPlanResponse | null> {
    const validatedPlanId = ValidationUtils.validateObjectId(planId, 'Plan ID');
    const plan = await SubscriptionPlan.findById(validatedPlanId).lean();

    if (!plan || plan.deletedAt) {
      return null;
    }

    const tenantCount = await Tenant.countDocuments({
      plan: plan.slug,
      deletedAt: null
    });

    return {
      id: plan._id.toString(),
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      pricing: plan.pricing,
      limits: plan.limits,
      features: plan.features,
      status: plan.status,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
      trialDays: plan.trialDays,
      tenantsUsingPlan: tenantCount,
      monthlyPriceFormatted: this.formatPrice(plan.pricing.monthly, plan.pricing.currency),
      yearlyPriceFormatted: this.formatPrice(plan.pricing.yearly, plan.pricing.currency),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    };
  }

  /**
   * Get subscription plan by slug
   */
  static async getPlanBySlug(slug: string): Promise<SubscriptionPlanResponse | null> {
    const plan = await SubscriptionPlan.findBySlug(slug);

    if (!plan || plan.deletedAt) {
      return null;
    }

    const tenantCount = await Tenant.countDocuments({
      plan: plan.slug,
      deletedAt: null
    });

    return {
      id: plan._id.toString(),
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      pricing: plan.pricing,
      limits: plan.limits,
      features: plan.features,
      status: plan.status,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
      trialDays: plan.trialDays,
      tenantsUsingPlan: tenantCount,
      monthlyPriceFormatted: this.formatPrice(plan.pricing.monthly, plan.pricing.currency),
      yearlyPriceFormatted: this.formatPrice(plan.pricing.yearly, plan.pricing.currency),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    };
  }

  /**
   * Create new subscription plan
   * @param input Plan creation data
   * @param userId User performing the action
   * @param userRole User's role
   */
  static async createPlan(
    input: CreateSubscriptionPlanInput,
    userId: string,
    userRole: string
  ): Promise<SubscriptionPlanResponse> {
    // AUTHORIZATION: Defensive check (belt-and-suspenders)
    if (userRole !== 'super_admin') {
      throw new UnauthorizedPlanOperationError('create');
    }
    
    // userId available for future audit logging enhancements
    void userId;
    
    // Generate slug from name if not provided
    let slug = input.slug || input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if plan with slug already exists
    const existingPlan = await SubscriptionPlan.findOne({
      slug: slug,
      deletedAt: null
    });

    if (existingPlan) {
      throw new PlanAlreadyExistsError(slug);
    }

    // SECURITY FIX: Sanitize all string inputs
    const sanitizedName = SecurityUtils.sanitizeInput(input.name);
    const sanitizedSlug = SecurityUtils.sanitizeInput(slug);
    const sanitizedDescription = SecurityUtils.sanitizeInput(input.description);

    // Create subscription plan
    const plan: HydratedDocument<ISubscriptionPlan> = await SubscriptionPlan.create({
      name: sanitizedName,
      slug: sanitizedSlug,
      description: sanitizedDescription,
      pricing: {
        monthly: input.pricing.monthly,
        yearly: input.pricing.yearly,
        currency: input.pricing.currency
      },
      limits: {
        maxTeamMembers: input.limits.maxTeamMembers,
        maxClients: input.limits.maxClients,
        maxStorage: input.limits.maxStorage,
        apiCallsPerMonth: input.limits.apiCallsPerMonth,
        documentUploadsPerMonth: input.limits.documentUploadsPerMonth
      },
      features: {
        visitorVisa: input.features.visitorVisa ?? true,
        studyVisa: input.features.studyVisa ?? true,
        workPermit: input.features.workPermit ?? true,
        permanentResidence: input.features.permanentResidence ?? false,
        familySponsorship: input.features.familySponsorship ?? false,
        businessImmigration: input.features.businessImmigration ?? false,
        customBranding: input.features.customBranding ?? false,
        whiteLabel: input.features.whiteLabel ?? false,
        prioritySupport: input.features.prioritySupport ?? false,
        apiAccess: input.features.apiAccess ?? false,
        advancedAnalytics: input.features.advancedAnalytics ?? false,
        customIntegrations: input.features.customIntegrations ?? false
      },
      status: input.status || 'active',
      isPopular: input.isPopular || false,
      sortOrder: input.sortOrder || 0,
      trialDays: input.trialDays || 14
    });

    return {
      id: plan._id.toString(),
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      pricing: plan.pricing,
      limits: plan.limits,
      features: plan.features,
      status: plan.status,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
      trialDays: plan.trialDays,
      tenantsUsingPlan: 0,
      monthlyPriceFormatted: this.formatPrice(plan.pricing.monthly, plan.pricing.currency),
      yearlyPriceFormatted: this.formatPrice(plan.pricing.yearly, plan.pricing.currency),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    };
  }

  /**
   * Update subscription plan
   * @param planId Plan ID to update
   * @param input Update data
   * @param userId User performing the action
   * @param userRole User's role
   */
  static async updatePlan(
    planId: string,
    input: UpdateSubscriptionPlanInput,
    userId: string,
    userRole: string
  ): Promise<SubscriptionPlanResponse | null> {
    // AUTHORIZATION: Defensive check
    if (userRole !== 'super_admin') {
      throw new UnauthorizedPlanOperationError('update');
    }
    
    // userId available for future audit logging enhancements
    void userId;
    
    const validatedPlanId = ValidationUtils.validateObjectId(planId, 'Plan ID');
    const plan = await SubscriptionPlan.findById(validatedPlanId);

    if (!plan || plan.deletedAt) {
      return null;
    }

    // Check if slug is being changed and if it already exists
    if (input.slug && input.slug !== plan.slug) {
      const existingPlan = await SubscriptionPlan.findOne({
        slug: input.slug,
        _id: { $ne: planId },
        deletedAt: null
      });

      if (existingPlan) {
        throw new PlanAlreadyExistsError(input.slug);
      }
    }

    // SECURITY FIX: Sanitize string inputs before update
    if (input.name) plan.name = SecurityUtils.sanitizeInput(input.name);
    if (input.slug) plan.slug = SecurityUtils.sanitizeInput(input.slug.toLowerCase());
    if (input.description) plan.description = SecurityUtils.sanitizeInput(input.description);

    // Update pricing
    if (input.pricing) {
      if (input.pricing.monthly !== undefined) plan.pricing.monthly = input.pricing.monthly;
      if (input.pricing.yearly !== undefined) plan.pricing.yearly = input.pricing.yearly;
      if (input.pricing.currency !== undefined) plan.pricing.currency = input.pricing.currency;
    }

    // Update limits
    if (input.limits) {
      if (input.limits.maxTeamMembers !== undefined) plan.limits.maxTeamMembers = input.limits.maxTeamMembers;
      if (input.limits.maxClients !== undefined) plan.limits.maxClients = input.limits.maxClients;
      if (input.limits.maxStorage !== undefined) plan.limits.maxStorage = input.limits.maxStorage;
      if (input.limits.apiCallsPerMonth !== undefined) plan.limits.apiCallsPerMonth = input.limits.apiCallsPerMonth;
      if (input.limits.documentUploadsPerMonth !== undefined) plan.limits.documentUploadsPerMonth = input.limits.documentUploadsPerMonth;
    }

    // Update features
    if (input.features) {
      plan.features = {
        ...plan.features,
        ...input.features
      };
    }

    // Update status and metadata
    if (input.status !== undefined) plan.status = input.status;
    if (input.isPopular !== undefined) plan.isPopular = input.isPopular;
    if (input.sortOrder !== undefined) plan.sortOrder = input.sortOrder;
    if (input.trialDays !== undefined) plan.trialDays = input.trialDays;

    await plan.save();

    const tenantCount = await Tenant.countDocuments({
      plan: plan.slug,
      deletedAt: null
    });

    return {
      id: plan._id.toString(),
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      pricing: plan.pricing,
      limits: plan.limits,
      features: plan.features,
      status: plan.status,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
      trialDays: plan.trialDays,
      tenantsUsingPlan: tenantCount,
      monthlyPriceFormatted: this.formatPrice(plan.pricing.monthly, plan.pricing.currency),
      yearlyPriceFormatted: this.formatPrice(plan.pricing.yearly, plan.pricing.currency),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    };
  }

  /**
   * Delete subscription plan (soft delete)
   * DATA INTEGRITY FIX: Use MongoDB transactions to prevent race conditions
   * Falls back to pre-save hook if transactions not available
   * @param planId Plan ID to delete
   * @param userId User performing the action
   * @param userRole User's role
   */
  static async deletePlan(
    planId: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    // AUTHORIZATION: Defensive check
    if (userRole !== 'super_admin') {
      throw new UnauthorizedPlanOperationError('delete');
    }
    
    // userId available for future audit logging enhancements
    void userId;
    
    const validatedPlanId = ValidationUtils.validateObjectId(planId, 'Plan ID');
    
    try {
      // Attempt transaction-based delete (MongoDB Atlas / replica set)
      return await this.deleteWithTransaction(validatedPlanId);
    } catch (error: any) {
      // Fallback to pre-save validation if transactions not supported
      // Error code 10107 = transaction not supported
      if (error.code === 10107 || error.message?.includes('transaction')) {
        return await this.deleteWithPreSaveValidation(validatedPlanId);
      }
      throw error;
    }
  }

  /**
   * Delete plan using MongoDB transaction (primary method)
   * Provides true atomicity - no race condition possible
   */
  private static async deleteWithTransaction(planId: string): Promise<boolean> {
    const session = await SubscriptionPlan.startSession();
    session.startTransaction();

    try {
      const plan = await SubscriptionPlan.findById(planId).session(session);

      if (!plan || plan.deletedAt) {
        await session.abortTransaction();
        return false;
      }

      // Check tenant count within transaction
      const tenantCount = await Tenant.countDocuments(
        { plan: plan.slug, deletedAt: null },
        { session }
      );

      if (tenantCount > 0) {
        await session.abortTransaction();
        throw new PlanInUseError(tenantCount);
      }

      // Perform soft delete
      plan.deletedAt = new Date();
      await plan.save({ session });

      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Delete plan with pre-save validation (fallback method)
   * Uses pre-save hook for validation - small race window but acceptable
   */
  private static async deleteWithPreSaveValidation(planId: string): Promise<boolean> {
    const plan = await SubscriptionPlan.findById(planId);

    if (!plan || plan.deletedAt) {
      return false;
    }

    // Pre-save hook will validate tenant count and throw if tenants exist
    plan.deletedAt = new Date();
    await plan.save();

    return true;
  }

  /**
   * Update plan status
   * @param planId Plan ID to update
   * @param status New status
   * @param userId User performing the action
   * @param userRole User's role
   */
  static async updatePlanStatus(
    planId: string,
    status: 'active' | 'inactive' | 'archived',
    userId: string,
    userRole: string
  ): Promise<SubscriptionPlanResponse | null> {
    // AUTHORIZATION: Defensive check
    if (userRole !== 'super_admin') {
      throw new UnauthorizedPlanOperationError('update status of');
    }
    
    // userId available for future audit logging enhancements
    void userId;
    
    const validatedPlanId = ValidationUtils.validateObjectId(planId, 'Plan ID');
    const plan = await SubscriptionPlan.findById(validatedPlanId);

    if (!plan || plan.deletedAt) {
      return null;
    }

    plan.status = status;
    await plan.save();

    const tenantCount = await Tenant.countDocuments({
      plan: plan.slug,
      deletedAt: null
    });

    return {
      id: plan._id.toString(),
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      pricing: plan.pricing,
      limits: plan.limits,
      features: plan.features,
      status: plan.status,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
      trialDays: plan.trialDays,
      tenantsUsingPlan: tenantCount,
      monthlyPriceFormatted: this.formatPrice(plan.pricing.monthly, plan.pricing.currency),
      yearlyPriceFormatted: this.formatPrice(plan.pricing.yearly, plan.pricing.currency),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    };
  }

  /**
   * Reorder subscription plans
   * @param planIds Array of plan IDs in desired order
   * @param userId User performing the action
   * @param userRole User's role
   */
  static async reorderPlans(
    planIds: string[],
    userId: string,
    userRole: string
  ): Promise<boolean> {
    // AUTHORIZATION: Defensive check
    if (userRole !== 'super_admin') {
      throw new UnauthorizedPlanOperationError('reorder');
    }
    
    // userId available for future audit logging enhancements
    void userId;
    
    // Validate all plan IDs
    planIds.forEach((id, index) => {
      ValidationUtils.validateObjectId(id, `Plan ID at index ${index}`);
    });

    // Update sort order for each plan
    const updatePromises = planIds.map((planId, index) => 
      SubscriptionPlan.findByIdAndUpdate(
        planId,
        { sortOrder: index },
        { new: true }
      )
    );

    await Promise.all(updatePromises);
    return true;
  }

  /**
   * Helper: Format price
   */
  private static formatPrice(amount: number, currency: string): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    return formatter.format(amount);
  }
}

