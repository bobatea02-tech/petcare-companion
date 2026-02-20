/**
 * Unit tests for query result summarization
 * Feature: jojo-voice-assistant-enhanced
 * Task: 32.1 - Add intelligent summarization for large result sets
 * Requirement 6.6: Summarize key information and offer to show details
 */

import { describe, it, expect } from 'vitest';
import { responseComposer } from '../../services/voice/responseComposer';
import { CommandResult, ConversationContext, CommandAction } from '../../services/voice/types';

describe('Query Result Summarization (Requirement 6.6)', () => {
  const mockContext: ConversationContext = {
    previousIntents: [],
    activePet: 'Buddy',
    currentPage: '/dashboard',
    recentEntities: []
  };

  describe('Appointments Summarization', () => {
    it('should summarize when more than 3 appointments exist', () => {
      const result: CommandResult = {
        success: true,
        data: {
          appointments: [
            { id: '1', date: '2026-03-01', time: '10:00 AM', clinic: 'Clinic A' },
            { id: '2', date: '2026-03-05', time: '2:00 PM', clinic: 'Clinic B' },
            { id: '3', date: '2026-03-10', time: '11:00 AM', clinic: 'Clinic C' },
            { id: '4', date: '2026-03-15', time: '3:00 PM', clinic: 'Clinic D' }
          ]
        },
        message: 'query_appointments',
        visualComponent: 'AppointmentsList',
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      expect(response.text).toContain('4 appointments');
      expect(response.text.toLowerCase()).toContain('show more details');
      expect(response.displayText).toContain('summarized');
    });

    it('should NOT summarize when 3 or fewer appointments exist', () => {
      const result: CommandResult = {
        success: true,
        data: {
          appointments: [
            { id: '1', date: '2026-03-01', time: '10:00 AM', clinic: 'Clinic A' },
            { id: '2', date: '2026-03-05', time: '2:00 PM', clinic: 'Clinic B' }
          ]
        },
        message: 'query_appointments',
        visualComponent: 'AppointmentsList',
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      expect(response.text.toLowerCase()).not.toContain('show more details');
      expect(response.displayText).not.toContain('summarized');
    });
  });

  describe('Medications Summarization', () => {
    it('should summarize when more than 3 medications exist', () => {
      const today = new Date();
      const result: CommandResult = {
        success: true,
        data: {
          medications: [
            { id: '1', name: 'Med A', dueDate: today.toISOString() },
            { id: '2', name: 'Med B', dueDate: today.toISOString() },
            { id: '3', name: 'Med C', dueDate: new Date(today.getTime() + 86400000).toISOString() },
            { id: '4', name: 'Med D', dueDate: new Date(today.getTime() + 86400000).toISOString() }
          ]
        },
        message: 'query_medications',
        visualComponent: 'MedicationsList',
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      expect(response.text).toContain('due today');
      expect(response.text).toContain('4 total');
      expect(response.text.toLowerCase()).toContain('show more details');
    });

    it('should extract due today count correctly', () => {
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 86400000);
      
      const result: CommandResult = {
        success: true,
        data: {
          medications: [
            { id: '1', name: 'Med A', dueDate: today.toISOString() },
            { id: '2', name: 'Med B', dueDate: today.toISOString() },
            { id: '3', name: 'Med C', dueDate: tomorrow.toISOString() },
            { id: '4', name: 'Med D', dueDate: tomorrow.toISOString() }
          ]
        },
        message: 'query_medications',
        visualComponent: 'MedicationsList',
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      expect(response.text).toContain('2 medication');
      expect(response.text).toContain('due today');
      expect(response.text).toContain('4 total');
    });
  });

  describe('Feeding History Summarization', () => {
    it('should summarize when more than 5 feeding logs exist', () => {
      const result: CommandResult = {
        success: true,
        data: {
          feedingLogs: [
            { id: '1', amount: 2, unit: 'cups', timestamp: new Date().toISOString() },
            { id: '2', amount: 2, unit: 'cups', timestamp: new Date().toISOString() },
            { id: '3', amount: 2, unit: 'cups', timestamp: new Date().toISOString() },
            { id: '4', amount: 2, unit: 'cups', timestamp: new Date().toISOString() },
            { id: '5', amount: 2, unit: 'cups', timestamp: new Date().toISOString() },
            { id: '6', amount: 2, unit: 'cups', timestamp: new Date().toISOString() }
          ]
        },
        message: 'query_feeding',
        visualComponent: 'FeedingHistoryChart',
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      expect(response.text).toContain('6 feeding');
      expect(response.text.toLowerCase()).toContain('show more details');
      expect(response.displayText).toContain('summarized');
    });

    it('should NOT summarize when 5 or fewer feeding logs exist', () => {
      const result: CommandResult = {
        success: true,
        data: {
          feedingLogs: [
            { id: '1', amount: 2, unit: 'cups', timestamp: new Date().toISOString() },
            { id: '2', amount: 2, unit: 'cups', timestamp: new Date().toISOString() }
          ]
        },
        message: 'query_feeding',
        visualComponent: 'FeedingHistoryChart',
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      expect(response.text.toLowerCase()).not.toContain('show more details');
      expect(response.displayText).not.toContain('summarized');
    });
  });

  describe('Health Records Summarization', () => {
    it('should summarize when more than 4 health records exist', () => {
      const result: CommandResult = {
        success: true,
        data: {
          healthRecords: [
            { id: '1', type: 'vaccination', date: '2026-01-15' },
            { id: '2', type: 'checkup', date: '2026-01-10' },
            { id: '3', type: 'vaccination', date: '2026-01-05' },
            { id: '4', type: 'checkup', date: '2026-01-01' },
            { id: '5', type: 'vaccination', date: '2025-12-20' }
          ]
        },
        message: 'query_health_records',
        visualComponent: 'HealthRecordsList',
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      expect(response.text).toContain('5 health records');
      expect(response.text.toLowerCase()).toContain('show more details');
      expect(response.displayText).toContain('summarized');
    });

    it('should NOT summarize when 4 or fewer health records exist', () => {
      const result: CommandResult = {
        success: true,
        data: {
          healthRecords: [
            { id: '1', type: 'vaccination', date: '2026-01-15' },
            { id: '2', type: 'checkup', date: '2026-01-10' }
          ]
        },
        message: 'query_health_records',
        visualComponent: 'HealthRecordsList',
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      expect(response.text.toLowerCase()).not.toContain('show more details');
      expect(response.displayText).not.toContain('summarized');
    });
  });

  describe('Show More Details Response', () => {
    it('should generate appropriate response for full appointments', () => {
      const result: CommandResult = {
        success: true,
        data: {
          appointments: [
            { id: '1', date: '2026-03-01', time: '10:00 AM' },
            { id: '2', date: '2026-03-05', time: '2:00 PM' },
            { id: '3', date: '2026-03-10', time: '11:00 AM' },
            { id: '4', date: '2026-03-15', time: '3:00 PM' }
          ]
        },
        message: 'show_full_appointments',
        visualComponent: 'AppointmentsList',
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      expect(response.text.toLowerCase()).toContain('all');
      expect(response.text).toContain('4 appointments');
    });

    it('should generate appropriate response for full medications', () => {
      const result: CommandResult = {
        success: true,
        data: {
          medications: [
            { id: '1', name: 'Med A' },
            { id: '2', name: 'Med B' },
            { id: '3', name: 'Med C' }
          ]
        },
        message: 'show_full_medications',
        visualComponent: 'MedicationsList',
        requiresFollowUp: false,
        followUpPrompt: null
      };

      const response = responseComposer.composeResponse(result, mockContext);

      expect(response.text.toLowerCase()).toMatch(/all|complete/);
      expect(response.text).toContain('3 medications');
    });
  });
});
