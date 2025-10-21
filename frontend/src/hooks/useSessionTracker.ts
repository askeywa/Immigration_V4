/**
 * Session Tracker Hook
 * Tracks user activity and updates last activity timestamp
 * Used for session management and auto-logout
 */

import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth-store';

/**
 * Session Tracker Hook
 * Updates last activity timestamp when user is active
 */
export const useSessionTracker = () => {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Update last activity on user interaction
    const updateLastActivity = () => {
      localStorage.setItem('last_activity', Date.now().toString());
    };

    // Track various user activities
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, updateLastActivity, true);
    });

    // Initial activity update
    updateLastActivity();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateLastActivity, true);
      });
    };
  }, [isAuthenticated]);
};
