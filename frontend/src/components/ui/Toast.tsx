import React, { useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  XMarkIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import DOMPurify from 'dompurify';

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'loading';
  title: string;
  message?: string;
  duration?: number;
  persist?: boolean;
}

interface ToastProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const { id, type, title, message, duration, persist = false } = toast;
  
  // Calculate default duration based on type
  const getDefaultDuration = () => {
    switch (type) {
      case 'success': return 3000;
      case 'error': return 5000;
      case 'info': return 4000;
      case 'warning': return 4500;
      case 'loading': return 0; // Loading toasts should persist by default
      default: return 3000;
    }
  };

  const finalDuration = duration ?? getDefaultDuration();

  useEffect(() => {
    // Don't auto-dismiss if persist is true or if it's a loading toast
    if (persist || type === 'loading' || finalDuration === 0) {
      return;
    }

    const timer = setTimeout(() => {
      onRemove(id);
    }, finalDuration);

    return () => clearTimeout(timer);
  }, [id, finalDuration, onRemove, persist, type]);

  const handleClose = () => {
    onRemove(id);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
      case 'loading':
        return (
          <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full" />
        );
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'loading':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'info':
        return 'text-blue-800 dark:text-blue-200';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'loading':
        return 'text-blue-800 dark:text-blue-200';
      default:
        return 'text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div
      className={`
        ${getBackgroundColor()}
        border rounded-lg p-4 shadow-lg
        transform transition-all duration-300 ease-in-out
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${getTextColor()}`}>
            {DOMPurify.sanitize(title)}
          </h3>
          {message && (
            <p className={`mt-1 text-sm ${getTextColor()}`}>
              {DOMPurify.sanitize(message)}
            </p>
          )}
        </div>
        
        <div className="ml-4 flex-shrink-0">
          <button
            type="button"
            className={`
              inline-flex rounded-md p-1.5 transition-colors duration-200
              ${type === 'success' 
                ? 'text-green-400 hover:text-green-500 hover:bg-green-100 dark:hover:bg-green-800/30 focus:ring-green-500' 
                : type === 'error'
                ? 'text-red-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-800/30 focus:ring-red-500'
                : type === 'info'
                ? 'text-blue-400 hover:text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-800/30 focus:ring-blue-500'
                : type === 'warning'
                ? 'text-yellow-400 hover:text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-800/30 focus:ring-yellow-500'
                : 'text-blue-400 hover:text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-800/30 focus:ring-blue-500'
              }
              focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900
            `}
            onClick={handleClose}
            aria-label="Close notification"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
