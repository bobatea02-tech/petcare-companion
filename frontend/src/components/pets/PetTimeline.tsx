'use client'

import React, { useState } from 'react'
import { format, parseISO, isToday, isYesterday, isThisWeek } from 'date-fns'
import { cn } from '@/lib/utils'
import { TimelineEvent } from '@/types/pets'

interface PetTimelineProps {
  events: TimelineEvent[]
  className?: string
  showFilters?: boolean
}

const eventTypeConfig = {
  medication: { color: 'bg-blue-500', icon: '💊', label: 'Medication' },
  feeding: { color: 'bg-green-500', icon: '🍖', label: 'Feeding' },
  checkup: { color: 'bg-purple-500', icon: '🏥', label: 'Checkup' },
  vaccination: { color: 'bg-red-500', icon: '💉', label: 'Vaccination' },
  activity: { color: 'bg-yellow-500', icon: '🎾', label: 'Activity' },
  grooming: { color: 'bg-pink-500', icon: '✂️', label: 'Grooming' },
}

type EventType = keyof typeof eventTypeConfig

export const PetTimeline: React.FC<PetTimelineProps> = ({ 
  events, 
  className,
  showFilters = true 
}) => {
  const [selectedFilter, setSelectedFilter] = useState<EventType | 'all'>('all')

  const filteredEvents = selectedFilter === 'all' 
    ? events 
    : events.filter(e => e.type === selectedFilter)

  const getTimeLabel = (timestamp: string) => {
    const date = parseISO(timestamp)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    if (isThisWeek(date)) return format(date, 'EEEE')
    return format(date, 'MMM d, yyyy')
  }

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const label = getTimeLabel(event.timestamp)
    if (!acc[label]) acc[label] = []
    acc[label].push(event)
    return acc
  }, {} as Record<string, TimelineEvent[]>)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              selectedFilter === 'all'
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            All Activities
          </button>
          {Object.entries(eventTypeConfig).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setSelectedFilter(type as EventType)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                selectedFilter === type
                  ? `${config.color} text-white shadow-md`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <span>{config.icon}</span>
              <span>{config.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Timeline */}
      {Object.entries(groupedEvents).map(([dateLabel, dayEvents]) => (
        <div key={dateLabel}>
          <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 py-2 mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              {dateLabel}
            </h3>
          </div>

          <div className="space-y-4">
            {dayEvents.map((event, index) => {
              const config = eventTypeConfig[event.type]
              const isLast = index === dayEvents.length - 1

              return (
                <div key={event.id} className="flex gap-4">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow-md',
                        config.color,
                        'ring-4 ring-white'
                      )}
                    >
                      {event.icon || config.icon}
                    </div>
                    {!isLast && (
                      <div className="w-1 flex-1 bg-gradient-to-b from-gray-300 to-transparent mt-2 min-h-[40px]" />
                    )}
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 pb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-gray-100 hover:border-primary-200 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {event.title}
                          </h4>
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            <span>🕐</span>
                            <span>{format(parseISO(event.timestamp), 'h:mm a')}</span>
                          </span>
                        </div>
                        <span className={cn(
                          'text-xs font-medium px-2 py-1 rounded-full',
                          config.color,
                          'text-white'
                        )}>
                          {config.label}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {filteredEvents.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            {selectedFilter === 'all' ? 'No activities yet' : `No ${eventTypeConfig[selectedFilter as EventType]?.label.toLowerCase()} activities`}
          </p>
          <p className="text-sm text-gray-600">
            Start tracking your pet's care activities to see them here
          </p>
        </div>
      )}
    </div>
  )
}

export type { TimelineEvent }
