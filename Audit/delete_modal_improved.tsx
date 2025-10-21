import React, { useState } from 'react';
import { ExclamationTriangleIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

const DeleteConfirmModal = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => setIsDeleting(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      {/* Modal Container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        
        {/* Header - Clean and Simple */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Confirm Deletion
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <button
              disabled={isDeleting}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Are you sure you want to delete the subscription plan <span className="font-semibold text-gray-900 dark:text-white">"Premium Plan"</span>? This will permanently remove it from the system.
          </p>
          
          {/* Warning Box - Subtle */}
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  Warning
                </p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  5 tenants are currently using this plan. Deletion is not allowed until they are migrated.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Clear Visual Hierarchy */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-end gap-3">
          {/* Cancel Button - Secondary */}
          <button
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Cancel
          </button>
          
          {/* Delete Button - Primary Destructive */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg shadow-sm hover:shadow-md flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <TrashIcon className="w-4 h-4" />
                <span>Delete Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alternative Minimal Version */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full ml-8 overflow-hidden">
        
        {/* Minimal Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Delete Premium Plan?
            </h3>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This action cannot be undone. The plan will be permanently removed from the system.
          </p>
        </div>

        {/* Footer - Logical Button Order */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-end gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
            Cancel
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2">
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Modern Card Style Version */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full ml-8 border border-gray-200 dark:border-gray-700">
        
        {/* Icon Header */}
        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <TrashIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Delete Subscription Plan
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Are you absolutely sure?
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              You're about to delete <span className="font-semibold text-gray-900 dark:text-white">Premium Plan</span>. This action is permanent and cannot be reversed.
            </p>
          </div>

          {/* Stacked Buttons - Mobile Friendly */}
          <div className="space-y-3">
            <button className="w-full px-4 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2">
              <TrashIcon className="w-4 h-4" />
              Yes, Delete Permanently
            </button>
            <button className="w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-all">
              No, Keep It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;