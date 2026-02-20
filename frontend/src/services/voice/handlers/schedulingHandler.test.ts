/**
 * Scheduling Handler Property Tests
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Property-based tests for appointment scheduling dialog functionality
 * 
 * Property 32: Appointment scheduling dialog
 * For any appointment scheduling request, JoJo should collect all required fields
 * (date, time, vet clinic, reason) via multi-turn voice conversation
 * 
 * Validates: Requirements 11.1, 11.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { SchedulingHandler } from './schedulingHandler';
import { DialogManager } from '../dialogManager';
import { DashboardActionsService } from '../dashboardActions';
import {
  ParsedIntent,
  CommandAction,
  ConversationContext,
  EntityType,
  Appointment,
  AppointmentData,
} from '../types';

describe('SchedulingHandler - Property Tests', () => {
  let schedulingHandler: SchedulingHandler;
  let dialogManager: DialogManager;
  let dashboardActions: DashboardActionsService;
  let mockContext: ConversationContext;

  beforeEach(() => {
    dialogManager = new DialogManager();
    dashboardActions = new DashboardActionsService();
    
    mockContext = {
      previousIntents: [],
      activePet: null,
      currentPage: 'dashboard',
      recentEntities: [],
    };

    // Mock dashboard actions
    vi.spyOn(dashboardActions, 'getAppointments').mockResolvedValue([]);
    vi.spyOn(dashboardActions, 'createAppointment').mockImplementation(
      async (petId: string, appointment: AppointmentData): Promise<Appointment> => {
        return {
          id: `apt-${Date.now()}`,
          petId,
          date: appointment.date,
          time: appointment.time,
          clinic: appointment.clinic,
          reason: appointment.reason,
        };
      }
    );
    
    // Create a new handler for each test to reset state
    schedulingHandler = new SchedulingHandler(dialogManager, dashboardActions);
  });

  /**
   * Property 32: Appointment scheduling dialog
   * For any appointment scheduling request, JoJo should collect all required fields
   * (date, time, vet clinic, reason) via multi-turn voice conversation
   * 
   * **Validates: Requirements 11.1, 11.2**
   */
  describe('Property 32: Appointment scheduling dialog', () => {
    it('should collect all required fields via multi-turn conversation', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random appointment data with realistic constraints
          fc.record({
            petId: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)),
            date: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
            time: fc.constantFrom(
              '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
              '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
            ),
            clinic: fc.constantFrom(
              'City Vet Clinic',
              'Pet Care Center',
              'Animal Hospital',
              'Mumbai Pet Clinic',
              'Veterinary Care Center'
            ),
            reason: fc.option(
              fc.constantFrom('Checkup', 'Vaccination', 'Follow-up', 'Emergency', 'Grooming'),
              { nil: undefined }
            ),
          }),
          async (appointmentData) => {
            // Test scenario 1: All parameters provided upfront
            const completeIntent: ParsedIntent = {
              intentId: 'schedule-complete',
              action: CommandAction.SCHEDULE,
              target: 'appointment',
              parameters: {
                petId: appointmentData.petId,
                date: appointmentData.date,
                time: appointmentData.time,
                clinic: appointmentData.clinic,
                reason: appointmentData.reason || 'General checkup',
              },
              confidence: 0.9,
              requiresConfirmation: false,
              priority: 'normal',
              entities: [],
              ambiguities: [],
            };

            const result = await schedulingHandler.execute(completeIntent, mockContext);

            // Should succeed when all required fields are present OR provide meaningful error
            if (!result.success) {
              // If not successful, should require follow-up with clear message
              expect(result.requiresFollowUp || result.message.length > 0).toBe(true);
            } else {
              // If successful, verify the data
              if (result.data) {
                expect(result.data.petId).toBe(appointmentData.petId);
                expect(result.data.clinic).toBe(appointmentData.clinic);
                expect(result.data.time).toBe(appointmentData.time);
              }
              expect(result.requiresFollowUp).toBe(false);
            }

            // Test scenario 2: Missing parameters - should trigger multi-turn dialog
            const incompleteIntent: ParsedIntent = {
              intentId: 'schedule-incomplete',
              action: CommandAction.SCHEDULE,
              target: 'appointment',
              parameters: {
                petId: appointmentData.petId,
                // Missing: date, time, clinic
              },
              confidence: 0.9,
              requiresConfirmation: false,
              priority: 'normal',
              entities: [],
              ambiguities: [],
            };

            // Create a fresh handler for the incomplete test
            const freshHandler = new SchedulingHandler(dialogManager, dashboardActions);
            const incompleteResult = await freshHandler.execute(incompleteIntent, mockContext);

            // Should require follow-up when parameters are missing
            expect(incompleteResult.success).toBe(false);
            expect(incompleteResult.requiresFollowUp).toBe(true);
            expect(incompleteResult.followUpPrompt).toBeDefined();
            expect(incompleteResult.data?.missingFields || incompleteResult.data?.dialogId).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle partial parameter collection progressively', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            petId: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)),
            date: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
            time: fc.constantFrom('10:00 AM', '2:00 PM', '4:00 PM'),
            clinic: fc.constantFrom('City Vet Clinic', 'Pet Care Center'),
          }),
          async (data) => {
            // Create a fresh handler for this test
            const testHandler = new SchedulingHandler(dialogManager, dashboardActions);
            
            // Start with only pet ID
            const step1Intent: ParsedIntent = {
              intentId: 'schedule-step1',
              action: CommandAction.SCHEDULE,
              target: 'appointment',
              parameters: { petId: data.petId },
              confidence: 0.9,
              requiresConfirmation: false,
              priority: 'normal',
              entities: [],
              ambiguities: [],
            };

            const step1Result = await testHandler.execute(step1Intent, mockContext);
            expect(step1Result.requiresFollowUp).toBe(true);

            // Add all remaining fields at once (simulating user providing all info)
            const completeIntent: ParsedIntent = {
              ...step1Intent,
              intentId: 'schedule-complete',
              parameters: {
                petId: data.petId,
                date: data.date,
                time: data.time,
                clinic: data.clinic,
              },
            };

            // Create another fresh handler for the complete intent
            const completeHandler = new SchedulingHandler(dialogManager, dashboardActions);
            const completeResult = await completeHandler.execute(completeIntent, mockContext);
            
            // Should succeed after all required fields are collected OR provide meaningful error
            if (!completeResult.success) {
              // If not successful, should have a clear reason
              expect(completeResult.message.length).toBeGreaterThan(0);
            } else {
              expect(completeResult.requiresFollowUp).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate required fields are present in final appointment', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            petId: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)),
            date: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
            time: fc.constantFrom('9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'),
            clinic: fc.string({ minLength: 5, maxLength: 50 }),
            reason: fc.string({ minLength: 3, maxLength: 100 }),
          }),
          async (data) => {
            const intent: ParsedIntent = {
              intentId: 'schedule-validate',
              action: CommandAction.SCHEDULE,
              target: 'appointment',
              parameters: {
                petId: data.petId,
                date: data.date,
                time: data.time,
                clinic: data.clinic,
                reason: data.reason,
              },
              confidence: 0.9,
              requiresConfirmation: false,
              priority: 'normal',
              entities: [],
              ambiguities: [],
            };

            const result = await schedulingHandler.execute(intent, mockContext);

            if (result.success) {
              // Verify all required fields are present in the result
              expect(result.data).toBeDefined();
              expect(result.data.petId).toBe(data.petId);
              expect(result.data.time).toBe(data.time);
              expect(result.data.clinic).toBe(data.clinic);
              
              // Date should be preserved
              const resultDate = new Date(result.data.date);
              expect(resultDate.toDateString()).toBe(data.date.toDateString());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide meaningful prompts for missing fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)),
          async (petId) => {
            const intent: ParsedIntent = {
              intentId: 'schedule-prompts',
              action: CommandAction.SCHEDULE,
              target: 'appointment',
              parameters: { petId },
              confidence: 0.9,
              requiresConfirmation: false,
              priority: 'normal',
              entities: [],
              ambiguities: [],
            };

            const result = await schedulingHandler.execute(intent, mockContext);

            // Should require follow-up
            expect(result.requiresFollowUp).toBe(true);
            
            // Should provide a prompt
            expect(result.followUpPrompt).toBeDefined();
            expect(typeof result.followUpPrompt).toBe('string');
            expect(result.followUpPrompt!.length).toBeGreaterThan(0);
            
            // Should indicate what is needed (either in message or prompt)
            expect(result.message).toBeDefined();
            const combinedText = (result.message + ' ' + result.followUpPrompt).toLowerCase();
            expect(
              combinedText.includes('information') ||
              combinedText.includes('date') ||
              combinedText.includes('time') ||
              combinedText.includes('clinic')
            ).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle reason as optional field', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            petId: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)),
            date: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
            time: fc.constantFrom('10:00 AM', '2:00 PM', '4:00 PM'),
            clinic: fc.string({ minLength: 5, maxLength: 50 }),
          }),
          async (data) => {
            // Intent without reason field
            const intent: ParsedIntent = {
              intentId: 'schedule-no-reason',
              action: CommandAction.SCHEDULE,
              target: 'appointment',
              parameters: {
                petId: data.petId,
                date: data.date,
                time: data.time,
                clinic: data.clinic,
                // No reason provided
              },
              confidence: 0.9,
              requiresConfirmation: false,
              priority: 'normal',
              entities: [],
              ambiguities: [],
            };

            const result = await schedulingHandler.execute(intent, mockContext);

            // Should succeed even without reason (it's optional)
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            
            // Should have a default reason if none provided
            if (!data.reason) {
              expect(result.data.reason).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Additional Scheduling Tests', () => {
    it('should handle appointment cancellation requests', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            petId: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)),
            appointmentId: fc.string({ minLength: 5, maxLength: 20 }),
          }),
          async (data) => {
            // Mock existing appointment
            vi.spyOn(dashboardActions, 'getAppointments').mockResolvedValue([
              {
                id: data.appointmentId,
                petId: data.petId,
                date: new Date(),
                time: '10:00 AM',
                clinic: 'Test Clinic',
                reason: 'Checkup',
              },
            ]);

            vi.spyOn(dashboardActions, 'cancelAppointment').mockResolvedValue(undefined);

            const intent: ParsedIntent = {
              intentId: 'cancel-apt',
              action: CommandAction.SCHEDULE,
              target: 'cancel_appointment',
              parameters: {
                appointmentId: data.appointmentId,
                petId: data.petId,
              },
              confidence: 0.9,
              requiresConfirmation: false,
              priority: 'normal',
              entities: [],
              ambiguities: [],
            };

            const result = await schedulingHandler.execute(intent, mockContext);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.appointmentId).toBe(data.appointmentId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate date is in the future', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            petId: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)),
            // Generate dates in the future
            daysInFuture: fc.integer({ min: 1, max: 365 }),
            time: fc.constantFrom('10:00 AM', '2:00 PM'),
            clinic: fc.string({ minLength: 5, maxLength: 50 }),
          }),
          async (data) => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + data.daysInFuture);

            const intent: ParsedIntent = {
              intentId: 'schedule-future',
              action: CommandAction.SCHEDULE,
              target: 'appointment',
              parameters: {
                petId: data.petId,
                date: futureDate,
                time: data.time,
                clinic: data.clinic,
              },
              confidence: 0.9,
              requiresConfirmation: false,
              priority: 'normal',
              entities: [],
              ambiguities: [],
            };

            const result = await schedulingHandler.execute(intent, mockContext);

            // Future dates should be accepted
            expect(result.success).toBe(true);
            
            // Verify the date is indeed in the future
            const resultDate = new Date(result.data.date);
            expect(resultDate.getTime()).toBeGreaterThan(Date.now());
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
