'use client'

import React from 'react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface QuickAction {
  id: string
  label: string
  icon: string
  variant: 'primary' | 'secondary' | 'accent' | 'outline'
  onClick: () => void
  badge?: number
}

interface QuickActionsProps {
  actions?: QuickAction[]
  className?: string
}

const defaultActions: QuickAction[] = [
  {
    id: 'ai-assistant',
    label: 'AI Assistant',
    icon: '🤖',
    variant: 'primary',
    onClick: () => {},
  },
  {
    id: 'log-medication',
    label: 'Log Medication',
    icon: '💊',
    variant: 'secondary',
    onClick: () => {},
  },
  {
    id: 'book-appointment',
    label: 'Book Appointment',
    icon: '📅',
    variant: 'accent',
    onClick: () => {},
  },
  {
    id: 'add-pet',
    label: 'Add Pet',
    icon: '➕',
    variant: 'outline',
    onClick: () => {},
  },
]

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions = defaultActions,
  className,
}) => {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {actions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant}
          onClick={action.onClick}
          className="h-auto py-6 flex-col gap-3 relative group hover:scale-105 transition-transform"
        >
          <span className="text-4xl group-hover:scale-110 transition-transform">
            {action.icon}
          </span>
          <span className="font-medium">{action.label}</span>
          {action.badge !== undefined && action.badge > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {action.badge > 9 ? '9+' : action.badge}
            </span>
          )}
        </Button>
      ))}
    </div>
  )
}
