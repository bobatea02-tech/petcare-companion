import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PetPhotoUpload } from '../PetPhotoUpload'

// Mock FileReader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  onloadend: jest.fn(),
  result: 'data:image/png;base64,mockbase64',
}

global.FileReader = jest.fn(() => mockFileReader) as any

describe('PetPhotoUpload', () => {
  const mockOnUpload = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders upload area with default state', () => {
    render(<PetPhotoUpload onUpload={mockOnUpload} />)
    
    expect(screen.getByText(/Upload pet photo/i)).toBeInTheDocument()
    expect(screen.getByText(/Drag and drop or click to browse/i)).toBeInTheDocument()
  })

  it('displays current photo when provided', () => {
    const currentPhotoUrl = 'https://example.com/pet.jpg'
    render(
      <PetPhotoUpload 
        onUpload={mockOnUpload} 
        currentPhotoUrl={currentPhotoUrl}
        petName="Max"
      />
    )
    
    const img = screen.getByAltText("Max's photo")
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', currentPhotoUrl)
  })

  it('validates file format', () => {
    render(<PetPhotoUpload onUpload={mockOnUpload} />)
    
    expect(screen.getByText(/PNG, JPG, WEBP, GIF up to 10MB/i)).toBeInTheDocument()
  })

  it('handles file drop', async () => {
    render(<PetPhotoUpload onUpload={mockOnUpload} />)
    
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const dropzone = screen.getByText(/Upload pet photo/i).closest('div')
    
    if (dropzone) {
      const input = dropzone.querySelector('input[type="file"]')
      if (input) {
        fireEvent.change(input, { target: { files: [file] } })
        
        await waitFor(() => {
          expect(mockOnUpload).toHaveBeenCalledWith(file)
        })
      }
    }
  })

  it('shows remove button when photo is uploaded', async () => {
    const currentPhotoUrl = 'https://example.com/pet.jpg'
    render(
      <PetPhotoUpload 
        onUpload={mockOnUpload} 
        currentPhotoUrl={currentPhotoUrl}
      />
    )
    
    expect(screen.getByText(/Remove Photo/i)).toBeInTheDocument()
    expect(screen.getByText(/Change Photo/i)).toBeInTheDocument()
  })

  it('displays photo tips', () => {
    render(<PetPhotoUpload onUpload={mockOnUpload} />)
    
    expect(screen.getByText(/Photo Tips/i)).toBeInTheDocument()
    expect(screen.getByText(/Use a clear, well-lit photo/i)).toBeInTheDocument()
  })
})
