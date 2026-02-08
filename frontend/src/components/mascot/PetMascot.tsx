'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { PawIcon } from '@/components/icons'

interface PetMascotProps {
  mood?: 'happy' | 'excited' | 'thinking' | 'concerned'
  message?: string
  className?: string
}

export const PetMascot: React.FC<PetMascotProps> = ({
  mood = 'happy',
  message,
  className = '',
}) => {
  const getMoodEmoji = () => {
    switch (mood) {
      case 'happy':
        return '😊'
      case 'excited':
        return '🎉'
      case 'thinking':
        return '🤔'
      case 'concerned':
        return '😟'
      default:
        return '😊'
    }
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-4xl shadow-lg">
          {getMoodEmoji()}
        </div>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-2 -right-2"
        >
          <PawIcon size={32} className="text-primary-500" />
        </motion.div>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-white rounded-2xl shadow-lg p-4 max-w-xs relative"
        >
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45" />
          <p className="text-gray-700 text-center">{message}</p>
        </motion.div>
      )}
    </div>
  )
}
