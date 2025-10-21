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
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  profile?: UserProfileData;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileData {
  avatar?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  dateFormat?: string;
  notifications: NotificationSettings;
}

export interface UserPreferences {
  theme: ThemeMode;
  dashboard: DashboardPreferences;
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

export type UserRole = 'super_admin' | 'tenant_admin' | 'user';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type ThemeMode = 'light' | 'dark' | 'system';

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
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  tenantDomain?: string;
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
