/**
 * Super Admin Dashboard
 * System-wide administration and tenant management with real API integration
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 2: Memory leak prevention (cleanup in useEffect)
 * - Rule 3: XSS prevention (DOMPurify sanitization)
 * - Rule 9: TypeScript strict (no 'any')
 * - Rule 10: Multi-tenant isolation (super admin sees all)
 */

import React, { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { 
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/auth-store';
import { SuperAdminService, TenantData, CreateTenantInput } from '../services/super-admin.service';
import DashboardLayout from '../components/layout/DashboardLayout';

/**
 * Super Admin Dashboard Component
 */
export const SuperAdminDashboard: React.FC = () => {
  // State
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Hooks
  const { user } = useAuthStore();

  /**
   * Load tenants data from API
   */
  const loadTenants = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load real data from API
      const response = await SuperAdminService.getTenants();
      if (response.success && response.data) {
        setTenants(response.data.tenants);
        return;
      } else {
        throw new Error(response.error?.message || 'Failed to load tenants');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tenants';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);


  /**
   * Handle delete tenant
   */
  const handleDelete = useCallback(async (tenantId: string, tenantName: string) => {
    if (!window.confirm(`Are you sure you want to delete tenant "${tenantName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await SuperAdminService.deleteTenant(tenantId);
      
      if (response.success) {
        // Reload tenants list
        await loadTenants();
        alert('Tenant deleted successfully');
      } else {
        throw new Error(response.error?.message || 'Failed to delete tenant');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tenant';
      alert(`Error: ${errorMessage}`);
    }
  }, [loadTenants]);

  /**
   * Load data on component mount
   */
  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  // Access control
  if (!user || user.userType !== 'super_admin') {
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
      userType="super_admin"
      userName="Super Admin"
      tenantName="System"
    >
      {/* Page Header with Actions */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-page-title">
              Super Admin Dashboard
            </h1>
            <p className="text-body">
              Manage all tenants and system settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
            >
              <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Add New Tenant</span>
              <span className="sm:hidden">Add Tenant</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        {/* Stats Cards - Professional dashboard style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="card-metric p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{tenants.length}</div>
            <div className="text-small">Total Tenants</div>
          </div>

          <div className="card-metric p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">
              {tenants.filter(t => t.status === 'active').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Active Tenants</div>
          </div>

          <div className="card-metric p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">
              {tenants.filter(t => t.plan === 'premium' || t.plan === 'enterprise').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Premium Plans</div>
          </div>

          <div className="card-metric p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">
              {tenants.reduce((sum, t) => sum + t.currentTeamMembers + t.currentClients, 0)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Users</div>
          </div>
        </div>

        {/* Tenants Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50">RCIC Tenants</h2>
          </div>

          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading tenants...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-600 dark:text-red-400">
                <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-3" />
                <p className="text-base font-medium">Error loading tenants</p>
                <p className="text-sm">{DOMPurify.sanitize(error)}</p>
                <button
                  onClick={loadTenants}
                  className="mt-3 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : tenants.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-body">No tenants found.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Create Your First Tenant
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                      Admin
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                      Plan
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      Users
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      Created
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-50">
                            {DOMPurify.sanitize(tenant.name)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {DOMPurify.sanitize(tenant.domain)}
                          </div>
                          {/* Show admin info on mobile */}
                          <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                            Admin: {DOMPurify.sanitize(tenant.adminFirstName)} {DOMPurify.sanitize(tenant.adminLastName)}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-xs sm:text-sm text-gray-900 dark:text-gray-50">
                          {DOMPurify.sanitize(tenant.adminFirstName)} {DOMPurify.sanitize(tenant.adminLastName)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {DOMPurify.sanitize(tenant.adminEmail)}
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap hidden md:table-cell">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          tenant.plan === 'enterprise' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                          tenant.plan === 'premium' ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400' :
                          tenant.plan === 'basic' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {tenant.plan}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                        <div>Team: {tenant.currentTeamMembers}/{tenant.maxTeamMembers}</div>
                        <div>Clients: {tenant.currentClients}/{tenant.maxClients}</div>
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          tenant.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          tenant.status === 'suspended' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <button 
                          onClick={() => handleDelete(tenant.id, tenant.name)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                        >
                          <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      {/* Create Tenant Modal */}
      {showCreateModal && (
        <CreateTenantModal
          isOpen={showCreateModal}
          isCreating={isCreating}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadTenants();
          }}
          setIsCreating={setIsCreating}
        />
      )}
      </div>
    </DashboardLayout>
  );
};

/**
 * Create Tenant Modal Component
 */
interface CreateTenantModalProps {
  isOpen: boolean;
  isCreating: boolean;
  onClose: () => void;
  onSuccess: () => void;
  setIsCreating: (value: boolean) => void;
}

const CreateTenantModal: React.FC<CreateTenantModalProps> = ({
  isOpen,
  isCreating,
  onClose,
  onSuccess,
  setIsCreating
}) => {
  const [formData, setFormData] = useState<CreateTenantInput>({
    name: '',
    domain: '',
    subdomain: '',
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: '',
    plan: 'basic',
    maxTeamMembers: 5,
    maxClients: 100
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsCreating(true);
      const response = await SuperAdminService.createTenant(formData);
      
      if (response.success) {
        alert('Tenant created successfully!');
        onSuccess();
      } else {
        throw new Error(response.error?.message || 'Failed to create tenant');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tenant';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm py-8 px-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-4 max-w-xl w-full max-h-[85vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Create New Tenant
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tenant Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white transition-colors text-sm"
                placeholder="ABC Immigration Services"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Domain *
              </label>
              <input
                type="text"
                required
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white transition-colors text-sm"
                placeholder="abcimmigration.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subdomain
              </label>
              <input
                type="text"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white transition-colors text-sm"
                placeholder="abc"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Admin First Name *
              </label>
              <input
                type="text"
                required
                value={formData.adminFirstName}
                onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Admin Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.adminLastName}
                onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white transition-colors text-sm"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Admin Email *
              </label>
              <input
                type="email"
                required
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white transition-colors text-sm"
                placeholder="admin@abcimmigration.com"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Admin Password *
              </label>
              <input
                type="password"
                required
                value={formData.adminPassword}
                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white transition-colors text-sm"
                placeholder="Min 8 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plan
              </label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value as CreateTenantInput['plan'] })}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white transition-colors text-sm"
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Team Members
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.maxTeamMembers}
                onChange={(e) => setFormData({ ...formData, maxTeamMembers: parseInt(e.target.value) })}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Clients
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={formData.maxClients}
                onChange={(e) => setFormData({ ...formData, maxClients: parseInt(e.target.value) })}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white transition-colors text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {isCreating ? 'Creating...' : 'Create Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;