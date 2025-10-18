/**
 * API Type Definitions
 * Shared types for API communication
 * 
 * Following CORE-CRITICAL Rule 9: TypeScript Strict - NO SHORTCUTS
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface LoginCredentials {
  email: string;
  password: string;
  userType: 'super_admin' | 'tenant_admin' | 'team_member' | 'client';
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  tenantDomain?: string;
}

export interface AuthResponse {
  user: UserData;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  message: string;
}

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'super_admin' | 'tenant_admin' | 'team_member' | 'client';
  role: 'super_admin' | 'admin' | 'visa_specialist' | 'work_permit_specialist' | 'case_manager' | 'client';
  tenantId?: string;
  tenantName?: string;
  tenantDomain?: string;
  applicationType?: 'visitor_visa' | 'study_visa' | 'work_permit' | 'permanent_residence' | 'family_sponsorship' | 'business_immigration';
  applicationStatus?: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'in_progress';
  permissions: string[];
  specializations?: string[];
  isActive: boolean;
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
  emailVerified?: boolean;
  lastLogin?: string;
  profile?: {
    avatar?: string;
    phone?: string;
    timezone?: string;
    language?: string;
    dateOfBirth?: string;
    nationality?: string;
    address?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// RCIC System Types
export interface TenantData {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  maxTeamMembers: number;
  maxClients: number;
  features: {
    visitorVisa: boolean;
    studyVisa: boolean;
    workPermit: boolean;
    permanentResidence: boolean;
    familySponsorship: boolean;
    businessImmigration: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberData {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'visa_specialist' | 'work_permit_specialist' | 'admin' | 'case_manager';
  specializations: string[];
  permissions: string[];
  isActive: boolean;
  lastLogin?: string;
  profile?: {
    phone?: string;
    department?: string;
    employeeId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ClientData {
  id: string;
  tenantId: string;
  assignedTo?: string;
  email: string;
  firstName: string;
  lastName: string;
  applicationType: 'visitor_visa' | 'study_visa' | 'work_permit' | 'permanent_residence' | 'family_sponsorship' | 'business_immigration';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  application: {
    type: string;
    status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'in_progress';
    submittedAt?: string;
    documents: string[];
    notes?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  };
  profile?: {
    phone?: string;
    dateOfBirth?: string;
    nationality?: string;
    address?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationData {
  id: string;
  clientId: string;
  type: 'visitor_visa' | 'study_visa' | 'work_permit' | 'permanent_residence' | 'family_sponsorship' | 'business_immigration';
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'in_progress';
  submittedAt?: string;
  documents: string[];
  notes?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

export interface DocumentData {
  id: string;
  clientId: string;
  applicationId?: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
}
