'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

export type TriageLevel = 'green' | 'yellow' | 'red'

interface TriageResultCardProps {
  level: TriageLevel
  symptoms: string[]
  recommendations: string[]
  onFindVet?: () => void
  onScheduleAppointment?: () => void
  className?: string
}

const triageConfig = {
  green: {
    label: 'Low Urgency',
    icon: '✅',
    color: 'triage-green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    textColor: 'text-green-800',
    title: 'Monitor at Home',
    description: 'Your pet\'s symptoms appear manageable with home care.',
  },
  yellow: {
    label: 'Medium Urgency',
    icon: '⚠️',
    color: 'triage-yellow',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    textColor: 'text-yellow-800',
    title: 'Schedule Appointment',
    description: 'Your pet should see a veterinarian within 24-48 hours.',
  },
  red: {
    label: 'High Urgency',
    icon: '🚨',
    color: 'triage-red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    textColor: 'text-red-800',
    title: 'Seek Emergency Care',
    description: 'Your pet needs immediate veterinary attention.',
  },
}

export const TriageResultCard: React.FC<TriageResultCardProps> = ({
  level,
  symptoms,
  recommendations,
  onFindVet,
  onScheduleAppointment,
  className,
}) => {
  const config = triageConfig[level]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'rounded-2xl border-2 p-6 shadow-lg',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <motion.div
          animate={
            level === 'red'
              ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }
              : {}
          }
          transition={{
            duration: 1,
            repeat: level === 'red' ? Infinity : 0,
          }}
          className="text-4xl"
        >
          {config.icon}
        </motion.div>
        
        <div className="flex-1">
          <h3 className={cn('text-2xl font-display font-bold mb-1', config.textColor)}>
            {config.title}
          </h3>
          <p className={cn('text-sm', config.textColor)}>
            {config.description}
          </p>
        </div>
      </div>

      {/* Symptoms Detected */}
      {symptoms.length > 0 && (
        <div className="mb-4">
          <h4 className={cn('font-semibold mb-2', config.textColor)}>
            Symptoms Detected:
          </h4>
          <ul className="space-y-1">
            {symptoms.map((symptom, index) => (
              <li key={index} className={cn('text-sm flex items-start gap-2', config.textColor)}>
                <span className="mt-1">•</span>
                <span>{symptom}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      <div className="mb-4">
        <h4 className={cn('font-semibold mb-2', config.textColor)}>
          Recommendations:
        </h4>
        <ul className="space-y-2">
          {recommendations.map((rec, index) => (
            <li key={index} className={cn('text-sm flex items-start gap-2', config.textColor)}>
              <span className="mt-1">✓</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-6">
        {level === 'red' && onFindVet && (
          <Button
            onClick={onFindVet}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
            size="lg"
          >
            🏥 Find Emergency Vet Nearby
          </Button>
        )}
        
        {level === 'yellow' && onScheduleAppointment && (
          <Button
            onClick={onScheduleAppointment}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
            size="lg"
          >
            📅 Schedule Appointment
          </Button>
        )}
        
        {level === 'green' && (
          <div className={cn('text-sm p-3 rounded-lg border', config.borderColor, config.bgColor)}>
            <p className={config.textColor}>
              Continue monitoring your pet. If symptoms worsen or new symptoms appear, 
              don't hesitate to seek veterinary care.
            </p>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-4 pt-4 border-t border-gray-300">
        <p className="text-xs text-gray-600 italic">
          This assessment is provided by AI and should not replace professional veterinary advice. 
          Always consult with a licensed veterinarian for medical decisions.
        </p>
      </div>
    </motion.div>
  )
}
