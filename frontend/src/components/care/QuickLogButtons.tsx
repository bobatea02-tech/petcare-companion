import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { PillBottleIcon, FoodBowlIcon, PawIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

interface QuickLogButtonsProps {
  onLogMedication: () => void
  onLogFeeding: () => void
  onLogActivity: (activityType: string) => void
  className?: string
}

const quickActivities = [
  { id: 'walk', label: 'Walk', emoji: '🚶', color: 'bg-blue-100 text-blue-600 hover:bg-blue-200' },
  { id: 'play', label: 'Play', emoji: '🎾', color: 'bg-purple-100 text-purple-600 hover:bg-purple-200' },
  { id: 'groom', label: 'Groom', emoji: '✂️', color: 'bg-pink-100 text-pink-600 hover:bg-pink-200' },
  { id: 'bath', label: 'Bath', emoji: '🛁', color: 'bg-cyan-100 text-cyan-600 hover:bg-cyan-200' },
]

export const QuickLogButtons: React.FC<QuickLogButtonsProps> = ({
  onLogMedication,
  onLogFeeding,
  onLogActivity,
  className,
}) => {
  const [activeButton, setActiveButton] = useState<string | null>(null)

  const handleQuickLog = async (action: () => void, buttonId: string) => {
    setActiveButton(buttonId)
    await action()
    setTimeout(() => setActiveButton(null), 1000)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <PawIcon size={16} />
          Quick Log
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickLog(onLogMedication, 'medication')}
            className={cn(
              'p-4 rounded-xl border-2 transition-all text-left',
              activeButton === 'medication'
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-primary-50 text-primary-700 border-primary-200 hover:border-primary-400'
            )}
          >
            <div className="flex items-center gap-3">
              <PillBottleIcon size={24} />
              <div>
                <div className="font-semibold">Medication</div>
                <div className="text-xs opacity-80">Log a dose</div>
              </div>
            </div>
            {activeButton === 'medication' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mt-2 text-xs"
              >
                ✓ Logged!
              </motion.div>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickLog(onLogFeeding, 'feeding')}
            className={cn(
              'p-4 rounded-xl border-2 transition-all text-left',
              activeButton === 'feeding'
                ? 'bg-accent-500 text-white border-accent-500'
                : 'bg-accent-50 text-accent-700 border-accent-200 hover:border-accent-400'
            )}
          >
            <div className="flex items-center gap-3">
              <FoodBowlIcon size={24} />
              <div>
                <div className="font-semibold">Feeding</div>
                <div className="text-xs opacity-80">Log a meal</div>
              </div>
            </div>
            {activeButton === 'feeding' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mt-2 text-xs"
              >
                ✓ Logged!
              </motion.div>
            )}
          </motion.button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Other Activities</h3>
        <div className="grid grid-cols-2 gap-2">
          {quickActivities.map((activity) => (
            <motion.button
              key={activity.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuickLog(() => onLogActivity(activity.id), activity.id)}
              className={cn(
                'p-3 rounded-lg transition-all text-left',
                activeButton === activity.id
                  ? 'bg-gray-700 text-white'
                  : activity.color
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{activity.emoji}</span>
                <span className="text-sm font-medium">{activity.label}</span>
              </div>
              {activeButton === activity.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-1 text-xs"
                >
                  ✓ Logged!
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
