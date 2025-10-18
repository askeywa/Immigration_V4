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
import DOMPurify from 'dompurify';
import { 
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon
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
  const [activeTab, setActiveTab] = useState<'team' | 'clients'>('team');
  const [teamMembers, setTeamMembers] = useState<TeamMemberData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);

  // Hooks
  const { user } = useAuthStore();

  /**
   * Load team members from API
   */
  const loadTeamMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await TenantAdminService.getTeamMembers();
      
      if (response.success && response.data) {
        setTeamMembers(response.data.teamMembers);
      } else {
        throw new Error(response.error?.message || 'Failed to load team members');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load team members';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load clients from API
   */
  const loadClients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await TenantAdminService.getClients();
      
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
   * Handle delete team member
   */
  const handleDeleteTeamMember = useCallback(async (memberId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to delete team member "${memberName}"?`)) {
      return;
    }

    try {
      const response = await TenantAdminService.deleteTeamMember(memberId);
      
      if (response.success) {
        await loadTeamMembers();
        alert('Team member deleted successfully');
      } else {
        throw new Error(response.error?.message || 'Failed to delete team member');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete team member';
      alert(`Error: ${errorMessage}`);
    }
  }, [loadTeamMembers]);


  /**
   * Load data based on active tab
   */
  useEffect(() => {
    if (activeTab === 'team') {
      loadTeamMembers();
    } else {
      loadClients();
    }
  }, [activeTab, loadTeamMembers, loadClients]);

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
              {clients.filter(c => c.applicationStatus !== 'draft').length}
            </div>
            <div className="text-sm text-gray-600">Active Applications</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('team')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'team'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Team Members ({teamMembers.length})
              </button>
              <button
                onClick={() => setActiveTab('clients')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'clients'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Clients ({clients.length})
              </button>
            </nav>
          </div>

          <div className="p-4">
            {/* Action Button */}
            <div className="mb-4">
              {activeTab === 'team' ? (
                <button
                  onClick={() => setShowCreateTeamModal(true)}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Team Member
                </button>
              ) : (
                <button
                  onClick={() => setShowCreateClientModal(true)}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Client
                </button>
              )}
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading...</p>
              </div>
            ) : error ? (
              <div className="text-center py-6">
                <div className="text-red-600">
                  <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-3" />
                  <p className="text-base font-medium">Error loading data</p>
                  <p className="text-sm">{DOMPurify.sanitize(error)}</p>
                </div>
                <button
                  onClick={activeTab === 'team' ? loadTeamMembers : loadClients}
                  className="mt-3 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : activeTab === 'team' ? (
              <TeamMembersTable 
                teamMembers={teamMembers} 
                onDelete={handleDeleteTeamMember}
              />
            ) : (
              <ClientsTable clients={clients} teamMembers={teamMembers} />
            )}
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
 * Team Members Table Component
 */
interface TeamMembersTableProps {
  teamMembers: TeamMemberData[];
  onDelete: (id: string, name: string) => void;
}

const TeamMembersTable: React.FC<TeamMembersTableProps> = ({ teamMembers, onDelete }) => {
  if (teamMembers.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-600">
        No team members found. Create your first team member to get started!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Last Login</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {teamMembers.map((member) => (
            <tr key={member.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {DOMPurify.sanitize(member.firstName)} {DOMPurify.sanitize(member.lastName)}
                </div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="text-xs text-gray-500">{DOMPurify.sanitize(member.email)}</div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                  {member.role.replace('_', ' ')}
                </span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                  member.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString() : 'Never'}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                <button 
                  onClick={() => onDelete(member.id, `${member.firstName} ${member.lastName}`)}
                  className="text-red-600 hover:text-red-900 flex items-center gap-1"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Clients Table Component
 */
interface ClientsTableProps {
  clients: ClientData[];
  teamMembers: TeamMemberData[];
}

const ClientsTable: React.FC<ClientsTableProps> = ({ clients }) => {
  if (clients.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-600">
        No clients found. Create your first client to get started!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Application Type</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Assigned To</th>
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
                {client.phone && (
                  <div className="text-xs text-gray-500">
                    {DOMPurify.sanitize(client.phone)}
                  </div>
                )}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="text-xs text-gray-500">{DOMPurify.sanitize(client.email)}</div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                  {client.applicationType.replace('_', ' ')}
                </span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                {client.assignedToName ? DOMPurify.sanitize(client.assignedToName) : 'Unassigned'}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                  client.applicationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                  client.applicationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                  client.applicationStatus === 'in_review' ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {client.applicationStatus.replace('_', ' ')}
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
    applicationType: 'visitor_visa',
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
              Application Type *
            </label>
            <select
              value={formData.applicationType}
              onChange={(e) => setFormData({ ...formData, applicationType: e.target.value as CreateClientInput['applicationType'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              <option value="visitor_visa">Visitor Visa</option>
              <option value="study_visa">Study Visa</option>
              <option value="work_permit">Work Permit</option>
              <option value="permanent_residence">Permanent Residence</option>
              <option value="family_sponsorship">Family Sponsorship</option>
              <option value="business_immigration">Business Immigration</option>
            </select>
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
