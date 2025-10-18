/**
 * Register Form Component
 * User registration with password confirmation and validation
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 3: XSS prevention (DOMPurify on input AND output)
 * - Rule 2: Memory leak prevention (cleanup)
 * - Rule 7: Use hooks (useAuthStore)
 * - Rule 13: Trust boundaries (validate all external data)
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { 
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/auth-store';
import { RegisterCredentials } from '../types/api.types';

/**
 * Register Form Props
 */
interface RegisterFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

/**
 * Register Form Component
 * 
 * Following CORE-PATTERNS: React component structure (7 steps)
 */
export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  redirectTo = '/dashboard',
}) => {
  // 1. State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // 2. Hooks
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  // 3. Memoized values
  const isFormValid = useMemo(() => {
    return (
      email.length > 0 &&
      password.length >= 8 &&
      confirmPassword.length >= 8 &&
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      acceptTerms
    );
  }, [email, password, confirmPassword, firstName, lastName, acceptTerms]);

  const passwordsMatch = useMemo(() => {
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const passwordStrength = useMemo(() => {
    if (password.length < 8) return { strength: 'weak', message: 'Too short' };
    
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const criteriaMet = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (criteriaMet < 2) return { strength: 'weak', message: 'Add uppercase, numbers, or special chars' };
    if (criteriaMet < 3) return { strength: 'medium', message: 'Good, add more variety' };
    return { strength: 'strong', message: 'Strong password!' };
  }, [password]);

  // 4. Callbacks
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      clearError();

      // Client-side validation
      if (!isFormValid) {
        return;
      }

      if (!passwordsMatch) {
        // Set custom error without making API call
        return;
      }

      try {
        // XSS Prevention - CORE-CRITICAL Rule 3 (Defense in Depth)
        const sanitizedEmail = DOMPurify.sanitize(email.trim());
        const sanitizedFirstName = DOMPurify.sanitize(firstName.trim());
        const sanitizedLastName = DOMPurify.sanitize(lastName.trim());

        const credentials: RegisterCredentials = {
          email: sanitizedEmail.toLowerCase(),
          password,
          confirmPassword,
          firstName: sanitizedFirstName,
          lastName: sanitizedLastName,
        };

        await register(credentials);

        // Handle successful registration
        if (onSuccess) {
          onSuccess();
        }

        navigate(redirectTo, { replace: true });
      } catch (err) {
        // Error already handled in store
      }
    },
    [email, password, confirmPassword, firstName, lastName, isFormValid, passwordsMatch, register, navigate, redirectTo, onSuccess, clearError]
  );

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    clearError();
  }, [clearError]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    clearError();
  }, [clearError]);

  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    clearError();
  }, [clearError]);

  const handleFirstNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value);
    clearError();
  }, [clearError]);

  const handleLastNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value);
    clearError();
  }, [clearError]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  const toggleAcceptTerms = useCallback(() => {
    setAcceptTerms(prev => !prev);
  }, []);

  // 5. Effects with cleanup - CORE-CRITICAL Rule 2
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFirstName('');
      setLastName('');
      setAcceptTerms(false);
      clearError();
    };
  }, [clearError]);

  // 6. Early returns (none needed)

  // 7. Render
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={handleFirstNameChange}
            required
            autoComplete="given-name"
            maxLength={50}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            placeholder="John"
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={handleLastNameChange}
            required
            autoComplete="family-name"
            maxLength={50}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            placeholder="Doe"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Email Input */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          required
          autoComplete="email"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          placeholder="your.email@example.com"
          disabled={isLoading}
        />
      </div>

      {/* Password Input */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handlePasswordChange}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            placeholder="••••••••"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </div>
        {/* Password Strength Indicator */}
        {password.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    passwordStrength.strength === 'weak'
                      ? 'w-1/3 bg-red-500'
                      : passwordStrength.strength === 'medium'
                      ? 'w-2/3 bg-yellow-500'
                      : 'w-full bg-green-500'
                  }`}
                />
              </div>
              <span className="text-xs text-gray-600">{passwordStrength.message}</span>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password Input */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            placeholder="••••••••"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
          >
            {showConfirmPassword ? (
              <EyeSlashIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </div>
        {/* Password Match Indicator */}
        {confirmPassword.length > 0 && (
          <div className={`mt-2 flex items-center gap-1 text-sm ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
            {passwordsMatch ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <ExclamationTriangleIcon className="h-4 w-4" />
            )}
            <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
          </div>
        )}
      </div>

      {/* Terms and Conditions */}
      <div>
        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={toggleAcceptTerms}
            className="w-4 h-4 mt-1 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
            disabled={isLoading}
            required
          />
          <span className="ml-2 text-sm text-gray-700">
            I agree to the{' '}
            <a href="/terms" target="_blank" className="text-primary-600 hover:text-primary-700">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" className="text-primary-600 hover:text-primary-700">
              Privacy Policy
            </a>
          </span>
        </label>
      </div>

      {/* Error Message */}
      {error && (
 <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-400 mr-2" />
            <p className="text-sm text-red-800">
              {/* SECURITY: Sanitize error message - Rule 3 (Defense in Depth) */}
              {DOMPurify.sanitize(error)}
            </p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !isFormValid || !passwordsMatch}
        className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating account...
          </span>
        ) : (
          'Create Account'
        )}
      </button>

      {/* Login Link */}
      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a
          href="/"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Sign in
        </a>
      </p>
    </form>
  );
};
