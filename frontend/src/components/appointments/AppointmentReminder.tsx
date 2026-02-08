/**
 * AppointmentReminder Component
 * Reminder notification banner with countdown timer
 */
'use client'

import React, { useState, useEffect } from 'react'
import { Appointment } from '@/types/appointments'
import { colors, borderRadius, spacing, shadows } from '@/lib/design-tokens'

interface AppointmentReminderProps {
  appointment: Appointment
  onDismiss?: () => void
  onViewDetails?: (appointment: Appointment) => void
}

export const AppointmentReminder: React.FC<AppointmentReminderProps> = ({
  appointment,
  onDismiss,
  onViewDetails,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const appointmentDate = new Date(appointment.appointment_date)
      const diff = appointmentDate.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining('Now')
        setIsUrgent(true)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (hours < 2) {
        setIsUrgent(true)
        if (hours === 0) {
          setTimeRemaining(`${minutes} minute${minutes !== 1 ? 's' : ''}`)
        } else {
          setTimeRemaining(`${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min`)
        }
      } else if (hours < 24) {
        setIsUrgent(false)
        setTimeRemaining(`${hours} hour${hours !== 1 ? 's' : ''}`)
      } else {
        const days = Math.floor(hours / 24)
        setIsUrgent(false)
        setTimeRemaining(`${days} day${days !== 1 ? 's' : ''}`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [appointment.appointment_date])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const appointmentDate = new Date(appointment.appointment_date)

  return (
    <div
      style={{
        backgroundColor: isUrgent ? '#fef2f2' : colors.primary[50],
        border: `2px solid ${isUrgent ? '#fca5a5' : colors.primary[200]}`,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        boxShadow: shadows.md,
        animation: isUrgent ? 'pulse 2s infinite' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <span style={{ fontSize: '1.5rem' }}>{isUrgent ? '⏰' : '🔔'}</span>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: isUrgent ? '#991b1b' : colors.primary[700], margin: 0 }}>
                {isUrgent ? 'Upcoming Appointment!' : 'Appointment Reminder'}
              </h4>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                {appointment.clinic_name}
              </p>
            </div>
          </div>

          {/* Countdown */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: borderRadius.md,
              padding: spacing.sm,
              marginBottom: spacing.sm,
              display: 'inline-block',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <span style={{ fontSize: '1.25rem' }}>⏱️</span>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: isUrgent ? '#dc2626' : colors.primary[600] }}>
                  {timeRemaining}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {formatTime(appointmentDate)}
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          {appointment.purpose && (
            <p style={{ fontSize: '0.875rem', color: '#374151', margin: `0 0 ${spacing.sm} 0` }}>
              {appointment.purpose}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(appointment)}
                style={{
                  backgroundColor: isUrgent ? '#dc2626' : colors.primary[500],
                  color: 'white',
                  padding: `${spacing.sm} ${spacing.md}`,
                  borderRadius: borderRadius.md,
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                View Details
              </button>
            )}
            {appointment.clinic_address && (
              <button
                onClick={() => {
                  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    appointment.clinic_address!
                  )}`
                  window.open(url, '_blank')
                }}
                style={{
                  backgroundColor: 'white',
                  color: colors.secondary[600],
                  padding: `${spacing.sm} ${spacing.md}`,
                  borderRadius: borderRadius.md,
                  border: `1px solid ${colors.secondary[300]}`,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🗺️ Directions
              </button>
            )}
          </div>
        </div>

        {/* Dismiss Button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: spacing.xs,
              color: '#9ca3af',
            }}
          >
            ✕
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  )
}
