/**
 * Loading State Components
 * Provides skeleton loaders and loading indicators for async operations
 * Implements WCAG-compliant loading states with proper ARIA attributes
 */

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Loader2 } from 'lucide-react';
import { loadingA11y } from '@/lib/accessibility';

/**
 * Health Score Dashboard Loading Skeleton
 */
export const HealthScoreDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-4" {...loadingA11y.skeletonProps}>
      {/* Overall Score Card Skeleton */}
      <Card className="bg-cream-50 border-sage-200">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Skeleton className="h-40 w-40 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>

      {/* Category Breakdown Skeleton */}
      <Card className="bg-cream-50 border-sage-200">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-white border border-sage-100">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trend Chart Skeleton */}
      <Card className="bg-cream-50 border-sage-200">
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Expense Tracker Loading Skeleton
 */
export const ExpenseTrackerSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-4" {...loadingA11y.skeletonProps}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <Card className="bg-cream-50 border-sage-200">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start justify-between p-4 bg-white rounded-lg border border-sage-100">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Multi-Pet Dashboard Loading Skeleton
 */
export const MultiPetDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6" {...loadingA11y.skeletonProps}>
      <Card className="bg-cream-50 border-sage-200">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-sage-100">
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-32 w-32 rounded-full mx-auto" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Milestone Tracker Loading Skeleton
 */
export const MilestoneTrackerSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-4" {...loadingA11y.skeletonProps}>
      <Card className="bg-cream-50 border-sage-200">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-sage-100">
              <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Emergency SOS Loading Skeleton
 */
export const EmergencySOSSkeleton: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto" {...loadingA11y.skeletonProps}>
      <div className="sticky top-0 z-10 bg-red-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-full bg-red-400" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 bg-red-400" />
              <Skeleton className="h-4 w-32 bg-red-400" />
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
};

/**
 * Generic Loading Spinner
 */
export const LoadingSpinner: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  message = 'Loading...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4" {...loadingA11y.spinnerProps}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-forest-600`} aria-hidden="true" />
      <p className="text-sage-600 font-inter">{message}</p>
    </div>
  );
};

/**
 * Empty State Component
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center" role="status">
      {icon && <div className="mb-4 opacity-50">{icon}</div>}
      <h3 className="text-lg font-anton text-forest-800 mb-2">{title}</h3>
      <p className="text-sage-600 font-inter mb-6 max-w-md">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-lg font-inter transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

/**
 * Error State Component
 */
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center" role="alert">
      <div className="mb-4">
        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <span className="text-2xl">⚠️</span>
        </div>
      </div>
      <h3 className="text-lg font-anton text-forest-800 mb-2">{title}</h3>
      <p className="text-sage-600 font-inter mb-6 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-lg font-inter transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
