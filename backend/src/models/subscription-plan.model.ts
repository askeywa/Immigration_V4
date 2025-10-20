import mongoose, { Schema } from 'mongoose';
import { IBaseModel, baseSchemaOptions, softDeletePlugin } from './base.model';

/**
 * Subscription Plan Model Interface
 * Represents a subscription plan that can be assigned to tenants
 */
export interface ISubscriptionPlan extends IBaseModel {
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
    maxStorage: number; // in MB
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
  status: 'active' | 'inactive' | 'archived';
  isPopular: boolean;
  sortOrder: number;
  trialDays: number;
  
  // Virtual properties
  monthlyPriceFormatted: string;
  yearlyPriceFormatted: string;
  
  // Instance methods
  isActive(): boolean;
  canBeDeleted(): Promise<boolean>;
}

/**
 * Subscription Plan Model Statics
 */
export interface ISubscriptionPlanModel extends mongoose.Model<ISubscriptionPlan> {
  findBySlug(slug: string): Promise<(mongoose.Document<unknown, {}, ISubscriptionPlan> & ISubscriptionPlan) | null>;
  findActivePlans(): Promise<(mongoose.Document<unknown, {}, ISubscriptionPlan> & ISubscriptionPlan)[]>;
  findPopularPlans(): Promise<(mongoose.Document<unknown, {}, ISubscriptionPlan> & ISubscriptionPlan)[]>;
}

/**
 * Subscription Plan Schema
 */
const subscriptionPlanSchema = new Schema<ISubscriptionPlan>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'],
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  pricing: {
    monthly: {
      type: Number,
      required: true,
      min: 0,
      max: 100000
    },
    yearly: {
      type: Number,
      required: true,
      min: 0,
      max: 1000000
    },
    currency: {
      type: String,
      required: true,
      enum: ['USD', 'CAD', 'EUR', 'GBP'],
      default: 'USD'
    }
  },
  limits: {
    maxTeamMembers: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
      default: 5
    },
    maxClients: {
      type: Number,
      required: true,
      min: 1,
      max: 100000,
      default: 100
    },
    maxStorage: {
      type: Number,
      required: true,
      min: 100,
      max: 10000000, // 10TB
      default: 1024 // 1GB
    },
    apiCallsPerMonth: {
      type: Number,
      required: true,
      min: 0,
      max: 10000000,
      default: 10000
    },
    documentUploadsPerMonth: {
      type: Number,
      required: true,
      min: 0,
      max: 100000,
      default: 1000
    }
  },
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
    },
    customBranding: {
      type: Boolean,
      default: false
    },
    whiteLabel: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    customIntegrations: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active',
    index: true
  },
  isPopular: {
    type: Boolean,
    default: false,
    index: true
  },
  sortOrder: {
    type: Number,
    default: 0,
    index: true
  },
  trialDays: {
    type: Number,
    min: 0,
    max: 365,
    default: 14
  }
}, baseSchemaOptions);

// Apply soft delete plugin
subscriptionPlanSchema.plugin(softDeletePlugin);

// Indexes for performance
// Composite sparse index: allows slug reuse after soft delete
// Only enforces uniqueness where deletedAt is null (active plans)
subscriptionPlanSchema.index(
  { slug: 1, deletedAt: 1 },
  { 
    unique: true,
    sparse: true,
    partialFilterExpression: { deletedAt: null }
  }
);
subscriptionPlanSchema.index({ status: 1, sortOrder: 1 });
subscriptionPlanSchema.index({ status: 1, isPopular: 1 });
subscriptionPlanSchema.index({ createdAt: -1 });

// Virtual for formatted monthly price
subscriptionPlanSchema.virtual('monthlyPriceFormatted').get(function() {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.pricing.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return formatter.format(this.pricing.monthly);
});

// Virtual for formatted yearly price
subscriptionPlanSchema.virtual('yearlyPriceFormatted').get(function() {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.pricing.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return formatter.format(this.pricing.yearly);
});

// Ensure virtual fields are serialized
subscriptionPlanSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Pre-save middleware
subscriptionPlanSchema.pre('save', async function(next) {
  // Ensure slug is lowercase
  if (this.isModified('slug')) {
    this.slug = this.slug.toLowerCase();
  }
  
  // Generate slug from name if not provided
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  // DATA INTEGRITY: Prevent deletion if plan has active tenants (fallback safety net)
  if (this.isModified('deletedAt') && this.deletedAt) {
    const Tenant = mongoose.model('Tenant');
    const tenantCount = await Tenant.countDocuments({
      plan: this.slug,
      deletedAt: null
    });

    if (tenantCount > 0) {
      throw new Error(
        `Cannot delete plan with ${tenantCount} active tenant(s) using this plan.`
      );
    }
  }
  
  next();
});

// Static methods
subscriptionPlanSchema.statics.findBySlug = function(slug: string) {
  return this.findOne({ slug: slug.toLowerCase(), deletedAt: null });
};

subscriptionPlanSchema.statics.findActivePlans = function() {
  return this.find({ status: 'active', deletedAt: null })
    .sort({ sortOrder: 1, createdAt: -1 });
};

subscriptionPlanSchema.statics.findPopularPlans = function() {
  return this.find({ 
    status: 'active', 
    isPopular: true, 
    deletedAt: null 
  }).sort({ sortOrder: 1 });
};

// Instance methods
subscriptionPlanSchema.methods.isActive = function() {
  return this.status === 'active';
};

subscriptionPlanSchema.methods.canBeDeleted = async function() {
  // Check if any tenants are using this plan
  const Tenant = mongoose.model('Tenant');
  const tenantCount = await Tenant.countDocuments({
    plan: this.slug,
    deletedAt: null
  });
  
  return tenantCount === 0;
};

// Export Subscription Plan model with methods
export const SubscriptionPlan = mongoose.model<ISubscriptionPlan, ISubscriptionPlanModel>(
  'SubscriptionPlan',
  subscriptionPlanSchema
);

