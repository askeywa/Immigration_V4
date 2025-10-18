/**
 * Register Page
 * User registration page wrapper
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = useCallback(() => {
    // Registration successful, form will navigate
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <svg className="w-12 h-12 mx-auto text-primary-600 mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 Create Account">`n</h1> <p className="text-gray-600 mt-2">
            Join Canadian Immigration Portal
          </p>
        </div>

        {/* Register Form */}
        <RegisterForm onSuccess={handleSuccess} />

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
};
