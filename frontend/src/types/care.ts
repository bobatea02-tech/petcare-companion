/**
 * Type definitions for care tracking and medication management
 */

export interface Medication {
  id: string
  pet_id: string
  medication_name: string
  dosage: string
  frequency: string
  start_date: string
  end_date?: string
  refill_threshold: number
  current_quantity: number
  administration_instructions: string
  active: boolean
  created_at: string
}

export interface MedicationLog {
  id: string
  medication_id: string
  administered_at: string
  administered_by?: string
  notes?: string
}

export interface FeedingSchedule {
  id: string
  pet_id: string
  food_type: string
  amount: string
  frequency: string
  scheduled_times: string[]
  active: boolean
}

export interface FeedingLog {
  id: string
  pet_id: string
  food_type: string
  amount: string
  fed_at: string
  notes?: string
}

export interface CareTask {
  id: string
  pet_id: string
  task_type: 'medication' | 'feeding' | 'grooming' | 'exercise' | 'other'
  title: string
  description?: string
  scheduled_time: string
  completed: boolean
  completed_at?: string
}

export interface Reminder {
  id: string
  pet_id: string
  reminder_type: 'medication' | 'feeding' | 'appointment' | 'grooming'
  title: string
  message: string
  scheduled_time: string
  sent: boolean
  read: boolean
}
