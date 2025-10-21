import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ToastContainer from '../components/ui/ToastContainer';
import { ToastData } from '../components/ui/Toast';

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => string;
  showSuccess: (title: string, message?: string) => string;
  showError: (title: string, message?: string) => string;
  showInfo: (title: string, message?: string) => string;
  showWarning: (title: string, message?: string) => string;
  showLoading: (title: string, message?: string) => string;
  updateToast: (id: string, updates: Partial<Omit<ToastData, 'id'>>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const MAX_TOASTS = 5;

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  const showToast = useCallback((toast: Omit<ToastData, 'id'>): string => {
    const id = generateId();
    const newToast: ToastData = {
      ...toast,
      id,
    };

    setToasts((prev) => {
      // Check for duplicate toasts
      const isDuplicate = prev.some(
        (t) => t.title === newToast.title && 
               t.message === newToast.message && 
               t.type === newToast.type
      );
      
      if (isDuplicate) {
        return prev; // Don't add duplicate
      }

      const updated = [...prev, newToast];
      // Keep only the last MAX_TOASTS toasts
      return updated.length > MAX_TOASTS ? updated.slice(-MAX_TOASTS) : updated;
    });

    return id;
  }, [generateId]);

  const showSuccess = useCallback((title: string, message?: string): string => {
    return showToast({
      type: 'success',
      title,
      message,
      duration: 3000,
    });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string): string => {
    return showToast({
      type: 'error',
      title,
      message,
      duration: 5000,
    });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string): string => {
    return showToast({
      type: 'info',
      title,
      message,
      duration: 4000,
    });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string): string => {
    return showToast({
      type: 'warning',
      title,
      message,
      duration: 4500,
    });
  }, [showToast]);

  const showLoading = useCallback((title: string, message?: string): string => {
    return showToast({
      type: 'loading',
      title,
      message,
      persist: true,
    });
  }, [showToast]);

  const updateToast = useCallback((id: string, updates: Partial<Omit<ToastData, 'id'>>) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    updateToast,
    removeToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer 
        toasts={toasts} 
        onRemoveToast={removeToast}
        position="top-center"
        maxToasts={MAX_TOASTS}
      />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
