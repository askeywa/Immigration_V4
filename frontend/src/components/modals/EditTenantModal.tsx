import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, BuildingOfficeIcon, UserIcon, Cog6ToothIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { TenantData, UpdateTenantInput } from '../../services/super-admin.service';
import DOMPurify from 'dompurify';

interface EditTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updateData: UpdateTenantInput) => void;
  tenant: TenantData | null;
  isUpdating: boolean;
}

const EditTenantModal: React.FC<EditTenantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tenant,
  isUpdating
}) => {
  const [formData, setFormData] = useState<UpdateTenantInput>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Initialize form data when tenant changes
  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name,
        domain: tenant.domain,
        subdomain: tenant.subdomain || '',
        status: tenant.status as 'active' | 'inactive' | 'suspended',
        plan: tenant.plan as 'free' | 'basic' | 'premium' | 'enterprise',
        adminFirstName: tenant.adminFirstName,
        adminLastName: tenant.adminLastName,
        maxTeamMembers: tenant.maxTeamMembers,
        maxClients: tenant.maxClients,
        features: { ...tenant.features },
        metadata: {
          rcicNumber: tenant.metadata?.rcicNumber || '',
          businessAddress: tenant.metadata?.businessAddress || '',
          phone: tenant.metadata?.phone || ''
        }
      });
      setErrors({});
    }
  }, [tenant]);

  // Escape key handler, focus management, and body scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUpdating) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      
      // Focus first field after animation
      setTimeout(() => {
        if (firstFieldRef.current) {
          firstFieldRef.current.focus();
        }
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isUpdating]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleFeatureChange = (feature: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features!,
        [feature]: checked
      }
    }));
  };

  const handleMetadataChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value
      }
    }));
  };

  const validateDomain = (domain: string): boolean => {
    // Length check (RFC 1035)
    if (domain.length < 3 || domain.length > 253) return false;
    
    // RFC-compliant domain regex
    // - No hyphens at start/end of labels
    // - Each label 1-63 chars
    // - At least one dot
    // - TLD at least 2 chars
    const domainRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,}$/;
    return domainRegex.test(domain);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Tenant name is required';
    }

    if (!formData.domain?.trim()) {
      newErrors.domain = 'Domain is required';
    } else if (!validateDomain(formData.domain)) {
      newErrors.domain = 'Please enter a valid domain (e.g., example.com)';
    }

    if (!formData.adminFirstName?.trim()) {
      newErrors.adminFirstName = 'Admin first name is required';
    }

    if (!formData.adminLastName?.trim()) {
      newErrors.adminLastName = 'Admin last name is required';
    }

    if (formData.maxTeamMembers !== undefined && formData.maxTeamMembers < 1) {
      newErrors.maxTeamMembers = 'Max team members must be at least 1';
    }

    if (formData.maxClients !== undefined && formData.maxClients < 1) {
      newErrors.maxClients = 'Max clients must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // SECURITY FIX: Sanitize all string inputs before sending
    const sanitizedData: UpdateTenantInput = {
      name: formData.name ? DOMPurify.sanitize(formData.name.trim()) : undefined,
      domain: formData.domain ? DOMPurify.sanitize(formData.domain.toLowerCase().trim()) : undefined,
      subdomain: formData.subdomain ? DOMPurify.sanitize(formData.subdomain.toLowerCase().trim()) : undefined,
      status: formData.status,
      plan: formData.plan,
      adminFirstName: formData.adminFirstName ? DOMPurify.sanitize(formData.adminFirstName.trim()) : undefined,
      adminLastName: formData.adminLastName ? DOMPurify.sanitize(formData.adminLastName.trim()) : undefined,
      maxTeamMembers: formData.maxTeamMembers,
      maxClients: formData.maxClients,
      features: formData.features
    };

    // Clean up and sanitize metadata fields
    if (formData.metadata) {
      const cleanedMetadata = Object.entries(formData.metadata)
        .filter(([_, value]) => value && value.trim())
        .reduce((acc, [key, value]) => {
          acc[key as keyof typeof formData.metadata] = DOMPurify.sanitize(value.trim());
          return acc;
        }, {} as NonNullable<typeof formData.metadata>);

      if (Object.keys(cleanedMetadata).length > 0) {
        sanitizedData.metadata = cleanedMetadata;
      }
    }

    onSuccess(sanitizedData);
  };

  const handleClose = () => {
    if (!isUpdating) {
      onClose();
    }
  };

  if (!isOpen || !tenant) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-tenant-title"
      aria-describedby="edit-tenant-description"
    >
      {/* Modal Container */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-in-out animate-in zoom-in-95 slide-in-from-bottom-4">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <BuildingOfficeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 id="edit-tenant-title" className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Tenant: {tenant?.name && DOMPurify.sanitize(tenant.name)}
              </h3>
              <p id="edit-tenant-description" className="text-sm text-gray-500 dark:text-gray-400">
                Update tenant information and settings
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isUpdating}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Information Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BuildingOfficeIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tenant-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tenant Name *
                  </label>
                  <input
                    ref={firstFieldRef}
                    id="tenant-name"
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    disabled={isUpdating}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'tenant-name-error' : undefined}
                  />
                  {errors.name && <p id="tenant-name-error" className="text-red-500 text-xs mt-1" role="alert">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="tenant-domain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Domain *
                  </label>
                  <input
                    id="tenant-domain"
                    type="text"
                    value={formData.domain || ''}
                    onChange={(e) => handleInputChange('domain', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.domain ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    disabled={isUpdating}
                    aria-invalid={!!errors.domain}
                    aria-describedby={errors.domain ? 'tenant-domain-error' : undefined}
                  />
                  {errors.domain && <p id="tenant-domain-error" className="text-red-500 text-xs mt-1" role="alert">{errors.domain}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subdomain
                  </label>
                  <input
                    type="text"
                    value={formData.subdomain || ''}
                    onChange={(e) => handleInputChange('subdomain', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={isUpdating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={isUpdating}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plan
                  </label>
                  <select
                    value={formData.plan || 'basic'}
                    onChange={(e) => handleInputChange('plan', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={isUpdating}
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Admin Information Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Information</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="admin-first-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    id="admin-first-name"
                    type="text"
                    value={formData.adminFirstName || ''}
                    onChange={(e) => handleInputChange('adminFirstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.adminFirstName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    disabled={isUpdating}
                    aria-invalid={!!errors.adminFirstName}
                    aria-describedby={errors.adminFirstName ? 'admin-first-name-error' : undefined}
                  />
                  {errors.adminFirstName && <p id="admin-first-name-error" className="text-red-500 text-xs mt-1" role="alert">{errors.adminFirstName}</p>}
                </div>

                <div>
                  <label htmlFor="admin-last-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    id="admin-last-name"
                    type="text"
                    value={formData.adminLastName || ''}
                    onChange={(e) => handleInputChange('adminLastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.adminLastName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    disabled={isUpdating}
                    aria-invalid={!!errors.adminLastName}
                    aria-describedby={errors.adminLastName ? 'admin-last-name-error' : undefined}
                  />
                  {errors.adminLastName && <p id="admin-last-name-error" className="text-red-500 text-xs mt-1" role="alert">{errors.adminLastName}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Admin Email (Read-only)
                  </label>
                  <input
                    type="email"
                    value={DOMPurify.sanitize(tenant.adminEmail)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Email cannot be changed for security reasons
                  </p>
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Cog6ToothIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Settings & Limits</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="max-team-members" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Team Members *
                  </label>
                  <input
                    id="max-team-members"
                    type="number"
                    min="1"
                    value={formData.maxTeamMembers || ''}
                    onChange={(e) => handleInputChange('maxTeamMembers', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.maxTeamMembers ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    disabled={isUpdating}
                    aria-invalid={!!errors.maxTeamMembers}
                    aria-describedby={errors.maxTeamMembers ? 'max-team-members-error' : undefined}
                  />
                  {errors.maxTeamMembers && <p id="max-team-members-error" className="text-red-500 text-xs mt-1" role="alert">{errors.maxTeamMembers}</p>}
                </div>

                <div>
                  <label htmlFor="max-clients" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Clients *
                  </label>
                  <input
                    id="max-clients"
                    type="number"
                    min="1"
                    value={formData.maxClients || ''}
                    onChange={(e) => handleInputChange('maxClients', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.maxClients ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    disabled={isUpdating}
                    aria-invalid={!!errors.maxClients}
                    aria-describedby={errors.maxClients ? 'max-clients-error' : undefined}
                  />
                  {errors.maxClients && <p id="max-clients-error" className="text-red-500 text-xs mt-1" role="alert">{errors.maxClients}</p>}
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <InformationCircleIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Available Features</h4>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'visitorVisa', label: 'Visitor Visa' },
                  { key: 'studyVisa', label: 'Study Visa' },
                  { key: 'workPermit', label: 'Work Permit' },
                  { key: 'permanentResidence', label: 'Permanent Residence' },
                  { key: 'familySponsorship', label: 'Family Sponsorship' },
                  { key: 'businessImmigration', label: 'Business Immigration' }
                ].map((feature) => (
                  <label key={feature.key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.features?.[feature.key as keyof typeof formData.features] || false}
                      onChange={(e) => handleFeatureChange(feature.key, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isUpdating}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{feature.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Metadata Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <InformationCircleIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Information</h4>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    RCIC Number
                  </label>
                  <input
                    type="text"
                    value={formData.metadata?.rcicNumber || ''}
                    onChange={(e) => handleMetadataChange('rcicNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={isUpdating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Business Address
                  </label>
                  <textarea
                    value={formData.metadata?.businessAddress || ''}
                    onChange={(e) => handleMetadataChange('businessAddress', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={isUpdating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.metadata?.phone || ''}
                    onChange={(e) => handleMetadataChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUpdating}
            className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isUpdating}
            className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-lg shadow-sm hover:shadow-md flex items-center gap-2"
          >
            {isUpdating ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Updating...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTenantModal;
