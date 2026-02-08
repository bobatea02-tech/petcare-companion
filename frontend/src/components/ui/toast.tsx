/**
 * Toast Notification Component
 * WCAG 2.1 AA compliant with proper ARIA attributes
 */
'use client'

import React, { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useUIStore } from '@/lib/stores/ui-store'
import { cn } from '@/lib/utils'
import { announceToScreenReader } from '@/lib/accessibility'

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((state) => state.toasts)
  const removeToast = useUIStore((state) => state.removeToast)

  return (
    <div 
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const iconColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  }

  const typeLabels = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
  }

  const Icon = icons[type]

  // Announce to screen readers
  useEffect(() => {
    const priority = type === 'error' || type === 'warning' ? 'assertive' : 'polite'
    announceToScreenReader(`${typeLabels[type]}: ${message}`, priority)
  }, [type, message])

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border-2 shadow-lg animate-slide-in-right',
        colors[type]
      )}
      role="alert"
      aria-live={type === 'error' || type === 'warning' ? 'assertive' : 'polite'}
    >
      <Icon 
        className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconColors[type])} 
        aria-hidden="true"
      />
      <div className="flex-1">
        <span className="sr-only">{typeLabels[type]}:</span>
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 rounded"
        aria-label={`Close ${typeLabels[type].toLowerCase()} notification`}
      >
        <X className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  )
}

// Hook to show toasts
export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast)

  return {
    success: (message: string, duration?: number) =>
      addToast({ type: 'success', message, duration }),
    error: (message: string, duration?: number) =>
      addToast({ type: 'error', message, duration }),
    warning: (message: string, duration?: number) =>
      addToast({ type: 'warning', message, duration }),
    info: (message: string, duration?: number) =>
      addToast({ type: 'info', message, duration }),
  }
}
