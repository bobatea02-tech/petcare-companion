/**
 * Property Test: Intent Parsing Latency
 * Feature: jojo-voice-assistant-enhanced
 * Property 5: Intent parsing latency
 * 
 * For any completed speech-to-text transcription, the Intent_Parser should extract 
 * command intent and parameters within 1 second
 * 
 * Validates: Requirements 2.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { IntentParserService } from '@/services/voice/intentParser';
import { ConversationContext, CommandAction } from '@/services/voice/types';
import { api } from '@/lib/api';

// Mock API module
vi.mock('@/lib/api', () => ({
  api: {
    jojoChat: vi.fn()
  }
}));

describe('Property 5: Intent Parsing Latency', () => {
  let intentParser: IntentParserService;

  beforeEach(() => {
    intentParser = new IntentParserService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should parse intent within 1000ms for any valid transcription', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various transcription patterns
        fc.oneof(
          // Navigation commands
          fc.constantFrom(
            'Go to appointments',
            'Show me health records',
            'Open medication tracker',
            'Navigate to feeding schedule',
            'Show all my pets'
          ),
          // Data logging commands
          fc.constantFrom(
            'Log feeding for Max',
            'Record medication for Bella',
            'Add weight for Charlie',
            'Log walk activity for Luna'
          ),
          // Query commands
          fc.constantFrom(
            'When is the next appointment?',
            'What medications does Max need today?',
            'Show feeding history for Bella',
            'What is Charlie\'s health score?'
          ),
          // Scheduling commands
          fc.constantFrom(
            'Schedule a vet appointment for Max',
            'Book appointment for Bella tomorrow',
            'Cancel appointment for Charlie'
          )
        ),
        // Generate random API response delays (simulating network variability)
        fc.integer({ min: 50, max: 800 }),
        async (transcription, apiDelay) => {
          // Mock API response with simulated delay
          const mockResponse = {
            data: {
              response: JSON.stringify({
                action: 'navigate',
                target: 'appointments',
                parameters: {},
                confidence: 0.85,
                requiresConfirmation: false,
                ambiguities: []
              })
            },
            error: null
          };

          (api.jojoChat as any).mockImplementation(() => 
            new Promise(resolve => setTimeout(() => resolve(mockResponse), apiDelay))
          );

          // Create minimal context
          const context: ConversationContext = {
            previousIntents: [],
            activePet: null,
            currentPage: 'dashboard',
            recentEntities: []
          };

          // Measure parsing time
          const startTime = Date.now();
          const intent = await intentParser.parseIntent(transcription, context);
          const endTime = Date.now();
          const latency = endTime - startTime;

          // Requirement 2.2: Intent parsing within 1 second
          expect(latency).toBeLessThanOrEqual(1000);

          // Verify intent was successfully parsed
          expect(intent).toBeDefined();
          expect(intent.intentId).toBeDefined();
          expect(intent.action).toBeDefined();
          expect(intent.confidence).toBeGreaterThanOrEqual(0);
          expect(intent.confidence).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  }, 120000); // 2 minute timeout for 100 runs

  it('should maintain latency under 1000ms with varying context complexity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }),
        fc.array(
          fc.record({
            action: fc.constantFrom(...Object.values(CommandAction)),
            target: fc.string({ minLength: 3, maxLength: 20 })
          }),
          { minLength: 0, maxLength: 10 }
        ),
        fc.option(fc.string({ minLength: 3, maxLength: 20 }), { nil: null }),
        fc.integer({ min: 50, max: 800 }),
        async (transcription, previousIntents, activePet, apiDelay) => {
          // Mock API response
          const mockResponse = {
            data: {
              response: JSON.stringify({
                action: 'query',
                target: 'health',
                parameters: {},
                confidence: 0.75,
                requiresConfirmation: false,
                ambiguities: []
              })
            },
            error: null
          };

          (api.jojoChat as any).mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve(mockResponse), apiDelay))
          );

          // Create context with varying complexity
          const context: ConversationContext = {
            previousIntents: previousIntents.map((pi, idx) => ({
              intentId: `intent_${idx}`,
              action: pi.action,
              target: pi.target,
              parameters: {},
              confidence: 0.8,
              requiresConfirmation: false,
              priority: 'normal' as const,
              entities: [],
              ambiguities: []
            })),
            activePet,
            currentPage: 'dashboard',
            recentEntities: []
          };

          // Measure parsing time
          const startTime = Date.now();
          const intent = await intentParser.parseIntent(transcription, context);
          const endTime = Date.now();
          const latency = endTime - startTime;

          // Verify latency requirement regardless of context complexity
          expect(latency).toBeLessThanOrEqual(1000);
          expect(intent).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);

  it('should handle API failures gracefully within latency bounds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'Show appointments',
          'Log feeding',
          'What medications are due?',
          'Schedule vet visit'
        ),
        fc.integer({ min: 100, max: 500 }),
        async (transcription, failureDelay) => {
          // Mock API failure with delay
          (api.jojoChat as any).mockImplementation(() =>
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('API Error')), failureDelay)
            )
          );

          const context: ConversationContext = {
            previousIntents: [],
            activePet: null,
            currentPage: 'dashboard',
            recentEntities: []
          };

          // Measure fallback parsing time
          const startTime = Date.now();
          const intent = await intentParser.parseIntent(transcription, context);
          const endTime = Date.now();
          const latency = endTime - startTime;

          // Even with API failure, fallback should complete within 1 second
          expect(latency).toBeLessThanOrEqual(1000);

          // Verify fallback intent was created
          expect(intent).toBeDefined();
          expect(intent.intentId).toContain('fallback');
          expect(intent.ambiguities).toContain('API unavailable - using fallback parsing');
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);

  it('should consistently meet latency requirements across multiple sequential parses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            transcription: fc.constantFrom(
              'Go to appointments',
              'Log feeding for Max',
              'What is the next appointment?',
              'Show health records'
            ),
            apiDelay: fc.integer({ min: 50, max: 800 })
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (parseSequence) => {
          const latencies: number[] = [];

          for (const parse of parseSequence) {
            // Mock API response with varying delay
            const mockResponse = {
              data: {
                response: JSON.stringify({
                  action: 'navigate',
                  target: 'appointments',
                  parameters: {},
                  confidence: 0.8,
                  requiresConfirmation: false,
                  ambiguities: []
                })
              },
              error: null
            };

            (api.jojoChat as any).mockImplementation(() =>
              new Promise(resolve => setTimeout(() => resolve(mockResponse), parse.apiDelay))
            );

            const context: ConversationContext = {
              previousIntents: [],
              activePet: null,
              currentPage: 'dashboard',
              recentEntities: []
            };

            // Measure parsing time
            const startTime = Date.now();
            await intentParser.parseIntent(parse.transcription, context);
            const endTime = Date.now();
            latencies.push(endTime - startTime);
          }

          // Verify all parses met latency requirement
          for (const latency of latencies) {
            expect(latency).toBeLessThanOrEqual(1000);
          }

          // Verify consistency: no parse should be significantly slower
          const maxLatency = Math.max(...latencies);
          const minLatency = Math.min(...latencies);
          const variance = maxLatency - minLatency;
          
          // Variance should be reasonable (within 1 second range)
          expect(variance).toBeLessThanOrEqual(1000);
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  it('should parse complex multi-parameter commands within latency bounds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          petName: fc.constantFrom('Max', 'Bella', 'Charlie', 'Luna', 'Rocky'),
          amount: fc.integer({ min: 1, max: 5 }),
          unit: fc.constantFrom('cups', 'grams', 'ounces'),
          time: fc.constantFrom('morning', 'evening', '8am', '6pm'),
          foodType: fc.constantFrom('dry food', 'wet food', 'treats')
        }),
        fc.integer({ min: 100, max: 800 }),
        async (params, apiDelay) => {
          const transcription = `Log feeding for ${params.petName} - ${params.amount} ${params.unit} of ${params.foodType} at ${params.time}`;

          // Mock API response with extracted parameters
          const mockResponse = {
            data: {
              response: JSON.stringify({
                action: 'log_data',
                target: 'feeding',
                parameters: {
                  petName: params.petName,
                  amount: params.amount,
                  unit: params.unit,
                  time: params.time,
                  foodType: params.foodType
                },
                confidence: 0.9,
                requiresConfirmation: true,
                ambiguities: []
              })
            },
            error: null
          };

          (api.jojoChat as any).mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve(mockResponse), apiDelay))
          );

          const context: ConversationContext = {
            previousIntents: [],
            activePet: params.petName,
            currentPage: 'feeding',
            recentEntities: []
          };

          // Measure parsing time for complex command
          const startTime = Date.now();
          const intent = await intentParser.parseIntent(transcription, context);
          const endTime = Date.now();
          const latency = endTime - startTime;

          // Complex commands should still parse within 1 second
          expect(latency).toBeLessThanOrEqual(1000);
          expect(intent).toBeDefined();
          expect(intent.action).toBe(CommandAction.LOG_DATA);
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);

  it('should maintain latency with varying transcription lengths', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 200 }),
        fc.integer({ min: 50, max: 800 }),
        async (transcription, apiDelay) => {
          // Mock API response
          const mockResponse = {
            data: {
              response: JSON.stringify({
                action: 'help',
                target: '',
                parameters: {},
                confidence: 0.6,
                requiresConfirmation: false,
                ambiguities: []
              })
            },
            error: null
          };

          (api.jojoChat as any).mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve(mockResponse), apiDelay))
          );

          const context: ConversationContext = {
            previousIntents: [],
            activePet: null,
            currentPage: 'dashboard',
            recentEntities: []
          };

          // Measure parsing time
          const startTime = Date.now();
          const intent = await intentParser.parseIntent(transcription, context);
          const endTime = Date.now();
          const latency = endTime - startTime;

          // Latency should be independent of transcription length
          expect(latency).toBeLessThanOrEqual(1000);
          expect(intent).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);
});
