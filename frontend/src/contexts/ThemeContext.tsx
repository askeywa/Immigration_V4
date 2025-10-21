/**
 * Theme Context
 * Provides theme management across the application
 * 
 * Following theme-system.mdc:
 * - 2-mode theme support (Light, Dark)
 * - Tenant branding integration with custom color palettes
 * - Memoized color values
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ThemeMode, ThemeContextValue, TenantBranding } from '../types/theme.types';
import {
  getThemeColors,
  applyThemeColors,
  applyTenantBranding,
  saveThemePreference,
  loadThemePreference,
  getSystemTheme
} from '../utils/theme.utils';

/**
 * Theme Context
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Theme Provider Props
 */
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Provider Component
 * 
 * Following CORE-CRITICAL Rule 2: Memory leak prevention (cleanup in useEffect)
 * Following theme-system.mdc: Theme context pattern
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Load saved preference or use system preference
  const [mode, setModeInternal] = useState<ThemeMode>(() => {
    const saved = loadThemePreference();
    if (saved) return saved;
    
    const system = getSystemTheme();
    return system;
  });

  const [tenantBranding, setTenantBranding] = useState<TenantBranding | null>(null);

  // Memoize colors based on theme mode - Following theme-system.mdc
  const colors = useMemo(() => getThemeColors(mode), [mode]);

  // Memoize branding signature for efficient updates - Following theme-system.mdc
  const brandingSignature = useMemo(
    () => tenantBranding 
      ? `${tenantBranding.theme.palette}_${tenantBranding.theme.colors.primary}_${tenantBranding.theme.colors.secondary}` 
      : null,
    [tenantBranding]
  );

  /**
   * Set theme mode and save preference
   */
  const setMode = (newMode: ThemeMode): void => {
    setModeInternal(newMode);
    saveThemePreference(newMode);
  };

  /**
   * Apply theme colors when mode changes
   * Following CORE-CRITICAL Rule 2: Cleanup in useEffect
   */
  useEffect(() => {
    applyThemeColors(colors);

    // Apply theme class to body - preserve other classes
    const body = document.body;
    
    // Remove previous theme classes
    body.classList.remove('light', 'dark');
    
    // Add current theme class
    body.classList.add(mode);
    body.setAttribute('data-theme', mode);

    // Cleanup function - only remove theme-specific classes
    return () => {
      body.classList.remove('light', 'dark');
      body.removeAttribute('data-theme');
    };
  }, [mode, colors]);

  /**
   * Apply tenant branding when it changes
   * Following theme-system.mdc: Tenant branding integration with memoized signature
   */
  useEffect(() => {
    if (brandingSignature && tenantBranding) {
      applyTenantBranding(
        tenantBranding.theme.colors.primary,
        tenantBranding.theme.colors.secondary,
        tenantBranding.theme.colors.accent,
        tenantBranding.theme.colors.neutral,
        tenantBranding.theme.colors.surface
      );
    }
  }, [brandingSignature, tenantBranding]);

  /**
   * Listen for system theme changes
   * Following CORE-CRITICAL Rule 2: Cleanup event listeners
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent): void => {
      // Only update if user hasn't set a preference
      if (!loadThemePreference()) {
        setModeInternal(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    // Cleanup - CORE-CRITICAL Rule 2
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const value: ThemeContextValue = {
    mode,
    setMode,
    colors,
    tenantBranding,
    setTenantBranding
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * useTheme Hook
 * 
 * Following CORE-CRITICAL Rule 7: Use hooks, not direct store access
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  
  return context;
};
