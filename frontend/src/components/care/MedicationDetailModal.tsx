import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { PillBottleIcon } from '@/components/icons'
import { Medication } from '@/types/care'
import { format } from 'date-fns'

interface MedicationDetailModalProps {
  medication: Medication | null
  isOpen: boolean
  onClose: () => void
}

export const MedicationDetailModal: React.FC<MedicationDetailModalProps> = ({
  medication,
  isOpen,
  onClose,
}) => {
  if (!medication) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Medication Details" size="md">
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl">
          <div className="p-3 bg-primary-100 text-primary-600 rounded-xl">
            <PillBottleIcon size={40} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {medication.medication_name}
            </h3>
            <p className="text-sm text-gray-600">
              {medication.active ? 'Active Medication' : 'Inactive'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Dosage</label>
            <p className="text-base text-gray-900 mt-1">{medication.dosage}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Frequency</label>
            <p className="text-base text-gray-900 mt-1">{medication.frequency}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Start Date</label>
            <p className="text-base text-gray-900 mt-1">
              {format(new Date(medication.start_date), 'MMM dd, yyyy')}
            </p>
          </div>
          {medication.end_date && (
            <div>
              <label className="text-sm font-medium text-gray-500">End Date</label>
              <p className="text-base text-gray-900 mt-1">
                {format(new Date(medication.end_date), 'MMM dd, yyyy')}
              </p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-500">Current Quantity</label>
            <p className="text-base text-gray-900 mt-1">
              {medication.current_quantity} doses
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Refill Threshold</label>
            <p className="text-base text-gray-900 mt-1">
              {medication.refill_threshold} doses
            </p>
          </div>
        </div>

        {medication.administration_instructions && (
          <div>
            <label className="text-sm font-medium text-gray-500">
              Administration Instructions
            </label>
            <p className="text-base text-gray-700 mt-2 p-4 bg-gray-50 rounded-lg">
              {medication.administration_instructions}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="primary" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
