import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PetTimeline } from '../PetTimeline'
import { TimelineEvent } from '@/types/pets'

const mockEvents: TimelineEvent[] = [
  {
    id: '1',
    pet_id: 'pet1',
    type: 'medication',
    title: 'Gave medication',
    description: 'Administered morning dose',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    pet_id: 'pet1',
    type: 'feeding',
    title: 'Fed breakfast',
    description: 'Dry food with chicken',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  },
  {
    id: '3',
    pet_id: 'pet1',
    type: 'checkup',
    title: 'Vet checkup',
    description: 'Annual wellness exam',
    timestamp: new Date(Date.now() - 604800000).toISOString(), // Last week
  },
  {
    id: '4',
    pet_id: 'pet1',
    type: 'vaccination',
    title: 'Rabies vaccine',
    timestamp: new Date(Date.now() - 2592000000).toISOString(), // Last month
  },
]

describe('PetTimeline', () => {
  it('renders all timeline events', () => {
    render(<PetTimeline events={mockEvents} />)
    
    expect(screen.getByText('Gave medication')).toBeInTheDocument()
    expect(screen.getByText('Fed breakfast')).toBeInTheDocument()
    expect(screen.getByText('Vet checkup')).toBeInTheDocument()
    expect(screen.getByText('Rabies vaccine')).toBeInTheDocument()
  })

  it('groups events by date', () => {
    render(<PetTimeline events={mockEvents} />)
    
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Yesterday')).toBeInTheDocument()
  })

  it('displays event descriptions when provided', () => {
    render(<PetTimeline events={mockEvents} />)
    
    expect(screen.getByText('Administered morning dose')).toBeInTheDocument()
    expect(screen.getByText('Dry food with chicken')).toBeInTheDocument()
  })

  it('renders filter buttons when showFilters is true', () => {
    render(<PetTimeline events={mockEvents} showFilters={true} />)
    
    expect(screen.getByText('All Activities')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Medication/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Feeding/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Checkup/i })).toBeInTheDocument()
  })

  it('filters events by type', () => {
    render(<PetTimeline events={mockEvents} showFilters={true} />)
    
    const medicationFilter = screen.getByRole('button', { name: /Medication/i })
    fireEvent.click(medicationFilter)
    
    expect(screen.getByText('Gave medication')).toBeInTheDocument()
    expect(screen.queryByText('Fed breakfast')).not.toBeInTheDocument()
  })

  it('shows all events when "All Activities" filter is selected', () => {
    render(<PetTimeline events={mockEvents} showFilters={true} />)
    
    const medicationFilter = screen.getByRole('button', { name: /Medication/i })
    fireEvent.click(medicationFilter)
    
    const allFilter = screen.getByText('All Activities')
    fireEvent.click(allFilter)
    
    expect(screen.getByText('Gave medication')).toBeInTheDocument()
    expect(screen.getByText('Fed breakfast')).toBeInTheDocument()
  })

  it('displays empty state when no events', () => {
    render(<PetTimeline events={[]} />)
    
    expect(screen.getByText(/No activities yet/i)).toBeInTheDocument()
  })

  it('displays filtered empty state', () => {
    render(<PetTimeline events={mockEvents} showFilters={true} />)
    
    const groomingFilter = screen.getByText('Grooming')
    fireEvent.click(groomingFilter)
    
    expect(screen.getByText(/No grooming activities/i)).toBeInTheDocument()
  })

  it('applies correct styling to event types', () => {
    const { container } = render(<PetTimeline events={mockEvents} />)
    
    const medicationIcon = container.querySelector('.bg-blue-500')
    expect(medicationIcon).toBeInTheDocument()
  })

  it('hides filters when showFilters is false', () => {
    render(<PetTimeline events={mockEvents} showFilters={false} />)
    
    expect(screen.queryByText('All Activities')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Medication/i })).not.toBeInTheDocument()
  })

  it('displays event timestamps', () => {
    render(<PetTimeline events={mockEvents} />)
    
    // Should display time in format like "10:30 AM"
    const timeElements = screen.getAllByText(/\d{1,2}:\d{2}\s[AP]M/i)
    expect(timeElements.length).toBeGreaterThan(0)
  })

  it('renders custom event icons when provided', () => {
    const eventsWithCustomIcon: TimelineEvent[] = [
      {
        id: '1',
        pet_id: 'pet1',
        type: 'activity',
        title: 'Walk in park',
        timestamp: new Date().toISOString(),
        icon: '🚶',
      },
    ]
    
    render(<PetTimeline events={eventsWithCustomIcon} />)
    
    expect(screen.getByText('🚶')).toBeInTheDocument()
  })
})
