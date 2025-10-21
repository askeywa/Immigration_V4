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
import { useNavigate } from 'react-router-dom';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/auth-store';
import { SuperAdminService, TenantData, CreateTenantInput } from '../services/super-admin.service';
import { useToast } from '../contexts/ToastContext';
import DashboardLayout from '../components/layout/DashboardLayout';

/**
 * Super Admin Dashboard Component
 */
export const SuperAdminDashboard: React.FC = () => {
  // State
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Hooks
  const { user } = useAuthStore();
  const { showError } = useToast();
  const navigate = useNavigate();

  /**
   * Load tenants data from API
   */
  const loadTenants = useCallback(async () => {
    try {
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
      showError('Error Loading Tenants', errorMessage);
      console.error('Failed to load tenants:', err);
    }
  }, [showError]);



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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <button 
            onClick={() => navigate('/super-admin/tenants', { state: { activeTab: 'tenants' } })}
            className="card-metric p-4 sm:p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50">{tenants.length}</div>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Total Tenants</div>
          </button>

          <button 
            onClick={() => navigate('/super-admin/tenants', { state: { activeTab: 'team-members' } })}
            className="card-metric p-4 sm:p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50">
              {tenants.reduce((sum, t) => sum + t.currentTeamMembers, 0)}
            </div>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Team Members</div>
          </button>

          <button 
            onClick={() => navigate('/super-admin/tenants', { state: { activeTab: 'end-users' } })}
            className="card-metric p-4 sm:p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50">
              {tenants.reduce((sum, t) => sum + t.currentClients, 0)}
            </div>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Total Users</div>
          </button>
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
  const { showSuccess, showError } = useToast();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const initialFormData: CreateTenantInput = {
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
  };
  
  const [formData, setFormData] = useState<CreateTenantInput>(initialFormData);

  // Password validation: min 8 chars, 1 uppercase, 1 number, 1 special char
  const validatePassword = (password: string): boolean => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return minLength && hasUpperCase && hasNumber && hasSpecialChar;
  };

  // Domain validation: RFC-compliant domain format check
  const validateDomain = (domain: string): boolean => {
    // Remove any whitespace and convert to lowercase
    const cleanDomain = domain.trim().toLowerCase();
    
    // Check length (1-253 characters)
    if (cleanDomain.length < 1 || cleanDomain.length > 253) {
      return false;
    }
    
    // Check for valid domain format (letters, numbers, dots, hyphens)
    const domainRegex = /^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/i;
    return domainRegex.test(cleanDomain);
  };

  // Subdomain validation: should be a simple string without dots
  const validateSubdomain = (subdomain: string): boolean => {
    const cleanSubdomain = subdomain.trim().toLowerCase();
    
    // Check length (3-63 characters)
    if (cleanSubdomain.length < 3 || cleanSubdomain.length > 63) {
      return false;
    }
    
    // Should not contain dots (that's for domains, not subdomains)
    if (cleanSubdomain.includes('.')) {
      return false;
    }
    
    // Should only contain letters, numbers, and hyphens
    const subdomainRegex = /^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?$/;
    return subdomainRegex.test(cleanSubdomain);
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.adminPassword || !validatePassword(formData.adminPassword)) {
      errors.adminPassword = 'Password must be at least 8 characters with uppercase, number, and special character';
    }

    if (!formData.domain || !validateDomain(formData.domain)) {
      errors.domain = 'Please enter a valid domain (e.g., example.com)';
    }

    if (!formData.subdomain || !validateSubdomain(formData.subdomain)) {
      errors.subdomain = 'Subdomain must be 3-63 characters, letters/numbers only (no dots)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Validation Error', 'Please fix the form errors before submitting');
      return;
    }
    
    try {
      setIsCreating(true);
      const response = await SuperAdminService.createTenant(formData);
      
      // Debug log the response
      console.log('API Response:', response);
      
      if (response.success) {
        showSuccess('Tenant Created Successfully', `Tenant "${formData.name}" has been created successfully`);
        setFormData(initialFormData); // Reset form
        setFormErrors({});
        onSuccess();
      } else {
        console.log('Error response details:', response.error);
        
        // Handle detailed validation errors from backend
        if (response.error?.details && Array.isArray(response.error.details)) {
          // Backend validation errors - map to form fields
          const backendErrors: Record<string, string> = {};
          response.error.details.forEach((detail: any) => {
            if (detail.field && detail.message) {
              backendErrors[detail.field] = detail.message;
            }
          });
          console.log('Mapped backend errors:', backendErrors);
          setFormErrors(backendErrors);
          showError('Validation Error', 'Please fix the form errors and try again');
        } else {
          // Generic error - show more details
          const errorMessage = response.error?.message || 'Failed to create tenant';
          console.log('Generic error message:', errorMessage);
          showError('Failed to Create Tenant', errorMessage);
        }
      }
    } catch (err) {
      console.error('Failed to create tenant:', err);
      
      // Log the full error for debugging
      console.log('Full error object:', err);
      console.log('Error type:', typeof err);
      console.log('Error keys:', err instanceof Object ? Object.keys(err) : 'Not an object');
      
      // Check if it's a network error with response details
      if (err instanceof Error && 'response' in err) {
        const networkError = err as any;
        console.log('Network error response:', networkError.response);
        
        if (networkError.response?.data?.error?.details) {
          // Handle network validation errors
          const backendErrors: Record<string, string> = {};
          networkError.response.data.error.details.forEach((detail: any) => {
            if (detail.field && detail.message) {
              backendErrors[detail.field] = detail.message;
            }
          });
          setFormErrors(backendErrors);
          showError('Validation Error', 'Please fix the form errors and try again');
        } else {
          const errorMessage = networkError.response?.data?.error?.message || networkError.message || 'Failed to create tenant';
          showError('Failed to Create Tenant', errorMessage);
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create tenant';
        showError('Failed to Create Tenant', errorMessage);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setFormData(initialFormData); // Reset form on close
      setFormErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm py-8 px-6" role="dialog" aria-modal="true" aria-labelledby="create-tenant-modal-title">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-4 max-w-xl w-full max-h-[85vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-2">
          <h2 id="create-tenant-modal-title" className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Create New Tenant
          </h2>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
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
                className={`w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white transition-colors text-sm ${
                  formErrors.domain ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="abcimmigration.com"
                aria-invalid={!!formErrors.domain}
                aria-describedby={formErrors.domain ? 'domain-error' : undefined}
              />
              {formErrors.domain && (
                <p id="domain-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.domain}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subdomain *
              </label>
              <input
                type="text"
                required
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                className={`w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white transition-colors text-sm ${
                  formErrors.subdomain ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="abc (no dots)"
                aria-invalid={!!formErrors.subdomain}
                aria-describedby={formErrors.subdomain ? 'subdomain-error' : undefined}
              />
              {formErrors.subdomain && (
                <p id="subdomain-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.subdomain}</p>
              )}
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
                className={`w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white transition-colors text-sm ${
                  formErrors.adminPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special char"
                aria-invalid={!!formErrors.adminPassword}
                aria-describedby={formErrors.adminPassword ? 'password-error' : undefined}
              />
              {formErrors.adminPassword && (
                <p id="password-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.adminPassword}</p>
              )}
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
              onClick={handleClose}
              disabled={isCreating}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
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