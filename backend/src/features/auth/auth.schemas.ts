import { z } from 'zod';
import { schemas } from '../../utils/zod.schemas';

/**
 * Super Admin Login validation schema
 */
export const superAdminLoginSchema = z.object({
  body: z.object({
    email: schemas.secureEmail,
    password: z.string().min(1, 'Password is required'),
  }),
});

/**
 * Tenant Admin Login validation schema
 */
export const tenantAdminLoginSchema = z.object({
  body: z.object({
    email: schemas.secureEmail,
    password: z.string().min(1, 'Password is required'),
  }),
});

/**
 * Team Member Login validation schema
 */
export const teamMemberLoginSchema = z.object({
  body: z.object({
    email: schemas.secureEmail,
    password: z.string().min(1, 'Password is required'),
  }),
});

/**
 * Client Login validation schema
 */
export const clientLoginSchema = z.object({
  body: z.object({
    email: schemas.secureEmail,
    password: z.string().min(1, 'Password is required'),
  }),
});

/**
 * Register validation schema
 */
export const registerSchema = z.object({
  body: z.object({
    email: schemas.secureEmail,
    password: schemas.strongPassword,
    confirmPassword: z.string(),
    firstName: z.string()
      .min(1, 'First name is required')
      .max(50, 'First name too long')
      .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in first name'),
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name too long')
      .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in last name'),
    tenantId: z.string().optional(),
  }),
}).refine(
  (data) => data.body.password === data.body.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['body', 'confirmPassword'],
  }
);

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: schemas.secureEmail,
  }),
});

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: schemas.strongPassword,
    confirmPassword: z.string(),
  }),
}).refine(
  (data) => data.body.password === data.body.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['body', 'confirmPassword'],
  }
);

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: schemas.strongPassword,
    confirmPassword: z.string(),
  }),
}).refine(
  (data) => data.body.newPassword === data.body.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['body', 'confirmPassword'],
  }
).refine(
  (data) => data.body.currentPassword !== data.body.newPassword,
  {
    message: 'New password must be different from current password',
    path: ['body', 'newPassword'],
  }
);

/**
 * MFA setup schema
 */
export const mfaSetupSchema = z.object({
  body: z.object({
    code: z.string()
      .length(6, 'MFA code must be 6 digits')
      .regex(/^\d{6}$/, 'MFA code must contain only digits'),
  }),
});

/**
 * MFA verify schema
 */
export const mfaVerifySchema = z.object({
  body: z.object({
    code: z.string()
      .length(6, 'MFA code must be 6 digits')
      .regex(/^\d{6}$/, 'MFA code must contain only digits'),
    token: z.string().min(1, 'Authentication token is required'),
  }),
});

/**
 * Verify email schema
 */
export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),
});

/**
 * Refresh token schema
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required').max(50).optional(),
    lastName: z.string().min(1, 'Last name is required').max(50).optional(),
    profile: z.object({
      avatar: z.string().url().optional(),
      phone: z.string().optional(),
      timezone: z.string().optional(),
      language: z.enum(['en', 'fr', 'es', 'de', 'it', 'pt', 'zh', 'ja', 'ko']).optional(),
      dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).optional(),
      notifications: z.object({
        email: z.boolean().optional(),
        push: z.boolean().optional(),
        sms: z.boolean().optional()
      }).optional()
    }).optional(),
    preferences: z.object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      dashboard: z.object({
        layout: z.enum(['grid', 'list']).optional(),
        widgets: z.array(z.string()).optional()
      }).optional()
    }).optional()
  }),
});

// Type exports for TypeScript inference
export type SuperAdminLoginInput = z.infer<typeof superAdminLoginSchema>['body'];
export type TenantAdminLoginInput = z.infer<typeof tenantAdminLoginSchema>['body'];
export type TeamMemberLoginInput = z.infer<typeof teamMemberLoginSchema>['body'];
export type ClientLoginInput = z.infer<typeof clientLoginSchema>['body'];
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type MFASetupInput = z.infer<typeof mfaSetupSchema>['body'];
export type MFAVerifyInput = z.infer<typeof mfaVerifySchema>['body'];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];

