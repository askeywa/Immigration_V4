import mongoose, { Schema } from 'mongoose';
import crypto from 'crypto';
import { Mutex } from 'async-mutex';
import { IBaseModel, baseSchemaOptions, softDeletePlugin } from './base.model';

// Mutex for hash chain to prevent concurrent write issues
const hashMutex = new Mutex();

/**
 * AuditLog Model Interface
 * Tracks all sensitive operations for security and compliance
 */
export interface IAuditLog extends IBaseModel {
  userId?: mongoose.Types.ObjectId;
  tenantId?: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  ipAddress: string;
  userAgent: string;
  statusCode: number;
  requestBody?: any;
  responseData?: any;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  metadata: {
    sessionId?: string;
    requestId?: string;
    duration?: number;
    userRole?: string;
    tenantDomain?: string;
    browserInfo?: {
      name?: string;
      version?: string;
      os?: string;
      device?: string;
    };
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'auth' | 'user_management' | 'tenant_management' | 'data_access' | 'security' | 'system';
  hash: string;
  previousHash?: string;
}

/**
 * AuditLog Schema
 */
const auditLogSchema = new Schema<IAuditLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true,
    maxlength: 100
  },
  resource: {
    type: String,
    required: true,
    index: true,
    maxlength: 100
  },
  resourceId: {
    type: String,
    index: true,
    maxlength: 100
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    maxlength: 500,
    index: true
  },
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String,
    required: true,
    maxlength: 1000
  },
  statusCode: {
    type: Number,
    required: true,
    index: true
  },
  requestBody: {
    type: Schema.Types.Mixed
  },
  responseData: {
    type: Schema.Types.Mixed
  },
  error: {
    message: String,
    stack: String,
    code: String
  },
  metadata: {
    sessionId: String,
    requestId: String,
    duration: Number,
    userRole: String,
    tenantDomain: String,
    browserInfo: {
      name: String,
      version: String,
      os: String,
      device: String
    }
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['auth', 'user_management', 'tenant_management', 'data_access', 'security', 'system'],
    required: true,
    index: true
  },
  hash: {
    type: String,
    required: false, // Made optional for backward compatibility
    index: true
  },
  previousHash: {
    type: String,
    required: false
  }
}, baseSchemaOptions);

// Apply soft delete plugin
auditLogSchema.plugin(softDeletePlugin);

// Optimized compound indexes for performance
auditLogSchema.index({ tenantId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, category: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, category: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ statusCode: 1, createdAt: -1 });
auditLogSchema.index({ ipAddress: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 }); // For time-based queries

// Compliance-appropriate retention (1 year minimum)
// Configure via environment variable
const AUDIT_RETENTION_DAYS = process.env.AUDIT_RETENTION_DAYS 
  ? parseInt(process.env.AUDIT_RETENTION_DAYS) 
  : 365; // Default 1 year

auditLogSchema.index(
  { createdAt: 1 }, 
  { expireAfterSeconds: AUDIT_RETENTION_DAYS * 24 * 60 * 60 }
);

// Pre-save hook to generate hash for integrity verification (with mutex lock)
auditLogSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Acquire lock to prevent concurrent hash calculation
    const release = await hashMutex.acquire();
    
    try {
      // Get previous log's hash for chaining
      const AuditLogModel = this.constructor as any;
      const previousLog = await AuditLogModel.findOne()
        .sort({ createdAt: -1 })
        .select('hash');
      
      this.previousHash = previousLog?.hash || '0';
      
      // Generate hash of current log
      const data = JSON.stringify({
        userId: this.userId,
        action: this.action,
        resource: this.resource,
        timestamp: this.createdAt,
        previousHash: this.previousHash
      });
      
      this.hash = crypto
        .createHash('sha256')
        .update(data)
        .digest('hex');
    } finally {
      release();
    }
  }
  next();
});

// Virtual for success status
auditLogSchema.virtual('isSuccess').get(function() {
  return this.statusCode >= 200 && this.statusCode < 400;
});

auditLogSchema.virtual('isError').get(function() {
  return this.statusCode >= 400;
});

// Ensure virtual fields are serialized
auditLogSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Static methods
auditLogSchema.statics.findByUser = function(userId: string, limit = 100) {
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return this.find({ _id: null }); // Return empty
  }
  
  return this.find({ 
    userId: new mongoose.Types.ObjectId(userId), 
    deletedAt: null 
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 1000)) // Cap maximum
    .populate('tenantId', 'name domain')
    .lean();
};

