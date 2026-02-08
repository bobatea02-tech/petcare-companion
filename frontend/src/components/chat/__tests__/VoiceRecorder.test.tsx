import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { VoiceRecorder } from '../VoiceRecorder'

// Mock MediaRecorder
global.MediaRecorder = jest.fn().mockImplementation(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  state: 'inactive',
})) as any

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    }),
  },
  writable: true,
})

describe('VoiceRecorder', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders voice recorder button', () => {
    const onRecordingComplete = jest.fn()
    render(<VoiceRecorder onRecordingComplete={onRecordingComplete} />)
    
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument()
  })

  it('requests microphone permission on start', async () => {
    const onRecordingComplete = jest.fn()
    render(<VoiceRecorder onRecordingComplete={onRecordingComplete} />)
    
    const startButton = screen.getByRole('button', { name: /start recording/i })
    fireEvent.click(startButton)
    
    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true })
    })
  })

  it('shows recording state when active', async () => {
    const onRecordingComplete = jest.fn()
    render(<VoiceRecorder onRecordingComplete={onRecordingComplete} />)
    
    const startButton = screen.getByRole('button', { name: /start recording/i })
    fireEvent.click(startButton)
    
    await waitFor(() => {
      expect(screen.getByText(/recording/i)).toBeInTheDocument()
    })
  })

  it('stops recording and calls callback', async () => {
    const onRecordingComplete = jest.fn()
    render(<VoiceRecorder onRecordingComplete={onRecordingComplete} />)
    
    const startButton = screen.getByRole('button', { name: /start recording/i })
    fireEvent.click(startButton)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument()
    })
    
    const stopButton = screen.getByRole('button', { name: /stop recording/i })
    fireEvent.click(stopButton)
    
    await waitFor(() => {
      expect(onRecordingComplete).toHaveBeenCalled()
    })
  })
})
