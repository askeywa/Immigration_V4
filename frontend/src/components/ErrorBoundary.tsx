/**
 * Error Boundary Component
 * Catches React errors and provides fallback UI
 * 
 * Following CORE-CRITICAL Rule 6: All context providers need error boundaries with fallback UI
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import DOMPurify from 'dompurify';

/**
 * Error Boundary Props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Error Boundary State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * Following CORE-CRITICAL Rule 6: Error boundaries for all providers
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * Derive error state from error
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details
   * Following CORE-CRITICAL Rule 1: No console.log
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Replace with proper logger service
    // logger.error('React error boundary caught error', {
    //   error: error.message,
    //   stack: error.stack,
    //   componentStack: errorInfo.componentStack
    // });

    // Send to error monitoring service (Sentry)
    if (typeof window !== 'undefined') {
      interface WindowWithSentry extends Window {
        Sentry?: {
          captureException: (error: Error, options?: unknown) => void;
        };
      }
      
      const windowWithSentry = window as WindowWithSentry;
      if (windowWithSentry.Sentry) {
        windowWithSentry.Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        });
      }
    }
  }

  /**
   * Reset error boundary
   */
  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  /**
   * Render component
   */
  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>

            {this.state.error && import.meta.env.DEV && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded text-left">
                <p className="text-sm text-red-800 dark:text-red-200 font-mono break-all">
                  {DOMPurify.sanitize(this.state.error.message)}
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
