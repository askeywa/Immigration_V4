import { z } from 'zod';
import { schemas, commonSchemas } from '../../utils/zod.schemas';

/**
 * Create tenant validation schema
 */
export const createTenantSchema = z.object({
  body: z.object({
    name: z.string()
      .min(3, 'Tenant name must be at least 3 characters')
      .max(100, 'Tenant name too long'),
    domain: schemas.domain,
    website: schemas.secureUrl.optional(),
    contactEmail: schemas.secureEmail,
    contactPhone: schemas.phone.optional(),
    address: z.object({
      street: z.string().max(200).optional(),
      city: z.string().max(100).optional(),
      province: z.string().max(100).optional(),
      postalCode: z.string().max(20).optional(),
      country: z.string().max(100).default('Canada'),
    }).optional(),
    branding: z.object({
      primaryColor: schemas.hexColor.default('#3B82F6'),
      secondaryColor: schemas.hexColor.default('#6366F1'),
      logo: schemas.secureUrl.optional(),
      favicon: schemas.secureUrl.optional(),
    }).optional(),
    settings: z.object({
      timezone: z.string().default('America/Toronto'),
      language: z.enum(['en', 'fr']).default('en'),
      dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).default('MM/DD/YYYY'),
    }).optional(),
  }),
});

/**
 * Update tenant validation schema
 */
export const updateTenantSchema = z.object({
  params: z.object({
    id: commonSchemas.id,
  }),
  body: z.object({
    name: z.string().min(3).max(100).optional(),
    domain: schemas.domain.optional(),
    website: schemas.secureUrl.optional(),
    contactEmail: schemas.secureEmail.optional(),
    contactPhone: schemas.phone.optional(),
    address: z.object({
      street: z.string().max(200).optional(),
      city: z.string().max(100).optional(),
      province: z.string().max(100).optional(),
      postalCode: z.string().max(20).optional(),
      country: z.string().max(100).optional(),
    }).optional(),
    branding: z.object({
      primaryColor: schemas.hexColor.optional(),
      secondaryColor: schemas.hexColor.optional(),
      logo: schemas.secureUrl.optional(),
      favicon: schemas.secureUrl.optional(),
    }).optional(),
    settings: z.object({
      timezone: z.string().optional(),
      language: z.enum(['en', 'fr']).optional(),
      dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).optional(),
    }).optional(),
    isActive: z.boolean().optional(),
  }),
});

/**
 * Get tenant by ID schema
 */
export const getTenantSchema = z.object({
  params: z.object({
    id: commonSchemas.id,
  }),
});

/**
 * List tenants schema (with pagination and filters)
 */
export const listTenantsSchema = z.object({
  query: z.object({
    page: commonSchemas.page,
    limit: commonSchemas.limit,
    search: commonSchemas.search,
    isActive: commonSchemas.booleanString.optional(),
    sortBy: z.enum(['name', 'domain', 'createdAt', 'updatedAt']).default('createdAt'),
    sortOrder: commonSchemas.sortOrder,
  }),
});

/**
 * Delete tenant schema
 */
export const deleteTenantSchema = z.object({
  params: z.object({
    id: commonSchemas.id,
  }),
});

// Type exports for TypeScript inference
export type CreateTenantInput = z.infer<typeof createTenantSchema>['body'];
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>['body'];
export type GetTenantParams = z.infer<typeof getTenantSchema>['params'];
export type ListTenantsQuery = z.infer<typeof listTenantsSchema>['query'];
export type DeleteTenantParams = z.infer<typeof deleteTenantSchema>['params'];

