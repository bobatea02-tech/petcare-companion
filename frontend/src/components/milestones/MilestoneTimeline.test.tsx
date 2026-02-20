/**
 * Property-Based Tests for MilestoneTimeline Component
 * Feature: additional-amazing-features
 * Task: 5.4 Write property test for milestone timeline ordering
 * 
 * Tests that the MilestoneTimeline component displays milestones in chronological order
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { MilestoneTimeline } from './MilestoneTimeline';
import type { Milestone, MilestoneType } from '@/types/features';

// Clean up after each test to prevent DOM pollution
afterEach(() => {
  cleanup();
});

// Arbitrary generator for milestones with unique IDs and valid dates
const milestoneArbitrary = fc.record({
  id: fc.uuid(),
  petId: fc.uuid(),
  type: fc.constantFrom<MilestoneType>(
    'first_vet_visit',
    'age_anniversary',
    'health_log_milestone',
    'weight_goal',
    'training_achievement'
  ),
  title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  description: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
  achievedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }).filter(d => !isNaN(d.getTime())),
  badge: fc.constantFrom('🏥', '🎂', '📊', '⚖️', '🏆'),
  shared: fc.boolean(),
});

describe('MilestoneTimeline Component Property Tests', () => {
  /**
   * Property 17: Milestone Timeline Ordering
   * For any set of milestones, timeline should be chronologically sorted
   * **Validates: Requirements 3.5**
   */
  describe('Property 17: Milestone Timeline Ordering', () => {
    it('should display milestones in chronological order (most recent first)', () => {
      fc.assert(
        fc.property(
          fc.array(milestoneArbitrary, { minLength: 2, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (milestones, petName) => {
            // Ensure all milestones have unique IDs and the same petId
            const petId = 'test-pet-id';
            const milestonesWithSamePet = milestones.map((m, idx) => ({ 
              ...m, 
              petId,
              id: `milestone-${idx}-${Date.now()}-${Math.random()}` // Truly unique IDs
            }));

            // Render the component
            const { container } = render(
              <MilestoneTimeline milestones={milestonesWithSamePet} petName={petName} />
            );

            // Get all milestone titles in the order they appear in the DOM
            const milestoneElements = container.querySelectorAll('.font-anton.text-base.text-forest-800');
            const renderedTitles = Array.from(milestoneElements).map(el => el.textContent);

            // Sort the original milestones by date (most recent first)
            const sortedMilestones = [...milestonesWithSamePet].sort(
              (a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
            );

            // Verify the rendered order matches the expected sorted order
            expect(renderedTitles.length).toBe(sortedMilestones.length);

            for (let i = 0; i < renderedTitles.length; i++) {
              expect(renderedTitles[i]).toBe(sortedMilestones[i].title);
            }

            // Additional verification: check that dates are in descending order
            const dates = sortedMilestones.map(m => new Date(m.achievedAt).getTime());
            for (let i = 0; i < dates.length - 1; i++) {
              expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
            }

            // Cleanup
            cleanup();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain chronological order regardless of input order', () => {
      fc.assert(
        fc.property(
          fc.array(milestoneArbitrary, { minLength: 3, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (milestones, petName) => {
            const petId = 'test-pet-id';
            // Ensure unique IDs by using index
            const milestonesWithSamePet = milestones.map((m, idx) => ({ 
              ...m, 
              petId,
              id: `milestone-${idx}-${Date.now()}-${Math.random()}` // Truly unique IDs
            }));

            // Render with original order
            const { container: container1 } = render(
              <MilestoneTimeline milestones={milestonesWithSamePet} petName={petName} />
            );

            // Get titles from first render
            const titles1 = Array.from(
              container1.querySelectorAll('.font-anton.text-base.text-forest-800')
            ).map(el => el.textContent);

            cleanup();

            // Render with reversed order
            const { container: container2 } = render(
              <MilestoneTimeline milestones={[...milestonesWithSamePet].reverse()} petName={petName} />
            );

            // Get titles from second render
            const titles2 = Array.from(
              container2.querySelectorAll('.font-anton.text-base.text-forest-800')
            ).map(el => el.textContent);

            // Both should produce the same order (chronological)
            expect(titles1).toEqual(titles2);

            cleanup();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle milestones with identical timestamps', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date() }).filter(d => !isNaN(d.getTime())),
          fc.integer({ min: 2, max: 5 }),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (sharedDate, count, petName) => {
            // Create multiple milestones with the same timestamp
            const milestones: Milestone[] = Array.from({ length: count }, (_, i) => ({
              id: `milestone-${i}`,
              petId: 'test-pet-id',
              type: 'health_log_milestone' as MilestoneType,
              title: `Milestone ${i}`,
              description: `Description ${i}`,
              achievedAt: new Date(sharedDate),
              badge: '📊',
              shared: false,
            }));

            // Render the component
            const { container } = render(
              <MilestoneTimeline milestones={milestones} petName={petName} />
            );

            // Get all milestone elements
            const milestoneElements = container.querySelectorAll('.font-anton.text-base.text-forest-800');

            // Should render all milestones
            expect(milestoneElements.length).toBe(count);

            cleanup();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly sort milestones spanning multiple years', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (petName) => {
            // Create milestones spanning multiple years
            const milestones: Milestone[] = [
              {
                id: '1',
                petId: 'test-pet',
                type: 'first_vet_visit',
                title: 'First Vet Visit',
                description: 'Initial checkup',
                achievedAt: new Date('2020-03-15'),
                badge: '🏥',
                shared: false,
              },
              {
                id: '2',
                petId: 'test-pet',
                type: 'age_anniversary',
                title: '1 Year Old',
                description: 'First birthday',
                achievedAt: new Date('2021-03-15'),
                badge: '🎂',
                shared: false,
              },
              {
                id: '3',
                petId: 'test-pet',
                type: 'health_log_milestone',
                title: '100 Health Logs',
                description: 'Logged 100 health records',
                achievedAt: new Date('2022-06-20'),
                badge: '📊',
                shared: false,
              },
              {
                id: '4',
                petId: 'test-pet',
                type: 'age_anniversary',
                title: '2 Years Old',
                description: 'Second birthday',
                achievedAt: new Date('2022-03-15'),
                badge: '🎂',
                shared: false,
              },
            ];

            // Render the component
            const { container } = render(
              <MilestoneTimeline milestones={milestones} petName={petName} />
            );

            // Get rendered titles
            const renderedTitles = Array.from(
              container.querySelectorAll('.font-anton.text-base.text-forest-800')
            ).map(el => el.textContent);

            // Expected order (most recent first)
            const expectedOrder = [
              '100 Health Logs', // 2022-06-20
              '2 Years Old',      // 2022-03-15
              '1 Year Old',       // 2021-03-15
              'First Vet Visit',  // 2020-03-15
            ];

            expect(renderedTitles).toEqual(expectedOrder);

            cleanup();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty milestone array gracefully', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (petName) => {
            // Render with empty array
            const { container } = render(
              <MilestoneTimeline milestones={[]} petName={petName} />
            );

            // Should show empty state message - look for the specific paragraph in the empty state
            const paragraphs = container.querySelectorAll('p.text-sage-600.font-inter');
            const emptyMessage = Array.from(paragraphs).find(p => 
              p.textContent?.includes('No milestones yet')
            );
            expect(emptyMessage).toBeDefined();

            // Should not have any milestone elements (only the title)
            const milestoneElements = container.querySelectorAll('.font-anton.text-base.text-forest-800');
            expect(milestoneElements.length).toBe(0);

            cleanup();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle single milestone correctly', () => {
      fc.assert(
        fc.property(
          milestoneArbitrary,
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (milestone, petName) => {
            // Render with single milestone
            const { container } = render(
              <MilestoneTimeline milestones={[milestone]} petName={petName} />
            );

            // Should render the milestone title
            const milestoneTitle = container.querySelector('.font-anton.text-base.text-forest-800');
            expect(milestoneTitle).toBeDefined();
            expect(milestoneTitle?.textContent).toBe(milestone.title);

            // Should show singular form in description
            const description = container.querySelector('.text-sm.font-inter.text-sage-600');
            expect(description?.textContent).toContain('1 milestone');

            cleanup();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
