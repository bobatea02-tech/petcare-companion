/**
 * Property-Based Tests for MilestoneDetector
 * 
 * Tests universal correctness properties using fast-check library
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { milestoneDetector, MilestoneDetector } from './MilestoneDetector';
import type { Milestone, MilestoneType, ShareableCard, MilestoneRecord } from '../types/features';
import { databaseManager } from '../lib/storage/database';
import { STORE_NAMES } from '../lib/storage/constants';

// Mock the database manager
vi.mock('../lib/storage/database', () => {
  const mockStore = new Map<string, MilestoneRecord>();
  
  return {
    databaseManager: {
      add: vi.fn(async (storeName: string, record: MilestoneRecord) => {
        mockStore.set(record.id, record);
        return record.id;
      }),
      get: vi.fn(async (storeName: string, id: string) => {
        return mockStore.get(id);
      }),
      getByIndex: vi.fn(async (storeName: string, indexName: string, value: string) => {
        return Array.from(mockStore.values()).filter(r => r.petId === value);
      }),
      put: vi.fn(async (storeName: string, record: MilestoneRecord) => {
        mockStore.set(record.id, record);
        return record.id;
      }),
      clear: vi.fn(async () => {
        mockStore.clear();
      }),
      _mockStore: mockStore, // Expose for test cleanup
    },
  };
});

// Helper to safely convert date to ISO string
const safeToISOString = (d: Date): string => {
  try {
    return d.toISOString();
  } catch {
    return new Date('2020-01-01').toISOString();
  }
};

// Arbitrary generators for test data
const petArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  species: fc.constantFrom('dog', 'cat', 'bird', 'fish'),
  breed: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  dateOfBirth: fc.option(
    fc.date({ min: new Date('2015-01-01'), max: new Date() }),
    { nil: undefined }
  ),
  photo: fc.option(fc.webUrl(), { nil: undefined }),
});

const healthLogArbitrary = fc.record({
  id: fc.uuid(),
  petId: fc.uuid(),
  date: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  type: fc.constantFrom('feeding', 'exercise', 'medication', 'grooming'),
});

const medicalRecordArbitrary = fc.record({
  id: fc.uuid(),
  petId: fc.uuid(),
  date: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  type: fc.constantFrom('vet_visit', 'checkup', 'vaccination', 'treatment'),
  description: fc.string({ minLength: 1, maxLength: 200 }),
});

describe('MilestoneDetector Property Tests', () => {
  let detector: MilestoneDetector;

  beforeEach(async () => {
    detector = new MilestoneDetector();
    // Clear the mock store before each test
    (databaseManager as any)._mockStore.clear();
  });

  afterEach(async () => {
    // Clean up after each test
    (databaseManager as any)._mockStore.clear();
  });

  /**
   * Property 14: Milestone Recording with Timestamp
   * For any milestone condition met, record should be created with timestamp
   * **Validates: Requirements 3.1**
   */
  describe('Property 14: Milestone Recording with Timestamp', () => {
    it('should create milestone record with timestamp for first vet visit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // petId
          fc.array(medicalRecordArbitrary, { minLength: 1, maxLength: 10 }),
          async (petId, medicalRecords) => {
            // Ensure at least one vet visit
            const records = medicalRecords.map((r, idx) => ({
              ...r,
              petId,
              type: idx === 0 ? 'vet_visit' : r.type,
            }));

            // Check for first vet visit milestone
            const milestone = await detector.checkFirstVetVisit(petId, records, new Set());

            if (milestone) {
              // Verify milestone has timestamp
              expect(milestone).toHaveProperty('achievedAt');
              expect(milestone.achievedAt).toBeInstanceOf(Date);
              expect(milestone.achievedAt.getTime()).toBeLessThanOrEqual(Date.now());
              
              // Verify milestone has all required fields
              expect(milestone).toHaveProperty('id');
              expect(milestone).toHaveProperty('petId');
              expect(milestone).toHaveProperty('type');
              expect(milestone).toHaveProperty('title');
              expect(milestone).toHaveProperty('description');
              expect(milestone).toHaveProperty('badge');
              
              // Verify timestamp is valid
              expect(isNaN(milestone.achievedAt.getTime())).toBe(false);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create milestone records with timestamp for age anniversaries', async () => {
      await fc.assert(
        fc.asyncProperty(
          petArbitrary.filter(p => p.dateOfBirth !== undefined),
          async (pet) => {
            // Ensure pet has a date of birth that's old enough for at least one milestone
            const oldPet = {
              ...pet,
              dateOfBirth: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000 * 2), // 2 years old
            };

            const milestones = await detector.checkAgeAnniversary(oldPet, new Set());

            // All milestones should have timestamps
            for (const milestone of milestones) {
              expect(milestone).toHaveProperty('achievedAt');
              expect(milestone.achievedAt).toBeInstanceOf(Date);
              expect(isNaN(milestone.achievedAt.getTime())).toBe(false);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create milestone records with timestamp for health log milestones', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.array(healthLogArbitrary, { minLength: 10, maxLength: 100 }),
          async (petId, healthLogs) => {
            const logs = healthLogs.map(log => ({ ...log, petId }));

            const milestones = await detector.checkHealthLogCount(petId, logs, new Set());

            // All milestones should have timestamps
            for (const milestone of milestones) {
              expect(milestone).toHaveProperty('achievedAt');
              expect(milestone.achievedAt).toBeInstanceOf(Date);
              expect(isNaN(milestone.achievedAt.getTime())).toBe(false);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 15: Milestone Card Generation
   * For any milestone, card should include photo and details
   * **Validates: Requirements 3.3**
   */
  describe('Property 15: Milestone Card Generation', () => {
    it('should generate shareable card with photo and details for any milestone', async () => {
      await fc.assert(
        fc.asyncProperty(
          petArbitrary,
          fc.record({
            id: fc.uuid(),
            petId: fc.uuid(),
            type: fc.constantFrom<MilestoneType>(
              'first_vet_visit',
              'age_anniversary',
              'health_log_milestone',
              'weight_goal',
              'training_achievement'
            ),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 1, maxLength: 200 }),
            achievedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            badge: fc.string({ minLength: 1, maxLength: 10 }),
            shared: fc.boolean(),
          }),
          async (pet, milestone) => {
            const card = await detector.generateShareableCard(milestone, pet);

            // Verify card has all required fields
            expect(card).toHaveProperty('imageUrl');
            expect(card).toHaveProperty('text');
            expect(card).toHaveProperty('hashtags');

            // Verify imageUrl is present (either pet photo or placeholder)
            expect(typeof card.imageUrl).toBe('string');
            expect(card.imageUrl.length).toBeGreaterThan(0);

            // Verify text includes milestone details
            expect(typeof card.text).toBe('string');
            expect(card.text.length).toBeGreaterThan(0);
            expect(card.text).toContain(pet.name);
            expect(card.text).toContain(milestone.title);

            // Verify hashtags array exists
            expect(Array.isArray(card.hashtags)).toBe(true);
            expect(card.hashtags.length).toBeGreaterThan(0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include pet photo in card when available', async () => {
      await fc.assert(
        fc.asyncProperty(
          petArbitrary.filter(p => p.photo !== undefined),
          fc.record({
            id: fc.uuid(),
            petId: fc.uuid(),
            type: fc.constantFrom<MilestoneType>('first_vet_visit', 'age_anniversary'),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 1, maxLength: 200 }),
            achievedAt: fc.date(),
            badge: fc.string({ minLength: 1, maxLength: 10 }),
            shared: fc.boolean(),
          }),
          async (pet, milestone) => {
            const card = await detector.generateShareableCard(milestone, pet);

            // When pet has photo, card should use it
            if (pet.photo) {
              expect(card.imageUrl).toBe(pet.photo);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 16: Milestone Badge Association
   * For any milestone, badge identifier should be present
   * **Validates: Requirements 3.4**
   */
  describe('Property 16: Milestone Badge Association', () => {
    it('should associate badge identifier with every milestone', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          petArbitrary,
          fc.array(healthLogArbitrary, { minLength: 0, maxLength: 100 }),
          fc.array(medicalRecordArbitrary, { minLength: 0, maxLength: 20 }),
          async (petId, pet, healthLogs, medicalRecords) => {
            const logs = healthLogs.map(log => ({ ...log, petId }));
            const records = medicalRecords.map(r => ({ ...r, petId }));
            const petWithId = { ...pet, id: petId };

            const milestones = await detector.detectMilestones(petId, petWithId, logs, records);

            // Every milestone should have a badge
            for (const milestone of milestones) {
              expect(milestone).toHaveProperty('badge');
              expect(typeof milestone.badge).toBe('string');
              expect(milestone.badge.length).toBeGreaterThan(0);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have non-empty badge for first vet visit milestone', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.array(medicalRecordArbitrary, { minLength: 1, maxLength: 10 }),
          async (petId, medicalRecords) => {
            const records = medicalRecords.map((r, idx) => ({
              ...r,
              petId,
              type: idx === 0 ? 'vet_visit' : r.type,
            }));

            const milestone = await detector.checkFirstVetVisit(petId, records, new Set());

            if (milestone) {
              expect(milestone.badge).toBeDefined();
              expect(typeof milestone.badge).toBe('string');
              expect(milestone.badge.length).toBeGreaterThan(0);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have non-empty badge for age anniversary milestones', async () => {
      await fc.assert(
        fc.asyncProperty(
          petArbitrary.filter(p => p.dateOfBirth !== undefined),
          async (pet) => {
            const oldPet = {
              ...pet,
              dateOfBirth: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000 * 2),
            };

            const milestones = await detector.checkAgeAnniversary(oldPet, new Set());

            for (const milestone of milestones) {
              expect(milestone.badge).toBeDefined();
              expect(typeof milestone.badge).toBe('string');
              expect(milestone.badge.length).toBeGreaterThan(0);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have non-empty badge for health log milestones', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.array(healthLogArbitrary, { minLength: 10, maxLength: 100 }),
          async (petId, healthLogs) => {
            const logs = healthLogs.map(log => ({ ...log, petId }));

            const milestones = await detector.checkHealthLogCount(petId, logs, new Set());

            for (const milestone of milestones) {
              expect(milestone.badge).toBeDefined();
              expect(typeof milestone.badge).toBe('string');
              expect(milestone.badge.length).toBeGreaterThan(0);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 18: Milestone Persistence Round-Trip
   * For any stored milestone, retrieval should return original data
   * **Validates: Requirements 3.7**
   */
  describe('Property 18: Milestone Persistence Round-Trip', () => {
    it('should retrieve stored milestone with all original data intact', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            petId: fc.uuid(),
            type: fc.constantFrom<MilestoneType>(
              'first_vet_visit',
              'age_anniversary',
              'health_log_milestone',
              'weight_goal',
              'training_achievement'
            ),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 1, maxLength: 200 }),
            achievedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            badge: fc.string({ minLength: 1, maxLength: 10 }),
            shared: fc.boolean(),
          }),
          async (milestone) => {
            // Store the milestone
            await detector.recordMilestone(milestone);

            // Retrieve milestones for this pet
            const retrieved = await detector.getMilestones(milestone.petId);

            // Find the stored milestone
            const found = retrieved.find(m => m.id === milestone.id);

            // Verify milestone was retrieved
            expect(found).toBeDefined();

            if (found) {
              // Verify all fields match
              expect(found.id).toBe(milestone.id);
              expect(found.petId).toBe(milestone.petId);
              expect(found.type).toBe(milestone.type);
              expect(found.title).toBe(milestone.title);
              expect(found.description).toBe(milestone.description);
              expect(found.badge).toBe(milestone.badge);
              
              // Verify date is preserved (compare timestamps)
              expect(found.achievedAt.getTime()).toBe(milestone.achievedAt.getTime());
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all milestone data through multiple store and retrieve cycles', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              petId: fc.uuid(),
              type: fc.constantFrom<MilestoneType>(
                'first_vet_visit',
                'age_anniversary',
                'health_log_milestone'
              ),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 1, maxLength: 200 }),
              achievedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
              badge: fc.string({ minLength: 1, maxLength: 10 }),
              shared: fc.boolean(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (milestones) => {
            // Use same petId for all milestones
            const petId = milestones[0].petId;
            const milestonesWithSamePet = milestones.map(m => ({ ...m, petId }));

            // Store all milestones
            for (const milestone of milestonesWithSamePet) {
              await detector.recordMilestone(milestone);
            }

            // Retrieve all milestones
            const retrieved = await detector.getMilestones(petId);

            // Verify count matches
            expect(retrieved.length).toBe(milestonesWithSamePet.length);

            // Verify each milestone was preserved
            for (const original of milestonesWithSamePet) {
              const found = retrieved.find(m => m.id === original.id);
              expect(found).toBeDefined();

              if (found) {
                expect(found.id).toBe(original.id);
                expect(found.petId).toBe(original.petId);
                expect(found.type).toBe(original.type);
                expect(found.title).toBe(original.title);
                expect(found.description).toBe(original.description);
                expect(found.badge).toBe(original.badge);
                expect(found.achievedAt.getTime()).toBe(original.achievedAt.getTime());
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain data integrity when storing and retrieving milestones with special characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            petId: fc.uuid(),
            type: fc.constantFrom<MilestoneType>('first_vet_visit', 'age_anniversary'),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 1, maxLength: 200 }),
            achievedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            badge: fc.constantFrom('🏥', '🎂', '📊', '⚖️', '🏆'),
            shared: fc.boolean(),
          }),
          async (milestone) => {
            // Store milestone
            await detector.recordMilestone(milestone);

            // Retrieve milestone
            const retrieved = await detector.getMilestones(milestone.petId);
            const found = retrieved.find(m => m.id === milestone.id);

            expect(found).toBeDefined();

            if (found) {
              // Verify special characters in badge are preserved
              expect(found.badge).toBe(milestone.badge);
              
              // Verify all text fields are preserved
              expect(found.title).toBe(milestone.title);
              expect(found.description).toBe(milestone.description);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Additional property: Milestone timeline ordering
  describe('Additional Property: Milestone Timeline Ordering', () => {
    it('should return milestones in chronological order when using getMilestonesSorted', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              petId: fc.uuid(),
              type: fc.constantFrom<MilestoneType>('first_vet_visit', 'age_anniversary'),
              title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
              description: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
              achievedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }).filter(d => !isNaN(d.getTime())),
              badge: fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
              shared: fc.boolean(),
            }),
            { minLength: 2, maxLength: 10 }
          ),
          async (milestones) => {
            // Use same petId for all milestones and ensure unique IDs
            const petId = milestones[0].petId;
            const milestonesWithSamePet = milestones.map((m, idx) => ({ 
              ...m, 
              petId,
              id: `milestone-${idx}-${Date.now()}-${Math.random()}` // Ensure unique IDs
            }));

            // Store all milestones
            for (const milestone of milestonesWithSamePet) {
              await detector.recordMilestone(milestone);
            }

            // Get sorted milestones
            const sorted = await detector.getMilestonesSorted(petId);

            // Verify they are in descending order (most recent first)
            for (let i = 0; i < sorted.length - 1; i++) {
              const current = sorted[i].achievedAt.getTime();
              const next = sorted[i + 1].achievedAt.getTime();
              
              // Skip if dates are invalid
              if (isNaN(current) || isNaN(next)) {
                continue;
              }
              
              expect(current).toBeGreaterThanOrEqual(next);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
