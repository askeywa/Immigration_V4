/**
 * Landing Page Component
 * Professional landing page following UI/UX guidelines
 * 
 * Following UI/UX Guidelines:
 * - Tailwind CSS 3 utility-first approach
 * - Mobile-first responsive design
 * - Professional dashboard spacing (tight, compact)
 * - No inline CSS (except dynamic brand colors)
 * - Heroicons for all icons
 * - Dark mode support
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 2: Memory leak prevention (cleanup in useEffect)
 * - Rule 7: Use hooks (useAuthStore)
 * - Rule 9: TypeScript strict (no 'any')
 * 
 * Following CORE-PATTERNS: React component structure
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { RCICLoginForm } from '../components/RCICLoginForm';
import { useAuthStore } from '../stores/auth-store';
import { getRouteForUser } from '../utils/routes';

// Constants for magic numbers
const HEADER_HEIGHT = 64; // 4rem = 64px
const VIEWPORT_HEIGHT_CALC = `calc(100vh - ${HEADER_HEIGHT}px)`;

/**
 * Landing Page Component
 * 
 * Following UI/UX Guidelines: Professional dashboard spacing, mobile-first, Tailwind CSS 3
 */
export const LandingPage: React.FC = () => {
  // 1. State (none needed)
  const hasCheckedAuth = useRef(false);

  // 2. Hooks
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  // 4. Callbacks
  const handleLoginSuccess = useCallback(() => {
    // CRITICAL FIX: Don't handle navigation here - let the form handle it
    // This prevents the race condition identified in the audit
  }, []);


  // 5. Effects with cleanup - CORE-CRITICAL Rule 2
  // CRITICAL FIX: Proper dependency array with ref to prevent multiple redirects
  useEffect(() => {
    // Only redirect if already authenticated and we haven't checked yet
    if (!hasCheckedAuth.current && isAuthenticated && user) {
      hasCheckedAuth.current = true;
      const route = getRouteForUser(user.userType);
      navigate(route, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);


  // 6. Early returns (none needed)

  // 7. Render
  return (
    <div className="min-h-screen bg-gray-50" role="main" aria-label="Landing page">
      {/* Header - Professional dashboard spacing */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200" role="banner">
        <div className="max-w-full mx-auto px-4 lg:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <GlobeAltIcon className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900">Canadian Immigration Portal</span>
            </div>


          </div>
        </div>

      </header>

      {/* Main Content Area - 80/20 Split */}
      <div className="pt-16 flex" style={{ height: VIEWPORT_HEIGHT_CALC }}>
        {/* Left Side - 80% Content */}
        <main className="w-full lg:w-[80%] overflow-hidden">
          {/* Main Content */}
          <div className="h-full flex flex-col justify-center px-8 lg:px-12">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Streamline Your
                <span className="block text-primary-600">Canadian Immigration Process</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Professional platform for RCICs, team members, and clients to manage immigration applications with complete transparency and efficiency.
              </p>
              
              {/* Stats - Professional dashboard style */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
                  <div className="text-3xl font-bold text-gray-900 mb-1">500+</div>
                  <div className="text-sm text-gray-600">Registered RCICs</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
                  <div className="text-3xl font-bold text-gray-900 mb-1">10,000+</div>
                  <div className="text-sm text-gray-600">Applications Managed</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
                  <div className="text-3xl font-bold text-gray-900 mb-1">98%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
                  <div className="text-3xl font-bold text-gray-900 mb-1">24/7</div>
                  <div className="text-sm text-gray-600">Support Available</div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Side - 20% Login Panel */}
        <aside className="hidden lg:block lg:w-[20%] bg-white border-l border-gray-200 sticky top-16 overflow-y-auto" style={{ height: VIEWPORT_HEIGHT_CALC }} role="complementary" aria-label="Login panel">
          <div className="p-6">
            {/* RCIC Login Form */}
            <RCICLoginForm onSuccess={handleLoginSuccess} />
          </div>
        </aside>
      </div>

      {/* Mobile Login Section - Show below content on mobile */}
      <div className="lg:hidden bg-white border-t-4 border-primary-600" role="complementary" aria-label="Mobile login section">
        <div className="max-w-md mx-auto px-4 py-8">
          <RCICLoginForm onSuccess={handleLoginSuccess} />
        </div>
      </div>
    </div>
  );
};