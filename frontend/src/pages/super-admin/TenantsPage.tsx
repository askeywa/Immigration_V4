import React, { useState, useEffect, useCallback } from 'react';
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

  // Load tenants data
  const loadTenants = useCallback(async () => {
    try {
      setLoading(true);
      // Load real data from API
      const response = await SuperAdminService.getTenants();
      if (response.success && response.data) {
        setTenants(response.data.tenants);
        return;
      } else {
        throw new Error(response.error?.message || 'Failed to load tenants');
      }
      
    } catch (error) {
      console.error('Failed to load tenants:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load team members data (mock data for now)
  const loadTeamMembers = useCallback(async () => {
    try {
      setLoading(true);
      // Comprehensive mock data - replace with actual API call
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
      console.error('Failed to load team members:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load end users data (mock data for now)
  const loadEndUsers = useCallback(async () => {
    try {
      setLoading(true);
      // Comprehensive mock data - replace with actual API call
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
      console.error('Failed to load end users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all data when component mounts
  useEffect(() => {
    loadTenants();
    loadTeamMembers();
    loadEndUsers();
  }, [loadTenants, loadTeamMembers, loadEndUsers]);

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
  const searchTenants = (query: string) => {
    if (!query) return tenants;
    return tenants.filter(tenant => 
      tenant.name.toLowerCase().includes(query.toLowerCase()) ||
      tenant.domain.toLowerCase().includes(query.toLowerCase()) ||
      tenant.adminEmail.toLowerCase().includes(query.toLowerCase()) ||
      `${tenant.adminFirstName} ${tenant.adminLastName}`.toLowerCase().includes(query.toLowerCase())
    );
  };

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

  // Filter data based on selected tenant and search query
  const filteredTenants = searchTenants(searchQuery);
  
  // Get selected tenant name for filtering
  const selectedTenantName = selectedTenant === 'all' 
    ? null 
    : tenants.find(t => t.id === selectedTenant)?.name;

  const filteredTeamMembers = selectedTenant === 'all' 
    ? teamMembers 
    : teamMembers.filter(member => member.tenantName === selectedTenantName);
  const searchedTeamMembers = searchTeamMembers(searchQuery, filteredTeamMembers);

  const filteredEndUsers = selectedTenant === 'all' 
    ? endUsers 
    : endUsers.filter(user => user.tenantName === selectedTenantName);
  const searchedEndUsers = searchEndUsers(searchQuery, filteredEndUsers);

  // Group data by tenant
  const groupedTeamMembers = searchedTeamMembers.reduce((acc, member) => {
    if (!acc[member.tenantName]) {
      acc[member.tenantName] = [];
    }
    acc[member.tenantName].push(member);
    return acc;
  }, {} as Record<string, TeamMember[]>);

  const groupedEndUsers = searchedEndUsers.reduce((acc, user) => {
    if (!acc[user.tenantName]) {
      acc[user.tenantName] = [];
    }
    acc[user.tenantName].push(user);
    return acc;
  }, {} as Record<string, EndUser[]>);

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
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tenant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage
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
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          Loading tenants...
                        </td>
                      </tr>
                    ) : filteredTenants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          {searchQuery ? 'No tenants found matching your search' : 'No tenants found'}
                        </td>
                      </tr>
                    ) : (
                      filteredTenants.map((tenant) => (
                        <tr key={tenant.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                              <div className="text-sm text-gray-500">{tenant.domain}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {tenant.adminFirstName} {tenant.adminLastName}
                            </div>
                            <div className="text-sm text-gray-500">{tenant.adminEmail}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              tenant.plan === 'premium' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {tenant.plan}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>Team: {tenant.currentTeamMembers}/{tenant.maxTeamMembers}</div>
                            <div>Users: {tenant.currentClients}/{tenant.maxClients}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              tenant.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {tenant.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
                        <div className="border-t border-gray-200">
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
                        <div className="border-t border-gray-200">
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