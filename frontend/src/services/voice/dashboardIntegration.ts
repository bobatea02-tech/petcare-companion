/**
 * Dashboard Integration Service
 * 
 * Provides seamless integration between voice commands and dashboard features.
 * Ensures voice commands update UI state as if user performed manual interaction.
 * 
 * Task: 41.1 - Wire all components together
 * Requirements: 20.1, 20.5
 * Feature: jojo-voice-assistant-enhanced
 */

import { useEffect } from 'react';
import { ParsedIntent, CommandResult } from './types';

/**
 * Dashboard Integration Manager
 * 
 * Coordinates voice command execution with dashboard state updates
 * to ensure seamless integration across all features.
 */
export class DashboardIntegration {
  private static instance: DashboardIntegration;
  private stateUpdateCallbacks: Map<string, Function[]> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): DashboardIntegration {
    if (!DashboardIntegration.instance) {
      DashboardIntegration.instance = new DashboardIntegration();
    }
    return DashboardIntegration.instance;
  }

  /**
   * Register a callback for state updates
   * @param feature - Feature name (e.g., 'appointments', 'health', 'feeding')
   * @param callback - Callback function to invoke on state update
   */
  registerStateUpdateCallback(feature: string, callback: Function): void {
    if (!this.stateUpdateCallbacks.has(feature)) {
      this.stateUpdateCallbacks.set(feature, []);
    }
    this.stateUpdateCallbacks.get(feature)!.push(callback);
  }

  /**
   * Unregister a callback
   * @param feature - Feature name
   * @param callback - Callback function to remove
   */
  unregisterStateUpdateCallback(feature: string, callback: Function): void {
    const callbacks = this.stateUpdateCallbacks.get(feature);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Notify feature of state update from voice command
   * @param feature - Feature name
   * @param data - Update data
   */
  notifyStateUpdate(feature: string, data: any): void {
    const callbacks = this.stateUpdateCallbacks.get(feature);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in state update callback for ${feature}:`, error);
        }
      });
    }
  }

  /**
   * Execute voice command with dashboard integration
   * @param intent - Parsed voice intent
   * @param executeCommand - Command execution function
   * @returns Command result with dashboard state updates
   */
  async executeWithIntegration(
    intent: ParsedIntent,
    executeCommand: (intent: ParsedIntent) => Promise<CommandResult>
  ): Promise<CommandResult> {
    // Execute the command
    const result = await executeCommand(intent);

    // If successful, notify relevant features of state update
    if (result.success) {
      this.notifyStateUpdate(intent.target, {
        intent,
        result,
        timestamp: new Date().toISOString()
      });

      // Trigger real-time UI updates across all views
      this.triggerCrossViewUpdates(intent, result);
    }

    return result;
  }

  /**
   * Trigger real-time updates across all dashboard views
   * @param intent - Parsed voice intent
   * @param result - Command result
   */
  private triggerCrossViewUpdates(intent: ParsedIntent, result: CommandResult): void {
    // Dispatch custom event for cross-view updates
    const event = new CustomEvent('voice-command-executed', {
      detail: {
        intent,
        result,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);

    // Update localStorage for persistent state
    this.updatePersistentState(intent, result);
  }

  /**
   * Update persistent state in localStorage
   * @param intent - Parsed voice intent
   * @param result - Command result
   */
  private updatePersistentState(intent: ParsedIntent, result: CommandResult): void {
    try {
      // Store last voice command for context
      localStorage.setItem('last_voice_command', JSON.stringify({
        intent,
        result,
        timestamp: new Date().toISOString()
      }));

      // Update feature-specific state
      if (intent.action === 'LOG_DATA' && result.data) {
        // Update feeding/medication/activity logs
        const stateKey = `${intent.target}_logs`;
        const existingLogs = JSON.parse(localStorage.getItem(stateKey) || '[]');
        existingLogs.push(result.data);
        localStorage.setItem(stateKey, JSON.stringify(existingLogs));
      }
    } catch (error) {
      console.error('Error updating persistent state:', error);
    }
  }

  /**
   * Get feature-specific voice commands
   * @param feature - Feature name
   * @returns Array of voice command examples
   */
  getFeatureCommands(feature: string): string[] {
    const commandMap: Record<string, string[]> = {
      'dashboard': [
        'Show all my pets',
        'Go to dashboard',
        'Show pet overview'
      ],
      'appointments': [
        'Go to appointments',
        'Schedule a vet appointment',
        'Show upcoming appointments',
        'Book appointment for [pet name]'
      ],
      'health': [
        'Show health records',
        'View medical history',
        'Check vaccination status',
        'Add health record'
      ],
      'medications': [
        'Open medication tracker',
        'What medications does [pet name] need?',
        'Add medication reminder',
        'Show medication schedule'
      ],
      'feeding': [
        'Log feeding for [pet name]',
        'Show feeding schedule',
        'Record meal time',
        'View feeding history'
      ],
      'profile': [
        'Go to profile',
        'Edit my profile',
        'View account settings'
      ],
      'community': [
        'Go to community',
        'Show pet community',
        'View social feed'
      ],
      'vet-search': [
        'Find a vet',
        'Search for veterinarians',
        'Locate nearby clinics'
      ]
    };

    return commandMap[feature] || [];
  }

  /**
   * Check if feature supports voice control
   * @param feature - Feature name
   * @returns True if feature has voice integration
   */
  isVoiceEnabled(feature: string): boolean {
    const voiceEnabledFeatures = [
      'dashboard',
      'appointments',
      'health',
      'medications',
      'feeding',
      'profile',
      'community',
      'vet-search',
      'expenses',
      'milestones'
    ];

    return voiceEnabledFeatures.includes(feature);
  }

  /**
   * Get current page context for voice commands
   * @returns Current page context information
   */
  getCurrentPageContext(): {
    page: string;
    feature: string;
    availableCommands: string[];
  } {
    const path = window.location.pathname;
    
    // Map paths to features
    const pathFeatureMap: Record<string, string> = {
      '/dashboard': 'dashboard',
      '/appointments': 'appointments',
      '/health-records': 'health',
      '/medications': 'medications',
      '/feeding': 'feeding',
      '/profile': 'profile',
      '/community': 'community',
      '/vet-search': 'vet-search',
      '/expenses': 'expenses',
      '/milestones': 'milestones'
    };

    const feature = pathFeatureMap[path] || 'dashboard';
    const availableCommands = this.getFeatureCommands(feature);

    return {
      page: path,
      feature,
      availableCommands
    };
  }
}

/**
 * Get dashboard integration instance
 */
export const getDashboardIntegration = () => DashboardIntegration.getInstance();

/**
 * Hook for components to register for voice command updates
 * @param feature - Feature name
 * @param callback - Callback function
 */
export const useVoiceIntegration = (feature: string, callback: Function) => {
  const integration = getDashboardIntegration();
  
  // Register callback on mount
  useEffect(() => {
    integration.registerStateUpdateCallback(feature, callback);
    
    // Cleanup on unmount
    return () => {
      integration.unregisterStateUpdateCallback(feature, callback);
    };
  }, [feature, callback, integration]);
};

// Export for use in other modules
export default DashboardIntegration;
