import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { FoodBowlIcon } from '@/components/icons'
import { FeedingSchedule } from '@/types/care'

interface FeedingScheduleCardProps {
  schedule: FeedingSchedule
  onLogFeeding: (scheduleId: string, time: string) => void
  className?: string
}

export const FeedingScheduleCard: React.FC<FeedingScheduleCardProps> = ({
  schedule,
  onLogFeeding,
  className,
}) => {
  const [completedTimes, setCompletedTimes] = useState<Set<string>>(new Set())
  const [isLogging, setIsLogging] = useState<string | null>(null)

  const handleToggleTime = async (time: string) => {
    const newCompleted = new Set(completedTimes)
    if (newCompleted.has(time)) {
      newCompleted.delete(time)
    } else {
      setIsLogging(time)
      await onLogFeeding(schedule.id, time)
      newCompleted.add(time)
      setIsLogging(null)
    }
    setCompletedTimes(newCompleted)
  }

  const completionPercentage = (completedTimes.size / schedule.scheduled_times.length) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent-100 text-accent-600 rounded-xl">
              <FoodBowlIcon size={32} />
            </div>
            
            <div className="flex-1">
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {schedule.food_type}
                </h3>
                <p className="text-sm text-gray-600">
                  {schedule.amount} • {schedule.frequency}
                </p>
              </div>

              <div className="space-y-2 mb-3">
                {schedule.scheduled_times.map((time) => (
                  <motion.div
                    key={time}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      checked={completedTimes.has(time)}
                      onChange={() => handleToggleTime(time)}
                      disabled={isLogging === time}
                      label={time}
                    />
                  </motion.div>
                ))}
              </div>

              {completedTimes.size > 0 && (
                <div className="mt-3 p-3 bg-accent-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-accent-700">
                      Today&apos;s Progress
                    </span>
                    <span className="text-xs font-medium text-accent-700">
                      {completedTimes.size} / {schedule.scheduled_times.length}
                    </span>
                  </div>
                  <div className="h-2 bg-accent-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercentage}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-accent-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
