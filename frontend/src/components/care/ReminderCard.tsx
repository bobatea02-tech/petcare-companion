import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/Card'
import { BellIcon, PawIcon } from '@/components/icons'
import { Reminder } from '@/types/care'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface ReminderCardProps {
  reminder: Reminder
  onDismiss: (reminderId: string) => void
  onMarkRead: (reminderId: string) => void
  className?: string
}

const reminderTypeColors = {
  medication: 'bg-primary-100 text-primary-600 border-primary-200',
  feeding: 'bg-accent-100 text-accent-600 border-accent-200',
  appointment: 'bg-secondary-100 text-secondary-600 border-secondary-200',
  grooming: 'bg-purple-100 text-purple-600 border-purple-200',
}

const reminderTypeIcons = {
  medication: '💊',
  feeding: '🍖',
  appointment: '📅',
  grooming: '✂️',
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onDismiss,
  onMarkRead,
  className,
}) => {
  const scheduledDate = new Date(reminder.scheduled_time)
  const isPast = scheduledDate < new Date()
  const timeText = isPast
    ? `${formatDistanceToNow(scheduledDate)} ago`
    : `in ${formatDistanceToNow(scheduledDate)}`

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card
        className={cn(
          'border-l-4 transition-all',
          !reminder.read && 'shadow-md',
          reminderTypeColors[reminder.reminder_type]
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="relative">
                <BellIcon size={24} className={!reminder.read ? 'animate-pulse' : ''} />
                {!reminder.read && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                  />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{reminderTypeIcons[reminder.reminder_type]}</span>
                  <h4 className="font-semibold text-gray-900">{reminder.title}</h4>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{timeText}</span>
              </div>

              <p className="text-sm text-gray-700 mb-3">{reminder.message}</p>

              <div className="flex items-center gap-2">
                {!reminder.read && (
                  <button
                    onClick={() => onMarkRead(reminder.id)}
                    className="px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={() => onDismiss(reminder.id)}
                  className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>

            <div className="flex-shrink-0">
              <PawIcon size={20} className="text-gray-300" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
