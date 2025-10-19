import React, { useState, useEffect, useCallback } from 'react';
import { UserGroupIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthStore } from '../../stores/auth-store';
import { TenantAdminService, TeamMemberData, CreateTeamMemberInput } from '../../services/tenant-admin.service';

const TeamMembersPage: React.FC = () => {
  const { user } = useAuthStore();
  const [teamMembers, setTeamMembers] = useState<TeamMemberData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  useEffect(() => {
    loadTeamMembers();
  }, [loadTeamMembers]);

  return (
    <DashboardLayout
      userType="tenant_admin"
      userName={user?.firstName || 'Tenant Admin'}
      tenantName={user?.tenantName}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Team Members</h1>
          <p className="text-sm text-gray-600 mt-2">
            Manage your team members and their permissions
          </p>
        </div>

        {/* Add Team Member Button */}
        <div className="mb-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Add Team Member
          </button>
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
              <p className="text-base font-medium">Error loading team members</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={loadTeamMembers}
              className="mt-3 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-base font-semibold text-gray-900 mb-2">No Team Members</h3>
              <p className="text-sm text-gray-600">
                Create your first team member to get started!
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
                          {member.firstName} {member.lastName}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-500">{member.email}</div>
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
                          onClick={() => handleDeleteTeamMember(member.id, `${member.firstName} ${member.lastName}`)}
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
          </div>
        )}

        {/* Create Team Member Modal */}
        {showCreateModal && (
          <CreateTeamMemberModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadTeamMembers();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

// Create Team Member Modal Component
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Team Member</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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

export default TeamMembersPage;