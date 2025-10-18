/**
 * Theme Type Definitions
 * Following theme-system.mdc: 2-mode theme support (Light/Dark + Tenant Branding)
 */

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  border: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  warning: string;
  info: string;
}

export interface TenantBranding {
  logo?: string;
  theme: {
    palette: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      neutral: string;
      surface: string;
    };
  };
}

export interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  tenantBranding: TenantBranding | null;
  setTenantBranding: (branding: TenantBranding | null) => void;
}
