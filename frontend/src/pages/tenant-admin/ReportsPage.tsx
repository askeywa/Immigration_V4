import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthStore } from '../../stores/auth-store';

const ReportsPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <DashboardLayout
      userType="tenant_admin"
      userName={user?.firstName || 'Tenant Admin'}
      tenantName={user?.tenantName}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-600 mt-2">
          View analytics and reports for your organization
        </p>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mt-6">
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-base font-semibold text-gray-900 mb-2">Reports</h3>
            <p className="text-sm text-gray-600">
              This page will contain reporting functionality
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;