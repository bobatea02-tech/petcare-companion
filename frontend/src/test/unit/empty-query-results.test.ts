/**
 * Unit tests for empty query results handling
 * Feature: jojo-voice-assistant-enhanced
 * Task: 31.1 - Add graceful handling for empty query results
 * Requirement: 6.5
 */

import { describe, it, expect } from 'vitest';
import { responseComposer } from '../../services/voice/responseComposer';
import { CommandResult, ConversationContext, CommandAction } from '../../services/voice/types';

describe('Empty Query Results Handling (Requirement 6.5)', () => {
  const mockContext: ConversationContext = {
    previousIntents: [],
    activePet: 'Buddy',
    currentPage: '/dashboard',
    recentEntities: []
  };

  describe('Empty Appointments', () => {
    it('should inform user when no appointments exist', () => {
      const result: CommandResult = {
        success: true,
        data: { appointments: [] },
        message: 'query appointments',
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      expect(response.text.toLowerCase()).toMatch(/no|doesn't have|haven't/);
      expect(response.text).toContain('appointment');
      expect(response.text.toLowerCase()).toMatch(/schedule|add/);
    });

    it('should provide helpful suggestion for empty appointments', () => {
      const result: CommandResult = {
        success: true,
        data: { appointments: [] },
        message: 'query appointments',
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      // Should suggest scheduling an appointment
      expect(response.text.toLowerCase()).toMatch(/schedule|vet visit/);
    });
  });

  describe('Empty Medications', () => {
    it('should inform user when no medications exist', () => {
      const result: CommandResult = {
        success: true,
        data: { medications: [] },
        message: 'query medications',
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      expect(response.text.toLowerCase()).toMatch(/no|doesn't have|haven't/);
      expect(response.text).toContain('medication');
    });

    it('should provide helpful suggestion for empty medications', () => {
      const result: CommandResult = {
        success: true,
        data: { medications: [] },
        message: 'query medications',
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      // Should suggest adding a medication
      expect(response.text.toLowerCase()).toMatch(/add|reminder/);
    });
  });

  describe('Empty Feeding History', () => {
    it('should inform user when no feeding data exists', () => {
      const result: CommandResult = {
        success: true,
        data: { feedingLogs: [] },
        message: 'query feeding history',
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      expect(response.text.toLowerCase()).toMatch(/no|doesn't have|haven't/);
      expect(response.text.toLowerCase()).toMatch(/feeding|logged/);
    });

    it('should provide helpful suggestion for empty feeding history', () => {
      const result: CommandResult = {
        success: true,
        data: { feedingLogs: [] },
        message: 'query feeding history',
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      // Should suggest logging a feeding
      expect(response.text.toLowerCase()).toMatch(/log|add|entry/);
    });
  });

  describe('Empty Health Records', () => {
    it('should inform user when no health records exist', () => {
      const result: CommandResult = {
        success: true,
        data: { healthRecords: [] },
        message: 'query health records',
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      expect(response.text.toLowerCase()).toMatch(/no|doesn't have|haven't/);
      expect(response.text.toLowerCase()).toMatch(/health record/);
    });

    it('should provide helpful suggestion for empty health records', () => {
      const result: CommandResult = {
        success: true,
        data: { healthRecords: [] },
        message: 'query health records',
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      // Should suggest adding a health record
      expect(response.text.toLowerCase()).toMatch(/add|record/);
    });
  });

  describe('Missing Health Score', () => {
    it('should inform user when health score is not available', () => {
      const result: CommandResult = {
        success: true,
        data: { healthScore: null },
        message: 'query health score',
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      expect(response.text.toLowerCase()).toMatch(/no|don't have/);
      expect(response.text.toLowerCase()).toMatch(/health/);
    });

    it('should provide helpful suggestion for missing health score', () => {
      const result: CommandResult = {
        success: true,
        data: { healthScore: undefined },
        message: 'query health score',
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      // Should suggest adding health data
      expect(response.text.toLowerCase()).toMatch(/add|record/);
    });
  });

  describe('Warm and Friendly Tone', () => {
    it('should maintain JoJo\'s warm, friendly tone in empty result responses', () => {
      const result: CommandResult = {
        success: true,
        data: { appointments: [] },
        message: 'query appointments',
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      // Should use friendly language
      expect(response.text.toLowerCase()).toMatch(/would you like|want to/);
    });

    it('should include pet name in empty result responses', () => {
      const result: CommandResult = {
        success: true,
        data: { medications: [] },
        message: 'query medications',
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      // Should mention the pet's name
      expect(response.text).toContain('Buddy');
    });
  });

  describe('Display Text for Empty Results', () => {
    it('should provide clear display text for empty appointments', () => {
      const result: CommandResult = {
        success: true,
        data: { appointments: [] },
        message: 'query appointments',
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      expect(response.displayText).toBeTruthy();
      expect(response.displayText.toLowerCase()).toMatch(/no|found/);
    });
  });
});
