import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Toast } from '../Toast'

describe('Toast', () => {
  it('renders toast with message', () => {
    const onClose = jest.fn()
    render(
      <Toast
        message="Test notification"
        type="info"
        onClose={onClose}
      />
    )
    
    expect(screen.getByText('Test notification')).toBeInTheDocument()
  })

  it('applies correct styling for success type', () => {
    const onClose = jest.fn()
    const { container } = render(
      <Toast
        message="Success message"
        type="success"
        onClose={onClose}
      />
    )
    
    expect(container.querySelector('.toast-success')).toBeInTheDocument()
  })

  it('applies correct styling for error type', () => {
    const onClose = jest.fn()
    const { container } = render(
      <Toast
        message="Error message"
        type="error"
        onClose={onClose}
      />
    )
    
    expect(container.querySelector('.toast-error')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(
      <Toast
        message="Test notification"
        type="info"
        onClose={onClose}
      />
    )
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalled()
  })

  it('auto-dismisses after duration', async () => {
    jest.useFakeTimers()
    const onClose = jest.fn()
    
    render(
      <Toast
        message="Auto-dismiss test"
        type="info"
        onClose={onClose}
        duration={3000}
      />
    )
    
    jest.advanceTimersByTime(3000)
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
    
    jest.useRealTimers()
  })

  it('shows pet-themed icon', () => {
    const onClose = jest.fn()
    render(
      <Toast
        message="Pet notification"
        type="info"
        onClose={onClose}
        icon="paw"
      />
    )
    
    expect(screen.getByTestId('paw-icon')).toBeInTheDocument()
  })
})
