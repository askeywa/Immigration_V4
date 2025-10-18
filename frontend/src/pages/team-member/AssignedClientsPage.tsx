import React from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthStore } from '../../stores/auth-store';

const AssignedClientsPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <DashboardLayout
      userType="team_member"
      userName={user?.firstName || 'Team Member'}
      tenantName={user?.tenantName}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <h1 className="text-page-title">Assigned Clients
        </h1><p className="text-body mt-1">View and manage your assigned clients</p>

        <div className="card p-6 mt-6">
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-section-title mb-2">Assigned Clients</h3>
            <p className="text-body">This page will contain your assigned clients
            </p>
          </div>
        </div>
      </div></DashboardLayout>
  );
};

export default AssignedClientsPage;
