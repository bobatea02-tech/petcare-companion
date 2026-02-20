/**
 * Voice Control Hook
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Provides voice control capabilities to dashboard components.
 * Enables components to register voice commands and handle voice-triggered actions.
 * 
 * Requirements: 20.1, 20.3, 20.4
 */

import { useEffect, useCallback, useRef } from 'react';
import { commandRouter } from '@/services/voice/commandRouter';
import { createContextManager } from '@/services/voice/contextManager';
import { CommandAction, ParsedIntent, CommandResult } from '@/services/voice/types';

// Create singleton context manager instance
const contextManager = createContextManager();

export interface VoiceControlOptions {
  // Component identifier (e.g., 'health-tracker', 'medication-tracker')
  componentId: string;
  
  // Pet ID this component is managing
  petId?: string;
  
  // Callback when voice command is executed
  onVoiceCommand?: (intent: ParsedIntent, result: CommandResult) => void;
  
  // Enable/disable voice control
  enabled?: boolean;
}

/**
 * Hook to enable voice control for dashboard components
 * 
 * This hook:
 * - Registers the component with the voice system
 * - Updates context when component mounts/unmounts
 * - Provides methods to trigger voice-controlled actions
 * - Ensures voice commands update UI state as if manual interaction occurred (Req 20.1)
 */
export const useVoiceControl = (options: VoiceControlOptions) => {
  const { componentId, petId, onVoiceCommand, enabled = true } = options;
  const isRegistered = useRef(false);

  // Register component with voice system on mount
  useEffect(() => {
    if (!enabled) return;

    // Update context to indicate current component
    if (petId) {
      contextManager.setActivePet(petId);
    }

    // Update current page context
    const context = contextManager.getContext();
    contextManager.updateContext({
      ...context.previousIntents[0],
      intentId: `${componentId}-mount`,
      action: CommandAction.NAVIGATE,
      target: componentId,
      parameters: { petId },
      confidence: 1,
      requiresConfirmation: false,
      priority: 'normal',
      entities: [],
      ambiguities: [],
    } as ParsedIntent);

    isRegistered.current = true;

    // Cleanup on unmount
    return () => {
      isRegistered.current = false;
    };
  }, [componentId, petId, enabled]);

  /**
   * Execute a voice command programmatically
   * Useful for testing or triggering voice actions from UI
   */
  const executeVoiceCommand = useCallback(async (intent: ParsedIntent): Promise<CommandResult> => {
    if (!enabled) {
      return {
        success: false,
        data: null,
        message: 'Voice control is disabled',
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }

    try {
      // Execute command through router
      const result = await commandRouter.executeCommand(intent);

      // Notify component of voice command execution
      if (onVoiceCommand) {
        onVoiceCommand(intent, result);
      }

      return result;
    } catch (error) {
      console.error('Error executing voice command:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Unknown error',
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }
  }, [enabled, onVoiceCommand]);

  /**
   * Notify voice system of manual UI interaction
   * This ensures voice context stays in sync with manual interactions (Req 20.2)
   */
  const notifyManualAction = useCallback((action: string, data: any) => {
    if (!enabled) return;

    // Update context with manual action
    const intent: ParsedIntent = {
      intentId: `manual-${Date.now()}`,
      action: CommandAction.UPDATE,
      target: componentId,
      parameters: { action, data, petId },
      confidence: 1,
      requiresConfirmation: false,
      priority: 'normal',
      entities: [],
      ambiguities: [],
    };

    contextManager.updateContext(intent);
  }, [componentId, petId, enabled]);

  /**
   * Check if voice control is active for this component
   */
  const isVoiceControlActive = useCallback(() => {
    return enabled && isRegistered.current;
  }, [enabled]);

  return {
    executeVoiceCommand,
    notifyManualAction,
    isVoiceControlActive,
    isEnabled: enabled,
  };
};

export default useVoiceControl;
