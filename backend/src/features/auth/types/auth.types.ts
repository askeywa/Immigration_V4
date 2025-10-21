/**
 * Authentication Types
 * Shared types for authentication system
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  role: UserRole;
  tenantId?: string;
  tenantName?: string;
  tenantDomain?: string;
  applicationType?: ApplicationType;
  applicationStatus?: ApplicationStatus;
  permissions: string[];
  specializations?: string[];
  isActive: boolean;
  lastLogin?: Date;
  profile?: UserProfileData;
  preferences?: UserPreferences;
}

export interface UserProfileData {
  avatar?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  dateFormat?: string;
  notifications?: NotificationSettings;
}

export interface UserPreferences {
  theme: ThemeMode;
  dashboard?: DashboardPreferences;
  notifications?: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface DashboardPreferences {
  layout: 'grid' | 'list';
  widgets: string[];
}

export type UserType = 'super_admin' | 'tenant_admin' | 'team_member' | 'client';
export type UserRole = 'super_admin' | 'admin' | 'visa_specialist' | 'work_permit_specialist' | 'case_manager' | 'client';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type ThemeMode = 'light' | 'dark' | 'system';
export type ApplicationType = 'visitor_visa' | 'study_visa' | 'work_permit' | 'permanent_residence' | 'family_sponsorship' | 'business_immigration';
export type ApplicationStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'in_progress';

export interface AuthResponse {
  success: boolean;
  data: {
    user: UserProfile;
    tokens: AuthTokens;
    message: string;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  tenantDomain?: string;
  rememberMe?: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantDomain?: string;
}

export interface RegisterDataWithConfirmation extends RegisterData {
  confirmPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  profile?: Partial<UserProfileData>;
  preferences?: Partial<UserPreferences>;
}
