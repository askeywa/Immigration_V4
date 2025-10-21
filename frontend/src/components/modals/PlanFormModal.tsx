/**
 * Plan Form Modal Component
 * Modal for creating and editing subscription plans
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { 
  SubscriptionPlanService, 
  CreateSubscriptionPlanInput, 
  UpdateSubscriptionPlanInput,
  SubscriptionPlanData 
} from '../../services/subscription-plan.service';
import logger from '../../utils/logger';

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plan?: SubscriptionPlanData | null; // null for create, plan object for edit
  mode: 'create' | 'edit';
}

const PlanFormModal: React.FC<PlanFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  plan,
  mode
}) => {
  const [formData, setFormData] = useState<CreateSubscriptionPlanInput>({
    name: '',
    slug: '',
    description: '',
    pricing: {
      monthly: 0,
      yearly: 0,
      currency: 'USD'
    },
    limits: {
      maxTeamMembers: 5,
      maxClients: 100,
      maxStorage: 1024,
      apiCallsPerMonth: 10000,
      documentUploadsPerMonth: 1000
    },
    features: {
      visitorVisa: true,
      studyVisa: false,
      workPermit: false,
      permanentResidence: false,
      familySponsorship: false,
      businessImmigration: false,
      customBranding: false,
      whiteLabel: false,
      prioritySupport: false,
      apiAccess: false,
      advancedAnalytics: false,
      customIntegrations: false
    },
    status: 'active',
    isPopular: false,
    sortOrder: 0,
    trialDays: 14
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugAvailable, setSlugAvailable] = useState(true);

  // Initialize form data when modal opens or plan changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && plan) {
        setFormData({
          name: plan.name,
          slug: plan.slug,
          description: plan.description,
          pricing: plan.pricing,
          limits: plan.limits,
          features: plan.features,
          status: plan.status as 'active' | 'inactive' | 'archived',
          isPopular: plan.isPopular,
          sortOrder: plan.sortOrder,
          trialDays: plan.trialDays
        });
      } else {
        // Reset form for create mode
        setFormData({
          name: '',
          slug: '',
          description: '',
          pricing: {
            monthly: 0,
            yearly: 0,
            currency: 'USD'
          },
          limits: {
            maxTeamMembers: 5,
            maxClients: 100,
            maxStorage: 1024,
            apiCallsPerMonth: 10000,
            documentUploadsPerMonth: 1000
          },
          features: {
            visitorVisa: true,
            studyVisa: false,
            workPermit: false,
            permanentResidence: false,
            familySponsorship: false,
            businessImmigration: false,
            customBranding: false,
            whiteLabel: false,
            prioritySupport: false,
            apiAccess: false,
            advancedAnalytics: false,
            customIntegrations: false
          },
          status: 'active',
          isPopular: false,
          sortOrder: 0,
          trialDays: 14
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, plan]);

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && mode === 'create') {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, mode]);

  // Check slug availability
  useEffect(() => {
    if (!formData.slug || mode === 'edit') return;
    
    const checkSlug = async () => {
      try {
        const response = await SubscriptionPlanService.checkSlugAvailability(formData.slug!);
        setSlugAvailable(response.available);
        if (!response.available) {
          setErrors(prev => ({ ...prev, slug: 'This slug is already in use' }));
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.slug;
            return newErrors;
          });
        }
      } catch (error) {
        // Handle error silently, validation will catch on submit
        setSlugAvailable(true);
      }
    };

    const timer = setTimeout(checkSlug, 500); // Debounce
    return () => clearTimeout(timer);
  }, [formData.slug, mode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }

    if (!formData.slug?.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (formData.slug.length < 2) {
      newErrors.slug = 'Slug must be at least 2 characters';
    } else if (mode === 'create' && !slugAvailable) {
      newErrors.slug = 'This slug is already in use';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.pricing.monthly < 0) {
      newErrors.monthly = 'Monthly price must be non-negative';
    }

    if (formData.pricing.yearly < 0) {
      newErrors.yearly = 'Yearly price must be non-negative';
    }

    if (formData.limits.maxTeamMembers < 1) {
      newErrors.maxTeamMembers = 'Must allow at least 1 team member';
    }

    if (formData.limits.maxClients < 1) {
      newErrors.maxClients = 'Must allow at least 1 client';
    }

    if (formData.limits.maxStorage < 1) {
      newErrors.maxStorage = 'Storage must be at least 1MB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        await SubscriptionPlanService.createPlan(formData);
      } else if (mode === 'edit' && plan) {
        const updateData: UpdateSubscriptionPlanInput = {
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          pricing: formData.pricing,
          limits: formData.limits,
          features: formData.features,
          status: formData.status,
          isPopular: formData.isPopular,
          sortOrder: formData.sortOrder,
          trialDays: formData.trialDays
        };
        await SubscriptionPlanService.updatePlan(plan.id, updateData);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      logger.error('Save plan failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        mode,
        planId: plan?.id
      });
      
      // Handle different error types
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        setErrors({ submit: axiosError.response?.data?.error?.message || 'Failed to save plan' });
      } else if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: 'An unknown error occurred' });
      }
    } finally {
      setLoading(false);
    }
  };

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

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as any),
        [field]: value
      }
    }));
  };

  const handleFeatureChange = (feature: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Create New Plan' : 'Edit Plan'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md">
                {errors.submit}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                      errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter plan name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                      errors.slug ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="plan-slug"
                  />
                  {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                  {formData.slug && mode === 'create' && !errors.slug && (
                    <p className={`mt-1 text-sm ${slugAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {slugAvailable ? '✓ Slug is available' : '✗ Slug is already in use'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                      errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Describe this plan"
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={formData.isPopular}
                    onChange={(e) => handleInputChange('isPopular', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPopular" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Mark as Popular Plan
                  </label>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pricing</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Price (USD) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.pricing.monthly}
                    onChange={(e) => handleNestedInputChange('pricing', 'monthly', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                      errors.monthly ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.monthly && <p className="mt-1 text-sm text-red-600">{errors.monthly}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Yearly Price (USD) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.pricing.yearly}
                    onChange={(e) => handleNestedInputChange('pricing', 'yearly', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                      errors.yearly ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.yearly && <p className="mt-1 text-sm text-red-600">{errors.yearly}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Trial Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.trialDays}
                    onChange={(e) => handleInputChange('trialDays', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currency *
                  </label>
                  <select
                    value={formData.pricing.currency}
                    onChange={(e) => handleNestedInputChange('pricing', 'currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Limits */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Limits</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Team Members *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.limits.maxTeamMembers}
                    onChange={(e) => handleNestedInputChange('limits', 'maxTeamMembers', parseInt(e.target.value) || 1)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                      errors.maxTeamMembers ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.maxTeamMembers && <p className="mt-1 text-sm text-red-600">{errors.maxTeamMembers}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Clients *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.limits.maxClients}
                    onChange={(e) => handleNestedInputChange('limits', 'maxClients', parseInt(e.target.value) || 1)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                      errors.maxClients ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.maxClients && <p className="mt-1 text-sm text-red-600">{errors.maxClients}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Storage (MB) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.limits.maxStorage}
                    onChange={(e) => handleNestedInputChange('limits', 'maxStorage', parseInt(e.target.value) || 1)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                      errors.maxStorage ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.maxStorage && <p className="mt-1 text-sm text-red-600">{errors.maxStorage}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max API Calls Per Month *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.limits.apiCallsPerMonth}
                    onChange={(e) => handleNestedInputChange('limits', 'apiCallsPerMonth', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Document Uploads Per Month *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.limits.documentUploadsPerMonth}
                    onChange={(e) => handleNestedInputChange('limits', 'documentUploadsPerMonth', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Features</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(formData.features || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={key}
                      checked={value}
                      onChange={(e) => handleFeatureChange(key, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={key} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    {mode === 'create' ? 'Create Plan' : 'Update Plan'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PlanFormModal;
