/**
 * AppointmentCalendar Component
 * Calendar view for appointments with vet clinic icons and color coding
 */
'use client'

import React, { useState } from 'react'
import { Appointment, APPOINTMENT_TYPE_LABELS } from '@/types/appointments'
import { colors, borderRadius, spacing, shadows } from '@/lib/design-tokens'

interface AppointmentCalendarProps {
  appointments: Appointment[]
  onDateSelect?: (date: Date) => void
  onAppointmentClick?: (appointment: Appointment) => void
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments,
  onDateSelect,
  onAppointmentClick,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month, 1).getDay()
  }

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date)
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const today = new Date()
  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'emergency':
        return '#ef4444'
      case 'vaccination':
        return colors.secondary[500]
      case 'checkup':
        return colors.accent[500]
      case 'surgery':
        return colors.primary[600]
      default:
        return colors.primary[400]
    }
  }

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        boxShadow: shadows.md,
      }}
    >
      {/* Calendar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
        <button
          onClick={previousMonth}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: spacing.sm,
          }}
        >
          ◀️
        </button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>
          {monthName}
        </h2>
        <button
          onClick={nextMonth}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: spacing.sm,
          }}
        >
          ▶️
        </button>
      </div>

      {/* Day Headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: spacing.xs, marginBottom: spacing.sm }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#6b7280',
              padding: spacing.xs,
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: spacing.xs }}>
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} />
          }

          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
          const dayAppointments = getAppointmentsForDate(date)
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()

          return (
            <div
              key={day}
              onClick={() => onDateSelect && onDateSelect(date)}
              style={{
                minHeight: '80px',
                padding: spacing.xs,
                borderRadius: borderRadius.md,
                border: isToday ? `2px solid ${colors.primary[500]}` : '1px solid #e5e7eb',
                backgroundColor: isToday ? colors.primary[50] : 'white',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: isToday ? 600 : 400,
                  color: isToday ? colors.primary[700] : '#374151',
                  marginBottom: spacing.xs,
                }}
              >
                {day}
              </div>
              {dayAppointments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {dayAppointments.slice(0, 2).map((apt) => (
                    <div
                      key={apt.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onAppointmentClick && onAppointmentClick(apt)
                      }}
                      style={{
                        backgroundColor: getTypeColor(apt.appointment_type),
                        color: 'white',
                        fontSize: '0.625rem',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                      title={`${new Date(apt.appointment_date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })} - ${apt.clinic_name}`}
                    >
                      {new Date(apt.appointment_date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div
                      style={{
                        fontSize: '0.625rem',
                        color: '#6b7280',
                        textAlign: 'center',
                      }}
                    >
                      +{dayAppointments.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ marginTop: spacing.lg, paddingTop: spacing.md, borderTop: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: spacing.sm }}>
          Appointment Types:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md }}>
          {[
            { type: 'emergency', label: 'Emergency', icon: '🚨' },
            { type: 'vaccination', label: 'Vaccination', icon: '💉' },
            { type: 'checkup', label: 'Check-up', icon: '🩺' },
            { type: 'surgery', label: 'Surgery', icon: '⚕️' },
          ].map(({ type, label, icon }) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  backgroundColor: getTypeColor(type),
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {icon} {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
