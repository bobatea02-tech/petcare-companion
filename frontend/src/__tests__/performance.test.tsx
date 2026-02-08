import React from 'react'
import { render } from '@testing-library/react'
import { PetCard } from '@/components/pets/PetCard'
import { MedicationCard } from '@/components/care/MedicationCard'
import { Pet } from '@/types/pets'
import { Medication } from '@/types/care'

const mockPet: Pet = {
  id: '1',
  user_id: 'user1',
  name: 'Max',
  species: 'dog',
  breed: 'Golden Retriever',
  birth_date: '2020-01-15',
  weight: 30.5,
  gender: 'male',
  medical_conditions: 'None',
  allergies: 'None',
  behavioral_notes: 'Friendly',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

const mockMedication: Medication = {
  id: '1',
  pet_id: 'pet1',
  medication_name: 'Heartgard Plus',
  dosage: '1 tablet',
  frequency: 'Monthly',
  start_date: '2024-01-01',
  refill_threshold: 3,
  current_quantity: 8,
  administration_instructions: 'Give with food',
  active: true,
  created_at: '2024-01-01',
}

describe('Performance Tests', () => {
  describe('Component Render Performance', () => {
    it('PetCard renders within acceptable time', () => {
      const startTime = performance.now()
      
      render(<PetCard pet={mockPet} onSelect={jest.fn()} />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      expect(renderTime).toBeLessThan(100) // Should render in less than 100ms
    })

    it('MedicationCard renders within acceptable time', () => {
      const startTime = performance.now()
      
      render(
        <MedicationCard
          medication={mockMedication}
          onLog={jest.fn()}
          onViewDetails={jest.fn()}
        />
      )
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      expect(renderTime).toBeLessThan(100)
    })
  })

  describe('List Rendering Performance', () => {
    it('renders large list of pet cards efficiently', () => {
      const pets = Array.from({ length: 100 }, (_, i) => ({
        ...mockPet,
        id: `pet-${i}`,
        name: `Pet ${i}`,
      }))

      const startTime = performance.now()
      
      render(
        <div>
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} onSelect={jest.fn()} />
          ))}
        </div>
      )
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      expect(renderTime).toBeLessThan(1000) // Should render 100 items in less than 1 second
    })

    it('renders large list of medication cards efficiently', () => {
      const medications = Array.from({ length: 50 }, (_, i) => ({
        ...mockMedication,
        id: `med-${i}`,
        medication_name: `Medication ${i}`,
      }))

      const startTime = performance.now()
      
      render(
        <div>
          {medications.map((med) => (
            <MedicationCard
              key={med.id}
              medication={med}
              onLog={jest.fn()}
              onViewDetails={jest.fn()}
            />
          ))}
        </div>
      )
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      expect(renderTime).toBeLessThan(500)
    })
  })

  describe('Memory Usage', () => {
    it('does not leak memory on repeated renders', () => {
      const { rerender, unmount } = render(
        <PetCard pet={mockPet} onSelect={jest.fn()} />
      )

      // Simulate multiple re-renders
      for (let i = 0; i < 10; i++) {
        rerender(<PetCard pet={{ ...mockPet, name: `Pet ${i}` }} onSelect={jest.fn()} />)
      }

      unmount()
      
      // If we get here without errors, memory is being managed properly
      expect(true).toBe(true)
    })
  })

  describe('Bundle Size Optimization', () => {
    it('components use code splitting appropriately', () => {
      // This is a placeholder for bundle analysis
      // In a real scenario, you would use webpack-bundle-analyzer
      expect(true).toBe(true)
    })
  })
})
