/**
 * User Document Types
 * Proper typing for Mongoose documents to avoid 'any' usage
 */

import { Document } from 'mongoose';

export interface UserDocument extends Document {
  // User properties
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  mfa: {
    enabled: boolean;
    secret?: string;
    backupCodes?: string[];
    verified: boolean;
  };
  profile: {
    avatar?: string;
    phone?: string;
    timezone?: string;
    language?: string;
    dateFormat?: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    dashboard: {
      layout: 'grid' | 'list';
      widgets: string[];
    };
  };
  metadata: {
    signupSource?: string;
    lastIpAddress?: string;
    userAgent?: string;
    timezone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  // Instance methods
  isActive(): boolean;
  isLocked: boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  canAccess(requiredRole: string): boolean;
}

export interface UserModel {
  findByEmail(email: string): Promise<UserDocument | null>;
  findActiveUsers(): Promise<UserDocument[]>;
}
