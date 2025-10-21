/**
 * App Component
 * Main application with routing and providers
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 6: Error boundaries for all providers
 * - Rule 7: Use hooks, not direct store access
 * - Rule 2: Memory leak prevention (cleanup in useEffect)
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { useTenantBranding } from './hooks/useTenantBranding';
import { useSessionTracker } from './hooks/useSessionTracker';
import { LandingPage } from './pages/LandingPage';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { EmailVerification } from './pages/EmailVerification';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import TenantAdminDashboard from './pages/TenantAdminDashboard';
import TeamMemberDashboard from './pages/TeamMemberDashboard';
import ClientDashboard from './pages/ClientDashboard';

// Super Admin Pages
import TenantsPage from './pages/super-admin/TenantsPage';
import SubscriptionPlansPage from './pages/super-admin/SubscriptionPlansPage';
import AuditLogPage from './pages/super-admin/AuditLogPage';
import SystemHealthPage from './pages/super-admin/SystemHealthPage';
import AnalyticsPage from './pages/super-admin/AnalyticsPage';
import SuperAdminSettingsPage from './pages/super-admin/SettingsPage';

// Tenant Admin Pages
import TeamMembersPage from './pages/tenant-admin/TeamMembersPage';
import ClientsPage from './pages/tenant-admin/ClientsPage';
import ReportsPage from './pages/tenant-admin/ReportsPage';
import TenantDocumentsPage from './pages/tenant-admin/DocumentsPage';
import NotificationsPage from './pages/tenant-admin/NotificationsPage';
import TenantAdminSettingsPage from './pages/tenant-admin/SettingsPage';
import BrandingSettingsPage from './pages/tenant-admin/BrandingSettingsPage';

// Team Member Pages
import AssignedClientsPage from './pages/team-member/AssignedClientsPage';
import TasksPage from './pages/team-member/TasksPage';
import TeamMemberProfilePage from './pages/team-member/ProfilePage';
import TeamMemberDocumentsPage from './pages/team-member/DocumentsPage';

// Client Pages
import MyApplicationsPage from './pages/client/MyApplicationsPage';
import DocumentsPage from './pages/client/DocumentsPage';
import ClientProfilePage from './pages/client/ProfilePage';
import MessagesPage from './pages/client/MessagesPage';

import { useAuthStore } from './stores/auth-store';

/**
 * App Component
 * 
 * Following CORE-CRITICAL Rule 6: Error boundaries wrapping providers
 */
const App: React.FC = () => {
  // Initialize auth on app start
  const { initializeAuth } = useAuthStore();
  
  // CRITICAL FIX: Load tenant branding automatically when user logs in
  useTenantBranding();
  
  // Track user session activity
  useSessionTracker();

  // Following CORE-CRITICAL Rule 2: Cleanup in useEffect
  useEffect(() => {
    let isMounted = true;

    const initialize = async (): Promise<void> => {
      if (isMounted) {
        await initializeAuth();
      }
    };

    initialize();

    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [initializeAuth]);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            
            {/* RCIC System Protected Routes */}
            <Route
              path="/super-admin/dashboard"
              element={
                <ProtectedRoute>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant-admin/dashboard"
              element={
                <ProtectedRoute>
                  <TenantAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team-member/dashboard"
              element={
                <ProtectedRoute>
                  <TeamMemberDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/dashboard"
              element={
                <ProtectedRoute>
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />

            {/* Super Admin Pages */}
            <Route
              path="/super-admin/tenants"
              element={
                <ProtectedRoute>
                  <TenantsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/subscription-plans"
              element={
                <ProtectedRoute>
                  <SubscriptionPlansPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/audit-logs"
              element={
                <ProtectedRoute>
                  <AuditLogPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/system-health"
              element={
                <ProtectedRoute>
                  <SystemHealthPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/settings"
              element={
                <ProtectedRoute>
                  <SuperAdminSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Tenant Admin Pages */}
            <Route
              path="/tenant-admin/team-members"
              element={
                <ProtectedRoute>
                  <TeamMembersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant-admin/clients"
              element={
                <ProtectedRoute>
                  <ClientsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant-admin/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant-admin/documents"
              element={
                <ProtectedRoute>
                  <TenantDocumentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant-admin/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant-admin/settings"
              element={
                <ProtectedRoute>
                  <TenantAdminSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant-admin/branding"
              element={
                <ProtectedRoute>
                  <BrandingSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Team Member Pages */}
            <Route
              path="/team-member/assigned-clients"
              element={
                <ProtectedRoute>
                  <AssignedClientsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team-member/tasks"
              element={
                <ProtectedRoute>
                  <TasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team-member/profile"
              element={
                <ProtectedRoute>
                  <TeamMemberProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team-member/documents"
              element={
                <ProtectedRoute>
                  <TeamMemberDocumentsPage />
                </ProtectedRoute>
              }
            />

            {/* Client Pages */}
            <Route
              path="/client/applications"
              element={
                <ProtectedRoute>
                  <MyApplicationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/documents"
              element={
                <ProtectedRoute>
                  <DocumentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/profile"
              element={
                <ProtectedRoute>
                  <ClientProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;

