import type { Meta, StoryObj } from '@storybook/react'
import { MedicationCard } from './MedicationCard'
import { Medication } from '@/types/care'

const meta: Meta<typeof MedicationCard> = {
  title: 'Care/MedicationCard',
  component: MedicationCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof MedicationCard>

const mockMedication: Medication = {
  id: '1',
  pet_id: 'pet1',
  medication_name: 'Heartgard Plus',
  dosage: '1 tablet',
  frequency: 'Monthly',
  start_date: '2024-01-01',
  refill_threshold: 3,
  current_quantity: 8,
  administration_instructions: 'Give with food on the first of each month',
  active: true,
  created_at: '2024-01-01',
}

const lowQuantityMedication: Medication = {
  ...mockMedication,
  id: '2',
  medication_name: 'Apoquel',
  dosage: '16mg',
  frequency: 'Twice daily',
  current_quantity: 2,
  refill_threshold: 10,
}

export const Default: Story = {
  args: {
    medication: mockMedication,
    onLog: (id) => console.log('Log medication:', id),
    onViewDetails: (med) => console.log('View details:', med),
  },
}

export const NeedsRefill: Story = {
  args: {
    medication: lowQuantityMedication,
    onLog: (id) => console.log('Log medication:', id),
    onViewDetails: (med) => console.log('View details:', med),
  },
}

export const Loading: Story = {
  args: {
    medication: mockMedication,
    onLog: async (id) => {
      console.log('Log medication:', id)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    },
    onViewDetails: (med) => console.log('View details:', med),
  },
}
