import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { PillBottleIcon } from '@/components/icons'
import { MedicationLog } from '@/types/care'
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns'

interface MedicationHistoryProps {
  logs: MedicationLog[]
  medicationNames: Record<string, string>
  className?: string
}

type FilterPeriod = 'all' | 'today' | 'week' | 'month'

export const MedicationHistory: React.FC<MedicationHistoryProps> = ({
  logs,
  medicationNames,
  className,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterPeriod, setFilterPeriod] = React.useState<FilterPeriod>('all')

  const filteredLogs = React.useMemo(() => {
    let filtered = logs

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((log) => {
        const medName = medicationNames[log.medication_id]?.toLowerCase() || ''
        const notes = log.notes?.toLowerCase() || ''
        const query = searchQuery.toLowerCase()
        return medName.includes(query) || notes.includes(query)
      })
    }

    // Apply time period filter
    if (filterPeriod !== 'all') {
      const now = new Date()
      const endDate = endOfDay(now)
      let startDate: Date

      switch (filterPeriod) {
        case 'today':
          startDate = startOfDay(now)
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0)
      }

      filtered = filtered.filter((log) =>
        isWithinInterval(new Date(log.administered_at), { start: startDate, end: endDate })
      )
    }

    return filtered.sort(
      (a, b) => new Date(b.administered_at).getTime() - new Date(a.administered_at).getTime()
    )
  }, [logs, searchQuery, filterPeriod, medicationNames])

  const filterButtons: { label: string; value: FilterPeriod }[] = [
    { label: 'All', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PillBottleIcon size={24} className="text-primary-500" />
          Medication History
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search medications or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none transition-colors"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          <div className="flex gap-2 flex-wrap">
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setFilterPeriod(btn.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterPeriod === btn.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
        </div>

        {/* History List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full" />
                  <h4 className="font-semibold text-gray-900">
                    {medicationNames[log.medication_id] || 'Unknown Medication'}
                  </h4>
                </div>
                <span className="text-xs text-gray-500">
                  {format(new Date(log.administered_at), 'MMM dd, yyyy • h:mm a')}
                </span>
              </div>

              {log.administered_by && (
                <p className="text-sm text-gray-600 mb-1">
                  Administered by: {log.administered_by}
                </p>
              )}

              {log.notes && (
                <p className="text-sm text-gray-700 mt-2 p-2 bg-white rounded border border-gray-200">
                  {log.notes}
                </p>
              )}
            </motion.div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <PillBottleIcon size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No medication logs found</p>
              <p className="text-sm mt-1">
                {searchQuery || filterPeriod !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start logging medications to see history here'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
