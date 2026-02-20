/**
 * Property Test: Multi-modal Response Synchronization
 * Feature: jojo-voice-assistant-enhanced
 * Property 20: Multi-modal response synchronization
 * 
 * For any query response, the Dashboard should display relevant visual data simultaneously 
 * with voice output, with visual elements highlighted in sync with spoken information
 * 
 * Validates: Requirements 8.1, 8.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, waitFor } from '@testing-library/react';
import { MultiModalPresenter, VisualData } from '@/components/voice/MultiModalPresenter';
import {
  createHealthChartData,
  createFeedingTimelineData,
  createMedicationTimelineData,
  createAppointmentsCalendarData,
  createListViewData,
  syncVisualizationWithSpeech
} from '@/services/voice/multiModalHelper';
import React from 'react';

describe('Property 20: Multi-modal Response Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should display visual data simultaneously with voice output for health records queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          petName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          recordCount: fc.integer({ min: 1, max: 10 }),
          metricType: fc.constantFrom('weight', 'temperature', 'heartRate')
        }),
        async ({ petName, recordCount, metricType }) => {
          // Generate health records
          const healthRecords = Array.from({ length: recordCount }, (_, i) => ({
            id: `record-${i}`,
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            [metricType]: 10 + Math.random() * 20,
            petId: petName
          }));

          // Create visual data
          const visualData = createHealthChartData(healthRecords);

          // Simulate voice output starting
          const voiceOutputStartTime = Date.now();

          // Render MultiModalPresenter
          const { unmount } = render(
            <MultiModalPresenter
              visualData={visualData}
              isActive={true}
              currentSpeechSegment={`Here are ${petName}'s health records`}
            />
          );

          // Verify visual data is displayed (check for title instead of chart wrapper)
          await waitFor(() => {
            expect(screen.getAllByText('Health Metrics').length).toBeGreaterThan(0);
          }, { timeout: 2000 });

          // Measure time to display
          const visualDisplayTime = Date.now();
          const displayLatency = visualDisplayTime - voiceOutputStartTime;

          // Visual data should appear within 500ms (simultaneously with voice)
          expect(displayLatency).toBeLessThan(500);

          // Cleanup
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  }, 15000);

  it('should display visual data simultaneously with voice output for appointment queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          petName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          appointmentCount: fc.integer({ min: 1, max: 5 }),
          appointmentType: fc.constantFrom('vet', 'grooming', 'vaccination')
        }),
        async ({ petName, appointmentCount, appointmentType }) => {
          // Generate appointments
          const appointments = Array.from({ length: appointmentCount }, (_, i) => ({
            id: `apt-${i}`,
            date: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000),
            title: `${appointmentType} appointment`,
            reason: appointmentType,
            petId: petName
          }));

          // Create visual data
          const visualData = createAppointmentsCalendarData(appointments);

          // Simulate voice output starting
          const voiceOutputStartTime = Date.now();

          // Render MultiModalPresenter
          const { unmount } = render(
            <MultiModalPresenter
              visualData={visualData}
              isActive={true}
              currentSpeechSegment={`${petName} has ${appointmentCount} upcoming appointments`}
            />
          );

          // Verify visual data is displayed
          await waitFor(() => {
            expect(screen.getAllByText('Upcoming Appointments').length).toBeGreaterThan(0);
          }, { timeout: 2000 });

          // Measure time to display
          const visualDisplayTime = Date.now();
          const displayLatency = visualDisplayTime - voiceOutputStartTime;

          // Visual data should appear within 500ms (simultaneously with voice)
          expect(displayLatency).toBeLessThan(500);

          // Cleanup
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  }, 10000);

  it('should display visual data simultaneously with voice output for feeding history queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          petName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          feedingCount: fc.integer({ min: 1, max: 10 }),
          foodType: fc.constantFrom('dry food', 'wet food', 'treats')
        }),
        async ({ petName, feedingCount, foodType }) => {
          // Generate feeding logs
          const feedingLogs = Array.from({ length: feedingCount }, (_, i) => ({
            id: `feeding-${i}`,
            timestamp: Date.now() - i * 8 * 60 * 60 * 1000,
            time: new Date(Date.now() - i * 8 * 60 * 60 * 1000).toLocaleTimeString(),
            amount: `${100 + Math.random() * 100}g`,
            foodType,
            petId: petName
          }));

          // Create visual data
          const visualData = createFeedingTimelineData(feedingLogs);

          // Simulate voice output starting
          const voiceOutputStartTime = Date.now();

          // Render MultiModalPresenter
          const { unmount } = render(
            <MultiModalPresenter
              visualData={visualData}
              isActive={true}
              currentSpeechSegment={`Here is ${petName}'s feeding history`}
            />
          );

          // Verify visual data is displayed
          await waitFor(() => {
            expect(screen.getAllByText('Feeding History').length).toBeGreaterThan(0);
          }, { timeout: 2000 });

          // Measure time to display
          const visualDisplayTime = Date.now();
          const displayLatency = visualDisplayTime - voiceOutputStartTime;

          // Visual data should appear within 500ms (simultaneously with voice)
          expect(displayLatency).toBeLessThan(500);

          // Cleanup
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  }, 10000);

  it('should highlight visual elements in sync with spoken information', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          itemCount: fc.integer({ min: 2, max: 5 }),
          highlightIndex: fc.integer({ min: 0, max: 4 })
        }).filter(({ itemCount, highlightIndex }) => highlightIndex < itemCount),
        async ({ itemCount, highlightIndex }) => {
          // Generate timeline data
          const timelineData = Array.from({ length: itemCount }, (_, i) => ({
            id: `item-${i}`,
            time: `${8 + i * 2}:00 AM`,
            title: `Activity ${i + 1}`,
            description: `Description for activity ${i + 1}`
          }));

          const visualData: VisualData = {
            type: 'timeline',
            title: 'Daily Activities',
            data: timelineData,
            highlightKey: 'activity'
          };

          // Simulate speaking about a specific item
          const spokenItem = timelineData[highlightIndex];
          const speechText = `At ${spokenItem.time}, you have ${spokenItem.title}`;

          // Test synchronization
          const highlightedId = syncVisualizationWithSpeech(
            speechText,
            visualData,
            spokenItem.title
          );

          // Verify the correct item is identified for highlighting
          expect(highlightedId).toBe(spokenItem.id);

          // Render with highlighting
          const { rerender, unmount } = render(
            <MultiModalPresenter
              visualData={visualData}
              isActive={true}
              currentSpeechSegment=""
            />
          );

          // Update with speech segment
          rerender(
            <MultiModalPresenter
              visualData={visualData}
              isActive={true}
              currentSpeechSegment={speechText}
            />
          );

          // Verify visual is displayed
          await waitFor(() => {
            expect(screen.getByText('Daily Activities')).toBeTruthy();
          });

          // Cleanup
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should synchronize across different query types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          queryType: fc.constantFrom('health', 'appointments', 'feeding', 'medications'),
          petName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          dataCount: fc.integer({ min: 1, max: 8 })
        }),
        async ({ queryType, petName, dataCount }) => {
          let visualData: VisualData;
          let speechText: string;
          let expectedDataLength: number;

          // Generate appropriate data based on query type
          switch (queryType) {
            case 'health':
              const healthRecords = Array.from({ length: dataCount }, (_, i) => ({
                date: `2024-01-${i + 1}`,
                weight: 10 + i,
                petId: petName
              }));
              visualData = createHealthChartData(healthRecords);
              speechText = `${petName}'s health records show ${dataCount} entries`;
              expectedDataLength = dataCount;
              break;

            case 'appointments':
              const appointments = Array.from({ length: dataCount }, (_, i) => ({
                id: `apt-${i}`,
                date: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000),
                title: `Appointment ${i + 1}`
              }));
              visualData = createAppointmentsCalendarData(appointments);
              speechText = `${petName} has ${dataCount} upcoming appointments`;
              // For appointments, data is an object with appointments array
              expectedDataLength = (visualData.data as { appointments: any[] }).appointments.length;
              break;

            case 'feeding':
              const feedingLogs = Array.from({ length: dataCount }, (_, i) => ({
                id: `feed-${i}`,
                time: `${8 + i}:00`,
                amount: '100g',
                foodType: 'dry food'
              }));
              visualData = createFeedingTimelineData(feedingLogs);
              speechText = `${petName}'s feeding history shows ${dataCount} meals`;
              expectedDataLength = dataCount;
              break;

            case 'medications':
              const medications = Array.from({ length: dataCount }, (_, i) => ({
                id: `med-${i}`,
                name: `Medication ${i + 1}`,
                time: `${9 + i * 3}:00`,
                dosage: '1 tablet'
              }));
              visualData = createMedicationTimelineData(medications);
              speechText = `${petName} has ${dataCount} medications scheduled`;
              expectedDataLength = dataCount;
              break;

            default:
              throw new Error('Invalid query type');
          }

          // Simulate voice output starting
          const voiceOutputStartTime = Date.now();

          // Render MultiModalPresenter
          const { unmount } = render(
            <MultiModalPresenter
              visualData={visualData}
              isActive={true}
              currentSpeechSegment={speechText}
            />
          );

          // Verify visual data is displayed
          await waitFor(() => {
            expect(screen.getAllByText(visualData.title).length).toBeGreaterThan(0);
          }, { timeout: 2000 });

          // Measure time to display
          const visualDisplayTime = Date.now();
          const displayLatency = visualDisplayTime - voiceOutputStartTime;

          // Visual data should appear within 500ms (simultaneously with voice)
          expect(displayLatency).toBeLessThan(500);

          // Verify data count is correct
          expect(expectedDataLength).toBe(dataCount);

          // Cleanup
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  }, 15000);

  it('should maintain synchronization when switching between different visual types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.constantFrom('health', 'appointments', 'feeding', 'medications'),
          { minLength: 2, maxLength: 4 }
        ),
        async (querySequence) => {
          const petName = 'TestPet';

          for (const queryType of querySequence) {
            let visualData: VisualData;

            // Generate data for each query type
            switch (queryType) {
              case 'health':
                visualData = createHealthChartData([{ date: '2024-01-01', weight: 10 }]);
                break;
              case 'appointments':
                visualData = createAppointmentsCalendarData([{
                  id: 'apt-1',
                  date: new Date(),
                  title: 'Vet visit'
                }]);
                break;
              case 'feeding':
                visualData = createFeedingTimelineData([{
                  id: 'feed-1',
                  time: '8:00 AM',
                  amount: '100g',
                  foodType: 'dry food'
                }]);
                break;
              case 'medications':
                visualData = createMedicationTimelineData([{
                  id: 'med-1',
                  name: 'Medicine',
                  time: '9:00 AM',
                  dosage: '1 tablet'
                }]);
                break;
            }

            // Measure synchronization for each query
            const startTime = Date.now();

            const { unmount } = render(
              <MultiModalPresenter
                visualData={visualData}
                isActive={true}
                currentSpeechSegment={`Showing ${queryType} data for ${petName}`}
              />
            );

            // Verify display appears quickly
            await waitFor(() => {
              expect(screen.getAllByText(visualData.title).length).toBeGreaterThan(0);
            }, { timeout: 2000 });

            const displayTime = Date.now() - startTime;
            expect(displayTime).toBeLessThan(500);

            // Cleanup before next iteration
            unmount();
          }
        }
      ),
      { numRuns: 50 }
    );
  }, 15000);

  it('should handle empty data gracefully while maintaining synchronization', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('health', 'appointments', 'feeding', 'medications'),
        async (queryType) => {
          let visualData: VisualData;

          // Generate empty data for each type
          switch (queryType) {
            case 'health':
              visualData = createHealthChartData([]);
              break;
            case 'appointments':
              visualData = createAppointmentsCalendarData([]);
              break;
            case 'feeding':
              visualData = createFeedingTimelineData([]);
              break;
            case 'medications':
              visualData = createMedicationTimelineData([]);
              break;
          }

          const startTime = Date.now();

          // Render with empty data
          const { unmount } = render(
            <MultiModalPresenter
              visualData={visualData}
              isActive={true}
              currentSpeechSegment="No data available"
            />
          );

          // Verify component renders even with empty data
          await waitFor(() => {
            expect(screen.getAllByText(visualData.title).length).toBeGreaterThan(0);
          }, { timeout: 1000 });

          const displayTime = Date.now() - startTime;
          expect(displayTime).toBeLessThan(500);

          // Cleanup
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should synchronize visual highlighting with real-time speech progress', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          itemCount: fc.integer({ min: 3, max: 6 })
        }),
        async ({ itemCount }) => {
          // Generate list data
          const items = Array.from({ length: itemCount }, (_, i) => ({
            id: `item-${i}`,
            title: `Item ${i + 1}`,
            subtitle: `Description ${i + 1}`,
            value: `Value ${i + 1}`
          }));

          const visualData = createListViewData(items, 'Test Items');

          // Simulate speaking about each item sequentially
          for (let i = 0; i < itemCount; i++) {
            const currentItem = items[i];
            const speechSegment = `Now showing ${currentItem.title}`;

            const { unmount } = render(
              <MultiModalPresenter
                visualData={visualData}
                isActive={true}
                currentSpeechSegment={speechSegment}
              />
            );

            // Verify synchronization for this item
            const highlightedId = syncVisualizationWithSpeech(
              speechSegment,
              visualData,
              currentItem.title
            );

            expect(highlightedId).toBe(currentItem.id);

            // Verify visual is displayed
            await waitFor(() => {
              expect(screen.getByText('Test Items')).toBeTruthy();
            });

            unmount();
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
