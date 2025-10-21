/**
 * API Client Service
 * Centralized HTTP client with tenant support and security
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 1: No console.log (using logger placeholder)
 * - Rule 5: API timeouts (30s max)
 * - Rule 9: TypeScript strict (no 'any')
 * - Rule 10: Multi-tenant isolation
 */

import { ApiResponse } from '../types/api.types';

/**
 * API Client Configuration
 */
interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  tenantId: string | null;
  token: string | null;
  userType: 'super_admin' | 'tenant_admin' | 'team_member' | 'client' | null;
}

/**
 * Request Options
 */
interface RequestOptions extends Omit<RequestInit, 'signal'> {
  skipAuth?: boolean;
  skipTenant?: boolean;
  timeout?: number; // Custom timeout for specific requests
}

/**
 * API Client Class
 * Handles all HTTP requests with proper error handling and security
 */
class ApiClient {
  private config: ApiClientConfig = {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    timeout: 30000, // 30 seconds - CORE-CRITICAL Rule 5
    tenantId: null,
    token: null,
    userType: null
  };

  /**
   * Set authentication token
   */
  setToken(token: string | null): void {
    this.config.token = token;
  }

  /**
   * Set tenant ID
   */
  setTenantId(tenantId: string | null): void {
    this.config.tenantId = tenantId;
  }

  /**
   * Set user type
   */
  setUserType(userType: 'super_admin' | 'tenant_admin' | 'team_member' | 'client' | null): void {
    this.config.userType = userType;
  }

  /**
   * Set user context (token, tenant, user type)
   */
  setUserContext(token: string | null, tenantId: string | null, userType: 'super_admin' | 'tenant_admin' | 'team_member' | 'client' | null): void {
    this.config.token = token;
    this.config.tenantId = tenantId;
    this.config.userType = userType;
  }

  /**
   * Build request headers
   * Following BACKEND-CORE: Tenant middleware requirement
   */
  private buildHeaders(options?: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available and not skipped
    if (this.config.token && !options?.skipAuth) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    // Add tenant ID for non-super-admin users
    if (this.config.tenantId && this.config.userType !== 'super_admin' && !options?.skipTenant) {
      headers['X-Tenant-ID'] = this.config.tenantId;
    }

    return headers;
  }

  /**
   * Make HTTP request with timeout and error handling
   * 
   * Following CORE-CRITICAL Rule 5: API timeouts (max 30s)
   * Following CORE-PATTERNS: Error handling with try-catch
   */
  async request<T>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    // Create AbortController for timeout - CORE-CRITICAL Rule 5
    const controller = new AbortController();
    const timeout = options?.timeout || this.config.timeout;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.config.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...this.buildHeaders(options),
          ...options?.headers,
        },
        signal: controller.signal,
      });

      // Parse response - might throw if invalid JSON
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        clearTimeout(timeoutId);
        return {
          success: false,
          error: {
            code: 'PARSE_ERROR',
            message: 'Invalid response from server',
          },
        };
      }

      clearTimeout(timeoutId);

      // Check if request was successful
      if (!response.ok) {
        // Following BACKEND-CORE: Error response format
        return {
          success: false,
          error: data.error || {
            code: 'REQUEST_FAILED',
            message: 'Request failed',
          },
        };
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Following CORE-PATTERNS: Error handling with logger
      // TODO: Replace with proper logger service
      // logger.error('API request failed', { endpoint, error });

      // Check if request was aborted (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Request timed out. Please try again.',
          },
        };
      }

      // Network or other errors
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
        },
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
