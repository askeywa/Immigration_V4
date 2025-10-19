/**
 * Authentication Service
 * Handles all authentication-related API calls
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 9: TypeScript strict (no 'any')
 * - Rule 3: XSS prevention (sanitization)
 * - Rule 5: API timeouts (via apiClient)
 */

import DOMPurify from 'dompurify';
import { apiClient } from './api-client';
import {
  RegisterCredentials,
  AuthResponse,
  UserData,
  PasswordResetRequest,
  PasswordResetData,
  ApiResponse
} from '../types/api.types';

/**
 * Authentication Service
 */
export class AuthService {
  /**
   * Super Admin Login
   * 
   * @param credentials - Login credentials
   * @returns Auth response with user and tokens
   */
  static async loginSuperAdmin(credentials: { email: string; password: string }): Promise<ApiResponse<AuthResponse>> {
    // XSS Prevention - CORE-CRITICAL Rule 3
    const sanitizedEmail = DOMPurify.sanitize(credentials.email.trim());

    return apiClient.post<AuthResponse>('/api/v1/auth/login/super-admin', {
      email: sanitizedEmail.toLowerCase(),
      password: credentials.password
    }, { timeout: 10000 }); // 10 second timeout for login
  }

  /**
   * Tenant Admin Login
   * 
   * @param credentials - Login credentials
   * @returns Auth response with user and tokens
   */
  static async loginTenantAdmin(credentials: { email: string; password: string }): Promise<ApiResponse<AuthResponse>> {
    // XSS Prevention - CORE-CRITICAL Rule 3
    const sanitizedEmail = DOMPurify.sanitize(credentials.email.trim());

    return apiClient.post<AuthResponse>('/api/v1/auth/login/tenant-admin', {
      email: sanitizedEmail.toLowerCase(),
      password: credentials.password
    }, { timeout: 10000 }); // 10 second timeout for login
  }

  /**
   * Team Member Login
   * 
   * @param credentials - Login credentials
   * @returns Auth response with user and tokens
   */
  static async loginTeamMember(credentials: { email: string; password: string }): Promise<ApiResponse<AuthResponse>> {
    // XSS Prevention - CORE-CRITICAL Rule 3
    const sanitizedEmail = DOMPurify.sanitize(credentials.email.trim());

    return apiClient.post<AuthResponse>('/api/v1/auth/login/team-member', {
      email: sanitizedEmail.toLowerCase(),
      password: credentials.password
    }, { timeout: 10000 }); // 10 second timeout for login
  }

  /**
   * Client Login
   * 
   * @param credentials - Login credentials
   * @returns Auth response with user and tokens
   */
  static async loginClient(credentials: { email: string; password: string }): Promise<ApiResponse<AuthResponse>> {
    // XSS Prevention - CORE-CRITICAL Rule 3
    const sanitizedEmail = DOMPurify.sanitize(credentials.email.trim());

    return apiClient.post<AuthResponse>('/api/v1/auth/login/client', {
      email: sanitizedEmail.toLowerCase(),
      password: credentials.password
    }, { timeout: 10000 }); // 10 second timeout for login
  }

  /**
   * Register new user
   * 
   * @param credentials - Registration credentials
   * @returns Auth response with user and tokens
   */
  static async register(credentials: RegisterCredentials): Promise<ApiResponse<AuthResponse>> {
    // XSS Prevention - CORE-CRITICAL Rule 3
    const sanitizedEmail = DOMPurify.sanitize(credentials.email.trim());
    const sanitizedFirstName = DOMPurify.sanitize(credentials.firstName.trim());
    const sanitizedLastName = DOMPurify.sanitize(credentials.lastName.trim());

    return apiClient.post<AuthResponse>('/api/v1/auth/register', {
      email: sanitizedEmail.toLowerCase(),
      password: credentials.password,
      confirmPassword: credentials.confirmPassword,
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      tenantDomain: credentials.tenantDomain
    });
  }

  /**
   * Get current user profile
   * 
   * @returns User profile data
   */
  static async getProfile(): Promise<ApiResponse<{ user: UserData }>> {
    return apiClient.get<{ user: UserData }>('/api/v1/auth/profile');
  }

  /**
   * Update user profile
   * 
   * @param updateData - Profile update data
   * @returns Updated user data
   */
  static async updateProfile(updateData: Partial<UserData>): Promise<ApiResponse<{ user: UserData }>> {
    // Sanitize text inputs
    const sanitizedData = { ...updateData };
    if (sanitizedData.firstName) {
      sanitizedData.firstName = DOMPurify.sanitize(sanitizedData.firstName.trim());
    }
    if (sanitizedData.lastName) {
      sanitizedData.lastName = DOMPurify.sanitize(sanitizedData.lastName.trim());
    }

    return apiClient.put<{ user: UserData }>('/api/v1/auth/profile', sanitizedData);
  }

  /**
   * Refresh access token
   * 
   * @param refreshToken - Refresh token
   * @returns New tokens
   */
  static async refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    return apiClient.post<{ accessToken: string; refreshToken: string }>(
      '/api/v1/auth/refresh',
      { refreshToken }
    );
  }

  /**
   * Request password reset
   * 
   * @param email - User email
   * @returns Success message
   */
  static async forgotPassword(data: PasswordResetRequest): Promise<ApiResponse<{ message: string }>> {
    const sanitizedEmail = DOMPurify.sanitize(data.email.trim());

    return apiClient.post<{ message: string }>('/api/v1/auth/forgot-password', {
      email: sanitizedEmail.toLowerCase()
    });
  }

  /**
   * Reset password with token
   * 
   * @param data - Reset data with token and new password
   * @returns Success message
   */
  static async resetPassword(data: PasswordResetData): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/api/v1/auth/reset-password', {
      token: data.token,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword
    });
  }

  /**
   * Verify email with token
   * 
   * @param token - Verification token
   * @returns Success message
   */
  static async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/api/v1/auth/verify-email', {
      token
    });
  }

  /**
   * Logout user
   * 
   * @returns Success message
   */
  static async logout(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/api/v1/auth/logout');
  }
}
