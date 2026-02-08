/**
 * Loading Spinner Components
 */
import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variant?: 'default' | 'paw'
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  variant = 'default',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  if (variant === 'paw') {
    return (
      <div className={cn('relative', sizeClasses[size], className)}>
        <svg
          className="animate-spin text-orange-500"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2M7 7C5.9 7 5 7.9 5 9C5 10.1 5.9 11 7 11C8.1 11 9 10.1 9 9C9 7.9 8.1 7 7 7M17 7C15.9 7 15 7.9 15 9C15 10.1 15.9 11 17 11C18.1 11 19 10.1 19 9C19 7.9 18.1 7 17 7M12 10C9.8 10 8 11.8 8 14C8 16.2 9.8 18 12 18C14.2 18 16 16.2 16 14C16 11.8 14.2 10 12 10Z"
          />
        </svg>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]',
        sizeClasses[size],
        className
      )}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// Full page loading overlay
export const LoadingOverlay: React.FC<{
  message?: string
  className?: string
}> = ({ message = 'Loading...', className }) => {
  return (
    <div
      className={cn(
        'fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50',
        className
      )}
    >
      <div className="text-center">
        <LoadingSpinner size="xl" variant="paw" className="mx-auto mb-4" />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  )
}

// Inline loading state
export const InlineLoading: React.FC<{
  message?: string
  className?: string
}> = ({ message, className }) => {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LoadingSpinner size="sm" />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  )
}
