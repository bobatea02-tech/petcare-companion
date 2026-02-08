/**
 * PWA Provider Component
 */
'use client'

import React, { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/pwa'

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    // Register service worker
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker()
    }
  }, [])

  return <>{children}</>
}
