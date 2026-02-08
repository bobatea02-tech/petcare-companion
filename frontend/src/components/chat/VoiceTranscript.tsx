'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface VoiceTranscriptProps {
  transcript: string
  isListening: boolean
  isFinal?: boolean
  className?: string
}

export const VoiceTranscript: React.FC<VoiceTranscriptProps> = ({
  transcript,
  isListening,
  isFinal = false,
  className,
}) => {
  const [displayText, setDisplayText] = useState('')

  useEffect(() => {
    setDisplayText(transcript)
  }, [transcript])

  if (!transcript && !isListening) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          'rounded-2xl p-4 border-2 transition-colors',
          isFinal
            ? 'bg-primary-50 border-primary-300'
            : 'bg-gray-50 border-gray-300 border-dashed',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            animate={
              isListening && !isFinal
                ? {
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.6, 1],
                  }
                : {}
            }
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
            className={cn(
              'w-3 h-3 rounded-full',
              isFinal ? 'bg-primary-500' : 'bg-red-500'
            )}
          />
          <span className="text-sm font-medium text-gray-700">
            {isFinal ? 'Transcript' : 'Listening...'}
          </span>
        </div>

        {/* Transcript Text */}
        <div className="relative">
          {displayText ? (
            <p className="text-gray-900 leading-relaxed">
              {displayText}
              {!isFinal && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="inline-block ml-1 w-0.5 h-5 bg-gray-900 align-middle"
                />
              )}
            </p>
          ) : (
            <p className="text-gray-400 italic">
              Start speaking...
            </p>
          )}
        </div>

        {/* Visual Feedback */}
        {isListening && !isFinal && (
          <div className="mt-3 flex gap-1">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-primary-400 rounded-full"
                animate={{
                  height: [4, Math.random() * 20 + 4, 4],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.05,
                }}
              />
            ))}
          </div>
        )}

        {/* Status Message */}
        {isFinal && (
          <div className="mt-3 pt-3 border-t border-primary-200">
            <p className="text-xs text-primary-600 flex items-center gap-2">
              <span>✓</span>
              <span>Transcript complete - processing your message...</span>
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
