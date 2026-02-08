'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'

interface EmergencyAlertProps {
  onFindVet: () => void
  onDismiss: () => void
}

export const EmergencyAlert: React.FC<EmergencyAlertProps> = ({
  onFindVet,
  onDismiss,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Alert Icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
            className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-5xl"
          >
            🚨
          </motion.div>
        </div>

        {/* Alert Content */}
        <h2 className="text-2xl font-display font-bold text-center text-red-600 mb-3">
          Emergency Situation Detected
        </h2>
        
        <p className="text-center text-gray-700 mb-6">
          Based on the symptoms described, your pet may need immediate veterinary
          attention. Please seek emergency care right away.
        </p>

        {/* Emergency Tips */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">
            While seeking care:
          </h3>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• Keep your pet calm and comfortable</li>
            <li>• Do not give food or water unless instructed</li>
            <li>• Call ahead to the emergency clinic</li>
            <li>• Bring any medications your pet is taking</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            className="w-full bg-red-500 hover:bg-red-600"
            size="lg"
            onClick={onFindVet}
          >
            🏥 Find Emergency Vet Nearby
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={onDismiss}
          >
            I Understand
          </Button>
        </div>

        {/* Emergency Number */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Pet Poison Helpline (24/7)
          </p>
          <a
            href="tel:855-764-7661"
            className="text-lg font-semibold text-primary-500 hover:text-primary-600"
          >
            📞 (855) 764-7661
          </a>
        </div>
      </motion.div>
    </motion.div>
  )
}
