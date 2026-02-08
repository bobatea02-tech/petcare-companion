import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MedicationCard } from '../MedicationCard'
import { Medication } from '@/types/care'

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

describe('MedicationCard', () => {
  it('renders medication information correctly', () => {
    const onLog = jest.fn()
    const onViewDetails = jest.fn()

    render(
      <MedicationCard
        medication={mockMedication}
        onLog={onLog}
        onViewDetails={onViewDetails}
      />
    )

    expect(screen.getByText('Heartgard Plus')).toBeInTheDocument()
    expect(screen.getByText(/1 tablet/)).toBeInTheDocument()
    expect(screen.getByText(/Monthly/)).toBeInTheDocument()
    expect(screen.getByText(/8 doses/)).toBeInTheDocument()
  })

  it('calls onLog when Log Dose button is clicked', async () => {
    const onLog = jest.fn()
    const onViewDetails = jest.fn()

    render(
      <MedicationCard
        medication={mockMedication}
        onLog={onLog}
        onViewDetails={onViewDetails}
      />
    )

    const logButton = screen.getByText('Log Dose')
    fireEvent.click(logButton)

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('1')
    })
  })

  it('calls onViewDetails when Details button is clicked', () => {
    const onLog = jest.fn()
    const onViewDetails = jest.fn()

    render(
      <MedicationCard
        medication={mockMedication}
        onLog={onLog}
        onViewDetails={onViewDetails}
      />
    )

    const detailsButton = screen.getByText('Details')
    fireEvent.click(detailsButton)

    expect(onViewDetails).toHaveBeenCalledWith(mockMedication)
  })

  it('shows refill alert when quantity is low', () => {
    const lowQuantityMedication = {
      ...mockMedication,
      current_quantity: 2,
    }

    const onLog = jest.fn()
    const onViewDetails = jest.fn()

    render(
      <MedicationCard
        medication={lowQuantityMedication}
        onLog={onLog}
        onViewDetails={onViewDetails}
      />
    )

    expect(screen.getByText('Refill Needed')).toBeInTheDocument()
  })

  it('displays progress bar with correct quantity', () => {
    const onLog = jest.fn()
    const onViewDetails = jest.fn()

    render(
      <MedicationCard
        medication={mockMedication}
        onLog={onLog}
        onViewDetails={onViewDetails}
      />
    )

    expect(screen.getByText('Quantity Remaining')).toBeInTheDocument()
  })
})
