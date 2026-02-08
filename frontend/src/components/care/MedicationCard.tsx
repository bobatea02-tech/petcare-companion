import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PillBottleIcon, PharmacyIcon } from '@/components/icons'
import { Medication } from '@/types/care'
import { cn } from '@/lib/utils'

interface MedicationCardProps {
  medication: Medication
  onLog: (medicationId: string) => void
  onViewDetails: (medication: Medication) => void
  className?: string
}

export const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  onLog,
  onViewDetails,
  className,
}) => {
  const [isLogging, setIsLogging] = useState(false)

  const handleLog = async () => {
    setIsLogging(true)
    await onLog(medication.id)
    setIsLogging(false)
  }

  const needsRefill = medication.current_quantity <= medication.refill_threshold

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className={cn('hover:shadow-lg transition-shadow', needsRefill && 'border-2 border-yellow-400')}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              'p-3 rounded-xl',
              needsRefill ? 'bg-yellow-100 text-yellow-600' : 'bg-primary-100 text-primary-600'
            )}>
              <PillBottleIcon size={32} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {medication.medication_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {medication.dosage} • {medication.frequency}
                  </p>
                </div>
                {needsRefill && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium"
                  >
                    <PharmacyIcon size={14} />
                    Refill Needed
                  </motion.div>
                )}
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Quantity Remaining</span>
                  <span className="text-xs font-medium text-gray-700">
                    {medication.current_quantity} doses
                  </span>
                </div>
                <ProgressBar
                  value={medication.current_quantity}
                  max={medication.refill_threshold * 2}
                  color={needsRefill ? 'warning' : 'success'}
                  size="sm"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleLog}
                  isLoading={isLogging}
                  className="flex-1"
                >
                  Log Dose
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewDetails(medication)}
                >
                  Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
