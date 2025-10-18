/**
 * Simplified Tenant Branding Service
 * Uses unified theme - no dynamic color changes
 * Only handles logo management
 */

import { TenantBranding } from '../types/tenant-branding.types';
import { apiClient } from './api-client';
import { ApiResponse } from '../types/api.types';

export interface UpdateBrandingRequest {
  logo?: string;
}

/**
 * Get current tenant branding (logo only)
 */
export const getTenantBranding = async (): Promise<ApiResponse<TenantBranding>> => {
  return apiClient.get<TenantBranding>('/api/v1/tenant/branding');
};

/**
 * Update tenant branding (logo only)
 */
export const updateTenantBranding = async (branding: UpdateBrandingRequest): Promise<ApiResponse<TenantBranding>> => {
  return apiClient.put<TenantBranding>('/api/v1/tenant/branding', branding);
};

/**
 * Remove tenant logo
 */
export const removeTenantLogo = async (): Promise<ApiResponse<{}>> => {
  return apiClient.delete('/api/v1/tenant/branding/logo');
};

/**
 * Apply tenant logo to the page (simplified - no color changes)
 */
export const applyTenantBrandingToPage = (branding: TenantBranding): void => {
  try {
    const root = document.documentElement;
    
    // Only handle logo - no color changes
    if (branding.logo) {
      root.style.setProperty('--tenant-logo', `url(${branding.logo})`);
    } else {
      root.style.removeProperty('--tenant-logo');
    }

  } catch (error) {
    console.error('Failed to apply tenant branding:', error);
  }
};