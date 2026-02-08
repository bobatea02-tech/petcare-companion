/**
 * Type definitions for health records and document management
 */

export interface HealthRecord {
  id: string
  pet_id: string
  record_date: string
  record_type: 'symptom' | 'vaccination' | 'checkup' | 'surgery' | 'lab_result' | 'other'
  description: string
  veterinarian?: string
  diagnosis?: string
  treatment_plan?: string
  created_at: string
}

export interface SymptomLog {
  id: string
  pet_id: string
  health_record_id?: string
  symptoms: string[]
  body_parts: string[]
  severity: 'mild' | 'moderate' | 'severe'
  notes?: string
  logged_at: string
}

export interface Vaccination {
  id: string
  pet_id: string
  health_record_id?: string
  vaccine_name: string
  vaccine_type: string
  administered_date: string
  expiration_date?: string
  veterinarian?: string
  batch_number?: string
  next_due_date?: string
}

export interface AIAssessment {
  id: string
  pet_id: string
  health_record_id?: string
  symptoms_reported: string
  triage_level: 'green' | 'yellow' | 'red'
  ai_analysis: string
  recommendations: string
  model_used: string
  confidence_score: number
  created_at: string
}

export interface Document {
  id: string
  pet_id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  document_type: 'medical_record' | 'vaccination_certificate' | 'lab_result' | 'prescription' | 'photo' | 'other'
  tags: string[]
  uploaded_at: string
  extracted_data?: Record<string, any>
}

export interface HealthSummary {
  pet_id: string
  pet_name: string
  summary_date: string
  recent_symptoms: SymptomLog[]
  recent_vaccinations: Vaccination[]
  active_medications: any[]
  recent_appointments: any[]
  ai_insights: string
  recommendations: string[]
}

export type DocumentCategory = 
  | 'medical_record'
  | 'vaccination_certificate'
  | 'lab_result'
  | 'prescription'
  | 'photo'
  | 'other'

export type RecordType = 
  | 'symptom'
  | 'vaccination'
  | 'checkup'
  | 'surgery'
  | 'lab_result'
  | 'other'

export type TriageLevel = 'green' | 'yellow' | 'red'

export type SeverityLevel = 'mild' | 'moderate' | 'severe'
