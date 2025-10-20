import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CreditCardIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthStore } from '../../stores/auth-store';
import { 
  SubscriptionPlanService, 
  SubscriptionPlanData
} from '../../services/subscription-plan.service';
import PlanFormModal from '../../components/modals/PlanFormModal';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';

const SubscriptionPlansPage: React.FC = () => {
  const { user } = useAuthStore();
  
  // Timer ref for message auto-dismiss cleanup
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // State
  const [plans, setPlans] = useState<SubscriptionPlanData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanData | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);


  // Load plans with pagination
  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await SubscriptionPlanService.getPlans(currentPage, 20);
      
      if (response.success && response.data) {
        setPlans(response.data.data);
        setPagination(response.data.pagination);
      } else {
        showMessage('error', response.error?.message || 'Failed to load plans');
      }
    } catch (error) {
      showMessage('error', 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  // Show message with proper timer cleanup
  const showMessage = (type: 'success' | 'error', text: string) => {
    // Clear any existing timer
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    setMessage({ type, text });

    // Set new timer
    messageTimeoutRef.current = setTimeout(() => {
      setMessage(null);
      messageTimeoutRef.current = null;
    }, 5000);
  };

  // Filter and search plans
  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plan.slug.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || plan.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });



  // Handle toggle status
  const handleToggleStatus = async (plan: SubscriptionPlanData) => {
    try {
      setLoading(true);
      const newStatus = plan.status === 'active' ? 'inactive' : 'active';
      const response = await SubscriptionPlanService.updatePlanStatus(plan.id, newStatus);
      if (response.success) {
        showMessage('success', `Plan ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        await loadPlans();
      } else {
        showMessage('error', response.error?.message || 'Failed to update status');
      }
    } catch (error) {
      showMessage('error', 'Failed to update plan status');
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (plan: SubscriptionPlanData) => {
    setSelectedPlan(plan);
    setShowEditModal(true);
  };

  // Open delete confirm
  const openDeleteConfirm = (plan: SubscriptionPlanData) => {
    setSelectedPlan(plan);
    setShowDeleteConfirm(true);
  };

  // Modal success handlers
  const handleModalSuccess = async () => {
    showMessage('success', 'Operation completed successfully');
    await loadPlans();
  };


  return (
    <DashboardLayout userType="super_admin" userName={user?.firstName || 'Admin'}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Subscription Plans
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                  Manage subscription plans and pricing
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-200"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add New Plan
              </button>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg shadow-sm ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'}`}>
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search plans..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white shadow-sm transition-all duration-200"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white shadow-sm transition-all duration-200 min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Plans Grid */}
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">Loading subscription plans...</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="text-center py-16">
                <CreditCardIcon className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">No plans found</h3>
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
                  Get started by creating a new subscription plan.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1"
                >
                {/* Popular Badge */}
                {plan.isPopular && (
                  <div className="absolute top-3 right-3">
                    <StarIcon className="h-5 w-5 text-yellow-500" />
                  </div>
                )}

                {/* Plan Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      plan.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : plan.status === 'inactive'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {plan.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {plan.description}
                  </p>
                  
                  {/* Pricing */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {plan.monthlyPriceFormatted}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      or {plan.yearlyPriceFormatted}/year
                    </div>
                  </div>
                </div>

                {/* Compact Limits */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-600">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 dark:text-white">{plan.limits.maxTeamMembers}</div>
                      <div className="text-gray-500 dark:text-gray-400">Team</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 dark:text-white">{plan.limits.maxClients}</div>
                      <div className="text-gray-500 dark:text-gray-400">Clients</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 dark:text-white">{(plan.limits.maxStorage / 1024).toFixed(0)}GB</div>
                      <div className="text-gray-500 dark:text-gray-400">Storage</div>
                    </div>
                  </div>
                </div>

                {/* Compact Features - Only show included features */}
                <div className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(plan.features)
                      .filter(([_, value]) => value)
                      .slice(0, 4)
                      .map(([key, _]) => (
                        <span key={key} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs">
                          <CheckIcon className="h-3 w-3" />
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      ))}
                    {Object.entries(plan.features).filter(([_, value]) => value).length > 4 && (
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs">
                        +{Object.entries(plan.features).filter(([_, value]) => value).length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Compact Stats */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-600">
                  <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-300">
                    <span>{plan.tenantsUsingPlan} tenant{plan.tenantsUsingPlan !== 1 ? 's' : ''}</span>
                    <span>{plan.trialDays} days trial</span>
                  </div>
                </div>

                {/* Compact Actions */}
                <div className="p-3 border-t border-gray-100 dark:border-gray-600">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleToggleStatus(plan)}
                      className="flex-1 inline-flex justify-center items-center px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {plan.status === 'active' ? (
                        <EyeSlashIcon className="h-3 w-3" />
                      ) : (
                        <EyeIcon className="h-3 w-3" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(plan)}
                      className="flex-1 inline-flex justify-center items-center px-2 py-1.5 border border-transparent rounded text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <PencilIcon className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(plan)}
                      disabled={plan.tenantsUsingPlan > 0}
                      className="flex-1 inline-flex justify-center items-center px-2 py-1.5 border border-transparent rounded text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
              ))}
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && filteredPlans.length > 0 && (
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4 sm:px-8 rounded-lg shadow-sm">
            {/* Mobile pagination */}
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 dark:border-gray-600"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNext}
                className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 dark:border-gray-600"
              >
                Next
              </button>
            </div>

            {/* Desktop pagination */}
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">Previous</span>
                    <span className="text-sm font-medium">Prev</span>
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
                    let pageNum: number;
                    
                    if (pagination.totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 3) {
                      pageNum = pagination.totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          currentPage === pageNum
                            ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                            : 'text-gray-900 dark:text-gray-200 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">Next</span>
                    <span className="text-sm font-medium">Next</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
            )}

            {/* Modals */}
            <PlanFormModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSuccess={handleModalSuccess}
              plan={null}
              mode="create"
            />
            
            <PlanFormModal
              isOpen={showEditModal}
              onClose={() => setShowEditModal(false)}
              onSuccess={handleModalSuccess}
              plan={selectedPlan}
              mode="edit"
            />
            
            <DeleteConfirmModal
              isOpen={showDeleteConfirm}
              onClose={() => setShowDeleteConfirm(false)}
              onSuccess={handleModalSuccess}
              plan={selectedPlan}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SubscriptionPlansPage;

