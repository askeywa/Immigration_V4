/**
 * Team Member Dashboard
 * View assigned clients only (read-only for now)
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 2: Memory leak prevention (cleanup in useEffect)
 * - Rule 3: XSS prevention (DOMPurify sanitization)
 * - Rule 9: TypeScript strict (no 'any')
 * - Rule 10: Multi-tenant isolation
 */

import React, { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { 
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/auth-store';
import { apiClient } from '../services/api-client';
import { ClientData } from '../services/tenant-admin.service';
import DashboardLayout from '../components/layout/DashboardLayout';

/**
 * Team Member Dashboard Component
 */
export const TeamMemberDashboard: React.FC = () => {
  // State
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hooks
  const { user } = useAuthStore();

  /**
   * Load assigned clients from API
   */
  const loadMyClients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.get<{ clients: ClientData[]; count: number }>(
        '/api/v1/team-member/my-clients'
      );
      
      if (response.success && response.data) {
        setClients(response.data.clients);
      } else {
        throw new Error(response.error?.message || 'Failed to load clients');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load clients';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);


  /**
   * Load data on component mount
   */
  useEffect(() => {
    loadMyClients();
  }, [loadMyClients]);

  // Access control
  if (!user || user.userType !== 'team_member') {
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
      userType="team_member"
      userName={user.firstName || "Team Member"}
      tenantName={user.tenantName}
    >
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Team Member Dashboard</h1>
          <p className="text-sm text-gray-600">View and manage your assigned clients</p>
          {user.role && (
            <p className="text-xs text-gray-500 mt-1">
              Role: {user.role.replace('_', ' ')}
            </p>
          )}
        </div>

        {/* Main Content */}
        {/* Stats Cards - Professional dashboard style */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{clients.length}</div>
            <div className="text-sm text-gray-600">Assigned Clients</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {clients.filter(c => c.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Clients</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {clients.filter(c => c.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending Clients</div>
          </div>
        </div>

        {/* My Clients Section */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Assigned Clients</h2>
            <p className="text-sm text-gray-600 mt-1">
              View-only access to clients assigned to you
            </p>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading clients...</p>
              </div>
            ) : error ? (
              <div className="text-center py-6">
                <div className="text-red-600">
                  <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-3" />
                  <p className="text-base font-medium">Error loading clients</p>
                  <p className="text-sm">{DOMPurify.sanitize(error)}</p>
                </div>
                <button
                  onClick={loadMyClients}
                  className="mt-3 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-600">
                No clients assigned to you yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Client</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {DOMPurify.sanitize(client.firstName)} {DOMPurify.sanitize(client.lastName)}
                          </div>
                          {client.nationality && (
                            <div className="text-xs text-gray-500">
                              {DOMPurify.sanitize(client.nationality)}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-500">{DOMPurify.sanitize(client.email)}</div>
                          {client.phone && (
                            <div className="text-xs text-gray-500">
                              {DOMPurify.sanitize(client.phone)}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            client.status === 'active' ? 'bg-green-100 text-green-800' :
                            client.status === 'inactive' ? 'bg-red-100 text-red-800' :
                            client.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {new Date(client.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeamMemberDashboard;