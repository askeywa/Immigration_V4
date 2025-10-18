import { z } from 'zod';

/**
 * Secure URL validator with multiple security layers
 * Blocks malicious protocols and validates URL structure
 */
const secureUrlSchema = z.string().url().refine(
  (url) => {
    // Block malicious protocols
    const maliciousPatterns = [
      /^javascript:/i,
      /^data:/i,
      /^vbscript:/i,
      /^file:/i,
    ];
    
    if (maliciousPatterns.some(pattern => pattern.test(url))) {
      return false;
    }

    try {
      const parsed = new URL(url);
      
      // Only allow http/https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }

      // Block localhost/internal IPs in production
      if (process.env.NODE_ENV === 'production') {
        const hostname = parsed.hostname.toLowerCase();
        const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
        
        if (blockedHosts.includes(hostname) || 
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  },
  { message: 'Invalid or insecure URL' }
);

/**
 * Secure email validator with XSS protection
 */
const secureEmailSchema = z.string()
  .email('Invalid email format')
  .toLowerCase()
  .max(254, 'Email too long')
  .refine(
    (email) => {
      // Additional email security checks
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+=/i,
      ];
      return !suspiciousPatterns.some(pattern => pattern.test(email));
    },
    { message: 'Invalid email format' }
  );

/**
 * Strong password validator
 * Requires: 8+ chars, uppercase, lowercase, number, special character
 */
const strongPasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

/**
 * MongoDB ObjectId validator
 */
const objectIdSchema = z.string().regex(
  /^[0-9a-fA-F]{24}$/,
  'Invalid ObjectId format'
);

/**
 * Domain name validator (FQDN)
 */
const domainSchema = z.string()
  .min(1, 'Domain is required')
  .max(253, 'Domain too long')
  .regex(
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i,
    'Invalid domain format'
  );

/**
 * Hex color validator (#RRGGBB)
 */
const hexColorSchema = z.string().regex(
  /^#[0-9A-F]{6}$/i,
  'Invalid color format (use #RRGGBB)'
);

/**
 * Phone number validator (international format)
 */
const phoneSchema = z.string().regex(
  /^\+?[1-9]\d{1,14}$/,
  'Invalid phone number (use international format)'
);

/**
 * Export reusable schemas
 */
export const schemas = {
  secureUrl: secureUrlSchema,
  secureEmail: secureEmailSchema,
  strongPassword: strongPasswordSchema,
  objectId: objectIdSchema,
  domain: domainSchema,
  hexColor: hexColorSchema,
  phone: phoneSchema,
};

/**
 * Common field schemas for reuse across features
 */
export const commonSchemas = {
  // IDs
  id: objectIdSchema,
  tenantId: objectIdSchema,
  userId: objectIdSchema,
  
  // Auth
  email: secureEmailSchema,
  password: strongPasswordSchema,
  
  // URLs
  url: secureUrlSchema,
  domain: domainSchema,
  
  // Contact
  phone: phoneSchema,
  
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  
  // Sorting
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  
  // Search
  search: z.string().max(100).optional(),
  
  // Timestamps
  dateString: z.string().datetime(),
  dateOnly: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  
  // Boolean from string
  booleanString: z.enum(['true', 'false']).transform(val => val === 'true'),
  
  // Colors
  color: hexColorSchema,
};

