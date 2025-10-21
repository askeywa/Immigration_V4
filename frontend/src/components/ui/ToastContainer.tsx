import React from 'react';
import Toast, { ToastData } from './Toast';

interface ToastContainerProps {
  toasts: ToastData[];
  onRemoveToast: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  maxToasts?: number;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ 
  toasts, 
  onRemoveToast, 
  position = 'top-center',
  maxToasts = 5 
}) => {
  // Limit the number of visible toasts
  const visibleToasts = toasts.slice(-maxToasts);

  if (visibleToasts.length === 0) {
    return null;
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-6 right-6';
      case 'top-left':
        return 'top-6 left-6';
      case 'bottom-right':
        return 'bottom-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'top-center':
        return 'top-12 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-12 left-1/2 transform -translate-x-1/2';
    }
  };

  const getAnimationClass = () => {
    switch (position) {
      case 'top-right':
        return 'animate-in slide-in-from-right-full';
      case 'top-left':
        return 'animate-in slide-in-from-left-full';
      case 'bottom-right':
        return 'animate-in slide-in-from-right-full';
      case 'bottom-left':
        return 'animate-in slide-in-from-left-full';
      case 'top-center':
        return 'animate-in slide-in-from-top-full';
      default:
        return 'animate-in slide-in-from-top-full';
    }
  };

  return (
    <div
      className={`fixed ${getPositionClasses()} z-50 space-y-3 w-80 max-w-sm`}
      aria-live="polite"
      aria-label="Notifications"
    >
      {visibleToasts.map((toast) => (
        <div key={toast.id} className={getAnimationClass()}>
          <Toast
            toast={toast}
            onRemove={onRemoveToast}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
