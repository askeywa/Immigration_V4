import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  UsersIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthStore } from '../../stores/auth-store';
import { SuperAdminService } from '../../services/super-admin.service';
import { useToast } from '../../contexts/ToastContext';
import TenantManagement from '../../components/tenant/TenantManagement';

interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: string;
  plan: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  maxTeamMembers: number;
  maxClients: number;
  currentTeamMembers: number;
  currentClients: number;
  createdAt: Date;
}

interface TeamMember {
  id: string;
  tenantId: string;
  tenantName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  lastLogin?: Date;
  createdAt: Date;
}

interface EndUser {
  id: string;
  tenantId: string;
  tenantName: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  applicationStatus?: string;
  createdAt: Date;
}

type TabType = 'tenants' | 'team-members' | 'end-users';

const TenantsPage: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const { showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('tenants');
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  
  // Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Collapsible states
  const [collapsedTenants, setCollapsedTenants] = useState<Set<string>>(new Set());
  
  // Data states
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [endUsers, setEndUsers] = useState<EndUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Handle navigation state to set active tab
  useEffect(() => {
    if (location.state && location.state.activeTab) {
      setActiveTab(location.state.activeTab as TabType);
    }
  }, [location.state]);

  // Load tenants data for dropdown and counts (only once on mount)
  const loadTenantsForFilter = useCallback(async () => {
    try {
      const response = await SuperAdminService.getTenants();
      if (response.success && response.data) {
        setTenants(response.data.tenants);
      } else {
        throw new Error(response.error?.message || 'Failed to load tenants');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tenants';
      showError('Error Loading Tenants', errorMessage);
      console.error('Failed to load tenants for filter:', error);
    }
  }, [showError]);


  // Load team members data
  // TODO: Replace with actual API call when backend endpoint is ready
  // Feature Flag: Currently using mock data as super-admin cross-tenant endpoint doesn't exist yet
  const loadTeamMembers = useCallback(async () => {
    try {
      setLoading(true);
      // Mock data - will be replaced with: await SuperAdminService.getAllTeamMembers()
      const mockTeamMembers: TeamMember[] = [
        // ABC Immigration Services Team
        {
          id: '1',
          tenantId: 'tenant1',
          tenantName: 'ABC Immigration Services',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@abcimmigration.com',
          role: 'Admin',
          status: 'active',
          lastLogin: new Date(),
          createdAt: new Date('2024-01-15')
        },
        {
          id: '2',
          tenantId: 'tenant1',
          tenantName: 'ABC Immigration Services',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah@abcimmigration.com',
          role: 'Staff',
          status: 'active',
          lastLogin: new Date(),
          createdAt: new Date('2024-02-01')
        },
        {
          id: '3',
          tenantId: 'tenant1',
          tenantName: 'ABC Immigration Services',
          firstName: 'Michael',
          lastName: 'Brown',
          email: 'michael@abcimmigration.com',
          role: 'Staff',
          status: 'active',
          lastLogin: new Date(),
          createdAt: new Date('2024-02-15')
        },
        {
          id: '4',
          tenantId: 'tenant1',
          tenantName: 'ABC Immigration Services',
          firstName: 'Emily',
          lastName: 'Davis',
          email: 'emily@abcimmigration.com',
          role: 'Staff',
          status: 'inactive',
          lastLogin: new Date('2024-01-20'),
          createdAt: new Date('2024-01-20')
        },
        // XYZ Consultant Team
        {
          id: '5',
          tenantId: 'tenant2',
          tenantName: 'XYZ Consultant',
          firstName: 'Mike',
          lastName: 'Wilson',
          email: 'mike@xyzconsultant.com',
          role: 'Admin',
          status: 'active',
          lastLogin: new Date(),
          createdAt: new Date('2024-01-20')
        },
        {
          id: '6',
          tenantId: 'tenant2',
          tenantName: 'XYZ Consultant',
          firstName: 'Lisa',
          lastName: 'Anderson',
          email: 'lisa@xyzconsultant.com',
          role: 'Staff',
          status: 'active',
          lastLogin: new Date(),
          createdAt: new Date('2024-02-10')
        },
        // DEF Legal Services Team
        {
          id: '7',
          tenantId: 'tenant3',
          tenantName: 'DEF Legal Services',
          firstName: 'Robert',
          lastName: 'Taylor',
          email: 'robert@deflegal.com',
          role: 'Admin',
          status: 'active',
          lastLogin: new Date(),
          createdAt: new Date('2024-01-25')
        },
        {
          id: '8',
          tenantId: 'tenant3',
          tenantName: 'DEF Legal Services',
          firstName: 'Jennifer',
          lastName: 'Martinez',
          email: 'jennifer@deflegal.com',
          role: 'Staff',
          status: 'active',
          lastLogin: new Date(),
          createdAt: new Date('2024-02-05')
        },
        {
          id: '9',
          tenantId: 'tenant3',
          tenantName: 'DEF Legal Services',
          firstName: 'David',
          lastName: 'Garcia',
          email: 'david@deflegal.com',
          role: 'Staff',
          status: 'active',
          lastLogin: new Date(),
          createdAt: new Date('2024-02-20')
        },
        // GHI Immigration Solutions Team
        {
          id: '10',
          tenantId: 'tenant4',
          tenantName: 'GHI Immigration Solutions',
          firstName: 'Amanda',
          lastName: 'White',
          email: 'amanda@ghiimmigration.com',
          role: 'Admin',
          status: 'active',
          lastLogin: new Date(),
          createdAt: new Date('2024-01-30')
        },
        {
          id: '11',
          tenantId: 'tenant4',
          tenantName: 'GHI Immigration Solutions',
          firstName: 'Christopher',
          lastName: 'Lee',
          email: 'chris@ghiimmigration.com',
          role: 'Staff',
          status: 'active',
          lastLogin: new Date(),
          createdAt: new Date('2024-02-12')
        }
      ];
      setTeamMembers(mockTeamMembers);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load team members';
      showError('Error Loading Team Members', errorMessage);
      console.error('Failed to load team members:', error);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Load end users data
  // TODO: Replace with actual API call when backend endpoint is ready
  // Feature Flag: Currently using mock data as super-admin cross-tenant endpoint doesn't exist yet
  const loadEndUsers = useCallback(async () => {
    try {
      setLoading(true);
      // Mock data - will be replaced with: await SuperAdminService.getAllEndUsers()
      const mockEndUsers: EndUser[] = [
        // ABC Immigration Services Clients
        {
          id: '1',
          tenantId: 'tenant1',
          tenantName: 'ABC Immigration Services',
          firstName: 'Alice',
          lastName: 'Brown',
          email: 'alice.brown@email.com',
          status: 'active',
          applicationStatus: 'in_progress',
          createdAt: new Date('2024-01-10')
        },
        {
          id: '2',
          tenantId: 'tenant1',
          tenantName: 'ABC Immigration Services',
          firstName: 'Bob',
          lastName: 'Davis',
          email: 'bob.davis@email.com',
          status: 'active',
          applicationStatus: 'completed',
          createdAt: new Date('2024-01-05')
        },
        {
          id: '3',
          tenantId: 'tenant1',
          tenantName: 'ABC Immigration Services',
          firstName: 'Catherine',
          lastName: 'Wilson',
          email: 'catherine.wilson@email.com',
          status: 'active',
          applicationStatus: 'submitted',
          createdAt: new Date('2024-01-15')
        },
        {
          id: '4',
          tenantId: 'tenant1',
          tenantName: 'ABC Immigration Services',
          firstName: 'Daniel',
          lastName: 'Miller',
          email: 'daniel.miller@email.com',
          status: 'active',
          applicationStatus: 'in_progress',
          createdAt: new Date('2024-02-01')
        },
        {
          id: '5',
          tenantId: 'tenant1',
          tenantName: 'ABC Immigration Services',
          firstName: 'Elena',
          lastName: 'Garcia',
          email: 'elena.garcia@email.com',
          status: 'pending',
          applicationStatus: 'submitted',
          createdAt: new Date('2024-02-10')
        },
        // XYZ Consultant Clients
        {
          id: '6',
          tenantId: 'tenant2',
          tenantName: 'XYZ Consultant',
          firstName: 'Frank',
          lastName: 'Martinez',
          email: 'frank.martinez@email.com',
          status: 'active',
          applicationStatus: 'completed',
          createdAt: new Date('2024-01-20')
        },
        {
          id: '7',
          tenantId: 'tenant2',
          tenantName: 'XYZ Consultant',
          firstName: 'Grace',
          lastName: 'Anderson',
          email: 'grace.anderson@email.com',
          status: 'active',
          applicationStatus: 'in_progress',
          createdAt: new Date('2024-02-05')
        },
        {
          id: '8',
          tenantId: 'tenant2',
          tenantName: 'XYZ Consultant',
          firstName: 'Henry',
          lastName: 'Taylor',
          email: 'henry.taylor@email.com',
          status: 'pending',
          applicationStatus: 'submitted',
          createdAt: new Date('2024-02-15')
        },
        // DEF Legal Services Clients
        {
          id: '9',
          tenantId: 'tenant3',
          tenantName: 'DEF Legal Services',
          firstName: 'Isabella',
          lastName: 'White',
          email: 'isabella.white@email.com',
          status: 'active',
          applicationStatus: 'completed',
          createdAt: new Date('2024-01-25')
        },
        {
          id: '10',
          tenantId: 'tenant3',
          tenantName: 'DEF Legal Services',
          firstName: 'James',
          lastName: 'Lee',
          email: 'james.lee@email.com',
          status: 'active',
          applicationStatus: 'in_progress',
          createdAt: new Date('2024-02-08')
        },
        {
          id: '11',
          tenantId: 'tenant3',
          tenantName: 'DEF Legal Services',
          firstName: 'Katherine',
          lastName: 'Johnson',
          email: 'katherine.johnson@email.com',
          status: 'active',
          applicationStatus: 'submitted',
          createdAt: new Date('2024-02-18')
        },
        {
          id: '12',
          tenantId: 'tenant3',
          tenantName: 'DEF Legal Services',
          firstName: 'Lucas',
          lastName: 'Smith',
          email: 'lucas.smith@email.com',
          status: 'pending',
          applicationStatus: 'submitted',
          createdAt: new Date('2024-02-22')
        },
        // GHI Immigration Solutions Clients
        {
          id: '13',
          tenantId: 'tenant4',
          tenantName: 'GHI Immigration Solutions',
          firstName: 'Maria',
          lastName: 'Rodriguez',
          email: 'maria.rodriguez@email.com',
          status: 'active',
          applicationStatus: 'completed',
          createdAt: new Date('2024-01-30')
        },
        {
          id: '14',
          tenantId: 'tenant4',
          tenantName: 'GHI Immigration Solutions',
          firstName: 'Nathan',
          lastName: 'Clark',
          email: 'nathan.clark@email.com',
          status: 'active',
          applicationStatus: 'in_progress',
          createdAt: new Date('2024-02-12')
        },
        {
          id: '15',
          tenantId: 'tenant4',
          tenantName: 'GHI Immigration Solutions',
          firstName: 'Olivia',
          lastName: 'Lewis',
          email: 'olivia.lewis@email.com',
          status: 'active',
          applicationStatus: 'submitted',
          createdAt: new Date('2024-02-25')
        }
      ];
      setEndUsers(mockEndUsers);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load end users';
      showError('Error Loading End Users', errorMessage);
      console.error('Failed to load end users:', error);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Load all data when component mounts
  useEffect(() => {
    loadTenantsForFilter();
    loadTeamMembers();
    loadEndUsers();
  }, [loadTenantsForFilter, loadTeamMembers, loadEndUsers]);

  // Clean up collapsible state to prevent memory leak when tenants change
  useEffect(() => {
    setCollapsedTenants(prev => {
      const validTenantNames = new Set(tenants.map(t => t.name));
      const cleaned = new Set(
        Array.from(prev).filter(name => validTenantNames.has(name))
      );
      return cleaned;
    });
  }, [tenants]);

  // Toggle collapsible section
  const toggleCollapse = (tenantName: string) => {
    const newCollapsed = new Set(collapsedTenants);
    if (newCollapsed.has(tenantName)) {
      newCollapsed.delete(tenantName);
    } else {
      newCollapsed.add(tenantName);
    }
    setCollapsedTenants(newCollapsed);
  };

  // Search and filter functions

  const searchTeamMembers = (query: string, members: TeamMember[]) => {
    if (!query) return members;
    return members.filter(member => 
      member.firstName.toLowerCase().includes(query.toLowerCase()) ||
      member.lastName.toLowerCase().includes(query.toLowerCase()) ||
      member.email.toLowerCase().includes(query.toLowerCase()) ||
      member.role.toLowerCase().includes(query.toLowerCase()) ||
      member.tenantName.toLowerCase().includes(query.toLowerCase())
    );
  };

  const searchEndUsers = (query: string, users: EndUser[]) => {
    if (!query) return users;
    return users.filter(user => 
      user.firstName.toLowerCase().includes(query.toLowerCase()) ||
      user.lastName.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase()) ||
      user.applicationStatus?.toLowerCase().includes(query.toLowerCase()) ||
      user.tenantName.toLowerCase().includes(query.toLowerCase())
    );
  };

  // Filter data based on selected tenant and search query (optimized with useMemo)
  
  // Get selected tenant name for filtering
  const selectedTenantName = useMemo(() => {
    return selectedTenant === 'all' 
      ? null 
      : tenants.find(t => t.id === selectedTenant)?.name;
  }, [selectedTenant, tenants]);

  // Optimize team members filtering and searching
  const searchedTeamMembers = useMemo(() => {
    const filtered = selectedTenant === 'all' 
      ? teamMembers 
      : teamMembers.filter(member => member.tenantName === selectedTenantName);
    return searchTeamMembers(searchQuery, filtered);
  }, [selectedTenant, teamMembers, selectedTenantName, searchQuery]);

  // Optimize end users filtering and searching
  const searchedEndUsers = useMemo(() => {
    const filtered = selectedTenant === 'all' 
      ? endUsers 
      : endUsers.filter(user => user.tenantName === selectedTenantName);
    return searchEndUsers(searchQuery, filtered);
  }, [selectedTenant, endUsers, selectedTenantName, searchQuery]);

  // Group data by tenant (optimized with useMemo)
  const groupedTeamMembers = useMemo(() => {
    return searchedTeamMembers.reduce((acc, member) => {
      if (!acc[member.tenantName]) {
        acc[member.tenantName] = [];
      }
      acc[member.tenantName].push(member);
      return acc;
    }, {} as Record<string, TeamMember[]>);
  }, [searchedTeamMembers]);

  const groupedEndUsers = useMemo(() => {
    return searchedEndUsers.reduce((acc, user) => {
      if (!acc[user.tenantName]) {
        acc[user.tenantName] = [];
      }
      acc[user.tenantName].push(user);
      return acc;
    }, {} as Record<string, EndUser[]>);
  }, [searchedEndUsers]);

  const tabs = [
    { id: 'tenants', name: 'Tenants', icon: BuildingOfficeIcon, count: tenants.length },
    { id: 'team-members', name: 'Team Members', icon: UserGroupIcon, count: teamMembers.length },
    { id: 'end-users', name: 'End Users', icon: UsersIcon, count: endUsers.length }
  ];

  return (
    <DashboardLayout
      userType="super_admin"
      userName={user?.firstName || 'Super Admin'}
      tenantName={user?.tenantName}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-page-title">Tenants Management</h1>
            <p className="text-body mt-1">Manage all tenants, team members, and end users</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                  <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={`Search ${activeTab === 'tenants' ? 'tenants' : activeTab === 'team-members' ? 'team members' : 'end users'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Filter for Team Members and End Users tabs */}
          {(activeTab === 'team-members' || activeTab === 'end-users') && (
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter by Tenant:</span>
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="all">All Tenants</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200">
          {activeTab === 'tenants' && (
            <div className="p-6">
              <TenantManagement 
                onTenantCountChange={loadTenantsForFilter}
              />
            </div>
          )}

          {activeTab === 'team-members' && (
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading team members...</div>
              ) : Object.keys(groupedTeamMembers).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery || selectedTenant !== 'all' 
                    ? 'No team members found matching your criteria' 
                    : 'No team members found'}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedTeamMembers).map(([tenantName, members]) => (
                    <div key={tenantName} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleCollapse(tenantName)}
                        className="w-full px-6 py-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                        aria-expanded={!collapsedTenants.has(tenantName)}
                        aria-controls={`team-members-${tenantName.replace(/\s+/g, '-')}`}
                        aria-label={`Toggle ${tenantName} team members`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {collapsedTenants.has(tenantName) ? (
                              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                            )}
                            <BuildingOfficeIcon className="h-5 w-5 text-primary-600" />
                            <h3 className="text-lg font-medium text-gray-900">
                              {tenantName}
                            </h3>
                            <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-sm">
                              {members.length} member{members.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </button>
                      
                      {!collapsedTenants.has(tenantName) && (
                        <div className="border-t border-gray-200" id={`team-members-${tenantName.replace(/\s+/g, '-')}`}>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Login
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {members.map((member) => (
                                  <tr key={member.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">
                                        {member.firstName} {member.lastName}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {member.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {member.role}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        member.status === 'active' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {member.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString() : 'Never'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'end-users' && (
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading end users...</div>
              ) : Object.keys(groupedEndUsers).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery || selectedTenant !== 'all' 
                    ? 'No end users found matching your criteria' 
                    : 'No end users found'}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedEndUsers).map(([tenantName, users]) => (
                    <div key={tenantName} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleCollapse(tenantName)}
                        className="w-full px-6 py-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                        aria-expanded={!collapsedTenants.has(tenantName)}
                        aria-controls={`end-users-${tenantName.replace(/\s+/g, '-')}`}
                        aria-label={`Toggle ${tenantName} end users`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {collapsedTenants.has(tenantName) ? (
                              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                            )}
                            <BuildingOfficeIcon className="h-5 w-5 text-primary-600" />
                            <h3 className="text-lg font-medium text-gray-900">
                              {tenantName}
                            </h3>
                            <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-sm">
                              {users.length} user{users.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </button>
                      
                      {!collapsedTenants.has(tenantName) && (
                        <div className="border-t border-gray-200" id={`end-users-${tenantName.replace(/\s+/g, '-')}`}>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Application Status
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                  <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">
                                        {user.firstName} {user.lastName}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {user.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        user.applicationStatus === 'completed' 
                                          ? 'bg-green-100 text-green-800'
                                          : user.applicationStatus === 'in_progress'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        {user.applicationStatus || 'N/A'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        user.status === 'active' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {user.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TenantsPage;