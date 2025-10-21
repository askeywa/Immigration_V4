/**
 * Subscription Plan Zod Validation Schemas
 * Input validation for subscription plan management
 * 
 * Following CORE-CRITICAL Rule 12: Validate ALL external data
 */

import { z } from 'zod';
import { schemas } from '../../utils/zod.schemas';

/**
 * Pagination Query Schema
 * Optional page and limit parameters
 */
const paginationQuerySchema = z.object({
  query: z.object({
    page: z.string()
      .optional()
      .transform(val => val ? parseInt(val, 10) : 1)
      .refine(val => val >= 1, 'Page must be >= 1'),
    limit: z.string()
      .optional()
      .transform(val => val ? parseInt(val, 10) : 20)
      .refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
  }).optional()
});

/**
 * Create Subscription Plan Schema
 */
export const createSubscriptionPlanSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Plan name must be at least 2 characters')
      .max(100, 'Plan name must not exceed 100 characters')
      .trim(),
    slug: z.string()
      .min(2, 'Slug must be at least 2 characters')
      .max(50, 'Slug must not exceed 50 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
      .optional(),
    description: z.string()
      .min(10, 'Description must be at least 10 characters')
      .max(500, 'Description must not exceed 500 characters')
      .trim(),
    pricing: z.object({
      monthly: z.number()
        .min(0, 'Monthly price must be non-negative')
        .max(100000, 'Monthly price cannot exceed 100,000'),
      yearly: z.number()
        .min(0, 'Yearly price must be non-negative')
        .max(1000000, 'Yearly price cannot exceed 1,000,000'),
      currency: z.enum(['USD', 'CAD', 'EUR', 'GBP'], {
        errorMap: () => ({ message: 'Currency must be USD, CAD, EUR, or GBP' })
      }).default('USD')
    }),
    limits: z.object({
      maxTeamMembers: z.number()
        .int('Must be an integer')
        .min(1, 'Must allow at least 1 team member')
        .max(1000, 'Cannot exceed 1,000 team members'),
      maxClients: z.number()
        .int('Must be an integer')
        .min(1, 'Must allow at least 1 client')
        .max(100000, 'Cannot exceed 100,000 clients'),
      maxStorage: z.number()
        .int('Must be an integer')
        .min(100, 'Must allow at least 100MB storage')
        .max(10000000, 'Cannot exceed 10TB storage'),
      apiCallsPerMonth: z.number()
        .int('Must be an integer')
        .min(0, 'Must be non-negative')
        .max(10000000, 'Cannot exceed 10,000,000 API calls'),
      documentUploadsPerMonth: z.number()
        .int('Must be an integer')
        .min(0, 'Must be non-negative')
        .max(100000, 'Cannot exceed 100,000 document uploads')
    }),
    features: z.object({
      visitorVisa: z.boolean().default(true),
      studyVisa: z.boolean().default(true),
      workPermit: z.boolean().default(true),
      permanentResidence: z.boolean().default(false),
      familySponsorship: z.boolean().default(false),
      businessImmigration: z.boolean().default(false),
      customBranding: z.boolean().default(false),
      whiteLabel: z.boolean().default(false),
      prioritySupport: z.boolean().default(false),
      apiAccess: z.boolean().default(false),
      advancedAnalytics: z.boolean().default(false),
      customIntegrations: z.boolean().default(false)
    }).optional(),
    status: z.enum(['active', 'inactive', 'archived']).default('active'),
    isPopular: z.boolean().default(false),
    sortOrder: z.number()
      .int('Must be an integer')
      .min(0, 'Sort order must be non-negative')
      .default(0),
    trialDays: z.number()
      .int('Must be an integer')
      .min(0, 'Trial days must be non-negative')
      .max(365, 'Trial days cannot exceed 365')
      .default(14)
  })
});

/**
 * Update Subscription Plan Schema
 */
