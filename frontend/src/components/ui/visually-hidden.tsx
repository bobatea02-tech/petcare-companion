import React from 'react'
import { cn } from '@/lib/utils'

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
}

/**
 * Visually hidden component for screen reader only content
 * Follows WCAG best practices for accessible hidden content
 */
export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <span
      className={cn('sr-only', className)}
      {...props}
    >
      {children}
    </span>
  )
}

VisuallyHidden.displayName = 'VisuallyHidden'
