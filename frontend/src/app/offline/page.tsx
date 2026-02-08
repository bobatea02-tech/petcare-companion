/**
 * Offline Page - Shown when user is offline
 */
'use client'

import React from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { useUIStore } from '@/lib/stores/ui-store'

export default function OfflinePage() {
  const isOnline = useUIStore((state) => state.isOnline)

  const handleRefresh = () => {
    window.location.reload()
  }

  if (isOnline) {
    // Redirect to home if back online
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-10 h-10 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You're Offline
          </h1>
          <p className="text-gray-600">
            It looks like you've lost your internet connection. Some features may be unavailable until you're back online.
          </p>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Don't worry!</strong> Your pet's data is safe and will sync automatically when you reconnect.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </button>

        <div className="mt-6 text-sm text-gray-500">
          <p>While offline, you can still:</p>
          <ul className="mt-2 space-y-1">
            <li>• View cached pet profiles</li>
            <li>• Browse previous health records</li>
            <li>• Review medication schedules</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
