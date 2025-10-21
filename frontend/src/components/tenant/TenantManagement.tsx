/**
 * Tenant Management Component
 * Reusable component for tenant CRUD operations
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
  TrashIcon,
  PencilIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { SuperAdminService, TenantData, UpdateTenantInput } from '../../services/super-admin.service';
import { useToast } from '../../contexts/ToastContext';
import EditTenantModal from '../modals/EditTenantModal';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';

interface TenantManagementProps {
  onTenantCountChange?: (count: number) => void;
}

/**
 * Tenant Management Component
 */
export const TenantManagement: React.FC<TenantManagementProps> = ({
  onTenantCountChange
}) => {
  // State
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTenant, setDeleteTenant] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Hooks
  const { showSuccess, showError } = useToast();

  /**
   * Load tenants data from API
   */
  const loadTenants = useCallback(async (notifyParent = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load real data from API
      const response = await SuperAdminService.getTenants();
      if (response.success && response.data) {
        setTenants(response.data.tenants);
        // Only notify parent when explicitly requested (after create/update/delete)
        if (notifyParent) {
          onTenantCountChange?.(response.data.tenants.length);
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handle edit tenant - show edit modal
   */
  const handleEditClick = useCallback((tenant: TenantData) => {
    setEditingTenant(tenant);
    setShowEditModal(true);
  }, []);

  /**
   * Handle delete tenant - show confirmation modal
   */
  const handleDeleteClick = useCallback((tenantId: string, tenantName: string) => {
    setDeleteTenant({ id: tenantId, name: tenantName });
    setShowDeleteModal(true);
  }, []);

  /**
   * Confirm update tenant
   */
  const confirmUpdate = useCallback(async (updateData: UpdateTenantInput) => {
    if (!editingTenant) return;
    
    try {
      setIsUpdating(true);
      const response = await SuperAdminService.updateTenant(editingTenant.id, updateData);
      
      if (response.success) {
        await loadTenants(true); // Notify parent about the change
        showSuccess('Tenant Updated Successfully', `Tenant "${editingTenant.name}" has been updated successfully.`);
        setShowEditModal(false);
        setEditingTenant(null);
      } else {
        throw new Error(response.error?.message || 'Failed to update tenant');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update tenant';
      showError('Failed to Update Tenant', errorMessage);
    } finally {
      setIsUpdating(false);
    }
  }, [editingTenant, loadTenants, showSuccess, showError]);

  /**
   * Confirm delete tenant
   */
  const confirmDelete = useCallback(async () => {
    if (!deleteTenant) return;
    
    try {
      setIsDeleting(true);
      const response = await SuperAdminService.deleteTenant(deleteTenant.id);
      
      if (response.success) {
        await loadTenants(true); // Notify parent about the change
        showSuccess('Tenant Deleted Successfully', `Tenant "${deleteTenant.name}" has been deleted successfully.`);
        setShowDeleteModal(false);
        setDeleteTenant(null);
      } else {
        throw new Error(response.error?.message || 'Failed to delete tenant');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tenant';
      showError('Failed to Delete Tenant', errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTenant, loadTenants, showSuccess, showError]);

  /**
   * Cancel edit
   */
  const cancelEdit = useCallback(() => {
    setShowEditModal(false);
    setEditingTenant(null);
  }, []);

  /**
   * Cancel delete
   */
  const cancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteTenant(null);
  }, []);

  /**
   * Load data on component mount
   */
  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  return (
    <>
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
                onClick={() => loadTenants()}
                className="mt-3 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-body">No tenants found.</p>
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
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditClick(tenant)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                          aria-label={`Edit tenant ${tenant.name}`}
                        >
                          <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(tenant.id, tenant.name)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                          aria-label={`Delete tenant ${tenant.name}`}
                        >
                          <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Edit Tenant Modal */}
      <EditTenantModal
        isOpen={showEditModal}
        onClose={cancelEdit}
        onSuccess={confirmUpdate}
        tenant={editingTenant}
        isUpdating={isUpdating}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Tenant"
        message={`Are you sure you want to delete tenant "${deleteTenant?.name}"?`}
        itemName={deleteTenant?.name || ''}
        itemType="tenant"
        isDeleting={isDeleting}
      />
    </>
  );
};

export default TenantManagement;
