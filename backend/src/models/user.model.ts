import mongoose, { Schema } from 'mongoose';
import { IBaseModel, baseSchemaOptions, softDeletePlugin } from './base.model';

/**
 * User Model Interface
 * Represents a client (end user) in the RCIC system
 */
export interface IUser extends IBaseModel {
  tenantId: mongoose.Types.ObjectId; // REQUIRED - clients belong to one tenant
  assignedTo?: mongoose.Types.ObjectId; // team member who handles this client
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  applicationType: 'visitor_visa' | 'study_visa' | 'work_permit' | 'permanent_residence' | 'family_sponsorship' | 'business_immigration';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  profile: {
    avatar?: string;
    phone?: string;
    timezone?: string;
    language?: string;
    dateFormat?: string;
    dateOfBirth?: Date;
    nationality?: string;
    address?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  application: {
    type: string;
    status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'in_progress';
    submittedAt?: Date;
    documents: string[];
    notes?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
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
    signupSource?: string;
    lastIpAddress?: string;
    userAgent?: string;
    timezone?: string;
    referralSource?: string;
  };
  
  // Virtual properties
  isLocked: boolean;
  fullName: string;
  
  // Instance methods
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  isActive(): boolean;
  canAccess(requiredPermission: string): boolean;
}

/**
 * User Model Statics
 */
export interface IUserModel extends mongoose.Model<IUser> {
  findByEmail(email: string, tenantId?: string): Promise<(mongoose.Document<unknown, {}, IUser> & IUser) | null>;
  findActiveUsers(tenantId?: string): Promise<(mongoose.Document<unknown, {}, IUser> & IUser)[]>;
  findByTenant(tenantId: string): Promise<(mongoose.Document<unknown, {}, IUser> & IUser)[]>;
  findByAssignedTo(assignedTo: string): Promise<(mongoose.Document<unknown, {}, IUser> & IUser)[]>;
}

/**
 * User Schema
 */
const userSchema = new Schema<IUser>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'TenantTeamMember',
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
  applicationType: {
    type: String,
    enum: ['visitor_visa', 'study_visa', 'work_permit', 'permanent_residence', 'family_sponsorship', 'business_immigration'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'pending',
    index: true
  },
  emailVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
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
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY',
      enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']
    },
    dateOfBirth: Date,
    nationality: String,
    address: String,
    emergencyContact: {
      name: String,
      phone: {
        type: String,
        match: [/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format']
      },
      relationship: String
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
  application: {
    type: {
      type: String,
      enum: ['visitor_visa', 'study_visa', 'work_permit', 'permanent_residence', 'family_sponsorship', 'business_immigration'],
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'in_review', 'approved', 'rejected', 'in_progress'],
      default: 'draft'
    },
    submittedAt: Date,
    documents: [String],
    notes: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    }
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
    signupSource: String,
    lastIpAddress: String,
    userAgent: String,
    timezone: String,
    referralSource: String
  }
}, baseSchemaOptions);

// Apply soft delete plugin
userSchema.plugin(softDeletePlugin);

// Indexes for performance
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, status: 1 });
userSchema.index({ tenantId: 1, applicationType: 1 });
userSchema.index({ assignedTo: 1, status: 1 });
userSchema.index({ emailVerified: 1, status: 1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ createdAt: -1 });

// PERFORMANCE FIX: Compound indexes for analytics and filtering
userSchema.index({ tenantId: 1, deletedAt: 1, status: 1 });
userSchema.index({ tenantId: 1, deletedAt: 1, applicationType: 1 });
userSchema.index({ tenantId: 1, assignedTo: 1, deletedAt: 1 });
userSchema.index({ 'application.status': 1, tenantId: 1, deletedAt: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    // Never return password or sensitive fields
    delete ret.password;
    delete ret.emailVerificationToken;
    delete ret.passwordResetToken;
    delete ret.mfa?.secret;
    delete ret.mfa?.backupCodes;
    return ret;
  }
});

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Ensure email is lowercase
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Static methods
userSchema.statics.findByEmail = function(email: string, tenantId?: string) {
  const query: any = { email: email.toLowerCase(), deletedAt: null };
  if (tenantId) {
    query.tenantId = tenantId;
  }
  return this.findOne(query);
};

userSchema.statics.findActiveUsers = function(tenantId?: string) {
  const query: any = { status: 'active', deletedAt: null };
  if (tenantId) {
    query.tenantId = tenantId;
  }
  return this.find(query);
};

userSchema.statics.findByTenant = function(tenantId: string) {
  return this.find({ tenantId, deletedAt: null })
    .populate('assignedTo', 'firstName lastName email role');
};

userSchema.statics.findByAssignedTo = function(assignedTo: string) {
  return this.find({ assignedTo, deletedAt: null })
    .populate('tenantId', 'name domain');
};

// Instance methods
userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) }; // 2 hours
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

userSchema.methods.isActive = function() {
  return this.status === 'active' && !this.isLocked;
};

userSchema.methods.canAccess = function(requiredPermission: string) {
  // Clients have basic permissions
  const clientPermissions = [
    'view_own_profile',
    'edit_own_profile',
    'view_own_applications',
    'upload_documents',
    'view_application_status'
  ];
  
  return clientPermissions.includes(requiredPermission);
};

// Export User model with methods
export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
