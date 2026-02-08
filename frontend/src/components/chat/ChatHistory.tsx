'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatMessage, type Message } from './ChatMessage'
import { TypingIndicator } from './TypingIndicator'
import { Input } from '@/components/ui'
import { cn } from '@/lib/utils'

interface ChatHistoryProps {
  messages: Message[]
  isTyping?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
  isLoading?: boolean
  className?: string
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  messages,
  isTyping = false,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)

  // Filter messages based on search query
  const filteredMessages = searchQuery
    ? messages.filter((msg) =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!searchQuery && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 100

      if (isNearBottom) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        })
      }
    }
  }, [messages, searchQuery])

  // Infinite scroll - load more when scrolling to top
  useEffect(() => {
    if (!onLoadMore || !hasMore) return

    const options = {
      root: scrollContainerRef.current,
      rootMargin: '100px',
      threshold: 0.1,
    }

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries
      if (entry.isIntersecting && !isLoading) {
        onLoadMore()
      }
    }, options)

    if (topSentinelRef.current) {
      observerRef.current.observe(topSentinelRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [onLoadMore, hasMore, isLoading])

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [])

  const clearSearch = () => {
    setSearchQuery('')
    setShowSearch(false)
    scrollToBottom()
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 p-4 bg-white"
          >
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <button
                onClick={clearSearch}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                ✕
              </button>
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-500 mt-2">
                Found {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {/* Top Sentinel for Infinite Scroll */}
        {hasMore && <div ref={topSentinelRef} className="h-1" />}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-primary-500 rounded-full"
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredMessages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-6xl mb-4">🐾</div>
            <h3 className="text-xl font-display font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No messages found' : 'Start a conversation'}
            </h3>
            <p className="text-gray-600 max-w-sm">
              {searchQuery
                ? 'Try a different search term'
                : 'Ask about your pet\'s health, symptoms, or care needs'}
            </p>
          </div>
        )}

        {/* Messages */}
        {filteredMessages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator />}
      </div>

      {/* Action Bar */}
      <div className="border-t border-gray-200 p-2 bg-white flex justify-between items-center">
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={cn(
            'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            showSearch
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          🔍 Search
        </button>

        <button
          onClick={scrollToBottom}
          className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          ⬇️ Scroll to bottom
        </button>

        <div className="text-xs text-gray-500">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}
