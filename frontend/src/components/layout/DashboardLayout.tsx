import React, { useState } from 'react';
import DashboardHeader from './DashboardHeader';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../stores/auth-store';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: 'super_admin' | 'tenant_admin' | 'team_member' | 'client';
  userName: string;
  tenantName?: string;
  hiddenItems?: string[]; // Optional: hide specific sidebar items
  tenantLogo?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userType,
  tenantName,
  hiddenItems = [],
  tenantLogo,
}) => {
  const { user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <Sidebar
        userType={userType}
        permissions={user?.permissions || []}
        tenantLogo={tenantLogo}
        tenantName={tenantName}
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        hiddenItems={hiddenItems}
      />

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Header */}
        <DashboardHeader
          onMenuToggle={toggleMobileMenu}
          tenantLogo={tenantLogo}
          tenantName={tenantName}
        />

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

