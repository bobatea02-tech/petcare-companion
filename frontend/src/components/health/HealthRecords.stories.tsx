import type { Meta, StoryObj } from '@storybook/react'
import {
  DocumentUpload,
  HealthRecordTimeline,
  VaccinationCard,
  VaccinationList,
  SymptomLogger,
  HealthSummary,
  AIAssessmentCard,
  HealthRecordSearch,
} from './index'
import type {
  HealthRecord,
  Vaccination,
  AIAssessment,
  HealthSummary as HealthSummaryType,
} from '@/types/health'

// Mock data
const mockHealthRecords: HealthRecord[] = [
  {
    id: '1',
    pet_id: 'pet-123',
    record_date: '2024-02-01',
    record_type: 'checkup',
    description: 'Annual wellness exam',
    veterinarian: 'Dr. Sarah Johnson',
    diagnosis: 'Healthy, no concerns',
    treatment_plan: 'Continue current diet and exercise routine',
    created_at: '2024-02-01T10:00:00Z',
  },
  {
    id: '2',
    pet_id: 'pet-123',
    record_date: '2024-01-15',
    record_type: 'vaccination',
    description: 'Rabies vaccination',
    veterinarian: 'Dr. Sarah Johnson',
    created_at: '2024-01-15T14:30:00Z',
  },
  {
    id: '3',
    pet_id: 'pet-123',
    record_date: '2024-01-10',
    record_type: 'symptom',
    description: 'Vomiting and lethargy',
    veterinarian: 'Dr. Michael Chen',
    diagnosis: 'Gastroenteritis',
    treatment_plan: 'Prescribed antibiotics and bland diet',
    created_at: '2024-01-10T09:00:00Z',
  },
]

const mockVaccinations: Vaccination[] = [
  {
    id: '1',
    pet_id: 'pet-123',
    vaccine_name: 'Rabies',
    vaccine_type: 'Core',
    administered_date: '2024-01-15',
    expiration_date: '2027-01-15',
    veterinarian: 'Dr. Sarah Johnson',
    batch_number: 'RB-2024-001',
    next_due_date: '2027-01-15',
  },
  {
    id: '2',
    pet_id: 'pet-123',
    vaccine_name: 'DHPP',
    vaccine_type: 'Core',
    administered_date: '2024-01-15',
    expiration_date: '2025-01-15',
    veterinarian: 'Dr. Sarah Johnson',
    batch_number: 'DHPP-2024-002',
    next_due_date: '2025-01-15',
  },
]

const mockAIAssessment: AIAssessment = {
  id: '1',
  pet_id: 'pet-123',
  symptoms_reported: 'Vomiting, lethargy, loss of appetite',
  triage_level: 'yellow',
  ai_analysis:
    'Based on the reported symptoms, your pet may be experiencing gastrointestinal distress. The combination of vomiting and loss of appetite warrants veterinary attention.',
  recommendations:
    'Schedule a veterinary appointment within 24-48 hours. Monitor for additional symptoms such as diarrhea or fever. Ensure your pet stays hydrated.',
  model_used: 'GPT-4 Turbo',
  confidence_score: 0.87,
  created_at: '2024-02-05T09:30:00Z',
}

const mockHealthSummary: HealthSummaryType = {
  pet_id: 'pet-123',
  pet_name: 'Max',
  summary_date: '2024-02-07',
  recent_symptoms: [],
  recent_vaccinations: mockVaccinations,
  active_medications: [
    {
      id: '1',
      medication_name: 'Heartgard Plus',
      dosage: '1 tablet',
      frequency: 'Monthly',
      administration_instructions: 'Give with food',
    },
  ],
  recent_appointments: [
    {
      id: '1',
      appointment_date: '2024-02-01',
      purpose: 'Annual wellness exam',
      clinic_name: 'Happy Paws Veterinary Clinic',
      veterinarian: 'Dr. Sarah Johnson',
    },
  ],
  ai_insights:
    'Max is in excellent health overall. All vaccinations are up to date, and recent checkup showed no concerns. Continue current preventive care routine.',
  recommendations: [
    'Schedule next annual checkup in January 2025',
    'Continue monthly heartworm prevention',
    'Maintain current diet and exercise routine',
    'Monitor dental health and consider professional cleaning if needed',
  ],
}

