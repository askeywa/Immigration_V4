import React from 'react';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthStore } from '../../stores/auth-store';

const AuditLogPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <DashboardLayout
      userType="super_admin"
      userName={user?.firstName || 'Super Admin'}
      tenantName={user?.tenantName}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <h1 className="text-page-title">Audit Logs
        </h1><p className="text-body mt-1">View system audit logs and security events</p>

        <div className="card p-6 mt-6">
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-section-title mb-2">Audit Logs</h3>
            <p className="text-body">This page will contain audit log functionality
            </p>
          </div>
        </div>
      </div></DashboardLayout>
  );
};

export default AuditLogPage;
