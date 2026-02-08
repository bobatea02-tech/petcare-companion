'use client'

import React from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'
import { PawIcon } from '@/components/icons'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  triageLevel?: 'green' | 'yellow' | 'red'
  isTranscript?: boolean
}

interface ChatMessageProps {
  message: Message
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
          isUser ? 'bg-primary-500' : 'bg-secondary-500'
        )}
      >
        {isUser ? (
          <span className="text-white font-semibold">U</span>
        ) : (
          <PawIcon size={20} className="text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn('flex-1 max-w-[70%]', isUser && 'flex justify-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'bg-primary-500 text-white'
              : 'bg-white border border-gray-200 text-gray-900',
            message.isTranscript && 'border-dashed border-primary-300 bg-primary-50'
          )}
        >
          {message.isTranscript && (
            <div className="flex items-center gap-2 mb-2 text-xs text-primary-600">
              <span>🎤</span>
              <span className="font-medium">Voice Transcript</span>
            </div>
          )}
          
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children }) => (
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                      {children}
                    </pre>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          
          {message.triageLevel && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <TriageBadge level={message.triageLevel} />
            </div>
          )}
        </div>
        
        <p
          className={cn(
            'text-xs text-gray-500 mt-1 px-2',
            isUser && 'text-right'
          )}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  )
}

interface TriageBadgeProps {
  level: 'green' | 'yellow' | 'red'
}

const TriageBadge: React.FC<TriageBadgeProps> = ({ level }) => {
  const config = {
    green: {
      label: 'Low Urgency',
      icon: '✅',
      className: 'triage-green',
      description: 'Monitor at home',
    },
    yellow: {
      label: 'Medium Urgency',
      icon: '⚠️',
      className: 'triage-yellow',
      description: 'Schedule appointment within 24-48 hours',
    },
    red: {
      label: 'High Urgency',
      icon: '🚨',
      className: 'triage-red',
      description: 'Seek emergency care immediately',
    },
  }

  const { label, icon, className, description } = config[level]

  return (
    <div className={cn('border-2 rounded-lg p-3', className)}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <span className="font-semibold">{label}</span>
      </div>
      <p className="text-sm">{description}</p>
    </div>
  )
}
