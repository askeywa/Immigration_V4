/**
 * Reset Password Form Component
 * Reset password with token from email
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 3: XSS prevention (sanitize error messages)
 * - Rule 2: Memory leak prevention (cleanup)
 * - Rule 12: Validate external data (token from URL)
 * - Rule 13: Trust boundaries (validate token format)
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { 
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { AuthService } from '../services/auth.service';

/**
 * Reset Password Form Component
 */
export const ResetPasswordForm: React.FC = () => {
  // Get token from URL params
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 1. State
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 3. Memoized values
  const passwordsMatch = useMemo(() => {
    return newPassword === confirmPassword;
  }, [newPassword, confirmPassword]);

  const isFormValid = useMemo(() => {
    return (
      token.length > 0 &&
      newPassword.length >= 8 &&
      confirmPassword.length >= 8 &&
      passwordsMatch
    );
  }, [token, newPassword, confirmPassword, passwordsMatch]);

  const passwordStrength = useMemo(() => {
    if (newPassword.length < 8) return { strength: 'weak', message: 'Too short' };
    
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    
    const criteriaMet = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (criteriaMet < 2) return { strength: 'weak', message: 'Add uppercase, numbers, or special chars' };
    if (criteriaMet < 3) return { strength: 'medium', message: 'Good, add more variety' };
    return { strength: 'strong', message: 'Strong password!' };
  }, [newPassword]);

  // 4. Callbacks
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);

      if (!isFormValid) {
        return;
      }

      setIsLoading(true);

      try {
        // SECURITY: Validate token format - Rule 12 (Validate External Data)
        // Token should be hex string (64 chars for our implementation)
        const tokenPattern = /^[a-f0-9]{64,128}$/i;
        if (!tokenPattern.test(token)) {
          throw new Error('Invalid reset token format');
        }

        const response = await AuthService.resetPassword({
          token,
          newPassword,
          confirmPassword,
        });

        if (!response.success) {
          // SECURITY: Sanitize error from API - Rule 13 (Trust Boundaries)
          throw new Error(response.error?.message || 'Password reset failed');
        }

        setSuccess(true);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } catch (err) {
        // SECURITY: Sanitize error message - Rule 13
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(DOMPurify.sanitize(errorMessage));
      } finally {
        setIsLoading(false);
      }
    },
    [token, newPassword, confirmPassword, isFormValid, navigate]
  );

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    setError(null);
  }, []);

  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setError(null);
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  // 5. Effects with cleanup - Rule 2
  useEffect(() => {
    // Extract and validate token from URL - Rule 12 (Validate External Data)
    const tokenParam = searchParams.get('token');
    
    if (tokenParam) {
      // SECURITY: Sanitize token from URL - Rule 13 (Trust Boundaries)
      const sanitizedToken = DOMPurify.sanitize(tokenParam);
      setToken(sanitizedToken);
    } else {
      setError('No reset token provided');
    }

    // Cleanup
    return () => {
      setToken('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
    };
  }, [searchParams]);

  // 6. Early returns
  if (success) {
    return (
      <div className="text-center space-y-3">
        <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircleIcon className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Password Reset Successful!</h3>
        <p className="text-sm text-gray-600">Your password has been updated successfully.</p>
        <p className="text-xs text-gray-500">Redirecting to login...</p>
      </div>
    );
  }

  // 7. Render
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Reset Password
        </h2>
        <p className="text-sm text-gray-600">
          Enter your new password below.
        </p>
      </div>

      {/* New Password Input */}
      <div>
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          New Password
        </label>
        <div className="relative">
          <input
            id="newPassword"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
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
        {newPassword.length > 0 && (
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
          Confirm New Password
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

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-400 mr-2" />
            <p className="text-sm text-red-800">{DOMPurify.sanitize(error)}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !isFormValid}
        className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
      >
        {isLoading ? 'Resetting Password...' : 'Reset Password'}
      </button>
    </form>
  );
};
