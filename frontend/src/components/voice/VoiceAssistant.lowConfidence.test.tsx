/**
 * Integration Tests for Low Confidence Visual Warning in VoiceAssistant
 * 
 * Feature: jojo-voice-assistant-enhanced
 * Tests that the VoiceAssistant component displays visual warning indicators
 * when voice recognition confidence is low (below 80%).
 * 
 * Validates: Requirements 10.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceAssistant } from './VoiceAssistant';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock voice services
let mockOnFinalResult: ((text: string, confidence: number) => void) | null = null;

vi.mock('@/services/voice/wakeWordDetector', () => ({
  createWakeWordDetector: vi.fn(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    startListening: vi.fn(),
    stopListening: vi.fn(),
    isListening: vi.fn(() => false),
    onWakeWordDetected: vi.fn()
  }))
}));

vi.mock('@/services/voice/voiceRecognitionEngine', () => ({
  createVoiceRecognitionEngine: vi.fn(() => ({
    startRecognition: vi.fn(),
    stopRecognition: vi.fn(),
    onInterimResult: vi.fn(),
    onFinalResult: vi.fn((callback) => {
      mockOnFinalResult = callback;
    }),
    onError: vi.fn(),
    setLanguage: vi.fn(),
    setContinuous: vi.fn()
  }))
}));

vi.mock('@/services/voice/intentParser', () => ({
  createIntentParser: vi.fn(() => ({
    parseIntent: vi.fn().mockResolvedValue({
      intentId: 'test',
      action: 'QUERY',
      target: 'test',
      parameters: {},
      confidence: 0.9,
      requiresConfirmation: false,
      priority: 'normal',
      entities: [],
      ambiguities: []
    })
  }))
}));

vi.mock('@/services/voice/contextManager', () => ({
  createContextManager: vi.fn(() => ({
    updateContext: vi.fn(),
    getContext: vi.fn(() => ({
      previousIntents: [],
      activePet: null,
      currentPage: '/',
      recentEntities: []
    })),
    setActivePet: vi.fn(),
    getActivePet: vi.fn(),
    addEntity: vi.fn(),
    clearContext: vi.fn(),
    getTurnCount: vi.fn(() => 0)
  }))
}));

vi.mock('@/services/voice/commandRouter', () => ({
  createCommandRouter: vi.fn(() => ({
    executeCommand: vi.fn().mockResolvedValue({
      success: true,
      data: {},
      message: 'Command executed',
      visualComponent: null,
      requiresFollowUp: false,
      followUpPrompt: null
    })
  }))
}));

vi.mock('@/services/voice/responseComposer', () => ({
  createResponseComposer: vi.fn(() => ({
    composeResponse: vi.fn(() => ({
      text: 'Test response',
      displayText: 'Test response',
      visualData: null,
      audioUrl: null,
      priority: 'normal'
    })),
    composeErrorResponse: vi.fn(() => ({
      text: 'Error occurred',
      displayText: 'Error occurred',
      visualData: null,
      audioUrl: null,
      priority: 'high'
    })),
    composeConfirmation: vi.fn(() => ({
      text: 'I heard "test command". Is that correct?',
      displayText: 'I heard "test command". Is that correct?',
      visualData: null,
      audioUrl: null,
      priority: 'normal'
    })),
    composeClarification: vi.fn(() => ({
      text: 'Please clarify',
      displayText: 'Please clarify',
      visualData: null,
      audioUrl: null,
      priority: 'normal'
    }))
  }))
}));

vi.mock('@/services/voice/audioFeedbackController', () => ({
  createAudioFeedbackController: vi.fn(() => ({
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
  })),
  AvatarState: {
    IDLE: 'idle',
    LISTENING: 'listening',
    THINKING: 'thinking',
    SPEAKING: 'speaking'
  }
}));

vi.mock('@/services/voice/handsFreeMode Manager', () => ({
  createHandsFreeModeManager: vi.fn(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    toggle: vi.fn().mockResolvedValue(undefined),
    enable: vi.fn().mockResolvedValue(undefined),
    disable: vi.fn(),
    isEnabled: vi.fn(() => false),
    getPreference: vi.fn(() => false),
    onModeChange: vi.fn(),
    onInactivityTimeout: vi.fn(),
    trackActivity: vi.fn(),
    cleanup: vi.fn()
  }))
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

// Mock Web Speech API
global.SpeechSynthesisUtterance = vi.fn().mockImplementation(() => ({
  lang: '',
  rate: 1,
  pitch: 1,
  onend: null,
  onerror: null
})) as any;

global.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn()
} as any;

describe('VoiceAssistant - Low Confidence Visual Warning', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockOnFinalResult = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Low confidence warning displays when confidence is below 80%
   * Validates: Requirements 10.6
   */
  it('should display low confidence warning when recognition confidence is below 80%', async () => {
    const user = userEvent.setup();

    // Render component in expanded mode
    render(
      <TooltipProvider>
        <VoiceAssistant isExpanded={true} />
      </TooltipProvider>
    );

    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByText('JoJo Voice Assistant')).toBeInTheDocument();
    });

    // Start listening
    const micButton = screen.getByRole('button', { name: /start listening|stop listening/i });
    await user.click(micButton);

    // Simulate low confidence transcription (75%)
    if (mockOnFinalResult) {
      mockOnFinalResult('show me my pets', 0.75);
    }

    // Wait for low confidence warning to appear
    await waitFor(() => {
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
      expect(screen.getByText('(75%)')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify confirmation message is displayed
    await waitFor(() => {
      expect(screen.getByText(/I heard "show me my pets". Is that correct?/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Low confidence warning does not display when confidence is 80% or above
   * Validates: Requirements 10.6
   */
  it('should not display low confidence warning when recognition confidence is 80% or above', async () => {
    const user = userEvent.setup();

    // Render component in expanded mode
    render(
      <TooltipProvider>
        <VoiceAssistant isExpanded={true} />
      </TooltipProvider>
    );

    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByText('JoJo Voice Assistant')).toBeInTheDocument();
    });

    // Start listening
    const micButton = screen.getByRole('button', { name: /start listening|stop listening/i });
    await user.click(micButton);

    // Simulate good confidence transcription (85%)
    if (mockOnFinalResult) {
      mockOnFinalResult('show me my pets', 0.85);
    }

    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByText(/Test response/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify low confidence warning is NOT displayed
    expect(screen.queryByText('Low Confidence')).not.toBeInTheDocument();
  });

  /**
   * Test: Low confidence warning displays with different confidence levels
   * Validates: Requirements 10.6
   */
  it('should display correct confidence percentage for various low confidence levels', async () => {
    const user = userEvent.setup();

    // Test with 60% confidence
    const { rerender } = render(
      <TooltipProvider>
        <VoiceAssistant isExpanded={true} />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('JoJo Voice Assistant')).toBeInTheDocument();
    });

    const micButton = screen.getByRole('button', { name: /start listening|stop listening/i });
    await user.click(micButton);

    if (mockOnFinalResult) {
      mockOnFinalResult('test command', 0.60);
    }

    await waitFor(() => {
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
      expect(screen.getByText('(60%)')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  /**
   * Test: Low confidence warning clears when starting new listening session
   * Validates: Requirements 10.6
   */
  it('should clear low confidence warning when starting a new listening session', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <VoiceAssistant isExpanded={true} />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('JoJo Voice Assistant')).toBeInTheDocument();
    });

    // First transcription with low confidence
    const micButton = screen.getByRole('button', { name: /start listening|stop listening/i });
    await user.click(micButton);

    if (mockOnFinalResult) {
      mockOnFinalResult('first command', 0.70);
    }

    await waitFor(() => {
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Start new listening session
    await user.click(micButton);

    // Warning should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Low Confidence')).not.toBeInTheDocument();
    });
  });

  /**
   * Test: Low confidence warning at exactly 80% threshold
   * Validates: Requirements 10.6
   */
  it('should not display warning at exactly 80% confidence (threshold boundary)', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <VoiceAssistant isExpanded={true} />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('JoJo Voice Assistant')).toBeInTheDocument();
    });

    const micButton = screen.getByRole('button', { name: /start listening|stop listening/i });
    await user.click(micButton);

    // Test at exactly 80% (should NOT show warning)
    if (mockOnFinalResult) {
      mockOnFinalResult('boundary test', 0.80);
    }

    await waitFor(() => {
      expect(screen.getByText(/Test response/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify warning is NOT displayed at threshold
    expect(screen.queryByText('Low Confidence')).not.toBeInTheDocument();
  });

  /**
   * Test: Low confidence warning at just below 80% threshold
   * Validates: Requirements 10.6
   */
  it('should display warning just below 80% confidence (79.9%)', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <VoiceAssistant isExpanded={true} />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('JoJo Voice Assistant')).toBeInTheDocument();
    });

    const micButton = screen.getByRole('button', { name: /start listening|stop listening/i });
    await user.click(micButton);

    // Test just below threshold (should show warning)
    if (mockOnFinalResult) {
      mockOnFinalResult('boundary test', 0.799);
    }

    await waitFor(() => {
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
      expect(screen.getByText('(80%)')).toBeInTheDocument(); // Rounds to 80%
    }, { timeout: 3000 });
  });
});
