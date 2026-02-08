import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}) => {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-2 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <motion.div
          className={cn(
            'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors',
            checked
              ? 'bg-primary-500 border-primary-500'
              : 'bg-white border-gray-300 hover:border-primary-300'
          )}
          whileTap={{ scale: 0.95 }}
        >
          {checked && (
            <motion.svg
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3,8 6,11 13,4" />
            </motion.svg>
          )}
        </motion.div>
      </div>
      {label && <span className="text-gray-700">{label}</span>}
    </label>
  )
}
