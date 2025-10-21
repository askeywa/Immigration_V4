/**
 * Email Verification Page
 * Verify email address with token from email link
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 12: Validate external data (token from URL)
 * - Rule 13: Trust boundaries (sanitize token)
 * - Rule 3: XSS prevention (sanitize error messages)
 * - Rule 2: Memory leak prevention (cleanup)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { AuthService } from '../services/auth.service';

/**
 * Email Verification Page Component
 */
export const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 1. State
  const [isVerifying, setIsVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 4. Callbacks
  const verifyEmail = useCallback(async (token: string) => {
    try {
      // SECURITY: Validate token format - Rule 12 (Validate External Data)
      // Token should be hex string (64-128 chars)
      const tokenPattern = /^[a-f0-9]{64,128}$/i;
      if (!tokenPattern.test(token)) {
        throw new Error('Invalid verification token format');
      }

      const response = await AuthService.verifyEmail(token);

      if (!response.success) {
        // SECURITY: Sanitize error from API - Rule 13 (Trust Boundaries)
        throw new Error(response.error?.message || 'Verification failed');
      }

      setSuccess(true);
      setIsVerifying(false);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      // SECURITY: Sanitize error message - Rule 13
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(DOMPurify.sanitize(errorMessage));
      setIsVerifying(false);
    }
  }, [navigate]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsVerifying(true);
    
    const token = searchParams.get('token');
    if (token) {
      // SECURITY: Sanitize token from URL - Rule 13
      const sanitizedToken = DOMPurify.sanitize(token);
      verifyEmail(sanitizedToken);
    }
  }, [searchParams, verifyEmail]);

  // 5. Effects with cleanup - Rule 2
  useEffect(() => {
    let isMounted = true;
    let redirectTimeout: ReturnType<typeof setTimeout> | null = null;

    const token = searchParams.get('token');
    
    if (!token) {
      if (isMounted) {
        setError('No verification token provided');
        setIsVerifying(false);
      }
      return;
    }

    // SECURITY: Sanitize token from URL params - Rule 13 (Trust Boundaries)
    const sanitizedToken = DOMPurify.sanitize(token);
    
    if (isMounted) {
      verifyEmail(sanitizedToken);
    }

    // Cleanup - Rule 2 (Memory Leak Prevention)
    return () => {
      isMounted = false;
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [searchParams, verifyEmail]);

  // 6. Early returns
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Verifying Email
          </h2>
          <p className="text-sm text-gray-600">
            Please wait while we verify your email address...
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Email Verified!</h2>
          <p className="text-sm text-gray-600 mb-4">
            Your email has been successfully verified.
          </p>
          <p className="text-xs text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  // 7. Render error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-6 text-center">
        <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Verification Failed
        </h2>
        {error && (
          <p className="text-sm text-gray-600 mb-6">
            {/* Already sanitized in catch block */}
            {error}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};
