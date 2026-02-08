import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PetCard } from '../PetCard'
import { Pet } from '@/types/pets'

const mockPet: Pet = {
  id: '1',
  user_id: 'user1',
  name: 'Max',
  species: 'dog',
  breed: 'Golden Retriever',
  birth_date: '2020-01-15',
  age_years: 4,
  weight: 30.5,
  gender: 'male',
  medical_conditions: 'Arthritis',
  allergies: 'Chicken',
  behavioral_notes: 'Friendly',
  is_active: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  health_status: 'good',
  last_checkup: '2024-01-15',
}

describe('PetCard', () => {
  it('renders pet information correctly', () => {
    const onClick = jest.fn()
    render(<PetCard pet={mockPet} onClick={onClick} />)
    
    expect(screen.getByText('Max')).toBeInTheDocument()
    expect(screen.getByText(/Golden Retriever/i)).toBeInTheDocument()
  })

  it('displays pet age correctly', () => {
    const onClick = jest.fn()
    render(<PetCard pet={mockPet} onClick={onClick} />)
    
    expect(screen.getByText(/4 years/i)).toBeInTheDocument()
  })

  it('displays singular year for 1 year old pet', () => {
    const youngPet = { ...mockPet, age_years: 1 }
    const onClick = jest.fn()
    render(<PetCard pet={youngPet} onClick={onClick} />)
    
    expect(screen.getByText(/1 year/i)).toBeInTheDocument()
  })

  it('calls onClick when card is clicked', () => {
    const onClick = jest.fn()
    render(<PetCard pet={mockPet} onClick={onClick} />)
    
    const card = screen.getByText('Max').closest('div[class*="cursor-pointer"]')
    if (card) {
      fireEvent.click(card)
      expect(onClick).toHaveBeenCalled()
    }
  })

  it('displays health status when showHealthStatus is true', () => {
    const onClick = jest.fn()
    render(<PetCard pet={mockPet} onClick={onClick} showHealthStatus={true} />)
    
    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  it('hides health status when showHealthStatus is false', () => {
    const onClick = jest.fn()
    render(<PetCard pet={mockPet} onClick={onClick} showHealthStatus={false} />)
    
    expect(screen.queryByText('Good')).not.toBeInTheDocument()
  })

  it('displays weight when provided', () => {
    const onClick = jest.fn()
    render(<PetCard pet={mockPet} onClick={onClick} />)
    
    expect(screen.getByText(/30.5 lbs/i)).toBeInTheDocument()
  })

  it('displays last checkup date when provided', () => {
    const onClick = jest.fn()
    render(<PetCard pet={mockPet} onClick={onClick} />)
    
    expect(screen.getByText(/2024-01-15/i)).toBeInTheDocument()
  })

  it('displays gender icon', () => {
    const onClick = jest.fn()
    render(<PetCard pet={mockPet} onClick={onClick} />)
    
    expect(screen.getByText('♂️')).toBeInTheDocument()
  })

  it('shows medical condition alert', () => {
    const onClick = jest.fn()
    render(<PetCard pet={mockPet} onClick={onClick} />)
    
    expect(screen.getByText(/Conditions/i)).toBeInTheDocument()
  })

  it('shows allergy alert', () => {
    const onClick = jest.fn()
    render(<PetCard pet={mockPet} onClick={onClick} />)
    
    expect(screen.getByText(/Allergies/i)).toBeInTheDocument()
  })

  it('applies species-specific theme', () => {
    const onClick = jest.fn()
    const { container } = render(<PetCard pet={mockPet} onClick={onClick} />)
    
    expect(container.querySelector('.from-amber-100')).toBeInTheDocument()
  })

  it('displays species icon when no photo', () => {
    const onClick = jest.fn()
    render(<PetCard pet={mockPet} onClick={onClick} />)
    
    expect(screen.getByText('🐕')).toBeInTheDocument()
  })

  it('applies pulse animation for needs-attention health status', () => {
    const urgentPet = { ...mockPet, health_status: 'needs-attention' as const }
    const onClick = jest.fn()
    const { container } = render(<PetCard pet={urgentPet} onClick={onClick} />)
    
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('handles missing optional fields gracefully', () => {
    const minimalPet: Pet = {
      id: '2',
      user_id: 'user1',
      name: 'Buddy',
      species: 'cat',
      birth_date: '2021-05-10',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    }
    const onClick = jest.fn()
    
    render(<PetCard pet={minimalPet} onClick={onClick} />)
    
    expect(screen.getByText('Buddy')).toBeInTheDocument()
    expect(screen.getByText(/cat/i)).toBeInTheDocument()
  })
})
