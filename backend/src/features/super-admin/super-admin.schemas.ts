/**
 * Super Admin Zod Validation Schemas
 * Input validation for tenant management
 * 
 * Following CORE-CRITICAL Rule 12: Validate ALL external data
 */

import { z } from 'zod';
import { schemas } from '../../utils/zod.schemas';

/**
 * Create Tenant Schema
 */
export const createTenantSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Tenant name must be at least 2 characters')
      .max(100, 'Tenant name must not exceed 100 characters')
      .trim(),
    domain: schemas.domain,
    subdomain: z.string()
      .min(2, 'Subdomain must be at least 2 characters')
      .max(50, 'Subdomain must not exceed 50 characters')
      .regex(/^[a-z0-9-]+$/, 'Subdomain must contain only lowercase letters, numbers, and hyphens')
      .optional(),
    adminEmail: schemas.secureEmail,
    adminPassword: schemas.strongPassword,
    adminFirstName: z.string()
      .min(1, 'First name is required')
      .max(50, 'First name must not exceed 50 characters')
      .trim(),
    adminLastName: z.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must not exceed 50 characters')
      .trim(),
    plan: z.enum(['free', 'basic', 'premium', 'enterprise']).default('basic'),
    maxTeamMembers: z.number()
      .int('Must be an integer')
      .min(1, 'Must allow at least 1 team member')
      .max(100, 'Cannot exceed 100 team members')
      .default(5),
    maxClients: z.number()
      .int('Must be an integer')
      .min(1, 'Must allow at least 1 client')
      .max(10000, 'Cannot exceed 10,000 clients')
      .default(100),
    features: z.object({
      visitorVisa: z.boolean().default(true),
      studyVisa: z.boolean().default(true),
      workPermit: z.boolean().default(true),
      permanentResidence: z.boolean().default(true),
      familySponsorship: z.boolean().default(true),
      businessImmigration: z.boolean().default(false)
    }).optional(),
    metadata: z.object({
      rcicNumber: z.string().max(50).optional(),
      businessAddress: z.string().max(200).optional(),
      phone: z.string()
        .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format')
        .optional()
    }).optional()
  })
});

/**
 * Update Tenant Schema
 */
export const updateTenantSchema = z.object({
  params: z.object({
    id: schemas.objectId
  }),
  body: z.object({
    name: z.string()
      .min(2, 'Tenant name must be at least 2 characters')
      .max(100, 'Tenant name must not exceed 100 characters')
      .trim()
      .optional(),
    domain: schemas.domain.optional(),
    subdomain: z.string()
      .min(2, 'Subdomain must be at least 2 characters')
      .max(50, 'Subdomain must not exceed 50 characters')
      .regex(/^[a-z0-9-]+$/, 'Subdomain must contain only lowercase letters, numbers, and hyphens')
      .optional(),
    status: z.enum(['active', 'inactive', 'suspended']).optional(),
    plan: z.enum(['free', 'basic', 'premium', 'enterprise']).optional(),
    adminFirstName: z.string()
      .min(1, 'First name is required')
      .max(50, 'First name must not exceed 50 characters')
      .trim()
      .optional(),
    adminLastName: z.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must not exceed 50 characters')
      .trim()
      .optional(),
    maxTeamMembers: z.number()
      .int('Must be an integer')
      .min(1, 'Must allow at least 1 team member')
      .max(100, 'Cannot exceed 100 team members')
      .optional(),
    maxClients: z.number()
      .int('Must be an integer')
      .min(1, 'Must allow at least 1 client')
      .max(10000, 'Cannot exceed 10,000 clients')
      .optional(),
    features: z.object({
      visitorVisa: z.boolean().optional(),
      studyVisa: z.boolean().optional(),
      workPermit: z.boolean().optional(),
      permanentResidence: z.boolean().optional(),
      familySponsorship: z.boolean().optional(),
      businessImmigration: z.boolean().optional()
    }).optional(),
    metadata: z.object({
      rcicNumber: z.string().max(50).optional(),
      businessAddress: z.string().max(200).optional(),
      phone: z.string()
        .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format')
        .optional()
    }).optional()
  })
});

/**
 * Get Tenant Schema
 */
export const getTenantSchema = z.object({
  params: z.object({
    id: schemas.objectId
  })
});

/**
 * Delete Tenant Schema
 */
export const deleteTenantSchema = z.object({
  params: z.object({
    id: schemas.objectId
  })
});

/**
 * Type exports
 */
export type CreateTenantInput = z.infer<typeof createTenantSchema>['body'];
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>['body'];
export type GetTenantParams = z.infer<typeof getTenantSchema>['params'];
export type DeleteTenantParams = z.infer<typeof deleteTenantSchema>['params'];
