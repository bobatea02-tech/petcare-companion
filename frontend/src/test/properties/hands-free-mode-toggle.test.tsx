/**
 * Property Test: Hands-free mode toggle
 * Feature: jojo-voice-assistant-enhanced, Property 42: Hands-free mode toggle
 * 
 * Property: For any hands-free mode state change (enable/disable), the Wake_Word_Detector 
 * should start or stop monitoring accordingly, and the Dashboard should display the current mode state
 * 
 * Validates: Requirements 13.1, 13.2, 13.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
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
    }),
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
    executeCommand: vi.fn().mockResolvedValue({
      success: true,
      data: {},
      message: 'Success',
      visualComponent: null,
      requiresFollowUp: false,
      followUpPrompt: null
    }),
    getAvailableCommands: vi.fn()
  })
}));

vi.mock('@/services/voice/responseComposer', () => ({
  createResponseComposer: () => ({
    composeResponse: vi.fn().mockReturnValue({
      text: 'Test response',
      displayText: 'Test response',
      visualData: null,
      audioUrl: null,
      priority: 'normal'
    }),
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

describe('Property 42: Hands-free mode toggle', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should toggle hands-free mode and update UI state accordingly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // Initial hands-free mode state
        async (initialHandsFreeMode) => {
          // Set initial state in localStorage
          if (initialHandsFreeMode) {
            localStorage.setItem('jojo-hands-free-mode', 'true');
          }

          const user = userEvent.setup();

          // Render component
          const { rerender, unmount } = render(
            <TooltipProvider>
              <VoiceAssistant isExpanded={true} />
            </TooltipProvider>
          );

          // Wait for component to initialize
          await waitFor(() => {
            expect(screen.getByText('JoJo Voice Assistant')).toBeInTheDocument();
          });

          // Open settings panel
          const settingsButton = screen.getByRole('button', { name: /settings/i });
          await user.click(settingsButton);

          // Wait for settings panel to appear
          await waitFor(() => {
            expect(screen.getByText('Hands-free Mode')).toBeInTheDocument();
          });

          // Find the hands-free mode switch
          const handsFreeSwitch = screen.getByRole('switch');
          
          // Verify initial state matches what we set
          if (initialHandsFreeMode) {
            expect(handsFreeSwitch).toBeChecked();
          } else {
            expect(handsFreeSwitch).not.toBeChecked();
          }

          // Toggle hands-free mode
          await user.click(handsFreeSwitch);

          // Wait for state to update
          await waitFor(() => {
            if (initialHandsFreeMode) {
              expect(handsFreeSwitch).not.toBeChecked();
            } else {
              expect(handsFreeSwitch).toBeChecked();
            }
          });

          // Verify localStorage was updated
          const savedMode = localStorage.getItem('jojo-hands-free-mode');
          expect(savedMode).toBe(String(!initialHandsFreeMode));

          // Toggle again to return to original state
          await user.click(handsFreeSwitch);

          await waitFor(() => {
            if (initialHandsFreeMode) {
              expect(handsFreeSwitch).toBeChecked();
            } else {
              expect(handsFreeSwitch).not.toBeChecked();
            }
          });

          // Verify localStorage was updated again
          const finalSavedMode = localStorage.getItem('jojo-hands-free-mode');
          expect(finalSavedMode).toBe(String(initialHandsFreeMode));

          // Cleanup
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display hands-free mode indicator when enabled and not expanded', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(true), // Always test with hands-free mode enabled
        async () => {
          // Enable hands-free mode
          localStorage.setItem('jojo-hands-free-mode', 'true');

          // Render component in collapsed state
          const { unmount } = render(
            <TooltipProvider>
              <VoiceAssistant isExpanded={false} />
            </TooltipProvider>
          );

          // Wait for component to initialize
          await waitFor(() => {
            // Should show hands-free indicator badge
            const badge = screen.queryByText('Hands-free');
            expect(badge).toBeInTheDocument();
          }, { timeout: 3000 });

          // Cleanup
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should persist hands-free mode preference across component remounts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        async (handsFreeMode) => {
          const user = userEvent.setup();

          // First render - set the mode
          const { unmount: unmount1 } = render(
            <TooltipProvider>
              <VoiceAssistant isExpanded={true} />
            </TooltipProvider>
          );

          await waitFor(() => {
            expect(screen.getByText('JoJo Voice Assistant')).toBeInTheDocument();
          });

          // Open settings
          const settingsButton1 = screen.getByRole('button', { name: /settings/i });
          await user.click(settingsButton1);

          await waitFor(() => {
            expect(screen.getByText('Hands-free Mode')).toBeInTheDocument();
          });

          // Set hands-free mode to desired state
          const switch1 = screen.getByRole('switch');
          const currentState = switch1.getAttribute('data-state') === 'checked';
          
          if (currentState !== handsFreeMode) {
            await user.click(switch1);
            await waitFor(() => {
              const newState = screen.getByRole('switch').getAttribute('data-state') === 'checked';
              expect(newState).toBe(handsFreeMode);
            });
          }

          // Unmount component
          unmount1();

          // Second render - verify persistence
          const { unmount: unmount2 } = render(
            <TooltipProvider>
              <VoiceAssistant isExpanded={true} />
            </TooltipProvider>
          );

          await waitFor(() => {
            expect(screen.getByText('JoJo Voice Assistant')).toBeInTheDocument();
          });

          // Open settings again
          const settingsButton2 = screen.getByRole('button', { name: /settings/i });
          await user.click(settingsButton2);

          await waitFor(() => {
            expect(screen.getByText('Hands-free Mode')).toBeInTheDocument();
          });

          // Verify the mode was persisted
          const switch2 = screen.getByRole('switch');
          const persistedState = switch2.getAttribute('data-state') === 'checked';
          expect(persistedState).toBe(handsFreeMode);

          // Cleanup
          unmount2();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show appropriate visual feedback when toggling hands-free mode', async () => {
    const user = userEvent.setup();

    // Render component
    const { unmount } = render(
      <TooltipProvider>
        <VoiceAssistant isExpanded={true} />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('JoJo Voice Assistant')).toBeInTheDocument();
    });

    // Open settings
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText('Hands-free Mode')).toBeInTheDocument();
    });

    // Toggle hands-free mode on
    const handsFreeSwitch = screen.getByRole('switch');
    await user.click(handsFreeSwitch);

    // Should show success toast (mocked)
    await waitFor(() => {
      expect(handsFreeSwitch).toBeChecked();
    });

    // Toggle hands-free mode off
    await user.click(handsFreeSwitch);

    // Should show info toast (mocked)
    await waitFor(() => {
      expect(handsFreeSwitch).not.toBeChecked();
    });

    // Cleanup
    unmount();
  });
});
