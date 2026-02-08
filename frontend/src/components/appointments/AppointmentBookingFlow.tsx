/**
 * AppointmentBookingFlow Component
 * Multi-step appointment booking with step indicators and validation
 */
'use client'

import React, { useState } from 'react'
import { AppointmentCreate, AppointmentType, APPOINTMENT_TYPE_LABELS } from '@/types/appointments'
import { colors, borderRadius, spacing, shadows } from '@/lib/design-tokens'

interface AppointmentBookingFlowProps {
  petId: string
  petName: string
  onComplete: (appointment: AppointmentCreate) => void
  onCancel: () => void
  initialData?: Partial<AppointmentCreate>
}

type Step = 1 | 2 | 3

export const AppointmentBookingFlow: React.FC<AppointmentBookingFlowProps> = ({
  petId,
  petName,
  onComplete,
  onCancel,
  initialData,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [formData, setFormData] = useState<Partial<AppointmentCreate>>({
    appointment_type: 'checkup',
    ...initialData,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const appointmentTypes: AppointmentType[] = [
    'checkup',
    'emergency',
    'vaccination',
    'surgery',
    'dental',
    'grooming',
    'consultation',
    'follow_up',
    'diagnostic',
    'treatment',
  ]

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.appointment_type) {
        newErrors.appointment_type = 'Please select an appointment type'
      }
      if (!formData.appointment_date) {
        newErrors.appointment_date = 'Please select a date and time'
      } else {
        const selectedDate = new Date(formData.appointment_date)
        if (selectedDate < new Date()) {
          newErrors.appointment_date = 'Appointment date must be in the future'
        }
      }
    }

    if (step === 2) {
      if (!formData.clinic_name || formData.clinic_name.trim() === '') {
        newErrors.clinic_name = 'Clinic name is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep((currentStep + 1) as Step)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    }
  }

  const handleSubmit = () => {
    if (validateStep(3)) {
      onComplete(formData as AppointmentCreate)
    }
  }

  const updateFormData = (field: keyof AppointmentCreate, value: any) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const steps = [
    { number: 1, title: 'Appointment Details', icon: '📅' },
    { number: 2, title: 'Clinic Information', icon: '🏥' },
    { number: 3, title: 'Review & Confirm', icon: '✅' },
  ]

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        boxShadow: shadows.lg,
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: spacing.xl }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: `0 0 ${spacing.xs} 0` }}>
          Book Appointment
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
          for {petName} 🐾
        </p>
      </div>

      {/* Step Indicators */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.xl }}>
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: borderRadius.full,
                  backgroundColor:
                    currentStep >= step.number ? colors.primary[500] : '#e5e7eb',
                  color: currentStep >= step.number ? 'white' : '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  marginBottom: spacing.xs,
                  transition: 'all 0.3s',
                }}
              >
                {step.icon}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: currentStep === step.number ? 600 : 400,
                  color: currentStep === step.number ? colors.primary[700] : '#6b7280',
                  textAlign: 'center',
                }}
              >
                {step.title}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: currentStep > step.number ? colors.primary[500] : '#e5e7eb',
                  alignSelf: 'center',
                  marginTop: '-24px',
                  maxWidth: '80px',
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div style={{ minHeight: '400px' }}>
        {/* Step 1: Appointment Details */}
        {currentStep === 1 && (
          <div>
            <div style={{ marginBottom: spacing.lg }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: spacing.sm }}>
                Appointment Type *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.sm }}>
                {appointmentTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => updateFormData('appointment_type', type)}
                    style={{
                      padding: spacing.md,
                      borderRadius: borderRadius.md,
                      border: `2px solid ${formData.appointment_type === type ? colors.primary[500] : '#e5e7eb'}`,
                      backgroundColor: formData.appointment_type === type ? colors.primary[50] : 'white',
                      color: formData.appointment_type === type ? colors.primary[700] : '#374151',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                  >
                    {APPOINTMENT_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              {errors.appointment_type && (
                <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: spacing.xs }}>{errors.appointment_type}</p>
              )}
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: spacing.sm }}>
                Date and Time *
              </label>
              <input
                type="datetime-local"
                value={formData.appointment_date || ''}
                onChange={(e) => updateFormData('appointment_date', e.target.value)}
                style={{
                  width: '100%',
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  border: `1px solid ${errors.appointment_date ? '#dc2626' : '#d1d5db'}`,
                  fontSize: '0.875rem',
                }}
              />
              {errors.appointment_date && (
                <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: spacing.xs }}>{errors.appointment_date}</p>
              )}
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: spacing.sm }}>
                Purpose / Reason
              </label>
              <textarea
                value={formData.purpose || ''}
                onChange={(e) => updateFormData('purpose', e.target.value)}
                placeholder="Describe the reason for this appointment..."
                rows={3}
                style={{
                  width: '100%',
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>
        )}

        {/* Step 2: Clinic Information */}
        {currentStep === 2 && (
          <div>
            <div style={{ marginBottom: spacing.lg }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: spacing.sm }}>
                Clinic Name *
              </label>
              <input
                type="text"
                value={formData.clinic_name || ''}
                onChange={(e) => updateFormData('clinic_name', e.target.value)}
                placeholder="Enter clinic name"
                style={{
                  width: '100%',
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  border: `1px solid ${errors.clinic_name ? '#dc2626' : '#d1d5db'}`,
                  fontSize: '0.875rem',
                }}
              />
              {errors.clinic_name && (
                <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: spacing.xs }}>{errors.clinic_name}</p>
              )}
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: spacing.sm }}>
                Clinic Address
              </label>
              <input
                type="text"
                value={formData.clinic_address || ''}
                onChange={(e) => updateFormData('clinic_address', e.target.value)}
                placeholder="Enter clinic address"
                style={{
                  width: '100%',
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: spacing.sm }}>
                Clinic Phone
              </label>
              <input
                type="tel"
                value={formData.clinic_phone || ''}
                onChange={(e) => updateFormData('clinic_phone', e.target.value)}
                placeholder="(555) 123-4567"
                style={{
                  width: '100%',
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: spacing.sm }}>
                Veterinarian Name
              </label>
              <input
                type="text"
                value={formData.veterinarian || ''}
                onChange={(e) => updateFormData('veterinarian', e.target.value)}
                placeholder="Dr. Smith"
                style={{
                  width: '100%',
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {currentStep === 3 && (
          <div>
            <div
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: borderRadius.lg,
                padding: spacing.lg,
                marginBottom: spacing.lg,
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: spacing.md }}>
                Appointment Summary
              </h3>

              <div style={{ marginBottom: spacing.md }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: spacing.xs }}>Type</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                  {APPOINTMENT_TYPE_LABELS[formData.appointment_type as AppointmentType]}
                </div>
              </div>

              <div style={{ marginBottom: spacing.md }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: spacing.xs }}>Date & Time</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                  {formData.appointment_date &&
                    new Date(formData.appointment_date).toLocaleString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                </div>
              </div>

              {formData.purpose && (
                <div style={{ marginBottom: spacing.md }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: spacing.xs }}>Purpose</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>{formData.purpose}</div>
                </div>
              )}

              <div style={{ marginBottom: spacing.md }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: spacing.xs }}>Clinic</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>{formData.clinic_name}</div>
                {formData.clinic_address && (
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: spacing.xs }}>{formData.clinic_address}</div>
                )}
                {formData.clinic_phone && (
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: spacing.xs }}>{formData.clinic_phone}</div>
                )}
              </div>

              {formData.veterinarian && (
                <div style={{ marginBottom: spacing.md }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: spacing.xs }}>Veterinarian</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Dr. {formData.veterinarian}</div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: spacing.sm }}>
                Additional Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => updateFormData('notes', e.target.value)}
                placeholder="Any additional information..."
                rows={3}
                style={{
                  width: '100%',
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.xl }}>
        <button
          onClick={currentStep === 1 ? onCancel : handleBack}
          style={{
            padding: `${spacing.md} ${spacing.xl}`,
            borderRadius: borderRadius.md,
            border: '1px solid #d1d5db',
            backgroundColor: 'white',
            color: '#374151',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </button>
        <button
          onClick={currentStep === 3 ? handleSubmit : handleNext}
          style={{
            padding: `${spacing.md} ${spacing.xl}`,
            borderRadius: borderRadius.md,
            border: 'none',
            backgroundColor: colors.primary[500],
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {currentStep === 3 ? 'Confirm Appointment' : 'Next'}
        </button>
      </div>
    </div>
  )
}
