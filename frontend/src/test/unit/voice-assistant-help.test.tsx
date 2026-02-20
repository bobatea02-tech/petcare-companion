/**
 * Unit Test: First-time activation help display
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Test that common voice command examples are shown on first activation
 * Requirements: 14.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VoiceAssistant } from '@/components/voice/VoiceAssistant';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock voice services
vi.mock('@/services/voice/wakeWordDetector', () => ({
  createWakeWordDetector: () => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    startListening: vi.fn(),
    stopListening: vi.fn(),
    isListening: vi.fn().mockReturnValue(false),
    onWakeWordDetected: vi.fn()
  })
}));

vi.mock('@/services/voice/voiceRecognitionEngine', () => ({
  createVoiceRecognitionEngine: () => ({
    startRecognition: vi.fn(),
    stopRecognition: vi.fn(),
    onInterimResult: vi.fn(),
    onFinalResult: vi.fn(),
    onError: vi.fn(),
    setLanguage: vi.fn(),
    setContinuous: vi.fn()
  })
}));

vi.mock('@/services/voice/intentParser', () => ({
  createIntentParser: () => ({
    parseIntent: vi.fn(),
    validateIntent: vi.fn(),
    extractEntities: vi.fn()
  })
}));

vi.mock('@/services/voice/contextManager', () => ({
  createContextManager: () => ({
    updateContext: vi.fn(),
    getContext: vi.fn().mockReturnValue({
      previousIntents: [],
      activePet: null,
      currentPage: '/',
      recentEntities: []
    }),
    setActivePet: vi.fn(),
    getActivePet: vi.fn(),
    addEntity: vi.fn(),
    clearContext: vi.fn(),
    getTurnCount: vi.fn().mockReturnValue(0)
  })
}));

vi.mock('@/services/voice/commandRouter', () => ({
  createCommandRouter: () => ({
    registerHandler: vi.fn(),
    executeCommand: vi.fn(),
    getAvailableCommands: vi.fn()
  })
}));

vi.mock('@/services/voice/responseComposer', () => ({
  createResponseComposer: () => ({
    composeResponse: vi.fn(),
    composeErrorResponse: vi.fn(),
    composeConfirmation: vi.fn(),
    composeClarification: vi.fn()
  })
}));

vi.mock('@/services/voice/audioFeedbackController', () => ({
  createAudioFeedbackController: () => ({
    showListening: vi.fn(),
    showProcessing: vi.fn(),
    showSpeaking: vi.fn(),
    showIdle: vi.fn(),
    updateWaveform: vi.fn(),
    playFeedbackSound: vi.fn(),
    animateAvatar: vi.fn(),
    cleanup: vi.fn(),
    onStateChange: vi.fn(() => () => {}),
    onWaveformUpdate: vi.fn(() => () => {})
  }),
  AvatarState: {
    IDLE: 'idle',
    LISTENING: 'listening',
    THINKING: 'thinking',
    SPEAKING: 'speaking'
  }
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

describe('VoiceAssistant - First-time activation help display', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should display common voice command examples when showFirstTimeHelp is true', () => {
    // Render component with first-time help enabled
    render(
      <TooltipProvider>
        <VoiceAssistant isExpanded={true} showFirstTimeHelp={true} />
      </TooltipProvider>
    );

    // Verify help panel is displayed
    expect(screen.getByText('Common Voice Commands:')).toBeInTheDocument();

    // Verify common command examples are shown
    expect(screen.getByText(/Show me my pets/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule a vet appointment/i)).toBeInTheDocument();
    expect(screen.getByText(/Log feeding for/i)).toBeInTheDocument();
    expect(screen.getByText(/What medications does/i)).toBeInTheDocument();
    expect(screen.getByText(/Show health records/i)).toBeInTheDocument();
    expect(screen.getByText(/Go to appointments/i)).toBeInTheDocument();
  });

  it('should not display help panel when showFirstTimeHelp is false', () => {
    // Render component without first-time help
    render(
      <TooltipProvider>
        <VoiceAssistant isExpanded={true} showFirstTimeHelp={false} />
      </TooltipProvider>
    );

    // Verify help panel is not displayed
    expect(screen.queryByText('Common Voice Commands:')).not.toBeInTheDocument();
  });

  it('should display help panel by default when showFirstTimeHelp is not specified', () => {
    // Render component without specifying showFirstTimeHelp (defaults to false)
    render(
      <TooltipProvider>
        <VoiceAssistant isExpanded={true} />
      </TooltipProvider>
    );

    // Verify help panel is not displayed by default
    expect(screen.queryByText('Common Voice Commands:')).not.toBeInTheDocument();
  });

  it('should display all required command examples', () => {
    // Render component with first-time help
    render(
      <TooltipProvider>
        <VoiceAssistant isExpanded={true} showFirstTimeHelp={true} />
      </TooltipProvider>
    );

    // List of required command examples
    const requiredExamples = [
      'Show me my pets',
      'Schedule a vet appointment',
      'Log feeding for [pet name]',
      'What medications does [pet name] need today?',
      'Show health records',
      'Go to appointments'
    ];

    // Verify each example is present
    requiredExamples.forEach(example => {
      // Use a more flexible matcher that handles the bullet points
      const regex = new RegExp(example.replace(/[[\]]/g, '\\$&'), 'i');
      expect(screen.getByText(regex)).toBeInTheDocument();
    });
  });

  it('should format command examples as a list', () => {
    // Render component with first-time help
    render(
      <TooltipProvider>
        <VoiceAssistant isExpanded={true} showFirstTimeHelp={true} />
      </TooltipProvider>
    );

    // Verify the help panel contains a list
    const helpPanel = screen.getByText('Common Voice Commands:').closest('div');
    expect(helpPanel).toBeInTheDocument();
    
    // Verify list structure exists
    const list = helpPanel?.querySelector('ul');
    expect(list).toBeInTheDocument();
    
    // Verify list items exist
    const listItems = list?.querySelectorAll('li');
    expect(listItems).toBeDefined();
    expect(listItems!.length).toBeGreaterThan(0);
  });
});
