import React, { useEffect, useRef } from 'react';
import { ExclamationTriangleIcon, XMarkIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import DOMPurify from 'dompurify';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName: string;
  itemType?: string;
  isDeleting?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  itemType = 'item',
  isDeleting = false
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Handle escape key and initial focus
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      
      // Set initial focus to cancel button for better keyboard UX
      setTimeout(() => {
        if (cancelButtonRef.current) {
          cancelButtonRef.current.focus();
        }
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isDeleting]);

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const modal = document.querySelector('[role="dialog"]') as HTMLElement;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };


  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-description"
    >
      {/* Modal Container */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 transform transition-all duration-300 ease-in-out animate-in zoom-in-95 slide-in-from-bottom-4">
        
        {/* Header with Gradient Background */}
        <div className="relative bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-t-2xl p-6">
          <div className="absolute inset-0 bg-black/10 rounded-t-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                <ShieldExclamationIcon className="w-7 h-7 text-white drop-shadow-lg" />
              </div>
              <div>
                <h3 id="delete-modal-title" className="text-xl font-bold text-white drop-shadow-sm">
                  {DOMPurify.sanitize(title)}
                </h3>
                <p className="text-red-100 text-sm font-medium">
                  Confirm destructive action
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p id="delete-modal-description" className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
              {DOMPurify.sanitize(message)}
            </p>
          </div>
          
          {/* Warning Card */}
          <div className="relative bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-2 border-red-200 dark:border-red-700 rounded-xl p-5 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-200/30 dark:bg-red-700/30 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-red-300/20 dark:bg-red-600/20 rounded-full translate-y-8 -translate-x-8"></div>
            
            <div className="relative flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-red-800 dark:text-red-200 mb-2">
                  ⚠️ Irreversible Action
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                  The <span className="font-semibold bg-red-200 dark:bg-red-800/50 px-2 py-1 rounded-md">{itemType}</span> named <strong className="text-red-900 dark:text-red-100">{DOMPurify.sanitize(itemName)}</strong> will be permanently removed from the system. This action cannot be undone or reversed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl">
          <button
            ref={cancelButtonRef}
            onClick={onClose}
            disabled={isDeleting}
            className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border-2 border-gray-300 dark:border-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-500 hover:border-gray-400 dark:hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <ExclamationTriangleIcon className="w-5 h-5" />
                <span>Delete {itemType}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;