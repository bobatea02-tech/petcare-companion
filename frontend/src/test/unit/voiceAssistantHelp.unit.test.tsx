/**
 * Unit Test: First-Time Activation Help Display
 * 
 * Feature: jojo-voice-assistant-enhanced
 * 
 * **Validates: Requirements 14.1**
 * 
 * Test that common voice command examples are shown on first activation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { VoiceAssistant } from '@/components/voice/VoiceAssistant';
import '@testing-library/jest-dom';

// Mock the voice services
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
    setLanguage: vi.fn(),
    setContinuous: vi.fn(),
    onInterimResult: vi.fn(),
    onFinalResult: vi.fn(),
    onError: vi.fn()
  })
}));

vi.mock('@/services/voice/intentParser', () => ({
  createIntentParser: () => ({
    parseIntent: vi.fn().mockResolvedValue({
      intentId: 'test',
      action: 'QUERY',
      target: 'pets',
      parameters: {},
      confidence: 0.9,
      requiresConfirmation: false,
      priority: 'normal',
      entities: [],
      ambiguities: []
    })
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
    executeCommand: vi.fn().mockResolvedValue({
      success: true,
      data: {},
      message: 'Command executed',
      visualComponent: null,
      requiresFollowUp: false,
      followUpPrompt: null
    }),
    getAvailableCommands: vi.fn().mockReturnValue([])
  })
}));

vi.mock('@/services/voice/responseComposer', () => ({
  createResponseComposer: () => ({
    composeResponse: vi.fn().mockReturnValue({
      text: 'Response text',
      displayText: 'Response text',
      visualData: null,
      audioUrl: null,
      priority: 'normal'
    }),
    composeErrorResponse: vi.fn().mockReturnValue({
      text: 'Error occurred',
      displayText: 'Error occurred',
      visualData: null,
      audioUrl: null,
      priority: 'normal'
    }),
    composeConfirmation: vi.fn().mockReturnValue({
      text: 'Please confirm',
      displayText: 'Please confirm',
      visualData: null,
      audioUrl: null,
      priority: 'normal'
    }),
    composeClarification: vi.fn().mockReturnValue({
      text: 'Please clarify',
      displayText: 'Please clarify',
      visualData: null,
      audioUrl: null,
      priority: 'normal'
    })
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
    cleanup: vi.fn()
  }),
  AvatarState: {
    IDLE: 'idle',
    LISTENING: 'listening',
    THINKING: 'thinking',
    SPEAKING: 'speaking'
  }
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

describe('First-Time Activation Help Display', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should display common voice command examples when showFirstTimeHelp is true', async () => {
    // Render VoiceAssistant with showFirstTimeHelp enabled and expanded
    render(<VoiceAssistant isExpanded={true} showFirstTimeHelp={true} />);

    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByText('JoJo Voice Assistant')).toBeInTheDocument();
    });

    // Verify that help panel is visible
    await waitFor(() => {
      expect(screen.getByText('Common Voice Commands:')).toBeInTheDocument();
    });

    // Verify that common command examples are displayed
    const commandExamples = [
      'Show me my pets',
      'Schedule a vet appointment',
      'Log feeding for [pet name]',
      'What medications does [pet name] need today?',
      'Show health records',
      'Go to appointments'
    ];

    for (const example of commandExamples) {
      await waitFor(() => {
        expect(screen.getByText(new RegExp(example.replace(/\[/g, '\\[').replace(/\]/g, '\\]')))).toBeInTheDocument();
      });
    }
  });

  it('should not display help panel when showFirstTimeHelp is false', async () => {
    // Render VoiceAssistant without showFirstTimeHelp
    render(<VoiceAssistant isExpanded={true} showFirstTimeHelp={false} />);

    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByText('JoJo Voice Assistant')).toBeInTheDocument();
    });

    // Verify that help panel is not visible by default
    expect(screen.queryByText('Common Voice Commands:')).not.toBeInTheDocument();
  });

  it('should display all six common voice command examples', async () => {
    // Render VoiceAssistant with help enabled
    render(<VoiceAssistant isExpanded={true} showFirstTimeHelp={true} />);

    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByText('Common Voice Commands:')).toBeInTheDocument();
    });

    // Count the number of command examples displayed
    const helpPanel = screen.getByText('Common Voice Commands:').closest('div');
    expect(helpPanel).toBeInTheDocument();

    // Verify all six examples are present
    const examples = [
      /Show me my pets/,
      /Schedule a vet appointment/,
      /Log feeding for \[pet name\]/,
      /What medications does \[pet name\] need today\?/,
      /Show health records/,
      /Go to appointments/
    ];

    for (const exampleRegex of examples) {
      expect(screen.getByText(exampleRegex)).toBeInTheDocument();
    }
  });

  it('should format command examples as a bulleted list', async () => {
    // Render VoiceAssistant with help enabled
    render(<VoiceAssistant isExpanded={true} showFirstTimeHelp={true} />);

    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByText('Common Voice Commands:')).toBeInTheDocument();
    });

    // Verify that examples are in a list format (checking for bullet points)
    const helpPanel = screen.getByText('Common Voice Commands:').closest('div');
    const listItems = helpPanel?.querySelectorAll('li');
    
    // Should have 6 list items (one for each command example)
    expect(listItems).toHaveLength(6);
  });

  it('should display help panel in a visually distinct container', async () => {
    // Render VoiceAssistant with help enabled
    render(<VoiceAssistant isExpanded={true} showFirstTimeHelp={true} />);

    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByText('Common Voice Commands:')).toBeInTheDocument();
    });

    // Verify that help panel has appropriate styling
    const helpPanel = screen.getByText('Common Voice Commands:').closest('div');
    expect(helpPanel).toHaveClass('bg-muted');
    expect(helpPanel).toHaveClass('rounded-lg');
  });

  it('should show help panel when component is expanded', async () => {
    // Render VoiceAssistant expanded with help
    render(<VoiceAssistant isExpanded={true} showFirstTimeHelp={true} />);

    // Wait for component to initialize and expand
    await waitFor(() => {
      expect(screen.getByText('JoJo Voice Assistant')).toBeInTheDocument();
    });

    // Verify help panel is visible
    await waitFor(() => {
      expect(screen.getByText('Common Voice Commands:')).toBeInTheDocument();
    });
  });

  it('should include navigation commands in examples', async () => {
    // Render VoiceAssistant with help enabled
    render(<VoiceAssistant isExpanded={true} showFirstTimeHelp={true} />);

    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByText('Common Voice Commands:')).toBeInTheDocument();
    });

    // Verify navigation commands are present
    expect(screen.getByText(/Show me my pets/)).toBeInTheDocument();
    expect(screen.getByText(/Go to appointments/)).toBeInTheDocument();
    expect(screen.getByText(/Show health records/)).toBeInTheDocument();
  });

  it('should include data entry commands in examples', async () => {
    // Render VoiceAssistant with help enabled
    render(<VoiceAssistant isExpanded={true} showFirstTimeHelp={true} />);

    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByText('Common Voice Commands:')).toBeInTheDocument();
    });

    // Verify data entry commands are present
    expect(screen.getByText(/Log feeding for \[pet name\]/)).toBeInTheDocument();
  });

  it('should include scheduling commands in examples', async () => {
    // Render VoiceAssistant with help enabled
    render(<VoiceAssistant isExpanded={true} showFirstTimeHelp={true} />);

    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByText('Common Voice Commands:')).toBeInTheDocument();
    });

    // Verify scheduling commands are present
    expect(screen.getByText(/Schedule a vet appointment/)).toBeInTheDocument();
  });

  it('should include query commands in examples', async () => {
    // Render VoiceAssistant with help enabled
    render(<VoiceAssistant isExpanded={true} showFirstTimeHelp={true} />);

    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByText('Common Voice Commands:')).toBeInTheDocument();
    });

    // Verify query commands are present
    expect(screen.getByText(/What medications does \[pet name\] need today\?/)).toBeInTheDocument();
  });
});
