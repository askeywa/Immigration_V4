import mongoose, { Schema } from 'mongoose';
import { IBaseModel, baseSchemaOptions, softDeletePlugin } from './base.model';
import { config } from '../config/env.config';

/**
 * Tenant Model Interface
 * Represents a tenant (RCIC) in the multi-tenant system
 */
export interface ITenant extends IBaseModel {
  name: string;
  domain: string;
  subdomain?: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  
  // NEW: Admin credentials for tenant
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  adminLastLogin?: Date;
  adminLoginAttempts: number;
  adminLockUntil?: Date;
  
  settings: {
    maxTeamMembers: number;
    maxClients: number;
    maxStorage: number; // in MB
    features: string[];
    allowSelfRegistration: boolean;
    requireEmailVerification: boolean;
    branding?: {
      logo?: string;
      theme?: {
        palette: string;
        colors: {
          primary: string;
          secondary: string;
          accent: string;
          neutral: string;
          surface: string;
        };
      };
    };
  };
  subscription: {
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    maxTeamMembers: number;
    maxClients: number;
    expiresAt?: Date;
    features: {
      visitorVisa: boolean;
      studyVisa: boolean;
      workPermit: boolean;
      permanentResidence: boolean;
      familySponsorship: boolean;
      businessImmigration: boolean;
    };
  };
  billing: {
    customerId?: string; // Stripe customer ID
    subscriptionId?: string; // Stripe subscription ID
    status: 'active' | 'canceled' | 'past_due' | 'unpaid';
    currentPeriodEnd?: Date;
  };
  metadata: {
    industry?: string;
    companySize?: string;
    signupSource?: string;
    rcicNumber?: string; // RCIC license number
    businessAddress?: string;
    phone?: string;
  };
  
  // Virtual properties
  fullDomain: string;
  isAdminLocked: boolean;
  
  // Instance methods
  isActive(): boolean;
  canAddTeamMember(currentCount: number): boolean;
  canAddClient(currentCount: number): boolean;
  incrementAdminLoginAttempts(): Promise<void>;
  resetAdminLoginAttempts(): Promise<void>;
}

/**
 * Tenant Schema
 */
