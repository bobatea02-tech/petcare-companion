import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { HealthSummary as HealthSummaryType } from '@/types/health'

export interface HealthSummaryProps {
  summary: HealthSummaryType
  onExport?: (format: 'pdf' | 'json') => void
  className?: string
}

export const HealthSummary: React.FC<HealthSummaryProps> = ({
  summary,
  onExport,
  className,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Export Options */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Health Summary</h2>
          <p className="text-sm text-gray-600">
            Generated on {formatDate(summary.summary_date)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport?.('pdf')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport?.('json')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export JSON
          </Button>
        </div>
      </div>

      {/* Print-Friendly Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 print:border-0 print:shadow-none">
        {/* Pet Information Header */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {summary.pet_name}'s Health Summary
          </h1>
          <p className="text-gray-600">
            Report Date: {formatDate(summary.summary_date)}
          </p>
        </div>

        {/* AI Insights Section */}
        {summary.ai_insights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border border-primary-200"
          >
            <div className="flex items-start space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  AI-Powered Health Insights
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">{summary.ai_insights}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recommendations */}
        {summary.recommendations && summary.recommendations.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Recommendations
            </h3>
            <ul className="space-y-2">
              {summary.recommendations.map((recommendation, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700">{recommendation}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent Symptoms */}
        {summary.recent_symptoms && summary.recent_symptoms.length > 0 && (
          <div className="mb-8 page-break-inside-avoid">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Symptoms
            </h3>
            <div className="space-y-3">
              {summary.recent_symptoms.map((symptom) => (
                <div
                  key={symptom.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      'px-2 py-1 rounded-md text-xs font-medium',
                      symptom.severity === 'severe' ? 'bg-red-100 text-red-700' :
                      symptom.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    )}>
                      {symptom.severity.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(symptom.logged_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Symptoms:</strong> {symptom.symptoms.join(', ')}
                  </p>
                  {symptom.body_parts.length > 0 && (
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Affected Areas:</strong> {symptom.body_parts.join(', ')}
                    </p>
                  )}
                  {symptom.notes && (
                    <p className="text-sm text-gray-600 italic">
                      {symptom.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Vaccinations */}
        {summary.recent_vaccinations && summary.recent_vaccinations.length > 0 && (
          <div className="mb-8 page-break-inside-avoid">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Vaccinations
            </h3>
            <div className="space-y-3">
              {summary.recent_vaccinations.map((vaccination) => (
                <div
                  key={vaccination.id}
                  className="p-4 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {vaccination.vaccine_name}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {formatDate(vaccination.administered_date)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>Type:</strong> {vaccination.vaccine_type}
                  </p>
                  {vaccination.veterinarian && (
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Administered by:</strong> {vaccination.veterinarian}
                    </p>
                  )}
                  {vaccination.next_due_date && (
                    <p className="text-sm text-primary-600">
                      <strong>Next Due:</strong> {formatDate(vaccination.next_due_date)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Medications */}
        {summary.active_medications && summary.active_medications.length > 0 && (
          <div className="mb-8 page-break-inside-avoid">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Active Medications
            </h3>
            <div className="space-y-3">
              {summary.active_medications.map((medication: any) => (
                <div
                  key={medication.id}
                  className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {medication.medication_name}
                  </h4>
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>Dosage:</strong> {medication.dosage}
                  </p>
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>Frequency:</strong> {medication.frequency}
                  </p>
                  {medication.administration_instructions && (
                    <p className="text-sm text-gray-600 italic mt-2">
                      {medication.administration_instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Appointments */}
        {summary.recent_appointments && summary.recent_appointments.length > 0 && (
          <div className="mb-8 page-break-inside-avoid">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Appointments
            </h3>
            <div className="space-y-3">
              {summary.recent_appointments.map((appointment: any) => (
                <div
                  key={appointment.id}
                  className="p-4 bg-purple-50 rounded-lg border border-purple-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {appointment.purpose || 'Veterinary Visit'}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {formatDate(appointment.appointment_date)}
                    </span>
                  </div>
                  {appointment.clinic_name && (
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Clinic:</strong> {appointment.clinic_name}
                    </p>
                  )}
                  {appointment.veterinarian && (
                    <p className="text-sm text-gray-700">
                      <strong>Veterinarian:</strong> {appointment.veterinarian}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>
            This health summary was generated by PawPal Voice Pet Care Assistant
          </p>
          <p className="mt-1">
            For veterinary use only. Please consult with a licensed veterinarian for medical decisions.
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            margin: 1in;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  )
}
