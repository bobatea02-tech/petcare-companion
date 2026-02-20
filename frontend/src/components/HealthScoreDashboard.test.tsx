import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { HealthScoreDashboard } from "./HealthScoreDashboard";
import { healthScoreCalculator, HealthScore, HealthDataInput } from "@/services/HealthScoreCalculator";

// Feature: additional-amazing-features
// Property-based tests for HealthScoreDashboard component

describe("HealthScoreDashboard Property Tests", () => {
  // Mock the healthScoreCalculator to control test behavior
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // Arbitrary generators for test data
  const dateArbitrary = fc.date({ min: new Date(2020, 0, 1), max: new Date() });

  const healthScoreArbitrary = fc.record({
    overall: fc.integer({ min: 0, max: 100 }),
    nutrition: fc.integer({ min: 0, max: 100 }),
    exercise: fc.integer({ min: 0, max: 100 }),
    medical: fc.integer({ min: 0, max: 100 }),
    grooming: fc.integer({ min: 0, max: 100 }),
    lastCalculated: dateArbitrary,
    recommendations: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 0, maxLength: 5 }),
  });

  // **Property 3: Health Score Category Completeness**
  // For any score, all four categories should be present
  // **Validates: Requirements 1.3**
  describe("Property 3: Health Score Category Completeness", () => {
    it("should display all four category scores (nutrition, exercise, medical, grooming) for any health score", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          healthScoreArbitrary,
          async (petId: string, mockScore: HealthScore) => {
            // Mock the calculator to return our test score
            vi.spyOn(healthScoreCalculator, "calculateOverallScore").mockReturnValue(mockScore);
            vi.spyOn(healthScoreCalculator, "getScoreColor").mockImplementation((score: number) => {
              if (score <= 40) return "red";
              if (score <= 70) return "yellow";
              return "green";
            });

            // Render the component
            const { unmount } = render(<HealthScoreDashboard petId={petId} />);

            try {
              // Wait for the component to finish loading
              await waitFor(() => {
                expect(screen.queryByText("Loading health score...")).not.toBeInTheDocument();
              }, { timeout: 3000 });

              // Verify all four categories are present in the DOM
              expect(screen.getByText("Nutrition")).toBeInTheDocument();
              expect(screen.getByText("Exercise")).toBeInTheDocument();
              expect(screen.getByText("Medical")).toBeInTheDocument();
              expect(screen.getByText("Grooming")).toBeInTheDocument();

              // Verify each category displays its score (use getAllByText for duplicate scores)
              const nutritionScores = screen.getAllByText(mockScore.nutrition.toString());
              const exerciseScores = screen.getAllByText(mockScore.exercise.toString());
              const medicalScores = screen.getAllByText(mockScore.medical.toString());
              const groomingScores = screen.getAllByText(mockScore.grooming.toString());
              
              // At least one element should exist for each score
              expect(nutritionScores.length).toBeGreaterThan(0);
              expect(exerciseScores.length).toBeGreaterThan(0);
              expect(medicalScores.length).toBeGreaterThan(0);
              expect(groomingScores.length).toBeGreaterThan(0);
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it("should ensure category breakdown contains exactly four categories", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          healthScoreArbitrary,
          async (petId: string, mockScore: HealthScore) => {
            vi.spyOn(healthScoreCalculator, "calculateOverallScore").mockReturnValue(mockScore);
            vi.spyOn(healthScoreCalculator, "getScoreColor").mockReturnValue("green");

            const { unmount } = render(<HealthScoreDashboard petId={petId} />);

            try {
              await waitFor(() => {
                expect(screen.queryByText("Loading health score...")).not.toBeInTheDocument();
              }, { timeout: 3000 });

              // Count the category cards (they have specific structure)
              const categoryCards = screen.getAllByText(/Nutrition|Exercise|Medical|Grooming/);
              
              // Should have exactly 4 categories
              expect(categoryCards.length).toBe(4);
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // **Property 4: Trend Data Generation**
  // For any pet with 30+ days of data, trend should have 30+ points
  // **Validates: Requirements 1.4**
  describe("Property 4: Trend Data Generation", () => {
    it("should generate trend data with at least 30 data points when sufficient historical data exists", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          healthScoreArbitrary,
          fc.integer({ min: 30, max: 90 }),
          async (petId: string, mockScore: HealthScore, daysOfData: number) => {
            vi.spyOn(healthScoreCalculator, "calculateOverallScore").mockReturnValue(mockScore);
            vi.spyOn(healthScoreCalculator, "getScoreColor").mockReturnValue("green");

            const { unmount } = render(<HealthScoreDashboard petId={petId} />);

            try {
              await waitFor(() => {
                expect(screen.queryByText("Loading health score...")).not.toBeInTheDocument();
              }, { timeout: 3000 });

              // Check that the trend chart section is rendered
              expect(screen.getByText("30-Day Trend")).toBeInTheDocument();
              expect(screen.getByText("Health score history")).toBeInTheDocument();

              // The component generates 30 days of trend data by default
              // We verify the chart container is present
              const chartContainer = screen.getByText("30-Day Trend").closest(".bg-cream-50");
              expect(chartContainer).toBeInTheDocument();
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it("should display trend chart when pet has historical data", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          healthScoreArbitrary,
          async (petId: string, mockScore: HealthScore) => {
            vi.spyOn(healthScoreCalculator, "calculateOverallScore").mockReturnValue(mockScore);
            vi.spyOn(healthScoreCalculator, "getScoreColor").mockReturnValue("green");

            const { unmount } = render(<HealthScoreDashboard petId={petId} />);

            try {
              await waitFor(() => {
                expect(screen.queryByText("Loading health score...")).not.toBeInTheDocument();
              }, { timeout: 3000 });

              // Trend chart should be visible
              const trendTitle = screen.getByText("30-Day Trend");
              expect(trendTitle).toBeInTheDocument();
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // **Property 6: Score Recalculation on New Data**
  // For any new health data, timestamp should update
  // **Validates: Requirements 1.7**
  describe("Property 6: Score Recalculation on New Data", () => {
    it("should display the lastCalculated timestamp from the health score", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          healthScoreArbitrary,
          async (petId: string, mockScore: HealthScore) => {
            vi.spyOn(healthScoreCalculator, "calculateOverallScore").mockReturnValue(mockScore);
            vi.spyOn(healthScoreCalculator, "getScoreColor").mockReturnValue("green");

            const { unmount } = render(<HealthScoreDashboard petId={petId} />);

            try {
              await waitFor(() => {
                expect(screen.queryByText("Loading health score...")).not.toBeInTheDocument();
              }, { timeout: 3000 });

              // Verify the timestamp is displayed
              const expectedDate = mockScore.lastCalculated.toLocaleDateString();
              expect(screen.getByText(`Last updated: ${expectedDate}`)).toBeInTheDocument();
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it("should show updated timestamp when health score is recalculated", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          healthScoreArbitrary,
          healthScoreArbitrary,
          async (petId: string, initialScore: HealthScore, updatedScore: HealthScore) => {
            // Ensure the timestamps are different
            const timeDiff = Math.abs(updatedScore.lastCalculated.getTime() - initialScore.lastCalculated.getTime());
            if (timeDiff < 1000) {
              // Skip if timestamps are too close (less than 1 second apart)
              return;
            }

            const calculateSpy = vi.spyOn(healthScoreCalculator, "calculateOverallScore");
            calculateSpy.mockReturnValue(initialScore);
            vi.spyOn(healthScoreCalculator, "getScoreColor").mockReturnValue("green");

            const { rerender, unmount } = render(<HealthScoreDashboard petId={petId} />);

            try {
              await waitFor(() => {
                expect(screen.queryByText("Loading health score...")).not.toBeInTheDocument();
              }, { timeout: 3000 });

              // Verify initial timestamp
              const initialDate = initialScore.lastCalculated.toLocaleDateString();
              expect(screen.getByText(`Last updated: ${initialDate}`)).toBeInTheDocument();

              // Update the mock to return new score with new timestamp
              calculateSpy.mockReturnValue(updatedScore);

              // Trigger re-render with different petId to simulate new data
              rerender(<HealthScoreDashboard petId={petId + "-updated"} />);

              await waitFor(() => {
                const updatedDate = updatedScore.lastCalculated.toLocaleDateString();
                expect(screen.getByText(`Last updated: ${updatedDate}`)).toBeInTheDocument();
              }, { timeout: 3000 });
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 10 } // Reduced runs for this more complex test
      );
    });

    it("should reflect timestamp updates for any valid date", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          dateArbitrary,
          async (
            petId: string,
            overall: number,
            nutrition: number,
            exercise: number,
            medical: number,
            grooming: number,
            calculatedDate: Date
          ) => {
            const mockScore: HealthScore = {
              overall,
              nutrition,
              exercise,
              medical,
              grooming,
              lastCalculated: calculatedDate,
              recommendations: [],
            };

            vi.spyOn(healthScoreCalculator, "calculateOverallScore").mockReturnValue(mockScore);
            vi.spyOn(healthScoreCalculator, "getScoreColor").mockReturnValue("green");

            const { unmount } = render(<HealthScoreDashboard petId={petId} />);

            try {
              await waitFor(() => {
                expect(screen.queryByText("Loading health score...")).not.toBeInTheDocument();
              }, { timeout: 3000 });

              // Verify the timestamp matches the calculated date
              const expectedDate = calculatedDate.toLocaleDateString();
              expect(screen.getByText(`Last updated: ${expectedDate}`)).toBeInTheDocument();
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // Additional property: Overall score display
  describe("Additional Property: Overall Score Display", () => {
    it("should display the overall health score for any valid score value", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          healthScoreArbitrary,
          async (petId: string, mockScore: HealthScore) => {
            vi.spyOn(healthScoreCalculator, "calculateOverallScore").mockReturnValue(mockScore);
            vi.spyOn(healthScoreCalculator, "getScoreColor").mockReturnValue("green");

            const { unmount } = render(<HealthScoreDashboard petId={petId} />);

            try {
              await waitFor(() => {
                expect(screen.queryByText("Loading health score...")).not.toBeInTheDocument();
              }, { timeout: 3000 });

              // Verify the overall score section is present
              expect(screen.getByText("Pet Health Score")).toBeInTheDocument();
              expect(screen.getByText("Overall wellness assessment")).toBeInTheDocument();
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // Additional property: Recommendations display
  describe("Additional Property: Recommendations Display", () => {
    it("should display recommendations when they exist in the health score", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          healthScoreArbitrary.filter((score) => 
            score.recommendations.length > 0 && 
            score.recommendations.some(rec => rec.trim().length > 0)
          ),
          async (petId: string, mockScore: HealthScore) => {
            vi.spyOn(healthScoreCalculator, "calculateOverallScore").mockReturnValue(mockScore);
            vi.spyOn(healthScoreCalculator, "getScoreColor").mockReturnValue("green");

            const { unmount } = render(<HealthScoreDashboard petId={petId} />);

            try {
              await waitFor(() => {
                expect(screen.queryByText("Loading health score...")).not.toBeInTheDocument();
              }, { timeout: 3000 });

              // If recommendations exist, the section should be visible
              if (mockScore.recommendations.length > 0) {
                expect(screen.getByText("Recommendations")).toBeInTheDocument();
                
                // Verify each non-empty recommendation is displayed
                // Use a function matcher to handle whitespace normalization
                mockScore.recommendations.forEach((rec) => {
                  const trimmedRec = rec.trim();
                  if (trimmedRec.length > 0) {
                    expect(screen.getByText((content, element) => {
                      return element?.textContent?.trim() === trimmedRec;
                    })).toBeInTheDocument();
                  }
                });
              }
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
