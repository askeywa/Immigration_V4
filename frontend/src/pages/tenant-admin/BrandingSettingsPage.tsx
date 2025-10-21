import React, { useState, useEffect } from 'react';
import { 
  PhotoIcon, 
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  SwatchIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthStore } from '../../stores/auth-store';
import { TenantBranding } from '../../types/tenant-branding.types';
import { getTenantBranding, updateTenantBranding, applyTenantBrandingToPage } from '../../services/tenant-branding.service';

const BrandingSettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Current branding state (saved in database)
  const [currentBranding, setCurrentBranding] = useState<TenantBranding>({});
  
  // Preview state (temporary changes with instant visual feedback)
  const [previewBranding, setPreviewBranding] = useState<TenantBranding>(currentBranding);
  
  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  /**
   * Load current tenant branding
   */
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const response = await getTenantBranding();
        if (response.success && response.data) {
          setCurrentBranding(response.data);
          setPreviewBranding(response.data);
          applyTenantBrandingToPage(response.data);
          console.log('✅ Loaded tenant branding');
        }
      } catch (error) {
        console.error('Failed to load tenant branding:', error);
      }
    };

    if (user?.tenantId) {
      loadBranding();
    }
  }, [user?.tenantId]);

  /**
   * Check if there are unsaved changes
   */
  useEffect(() => {
    const logoChanged = previewBranding.logo !== currentBranding.logo;
    setHasUnsavedChanges(logoChanged);
  }, [previewBranding, currentBranding]);

  /**
   * Save branding changes
   */
  const handleSave = async () => {
    if (!hasUnsavedChanges) return;

    setIsSaving(true);
    try {
      const response = await updateTenantBranding({
        logo: previewBranding.logo
      });

      if (response.success && response.data) {
        setCurrentBranding(response.data);
        setPreviewBranding(response.data);
        applyTenantBrandingToPage(response.data);
        setHasUnsavedChanges(false);
        console.log('✅ Branding saved successfully');
      }
    } catch (error) {
      console.error('Failed to save branding:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Reset to saved state
   */
  const handleReset = () => {
    setPreviewBranding(currentBranding);
    setLogoFile(null);
    setLogoPreview(null);
    setHasUnsavedChanges(false);
  };

  /**
   * Handle logo file selection
   */
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
      
      // Update preview branding
      setPreviewBranding(prev => ({
        ...prev,
        logo: previewUrl
      }));
    }
  };

  /**
   * Remove logo
   */
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setPreviewBranding(prev => ({
      ...prev,
      logo: undefined
    }));
  };

  return (
    <DashboardLayout
      userType="tenant_admin"
      userName={`${user?.firstName} ${user?.lastName}`}
      tenantName={user?.tenantName}
    >
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-page-title">Branding Settings</h1>
          <p className="text-body mt-2">
            Customize your tenant's branding. Note: Colors are now unified across all tenants for consistency.
          </p>
        </div>

        {/* Logo Section */}
        <div className="card-data mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-section-title">Logo</h2>
              <p className="text-body">Upload your company logo to customize the header</p>
            </div>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="btn-secondary text-sm"
                  disabled={isSaving}
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary text-sm"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Logo Upload */}
          <div className="space-y-4">
            {/* Current Logo Preview */}
            {(previewBranding.logo || logoPreview) && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={logoPreview || previewBranding.logo}
                    alt="Logo preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Current Logo</p>
                  <p className="text-xs text-gray-500">This will appear in the header</p>
                </div>
                <button
                  onClick={handleRemoveLogo}
                  className="btn-icon text-red-600 hover:text-red-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Logo Upload Input */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              <label
                htmlFor="logo-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <PhotoIcon className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {logoFile ? 'Change Logo' : 'Upload Logo'}
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, or SVG up to 2MB
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Theme Notice */}
        <div className="card-data">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <SwatchIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Unified Theme System
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Colors are now standardized across all tenants for a consistent, professional appearance. 
                This ensures all dashboards maintain the same high-quality design standards.
              </p>
              <div className="text-xs text-gray-500">
                <p>• Primary Red: #DC2626</p>
                <p>• Secondary Orange: #EA580C</p>
                <p>• Warm White: #FAFAF8</p>
                <p>• Dark Gray: #1F2937</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BrandingSettingsPage;