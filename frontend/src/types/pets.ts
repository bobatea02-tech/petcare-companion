/**
 * Type definitions for pet profiles and management
 */

export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'guinea pig' | 'ferret' | 'fish' | 'reptile' | 'other'

export type HealthStatus = 'excellent' | 'good' | 'fair' | 'needs-attention'

export type Gender = 'male' | 'female' | 'unknown'

export interface Pet {
  id: string
  user_id: string
  name: string
  species: PetSpecies
  breed?: string
  birth_date: string
  weight?: number
  gender?: Gender
  medical_conditions?: string
  allergies?: string
  behavioral_notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  age_years?: number
  age_months?: number
  photo_url?: string
  health_status?: HealthStatus
  last_checkup?: string
}

export interface PetCreate {
  name: string
  species: PetSpecies
  birth_date: string
  breed?: string
  weight?: number
  gender?: Gender
  medical_conditions?: string
  allergies?: string
  behavioral_notes?: string
}

export interface PetUpdate {
  name?: string
  species?: PetSpecies
  birth_date?: string
  breed?: string
  weight?: number
  gender?: Gender
  medical_conditions?: string
  allergies?: string
  behavioral_notes?: string
  is_active?: boolean
}

export interface PetListResponse {
  pets: Pet[]
  total_count: number
  active_count: number
}

export interface TimelineEvent {
  id: string
  pet_id: string
  type: 'medication' | 'feeding' | 'checkup' | 'vaccination' | 'activity' | 'grooming'
  title: string
  description?: string
  timestamp: string
  icon?: string
}

export interface PetActivity {
  id: string
  pet_id: string
  activity_type: string
  description: string
  occurred_at: string
  metadata?: Record<string, any>
}
