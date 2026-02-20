/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 * Implements graceful degradation for feature components
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  featureName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for debugging
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Log to error monitoring service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      const featureName = this.props.featureName || 'this feature';

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-cream-50">
          <Card className="max-w-2xl w-full border-red-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
                <CardTitle className="font-anton text-forest-800 text-2xl">
                  Something Went Wrong
                </CardTitle>
              </div>
              <CardDescription className="font-inter text-sage-600">
                We encountered an error while loading {featureName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900">
                  <strong>Error:</strong> {this.state.error?.message || 'An unexpected error occurred'}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm font-inter text-sage-700">
                  Don't worry! Your data is safe. You can try the following:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm font-inter text-sage-600 ml-2">
                  <li>Refresh the page to try again</li>
                  <li>Go back to the dashboard and try a different feature</li>
                  <li>Clear your browser cache if the problem persists</li>
                  <li>Contact support if you continue to see this error</li>
                </ul>
              </div>

              {/* Development mode: Show error details */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <summary className="cursor-pointer font-semibold text-sm text-gray-700 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <pre className="text-xs overflow-auto max-h-64 text-gray-600">
                    {this.state.error?.stack}
                    {'\n\n'}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={this.handleReset}
                  className="flex-1 bg-forest-600 hover:bg-forest-700 text-white font-inter"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 border-sage-200 text-forest-800 font-inter"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper for functional components
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  featureName?: string
): React.FC<P> => {
  return (props: P) => (
    <ErrorBoundary featureName={featureName}>
      <Component {...props} />
    </ErrorBoundary>
  );
};
