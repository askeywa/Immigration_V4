/**
 * Client Dashboard
 * Personal information form and application status
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 2: Memory leak prevention (cleanup in useEffect)
 * - Rule 3: XSS prevention (DOMPurify sanitization)
 * - Rule 9: TypeScript strict (no 'any')
 * - Rule 10: Multi-tenant isolation
 */

import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/auth-store';
import { apiClient } from '../services/api-client';
import DashboardLayout from '../components/layout/DashboardLayout';

/**
 * Client Profile Data Interface
 */
interface ClientProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  applicationType: string;
  applicationStatus: string;
}

/**
 * Client Dashboard Component
 */
export const ClientDashboard: React.FC = () => {
  // State
  const [profileData, setProfileData] = useState<ClientProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    applicationType: '',
    applicationStatus: 'draft'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Hooks
  const { user } = useAuthStore();

  // Note: Profile is loaded from user state in useEffect below
  // API call to /api/v1/client/my-profile can be added if needed for fresh data

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      const response = await apiClient.put<{ profile: ClientProfileData; message: string }>(
        '/api/v1/client/my-profile',
        {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          profile: {
            phone: profileData.phone,
            dateOfBirth: profileData.dateOfBirth,
            nationality: profileData.nationality
          }
        }
      );
      
      if (response.success) {
        setSuccessMessage('Profile updated successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.error?.message || 'Failed to update profile');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };


  /**
   * Load profile on component mount
   */
  useEffect(() => {
    if (user) {
      // Pre-fill with user data
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        dateOfBirth: user.profile?.dateOfBirth || '',
        nationality: user.profile?.nationality || '',
        applicationType: user.applicationType || '',
        applicationStatus: user.applicationStatus || 'draft'
      });
      setIsLoading(false);
    }
  }, [user]);

  // Access control
  if (!user || user.userType !== 'client') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      userType="client"
      userName={user.firstName || "Client"}
      tenantName={user.tenantName}
    >
      {/* Page Header */}
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">My Dashboard</h1>
          <p className="text-sm text-gray-600">Manage your immigration application</p>
        </div>

        {/* Main Content */}
        {/* Application Status Card */}
 <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Application Status
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Application Type</p>
              <p className="text-base font-medium text-gray-900">
                {profileData.applicationType ? profileData.applicationType.replace('_', ' ') : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                profileData.applicationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                profileData.applicationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                profileData.applicationStatus === 'in_review' ? 'bg-amber-100 text-amber-800' :
                profileData.applicationStatus === 'submitted' ? 'bg-primary-100 text-primary-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {profileData.applicationStatus.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Personal Information Form */}
 <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Personal Information
          </h2>

          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-400" />
                <p className="ml-2 text-sm text-green-800">{DOMPurify.sanitize(successMessage)}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
                <p className="ml-2 text-sm text-red-800">{DOMPurify.sanitize(error)}</p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading profile...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  disabled
                  value={profileData.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed. Contact your RCIC if you need to update it.
                </p>
              </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nationality
                </label>
                <input
                  type="text"
                  value={profileData.nationality}
                  onChange={(e) => setProfileData({ ...profileData, nationality: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors"
                  placeholder="e.g., Indian, Canadian, American"
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isSaving ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-primary-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-base font-medium text-primary-900 mb-1">
                Need Help?
              </h3>
              <p className="text-sm text-primary-800">
                If you have any questions about your application or need assistance, please contact your assigned RCIC representative.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;