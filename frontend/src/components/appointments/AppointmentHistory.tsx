/**
 * AppointmentHistory Component
 * Displays appointment history with filtering by date and clinic
 */
'use client'

import React, { useState, useMemo } from 'react'
import { Appointment, AppointmentType, AppointmentStatus } from '@/types/appointments'
import { AppointmentCard } from './AppointmentCard'
import { colors, borderRadius, spacing, shadows } from '@/lib/design-tokens'

interface AppointmentHistoryProps {
  appointments: Appointment[]
  petName?: string
  onEdit?: (appointment: Appointment) => void
  onCancel?: (appointmentId: string) => void
  onGetDirections?: (address: string) => void
}

export const AppointmentHistory: React.FC<AppointmentHistoryProps> = ({
  appointments,
  petName,
  onEdit,
  onCancel,
  onGetDirections,
}) => {
  const [filterType, setFilterType] = useState<AppointmentType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all')
  const [filterClinic, setFilterClinic] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'all' | 'upcoming' | 'past' | 'this_month' | 'last_month'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Get unique clinics for filter
  const uniqueClinics = useMemo(() => {
    const clinics = new Set(appointments.map((apt) => apt.clinic_name))
    return Array.from(clinics).sort()
  }, [appointments])

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Type filter
      if (filterType !== 'all' && apt.appointment_type !== filterType) {
        return false
      }

      // Status filter
      if (filterStatus !== 'all' && apt.status !== filterStatus) {
        return false
      }

      // Clinic filter
      if (filterClinic !== 'all' && apt.clinic_name !== filterClinic) {
        return false
      }

      // Date range filter
      const aptDate = new Date(apt.appointment_date)
      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      if (dateRange === 'upcoming' && !apt.is_upcoming) {
        return false
      }
      if (dateRange === 'past' && !apt.is_past) {
        return false
      }
      if (dateRange === 'this_month' && (aptDate < thisMonthStart || aptDate > now)) {
        return false
      }
      if (dateRange === 'last_month' && (aptDate < lastMonthStart || aptDate > lastMonthEnd)) {
        return false
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          apt.clinic_name.toLowerCase().includes(query) ||
          apt.appointment_type.toLowerCase().includes(query) ||
          apt.purpose?.toLowerCase().includes(query) ||
          apt.veterinarian?.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [appointments, filterType, filterStatus, filterClinic, dateRange, searchQuery])

  // Sort appointments by date (upcoming first, then past in reverse chronological order)
  const sortedAppointments = useMemo(() => {
    return [...filteredAppointments].sort((a, b) => {
      const dateA = new Date(a.appointment_date).getTime()
      const dateB = new Date(b.appointment_date).getTime()
      const now = Date.now()

      // Both upcoming
      if (dateA > now && dateB > now) {
        return dateA - dateB // Soonest first
      }
      // Both past
      if (dateA < now && dateB < now) {
        return dateB - dateA // Most recent first
      }
      // One upcoming, one past
      return dateA > now ? -1 : 1 // Upcoming first
    })
  }, [filteredAppointments])

  const upcomingCount = appointments.filter((apt) => apt.is_upcoming).length
  const pastCount = appointments.filter((apt) => apt.is_past).length

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: spacing.lg }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: `0 0 ${spacing.sm} 0` }}>
          Appointment History
        </h2>
        <div style={{ display: 'flex', gap: spacing.md, fontSize: '0.875rem', color: '#6b7280' }}>
          <span>📅 {appointments.length} total</span>
          <span>⏰ {upcomingCount} upcoming</span>
          <span>✅ {pastCount} past</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          marginBottom: spacing.lg,
          boxShadow: shadows.md,
        }}
      >
        {/* Search */}
        <div style={{ marginBottom: spacing.md }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search appointments..."
            style={{
              width: '100%',
              padding: spacing.md,
              borderRadius: borderRadius.md,
              border: '1px solid #d1d5db',
              fontSize: '0.875rem',
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md }}>
          {/* Date Range */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: spacing.xs }}>
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              style={{
                width: '100%',
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
              }}
            >
              <option value="all">All Time</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: spacing.xs }}>
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              style={{
                width: '100%',
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
              }}
            >
              <option value="all">All Types</option>
              <option value="checkup">Check-up</option>
              <option value="emergency">Emergency</option>
              <option value="vaccination">Vaccination</option>
              <option value="surgery">Surgery</option>
              <option value="dental">Dental</option>
              <option value="grooming">Grooming</option>
              <option value="consultation">Consultation</option>
              <option value="follow_up">Follow-up</option>
              <option value="diagnostic">Diagnostic</option>
              <option value="treatment">Treatment</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: spacing.xs }}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              style={{
                width: '100%',
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>

          {/* Clinic Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: spacing.xs }}>
              Clinic
            </label>
            <select
              value={filterClinic}
              onChange={(e) => setFilterClinic(e.target.value)}
              style={{
                width: '100%',
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
              }}
            >
              <option value="all">All Clinics</option>
              {uniqueClinics.map((clinic) => (
                <option key={clinic} value={clinic}>
                  {clinic}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(filterType !== 'all' || filterStatus !== 'all' || filterClinic !== 'all' || dateRange !== 'all' || searchQuery) && (
          <div style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>Active Filters:</span>
              <button
                onClick={() => {
                  setFilterType('all')
                  setFilterStatus('all')
                  setFilterClinic('all')
                  setDateRange('all')
                  setSearchQuery('')
                }}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: borderRadius.md,
                  border: 'none',
                  backgroundColor: colors.primary[100],
                  color: colors.primary[700],
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div style={{ marginBottom: spacing.md }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Showing {sortedAppointments.length} of {appointments.length} appointments
        </p>
      </div>

      {/* Appointment List */}
      {sortedAppointments.length > 0 ? (
        <div>
          {sortedAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              petName={petName}
              onEdit={onEdit}
              onCancel={onCancel}
              onGetDirections={onGetDirections}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
            textAlign: 'center',
            boxShadow: shadows.md,
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: spacing.md }}>📅</div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: `0 0 ${spacing.sm} 0` }}>
            No appointments found
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
            {searchQuery || filterType !== 'all' || filterStatus !== 'all' || filterClinic !== 'all' || dateRange !== 'all'
              ? 'Try adjusting your filters'
              : 'No appointments scheduled yet'}
          </p>
        </div>
      )}
    </div>
  )
}
