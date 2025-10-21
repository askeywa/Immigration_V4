/**
 * Theme Utilities
 * Color schemes for 2-mode theme support with tenant branding
 * 
 * Following theme-system.mdc: Light, Dark + Tenant Branding
 */

import { ThemeMode, ThemeColors } from '../types/theme.types';

/**
 * Get theme colors based on mode
 */
export const getThemeColors = (mode: ThemeMode): ThemeColors => {
  const themes: Record<ThemeMode, ThemeColors> = {
    light: {
      background: 'rgb(255, 255, 255)',
      foreground: 'rgb(0, 0, 0)',
      primary: 'rgb(220, 38, 38)', // Red 600 (default)
      secondary: 'rgb(239, 68, 68)', // Red 500
      accent: 'rgb(248, 113, 113)', // Red 400
      muted: 'rgb(243, 244, 246)', // Gray 100
      border: 'rgb(229, 231, 235)', // Gray 200
      card: 'rgb(255, 255, 255)',
      cardForeground: 'rgb(0, 0, 0)',
      popover: 'rgb(255, 255, 255)',
      popoverForeground: 'rgb(0, 0, 0)',
      destructive: 'rgb(239, 68, 68)', // Red 500
      destructiveForeground: 'rgb(255, 255, 255)',
      success: 'rgb(34, 197, 94)', // Green 500
      warning: 'rgb(234, 179, 8)', // Yellow 500
      info: 'rgb(59, 130, 246)', // Blue 500
    },
    dark: {
      background: 'rgb(17, 24, 39)', // Gray 900
      foreground: 'rgb(255, 255, 255)',
      primary: 'rgb(248, 113, 113)', // Red 400
      secondary: 'rgb(252, 165, 165)', // Red 300
      accent: 'rgb(254, 202, 202)', // Red 200
      muted: 'rgb(31, 41, 55)', // Gray 800
      border: 'rgb(55, 65, 81)', // Gray 700
      card: 'rgb(31, 41, 55)', // Gray 800
      cardForeground: 'rgb(255, 255, 255)',
      popover: 'rgb(31, 41, 55)',
      popoverForeground: 'rgb(255, 255, 255)',
      destructive: 'rgb(248, 113, 113)', // Red 400
      destructiveForeground: 'rgb(255, 255, 255)',
      success: 'rgb(74, 222, 128)', // Green 400
      warning: 'rgb(250, 204, 21)', // Yellow 400
      info: 'rgb(96, 165, 250)', // Blue 400
    },
  };

  return themes[mode];
};

/**
 * Apply theme colors to CSS custom properties
 */
export const applyThemeColors = (colors: ThemeColors): void => {
  const root = document.documentElement;

  root.style.setProperty('--color-background', colors.background);
  root.style.setProperty('--color-foreground', colors.foreground);
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-muted', colors.muted);
  root.style.setProperty('--color-border', colors.border);
  root.style.setProperty('--color-card', colors.card);
  root.style.setProperty('--color-card-foreground', colors.cardForeground);
  root.style.setProperty('--color-destructive', colors.destructive);
  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-warning', colors.warning);
  root.style.setProperty('--color-info', colors.info);
};

/**
 * Validate CSS color string to prevent injection
 * Only allows valid hex, rgb, rgba, hsl, hsla formats
 */
const isValidCSSColor = (color: string): boolean => {
  // Hex colors: #RGB, #RRGGBB, #RRGGBBAA
  const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
  
  // RGB/RGBA: rgb(r, g, b) or rgba(r, g, b, a)
  const rgbPattern = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/;
  
  // HSL/HSLA: hsl(h, s%, l%) or hsla(h, s%, l%, a)
  const hslPattern = /^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+\s*)?\)$/;
  
  // Named colors - allow common CSS color names
  const namedColorPattern = /^(red|blue|green|yellow|purple|orange|pink|gray|black|white)$/i;
  
  return hexPattern.test(color) || 
         rgbPattern.test(color) || 
         hslPattern.test(color) ||
         namedColorPattern.test(color);
};

/**
 * Apply tenant branding
 * Following theme-system.mdc: Tenant branding integration
 * 
 * SECURITY: Validates color strings to prevent CSS injection attacks
 */
export const applyTenantBranding = (
  primaryColor?: string, 
  secondaryColor?: string, 
  accentColor?: string,
  neutralColor?: string,
  surfaceColor?: string
): void => {
  if (!primaryColor) return;

  const root = document.documentElement;
  
  // SECURITY: Validate all colors before injection
  const colors = [
    { key: 'primary', value: primaryColor },
    { key: 'secondary', value: secondaryColor },
    { key: 'accent', value: accentColor },
    { key: 'neutral', value: neutralColor },
    { key: 'surface', value: surfaceColor }
  ];

  colors.forEach(({ key, value }) => {
    if (value && isValidCSSColor(value)) {
      // Apply to CSS custom properties for Tailwind integration
      root.style.setProperty(`--color-${key}`, value);
      root.style.setProperty(`--color-primary-500`, primaryColor);
      root.style.setProperty(`--color-primary-600`, secondaryColor || primaryColor);
      root.style.setProperty(`--color-primary-700`, accentColor || primaryColor);
    }
  });
};

/**
 * Get system theme preference
 */
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * Save theme preference
 * Handles storage quota errors gracefully
 */
export const saveThemePreference = (mode: ThemeMode): void => {
  try {
    localStorage.setItem('theme_mode', mode);
  } catch (error) {
    // Storage quota exceeded or disabled
    // Theme will use default/system preference instead
    // TODO: Log warning
    // logger.warn('Failed to save theme preference', { error });
  }
};

/**
 * Load theme preference
 */
export const loadThemePreference = (): ThemeMode | null => {
  const saved = localStorage.getItem('theme_mode');
  
  if (saved && ['light', 'dark'].includes(saved)) {
    return saved as ThemeMode;
  }
  
  return null;
};
