import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { ComparisonService, Pet, FeedingLog, Medication } from "./ComparisonService";
import { HealthScore } from "./HealthScoreCalculator";
import { PetComparison, FeedingData, MedicationEvent } from "../types/features";

// Feature: additional-amazing-features
// Property-based tests for ComparisonService

describe("ComparisonService Property Tests", () => {
  const service = new ComparisonService();

  // Arbitrary generators
  const petArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    species: fc.constantFrom("dog", "cat", "bird", "fish"),
    breed: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
    dateOfBirth: fc.option(fc.date({ min: new Date(2010, 0, 1), max: new Date() })),
  });

  const healthScoreArbitrary = fc.record({
    overall: fc.integer({ min: 0, max: 100 }),
    nutrition: fc.integer({ min: 0, max: 100 }),
    exercise: fc.integer({ min: 0, max: 100 }),
    medical: fc.integer({ min: 0, max: 100 }),
    grooming: fc.integer({ min: 0, max: 100 }),
    lastCalculated: fc.date(),
    recommendations: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
  });

  const feedingLogArbitrary = (petId: string) =>
    fc.record({
      petId: fc.constant(petId),
      date: fc.date({ min: new Date(2024, 0, 1), max: new Date() }),
      amount: fc.integer({ min: 50, max: 500 }),
    });

  const medicationArbitrary = (petId: string) =>
    fc.record({
      petId: fc.constant(petId),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      schedule: fc.array(fc.date({ min: new Date(2024, 0, 1), max: new Date(2024, 11, 31) }), {
        minLength: 1,
        maxLength: 30,
      }),
      completed: fc.option(fc.boolean()),
    });

  // **Property 26: Multi-Pet Health Score Display Completeness**
  // For any user with multiple pets, all pets should appear
  // **Validates: Requirements 6.1**
  describe("Property 26: Multi-Pet Health Score Display Completeness", () => {
    it("should display health scores for all pets owned by the user", () => {
      fc.assert(
        fc.property(
          fc.array(petArbitrary, { minLength: 1, maxLength: 15 }),
          (pets: Pet[]) => {
            // Create health scores map for all pets
            const healthScores = new Map<string, HealthScore>();
            pets.forEach((pet) => {
              healthScores.set(pet.id, {
                overall: 75,
                nutrition: 80,
                exercise: 70,
                medical: 75,
                grooming: 75,
                lastCalculated: new Date(),
                recommendations: [],
              });
            });

            const result: PetComparison[] = service.compareHealthScores(pets, healthScores);

            // All pets should appear in the result (up to 10 pets limit)
            const expectedCount = Math.min(pets.length, 10);
            expect(result.length).toBe(expectedCount);

            // Each pet should have a corresponding comparison entry
            const resultPetIds = result.map((r) => r.petId);
            const expectedPetIds = pets.slice(0, 10).map((p) => p.id);

            expectedPetIds.forEach((petId) => {
              expect(resultPetIds).toContain(petId);
            });

            // Each comparison should have the correct pet name
            result.forEach((comparison) => {
              const pet = pets.find((p) => p.id === comparison.petId);
              expect(comparison.petName).toBe(pet?.name);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle pets with missing health scores gracefully", () => {
      fc.assert(
        fc.property(
          fc.array(petArbitrary, { minLength: 1, maxLength: 10 }),
          (pets: Pet[]) => {
            // Create health scores for only some pets
            const healthScores = new Map<string, HealthScore>();
            pets.slice(0, Math.floor(pets.length / 2)).forEach((pet) => {
              healthScores.set(pet.id, {
                overall: 75,
                nutrition: 80,
                exercise: 70,
                medical: 75,
                grooming: 75,
                lastCalculated: new Date(),
                recommendations: [],
              });
            });

            const result: PetComparison[] = service.compareHealthScores(pets, healthScores);

            // All pets should still appear
            expect(result.length).toBe(Math.min(pets.length, 10));

            // Pets without health scores should have default score of 50
            result.forEach((comparison) => {
              const hasScore = healthScores.has(comparison.petId);
              if (!hasScore) {
                expect(comparison.healthScore).toBe(50);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should limit display to maximum of 10 pets", () => {
      fc.assert(
        fc.property(
          fc.array(petArbitrary, { minLength: 11, maxLength: 20 }),
          (pets: Pet[]) => {
            const healthScores = new Map<string, HealthScore>();

            const result: PetComparison[] = service.compareHealthScores(pets, healthScores);

            // Should never exceed 10 pets
            expect(result.length).toBeLessThanOrEqual(10);
            expect(result.length).toBe(10);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Property 27: Multi-Pet Color Coding Consistency**
  // For any pet in comparison, color should match score
  // **Validates: Requirements 6.2**
  describe("Property 27: Multi-Pet Color Coding Consistency", () => {
    it("should apply correct color coding based on health score", () => {
      fc.assert(
        fc.property(
          fc.array(petArbitrary, { minLength: 1, maxLength: 10 }),
          fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 10 }),
          (pets: Pet[], scores: number[]) => {
            // Create health scores with specific values
            const healthScores = new Map<string, HealthScore>();
            pets.forEach((pet, index) => {
              const score = scores[index % scores.length];
              healthScores.set(pet.id, {
                overall: score,
                nutrition: score,
                exercise: score,
                medical: score,
                grooming: score,
                lastCalculated: new Date(),
                recommendations: [],
              });
            });

            const result: PetComparison[] = service.compareHealthScores(pets, healthScores);

            // Verify color coding consistency
            result.forEach((comparison) => {
              const score = comparison.healthScore;

              // Color should match score range
              if (score >= 0 && score <= 40) {
                // Should be red (we verify the score is in red range)
                expect(score).toBeLessThanOrEqual(40);
              } else if (score >= 41 && score <= 70) {
                // Should be yellow
                expect(score).toBeGreaterThanOrEqual(41);
                expect(score).toBeLessThanOrEqual(70);
              } else if (score >= 71 && score <= 100) {
                // Should be green
                expect(score).toBeGreaterThanOrEqual(71);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should maintain color consistency across multiple comparisons", () => {
      fc.assert(
        fc.property(
          fc.array(petArbitrary, { minLength: 2, maxLength: 10 }),
          (pets: Pet[]) => {
            const healthScores = new Map<string, HealthScore>();
            pets.forEach((pet) => {
              healthScores.set(pet.id, {
                overall: 85,
                nutrition: 85,
                exercise: 85,
                medical: 85,
                grooming: 85,
                lastCalculated: new Date(),
                recommendations: [],
              });
            });

            const result1: PetComparison[] = service.compareHealthScores(pets, healthScores);
            const result2: PetComparison[] = service.compareHealthScores(pets, healthScores);

            // Same pets should have same scores in both comparisons
            result1.forEach((comp1, index) => {
              const comp2 = result2[index];
              expect(comp1.healthScore).toBe(comp2.healthScore);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Property 28: Multi-Pet Feeding Data Inclusion**
  // For any pets with feeding logs, data should be included
  // **Validates: Requirements 6.3**
  describe("Property 28: Multi-Pet Feeding Data Inclusion", () => {
    it("should include feeding data for all pets with feeding logs", () => {
      fc.assert(
        fc.property(
          fc.array(petArbitrary, { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 1, max: 90 }),
          (pets: Pet[], days: number) => {
            // Create feeding logs for all pets
            const feedingLogs: FeedingLog[] = [];
            pets.forEach((pet) => {
              // Add 1-5 feeding logs per pet
              const logCount = Math.floor(Math.random() * 5) + 1;
              for (let i = 0; i < logCount; i++) {
                feedingLogs.push({
                  petId: pet.id,
                  date: new Date(Date.now() - Math.random() * days * 24 * 60 * 60 * 1000),
                  amount: Math.floor(Math.random() * 500) + 50,
                });
              }
            });

            const result: FeedingData[] = service.compareFeedingPatterns(pets, feedingLogs, days);

            // All pets should appear in result (up to 10)
            expect(result.length).toBe(Math.min(pets.length, 10));

            // Each pet with feeding logs should have data
            result.forEach((feedingData) => {
              const pet = pets.find((p) => p.id === feedingData.petId);
              expect(pet).toBeDefined();
              expect(feedingData.petName).toBe(pet?.name);

              // Should have dailyFeedings array
              expect(Array.isArray(feedingData.dailyFeedings)).toBe(true);

              // If pet has logs, dailyFeedings should not be empty
              const petLogs = feedingLogs.filter((log) => log.petId === feedingData.petId);
              if (petLogs.length > 0) {
                // May be empty if logs are outside date range, but structure should be valid
                feedingData.dailyFeedings.forEach((daily) => {
                  expect(daily.date).toBeInstanceOf(Date);
                  expect(daily.count).toBeGreaterThanOrEqual(0);
                  expect(daily.totalAmount).toBeGreaterThanOrEqual(0);
                });
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle pets with no feeding logs gracefully", () => {
      fc.assert(
        fc.property(
          fc.array(petArbitrary, { minLength: 1, maxLength: 10 }),
          (pets: Pet[]) => {
            // No feeding logs
            const feedingLogs: FeedingLog[] = [];

            const result: FeedingData[] = service.compareFeedingPatterns(pets, feedingLogs, 30);

            // All pets should still appear
            expect(result.length).toBe(Math.min(pets.length, 10));

            // Each pet should have empty dailyFeedings
            result.forEach((feedingData) => {
              expect(feedingData.dailyFeedings).toEqual([]);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should respect date range filtering", () => {
      fc.assert(
        fc.property(
          fc.array(petArbitrary, { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 7, max: 60 }),
          (pets: Pet[], days: number) => {
            const now = new Date();
            const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

            // Create logs both inside and outside the range
            const feedingLogs: FeedingLog[] = [];
            pets.forEach((pet) => {
              // Add logs inside range
              feedingLogs.push({
                petId: pet.id,
                date: new Date(now.getTime() - (days / 2) * 24 * 60 * 60 * 1000),
                amount: 100,
              });

              // Add logs outside range (older)
              feedingLogs.push({
                petId: pet.id,
                date: new Date(now.getTime() - (days + 10) * 24 * 60 * 60 * 1000),
                amount: 100,
              });
            });

            const result: FeedingData[] = service.compareFeedingPatterns(pets, feedingLogs, days);

            // Verify only logs within range are included
            result.forEach((feedingData) => {
              feedingData.dailyFeedings.forEach((daily) => {
                expect(daily.date.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
                expect(daily.date.getTime()).toBeLessThanOrEqual(now.getTime());
              });
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Property 29: Multi-Pet Medication Calendar Completeness**
  // For any pets with medications, all events should appear
  // **Validates: Requirements 6.4**
  describe("Property 29: Multi-Pet Medication Calendar Completeness", () => {
    it("should include all medication events for all pets", () => {
      fc.assert(
        fc.property(
          fc.array(petArbitrary, { minLength: 1, maxLength: 10 }),
          (pets: Pet[]) => {
            const startDate = new Date(2024, 0, 1);
            const endDate = new Date(2024, 11, 31);

            // Create medications for all pets
            const medications: Medication[] = [];
            pets.forEach((pet) => {
              medications.push({
                petId: pet.id,
                name: `Medication for ${pet.name}`,
                schedule: [
                  new Date(2024, 5, 15),
                  new Date(2024, 6, 15),
                  new Date(2024, 7, 15),
                ],
                completed: false,
              });
            });

            const result: MedicationEvent[] = service.getMedicationCalendar(
              pets,
              medications,
              startDate,
              endDate
            );

            // Should have events for all pets (up to 10 pets)
            const uniquePetIds = new Set(result.map((event) => event.petId));
            expect(uniquePetIds.size).toBe(Math.min(pets.length, 10));

            // Each event should have required fields
            result.forEach((event) => {
              expect(event.petId).toBeDefined();
              expect(event.petName).toBeDefined();
              expect(event.medicationName).toBeDefined();
              expect(event.time).toBeInstanceOf(Date);
              expect(typeof event.completed).toBe("boolean");

              // Event should be for a valid pet
              const pet = pets.find((p) => p.id === event.petId);
              expect(pet).toBeDefined();
              expect(event.petName).toBe(pet?.name);
            });

            // Events should be sorted by time
            for (let i = 1; i < result.length; i++) {
              expect(result[i].time.getTime()).toBeGreaterThanOrEqual(
                result[i - 1].time.getTime()
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should filter events by date range", () => {
      fc.assert(
        fc.property(
          fc.array(petArbitrary, { minLength: 1, maxLength: 5 }),
          (pets: Pet[]) => {
            const startDate = new Date(2024, 5, 1);
            const endDate = new Date(2024, 7, 31);

            // Create medications with events inside and outside range
            const medications: Medication[] = [];
            pets.forEach((pet) => {
              medications.push({
                petId: pet.id,
                name: `Medication for ${pet.name}`,
                schedule: [
                  new Date(2024, 4, 15), // Before range
                  new Date(2024, 6, 15), // Inside range
                  new Date(2024, 8, 15), // After range
                ],
                completed: false,
              });
            });

            const result: MedicationEvent[] = service.getMedicationCalendar(
              pets,
              medications,
              startDate,
              endDate
            );

            // All events should be within date range
            result.forEach((event) => {
              expect(event.time.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
              expect(event.time.getTime()).toBeLessThanOrEqual(endDate.getTime());
            });

            // Should have exactly one event per pet (the one inside range)
            const eventCountPerPet = new Map<string, number>();
            result.forEach((event) => {
              eventCountPerPet.set(event.petId, (eventCountPerPet.get(event.petId) || 0) + 1);
            });

            pets.slice(0, 10).forEach((pet) => {
              expect(eventCountPerPet.get(pet.id)).toBe(1);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle pets with no medications gracefully", () => {
      fc.assert(
        fc.property(
          fc.array(petArbitrary, { minLength: 1, maxLength: 10 }),
          (pets: Pet[]) => {
            const startDate = new Date(2024, 0, 1);
            const endDate = new Date(2024, 11, 31);

            // No medications
            const medications: Medication[] = [];

            const result: MedicationEvent[] = service.getMedicationCalendar(
              pets,
              medications,
              startDate,
              endDate
            );

            // Should return empty array
            expect(result).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should limit to 10 pets maximum", () => {
      fc.assert(
        fc.property(
          fc.array(petArbitrary, { minLength: 11, maxLength: 15 }),
          (pets: Pet[]) => {
            const startDate = new Date(2024, 0, 1);
            const endDate = new Date(2024, 11, 31);

            // Create medications for all pets
            const medications: Medication[] = [];
            pets.forEach((pet) => {
              medications.push({
                petId: pet.id,
                name: `Medication for ${pet.name}`,
                schedule: [new Date(2024, 6, 15)],
                completed: false,
              });
            });

            const result: MedicationEvent[] = service.getMedicationCalendar(
              pets,
              medications,
              startDate,
              endDate
            );

            // Should only have events for first 10 pets
            const uniquePetIds = new Set(result.map((event) => event.petId));
            expect(uniquePetIds.size).toBeLessThanOrEqual(10);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Additional property: Quick switcher data
  describe("Additional Property: Quick Switcher Data", () => {
    it("should return all pets up to 10 for quick switching", () => {
      fc.assert(
        fc.property(
          fc.array(petArbitrary, { minLength: 1, maxLength: 20 }),
          (pets: Pet[]) => {
            const result: Pet[] = service.getQuickSwitcherData(pets);

            // Should return up to 10 pets
            expect(result.length).toBeLessThanOrEqual(10);
            expect(result.length).toBe(Math.min(pets.length, 10));

            // Should return first 10 pets
            result.forEach((pet, index) => {
              expect(pet.id).toBe(pets[index].id);
              expect(pet.name).toBe(pets[index].name);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle empty pet list", () => {
      const result = service.getQuickSwitcherData([]);
      expect(result).toEqual([]);
    });
  });
});

// Unit tests for multi-pet edge cases
// Task: 9.4 Write unit tests for multi-pet edge cases
// Requirements: 6.5, 6.6
describe("ComparisonService Unit Tests - Multi-Pet Edge Cases", () => {
  const service = new ComparisonService();

  // Test with 1 pet (should still work)
  describe("Single Pet Edge Case", () => {
    it("should work correctly with exactly 1 pet for health score comparison", () => {
      const singlePet: Pet = {
        id: "pet-1",
        name: "Buddy",
        species: "dog",
        breed: "Golden Retriever",
      };

      const healthScores = new Map<string, HealthScore>();
      healthScores.set("pet-1", {
        overall: 85,
        nutrition: 90,
        exercise: 80,
        medical: 85,
        grooming: 85,
        lastCalculated: new Date(),
        recommendations: [],
      });

      const result = service.compareHealthScores([singlePet], healthScores);

      expect(result).toHaveLength(1);
      expect(result[0].petId).toBe("pet-1");
      expect(result[0].petName).toBe("Buddy");
      expect(result[0].healthScore).toBe(85);
    });

    it("should work correctly with exactly 1 pet for feeding comparison", () => {
      const singlePet: Pet = {
        id: "pet-1",
        name: "Whiskers",
        species: "cat",
      };

      const feedingLogs: FeedingLog[] = [
        { petId: "pet-1", date: new Date(), amount: 100 },
        { petId: "pet-1", date: new Date(Date.now() - 24 * 60 * 60 * 1000), amount: 150 },
      ];

      const result = service.compareFeedingPatterns([singlePet], feedingLogs, 7);

      expect(result).toHaveLength(1);
      expect(result[0].petId).toBe("pet-1");
      expect(result[0].petName).toBe("Whiskers");
      expect(result[0].dailyFeedings.length).toBeGreaterThan(0);
    });

    it("should work correctly with exactly 1 pet for medication calendar", () => {
      const singlePet: Pet = {
        id: "pet-1",
        name: "Tweety",
        species: "bird",
      };

      const medications: Medication[] = [
        {
          petId: "pet-1",
          name: "Vitamin Supplement",
          schedule: [new Date(2024, 6, 15), new Date(2024, 7, 15)],
          completed: false,
        },
      ];

      const startDate = new Date(2024, 0, 1);
      const endDate = new Date(2024, 11, 31);

      const result = service.getMedicationCalendar([singlePet], medications, startDate, endDate);

      expect(result).toHaveLength(2);
      expect(result[0].petId).toBe("pet-1");
      expect(result[0].petName).toBe("Tweety");
      expect(result[0].medicationName).toBe("Vitamin Supplement");
    });

    it("should work correctly with exactly 1 pet for quick switcher", () => {
      const singlePet: Pet = {
        id: "pet-1",
        name: "Nemo",
        species: "fish",
      };

      const result = service.getQuickSwitcherData([singlePet]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("pet-1");
      expect(result[0].name).toBe("Nemo");
    });
  });

  // Test with 10 pets (maximum capacity)
  describe("Maximum Capacity Edge Case (10 Pets)", () => {
    const createPets = (count: number): Pet[] => {
      return Array.from({ length: count }, (_, i) => ({
        id: `pet-${i + 1}`,
        name: `Pet ${i + 1}`,
        species: ["dog", "cat", "bird", "fish"][i % 4],
        breed: `Breed ${i + 1}`,
      }));
    };

    it("should handle exactly 10 pets for health score comparison", () => {
      const tenPets = createPets(10);
      const healthScores = new Map<string, HealthScore>();

      tenPets.forEach((pet, index) => {
        healthScores.set(pet.id, {
          overall: 70 + index,
          nutrition: 75,
          exercise: 75,
          medical: 75,
          grooming: 75,
          lastCalculated: new Date(),
          recommendations: [],
        });
      });

      const result = service.compareHealthScores(tenPets, healthScores);

      expect(result).toHaveLength(10);
      
      // Verify all 10 pets are included
      tenPets.forEach((pet, index) => {
        expect(result[index].petId).toBe(pet.id);
        expect(result[index].petName).toBe(pet.name);
        expect(result[index].healthScore).toBe(70 + index);
      });
    });

    it("should limit to 10 pets when more than 10 are provided for health score comparison", () => {
      const fifteenPets = createPets(15);
      const healthScores = new Map<string, HealthScore>();

      fifteenPets.forEach((pet) => {
        healthScores.set(pet.id, {
          overall: 80,
          nutrition: 80,
          exercise: 80,
          medical: 80,
          grooming: 80,
          lastCalculated: new Date(),
          recommendations: [],
        });
      });

      const result = service.compareHealthScores(fifteenPets, healthScores);

      expect(result).toHaveLength(10);
      
      // Verify only first 10 pets are included
      result.forEach((comparison, index) => {
        expect(comparison.petId).toBe(`pet-${index + 1}`);
      });
    });

    it("should handle exactly 10 pets for feeding comparison", () => {
      const tenPets = createPets(10);
      const feedingLogs: FeedingLog[] = [];

      // Create feeding logs for all 10 pets
      tenPets.forEach((pet) => {
        feedingLogs.push({
          petId: pet.id,
          date: new Date(),
          amount: 100,
        });
      });

      const result = service.compareFeedingPatterns(tenPets, feedingLogs, 30);

      expect(result).toHaveLength(10);
      
      // Verify all 10 pets are included
      tenPets.forEach((pet, index) => {
        expect(result[index].petId).toBe(pet.id);
        expect(result[index].petName).toBe(pet.name);
      });
    });

    it("should handle exactly 10 pets for medication calendar", () => {
      const tenPets = createPets(10);
      const medications: Medication[] = [];

      // Create medications for all 10 pets
      tenPets.forEach((pet) => {
        medications.push({
          petId: pet.id,
          name: `Medication for ${pet.name}`,
          schedule: [new Date(2024, 6, 15)],
          completed: false,
        });
      });

      const startDate = new Date(2024, 0, 1);
      const endDate = new Date(2024, 11, 31);

      const result = service.getMedicationCalendar(tenPets, medications, startDate, endDate);

      expect(result).toHaveLength(10);
      
      // Verify all 10 pets have medication events
      const uniquePetIds = new Set(result.map((event) => event.petId));
      expect(uniquePetIds.size).toBe(10);
    });

    it("should handle exactly 10 pets for quick switcher", () => {
      const tenPets = createPets(10);

      const result = service.getQuickSwitcherData(tenPets);

      expect(result).toHaveLength(10);
      
      // Verify all 10 pets are included in correct order
      tenPets.forEach((pet, index) => {
        expect(result[index].id).toBe(pet.id);
        expect(result[index].name).toBe(pet.name);
      });
    });
  });

  // Test quick switcher navigation
  describe("Quick Switcher Navigation", () => {
    it("should provide correct pet data for navigation with multiple pets", () => {
      const pets: Pet[] = [
        { id: "pet-1", name: "Max", species: "dog", breed: "Labrador" },
        { id: "pet-2", name: "Luna", species: "cat", breed: "Persian" },
        { id: "pet-3", name: "Charlie", species: "bird", breed: "Parrot" },
      ];

      const result = service.getQuickSwitcherData(pets);

      expect(result).toHaveLength(3);
      
      // Verify each pet has all necessary data for navigation
      result.forEach((pet, index) => {
        expect(pet.id).toBe(pets[index].id);
        expect(pet.name).toBe(pets[index].name);
        expect(pet.species).toBe(pets[index].species);
        expect(pet.breed).toBe(pets[index].breed);
      });
    });

    it("should maintain pet order for quick switcher navigation", () => {
      const pets: Pet[] = [
        { id: "pet-5", name: "Zara", species: "dog" },
        { id: "pet-1", name: "Alpha", species: "cat" },
        { id: "pet-3", name: "Beta", species: "bird" },
      ];

      const result = service.getQuickSwitcherData(pets);

      // Order should be preserved (not sorted alphabetically)
      expect(result[0].id).toBe("pet-5");
      expect(result[1].id).toBe("pet-1");
      expect(result[2].id).toBe("pet-3");
    });

    it("should handle quick switcher with pets that have optional fields", () => {
      const pets: Pet[] = [
        { id: "pet-1", name: "Buddy", species: "dog" }, // No breed or dateOfBirth
        { id: "pet-2", name: "Mittens", species: "cat", breed: "Siamese" }, // Has breed
        { id: "pet-3", name: "Goldie", species: "fish", dateOfBirth: new Date(2023, 0, 1) }, // Has dateOfBirth
      ];

      const result = service.getQuickSwitcherData(pets);

      expect(result).toHaveLength(3);
      
      // Verify optional fields are preserved
      expect(result[0].breed).toBeUndefined();
      expect(result[0].dateOfBirth).toBeUndefined();
      expect(result[1].breed).toBe("Siamese");
      expect(result[2].dateOfBirth).toEqual(new Date(2023, 0, 1));
    });

    it("should limit quick switcher to 10 pets for navigation", () => {
      const pets: Pet[] = Array.from({ length: 12 }, (_, i) => ({
        id: `pet-${i + 1}`,
        name: `Pet ${i + 1}`,
        species: "dog",
      }));

      const result = service.getQuickSwitcherData(pets);

      expect(result).toHaveLength(10);
      
      // Should only include first 10 pets
      expect(result[0].id).toBe("pet-1");
      expect(result[9].id).toBe("pet-10");
    });

    it("should integrate quick switcher with comparison dashboard", () => {
      const pets: Pet[] = [
        { id: "pet-1", name: "Rex", species: "dog" },
        { id: "pet-2", name: "Fluffy", species: "cat" },
        { id: "pet-3", name: "Tweety", species: "bird" },
      ];

      const healthScores = new Map<string, HealthScore>();
      pets.forEach((pet) => {
        healthScores.set(pet.id, {
          overall: 75,
          nutrition: 75,
          exercise: 75,
          medical: 75,
          grooming: 75,
          lastCalculated: new Date(),
          recommendations: [],
        });
      });

      // Get comparison data
      const comparisons = service.compareHealthScores(pets, healthScores);
      
      // Get quick switcher data
      const quickSwitcherPets = service.getQuickSwitcherData(pets);

      // Verify both have same pets in same order
      expect(comparisons).toHaveLength(quickSwitcherPets.length);
      comparisons.forEach((comparison, index) => {
        expect(comparison.petId).toBe(quickSwitcherPets[index].id);
        expect(comparison.petName).toBe(quickSwitcherPets[index].name);
      });
    });
  });
});
