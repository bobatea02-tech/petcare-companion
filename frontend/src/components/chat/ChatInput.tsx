'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (message: string) => void
  onVoiceClick: () => void
  disabled?: boolean
  placeholder?: string
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onVoiceClick,
  disabled = false,
  placeholder = 'Type a message or use voice...',
}) => {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      {/* Voice Button */}
      <Button
        type="button"
        variant="outline"
        className="flex-shrink-0 h-12 w-12 rounded-full p-0"
        onClick={onVoiceClick}
        disabled={disabled}
      >
        <span className="text-xl">🎤</span>
      </Button>

      {/* Text Input */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'pet-input w-full resize-none max-h-32 pr-12',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        
        {/* Character Count */}
        {message.length > 0 && (
          <span className="absolute bottom-2 right-2 text-xs text-gray-400">
            {message.length}
          </span>
        )}
      </div>

      {/* Send Button */}
      <Button
        type="submit"
        disabled={!message.trim() || disabled}
        className="flex-shrink-0 h-12 w-12 rounded-full p-0"
      >
        <span className="text-xl">📤</span>
      </Button>
    </form>
  )
}
