/**
 * Appointments Page
 * Main page for viewing and managing appointments
 */
'use client'

import React, { useState } from 'react'
import {
  AppointmentCalendar,
  AppointmentHistory,
  AppointmentReminder,
  AppointmentBookingFlow,
  EmergencyVetMap,
} from '@/components/appointments'
import { Appointment, VetClinic, AppointmentCreate } from '@/types/appointments'
import { colors, borderRadius, spacing } from '@/lib/design-tokens'

export default function AppointmentsPage() {
  const [showBookingFlow, setShowBookingFlow] = useState(false)
  const [showEmergencyMap, setShowEmergencyMap] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  // Sample data - in production, this would come from API
  const sampleAppointments: Appointment[] = [
    {
      id: '1',
      pet_id: 'pet-1',
      appointment_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      appointment_type: 'checkup',
      purpose: 'Annual wellness exam',
      clinic_name: 'Happy Paws Veterinary Clinic',
      clinic_address: '123 Main St, Anytown, USA',
      clinic_phone: '(555) 123-4567',
      veterinarian: 'Smith',
      status: 'scheduled',
      notes: '',
      reminder_sent_24h: true,
      reminder_sent_2h: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_upcoming: true,
      is_past: false,
      hours_until_appointment: 2,
    },
    {
      id: '2',
      pet_id: 'pet-1',
      appointment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      appointment_type: 'vaccination',
      purpose: 'Rabies booster shot',
      clinic_name: 'Pet Care Center',
      clinic_address: '456 Oak Ave, Anytown, USA',
      clinic_phone: '(555) 987-6543',
      veterinarian: 'Johnson',
      status: 'scheduled',
      notes: '',
      reminder_sent_24h: false,
      reminder_sent_2h: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_upcoming: true,
      is_past: false,
      hours_until_appointment: 168,
    },
    {
      id: '3',
      pet_id: 'pet-1',
      appointment_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      appointment_type: 'dental',
      purpose: 'Teeth cleaning',
      clinic_name: 'Happy Paws Veterinary Clinic',
      clinic_address: '123 Main St, Anytown, USA',
      clinic_phone: '(555) 123-4567',
      veterinarian: 'Smith',
      status: 'completed',
      notes: 'Teeth cleaned successfully',
      reminder_sent_24h: true,
      reminder_sent_2h: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_upcoming: false,
      is_past: true,
    },
  ]

  const sampleClinics: VetClinic[] = [
    {
      id: '1',
      name: 'Emergency Pet Hospital',
      address: '789 Emergency Blvd, Anytown, USA',
      phone_number: '(555) 911-PETS',
      email: 'emergency@pethospital.com',
      website: 'https://pethospital.com',
      latitude: 40.7128,
      longitude: -74.006,
      is_emergency: true,
      is_24_hour: true,
      services_offered: 'Emergency care, surgery, critical care',
      operating_hours: '24/7',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      distance_miles: 2.3,
      rating: 4.8,
    },
    {
      id: '2',
      name: '24/7 Animal Care',
      address: '321 Rescue Road, Anytown, USA',
      phone_number: '(555) 247-CARE',
      email: 'info@247animalcare.com',
      is_emergency: true,
      is_24_hour: true,
      services_offered: 'Emergency services, diagnostics',
      operating_hours: '24/7',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      distance_miles: 3.7,
      rating: 4.6,
    },
  ]

  const upcomingAppointments = sampleAppointments.filter((apt) => apt.is_upcoming)

  const handleBookAppointment = (appointmentData: AppointmentCreate) => {
    console.log('Booking appointment:', appointmentData)
    // In production, this would call the API
    setShowBookingFlow(false)
  }

  const handleCancelAppointment = (appointmentId: string) => {
    console.log('Canceling appointment:', appointmentId)
    // In production, this would call the API
  }

  const handleGetDirections = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    window.open(url, '_blank')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: spacing.xl }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: spacing.xl }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', margin: `0 0 ${spacing.sm} 0` }}>
            🏥 Appointments
          </h1>
          <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>
            Manage your pet's veterinary appointments
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.xl, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowBookingFlow(true)}
            style={{
              backgroundColor: colors.primary[500],
              color: 'white',
              padding: `${spacing.md} ${spacing.xl}`,
              borderRadius: borderRadius.lg,
              border: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            📅 Book Appointment
          </button>
          <button
            onClick={() => setShowEmergencyMap(!showEmergencyMap)}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              padding: `${spacing.md} ${spacing.xl}`,
              borderRadius: borderRadius.lg,
              border: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            🚨 Find Emergency Vet
          </button>
        </div>

        {/* Booking Flow Modal */}
        {showBookingFlow && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: spacing.xl,
              overflow: 'auto',
            }}
            onClick={() => setShowBookingFlow(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <AppointmentBookingFlow
                petId="pet-1"
                petName="Max"
                onComplete={handleBookAppointment}
                onCancel={() => setShowBookingFlow(false)}
              />
            </div>
          </div>
        )}

        {/* Emergency Map */}
        {showEmergencyMap && (
          <div style={{ marginBottom: spacing.xl }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                🚨 Emergency Vet Locations
              </h2>
              <button
                onClick={() => setShowEmergencyMap(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                ✕
              </button>
            </div>
            <EmergencyVetMap
              clinics={sampleClinics}
              userLocation={{ latitude: 40.7128, longitude: -74.006 }}
              onClinicSelect={(clinic) => console.log('Selected clinic:', clinic)}
            />
          </div>
        )}

        {/* Upcoming Appointment Reminders */}
        {upcomingAppointments.length > 0 && (
          <div style={{ marginBottom: spacing.xl }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: spacing.md }}>
              ⏰ Upcoming Appointments
            </h2>
            {upcomingAppointments.map((appointment) => (
              <AppointmentReminder
                key={appointment.id}
                appointment={appointment}
                onViewDetails={(apt) => setSelectedAppointment(apt)}
                onDismiss={() => console.log('Dismissed reminder')}
              />
            ))}
          </div>
        )}

        {/* Calendar View */}
        <div style={{ marginBottom: spacing.xl }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: spacing.md }}>
            📅 Calendar View
          </h2>
          <AppointmentCalendar
            appointments={sampleAppointments}
            onDateSelect={(date) => console.log('Selected date:', date)}
            onAppointmentClick={(apt) => setSelectedAppointment(apt)}
          />
        </div>

        {/* Appointment History */}
        <div>
          <AppointmentHistory
            appointments={sampleAppointments}
            petName="Max"
            onEdit={(apt) => console.log('Edit appointment:', apt)}
            onCancel={handleCancelAppointment}
            onGetDirections={handleGetDirections}
          />
        </div>
      </div>
    </div>
  )
}
