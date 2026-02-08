import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PawIcon } from '@/components/icons'
import { CareTask } from '@/types/care'
import { format } from 'date-fns'

interface DailyCareChecklistProps {
  tasks: CareTask[]
  onToggleTask: (taskId: string, completed: boolean) => void
  className?: string
}

const taskTypeEmojis = {
  medication: '💊',
  feeding: '🍖',
  grooming: '✂️',
  exercise: '🏃',
  other: '📝',
}

export const DailyCareChecklist: React.FC<DailyCareChecklistProps> = ({
  tasks,
  onToggleTask,
  className,
}) => {
  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PawIcon size={24} className="text-primary-500" />
            Daily Care Checklist
          </CardTitle>
          <span className="text-sm font-medium text-gray-600">
            {format(new Date(), 'MMM dd, yyyy')}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Today&apos;s Progress
            </span>
            <span className="text-sm font-semibold text-primary-600">
              {completedCount} / {totalCount} completed
            </span>
          </div>
          <ProgressBar
            value={completedCount}
            max={totalCount}
            color="primary"
            size="md"
          />
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  task.completed
                    ? 'bg-accent-50 border-accent-200'
                    : 'bg-white border-gray-200 hover:border-primary-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.completed}
                    onChange={(checked) => onToggleTask(task.id, checked)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {taskTypeEmojis[task.task_type]}
                      </span>
                      <h4
                        className={`font-medium ${
                          task.completed
                            ? 'text-gray-500 line-through'
                            : 'text-gray-900'
                        }`}
                      >
                        {task.title}
                      </h4>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-1">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>⏰ {format(new Date(task.scheduled_time), 'h:mm a')}</span>
                      {task.completed && task.completed_at && (
                        <span className="text-accent-600">
                          ✓ Completed at {format(new Date(task.completed_at), 'h:mm a')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <PawIcon size={48} className="mx-auto mb-3 opacity-30" />
              <p>No tasks scheduled for today</p>
            </div>
          )}
        </div>

        {completedCount === totalCount && totalCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-4 bg-accent-100 rounded-xl text-center"
          >
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-semibold text-accent-700">
              All tasks completed! Great job caring for your pet!
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
