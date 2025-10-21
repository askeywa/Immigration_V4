import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/auth-store';
import DOMPurify from 'dompurify';

interface DashboardHeaderProps {
  onMenuToggle: () => void;
  tenantLogo?: string;
  tenantName?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onMenuToggle,
  tenantLogo,
  tenantName,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Removed dark mode functionality - using unified theme

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfile = () => {
    setIsDropdownOpen(false);
    if (user) {
      navigate(`/${user.userType}/profile`);
    }
  };

  const handleSettings = () => {
    setIsDropdownOpen(false);
    if (user) {
      navigate(`/${user.userType}/settings`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: Mobile menu + Logo + App name */}
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            onClick={onMenuToggle}
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden transition-colors"
            aria-label="Toggle menu"
          >
            <Bars3Icon className="h-6 w-6 text-gray-700" />
          </button>

          {/* Logo + App Name */}
          <div className="flex items-center gap-3">
            {/* Tenant Logo (if available) */}
            {tenantLogo && (
              <img
                src={DOMPurify.sanitize(tenantLogo)}
                alt={DOMPurify.sanitize(tenantName || 'Tenant')}
                className="h-8 w-8 object-contain rounded"
              />
            )}

            {/* App Name */}
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-gray-900">
                Canadian Immigration Portal
              </h1>
              {tenantName && (
                <p className="text-xs text-gray-500 hidden sm:block">
                  {DOMPurify.sanitize(tenantName)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="User menu"
          >
            {/* User Avatar */}
            <div className="h-8 w-8 rounded-full bg-primary-600 text-white font-semibold flex items-center justify-center text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>

            {/* User Name (hidden on mobile) */}
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">
                {DOMPurify.sanitize(user?.firstName || '')} {DOMPurify.sanitize(user?.lastName || '')}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {DOMPurify.sanitize(user?.userType?.replace('_', ' ') || '')}
              </p>
            </div>

            {/* Dropdown icon */}
            <ChevronDownIcon
              className={`h-4 w-4 text-gray-500 transition-transform ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">
                  {DOMPurify.sanitize(user?.firstName || '')} {DOMPurify.sanitize(user?.lastName || '')}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {DOMPurify.sanitize(user?.email || '')}
                </p>
              </div>

              {/* Profile */}
              <button
                onClick={handleProfile}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <UserCircleIcon className="h-5 w-5" />
                <span>Profile</span>
              </button>

              {/* Settings */}
              <button
                onClick={handleSettings}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Cog6ToothIcon className="h-5 w-5" />
                <span>Settings</span>
              </button>

              {/* Divider */}
              <div className="my-1 border-t border-gray-200" />

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

