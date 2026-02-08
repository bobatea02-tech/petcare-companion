'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatHistory } from './ChatHistory'
import { ChatInput } from './ChatInput'
import { VoiceRecorder } from './VoiceRecorder'
import { VoiceTranscript } from './VoiceTranscript'
import { EmergencyAlert } from './EmergencyAlert'
import { TriageResultCard, type TriageLevel } from './TriageResultCard'
import { Modal } from '@/components/ui'
import { type Message } from './ChatMessage'
import apiClient from '@/lib/api'
import { cn } from '@/lib/utils'

interface ChatInterfaceProps {
  petId?: string
  className?: string
}

interface TriageResult {
  level: TriageLevel
  symptoms: string[]
  recommendations: string[]
  analysis: string
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  petId,
  className,
}) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [currentTriage, setCurrentTriage] = useState<TriageResult | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Load initial messages
  useEffect(() => {
    loadMessages()
  }, [petId])

  const loadMessages = async (before?: string) => {
    try {
      setIsLoadingMore(true)
      const params = new URLSearchParams()
      if (petId) params.append('pet_id', petId)
      if (before) params.append('before', before)
      params.append('limit', '50')

      const response = await apiClient.get(`/ai/chat/history?${params}`)
      const newMessages = response.data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }))

      if (before) {
        setMessages((prev) => [...newMessages, ...prev])
      } else {
        setMessages(newMessages)
      }
      
      setHasMore(response.data.has_more)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const loadMoreMessages = useCallback(() => {
    if (messages.length > 0 && !isLoadingMore) {
      const oldestMessage = messages[0]
      loadMessages(oldestMessage.id)
    }
  }, [messages, isLoadingMore])

  const sendMessage = async (content: string, isTranscript = false) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      isTranscript,
    }
    setMessages((prev) => [...prev, userMessage])

    // Show typing indicator
    setIsTyping(true)

    try {
      // Send to AI service
      const response = await apiClient.post('/ai/analyze-symptoms', {
        message: content,
        pet_id: petId,
      })

      const { response: aiResponse, triage_level, analysis } = response.data

      // Add AI response
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        triageLevel: triage_level,
      }
      setMessages((prev) => [...prev, aiMessage])

      // Handle triage result
      if (triage_level) {
        const triageResult: TriageResult = {
          level: triage_level,
          symptoms: analysis?.symptoms || [],
          recommendations: analysis?.recommendations || [],
          analysis: analysis?.summary || '',
        }
        setCurrentTriage(triageResult)

        // Show emergency alert for red triage
        if (triage_level === 'red') {
          setShowEmergencyAlert(true)
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleVoiceRecordingComplete = async (audioBlob: Blob) => {
    setIsTranscribing(true)
    setIsListening(false)

    try {
      // Convert audio to base64
      const reader = new FileReader()
      reader.readAsDataURL(audioBlob)
      reader.onloadend = async () => {
        const base64Audio = reader.result as string

        // Send to transcription service
        const response = await apiClient.post('/ai/voice/transcribe', {
          audio: base64Audio,
        })

        const transcript = response.data.transcript
        setCurrentTranscript(transcript)

        // Wait a moment to show the final transcript
        setTimeout(() => {
          setShowVoiceModal(false)
          setIsTranscribing(false)
          setCurrentTranscript('')
          
          // Send the transcribed message
          sendMessage(transcript, true)
        }, 1500)
      }
    } catch (error) {
      console.error('Failed to transcribe audio:', error)
      setIsTranscribing(false)
      setShowVoiceModal(false)
      alert('Failed to transcribe audio. Please try again.')
    }
  }

  const handleFindVet = () => {
    setShowEmergencyAlert(false)
    // Navigate to emergency vet finder
    window.location.href = '/appointments/emergency'
  }

  const handleScheduleAppointment = () => {
    // Navigate to appointment scheduling
    window.location.href = '/appointments/schedule'
  }

  return (
    <div className={cn('flex flex-col h-full bg-gray-50', className)}>
      {/* Chat History */}
      <ChatHistory
        messages={messages}
        isTyping={isTyping}
        onLoadMore={loadMoreMessages}
        hasMore={hasMore}
        isLoading={isLoadingMore}
        className="flex-1"
      />

      {/* Current Triage Result */}
      <AnimatePresence>
        {currentTriage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4 bg-white border-t border-gray-200"
          >
            <TriageResultCard
              level={currentTriage.level}
              symptoms={currentTriage.symptoms}
              recommendations={currentTriage.recommendations}
              onFindVet={currentTriage.level === 'red' ? handleFindVet : undefined}
              onScheduleAppointment={currentTriage.level === 'yellow' ? handleScheduleAppointment : undefined}
            />
            <button
              onClick={() => setCurrentTriage(null)}
              className="mt-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <ChatInput
          onSend={sendMessage}
          onVoiceClick={() => setShowVoiceModal(true)}
          disabled={isTyping}
          placeholder="Describe your pet's symptoms or ask a question..."
        />
      </div>

      {/* Voice Recording Modal */}
      <Modal
        isOpen={showVoiceModal}
        onClose={() => {
          if (!isTranscribing) {
            setShowVoiceModal(false)
            setCurrentTranscript('')
            setIsListening(false)
          }
        }}
        title="Voice Message"
      >
        <div className="space-y-6">
          {!isTranscribing ? (
            <>
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecordingComplete}
                onTranscript={(text) => {
                  setCurrentTranscript(text)
                  setIsListening(true)
                }}
              />
              
              {currentTranscript && (
                <VoiceTranscript
                  transcript={currentTranscript}
                  isListening={isListening}
                  isFinal={false}
                />
              )}
            </>
          ) : (
            <VoiceTranscript
              transcript={currentTranscript}
              isListening={false}
              isFinal={true}
            />
          )}
        </div>
      </Modal>

      {/* Emergency Alert Modal */}
      {showEmergencyAlert && (
        <EmergencyAlert
          onFindVet={handleFindVet}
          onDismiss={() => setShowEmergencyAlert(false)}
        />
      )}
    </div>
  )
}
