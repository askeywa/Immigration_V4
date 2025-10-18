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

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  UsersIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { RCICLoginForm } from '../components/RCICLoginForm';
import { useAuthStore } from '../stores/auth-store';

/**
 * Landing Page Component
 * 
 * Following UI/UX Guidelines: Professional dashboard spacing, mobile-first, Tailwind CSS 3
 */
export const LandingPage: React.FC = () => {
  // 1. State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 2. Hooks
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  // 4. Callbacks
  const handleOpenLogin = useCallback(() => {
    setShowLoginModal(true);
    setMobileMenuOpen(false);
  }, []);

  const handleCloseLogin = useCallback(() => {
    setShowLoginModal(false);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setShowLoginModal(false);
    // Navigation will be handled by the useEffect when user state updates
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  // 5. Effects with cleanup - CORE-CRITICAL Rule 2
  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard based on user type
      switch (user.userType) {
        case 'super_admin':
          navigate('/super-admin/dashboard');
          break;
        case 'tenant_admin':
          navigate('/tenant-admin/dashboard');
          break;
        case 'team_member':
          navigate('/team-member/dashboard');
          break;
        case 'client':
          navigate('/client/dashboard');
          break;
        default:
          // Fallback - should not happen
          navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!showLoginModal) {
      return;
    }

    const handleEsc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setShowLoginModal(false);
      }
    };

    window.addEventListener('keydown', handleEsc);

    // Cleanup - CORE-CRITICAL Rule 2
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [showLoginModal]);

  // 6. Early returns (none needed)

  // 7. Render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Professional dashboard spacing */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <GlobeAltIcon className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900">Canadian Immigration Portal</span>
            </div>

            {/* Desktop Navigation */}
 <nav className="hidden lg:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Testimonials
              </a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </a>
              <button
                onClick={handleOpenLogin}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Sign In
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
              onClick={toggleMobileMenu}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-3 space-y-3">
              <a href="#features" className="block text-sm font-medium text-gray-600 hover:text-gray-900" onClick={toggleMobileMenu}>
                Features
              </a>
              <a href="#testimonials" className="block text-sm font-medium text-gray-600 hover:text-gray-900" onClick={toggleMobileMenu}>
                Testimonials
              </a>
              <a href="#pricing" className="block text-sm font-medium text-gray-600 hover:text-gray-900" onClick={toggleMobileMenu}>
                Pricing
              </a>
              <button
                onClick={handleOpenLogin}
                className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section - Professional spacing */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Streamline Your
              <span className="block text-primary-600">Canadian Immigration Process</span>
            </h1>
 <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Professional platform for RCICs, team members, and clients to manage immigration applications with complete transparency and efficiency.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleOpenLogin}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRightIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg shadow-sm hover:shadow-md border border-gray-200 transition-all"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Stats - Professional dashboard style */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">500+</div>
              <div className="text-sm text-gray-600">Registered RCICs</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">10,000+</div>
              <div className="text-sm text-gray-600">Applications Managed</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">98%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">24/7</div>
              <div className="text-sm text-gray-600">Support Available</div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Everything You Need for Immigration Management
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools designed specifically for Canadian immigration consultants and their clients.
            </p>
          </div>

          {/* Features Grid - Professional spacing */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                <CheckCircleIcon className="h-5 w-5 text-primary-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Application Tracking
              </h3>
              <p className="text-sm text-gray-600">
                Real-time status updates with automated notifications for all application stages.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <DocumentTextIcon className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Document Management
              </h3>
              <p className="text-sm text-gray-600">
                Secure cloud storage with version control and automated document verification.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <UsersIcon className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Team Collaboration
              </h3>
              <p className="text-sm text-gray-600">
                Multi-user access with role-based permissions for seamless team workflows.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                <ShieldCheckIcon className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Security & Compliance
              </h3>
              <p className="text-sm text-gray-600">
                Bank-level encryption with full compliance to Canadian privacy regulations.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                <ChartBarIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Analytics & Reporting
              </h3>
              <p className="text-sm text-gray-600">
                Detailed insights and automated reports for better decision making.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                <GlobeAltIcon className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Multi-Tenant Architecture
              </h3>
              <p className="text-sm text-gray-600">
                Complete data isolation with customizable branding for each RCIC practice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Trusted by Immigration Professionals
            </h2>
            <p className="text-gray-600">
              See what RCICs are saying about our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-4 w-4 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                "This platform has revolutionized how we manage our immigration cases. The real-time tracking and document management features are exceptional."
              </p>
              <div className="text-sm font-semibold text-gray-900">Sarah Chen, RCIC</div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-4 w-4 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                "The team collaboration features have improved our efficiency by 40%. Our clients love the transparency and regular updates."
              </p>
              <div className="text-sm font-semibold text-gray-900">Michael Rodriguez, RCIC</div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-4 w-4 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                "Finally, a platform that understands the unique needs of immigration consultants. The compliance features give us peace of mind."
              </p>
              <div className="text-sm font-semibold text-gray-900">Jennifer Liu, RCIC</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 lg:px-6">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to Transform Your Immigration Practice?
          </h2>
          <p className="text-primary-100 mb-6">
            Join hundreds of RCICs who have already streamlined their operations with our platform.
          </p>
          <button
            onClick={handleOpenLogin}
            className="px-6 py-3 bg-white hover:bg-gray-50 text-primary-600 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 mx-auto"
          >
            Start Your Free Trial
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Login Modal - Professional styling */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full border border-gray-200"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Sign In</h2>
              <button
                onClick={handleCloseLogin}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* RCIC Login Form */}
            <RCICLoginForm onSuccess={handleLoginSuccess} />
          </div>
        </div>
      )}

      {/* Footer - Professional spacing */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © 2025 Canadian Immigration Portal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};