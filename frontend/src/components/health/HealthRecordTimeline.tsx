import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { HealthRecord, RecordType } from '@/types/health'

export interface HealthRecordTimelineProps {
  records: HealthRecord[]
  onRecordClick?: (record: HealthRecord) => void
  className?: string
}

const recordTypeIcons: Record<RecordType, React.ReactNode> = {
  symptom: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  vaccination: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  checkup: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  surgery: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  lab_result: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  other: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
}

const recordTypeColors: Record<RecordType, string> = {
  symptom: 'bg-yellow-100 text-yellow-600',
  vaccination: 'bg-green-100 text-green-600',
  checkup: 'bg-blue-100 text-blue-600',
  surgery: 'bg-red-100 text-red-600',
  lab_result: 'bg-purple-100 text-purple-600',
  other: 'bg-gray-100 text-gray-600',
}

const recordTypeLabels: Record<RecordType, string> = {
  symptom: 'Symptom',
  vaccination: 'Vaccination',
  checkup: 'Checkup',
  surgery: 'Surgery',
  lab_result: 'Lab Result',
  other: 'Other',
}

export const HealthRecordTimeline: React.FC<HealthRecordTimelineProps> = ({
  records,
  onRecordClick,
  className,
}) => {
  const [filterType, setFilterType] = useState<RecordType | 'all'>('all')

  const filteredRecords = filterType === 'all' 
    ? records 
    : records.filter(r => r.record_type === filterType)

  const sortedRecords = [...filteredRecords].sort(
    (a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filterType === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          All Records
        </button>
        {Object.entries(recordTypeLabels).map(([type, label]) => (
          <button
            key={type}
            onClick={() => setFilterType(type as RecordType)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filterType === type
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Timeline Items */}
        <div className="space-y-6">
          {sortedRecords.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-500">No health records found</p>
            </div>
          ) : (
            sortedRecords.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-20"
              >
                {/* Icon */}
                <div
                  className={cn(
                    'absolute left-4 w-8 h-8 rounded-full flex items-center justify-center',
                    recordTypeColors[record.record_type]
                  )}
                >
                  {recordTypeIcons[record.record_type]}
                </div>

                {/* Content Card */}
                <div
                  onClick={() => onRecordClick?.(record)}
                  className={cn(
                    'bg-white rounded-xl p-4 border border-gray-200 shadow-sm transition-all',
                    onRecordClick && 'cursor-pointer hover:shadow-md hover:border-primary-300'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span
                        className={cn(
                          'inline-block px-2 py-1 rounded-md text-xs font-medium mb-2',
                          recordTypeColors[record.record_type]
                        )}
                      >
                        {recordTypeLabels[record.record_type]}
                      </span>
                      <h4 className="font-semibold text-gray-900">
                        {record.description}
                      </h4>
                    </div>
                    <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                      {formatDate(record.record_date)}
                    </span>
                  </div>

                  {record.veterinarian && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Veterinarian:</span> {record.veterinarian}
                    </p>
                  )}

                  {record.diagnosis && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                    </p>
                  )}

                  {record.treatment_plan && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Treatment:</span> {record.treatment_plan}
                    </p>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
