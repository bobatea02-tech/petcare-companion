import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import type { HealthRecord, RecordType } from '@/types/health'

export interface HealthRecordSearchProps {
  records: HealthRecord[]
  onRecordSelect?: (record: HealthRecord) => void
  className?: string
}

export const HealthRecordSearch: React.FC<HealthRecordSearchProps> = ({
  records,
  onRecordSelect,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<RecordType | 'all'>('all')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })

  const filteredRecords = useMemo(() => {
    let filtered = records

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (record) =>
          record.description.toLowerCase().includes(query) ||
          record.diagnosis?.toLowerCase().includes(query) ||
          record.treatment_plan?.toLowerCase().includes(query) ||
          record.veterinarian?.toLowerCase().includes(query)
      )
    }

    // Filter by record type
    if (selectedType !== 'all') {
      filtered = filtered.filter((record) => record.record_type === selectedType)
    }

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(
        (record) => new Date(record.record_date) >= new Date(dateRange.start)
      )
    }
    if (dateRange.end) {
      filtered = filtered.filter(
        (record) => new Date(record.record_date) <= new Date(dateRange.end)
      )
    }

    // Sort by date (newest first)
    return filtered.sort(
      (a, b) =>
        new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
    )
  }, [records, searchQuery, selectedType, dateRange])

  const recordTypes: Array<{ value: RecordType | 'all'; label: string }> = [
    { value: 'all', label: 'All Types' },
    { value: 'symptom', label: 'Symptoms' },
    { value: 'vaccination', label: 'Vaccinations' },
    { value: 'checkup', label: 'Checkups' },
    { value: 'surgery', label: 'Surgeries' },
    { value: 'lab_result', label: 'Lab Results' },
    { value: 'other', label: 'Other' },
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedType('all')
    setDateRange({ start: '', end: '' })
  }

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedType !== 'all' ||
    dateRange.start !== '' ||
    dateRange.end !== ''

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search health records by description, diagnosis, veterinarian..."
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Record Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as RecordType | 'all')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
        >
          {recordTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        {/* Date Range Filters */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            placeholder="Start date"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            placeholder="End date"
          />
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'} found
          {hasActiveFilters && ` (filtered from ${records.length} total)`}
        </p>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredRecords.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
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
              <p className="text-gray-500 mb-2">No health records found</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear filters to see all records
                </button>
              )}
            </motion.div>
          ) : (
            filteredRecords.map((record, index) => (
              <motion.div
                key={record.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onRecordSelect?.(record)}
                className={cn(
                  'bg-white rounded-xl p-4 border border-gray-200 shadow-sm transition-all',
                  onRecordSelect && 'cursor-pointer hover:shadow-md hover:border-primary-300'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={cn(
                          'inline-block px-2 py-1 rounded-md text-xs font-medium',
                          record.record_type === 'symptom' && 'bg-yellow-100 text-yellow-700',
                          record.record_type === 'vaccination' && 'bg-green-100 text-green-700',
                          record.record_type === 'checkup' && 'bg-blue-100 text-blue-700',
                          record.record_type === 'surgery' && 'bg-red-100 text-red-700',
                          record.record_type === 'lab_result' && 'bg-purple-100 text-purple-700',
                          record.record_type === 'other' && 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {record.record_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {record.description}
                    </h4>
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
                  <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                    {formatDate(record.record_date)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
