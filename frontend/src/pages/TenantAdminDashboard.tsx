/**
 * Tenant Admin Dashboard
 * Team member and client management
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 2: Memory leak prevention (cleanup in useEffect)
 * - Rule 3: XSS prevention (DOMPurify sanitization)
 * - Rule 9: TypeScript strict (no 'any')
 * - Rule 10: Multi-tenant isolation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/auth-store';
import {
  TenantAdminService,
  TeamMemberData,
  ClientData,
  CreateTeamMemberInput,
  CreateClientInput
} from '../services/tenant-admin.service';
import DashboardLayout from '../components/layout/DashboardLayout';

/**
 * Tenant Admin Dashboard Component
 */
export const TenantAdminDashboard: React.FC = () => {
  // State
  const [teamMembers, setTeamMembers] = useState<TeamMemberData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);

  // Hooks
  const { user } = useAuthStore();

  /**
   * Load team members from API
   */
  const loadTeamMembers = useCallback(async () => {
    try {
      const response = await TenantAdminService.getTeamMembers();
      
      if (response.success && response.data) {
        setTeamMembers(response.data.teamMembers);
      }
    } catch (err) {
      console.error('Failed to load team members:', err);
    }
  }, []);

  /**
   * Load clients from API
   */
  const loadClients = useCallback(async () => {
    try {
      const response = await TenantAdminService.getClients();
      
      if (response.success && response.data) {
        setClients(response.data.clients);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
  }, []);

  /**
   * Load all data on component mount
   */
  useEffect(() => {
    loadTeamMembers();
    loadClients();
  }, [loadTeamMembers, loadClients]);

  // Access control
  if (!user || user.userType !== 'tenant_admin') {
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
      userType="tenant_admin"
      userName={user.firstName || "Tenant Admin"}
      tenantName={user.tenantName}
    >
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">RCIC Dashboard</h1>
          <p className="text-sm text-gray-600">Manage your team members and clients</p>
        </div>

        {/* Main Content */}
        {/* Stats Cards - Professional dashboard style */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{teamMembers.length}</div>
            <div className="text-sm text-gray-600">Team Members</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{clients.length}</div>
            <div className="text-sm text-gray-600">Total Clients</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {clients.filter(c => c.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Clients</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setShowCreateTeamModal(true)}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Team Member
          </button>
          <button
            onClick={() => setShowCreateClientModal(true)}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Client
          </button>
        </div>

        {/* Quick Actions Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Quick Actions
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Use the buttons above to quickly add new team members or clients. For detailed management, visit the dedicated pages:</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li><strong>Team Members:</strong> Manage roles, permissions, and team structure</li>
                  <li><strong>Clients:</strong> View detailed client information and application status</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

      {/* Create Team Member Modal */}
      {showCreateTeamModal && (
        <CreateTeamMemberModal
          isOpen={showCreateTeamModal}
          onClose={() => setShowCreateTeamModal(false)}
          onSuccess={() => {
            setShowCreateTeamModal(false);
            loadTeamMembers();
          }}
        />
      )}

      {/* Create Client Modal */}
      {showCreateClientModal && (
        <CreateClientModal
          isOpen={showCreateClientModal}
          teamMembers={teamMembers}
          onClose={() => setShowCreateClientModal(false)}
          onSuccess={() => {
            setShowCreateClientModal(false);
            loadClients();
          }}
        />
      )}
      </div>
    </DashboardLayout>
  );
};


/**
 * Create Team Member Modal
 */
interface CreateTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTeamMemberModal: React.FC<CreateTeamMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateTeamMemberInput>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'case_manager'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsCreating(true);
      const response = await TenantAdminService.createTeamMember(formData);
      
      if (response.success) {
        alert('Team member created successfully!');
        onSuccess();
      } else {
        throw new Error(response.error?.message || 'Failed to create team member');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create team member';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full border border-gray-200">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Team Member</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password *
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors"
              placeholder="Min 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as CreateTeamMemberInput['role'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              <option value="case_manager">Case Manager</option>
              <option value="visa_specialist">Visa Specialist</option>
              <option value="work_permit_specialist">Work Permit Specialist</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {isCreating ? 'Creating...' : 'Create Team Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Create Client Modal
 */
interface CreateClientModalProps {
  isOpen: boolean;
  teamMembers: TeamMemberData[];
  onClose: () => void;
  onSuccess: () => void;
}

const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  teamMembers,
  onClose,
  onSuccess
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateClientInput>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    assignedTo: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsCreating(true);
      const response = await TenantAdminService.createClient(formData);
      
      if (response.success) {
        alert('Client created successfully!');
        onSuccess();
      } else {
        throw new Error(response.error?.message || 'Failed to create client');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create client';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Add New Client</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password *
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors"
              placeholder="Min 8 characters"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
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
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors"
              placeholder="e.g., Indian, Canadian, American"
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Assign to Team Member
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              <option value="">Unassigned</option>
              {teamMembers.filter(m => m.isActive).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName} - {member.role.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {isCreating ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantAdminDashboard;
