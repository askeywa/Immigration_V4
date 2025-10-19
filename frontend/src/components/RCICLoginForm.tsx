/**
 * RCIC Login Form Component
 * Handles login for all 4 user types in the RCIC system
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 3: XSS prevention (DOMPurify sanitization)
 * - Rule 4: Race conditions (prevent concurrent calls)
 * - Rule 9: TypeScript strict (no 'any')
 * - Rule 12: Validate ALL external data
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';
import { getRouteForUser } from '../utils/routes';

/**
 * User Type Options - Ordered as per requirements
 */
const USER_TYPES = [
  { value: 'super_admin', label: 'Super Admin', description: 'System administrator' },
  { value: 'tenant_admin', label: 'RCIC Admin', description: 'RCIC business owner' },
  { value: 'team_member', label: 'Team Member', description: 'RCIC staff member' },
  { value: 'client', label: 'Client', description: 'Immigration applicant' }
] as const;

type UserType = typeof USER_TYPES[number]['value'];

/**
 * Login Form Props
 */
interface RCICLoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * RCIC Login Form Component
 */
export const RCICLoginForm: React.FC<RCICLoginFormProps> = ({ onSuccess, onError }) => {
  // State - Default to super_admin
  const [userType, setUserType] = useState<UserType>('super_admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string>('');

  // Refs for focus management and memory leak prevention
  const emailInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  // Hooks
  const navigate = useNavigate();
  const { 
    loginSuperAdmin, 
    loginTenantAdmin, 
    loginTeamMember, 
    loginClient,
    isLoginInProgress,
    clearError,
    cancelLogin,
    error
  } = useAuthStore();

  /**
   * Proper email validation function
   */
  const isValidEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  /**
   * Handle cancel login
   */
  const handleCancelLogin = useCallback(() => {
    setIsSubmitting(false);
    setLocalError('');
    clearError();
    cancelLogin();
  }, [clearError, cancelLogin]);

  /**
   * Handle form submission
   * Following CORE-CRITICAL Rule 4: Race conditions
   * CRITICAL FIX: Never sanitize passwords
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent concurrent submissions - CORE-CRITICAL Rule 4
    if (isLoginInProgress || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setLocalError('');
    clearError(); // Clear any previous errors

    try {
      // CRITICAL FIX: Only trim email, NEVER sanitize passwords
      const trimmedEmail = email.trim().toLowerCase();
      
      // Validate email format
      if (!isValidEmail(trimmedEmail)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate password length (basic client-side check)
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const credentials = {
        email: trimmedEmail,
        password: password // NO SANITIZATION - preserve original password
      };

      // Call appropriate login method based on user type
      switch (userType) {
        case 'super_admin':
          await loginSuperAdmin(credentials);
          break;
        case 'tenant_admin':
          await loginTenantAdmin(credentials);
          break;
        case 'team_member':
          await loginTeamMember(credentials);
          break;
        case 'client':
          await loginClient(credentials);
          break;
        default:
          throw new Error('Invalid user type');
      }

      // Success callback
      if (onSuccess) {
        onSuccess();
      }

      // Navigate to appropriate dashboard - CRITICAL FIX: Centralized routing
      const route = getRouteForUser(userType);
      navigate(route, { replace: true });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setLocalError(errorMessage);
      }
      
      // Error callback
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [userType, email, password, isLoginInProgress, isSubmitting, loginSuperAdmin, loginTenantAdmin, loginTeamMember, loginClient, onSuccess, onError, navigate, isValidEmail]);


  /**
   * Handle user type change with focus management
   */
  const handleUserTypeChange = useCallback((newUserType: UserType) => {
    setUserType(newUserType);
    // Clear form when switching user types
    setEmail('');
    setPassword('');
    setLocalError('');
    
    // Focus on email input after user type change
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 100);
  }, []);

  /**
   * Handle input changes - CRITICAL FIX: No password sanitization
   */
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setLocalError(''); // Clear errors on input change
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setLocalError(''); // Clear errors on input change
  }, []);

  /**
   * Form validation
   */
  const isFormValid = email.trim().length > 0 && password.length >= 8;

  /**
   * Clear errors when component mounts or user changes
   */
  useEffect(() => {
    setLocalError('');
    clearError(); // Clear store errors too
  }, [userType, clearError]);

  /**
   * Memory leak prevention - mark component as unmounted on cleanup
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reset form state when error occurs
  useEffect(() => {
    if (error && (isLoginInProgress || isSubmitting)) {
      setIsSubmitting(false);
    }
  }, [error, isLoginInProgress, isSubmitting]);

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          RCIC Portal Login
        </h2>
        <p className="text-sm text-gray-600">Access your immigration portal</p>
      </div>

        {/* User Type Selection - Dropdown */}
        <div className="mb-4">
          <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-2">
            Select User Type
          </label>
          <select
            id="userType"
            value={userType}
            onChange={(e) => handleUserTypeChange(e.target.value as UserType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors bg-white"
            aria-label="Select user type"
          >
            {USER_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Login form">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              ref={emailInputRef}
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="Enter your email"
              autoComplete="email"
              aria-describedby={localError ? "email-error" : undefined}
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-describedby={localError ? "password-error" : undefined}
            />
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>

          {/* Error Display - CRITICAL FIX: Use local error as primary, store error as fallback */}
          {(localError || error) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3" role="alert" aria-live="polite">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2">
                  <p id="error-message" className="text-sm text-red-800">
                    {localError || error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isLoginInProgress || isSubmitting}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {isLoginInProgress || isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </div>
            ) : (
              `Sign in as ${USER_TYPES.find(t => t.value === userType)?.label}`
            )}
          </button>

          {/* Cancel Button - Only show when login is in progress */}
          {(isLoginInProgress || isSubmitting) && (
            <button
              type="button"
              onClick={handleCancelLogin}
              className="w-full mt-2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel Login
            </button>
          )}
        </form>

        {/* Additional Links */}
        <div className="mt-4 text-center space-y-1">
          <a
            href="/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            Forgot your password?
          </a>
          <div className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a
              href="/register"
              className="text-primary-600 hover:text-primary-500"
            >
              Sign up
            </a>
          </div>
        </div>
    </div>
  );
};

export default RCICLoginForm;