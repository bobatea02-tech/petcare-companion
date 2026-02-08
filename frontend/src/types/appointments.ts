/**
 * Type definitions for appointments and vet clinic management
 */

export interface Appointment {
  id: string
  pet_id: string
  ai_assessment_id?: string
  appointment_date: string
  appointment_type: AppointmentType
  purpose?: string
  clinic_name: string
  clinic_address?: string
  clinic_phone?: string
  veterinarian?: string
  status: AppointmentStatus
  notes?: string
  reminder_sent_24h: boolean
  reminder_sent_2h: boolean
  created_at: string
  updated_at: string
  is_upcoming: boolean
  is_past: boolean
  hours_until_appointment?: number
}

export interface VetClinic {
  id: string
  name: string
  address: string
  phone_number: string
  email?: string
  website?: string
  latitude?: number
  longitude?: number
  is_emergency: boolean
  is_24_hour: boolean
  services_offered?: string
  operating_hours?: string
  created_at: string
  updated_at: string
  distance_miles?: number
  rating?: number
}

export interface AppointmentCreate {
  appointment_date: string
  appointment_type: string
  purpose?: string
  clinic_name: string
  clinic_address?: string
  clinic_phone?: string
  veterinarian?: string
  notes?: string
}

export interface AppointmentUpdate {
  appointment_date?: string
  appointment_type?: string
  purpose?: string
  clinic_name?: string
  clinic_address?: string
  clinic_phone?: string
  veterinarian?: string
  status?: AppointmentStatus
  notes?: string
}

export interface EmergencyVetSearchParams {
  latitude: number
  longitude: number
  radius_miles?: number
  emergency_only?: boolean
  twenty_four_hour_only?: boolean
}

export type AppointmentType = 
  | 'checkup'
  | 'emergency'
  | 'vaccination'
  | 'surgery'
  | 'dental'
  | 'grooming'
  | 'consultation'
  | 'follow_up'
  | 'diagnostic'
  | 'treatment'

export type AppointmentStatus = 
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'
  | 'no_show'

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  checkup: 'Check-up',
  emergency: 'Emergency',
  vaccination: 'Vaccination',
  surgery: 'Surgery',
  dental: 'Dental',
  grooming: 'Grooming',
  consultation: 'Consultation',
  follow_up: 'Follow-up',
  diagnostic: 'Diagnostic',
  treatment: 'Treatment',
}

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
  no_show: 'No Show',
}
