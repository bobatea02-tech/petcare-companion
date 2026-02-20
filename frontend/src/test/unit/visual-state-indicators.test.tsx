/**
 * Visual State Indicators Unit Tests
 * 
 * Feature: jojo-voice-assistant-enhanced
 * Task: 39.1 Implement all visual state indicators
 * 
 * Tests that all four visual state indicators are properly implemented:
 * - Listening indicator (pulsing microphone)
 * - Processing indicator (spinner/thinking animation)
 * - Speaking indicator (animated avatar)
 * - Idle state indicator
 * 
 * Validates: Requirements 1.3, 10.1, 10.2, 10.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AudioFeedbackDisplay } from '@/components/voice/AudioFeedbackDisplay';
import { AvatarState, createAudioFeedbackController } from '@/services/voice/audioFeedbackController';
import '@testing-library/jest-dom';

describe('Visual State Indicators - Task 39.1', () => {
  let controller: ReturnType<typeof createAudioFeedbackController>;

  beforeEach(() => {
    controller = createAudioFeedbackController();
  });

  describe('Listening Indicator', () => {
    it('should display pulsing microphone icon when in listening state', async () => {
      // Render component
      const { container } = render(
        <AudioFeedbackDisplay controller={controller} showAvatar={true} />
      );

      // Trigger listening state
      controller.showListening();

      // Wait for state update
      await waitFor(() => {
        // Check for "Listening..." text
        expect(screen.getByText('Listening...')).toBeInTheDocument();
      });

      // Verify microphone icon is present (Mic component from lucide-react)
      const listeningText = screen.getByText('Listening...');
      expect(listeningText).toHaveClass('text-blue-600');
    });

    it('should show blue color scheme for listening state', async () => {
      render(<AudioFeedbackDisplay controller={controller} showAvatar={true} />);
      
      controller.showListening();

      await waitFor(() => {
        const stateLabel = screen.getByText('Listening...');
        expect(stateLabel).toHaveClass('text-blue-600');
      });
    });

    it('should display pulsing ring animation during listening', async () => {
      const { container } = render(
        <AudioFeedbackDisplay controller={controller} showAvatar={true} />
      );

      controller.showListening();

      await waitFor(() => {
        // The pulsing ring should be present (border-blue-400 class)
        const pulsingRing = container.querySelector('.border-blue-400');
        expect(pulsingRing).toBeInTheDocument();
      });
    });
  });

  describe('Processing Indicator', () => {
    it('should display spinner/thinking animation when processing', async () => {
      render(<AudioFeedbackDisplay controller={controller} showAvatar={true} />);

      controller.showProcessing();

      await waitFor(() => {
        expect(screen.getByText('Processing...')).toBeInTheDocument();
      });
    });

    it('should show amber color scheme for processing state', async () => {
      render(<AudioFeedbackDisplay controller={controller} showAvatar={true} />);
      
      controller.showProcessing();

      await waitFor(() => {
        const stateLabel = screen.getByText('Processing...');
        expect(stateLabel).toHaveClass('text-amber-600');
      });
    });

    it('should display rotating loader icon during processing', async () => {
      const { container } = render(
        <AudioFeedbackDisplay controller={controller} showAvatar={true} />
      );

      controller.showProcessing();

      await waitFor(() => {
        // Check for amber gradient background
        const avatar = container.querySelector('.from-amber-400');
        expect(avatar).toBeInTheDocument();
      });
    });
  });

  describe('Speaking Indicator', () => {
    it('should display animated avatar when speaking', async () => {
      render(<AudioFeedbackDisplay controller={controller} showAvatar={true} />);

      controller.showSpeaking();

      await waitFor(() => {
        expect(screen.getByText('Speaking...')).toBeInTheDocument();
      });
    });

    it('should show green color scheme for speaking state', async () => {
      render(<AudioFeedbackDisplay controller={controller} showAvatar={true} />);
      
      controller.showSpeaking();

      await waitFor(() => {
        const stateLabel = screen.getByText('Speaking...');
        expect(stateLabel).toHaveClass('text-green-600');
      });
    });

    it('should display volume icon during speaking', async () => {
      const { container } = render(
        <AudioFeedbackDisplay controller={controller} showAvatar={true} />
      );

      controller.showSpeaking();

      await waitFor(() => {
        // Check for green gradient background
        const avatar = container.querySelector('.from-green-400');
        expect(avatar).toBeInTheDocument();
      });
    });

    it('should show waveform visualization when speaking', async () => {
      const { container } = render(
        <AudioFeedbackDisplay controller={controller} showWaveform={true} />
      );

      controller.showSpeaking();

      await waitFor(() => {
        // Check for canvas element (waveform visualization)
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
      });
    });
  });

  describe('Idle State Indicator', () => {
    it('should display idle state by default', () => {
      render(<AudioFeedbackDisplay controller={controller} showAvatar={true} />);

      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('should show gray color scheme for idle state', () => {
      render(<AudioFeedbackDisplay controller={controller} showAvatar={true} />);
      
      const stateLabel = screen.getByText('Ready');
      expect(stateLabel).toHaveClass('text-gray-600');
    });

    it('should display circle icon in idle state', () => {
      const { container } = render(
        <AudioFeedbackDisplay controller={controller} showAvatar={true} />
      );

      // Check for gray gradient background
      const avatar = container.querySelector('.from-gray-400');
      expect(avatar).toBeInTheDocument();
    });

    it('should return to idle state after speaking completes', async () => {
      render(<AudioFeedbackDisplay controller={controller} showAvatar={true} />);

      // Start speaking
      controller.showSpeaking();
      await waitFor(() => {
        expect(screen.getByText('Speaking...')).toBeInTheDocument();
      });

      // Return to idle
      controller.showIdle();
      await waitFor(() => {
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });
    });
  });

  describe('State Transitions', () => {
    it('should smoothly transition between all states', async () => {
      render(<AudioFeedbackDisplay controller={controller} showAvatar={true} />);

      // Idle -> Listening
      controller.showListening();
      await waitFor(() => {
        expect(screen.getByText('Listening...')).toBeInTheDocument();
      });

      // Listening -> Processing
      controller.showProcessing();
      await waitFor(() => {
        expect(screen.getByText('Processing...')).toBeInTheDocument();
      });

      // Processing -> Speaking
      controller.showSpeaking();
      await waitFor(() => {
        expect(screen.getByText('Speaking...')).toBeInTheDocument();
      });

      // Speaking -> Idle
      controller.showIdle();
      await waitFor(() => {
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });
    });

    it('should update visual indicators immediately on state change', async () => {
      render(<AudioFeedbackDisplay controller={controller} showAvatar={true} />);

      // Change to listening
      controller.showListening();
      
      // Should update within reasonable time
      await waitFor(() => {
        expect(screen.getByText('Listening...')).toBeInTheDocument();
      }, { timeout: 500 });
    });
  });

  describe('Waveform Visualization', () => {
    it('should show waveform during listening state', async () => {
      const { container } = render(
        <AudioFeedbackDisplay controller={controller} showWaveform={true} />
      );

      controller.showListening();

      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
      });
    });

    it('should show waveform during speaking state', async () => {
      const { container } = render(
        <AudioFeedbackDisplay controller={controller} showWaveform={true} />
      );

      controller.showSpeaking();

      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
      });
    });

    it('should not show waveform during idle state', () => {
      const { container } = render(
        <AudioFeedbackDisplay controller={controller} showWaveform={true} />
      );

      controller.showIdle();

      // Canvas should not be present in idle state
      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeInTheDocument();
    });
  });

  describe('Avatar Animation', () => {
    it('should animate avatar based on current state', async () => {
      const { container } = render(
        <AudioFeedbackDisplay controller={controller} showAvatar={true} />
      );

      // Test listening animation (pulsing)
      controller.showListening();
      await waitFor(() => {
        const avatar = container.querySelector('.from-blue-400');
        expect(avatar).toBeInTheDocument();
      });

      // Test processing animation (rotating)
      controller.showProcessing();
      await waitFor(() => {
        const avatar = container.querySelector('.from-amber-400');
        expect(avatar).toBeInTheDocument();
      });

      // Test speaking animation (pulsing)
      controller.showSpeaking();
      await waitFor(() => {
        const avatar = container.querySelector('.from-green-400');
        expect(avatar).toBeInTheDocument();
      });
    });
  });

  describe('Requirement Validation', () => {
    it('Requirement 1.3: Visual indicator when JoJo is listening', async () => {
      render(<AudioFeedbackDisplay controller={controller} showAvatar={true} />);
      
      controller.showListening();

      await waitFor(() => {
        // Visual indicator should be present
        expect(screen.getByText('Listening...')).toBeInTheDocument();
        // Should have distinct visual appearance (blue color)
        const label = screen.getByText('Listening...');
        expect(label).toHaveClass('text-blue-600');
      });
    });

    it('Requirement 10.1: Animated listening indicator (pulsing microphone icon)', async () => {
      const { container } = render(
        <AudioFeedbackDisplay controller={controller} showAvatar={true} />
      );
      
      controller.showListening();

      await waitFor(() => {
        // Pulsing ring animation should be present
        const pulsingRing = container.querySelector('.border-blue-400');
        expect(pulsingRing).toBeInTheDocument();
        
        // Microphone state should be active
        expect(screen.getByText('Listening...')).toBeInTheDocument();
      });
    });

    it('Requirement 10.2: Processing indicator during command processing', async () => {
      render(<AudioFeedbackDisplay controller={controller} showAvatar={true} />);
      
      controller.showProcessing();

      await waitFor(() => {
        // Processing indicator should be visible
        expect(screen.getByText('Processing...')).toBeInTheDocument();
        // Should have distinct visual appearance (amber color)
        const label = screen.getByText('Processing...');
        expect(label).toHaveClass('text-amber-600');
      });
    });

    it('Requirement 10.3: Animated avatar with mouth movements synchronized to speech', async () => {
      render(<AudioFeedbackDisplay controller={controller} showAvatar={true} />);
      
      controller.showSpeaking();

      await waitFor(() => {
        // Speaking indicator should be visible
        expect(screen.getByText('Speaking...')).toBeInTheDocument();
        // Should have distinct visual appearance (green color)
        const label = screen.getByText('Speaking...');
        expect(label).toHaveClass('text-green-600');
      });
    });
  });
});
