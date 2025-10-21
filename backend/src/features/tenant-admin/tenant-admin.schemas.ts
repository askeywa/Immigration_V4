/**
 * Tenant Admin Zod Validation Schemas
 * Input validation for team member and client management
 * 
 * Following CORE-CRITICAL Rule 12: Validate ALL external data
 */

import { z } from 'zod';
import { schemas } from '../../utils/zod.schemas';

/**
 * Create Team Member Schema
 */
export const createTeamMemberSchema = z.object({
  body: z.object({
    email: schemas.secureEmail,
    password: schemas.strongPassword,
    firstName: z.string()
      .min(1, 'First name is required')
      .max(50, 'First name must not exceed 50 characters')
      .trim(),
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must not exceed 50 characters')
      .trim(),
    role: z.enum(['admin', 'visa_specialist', 'work_permit_specialist', 'case_manager'])
      .default('case_manager'),
    specializations: z.array(z.string().max(100))
      .max(10, 'Cannot have more than 10 specializations')
      .optional(),
    permissions: z.array(z.string().max(50))
      .max(50, 'Cannot have more than 50 permissions')
      .optional()
  })
});

/**
 * Update Team Member Schema
 */
export const updateTeamMemberSchema = z.object({
  params: z.object({
    id: schemas.objectId
  }),
  body: z.object({
    firstName: z.string()
      .min(1, 'First name is required')
      .max(50, 'First name must not exceed 50 characters')
      .trim()
      .optional(),
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must not exceed 50 characters')
      .trim()
      .optional(),
    role: z.enum(['admin', 'visa_specialist', 'work_permit_specialist', 'case_manager'])
      .optional(),
    specializations: z.array(z.string().max(100))
      .max(10, 'Cannot have more than 10 specializations')
      .optional(),
    permissions: z.array(z.string().max(50))
      .max(50, 'Cannot have more than 50 permissions')
      .optional(),
    isActive: z.boolean().optional()
  })
});

/**
 * Create Client Schema
 * Basic info: Name, Email, Phone, DOB, Nationality
 */
export const createClientSchema = z.object({
  body: z.object({
    email: schemas.secureEmail,
    password: schemas.strongPassword,
    firstName: z.string()
      .min(1, 'First name is required')
      .max(50, 'First name must not exceed 50 characters')
      .trim(),
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must not exceed 50 characters')
      .trim(),
    phone: z.string()
      .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format')
      .max(20, 'Phone number too long')
      .optional(),
    dateOfBirth: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .refine((date) => {
        const birthDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 18 && age <= 100;
      }, 'Client must be between 18 and 100 years old')
      .optional(),
    nationality: z.string()
      .min(2, 'Nationality must be at least 2 characters')
      .max(50, 'Nationality must not exceed 50 characters')
      .optional(),
    applicationType: z.enum([
      'visitor_visa',
      'study_visa',
      'work_permit',
      'permanent_residence',
      'family_sponsorship',
      'business_immigration'
    ]),
    assignedTo: schemas.objectId.optional()
  })
});

/**
 * Team Member ID Schema
 */
export const teamMemberIdSchema = z.object({
  params: z.object({
    id: schemas.objectId
  })
});

/**
 * Type exports
 */
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>['body'];
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>['body'];
export type CreateClientInput = z.infer<typeof createClientSchema>['body'];
export type TeamMemberIdParams = z.infer<typeof teamMemberIdSchema>['params'];
