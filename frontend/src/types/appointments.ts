/**
 * TypeScript types for appointment system
 */

export interface Appointment {
  id: string;
  pet_id: string;
  ai_assessment_id?: string;
  appointment_date: string;
  appointment_type: AppointmentType;
  purpose: string;
  clinic_name: string;
  clinic_address?: string;
  clinic_phone?: string;
  veterinarian?: string;
  status: AppointmentStatus;
  notes?: string;
  reminder_sent_24h?: boolean;
  reminder_sent_2h?: boolean;
  created_at: string;
  updated_at: string;
  is_upcoming: boolean;
  is_past: boolean;
  hours_until_appointment?: number;
}

export type AppointmentType =
  | 'checkup'
  | 'vaccination'
  | 'surgery'
  | 'dental'
  | 'grooming'
  | 'emergency'
  | 'follow-up'
  | 'consultation';

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';

export interface AppointmentCreate {
  appointment_date: string;
  appointment_type: AppointmentType;
  purpose: string;
  clinic_name: string;
  clinic_address?: string;
  clinic_phone?: string;
  veterinarian?: string;
  notes?: string;
}

export interface AppointmentUpdate {
  appointment_date?: string;
  appointment_type?: AppointmentType;
  purpose?: string;
  clinic_name?: string;
  clinic_address?: string;
  clinic_phone?: string;
  veterinarian?: string;
  notes?: string;
  status?: AppointmentStatus;
}

export interface AppointmentListResponse {
  appointments: Appointment[];
  total_count: number;
  upcoming_count: number;
  past_count: number;
}

export interface AppointmentHistoryResponse {
  pet_id: string;
  pet_name: string;
  appointments: Appointment[];
  total_appointments: number;
  upcoming_appointments: number;
  last_appointment_date?: string;
  next_appointment_date?: string;
}

export interface VetClinic {
  id: string;
  name: string;
  address: string;
  phone_number: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  is_emergency: boolean;
  is_24_hour: boolean;
  services_offered?: string[];
  operating_hours?: Record<string, string>;
  created_at: string;
  updated_at: string;
  distance_miles?: number;
}

export interface VetClinicCreate {
  name: string;
  address: string;
  phone_number: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  is_emergency?: boolean;
  is_24_hour?: boolean;
  services_offered?: string[];
  operating_hours?: Record<string, string>;
}

export interface VetClinicListResponse {
  clinics: VetClinic[];
  total_count: number;
  emergency_count: number;
  twenty_four_hour_count: number;
}

export interface EmergencyVetSearchRequest {
  latitude: number;
  longitude: number;
  radius_miles?: number;
  emergency_only?: boolean;
  twenty_four_hour_only?: boolean;
}

export interface EmergencyVetSearchResponse {
  clinics: VetClinic[];
  search_location: {
    latitude: number;
    longitude: number;
  };
  search_radius_miles: number;
  total_found: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description: string;
  location?: string;
  type: 'appointment' | 'reminder';
  appointment?: Appointment;
}