export const updateSubscriptionPlanSchema = z.object({
  params: z.object({
    id: schemas.objectId
  }),
  body: z.object({
    name: z.string()
      .min(2, 'Plan name must be at least 2 characters')
      .max(100, 'Plan name must not exceed 100 characters')
      .trim()
      .optional(),
    slug: z.string()
      .min(2, 'Slug must be at least 2 characters')
      .max(50, 'Slug must not exceed 50 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
      .optional(),
    description: z.string()
      .min(10, 'Description must be at least 10 characters')
      .max(500, 'Description must not exceed 500 characters')
      .trim()
      .optional(),
    pricing: z.object({
      monthly: z.number()
        .min(0, 'Monthly price must be non-negative')
        .max(100000, 'Monthly price cannot exceed 100,000')
        .optional(),
      yearly: z.number()
        .min(0, 'Yearly price must be non-negative')
        .max(1000000, 'Yearly price cannot exceed 1,000,000')
        .optional(),
      currency: z.enum(['USD', 'CAD', 'EUR', 'GBP']).optional()
    }).optional(),
    limits: z.object({
      maxTeamMembers: z.number()
        .int('Must be an integer')
        .min(1, 'Must allow at least 1 team member')
        .max(1000, 'Cannot exceed 1,000 team members')
        .optional(),
      maxClients: z.number()
        .int('Must be an integer')
        .min(1, 'Must allow at least 1 client')
        .max(100000, 'Cannot exceed 100,000 clients')
        .optional(),
      maxStorage: z.number()
        .int('Must be an integer')
        .min(100, 'Must allow at least 100MB storage')
        .max(10000000, 'Cannot exceed 10TB storage')
        .optional(),
      apiCallsPerMonth: z.number()
        .int('Must be an integer')
        .min(0, 'Must be non-negative')
        .max(10000000, 'Cannot exceed 10,000,000 API calls')
        .optional(),
      documentUploadsPerMonth: z.number()
        .int('Must be an integer')
        .min(0, 'Must be non-negative')
        .max(100000, 'Cannot exceed 100,000 document uploads')
        .optional()
    }).optional(),
    features: z.object({
      visitorVisa: z.boolean().optional(),
      studyVisa: z.boolean().optional(),
      workPermit: z.boolean().optional(),
      permanentResidence: z.boolean().optional(),
      familySponsorship: z.boolean().optional(),
      businessImmigration: z.boolean().optional(),
      customBranding: z.boolean().optional(),
      whiteLabel: z.boolean().optional(),
      prioritySupport: z.boolean().optional(),
      apiAccess: z.boolean().optional(),
      advancedAnalytics: z.boolean().optional(),
      customIntegrations: z.boolean().optional()
    }).optional(),
    status: z.enum(['active', 'inactive', 'archived']).optional(),
    isPopular: z.boolean().optional(),
    sortOrder: z.number()
      .int('Must be an integer')
      .min(0, 'Sort order must be non-negative')
      .optional(),
    trialDays: z.number()
      .int('Must be an integer')
      .min(0, 'Trial days must be non-negative')
      .max(365, 'Trial days cannot exceed 365')
      .optional()
  })
});

/**
 * Get All Plans Schema (with pagination)
 */
export const getAllPlansSchema = paginationQuerySchema;

/**
 * Get Active Plans Schema (with pagination)
 */
export const getActivePlansSchema = paginationQuerySchema;

/**
 * Get Subscription Plan Schema
 */
export const getSubscriptionPlanSchema = z.object({
  params: z.object({
    id: schemas.objectId
  })
});

/**
 * Delete Subscription Plan Schema
 */
export const deleteSubscriptionPlanSchema = z.object({
  params: z.object({
    id: schemas.objectId
  })
});

/**
 * Update Plan Status Schema
 */
export const updatePlanStatusSchema = z.object({
  params: z.object({
    id: schemas.objectId
  }),
  body: z.object({
    status: z.enum(['active', 'inactive', 'archived'], {
      errorMap: () => ({ message: 'Status must be active, inactive, or archived' })
    })
  })
});

/**
 * Reorder Plans Schema
 */
export const reorderPlansSchema = z.object({
  body: z.object({
    planIds: z.array(schemas.objectId)
      .min(1, 'Must provide at least one plan ID')
      .max(100, 'Cannot reorder more than 100 plans at once')
  })
});

/**
 * Type exports
 */
export type CreateSubscriptionPlanInput = z.infer<typeof createSubscriptionPlanSchema>['body'];
export type UpdateSubscriptionPlanInput = z.infer<typeof updateSubscriptionPlanSchema>['body'];
export type GetSubscriptionPlanParams = z.infer<typeof getSubscriptionPlanSchema>['params'];
export type DeleteSubscriptionPlanParams = z.infer<typeof deleteSubscriptionPlanSchema>['params'];
export type UpdatePlanStatusInput = z.infer<typeof updatePlanStatusSchema>['body'];
export type ReorderPlansInput = z.infer<typeof reorderPlansSchema>['body'];