// Stories
const meta: Meta = {
  title: 'Health/Components',
  parameters: {
    layout: 'padded',
  },
}

export default meta

export const DocumentUploadStory: StoryObj<typeof DocumentUpload> = {
  name: 'Document Upload',
  render: () => (
    <DocumentUpload
      petId="pet-123"
      onUploadComplete={(files) => console.log('Uploaded:', files)}
    />
  ),
}

export const HealthRecordTimelineStory: StoryObj<typeof HealthRecordTimeline> = {
  name: 'Health Record Timeline',
  render: () => (
    <HealthRecordTimeline
      records={mockHealthRecords}
      onRecordClick={(record) => console.log('Selected:', record)}
    />
  ),
}

export const VaccinationCardStory: StoryObj<typeof VaccinationCard> = {
  name: 'Vaccination Card',
  render: () => <VaccinationCard vaccination={mockVaccinations[0]} />,
}

export const VaccinationListStory: StoryObj<typeof VaccinationList> = {
  name: 'Vaccination List',
  render: () => <VaccinationList vaccinations={mockVaccinations} />,
}

export const SymptomLoggerStory: StoryObj<typeof SymptomLogger> = {
  name: 'Symptom Logger',
  render: () => (
    <SymptomLogger
      petId="pet-123"
      onSubmit={(data) => console.log('Submitted:', data)}
    />
  ),
}

export const HealthSummaryStory: StoryObj<typeof HealthSummary> = {
  name: 'Health Summary',
  render: () => (
    <HealthSummary
      summary={mockHealthSummary}
      onExport={(format) => console.log('Export:', format)}
    />
  ),
}

export const AIAssessmentCardStory: StoryObj<typeof AIAssessmentCard> = {
  name: 'AI Assessment Card',
  render: () => <AIAssessmentCard assessment={mockAIAssessment} />,
}

export const AIAssessmentGreenStory: StoryObj<typeof AIAssessmentCard> = {
  name: 'AI Assessment - Green (Low Priority)',
  render: () => (
    <AIAssessmentCard
      assessment={{
        ...mockAIAssessment,
        triage_level: 'green',
        symptoms_reported: 'Mild scratching, normal appetite',
        ai_analysis:
          'The symptoms appear to be minor and likely related to seasonal allergies or dry skin.',
        recommendations:
          'Monitor the scratching. If it persists or worsens, consider a vet visit. You can try a hypoallergenic shampoo.',
        confidence_score: 0.92,
      }}
    />
  ),
}

export const AIAssessmentRedStory: StoryObj<typeof AIAssessmentCard> = {
  name: 'AI Assessment - Red (High Priority)',
  render: () => (
    <AIAssessmentCard
      assessment={{
        ...mockAIAssessment,
        triage_level: 'red',
        symptoms_reported: 'Difficulty breathing, blue gums, collapse',
        ai_analysis:
          'URGENT: These symptoms indicate a potentially life-threatening emergency requiring immediate veterinary attention.',
        recommendations:
          'Seek emergency veterinary care IMMEDIATELY. Do not wait. Transport your pet to the nearest emergency clinic.',
        confidence_score: 0.95,
      }}
    />
  ),
}

export const HealthRecordSearchStory: StoryObj<typeof HealthRecordSearch> = {
  name: 'Health Record Search',
  render: () => (
    <HealthRecordSearch
      records={mockHealthRecords}
      onRecordSelect={(record) => console.log('Selected:', record)}
    />
  ),
}
