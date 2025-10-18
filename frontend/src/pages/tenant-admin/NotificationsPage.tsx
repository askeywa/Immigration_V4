import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthStore } from '../../stores/auth-store';

const NotificationsPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <DashboardLayout
      userType="tenant_admin"
      userName={user?.firstName || 'Tenant Admin'}
      tenantName={user?.tenantName}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <h1 className="text-page-title">Notifications
        </h1><p className="text-body mt-1">Manage notifications and alerts</p>

        <div className="card p-6 mt-6">
          <div className="text-center py-12">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-section-title mb-2">Notifications</h3>
            <p className="text-body">This page will contain notification management
            </p>
          </div>
        </div>
      </div></DashboardLayout>
  );
};

export default NotificationsPage;