auditLogSchema.statics.findByTenant = function(tenantId: string, limit = 100) {
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(tenantId)) {
    return this.find({ _id: null }); // Return empty
  }
  
  return this.find({ 
    tenantId: new mongoose.Types.ObjectId(tenantId), 
    deletedAt: null 
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 1000)) // Cap maximum
    .populate('userId', 'email firstName lastName')
    .lean();
};

auditLogSchema.statics.findByAction = function(action: string, limit = 100) {
  // Validate action input
  if (!action || typeof action !== 'string' || action.length > 100) {
    return this.find({ _id: null }); // Return empty
  }
  
  // Use exact string match, not variable
  return this.find({ 
    action: { $eq: action }, // Force exact match
    deletedAt: null 
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 1000)) // Cap maximum
    .populate('userId', 'email firstName lastName')
    .populate('tenantId', 'name domain')
    .lean();
};

auditLogSchema.statics.findBySeverity = function(severity: string, limit = 100) {
  // Validate severity input
  const validSeverities = ['low', 'medium', 'high', 'critical'];
  if (!severity || !validSeverities.includes(severity)) {
    return this.find({ _id: null }); // Return empty
  }
  
  return this.find({ 
    severity: { $eq: severity }, // Force exact match
    deletedAt: null 
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 1000)) // Cap maximum
    .populate('userId', 'email firstName lastName')
    .populate('tenantId', 'name domain')
    .lean();
};

auditLogSchema.statics.findFailedLogins = function(limit = 100) {
  // Use exact string match, not variable
  return this.find({ 
    action: { $eq: 'login_attempt' }, // Force exact match
    statusCode: { $gte: 400 },
    deletedAt: null 
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 1000)) // Cap maximum
    .populate('userId', 'email firstName lastName')
    .populate('tenantId', 'name domain')
    .select('-requestBody -responseData') // Don't return sensitive data
    .lean();
};

auditLogSchema.statics.findSecurityEvents = function(limit = 100) {
  return this.find({ 
    category: { $eq: 'security' }, // Force exact match
    severity: { $in: ['high', 'critical'] },
    deletedAt: null 
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 1000)) // Cap maximum
    .populate('userId', 'email firstName lastName')
    .populate('tenantId', 'name domain')
    .select('-requestBody -responseData') // Don't return sensitive data
    .lean();
};

// Instance methods
auditLogSchema.methods.markAsResolved = function() {
  this.deletedAt = new Date();
  return this.save();
};

auditLogSchema.methods.addMetadata = function(key: string, value: any) {
  this.metadata = { ...this.metadata, [key]: value };
  return this.save();
};

// Method to verify integrity
auditLogSchema.methods.verifyIntegrity = async function() {
  const expectedHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({
      userId: this.userId,
      action: this.action,
      resource: this.resource,
      timestamp: this.createdAt,
      previousHash: this.previousHash
    }))
    .digest('hex');
  
  return this.hash === expectedHash;
};

// Static method to verify entire chain
auditLogSchema.statics.verifyChain = async function(limit = 1000) {
  const logs = await this.find()
    .sort({ createdAt: 1 })
    .limit(limit);
  
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const isValid = await log.verifyIntegrity();
    
    if (!isValid) {
      return {
        valid: false,
        corruptedLog: log._id,
        index: i
      };
    }
    
    // Verify chain link
    if (i > 0 && log.previousHash !== logs[i - 1].hash) {
      return {
        valid: false,
        corruptedLog: log._id,
        brokenChain: true
      };
    }
  }
  
  return { valid: true, verified: logs.length };
};

// Archive old logs (for compliance)
auditLogSchema.statics.getOldLogs = async function(daysOld: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return await this.find({
    createdAt: { $lt: cutoffDate },
    deletedAt: null
  })
    .sort({ createdAt: 1 })
    .lean();
};

// Count logs by age
auditLogSchema.statics.countLogsByAge = async function() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  
  const [total, last30Days, last90Days, lastYear] = await Promise.all([
    this.countDocuments({ deletedAt: null }),
    this.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, deletedAt: null }),
    this.countDocuments({ createdAt: { $gte: ninetyDaysAgo }, deletedAt: null }),
    this.countDocuments({ createdAt: { $gte: oneYearAgo }, deletedAt: null })
  ]);
  
  return {
    total,
    last30Days,
    last90Days,
    lastYear,
    olderThanYear: total - lastYear
  };
};

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
