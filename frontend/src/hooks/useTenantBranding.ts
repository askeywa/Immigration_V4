/**
 * useTenantBranding Hook
 * Global hook to load and apply tenant branding automatically
 * 
 * Usage: Call this hook in your main App.tsx or DashboardLayout.tsx
 * It will automatically load the tenant's branding when the user logs in
 */

import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { getTenantBranding, applyTenantBrandingToPage } from '../services/tenant-branding.service';

export const useTenantBranding = () => {
  const { user } = useAuthStore();
  
  useEffect(() => {
    // Only load branding if user is authenticated
    if (user) {
      const loadBranding = async () => {
        try {
          const response = await getTenantBranding();
          if (response.success && response.data) {
            applyTenantBrandingToPage(response.data);
            console.log('🎨 Applied tenant branding for:', user.tenantId);
          }
        } catch (error) {
          console.error('Failed to load tenant branding:', error);
        }
      };
      
      loadBranding();
    }
    
    // Cleanup function (optional)
    return () => {
      // No cleanup needed as CSS variables persist until overwritten
    };
  }, [user?.tenantId]); // Re-run if user changes or logs in
};

/**
 * USAGE EXAMPLE:
 * 
 * // In your App.tsx or main layout component:
 * 
 * import { useTenantBranding } from './hooks/useTenantBranding';
 * 
 * function App() {
 *   useTenantBranding(); // This line is all you need!
 *   
 *   return (
 *     <Router>
 *       <Routes>
 *         ...
 *       </Routes>
 *     </Router>
 *   );
 * }
 */

