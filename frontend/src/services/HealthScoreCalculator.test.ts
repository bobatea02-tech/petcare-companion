import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { HealthScoreCalculator, HealthDataInput, HealthScore } from "./HealthScoreCalculator";

// Feature: additional-amazing-features
// Property-based tests for HealthScoreCalculator service

describe("HealthScoreCalculator Property Tests", () => {
  const calculator = new HealthScoreCalculator();

  // Arbitrary generators for health data
  const dateArbitrary = fc.date({ min: new Date(2020, 0, 1), max: new Date() });

  const nutritionLogArbitrary = fc.record({
    date: dateArbitrary,
    mealType: fc.constantFrom("breakfast", "lunch", "dinner", "snack"),
    amount: fc.integer({ min: 0, max: 1000 }),
  });

  const exerciseLogArbitrary = fc.record({
    date: dateArbitrary,
    duration: fc.integer({ min: 0, max: 300 }),
    type: fc.constantFrom("walk", "run", "play", "swim"),
  });

  const medicalRecordArbitrary = fc.record({
    date: dateArbitrary,
    type: fc.constantFrom("checkup", "vaccination", "treatment", "emergency"),
    notes: fc.string({ maxLength: 100 }),
  });

  const groomingLogArbitrary = fc.record({
    date: dateArbitrary,
    type: fc.constantFrom("bath", "brush", "nail-trim", "haircut"),
    notes: fc.string({ maxLength: 100 }),
  });

  const healthDataInputArbitrary = fc.record({
    petId: fc.uuid(),
    nutritionLogs: fc.array(nutritionLogArbitrary, { minLength: 0, maxLength: 50 }),
    exerciseLogs: fc.array(exerciseLogArbitrary, { minLength: 0, maxLength: 50 }),
    medicalRecords: fc.array(medicalRecordArbitrary, { minLength: 0, maxLength: 50 }),
    groomingLogs: fc.array(groomingLogArbitrary, { minLength: 0, maxLength: 50 }),
  });

  // **Property 1: Health Score Range Validity**
  // For any health data input, score should be 0-100
  // **Validates: Requirements 1.1**
  describe("Property 1: Health Score Range Validity", () => {
    it("should always return a score between 0 and 100 inclusive for any health data input", () => {
      fc.assert(
        fc.property(healthDataInputArbitrary, (input: HealthDataInput) => {
          const result: HealthScore = calculator.calculateOverallScore(input);

          // Overall score must be in valid range
          expect(result.overall).toBeGreaterThanOrEqual(0);
          expect(result.overall).toBeLessThanOrEqual(100);

          // All category scores must be in valid range
          expect(result.nutrition).toBeGreaterThanOrEqual(0);
          expect(result.nutrition).toBeLessThanOrEqual(100);

          expect(result.exercise).toBeGreaterThanOrEqual(0);
          expect(result.exercise).toBeLessThanOrEqual(100);

          expect(result.medical).toBeGreaterThanOrEqual(0);
          expect(result.medical).toBeLessThanOrEqual(100);

          expect(result.grooming).toBeGreaterThanOrEqual(0);
          expect(result.grooming).toBeLessThanOrEqual(100);
        }),
        { numRuns: 100 }
      );
    });

    it("should return valid scores even with empty logs", () => {
      fc.assert(
        fc.property(fc.uuid(), (petId: string) => {
          const input: HealthDataInput = {
            petId,
            nutritionLogs: [],
            exerciseLogs: [],
            medicalRecords: [],
            groomingLogs: [],
          };

          const result: HealthScore = calculator.calculateOverallScore(input);

          expect(result.overall).toBeGreaterThanOrEqual(0);
          expect(result.overall).toBeLessThanOrEqual(100);
        }),
        { numRuns: 100 }
      );
    });
  });

  // **Property 2: Health Score Color Mapping**
  // For any score, correct color should be returned
  // **Validates: Requirements 1.2**
  describe("Property 2: Health Score Color Mapping", () => {
    it("should return red for scores 0-40, yellow for 41-70, green for 71-100", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (score: number) => {
          const color = calculator.getScoreColor(score);

          if (score >= 0 && score <= 40) {
            expect(color).toBe("red");
          } else if (score >= 41 && score <= 70) {
            expect(color).toBe("yellow");
          } else if (score >= 71 && score <= 100) {
            expect(color).toBe("green");
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should handle boundary values correctly", () => {
      // Test exact boundaries
      expect(calculator.getScoreColor(0)).toBe("red");
      expect(calculator.getScoreColor(40)).toBe("red");
      expect(calculator.getScoreColor(41)).toBe("yellow");
      expect(calculator.getScoreColor(70)).toBe("yellow");
      expect(calculator.getScoreColor(71)).toBe("green");
      expect(calculator.getScoreColor(100)).toBe("green");
    });
  });

  // **Property 5: Low Score Recommendations**
  // For any score below 70, recommendations array should be non-empty
  // **Validates: Requirements 1.5**
  describe("Property 5: Low Score Recommendations", () => {
    it("should generate at least one recommendation for any score below 70", () => {
      fc.assert(
        fc.property(healthDataInputArbitrary, (input: HealthDataInput) => {
          const result: HealthScore = calculator.calculateOverallScore(input);

          if (result.overall < 70) {
            expect(result.recommendations).toBeDefined();
            expect(Array.isArray(result.recommendations)).toBe(true);
            expect(result.recommendations.length).toBeGreaterThan(0);
            
            // Ensure recommendations are non-empty strings
            result.recommendations.forEach((rec) => {
              expect(typeof rec).toBe("string");
              expect(rec.length).toBeGreaterThan(0);
            });
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should generate recommendations for low category scores even if overall is high", () => {
      fc.assert(
        fc.property(
          fc.record({
            overall: fc.integer({ min: 0, max: 100 }),
            nutrition: fc.integer({ min: 0, max: 100 }),
            exercise: fc.integer({ min: 0, max: 100 }),
            medical: fc.integer({ min: 0, max: 100 }),
            grooming: fc.integer({ min: 0, max: 100 }),
          }),
          (scores) => {
            const healthScore: HealthScore = {
              ...scores,
              lastCalculated: new Date(),
              recommendations: [],
            };

            const recommendations = calculator.generateRecommendations(healthScore);

            // If any category is below 70, there should be recommendations
            const hasLowScore =
              scores.nutrition < 70 ||
              scores.exercise < 70 ||
              scores.medical < 70 ||
              scores.grooming < 70 ||
              scores.overall < 70;

            if (hasLowScore) {
              expect(recommendations.length).toBeGreaterThan(0);
            }

            // Recommendations should always be an array
            expect(Array.isArray(recommendations)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should provide specific recommendations for each low-scoring category", () => {
      // Test with specific low scores in each category
      const testCases = [
        { nutrition: 50, exercise: 80, medical: 80, grooming: 80, overall: 75 },
        { nutrition: 80, exercise: 50, medical: 80, grooming: 80, overall: 75 },
        { nutrition: 80, exercise: 80, medical: 50, grooming: 80, overall: 75 },
        { nutrition: 80, exercise: 80, medical: 80, grooming: 50, overall: 75 },
      ];

      testCases.forEach((scores) => {
        const healthScore: HealthScore = {
          ...scores,
          lastCalculated: new Date(),
          recommendations: [],
        };

        const recommendations = calculator.generateRecommendations(healthScore);

        // Check that recommendations mention the low-scoring category
        if (scores.nutrition < 70) {
          expect(recommendations.some((rec) => rec.toLowerCase().includes("nutrition"))).toBe(true);
        }
        if (scores.exercise < 70) {
          expect(recommendations.some((rec) => rec.toLowerCase().includes("exercise"))).toBe(true);
        }
        if (scores.medical < 70) {
          expect(recommendations.some((rec) => rec.toLowerCase().includes("medical"))).toBe(true);
        }
        if (scores.grooming < 70) {
          expect(recommendations.some((rec) => rec.toLowerCase().includes("grooming"))).toBe(true);
        }
      });
    });
  });

  // Additional property: Score calculation consistency
  describe("Additional Property: Score Calculation Consistency", () => {
    it("should return the same score for the same input data", () => {
      fc.assert(
        fc.property(healthDataInputArbitrary, (input: HealthDataInput) => {
          const result1 = calculator.calculateOverallScore(input);
          const result2 = calculator.calculateOverallScore(input);

          // Scores should be identical (excluding timestamp)
          expect(result1.overall).toBe(result2.overall);
          expect(result1.nutrition).toBe(result2.nutrition);
          expect(result1.exercise).toBe(result2.exercise);
          expect(result1.medical).toBe(result2.medical);
          expect(result1.grooming).toBe(result2.grooming);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Additional property: Timestamp validity
  describe("Additional Property: Timestamp Validity", () => {
    it("should always set lastCalculated to a valid date", () => {
      fc.assert(
        fc.property(healthDataInputArbitrary, (input: HealthDataInput) => {
          const result = calculator.calculateOverallScore(input);

          expect(result.lastCalculated).toBeInstanceOf(Date);
          expect(result.lastCalculated.getTime()).toBeLessThanOrEqual(Date.now());
        }),
        { numRuns: 100 }
      );
    });
  });
});
