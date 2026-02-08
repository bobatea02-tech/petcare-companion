import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { AIAssessment, TriageLevel } from '@/types/health'

export interface AIAssessmentCardProps {
  assessment: AIAssessment
  className?: string
}

const triageConfig: Record<
  TriageLevel,
  {
    label: string
    color: string
    bgColor: string
    icon: React.ReactNode
    description: string
  }
> = {
  green: {
    label: 'Low Priority',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-300',
    description: 'Monitor at home',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  yellow: {
    label: 'Medium Priority',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50 border-yellow-300',
    description: 'Schedule vet visit within 24-48 hours',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  },
  red: {
    label: 'High Priority',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-300',
    description: 'Seek immediate veterinary care',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
}

export const AIAssessmentCard: React.FC<AIAssessmentCardProps> = ({
  assessment,
  className,
}) => {
  const config = triageConfig[assessment.triage_level]
  const confidencePercentage = Math.round(assessment.confidence_score * 100)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border-2 p-6 shadow-lg',
        config.bgColor,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={cn('p-2 rounded-full', config.bgColor)}>
            <div className={config.color}>{config.icon}</div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              AI Health Assessment
            </h3>
            <p className="text-sm text-gray-600">
              {formatDate(assessment.created_at)}
            </p>
          </div>
        </div>

        {/* Triage Badge */}
        <div className="text-right">
          <span
            className={cn(
              'inline-block px-3 py-1 rounded-full text-sm font-semibold',
              config.color,
              config.bgColor
            )}
          >
            {config.label}
          </span>
          <p className="text-xs text-gray-600 mt-1">{config.description}</p>
        </div>
      </div>

      {/* Symptoms Reported */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Symptoms Reported:
        </h4>
        <p className="text-gray-900 bg-white rounded-lg p-3 border border-gray-200">
          {assessment.symptoms_reported}
        </p>
      </div>

      {/* AI Analysis */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          AI Analysis:
        </h4>
        <div className="text-gray-900 bg-white rounded-lg p-3 border border-gray-200 whitespace-pre-wrap">
          {assessment.ai_analysis}
        </div>
      </div>

      {/* Recommendations */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Recommendations:
        </h4>
        <div className="text-gray-900 bg-white rounded-lg p-3 border border-gray-200 whitespace-pre-wrap">
          {assessment.recommendations}
        </div>
      </div>

      {/* Footer with Confidence and Model */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          {/* Confidence Score */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Confidence Score</p>
            <div className="flex items-center space-x-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidencePercentage}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={cn(
                    'h-full rounded-full',
                    confidencePercentage >= 80
                      ? 'bg-green-500'
                      : confidencePercentage >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  )}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {confidencePercentage}%
              </span>
            </div>
          </div>

          {/* Model Used */}
          <div>
            <p className="text-xs text-gray-500 mb-1">AI Model</p>
            <p className="text-sm font-medium text-gray-900">
              {assessment.model_used}
            </p>
          </div>
        </div>

        {/* AI Badge */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-white rounded-full border border-gray-200">
          <svg
            className="w-4 h-4 text-primary-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <span className="text-xs font-medium text-gray-700">
            AI-Powered Analysis
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-gray-100 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Disclaimer:</strong> This AI assessment is for informational
          purposes only and should not replace professional veterinary advice.
          Always consult with a licensed veterinarian for medical decisions.
        </p>
      </div>
    </motion.div>
  )
}
