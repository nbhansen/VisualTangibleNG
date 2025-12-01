/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors in child components and displays fallback UI.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import './common.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary" role="alert">
          <h1 className="error-boundary__title">Something went wrong</h1>
          <p className="error-boundary__message">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <div className="error-boundary__actions">
            <button
              type="button"
              onClick={this.handleReset}
              className="error-boundary__button"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="error-boundary__button error-boundary__button--secondary"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
