/**
 * Feature Wrapper Component
 * Wraps feature components with error boundaries and provides consistent error handling
 * Task: 15.2 Add error boundaries and loading states
 */

import React, { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface FeatureWrapperProps {
  children: ReactNode;
  featureName: string;
  fallback?: ReactNode;
  onReset?: () => void;
}

/**
 * Wraps a feature component with an error boundary
 * Provides graceful degradation when errors occur
 */
export const FeatureWrapper: React.FC<FeatureWrapperProps> = ({
  children,
  featureName,
  fallback,
  onReset,
}) => {
  return (
    <ErrorBoundary
      featureName={featureName}
      fallback={fallback}
      onReset={onReset}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Higher-order component to wrap any component with error boundary
 */
export function withFeatureWrapper<P extends object>(
  Component: React.ComponentType<P>,
  featureName: string
): React.FC<P> {
  return (props: P) => (
    <FeatureWrapper featureName={featureName}>
      <Component {...props} />
    </FeatureWrapper>
  );
}
