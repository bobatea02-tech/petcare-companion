'use client'

import { useEffect } from 'react'
import { reportWebVitals, type WebVitalsMetric } from '@/lib/performance'

/**
 * Performance monitoring component
 * Tracks Web Vitals and reports to analytics
 */
export const PerformanceMonitor: React.FC = () => {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    // Import web-vitals dynamically to reduce initial bundle size
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS((metric) => reportWebVitals(metric as WebVitalsMetric))
      onFID((metric) => reportWebVitals(metric as WebVitalsMetric))
      onFCP((metric) => reportWebVitals(metric as WebVitalsMetric))
      onLCP((metric) => reportWebVitals(metric as WebVitalsMetric))
      onTTFB((metric) => reportWebVitals(metric as WebVitalsMetric))
      onINP((metric) => reportWebVitals(metric as WebVitalsMetric))
    })

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn('[Performance] Long task detected:', {
                duration: entry.duration,
                startTime: entry.startTime,
              })
            }
          }
        })
        observer.observe({ entryTypes: ['longtask'] })

        return () => observer.disconnect()
      } catch (e) {
        // PerformanceObserver not supported
      }
    }
  }, [])

  return null
}
