/**
 * AppointmentCard Component
 * Displays appointment details with clinic info, directions, and contact options
 */
'use client'

import React from 'react'
import { Appointment, APPOINTMENT_TYPE_LABELS, APPOINTMENT_STATUS_LABELS } from '@/types/appointments'
import { colors, borderRadius, spacing, shadows } from '@/lib/design-tokens'

interface AppointmentCardProps {
  appointment: Appointment
  petName?: string
  onEdit?: (appointment: Appointment) => void
  onCancel?: (appointmentId: string) => void
  onGetDirections?: (address: string) => void
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  petName,
  onEdit,
  onCancel,
  onGetDirections,
}) => {
  const appointmentDate = new Date(appointment.appointment_date)
  const isUpcoming = appointment.is_upcoming
  const isPast = appointment.is_past
  
  const getStatusColor = () => {
    switch (appointment.status) {
      case 'scheduled':
        return colors.secondary[500]
      case 'completed':
        return colors.accent[500]
      case 'cancelled':
        return '#6b7280'
      case 'rescheduled':
        return colors.primary[500]
      default:
        return '#6b7280'
    }
  }

  const getTypeIcon = () => {
    switch (appointment.appointment_type) {
      case 'emergency':
        return '🚨'
      case 'vaccination':
        return '💉'
      case 'checkup':
        return '🩺'
      case 'surgery':
        return '⚕️'
      case 'dental':
        return '🦷'
      case 'grooming':
        return '✂️'
      default:
        return '🏥'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const handleCallClinic = () => {
    if (appointment.clinic_phone) {
      window.location.href = `tel:${appointment.clinic_phone}`
    }
  }

  const handleGetDirections = () => {
    if (appointment.clinic_address && onGetDirections) {
      onGetDirections(appointment.clinic_address)
    }
  }

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        boxShadow: shadows.md,
        border: `2px solid ${isUpcoming ? colors.primary[200] : '#e5e7eb'}`,
        marginBottom: spacing.md,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span style={{ fontSize: '2rem' }}>{getTypeIcon()}</span>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>
              {APPOINTMENT_TYPE_LABELS[appointment.appointment_type as keyof typeof APPOINTMENT_TYPE_LABELS] || appointment.appointment_type}
            </h3>
            {petName && (
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                for {petName}
              </p>
            )}
          </div>
        </div>
        <span
          style={{
            backgroundColor: getStatusColor(),
            color: 'white',
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: borderRadius.md,
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          {APPOINTMENT_STATUS_LABELS[appointment.status]}
        </span>
      </div>

      {/* Date and Time */}
      <div style={{ marginBottom: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
          <span style={{ fontSize: '1.25rem' }}>📅</span>
          <span style={{ fontSize: '1rem', fontWeight: 500, color: '#374151' }}>
            {formatDate(appointmentDate)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span style={{ fontSize: '1.25rem' }}>🕐</span>
          <span style={{ fontSize: '1rem', fontWeight: 500, color: '#374151' }}>
            {formatTime(appointmentDate)}
          </span>
        </div>
      </div>

      {/* Clinic Information */}
      <div
        style={{
          backgroundColor: '#f9fafb',
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginBottom: spacing.md,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
          <span style={{ fontSize: '1.25rem' }}>🏥</span>
          <span style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
            {appointment.clinic_name}
          </span>
        </div>
        {appointment.veterinarian && (
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <span style={{ fontSize: '1.25rem' }}>👨‍⚕️</span>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Dr. {appointment.veterinarian}
            </span>
          </div>
        )}
        {appointment.clinic_address && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm }}>
            <span style={{ fontSize: '1.25rem' }}>📍</span>
            <span style={{ fontSize: '0.875rem', color: '#6b7280', flex: 1 }}>
              {appointment.clinic_address}
            </span>
          </div>
        )}
        {appointment.clinic_phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <span style={{ fontSize: '1.25rem' }}>📞</span>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {appointment.clinic_phone}
            </span>
          </div>
        )}
      </div>

      {/* Purpose and Notes */}
      {(appointment.purpose || appointment.notes) && (
        <div style={{ marginBottom: spacing.md }}>
          {appointment.purpose && (
            <p style={{ fontSize: '0.875rem', color: '#374151', margin: `0 0 ${spacing.xs} 0` }}>
              <strong>Purpose:</strong> {appointment.purpose}
            </p>
          )}
          {appointment.notes && (
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              <strong>Notes:</strong> {appointment.notes}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
        {appointment.clinic_address && (
          <button
            onClick={handleGetDirections}
            style={{
              backgroundColor: colors.secondary[500],
              color: 'white',
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: borderRadius.md,
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            🗺️ Directions
          </button>
        )}
        {appointment.clinic_phone && (
          <button
            onClick={handleCallClinic}
            style={{
              backgroundColor: colors.accent[500],
              color: 'white',
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: borderRadius.md,
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            📞 Call
          </button>
        )}
        {isUpcoming && onEdit && (
          <button
            onClick={() => onEdit(appointment)}
            style={{
              backgroundColor: 'white',
              color: colors.primary[600],
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: borderRadius.md,
              border: `1px solid ${colors.primary[300]}`,
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
        )}
        {isUpcoming && onCancel && (
          <button
            onClick={() => onCancel(appointment.id)}
            style={{
              backgroundColor: 'white',
              color: '#ef4444',
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: borderRadius.md,
              border: '1px solid #fecaca',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
