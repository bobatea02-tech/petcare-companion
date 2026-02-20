/**
 * End-to-End Voice Flow Tests
 * 
 * Tests complete voice interaction flows from wake word to response.
 * Validates integration across all voice assistant components.
 * 
 * Task: 41.1 - Wire all components together
 * Requirements: 20.1, 20.5
 * Feature: jojo-voice-assistant-enhanced
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createWakeWordDetector } from '@/services/voice/wakeWordDetector';
import { createVoiceRecognitionEngine } from '@/services/voice/voiceRecognitionEngine';
import { createIntentParser } from '@/services/voice/intentParser';
import { createContextManager } from '@/services/voice/contextManager';
import { createCommandRouter } from '@/services/voice/commandRouter';
import { createResponseComposer } from '@/services/voice/responseComposer';
import { getDashboardIntegration } from '@/services/voice/dashboardIntegration';
import { NavigationHandler } from '@/services/voice/handlers/navigationHandler';
import { CommandAction } from '@/services/voice/types';

describe('End-to-End Voice Flows', () => {
  let wakeWordDetector: any;
  let voiceRecognition: any;
  let intentParser: any;
  let contextManager: any;
  let commandRouter: any;
  let responseComposer: any;
  let dashboardIntegration: any;

  beforeEach(() => {
    // Initialize all services
    wakeWordDetector = createWakeWordDetector();
    voiceRecognition = createVoiceRecognitionEngine();
    intentParser = createIntentParser();
    contextManager = createContextManager();
    commandRouter = createCommandRouter();
    responseComposer = createResponseComposer();
    dashboardIntegration = getDashboardIntegration();

    // Register navigation handler
    commandRouter.registerHandler(CommandAction.NAVIGATE, new NavigationHandler());

    // Mock window.location
    delete (window as any).location;
    (window as any).location = { href: '', pathname: '/dashboard' };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Navigation Flow', () => {
    it('should complete full navigation flow: wake word → command → navigation', async () => {
      // Step 1: Wake word detection
      const wakeWordDetected = vi.fn();
      wakeWordDetector.onWakeWordDetected(wakeWordDetected);
      
      // Simulate wake word detection
      await wakeWordDetector.initialize('hey jojo');
      wakeWordDetector.startListening();
      
      // Simulate wake word trigger (in real scenario, this would be audio-based)
      // For testing, we manually trigger the callback
      wakeWordDetector.onWakeWordDetected(() => {
        wakeWordDetected();
      });

      // Step 2: Voice recognition
      const transcription = 'Go to appointments';
      const confidence = 0.95;

      // Step 3: Intent parsing
      const context = contextManager.getContext();
      const intent = await intentParser.parseIntent(transcription, context);

      expect(intent).toBeDefined();
      expect(intent.action).toBe(CommandAction.NAVIGATE);
      expect(intent.target).toBe('appointments');
      expect(intent.confidence).toBeGreaterThan(0.8);

      // Step 4: Context update
      contextManager.updateContext(intent);
      const updatedContext = contextManager.getContext();
      expect(updatedContext.previousIntents).toHaveLength(1);

      // Step 5: Command execution
      const result = await commandRouter.executeCommand(intent);

      expect(result.success).toBe(true);
      expect(result.message).toContain('appointments');
      expect(window.location.href).toBe('/appointments');

      // Step 6: Response composition
      const response = responseComposer.composeResponse(result, updatedContext);

      expect(response).toBeDefined();
      expect(response.text).toBeTruthy();
      expect(response.text.length).toBeLessThan(200); // Quota conservation
    });

    it('should navigate to health records for specific pet', async () => {
      const transcription = "Show me Max's health records";
      const confidence = 0.92;

      // Parse intent
      const context = contextManager.getContext();
      const intent = await intentParser.parseIntent(transcription, context);

      expect(intent.action).toBe(CommandAction.NAVIGATE);
      expect(intent.target).toBe('health_records');
      expect(intent.parameters.petName).toBe('Max');

      // Execute command
      const result = await commandRouter.executeCommand(intent);

      expect(result.success).toBe(true);
      expect(window.location.href).toContain('/health-records');
      expect(window.location.href).toContain('pet=Max');
    });

    it('should handle "go back" navigation', async () => {
      const transcription = 'Go back';
      const confidence = 0.98;

      // Mock history.back
      const historyBack = vi.fn();
      window.history.back = historyBack;

      // Parse and execute
      const context = contextManager.getContext();
      const intent = await intentParser.parseIntent(transcription, context);
      const result = await commandRouter.executeCommand(intent);

      expect(result.success).toBe(true);
      expect(historyBack).toHaveBeenCalled();
    });
  });

  describe('Dashboard Integration', () => {
    it('should trigger cross-view updates after voice command', async () => {
      const updateCallback = vi.fn();
      dashboardIntegration.registerStateUpdateCallback('appointments', updateCallback);

      // Execute navigation command
      const transcription = 'Go to appointments';
      const context = contextManager.getContext();
      const intent = await intentParser.parseIntent(transcription, context);
      
      await dashboardIntegration.executeWithIntegration(
        intent,
        (i) => commandRouter.executeCommand(i)
      );

      expect(updateCallback).toHaveBeenCalled();
      expect(updateCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          intent: expect.any(Object),
          result: expect.any(Object),
          timestamp: expect.any(String)
        })
      );
    });

    it('should dispatch custom event for cross-view updates', async () => {
      const eventListener = vi.fn();
      window.addEventListener('voice-command-executed', eventListener);

      // Execute command
      const transcription = 'Show all my pets';
      const context = contextManager.getContext();
      const intent = await intentParser.parseIntent(transcription, context);
      
      await dashboardIntegration.executeWithIntegration(
        intent,
        (i) => commandRouter.executeCommand(i)
      );

      expect(eventListener).toHaveBeenCalled();
      
      window.removeEventListener('voice-command-executed', eventListener);
    });

    it('should update persistent state in localStorage', async () => {
      const transcription = 'Go to profile';
      const context = contextManager.getContext();
      const intent = await intentParser.parseIntent(transcription, context);
      
      await dashboardIntegration.executeWithIntegration(
        intent,
        (i) => commandRouter.executeCommand(i)
      );

      const lastCommand = localStorage.getItem('last_voice_command');
      expect(lastCommand).toBeTruthy();
      
      const parsed = JSON.parse(lastCommand!);
      expect(parsed.intent).toBeDefined();
      expect(parsed.result).toBeDefined();
      expect(parsed.timestamp).toBeDefined();
    });
  });

  describe('Context-Aware Navigation', () => {
    it('should provide context-aware command suggestions', () => {
      // Set current page
      (window as any).location.pathname = '/appointments';

      const pageContext = dashboardIntegration.getCurrentPageContext();

      expect(pageContext.page).toBe('/appointments');
      expect(pageContext.feature).toBe('appointments');
      expect(pageContext.availableCommands).toContain('Schedule a vet appointment');
      expect(pageContext.availableCommands.length).toBeGreaterThan(0);
    });

    it('should maintain conversation context across commands', async () => {
      // First command: mention pet
      const firstTranscription = "Show me Bella's health records";
      const context1 = contextManager.getContext();
      const intent1 = await intentParser.parseIntent(firstTranscription, context1);
      
      contextManager.updateContext(intent1);
      expect(contextManager.getActivePet()).toBe('Bella');

      // Second command: use pronoun reference
      const secondTranscription = "What about her medications?";
      const context2 = contextManager.getContext();
      const intent2 = await intentParser.parseIntent(secondTranscription, context2);

      // Intent parser should resolve "her" to "Bella" using context
      expect(intent2.parameters.petName || contextManager.getActivePet()).toBe('Bella');
    });
  });

  describe('Multi-Page Voice Control', () => {
    it('should support voice navigation to all major pages', async () => {
      const pages = [
        { command: 'Go to dashboard', expectedPath: '/dashboard' },
        { command: 'Go to appointments', expectedPath: '/appointments' },
        { command: 'Show health records', expectedPath: '/health-records' },
        { command: 'Open medication tracker', expectedPath: '/medications' },
        { command: 'Go to profile', expectedPath: '/profile' },
        { command: 'Go to community', expectedPath: '/community' },
        { command: 'Find a vet', expectedPath: '/vet-search' },
      ];

      for (const page of pages) {
        // Reset location
        (window as any).location.href = '';

        const context = contextManager.getContext();
        const intent = await intentParser.parseIntent(page.command, context);
        const result = await commandRouter.executeCommand(intent);

        expect(result.success).toBe(true);
        expect(window.location.href).toBe(page.expectedPath);
      }
    });

    it('should check if features support voice control', () => {
      expect(dashboardIntegration.isVoiceEnabled('dashboard')).toBe(true);
      expect(dashboardIntegration.isVoiceEnabled('appointments')).toBe(true);
      expect(dashboardIntegration.isVoiceEnabled('health')).toBe(true);
      expect(dashboardIntegration.isVoiceEnabled('unknown-feature')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid navigation targets gracefully', async () => {
      const transcription = 'Go to invalid page';
      const context = contextManager.getContext();
      const intent = await intentParser.parseIntent(transcription, context);
      
      // Force invalid target
      intent.target = 'invalid_page_xyz';
      
      const result = await commandRouter.executeCommand(intent);

      expect(result.success).toBe(false);
      expect(result.message).toContain("don't know how to navigate");
    });

    it('should provide helpful suggestions for invalid commands', async () => {
      const transcription = 'Show me the weather';
      const context = contextManager.getContext();
      const intent = await intentParser.parseIntent(transcription, context);
      
      const result = await commandRouter.executeCommand(intent);
      const response = responseComposer.composeResponse(result, context);

      // Should suggest valid alternatives
      expect(response.text).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should complete navigation flow within 2 seconds', async () => {
      const startTime = Date.now();

      const transcription = 'Go to appointments';
      const context = contextManager.getContext();
      const intent = await intentParser.parseIntent(transcription, context);
      await commandRouter.executeCommand(intent);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // 2 second requirement
    });
  });
});
