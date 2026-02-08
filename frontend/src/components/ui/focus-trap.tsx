'use client'

import React, { useEffect, useRef } from 'react'
import { trapFocus } from '@/lib/accessibility'

export interface FocusTrapProps {
  children: React.ReactNode
  active?: boolean
  restoreFocus?: boolean
}

/**
 * Focus trap component for modals and dialogs
 * Ensures keyboard navigation stays within the component
 */
export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  restoreFocus = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active || !containerRef.current) return

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Set up focus trap
    const cleanup = trapFocus(containerRef.current)

    return () => {
      cleanup()
      
      // Restore focus to previous element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [active, restoreFocus])

  return (
    <div ref={containerRef} className="focus-trap-container">
      {children}
    </div>
  )
}
