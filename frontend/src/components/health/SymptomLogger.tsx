import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { SeverityLevel } from '@/types/health'

export interface SymptomLoggerProps {
  petId: string
  onSubmit?: (data: SymptomLogData) => void
  className?: string
}

export interface SymptomLogData {
  symptoms: string[]
  bodyParts: string[]
  severity: SeverityLevel
  notes: string
}

const bodyParts = [
  { id: 'head', label: 'Head', icon: '🐶' },
  { id: 'eyes', label: 'Eyes', icon: '👁️' },
  { id: 'ears', label: 'Ears', icon: '👂' },
  { id: 'nose', label: 'Nose', icon: '👃' },
  { id: 'mouth', label: 'Mouth', icon: '👄' },
  { id: 'neck', label: 'Neck', icon: '🦴' },
  { id: 'chest', label: 'Chest', icon: '💓' },
  { id: 'abdomen', label: 'Abdomen', icon: '🫃' },
  { id: 'back', label: 'Back', icon: '🦴' },
  { id: 'legs', label: 'Legs', icon: '🦵' },
  { id: 'paws', label: 'Paws', icon: '🐾' },
  { id: 'tail', label: 'Tail', icon: '〰️' },
  { id: 'skin', label: 'Skin', icon: '🧴' },
  { id: 'general', label: 'General', icon: '🌡️' },
]

const commonSymptoms = [
  'Vomiting',
  'Diarrhea',
  'Loss of appetite',
  'Lethargy',
  'Coughing',
  'Sneezing',
  'Limping',
  'Scratching',
  'Excessive drinking',
  'Excessive urination',
  'Difficulty breathing',
  'Fever',
  'Shaking',
  'Aggression',
  'Hiding',
  'Whining',
]

const severityLevels: { value: SeverityLevel; label: string; color: string; description: string }[] = [
  {
    value: 'mild',
    label: 'Mild',
    color: 'bg-green-100 text-green-700 border-green-300',
    description: 'Minor discomfort, monitoring recommended',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    description: 'Noticeable symptoms, vet consultation advised',
  },
  {
    value: 'severe',
    label: 'Severe',
    color: 'bg-red-100 text-red-700 border-red-300',
    description: 'Serious symptoms, immediate vet attention needed',
  },
]

export const SymptomLogger: React.FC<SymptomLoggerProps> = ({
  petId,
  onSubmit,
  className,
}) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [customSymptom, setCustomSymptom] = useState('')
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([])
  const [severity, setSeverity] = useState<SeverityLevel>('mild')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    )
  }

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms((prev) => [...prev, customSymptom.trim()])
      setCustomSymptom('')
    }
  }

  const toggleBodyPart = (bodyPart: string) => {
    setSelectedBodyParts((prev) =>
      prev.includes(bodyPart)
        ? prev.filter((bp) => bp !== bodyPart)
        : [...prev, bodyPart]
    )
  }

  const handleSubmit = async () => {
    if (selectedSymptoms.length === 0) {
      alert('Please select at least one symptom')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit?.({
        symptoms: selectedSymptoms,
        bodyParts: selectedBodyParts,
        severity,
        notes,
      })
      // Reset form
      setSelectedSymptoms([])
      setSelectedBodyParts([])
      setSeverity('mild')
      setNotes('')
    } catch (error) {
      console.error('Failed to submit symptom log:', error)
      alert('Failed to submit symptom log. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Symptoms Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          What symptoms are you observing?
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {commonSymptoms.map((symptom) => (
            <button
              key={symptom}
              onClick={() => toggleSymptom(symptom)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                selectedSymptoms.includes(symptom)
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {symptom}
            </button>
          ))}
        </div>

        {/* Custom Symptom Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customSymptom}
            onChange={(e) => setCustomSymptom(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomSymptom()}
            placeholder="Add custom symptom..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <Button onClick={addCustomSymptom} variant="outline" size="sm">
            Add
          </Button>
        </div>

        {/* Selected Symptoms */}
        <AnimatePresence>
          {selectedSymptoms.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-3 bg-primary-50 rounded-lg"
            >
              <p className="text-sm font-medium text-gray-700 mb-2">
                Selected Symptoms ({selectedSymptoms.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedSymptoms.map((symptom) => (
                  <span
                    key={symptom}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm"
                  >
                    {symptom}
                    <button
                      onClick={() => toggleSymptom(symptom)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Body Parts Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Which body parts are affected?
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {bodyParts.map((part) => (
            <button
              key={part.id}
              onClick={() => toggleBodyPart(part.id)}
              className={cn(
                'flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all',
                selectedBodyParts.includes(part.id)
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-primary-300'
              )}
            >
              <span className="text-2xl mb-1">{part.icon}</span>
              <span className="text-xs font-medium text-gray-700">
                {part.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Severity Rating */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          How severe are the symptoms?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {severityLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => setSeverity(level.value)}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                severity === level.value
                  ? `${level.color} shadow-md`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              <p className="font-semibold mb-1">{level.label}</p>
              <p className="text-xs">{level.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Additional Notes (Optional)
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe any additional details about the symptoms, when they started, or any other relevant information..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        isLoading={isSubmitting}
        disabled={isSubmitting || selectedSymptoms.length === 0}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? 'Logging Symptoms...' : 'Log Symptoms'}
      </Button>
    </div>
  )
}
