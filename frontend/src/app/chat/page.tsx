'use client'

import React from 'react'
import { ChatInterface } from '@/components/chat'

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white text-xl">
              🐾
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-gray-900">
                PawPal Assistant
              </h1>
              <p className="text-sm text-gray-600">
                AI-powered pet care guidance
              </p>
            </div>
          </div>
          
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* Chat Interface */}
      <main className="flex-1 overflow-hidden">
        <ChatInterface />
      </main>
    </div>
  )
}
