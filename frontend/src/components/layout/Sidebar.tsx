import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  UserGroupIcon,
  UserCircleIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  BellIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';
import DOMPurify from 'dompurify';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

interface SidebarProps {
  userType: 'super_admin' | 'tenant_admin' | 'team_member' | 'client';
  permissions?: string[];
  tenantLogo?: string;
  tenantName?: string;
  isOpen: boolean;
  onClose: () => void;
  hiddenItems?: string[]; // Optional: hide specific menu items
}

const Sidebar: React.FC<SidebarProps> = ({
  userType,
  permissions = [],
  tenantName,
  isOpen,
  onClose,
  hiddenItems = [],
}) => {
  // Define role-specific menu items
  const getMenuItems = (): MenuItem[] => {
    switch (userType) {
      case 'super_admin':
        return [
          { name: 'Dashboard', href: '/super-admin/dashboard', icon: HomeIcon },
          { name: 'Tenants', href: '/super-admin/tenants', icon: BuildingOfficeIcon },
          { name: 'Users', href: '/super-admin/users', icon: UsersIcon },
          { name: 'Audit Logs', href: '/super-admin/audit-logs', icon: ClipboardDocumentListIcon },
          { name: 'System Health', href: '/super-admin/system-health', icon: ShieldCheckIcon },
          { name: 'Analytics', href: '/super-admin/analytics', icon: ChartBarIcon },
          { name: 'Settings', href: '/super-admin/settings', icon: Cog6ToothIcon },
        ];

      case 'tenant_admin':
        return [
          { name: 'Dashboard', href: '/tenant-admin/dashboard', icon: HomeIcon },
          { name: 'Team Members', href: '/tenant-admin/team-members', icon: UserGroupIcon },
          { name: 'Clients', href: '/tenant-admin/clients', icon: UsersIcon },
          { name: 'Reports', href: '/tenant-admin/reports', icon: ChartBarIcon },
          { name: 'Documents', href: '/tenant-admin/documents', icon: DocumentTextIcon },
          { name: 'Notifications', href: '/tenant-admin/notifications', icon: BellIcon },
          { name: 'Branding', href: '/tenant-admin/branding', icon: SwatchIcon },
          { name: 'Settings', href: '/tenant-admin/settings', icon: Cog6ToothIcon },
        ];

      case 'team_member':
        return [
          { name: 'Dashboard', href: '/team-member/dashboard', icon: HomeIcon },
          { name: 'My Clients', href: '/team-member/assigned-clients', icon: UsersIcon },
          { name: 'My Tasks', href: '/team-member/tasks', icon: ClipboardDocumentListIcon },
          { name: 'Documents', href: '/team-member/documents', icon: DocumentTextIcon },
          { name: 'Profile', href: '/team-member/profile', icon: UserCircleIcon },
        ];

      case 'client':
        return [
          { name: 'Dashboard', href: '/client/dashboard', icon: HomeIcon },
          { name: 'My Application', href: '/client/applications', icon: DocumentTextIcon },
          { name: 'Documents', href: '/client/documents', icon: ClipboardDocumentListIcon },
          { name: 'Messages', href: '/client/messages', icon: BellIcon },
          { name: 'Profile', href: '/client/profile', icon: UserCircleIcon },
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems().filter(
    (item) => !hiddenItems.includes(item.name.toLowerCase())
  );

  // Check if user has permission (if permission-based filtering is enabled)
  const hasPermission = (item: MenuItem): boolean => {
    if (!item.permission) return true;
    return permissions.includes(item.permission);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-50
          w-64 bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-800
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-200 dark:border-gray-800">
          {/* Application Logo */}
          <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">CI</span>
          </div>

          {/* Application Name */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
              Canadian Immigration
            </p>
            {tenantName && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {DOMPurify.sanitize(tenantName)}
              </p>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              if (!hasPermission(item)) return null;

              const Icon = item.icon;

              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={() => onClose()} // Close mobile menu on navigation
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`
                    }
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer (Optional branding) */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            © 2025 RCIC Portal
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