const tenantSchema = new Schema<ITenant>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/, 'Invalid domain format']
  },
  subdomain: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/, 'Invalid subdomain format'],
    sparse: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free',
    index: true
  },
  
  // NEW: Admin credentials for tenant
  adminEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    index: true
  },
  adminPassword: {
    type: String,
    required: true,
    minlength: 8,
    select: false // Don't include in queries by default
  },
  adminFirstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  adminLastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  adminLastLogin: {
    type: Date,
    index: true
  },
  adminLoginAttempts: {
    type: Number,
    default: 0
  },
  adminLockUntil: {
    type: Date,
    select: false
  },
  
  settings: {
    maxTeamMembers: {
      type: Number,
      default: 5,
      min: 1,
      max: 100
    },
    maxClients: {
      type: Number,
      default: 1000,
      min: 10,
      max: 100000
    },
    maxStorage: {
      type: Number,
      default: 1000, // 1GB
      min: 100,
      max: 1000000 // 1TB
    },
    features: [{
      type: String,
      enum: [
        'multi_tenant',
        'custom_branding',
        'advanced_analytics',
        'api_access',
        'white_label',
        'priority_support',
        'custom_integrations'
      ]
    }],
    allowSelfRegistration: {
      type: Boolean,
      default: false
    },
    requireEmailVerification: {
      type: Boolean,
      default: true
    },
    branding: {
      logo: String,
      theme: {
        palette: {
          type: String,
          enum: ['royal-blue', 'cool-green', 'sunset-purple', 'warm-coral', 'elegant-gray'],
          default: 'warm-coral'
        },
        colors: {
          primary: {
            type: String,
            match: [/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'],
            default: '#dc2626'
          },
          secondary: {
            type: String,
            match: [/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'],
            default: '#ef4444'
          },
          accent: {
            type: String,
            match: [/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'],
            default: '#f87171'
          },
          neutral: {
            type: String,
            match: [/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'],
            default: '#6b7280'
          },
          surface: {
            type: String,
            match: [/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'],
            default: '#fef2f2'
          }
        }
      }
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    maxTeamMembers: {
      type: Number,
      default: 5,
      min: 1,
      max: 100
    },
    maxClients: {
      type: Number,
      default: 1000,
      min: 10,
      max: 100000
    },
    expiresAt: Date,
    features: {
      visitorVisa: {
        type: Boolean,
        default: true
      },
      studyVisa: {
        type: Boolean,
        default: true
      },
      workPermit: {
        type: Boolean,
        default: true
      },
      permanentResidence: {
        type: Boolean,
        default: false
      },
      familySponsorship: {
        type: Boolean,
        default: false
      },
      businessImmigration: {
        type: Boolean,
        default: false
      }
    }
  },
  billing: {
    customerId: String,
    subscriptionId: String,
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'unpaid'],
      default: 'active'
    },
    currentPeriodEnd: Date
  },
  metadata: {
    industry: String,
    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
    },
    signupSource: String,
    rcicNumber: String, // RCIC license number
    businessAddress: String,
    phone: {
      type: String,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format']
    }
  }
}, baseSchemaOptions);

// Apply soft delete plugin
tenantSchema.plugin(softDeletePlugin);

// Indexes for performance
tenantSchema.index({ domain: 1 }, { unique: true });
tenantSchema.index({ subdomain: 1 }, { sparse: true });
tenantSchema.index({ status: 1, plan: 1 });
tenantSchema.index({ 'billing.status': 1 });
tenantSchema.index({ adminEmail: 1 }, { unique: true });
tenantSchema.index({ createdAt: -1 });

// Virtual for full domain
tenantSchema.virtual('fullDomain').get(function() {
  return this.subdomain ? `${this.subdomain}.${this.domain}` : this.domain;
});

// Virtual for admin lock status
tenantSchema.virtual('isAdminLocked').get(function() {
  return !!(this.adminLockUntil && this.adminLockUntil > new Date());
});

// Ensure virtual fields are serialized
tenantSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Pre-save middleware
tenantSchema.pre('save', function(next) {
  // Ensure domain is lowercase
  if (this.isModified('domain')) {
    this.domain = this.domain.toLowerCase();
  }
  if (this.isModified('subdomain') && this.subdomain) {
    this.subdomain = this.subdomain.toLowerCase();
  }
  next();
});

// Static methods
tenantSchema.statics.findByDomain = function(domain: string) {
  return this.findOne({ domain: domain.toLowerCase(), deletedAt: null });
};

tenantSchema.statics.findBySubdomain = function(subdomain: string) {
  return this.findOne({ subdomain: subdomain.toLowerCase(), deletedAt: null });
};

tenantSchema.statics.findByAdminEmail = function(adminEmail: string) {
  return this.findOne({ adminEmail: adminEmail.toLowerCase(), deletedAt: null });
};

// Instance methods
tenantSchema.methods.isActive = function() {
  return this.status === 'active' && this.billing.status === 'active';
};

tenantSchema.methods.canAddTeamMember = function(currentCount: number) {
  return currentCount < this.settings.maxTeamMembers;
};

tenantSchema.methods.canAddClient = function(currentCount: number) {
  return currentCount < this.settings.maxClients;
};

tenantSchema.methods.incrementAdminLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.adminLockUntil && this.adminLockUntil < new Date()) {
    return this.updateOne({
      $unset: { adminLockUntil: 1 },
      $set: { adminLoginAttempts: 1 }
    });
  }
  
  const updates: any = { $inc: { adminLoginAttempts: 1 } };
  
  // Lock account after configured failed attempts for configured duration
  if (this.adminLoginAttempts + 1 >= config.TENANT_ADMIN_MAX_LOGIN_ATTEMPTS && !this.isAdminLocked) {
    updates.$set = { adminLockUntil: new Date(Date.now() + config.TENANT_ADMIN_LOCKOUT_DURATION_MS) };
  }
  
  return this.updateOne(updates);
};

tenantSchema.methods.resetAdminLoginAttempts = function() {
  return this.updateOne({
    $unset: { adminLoginAttempts: 1, adminLockUntil: 1 }
  });
};

// Add static methods to the model
interface ITenantModel extends mongoose.Model<ITenant> {
  findByDomain(domain: string): Promise<ITenant | null>;
  findBySubdomain(subdomain: string): Promise<ITenant | null>;
  findByAdminEmail(adminEmail: string): Promise<ITenant | null>;
}

export const Tenant = mongoose.model<ITenant, ITenantModel>('Tenant', tenantSchema);
