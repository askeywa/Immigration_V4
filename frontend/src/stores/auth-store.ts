/**
 * Authentication Store
 * Zustand store for auth state management
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 7: No direct store access (use hooks)
 * - Rule 9: TypeScript strict (no 'any')
 * - Rule 4: Race conditions (prevent concurrent calls)
 */

import { create } from 'zustand';
import { AuthService } from '../services/auth.service';
import { apiClient } from '../services/api-client';
import { RegisterCredentials, UserData } from '../types/api.types';
import { TenantBranding } from '../types/tenant-branding.types';
import { getTenantBranding, applyTenantBrandingToPage } from '../services/tenant-branding.service';

/**
 * Auth Store State Interface
 */
interface AuthState {
  // State
  user: UserData | null;
  token: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tenantBranding: TenantBranding | null;
  isInitialized: boolean; // Track if auth has been initialized

  // In-flight request tracking - CORE-CRITICAL Rule 4: Race conditions
  isLoginInProgress: boolean;
  isRegisterInProgress: boolean;

  // Actions
  loginSuperAdmin: (credentials: { email: string; password: string }) => Promise<void>;
  loginTenantAdmin: (credentials: { email: string; password: string }) => Promise<void>;
  loginTeamMember: (credentials: { email: string; password: string }) => Promise<void>;
  loginClient: (credentials: { email: string; password: string }) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  clearError: () => void;
  cancelLogin: () => void;
  setUser: (user: UserData | null) => void;
  initializeAuth: () => Promise<void>;
  loadTenantBranding: () => Promise<void>;
}

