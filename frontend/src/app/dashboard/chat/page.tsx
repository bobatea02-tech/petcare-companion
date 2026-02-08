'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui'
import {
  ChatMessage,
  ChatInput,
  TypingIndicator,
  VoiceRecorder,
  EmergencyAlert,
  type Message,
} from '@/components/chat'
import { useRouter } from 'next/navigation'

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your AI pet care assistant. How can I help you today? You can describe symptoms, ask questions, or use voice input.',
      timestamp: new Date(),
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Simulate AI response
    setIsTyping(true)
    
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Check for emergency keywords
    const emergencyKeywords = ['emergency', 'bleeding', 'seizure', 'poison', 'unconscious']
    const isEmergency = emergencyKeywords.some((keyword) =>
      content.toLowerCase().includes(keyword)
    )

    const triageLevel = isEmergency ? 'red' : Math.random() > 0.5 ? 'green' : 'yellow'

    // Add AI response
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: isEmergency
        ? 'Based on the symptoms you\'ve described, this appears to be an emergency situation. Your pet needs immediate veterinary attention.'
        : 'I\'ve analyzed the symptoms. Here\'s my assessment and recommendations for your pet\'s care.',
      timestamp: new Date(),
      triageLevel,
    }

    setMessages((prev) => [...prev, aiMessage])
    setIsTyping(false)

    // Show emergency alert if needed
    if (isEmergency) {
      setTimeout(() => setShowEmergencyAlert(true), 500)
    }
  }

  const handleVoiceRecording = async (audioBlob: Blob) => {
    setShowVoiceRecorder(false)
    
    // TODO: Send audio to backend for transcription
    // For now, simulate transcription
    const simulatedTranscript = 'My dog has been vomiting and seems lethargic'
    
    await handleSendMessage(simulatedTranscript)
  }

  const handleFindVet = () => {
    setShowEmergencyAlert(false)
    router.push('/dashboard/appointments?emergency=true')
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
          AI Assistant
        </h1>
        <p className="text-gray-600">
          Get instant health assessments and care recommendations
        </p>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {isTyping && <TypingIndicator />}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <ChatInput
            onSend={handleSendMessage}
            onVoiceClick={() => setShowVoiceRecorder(true)}
            disabled={isTyping}
          />
        </div>
      </Card>

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowVoiceRecorder(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-display font-bold text-center mb-6">
              Voice Input
            </h2>
            <VoiceRecorder onRecordingComplete={handleVoiceRecording} />
          </div>
        </div>
      )}

      {/* Emergency Alert */}
      {showEmergencyAlert && (
        <EmergencyAlert
          onFindVet={handleFindVet}
          onDismiss={() => setShowEmergencyAlert(false)}
        />
      )}
    </div>
  )
}
