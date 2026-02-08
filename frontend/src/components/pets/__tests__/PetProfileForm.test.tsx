import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PetProfileForm } from '../PetProfileForm'

describe('PetProfileForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all form fields', () => {
    render(<PetProfileForm onSubmit={mockOnSubmit} />)
    
    expect(screen.getByLabelText(/Pet Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Species/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Breed/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Birth Date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Gender/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Weight/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<PetProfileForm onSubmit={mockOnSubmit} />)
    
    const submitButton = screen.getByRole('button', { name: /Create Profile/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Name must be at least 2 characters/i)).toBeInTheDocument()
    })
    
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('submits valid form data', async () => {
    mockOnSubmit.mockResolvedValue(undefined)
    
    render(<PetProfileForm onSubmit={mockOnSubmit} />)
    
    fireEvent.change(screen.getByLabelText(/Pet Name/i), {
      target: { value: 'Max' }
    })
    
    const speciesSelect = screen.getByLabelText(/Species/i)
    fireEvent.change(speciesSelect, { target: { value: 'dog' } })
    
    const birthDateInput = screen.getByLabelText(/Birth Date/i)
    fireEvent.change(birthDateInput, { target: { value: '2020-01-15' } })
    
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Create Profile/i })
      expect(submitButton).not.toBeDisabled()
    })
    
    const submitButton = screen.getByRole('button', { name: /Create Profile/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Max',
          species: 'dog',
          birth_date: '2020-01-15'
        }),
        undefined
      )
    })
  })

  it('displays validation errors inline', async () => {
    render(<PetProfileForm onSubmit={mockOnSubmit} />)
    
    const nameInput = screen.getByLabelText(/Pet Name/i)
    fireEvent.change(nameInput, { target: { value: 'A' } })
    fireEvent.blur(nameInput)
    
    await waitFor(() => {
      expect(screen.getByText(/Name must be at least 2 characters/i)).toBeInTheDocument()
    })
  })

  it('populates form with initial data in edit mode', () => {
    const initialData = {
      name: 'Max',
      species: 'dog' as const,
      breed: 'Golden Retriever',
      birth_date: '2020-01-15',
      weight: 30.5,
      gender: 'male' as const,
    }
    
    render(
      <PetProfileForm 
        onSubmit={mockOnSubmit} 
        initialData={initialData}
        isEditing={true}
      />
    )
    
    expect(screen.getByDisplayValue('Max')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Golden Retriever')).toBeInTheDocument()
    expect(screen.getByDisplayValue('30.5')).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <PetProfileForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
      />
    )
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    fireEvent.click(cancelButton)
    
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('validates weight is positive', async () => {
    render(<PetProfileForm onSubmit={mockOnSubmit} />)
    
    const weightInput = screen.getByLabelText(/Weight/i)
    fireEvent.change(weightInput, { target: { value: '-5' } })
    fireEvent.blur(weightInput)
    
    await waitFor(() => {
      expect(screen.getByText(/Weight must be positive/i)).toBeInTheDocument()
    })
  })

  it('validates text field max length', async () => {
    render(<PetProfileForm onSubmit={mockOnSubmit} />)
    
    const longText = 'a'.repeat(1001)
    const medicalConditionsField = screen.getByPlaceholderText(/List any medical conditions/i)
    fireEvent.change(medicalConditionsField, { target: { value: longText } })
    fireEvent.blur(medicalConditionsField)
    
    await waitFor(() => {
      expect(screen.getByText(/Text is too long/i)).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<PetProfileForm onSubmit={mockOnSubmit} />)
    
    fireEvent.change(screen.getByLabelText(/Pet Name/i), {
      target: { value: 'Max' }
    })
    fireEvent.change(screen.getByLabelText(/Species/i), {
      target: { value: 'dog' }
    })
    fireEvent.change(screen.getByLabelText(/Birth Date/i), {
      target: { value: '2020-01-15' }
    })
    
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Create Profile/i })
      expect(submitButton).not.toBeDisabled()
    })
    
    const submitButton = screen.getByRole('button', { name: /Create Profile/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Saving.../i)).toBeInTheDocument()
    })
  })

  it('displays all species options', () => {
    render(<PetProfileForm onSubmit={mockOnSubmit} />)
    
    const speciesSelect = screen.getByLabelText(/Species/i)
    const options = speciesSelect.querySelectorAll('option')
    
    expect(options.length).toBeGreaterThan(1)
    expect(Array.from(options).some(opt => opt.textContent?.includes('Dog'))).toBe(true)
    expect(Array.from(options).some(opt => opt.textContent?.includes('Cat'))).toBe(true)
  })
})