/**
 * Auth Store
 * 
 * Following CORE-CRITICAL Rule 7: Use hooks, not direct store access
 * Usage: const { user, login, logout } = useAuthStore();
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  refreshToken: null,
  tenantId: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  tenantBranding: null,
  isInitialized: false,
  isLoginInProgress: false,
  isRegisterInProgress: false,

  /**
   * Super Admin Login
   * Following CORE-CRITICAL Rule 4: Prevent race conditions
   */
  loginSuperAdmin: async (credentials: { email: string; password: string }) => {
    // Prevent concurrent login requests - CORE-CRITICAL Rule 4
    if (get().isLoginInProgress) {
      return;
    }

    set({ isLoginInProgress: true, isLoading: true, error: null });

    try {
      const response = await AuthService.loginSuperAdmin(credentials);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Login failed');
      }

      const { user, tokens } = response.data;

      // Store tokens securely - handle storage quota errors
      try {
        localStorage.setItem('auth_token', tokens.accessToken);
        localStorage.setItem('refresh_token', tokens.refreshToken);
        localStorage.setItem('last_activity', Date.now().toString());
      } catch (storageError) {
        // Storage quota exceeded or disabled
        throw new Error('Unable to save authentication data. Please check browser storage settings.');
      }

      // Update API client with user context
      apiClient.setUserContext(tokens.accessToken, user.tenantId || null, user.userType);

      set({
        user,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tenantId: user.tenantId || null,
        isAuthenticated: true,
        isLoading: false,
        isLoginInProgress: false,
        error: null,
      });
    } catch (error) {
      let errorMessage = 'Login failed';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Login request timed out. Please check your connection and try again.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else if (error.message.includes('Invalid credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('User not found')) {
          errorMessage = 'No account found with this email address.';
        } else if (error.message.includes('Wrong user type')) {
          errorMessage = 'This account type cannot login here. Please select the correct user type.';
        } else {
          errorMessage = error.message;
        }
      }
      
      set({
        error: errorMessage,
        isLoading: false,
        isLoginInProgress: false,
      });
      throw error;
    }
  },

  /**
   * Tenant Admin Login
   * Following CORE-CRITICAL Rule 4: Prevent race conditions
   */
  loginTenantAdmin: async (credentials: { email: string; password: string }) => {
    // Prevent concurrent login requests - CORE-CRITICAL Rule 4
    if (get().isLoginInProgress) {
      return;
    }

    set({ isLoginInProgress: true, isLoading: true, error: null });

    try {
      const response = await AuthService.loginTenantAdmin(credentials);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Login failed');
      }

      const { user, tokens } = response.data;

      // Store tokens securely - handle storage quota errors
      try {
        localStorage.setItem('auth_token', tokens.accessToken);
        localStorage.setItem('refresh_token', tokens.refreshToken);
        localStorage.setItem('last_activity', Date.now().toString());
      } catch (storageError) {
        // Storage quota exceeded or disabled
        throw new Error('Unable to save authentication data. Please check browser storage settings.');
      }

      // Update API client with user context
      apiClient.setUserContext(tokens.accessToken, user.tenantId || null, user.userType);

      set({
        user,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tenantId: user.tenantId || null,
        isAuthenticated: true,
        isLoading: false,
        isLoginInProgress: false,
        error: null,
      });

      // DISABLED: Tenant branding now loaded by useTenantBranding() hook in App.tsx
      // await get().loadTenantBranding();
    } catch (error) {
      let errorMessage = 'Login failed';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Login request timed out. Please check your connection and try again.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else if (error.message.includes('Invalid credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('User not found')) {
          errorMessage = 'No account found with this email address.';
        } else if (error.message.includes('Wrong user type')) {
          errorMessage = 'This account type cannot login here. Please select the correct user type.';
        } else {
          errorMessage = error.message;
        }
      }
      
      set({
        error: errorMessage,
        isLoading: false,
        isLoginInProgress: false,
      });
      throw error;
    }
  },

  /**
   * Team Member Login
   * Following CORE-CRITICAL Rule 4: Prevent race conditions
   */
  loginTeamMember: async (credentials: { email: string; password: string }) => {
    // Prevent concurrent login requests - CORE-CRITICAL Rule 4
    if (get().isLoginInProgress) {
      return;
    }

    set({ isLoginInProgress: true, isLoading: true, error: null });

    try {
      const response = await AuthService.loginTeamMember(credentials);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Login failed');
      }

      const { user, tokens } = response.data;

      // Store tokens securely - handle storage quota errors
      try {
        localStorage.setItem('auth_token', tokens.accessToken);
        localStorage.setItem('refresh_token', tokens.refreshToken);
        localStorage.setItem('last_activity', Date.now().toString());
      } catch (storageError) {
        // Storage quota exceeded or disabled
        throw new Error('Unable to save authentication data. Please check browser storage settings.');
      }

      // Update API client with user context
      apiClient.setUserContext(tokens.accessToken, user.tenantId || null, user.userType);

      set({
        user,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tenantId: user.tenantId || null,
        isAuthenticated: true,
        isLoading: false,
        isLoginInProgress: false,
        error: null,
      });

      // DISABLED: Tenant branding now loaded by useTenantBranding() hook in App.tsx
      // await get().loadTenantBranding();
    } catch (error) {
      let errorMessage = 'Login failed';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Login request timed out. Please check your connection and try again.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else if (error.message.includes('Invalid credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('User not found')) {
          errorMessage = 'No account found with this email address.';
        } else if (error.message.includes('Wrong user type')) {
          errorMessage = 'This account type cannot login here. Please select the correct user type.';
        } else {
          errorMessage = error.message;
        }
      }
      
      set({
        error: errorMessage,
        isLoading: false,
        isLoginInProgress: false,
      });
      throw error;
    }
  },

  /**
   * Client Login
   * Following CORE-CRITICAL Rule 4: Prevent race conditions
   */
  loginClient: async (credentials: { email: string; password: string }) => {
    // Prevent concurrent login requests - CORE-CRITICAL Rule 4
    if (get().isLoginInProgress) {
      return;
    }

    set({ isLoginInProgress: true, isLoading: true, error: null });

    try {
      const response = await AuthService.loginClient(credentials);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Login failed');
      }

      const { user, tokens } = response.data;

      // Store tokens securely - handle storage quota errors
      try {
        localStorage.setItem('auth_token', tokens.accessToken);
        localStorage.setItem('refresh_token', tokens.refreshToken);
        localStorage.setItem('last_activity', Date.now().toString());
      } catch (storageError) {
        // Storage quota exceeded or disabled
        throw new Error('Unable to save authentication data. Please check browser storage settings.');
      }

      // Update API client with user context
      apiClient.setUserContext(tokens.accessToken, user.tenantId || null, user.userType);

      set({
        user,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tenantId: user.tenantId || null,
        isAuthenticated: true,
        isLoading: false,
        isLoginInProgress: false,
        error: null,
      });

      // DISABLED: Tenant branding now loaded by useTenantBranding() hook in App.tsx
      // await get().loadTenantBranding();
    } catch (error) {
      let errorMessage = 'Login failed';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Login request timed out. Please check your connection and try again.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else if (error.message.includes('Invalid credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('User not found')) {
          errorMessage = 'No account found with this email address.';
        } else if (error.message.includes('Wrong user type')) {
          errorMessage = 'This account type cannot login here. Please select the correct user type.';
        } else {
          errorMessage = error.message;
        }
      }
      
      set({
        error: errorMessage,
        isLoading: false,
        isLoginInProgress: false,
      });
      throw error;
    }
  },

  /**
   * Register new user
   * Following CORE-CRITICAL Rule 4: Prevent race conditions
   */
  register: async (credentials: RegisterCredentials) => {
    // Prevent concurrent registration requests - CORE-CRITICAL Rule 4
    if (get().isRegisterInProgress) {
      return;
    }

    set({ isRegisterInProgress: true, isLoading: true, error: null });

    try {
      const response = await AuthService.register(credentials);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Registration failed');
      }

      const { user, tokens } = response.data;

      // Store tokens securely - handle storage quota errors
      try {
        localStorage.setItem('auth_token', tokens.accessToken);
        localStorage.setItem('refresh_token', tokens.refreshToken);
        localStorage.setItem('last_activity', Date.now().toString());
      } catch (storageError) {
        // Storage quota exceeded or disabled
        throw new Error('Unable to save authentication data. Please check browser storage settings.');
      }

      // Update API client
      apiClient.setToken(tokens.accessToken);

      set({
        user,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        isRegisterInProgress: false,
        error: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Registration failed',
        isLoading: false,
        isRegisterInProgress: false,
      });
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      // Log error but still clear local state
      // TODO: Replace with proper logger
      // logger.error('Logout request failed', { error });
    } finally {
      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('last_activity');

      // Clear API client
      apiClient.setToken(null);
      apiClient.setTenantId(null);

      // Reset tenant branding (simplified - no dynamic colors)
      // No need to reset branding since we use unified theme

      // Reset state
      set({
        user: null,
        token: null,
        refreshToken: null,
        tenantId: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        tenantBranding: null,
        isInitialized: true, // Mark as initialized so we don't auto-login
      });
    }
  },

  /**
   * Refresh access token
   */
  refreshAccessToken: async () => {
    const { refreshToken } = get();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await AuthService.refreshToken(refreshToken);

      if (!response.success || !response.data) {
        throw new Error('Token refresh failed');
      }

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Update tokens - handle storage errors
      try {
        localStorage.setItem('auth_token', accessToken);
        localStorage.setItem('refresh_token', newRefreshToken);
      } catch (storageError) {
        // Storage quota exceeded - logout user
        get().logout();
        throw new Error('Unable to save tokens. Storage quota exceeded.');
      }

      // Update API client
      apiClient.setToken(accessToken);

      set({
        token: accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      // Token refresh failed, logout user
      get().logout();
      throw error;
    }
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Cancel login attempt
   */
  cancelLogin: () => {
    set({
      isLoginInProgress: false,
      isLoading: false,
      error: 'Login cancelled by user'
    });
  },

  /**
   * Set user data
   */
  setUser: (user: UserData | null) => {
    set({ user });
  },

  /**
   * Initialize auth from localStorage
   * Call this on app startup
   * SECURITY: Only auto-login if user was recently active (within session)
   */
  initializeAuth: async () => {
    const token = localStorage.getItem('auth_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const lastActivity = localStorage.getItem('last_activity');

    // Check if session is still valid (within 24 hours)
    const isSessionValid = lastActivity && 
      (Date.now() - parseInt(lastActivity)) < (24 * 60 * 60 * 1000);

    if (!token || !isSessionValid) {
      // Clear invalid session
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('last_activity');
      set({ isInitialized: true });
      return;
    }

    // Set token in API client
    apiClient.setToken(token);

    set({ token, refreshToken, isLoading: true });

    try {
      // Fetch user profile to verify token
      const response = await AuthService.getProfile();

      if (!response.success || !response.data) {
        throw new Error('Token validation failed');
      }

      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      // Token is invalid, clear everything
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('last_activity');
      apiClient.setToken(null);

      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  /**
   * Load Tenant Branding
   * Loads and applies tenant branding for tenant users
   */
  loadTenantBranding: async () => {
    try {
      const { user, tenantId } = get();
      
      // Only load branding for tenant users (not super admin)
      if (!user || !tenantId || user.userType === 'super_admin') {
        return;
      }

      const response = await getTenantBranding();
      
      if (response.success && response.data) {
        set({ tenantBranding: response.data });
        
        // Apply branding to the page
        applyTenantBrandingToPage(response.data);
        
        console.log('Tenant branding loaded successfully', { 
          tenantId 
        });
      }
    } catch (error) {
      console.error('Failed to load tenant branding:', error);
      // Don't throw error - branding is optional
    }
  },
}));
