/**
 * Property-Based Tests for VoiceAssistant Component
 * 
 * Feature: jojo-voice-assistant-enhanced
 * Property 42: Hands-free mode toggle
 * 
 * Tests that hands-free mode state changes correctly update the Wake_Word_Detector
 * and display the current mode state in the UI.
 * 
 * Validates: Requirements 13.1, 13.2, 13.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import { VoiceAssistant } from './VoiceAssistant';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock voice services
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
    onFinalResult: vi.fn(),
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
      text: 'Please confirm',
      displayText: 'Please confirm',
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

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

describe('VoiceAssistant - Property 42: Hands-free mode toggle', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 42: Hands-free mode toggle
   * 
   * For any hands-free mode state change (enable/disable), the Wake_Word_Detector 
   * should start or stop monitoring accordingly, and the Dashboard should display 
   * the current mode state.
   * 
   * Validates: Requirements 13.1, 13.2, 13.3
   */
  it('Property 42: hands-free mode toggle updates Wake_Word_Detector and UI state', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a sequence of toggle actions
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
        async (toggleSequence) => {
          const user = userEvent.setup();
          
          // Import mocked services to track calls
          const { createWakeWordDetector } = await import('@/services/voice/wakeWordDetector');
          const mockWakeWordDetector = (createWakeWordDetector as any)();

          // Render component in expanded mode to access controls
          const { rerender } = render(
            <TooltipProvider>
              <VoiceAssistant isExpanded={true} />
            </TooltipProvider>
          );

          // Wait for initialization
          await waitFor(() => {
            expect(createWakeWordDetector).toHaveBeenCalled();
          });

          // Track expected state
          let expectedHandsFreeMode = false;

          // Execute toggle sequence
          for (const shouldEnable of toggleSequence) {
            // Only toggle if the target state is different from current state
            if (shouldEnable !== expectedHandsFreeMode) {
              // Find and click the settings button to reveal hands-free toggle
              const settingsButton = screen.getByLabelText('Settings');
              await user.click(settingsButton);

              // Wait for settings panel to appear
              await waitFor(() => {
                expect(screen.getByText('Hands-free Mode')).toBeInTheDocument();
              });

              // Find and toggle the hands-free switch
              const handsFreeSwitch = screen.getByRole('switch', { name: /hands-free/i });
              await user.click(handsFreeSwitch);

              // Update expected state
              expectedHandsFreeMode = shouldEnable;

              // Verify Wake_Word_Detector behavior
              await waitFor(() => {
                if (shouldEnable) {
                  // When enabling, Wake_Word_Detector should initialize and start listening
                  expect(mockWakeWordDetector.initialize).toHaveBeenCalledWith('Hey JoJo');
                  expect(mockWakeWordDetector.startListening).toHaveBeenCalled();
                } else {
                  // When disabling, Wake_Word_Detector should stop listening
                  expect(mockWakeWordDetector.stopListening).toHaveBeenCalled();
                }
              });

              // Verify UI state - check for hands-free indicator badge
              if (shouldEnable) {
                // When enabled and not expanded, should show hands-free badge
                // First collapse the panel to see the badge
                const closeButton = screen.getByRole('button', { name: /talk to jojo/i });
                await user.click(closeButton);

                await waitFor(() => {
                  expect(screen.getByText('Hands-free')).toBeInTheDocument();
                });

                // Re-expand for next iteration
                const jojoButton = screen.getByRole('button', { name: /talk to jojo/i });
                await user.click(jojoButton);
              }

              // Verify localStorage persistence
              const storedValue = localStorage.getItem('jojo-hands-free-mode');
              expect(storedValue).toBe(String(shouldEnable));

              // Close settings panel for next iteration
              const settingsButtonAgain = screen.getByLabelText('Settings');
              await user.click(settingsButtonAgain);
            }
          }

          // Final verification: state should match last toggle
          const finalExpectedState = toggleSequence[toggleSequence.length - 1];
          const finalStoredValue = localStorage.getItem('jojo-hands-free-mode');
          expect(finalStoredValue).toBe(String(finalExpectedState));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Hands-free mode persistence across component remounts
   */
  it('Property 42 (persistence): hands-free mode preference persists across remounts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        async (initialHandsFreeMode) => {
          const user = userEvent.setup();

          // Set initial localStorage value
          localStorage.setItem('jojo-hands-free-mode', String(initialHandsFreeMode));

          // Import mocked services
          const { createWakeWordDetector } = await import('@/services/voice/wakeWordDetector');
          const mockWakeWordDetector = (createWakeWordDetector as any)();

          // First render
          const { unmount } = render(
            <TooltipProvider>
              <VoiceAssistant isExpanded={true} />
            </TooltipProvider>
          );

          // Wait for initialization
          await waitFor(() => {
            expect(createWakeWordDetector).toHaveBeenCalled();
          });

          // If hands-free mode was enabled, verify it started
          if (initialHandsFreeMode) {
            await waitFor(() => {
              expect(mockWakeWordDetector.initialize).toHaveBeenCalledWith('Hey JoJo');
              expect(mockWakeWordDetector.startListening).toHaveBeenCalled();
            });
          }

          // Unmount component
          unmount();

          // Clear mocks
          vi.clearAllMocks();

          // Remount component
          render(
            <TooltipProvider>
              <VoiceAssistant isExpanded={true} />
            </TooltipProvider>
          );

          // Wait for initialization
          await waitFor(() => {
            expect(createWakeWordDetector).toHaveBeenCalled();
          });

          // Verify hands-free mode was restored from localStorage
          if (initialHandsFreeMode) {
            await waitFor(() => {
              expect(mockWakeWordDetector.initialize).toHaveBeenCalledWith('Hey JoJo');
              expect(mockWakeWordDetector.startListening).toHaveBeenCalled();
            });
          }

          // Verify localStorage value unchanged
          const storedValue = localStorage.getItem('jojo-hands-free-mode');
          expect(storedValue).toBe(String(initialHandsFreeMode));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Hands-free mode indicator visibility
   */
  it('Property 42 (UI): hands-free indicator badge displays correctly based on mode state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        fc.boolean(),
        async (handsFreeEnabled, isExpanded) => {
          const user = userEvent.setup();

          // Render component
          const { rerender } = render(
            <TooltipProvider>
              <VoiceAssistant isExpanded={isExpanded} />
            </TooltipProvider>
          );

          // Wait for initialization
          await waitFor(() => {
            expect(screen.getByRole('button', { name: /talk to jojo/i })).toBeInTheDocument();
          });

          // Set hands-free mode if needed
          if (handsFreeEnabled) {
            // Expand if not already expanded
            if (!isExpanded) {
              const jojoButton = screen.getByRole('button', { name: /talk to jojo/i });
              await user.click(jojoButton);
            }

            // Open settings
            const settingsButton = screen.getByLabelText('Settings');
            await user.click(settingsButton);

            // Enable hands-free mode
            const handsFreeSwitch = screen.getByRole('switch', { name: /hands-free/i });
            await user.click(handsFreeSwitch);

            // Close settings
            await user.click(settingsButton);

            // Collapse if we want to test collapsed state
            if (!isExpanded) {
              const closeButton = screen.getByRole('button', { name: /talk to jojo/i });
              await user.click(closeButton);
            }
          }

          // Verify badge visibility
          if (handsFreeEnabled && !isExpanded) {
            // Badge should be visible when hands-free is enabled and panel is collapsed
            await waitFor(() => {
              expect(screen.getByText('Hands-free')).toBeInTheDocument();
            });
          } else if (!handsFreeEnabled || isExpanded) {
            // Badge should not be visible when hands-free is disabled or panel is expanded
            expect(screen.queryByText('Hands-free')).not.toBeInTheDocument();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
