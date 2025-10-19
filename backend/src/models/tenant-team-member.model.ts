import mongoose, { Schema } from 'mongoose';
import { IBaseModel, baseSchemaOptions, softDeletePlugin } from './base.model';
import { config } from '../config/env.config';

/**
 * TenantTeamMember Model Interface
 * Represents team members within a tenant (RCIC)
 */
export interface ITenantTeamMember extends IBaseModel {
  tenantId: mongoose.Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'visa_specialist' | 'work_permit_specialist' | 'admin' | 'case_manager';
  specializations: string[];
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
    employeeId?: string;
    department?: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  metadata: {
    lastIpAddress?: string;
    userAgent?: string;
    timezone?: string;
  };
  
  // Virtual properties
  fullName: string;
  isLocked: boolean;
  
  // Instance methods
  isActiveAccount(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  canAccess(requiredPermission: string): boolean;
  canManageClients(): boolean;
}

/**
 * TenantTeamMember Model Statics
 */
export interface ITenantTeamMemberModel extends mongoose.Model<ITenantTeamMember> {
  findByEmail(email: string, tenantId?: string): Promise<(mongoose.Document<unknown, {}, ITenantTeamMember> & ITenantTeamMember) | null>;
  findByTenant(tenantId: string): Promise<(mongoose.Document<unknown, {}, ITenantTeamMember> & ITenantTeamMember)[]>;
  findActiveByTenant(tenantId: string): Promise<(mongoose.Document<unknown, {}, ITenantTeamMember> & ITenantTeamMember)[]>;
}

/**
 * TenantTeamMember Schema
 */
const tenantTeamMemberSchema = new Schema<ITenantTeamMember>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
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
    enum: ['visa_specialist', 'work_permit_specialist', 'admin', 'case_manager'],
    required: true,
    index: true
  },
  specializations: [{
    type: String,
    enum: [
      'visitor_visa',
      'study_visa',
      'work_permit',
      'lmia',
      'permanent_residence',
      'family_sponsorship',
      'refugee_claims',
      'citizenship',
      'business_immigration'
    ]
  }],
  permissions: [{
    type: String,
    enum: [
      'view_clients',
      'edit_clients',
      'delete_clients',
      'create_clients',
      'view_applications',
      'edit_applications',
      'delete_applications',
      'create_applications',
      'upload_documents',
      'download_documents',
      'view_reports',
      'manage_team',
      'manage_settings'
    ]
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
    },
    employeeId: String,
    department: String
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    }
  },
  metadata: {
    lastIpAddress: String,
    userAgent: String,
    timezone: String
  }
}, baseSchemaOptions);

// Apply soft delete plugin
tenantTeamMemberSchema.plugin(softDeletePlugin);

// Compound indexes for performance
tenantTeamMemberSchema.index({ tenantId: 1, email: 1 }, { unique: true });
tenantTeamMemberSchema.index({ tenantId: 1, isActive: 1 });
tenantTeamMemberSchema.index({ tenantId: 1, role: 1 });
tenantTeamMemberSchema.index({ email: 1 });
tenantTeamMemberSchema.index({ lastLogin: -1 });
tenantTeamMemberSchema.index({ createdAt: -1 });

// PERFORMANCE FIX: Compound indexes for analytics and common queries
tenantTeamMemberSchema.index({ tenantId: 1, deletedAt: 1, isActive: 1 });
tenantTeamMemberSchema.index({ tenantId: 1, deletedAt: 1, role: 1 });

// Virtual for full name
tenantTeamMemberSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for lock status
tenantTeamMemberSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Ensure virtual fields are serialized
tenantTeamMemberSchema.set('toJSON', {
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
tenantTeamMemberSchema.pre('save', function(next) {
  // Ensure email is lowercase
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Static methods
tenantTeamMemberSchema.statics.findByEmail = function(email: string, tenantId?: string) {
  const query: any = { email: email.toLowerCase(), deletedAt: null };
  if (tenantId) {
    query.tenantId = tenantId;
  }
  return this.findOne(query);
};

tenantTeamMemberSchema.statics.findByTenant = function(tenantId: string) {
  return this.find({ tenantId, deletedAt: null })
    .populate('tenantId', 'name domain status');
};

tenantTeamMemberSchema.statics.findActiveByTenant = function(tenantId: string) {
  return this.find({ tenantId, isActive: true, deletedAt: null })
    .populate('tenantId', 'name domain status');
};

// Instance methods
tenantTeamMemberSchema.methods.isActiveAccount = function() {
  return this.isActive && !this.deletedAt;
};

tenantTeamMemberSchema.methods.incrementLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // Lock account after configured failed attempts for configured duration
  if (this.loginAttempts + 1 >= config.TEAM_MEMBER_MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + config.TEAM_MEMBER_LOCKOUT_DURATION_MS) };
  }
  
  return this.updateOne(updates);
};

tenantTeamMemberSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

tenantTeamMemberSchema.methods.canAccess = function(requiredPermission: string) {
  return this.permissions.includes(requiredPermission);
};

tenantTeamMemberSchema.methods.canManageClients = function() {
  return this.role === 'admin' || 
         this.canAccess('create_clients') || 
         this.canAccess('edit_clients');
};

// Export TenantTeamMember model with methods
export const TenantTeamMember = mongoose.model<ITenantTeamMember, ITenantTeamMemberModel>('TenantTeamMember', tenantTeamMemberSchema);
