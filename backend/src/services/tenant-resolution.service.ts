import { Request } from 'express';
import logger from '../utils/logger';
import { Tenant } from '../models/tenant.model';
import { HydratedDocument } from 'mongoose';
import { ITenant } from '../models/tenant.model';
import { ValidationUtils } from '../utils/validation.utils';

type TenantDocument = HydratedDocument<ITenant>;

/**
 * Tenant Information
 */
export interface TenantInfo {
  id: string;
  domain: string;
  name: string;
  status: string;
  plan: string;
}

/**
 * Tenant Resolution Service
 * Resolves tenant from domain, subdomain, or other identifiers
 * Supports full multi-tenant architecture with domain-based routing
 */
class TenantResolutionService {
  private static instance: TenantResolutionService;
  private tenantCache: Map<string, { tenant: TenantInfo; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TenantResolutionService {
    if (!TenantResolutionService.instance) {
      TenantResolutionService.instance = new TenantResolutionService();
    }
    return TenantResolutionService.instance;
  }

  /**
   * Initialize tenant resolution service
   */
  public static async initialize(): Promise<void> {
    logger.info('Tenant Resolution Service initialized');
  }

  /**
   * Resolve tenant from request
   * Tries multiple strategies: domain, header, user info
   */
  public async resolveTenantFromRequest(req: Request): Promise<TenantInfo | null> {
    try {
      // Strategy 1: Check for tenant ID in header (for API calls)
      const tenantIdHeader = req.headers['x-tenant-id'] as string;
      if (tenantIdHeader) {
        const tenant = await this.getTenantById(tenantIdHeader);
        if (tenant) return tenant;
      }

      // Strategy 2: Resolve from domain/hostname
      const host = req.get('host');
      if (host) {
        const tenant = await this.resolveTenantFromDomain(host);
        if (tenant) return tenant;
      }

      // Strategy 3: Resolve from user (if authenticated)
      if (req.user) {
        const tenant = await this.resolveTenantFromUser(req.user);
        if (tenant) return tenant;
      }

      // Strategy 4: Check subdomain
      const subdomain = this.extractSubdomain(req.get('host') || '');
      if (subdomain) {
        const tenant = await this.resolveTenantFromSubdomain(subdomain);
        if (tenant) return tenant;
      }

      return null;
    } catch (error) {
      logger.error('Tenant resolution error', {
        error: error instanceof Error ? error.message : String(error),
        host: req.get('host'),
      });
      return null;
    }
  }

  /**
   * Resolve tenant from domain
   */
  public async resolveTenantFromDomain(domain: string): Promise<TenantInfo | null> {
    try {
      // Check cache first
      const cached = this.tenantCache.get(domain);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.tenant;
      }

      // Clean domain (remove port)
      const cleanDomain = domain.split(':')[0];

      // Query database
      const tenantDoc: TenantDocument | null = await Tenant.findOne({ 
        domain: cleanDomain,
        status: 'active' 
      });

      if (!tenantDoc) {
        return null;
      }

      const tenantInfo: TenantInfo = {
        id: tenantDoc._id.toString(),
        domain: tenantDoc.domain,
        name: tenantDoc.name,
        status: tenantDoc.status,
        plan: tenantDoc.plan,
      };

      // Cache the result
      this.tenantCache.set(domain, {
        tenant: tenantInfo,
        timestamp: Date.now(),
      });

      return tenantInfo;
    } catch (error) {
      logger.error('Domain resolution error', {
        domain,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Resolve tenant from subdomain
   */
  public async resolveTenantFromSubdomain(subdomain: string): Promise<TenantInfo | null> {
    try {
      // For localhost development, accept any subdomain pattern
      const domain = `${subdomain}.localhost`;
      return await this.resolveTenantFromDomain(domain);
    } catch (error) {
      logger.error('Subdomain resolution error', {
        subdomain,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Resolve tenant from user object
   */
  public async resolveTenantFromUser(user: any): Promise<TenantInfo | null> {
    try {
      if (!user.tenantId) {
        return null;
      }

      return await this.getTenantById(user.tenantId);
    } catch (error) {
      logger.error('User tenant resolution error', {
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Get tenant by ID
   */
  public async getTenantById(tenantId: string): Promise<TenantInfo | null> {
    try {
      // Check cache first
      const cacheKey = `id:${tenantId}`;
      const cached = this.tenantCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.tenant;
      }

      const validatedTenantId = ValidationUtils.validateObjectId(tenantId, 'Tenant ID');
      const tenantDoc: TenantDocument | null = await Tenant.findById(validatedTenantId);

      if (!tenantDoc) {
        return null;
      }

      const tenantInfo: TenantInfo = {
        id: tenantDoc._id.toString(),
        domain: tenantDoc.domain,
        name: tenantDoc.name,
        status: tenantDoc.status,
        plan: tenantDoc.plan,
      };

      // Cache the result
      this.tenantCache.set(cacheKey, {
        tenant: tenantInfo,
        timestamp: Date.now(),
      });

      return tenantInfo;
    } catch (error) {
      logger.error('Get tenant by ID error', {
        tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Extract subdomain from hostname
   */
  private extractSubdomain(host: string): string | null {
    try {
      // Remove port
      const cleanHost = host.split(':')[0];
      
      // Split by dots
      const parts = cleanHost.split('.');
      
      // If localhost, check for subdomain.localhost pattern
      if (cleanHost.includes('localhost')) {
        if (parts.length > 1 && parts[0] !== 'localhost') {
          return parts[0];
        }
        return null;
      }

      // For production domains (e.g., tenant.example.com)
      if (parts.length > 2) {
        return parts[0];
      }

      return null;
    } catch (error) {
      logger.error('Subdomain extraction error', {
        host,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Invalidate tenant cache
   */
  public invalidateTenantCache(tenantId?: string, domain?: string): void {
    try {
      if (tenantId) {
        this.tenantCache.delete(`id:${tenantId}`);
      }
      if (domain) {
        this.tenantCache.delete(domain);
      }
      
      // If no specific identifier, clear all cache
      if (!tenantId && !domain) {
        this.tenantCache.clear();
      }

      logger.debug('Tenant cache invalidated', { tenantId, domain });
    } catch (error) {
      logger.error('Cache invalidation error', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Validate tenant status
   */
  public async validateTenantStatus(tenantId: string): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    try {
      const tenant = await this.getTenantById(tenantId);

      if (!tenant) {
        return { valid: false, reason: 'Tenant not found' };
      }

      if (tenant.status !== 'active') {
        return { valid: false, reason: `Tenant is ${tenant.status}` };
      }

      return { valid: true };
    } catch (error) {
      logger.error('Tenant status validation error', {
        tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      return { valid: false, reason: 'Validation error' };
    }
  }

  /**
   * Get all active tenants
   */
  public async getActiveTenants(): Promise<TenantInfo[]> {
    try {
      const tenantDocs: TenantDocument[] = await Tenant.find({ status: 'active' });
      
      return tenantDocs.map((doc) => ({
        id: doc._id.toString(),
        domain: doc.domain,
        name: doc.name,
        status: doc.status,
        plan: doc.plan,
      }));
    } catch (error) {
      logger.error('Get active tenants error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
}

export default TenantResolutionService;

