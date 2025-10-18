import mongoose, { Schema } from 'mongoose';
import { IBaseModel, baseSchemaOptions, softDeletePlugin } from './base.model';

/**
 * SuperAdmin Model Interface
 * Represents the super admin account (only one in the system)
 */
export interface ISuperAdmin extends IBaseModel {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'super_admin';
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  profile: {
    avatar?: string;
    phone?: string;
    timezone?: string;
    language?: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    dashboard: {
      layout: 'grid' | 'list';
      widgets: string[];
    };
  };
  metadata: {
    lastIpAddress?: string;
    userAgent?: string;
    timezone?: string;
  };
  
  // Virtual properties
  fullName: string;
  
  // Instance methods
  isActiveAccount(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  canAccess(requiredPermission: string): boolean;
}

/**
 * SuperAdmin Model Statics
 */
export interface ISuperAdminModel extends mongoose.Model<ISuperAdmin> {
  findByEmail(email: string): Promise<(mongoose.Document<unknown, {}, ISuperAdmin> & ISuperAdmin) | null>;
  findActive(): Promise<(mongoose.Document<unknown, {}, ISuperAdmin> & ISuperAdmin) | null>;
}

/**
 * SuperAdmin Schema
 */
const superAdminSchema = new Schema<ISuperAdmin>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // Don't include in queries by default
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  role: {
    type: String,
    enum: ['super_admin'],
    default: 'super_admin',
    index: true
  },
  permissions: [{
    type: String,
    enum: [
      'manage_tenants',
      'manage_system_settings',
      'view_analytics',
      'manage_billing',
      'view_audit_logs',
      'manage_integrations',
      'system_maintenance'
    ],
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastLogin: {
    type: Date,
    index: true
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    select: false
  },
  profile: {
    avatar: String,
    phone: {
      type: String,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format']
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'fr', 'es', 'de', 'it', 'pt', 'zh', 'ja', 'ko']
    }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    dashboard: {
      layout: {
        type: String,
        enum: ['grid', 'list'],
        default: 'grid'
      },
      widgets: [String]
    }
  },
  metadata: {
    lastIpAddress: String,
    userAgent: String,
    timezone: String
  }
}, baseSchemaOptions);

// Apply soft delete plugin
superAdminSchema.plugin(softDeletePlugin);

// Indexes for performance
superAdminSchema.index({ email: 1 }, { unique: true });
superAdminSchema.index({ isActive: 1 });
superAdminSchema.index({ lastLogin: -1 });
superAdminSchema.index({ createdAt: -1 });

// Virtual for full name
superAdminSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
superAdminSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    // Never return password or sensitive fields
    delete ret.password;
    return ret;
  }
});

// Pre-save middleware
superAdminSchema.pre('save', function(next) {
  // Ensure email is lowercase
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Static methods
superAdminSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase(), deletedAt: null });
};

superAdminSchema.statics.findActive = function() {
  return this.findOne({ isActive: true, deletedAt: null });
};

// Instance methods
superAdminSchema.methods.isActiveAccount = function() {
  return this.isActive && !this.deletedAt;
};

superAdminSchema.methods.incrementLoginAttempts = async function() {
  // This will restart the function and avoid declaring unused variables
  return this.updateOne({ $inc: { loginAttempts: 1 } });
};

superAdminSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({ $set: { loginAttempts: 0, lockUntil: null } });
};

superAdminSchema.methods.canAccess = function(requiredPermission: string) {
  return this.permissions.includes(requiredPermission);
};

// Export SuperAdmin model with methods
export const SuperAdmin = mongoose.model<ISuperAdmin, ISuperAdminModel>('SuperAdmin', superAdminSchema);
