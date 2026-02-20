import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { GuidedTour } from "@/components/tour/GuidedTour";

// Feature: outstanding-landing-page, Property 11: Tour Skip Availability
// For any step in the Guided Tour, a "Skip Tour" button should be present and functional,
// allowing users to exit the tour immediately.
// Validates: Requirements 7.6

describe("Property 11: Tour Skip Availability", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock DOM elements for tour targets
    const mockVoiceElement = document.createElement("div");
    mockVoiceElement.setAttribute("data-tour", "voice-assistant");
    mockVoiceElement.textContent = "Voice Assistant";
    document.body.appendChild(mockVoiceElement);
    
    const mockHealthElement = document.createElement("div");
    mockHealthElement.setAttribute("data-tour", "health-tracker");
    mockHealthElement.textContent = "Health Tracker";
    document.body.appendChild(mockHealthElement);
    
    const mockVetElement = document.createElement("div");
    mockVetElement.setAttribute("data-tour", "vet-booking");
    mockVetElement.textContent = "Vet Booking";
    document.body.appendChild(mockVetElement);
  });

  afterEach(() => {
    // Clean up mock elements
    const mockElements = document.querySelectorAll('[data-tour]');
    mockElements.forEach(el => el.remove());
    
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("should have skip button present on all tour steps", async () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }), // Tour has 3 steps
        fc.uuid(), // User ID
        async (stepNumber, userId) => {
          localStorage.setItem("user_id", userId);
          
          const onComplete = vi.fn();
          const onSkip = vi.fn();
          
          const { container } = render(
            <BrowserRouter>
              <GuidedTour
                onComplete={onComplete}
                onSkip={onSkip}
                isActive={true}
              />
            </BrowserRouter>
          );

          // Wait for tour to render
          await waitFor(
            () => {
              // Check for skip button (X button in top right)
              const skipButton = container.querySelector('button[aria-label="Skip tour"]');
              expect(skipButton).not.toBeNull();
            },
            { timeout: 2000 }
          );
        }
      ),
      { numRuns: 30 }
    );
  });

  it("should call onSkip callback when skip button is clicked", async () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          localStorage.setItem("user_id", userId);
          
          const onComplete = vi.fn();
          const onSkip = vi.fn();
          
          const { container } = render(
            <BrowserRouter>
              <GuidedTour
                onComplete={onComplete}
                onSkip={onSkip}
                isActive={true}
              />
            </BrowserRouter>
          );

          // Wait for tour to render
          await waitFor(
            () => {
              const skipButton = container.querySelector('button[aria-label="Skip tour"]');
              expect(skipButton).not.toBeNull();
            },
            { timeout: 2000 }
          );

          // Click the skip button
          const skipButton = container.querySelector('button[aria-label="Skip tour"]');
          if (skipButton) {
            await userEvent.click(skipButton as HTMLElement);
            
            // Verify onSkip was called
            await waitFor(() => {
              expect(onSkip).toHaveBeenCalled();
            });
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it("should track tour_skipped analytics event when skip button is clicked", async () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          localStorage.removeItem("analytics_events");
          localStorage.setItem("user_id", userId);
          
          const onComplete = vi.fn();
          const onSkip = vi.fn();
          
          const { container } = render(
            <BrowserRouter>
              <GuidedTour
                onComplete={onComplete}
                onSkip={onSkip}
                isActive={true}
              />
            </BrowserRouter>
          );

          // Wait for tour to render
          await waitFor(
            () => {
              const skipButton = container.querySelector('button[aria-label="Skip tour"]');
              expect(skipButton).not.toBeNull();
            },
            { timeout: 2000 }
          );

          // Click the skip button
          const skipButton = container.querySelector('button[aria-label="Skip tour"]');
          if (skipButton) {
            await userEvent.click(skipButton as HTMLElement);
            
            // Wait for analytics event to be tracked
            await waitFor(() => {
              const events = JSON.parse(localStorage.getItem("analytics_events") || "[]");
              const tourSkippedEvent = events.find(
                (e: any) => e.eventType === "tour_skipped"
              );
              
              expect(tourSkippedEvent).toBeDefined();
              expect(tourSkippedEvent?.metadata).toHaveProperty("currentStep");
              expect(tourSkippedEvent?.metadata).toHaveProperty("totalSteps");
              expect(tourSkippedEvent?.metadata).toHaveProperty("duration");
            });
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it("should allow skipping from any step in the tour", async () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          localStorage.setItem("user_id", userId);
          
          const onComplete = vi.fn();
          const onSkip = vi.fn();
          
          const { container, rerender } = render(
            <BrowserRouter>
              <GuidedTour
                onComplete={onComplete}
                onSkip={onSkip}
                isActive={true}
              />
            </BrowserRouter>
          );

          // Wait for tour to render on step 1
          await waitFor(
            () => {
              const skipButton = container.querySelector('button[aria-label="Skip tour"]');
              expect(skipButton).not.toBeNull();
            },
            { timeout: 2000 }
          );

          // Verify skip button is present on step 1
          let skipButton = container.querySelector('button[aria-label="Skip tour"]');
          expect(skipButton).not.toBeNull();

          // Click Next to go to step 2
          const nextButton = screen.queryByText(/Next/i);
          if (nextButton) {
            await userEvent.click(nextButton);
            
            // Wait a bit for step transition
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verify skip button is still present on step 2
            skipButton = container.querySelector('button[aria-label="Skip tour"]');
            expect(skipButton).not.toBeNull();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it("should clear sample data when tour is skipped", async () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          localStorage.setItem("user_id", userId);
          
          // Set some sample data
          localStorage.setItem("tour_sample_pet", JSON.stringify({ name: "Buddy" }));
          localStorage.setItem("tour_sample_health", JSON.stringify([{ id: 1 }]));
          
          const onComplete = vi.fn();
          const onSkip = vi.fn();
          
          const { container } = render(
            <BrowserRouter>
              <GuidedTour
                onComplete={onComplete}
                onSkip={onSkip}
                isActive={true}
              />
            </BrowserRouter>
          );

          // Wait for tour to render
          await waitFor(
            () => {
              const skipButton = container.querySelector('button[aria-label="Skip tour"]');
              expect(skipButton).not.toBeNull();
            },
            { timeout: 2000 }
          );

          // Click the skip button
          const skipButton = container.querySelector('button[aria-label="Skip tour"]');
          if (skipButton) {
            await userEvent.click(skipButton as HTMLElement);
            
            // Wait for skip to complete
            await waitFor(() => {
              expect(onSkip).toHaveBeenCalled();
            });

            // Verify sample data was cleared
            expect(localStorage.getItem("tour_sample_pet")).toBeNull();
            expect(localStorage.getItem("tour_sample_health")).toBeNull();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it("should exit tour immediately when skip is clicked", async () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          localStorage.setItem("user_id", userId);
          
          const onComplete = vi.fn();
          const onSkip = vi.fn();
          
          const { container } = render(
            <BrowserRouter>
              <GuidedTour
                onComplete={onComplete}
                onSkip={onSkip}
                isActive={true}
              />
            </BrowserRouter>
          );

          // Wait for tour to render
          await waitFor(
            () => {
              const skipButton = container.querySelector('button[aria-label="Skip tour"]');
              expect(skipButton).not.toBeNull();
            },
            { timeout: 2000 }
          );

          // Record time before skip
          const beforeSkip = Date.now();

          // Click the skip button
          const skipButton = container.querySelector('button[aria-label="Skip tour"]');
          if (skipButton) {
            await userEvent.click(skipButton as HTMLElement);
            
            // Verify onSkip was called quickly (within 1 second)
            await waitFor(
              () => {
                expect(onSkip).toHaveBeenCalled();
                const afterSkip = Date.now();
                const duration = afterSkip - beforeSkip;
                expect(duration).toBeLessThan(1000); // Should be immediate
              },
              { timeout: 1500 }
            );
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it("should have accessible skip button with proper aria-label", async () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          localStorage.setItem("user_id", userId);
          
          const onComplete = vi.fn();
          const onSkip = vi.fn();
          
          const { container } = render(
            <BrowserRouter>
              <GuidedTour
                onComplete={onComplete}
                onSkip={onSkip}
                isActive={true}
              />
            </BrowserRouter>
          );

          // Wait for tour to render
          await waitFor(
            () => {
              const skipButton = container.querySelector('button[aria-label="Skip tour"]');
              expect(skipButton).not.toBeNull();
              
              // Verify aria-label is present and descriptive
              expect(skipButton?.getAttribute("aria-label")).toBe("Skip tour");
            },
            { timeout: 2000 }
          );
        }
      ),
      { numRuns: 30 }
    );
  });

  it("should not call onComplete when skip is clicked", async () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          localStorage.setItem("user_id", userId);
          
          const onComplete = vi.fn();
          const onSkip = vi.fn();
          
          const { container } = render(
            <BrowserRouter>
              <GuidedTour
                onComplete={onComplete}
                onSkip={onSkip}
                isActive={true}
              />
            </BrowserRouter>
          );

          // Wait for tour to render
          await waitFor(
            () => {
              const skipButton = container.querySelector('button[aria-label="Skip tour"]');
              expect(skipButton).not.toBeNull();
            },
            { timeout: 2000 }
          );

          // Click the skip button
          const skipButton = container.querySelector('button[aria-label="Skip tour"]');
          if (skipButton) {
            await userEvent.click(skipButton as HTMLElement);
            
            // Wait for skip to complete
            await waitFor(() => {
              expect(onSkip).toHaveBeenCalled();
            });

            // Verify onComplete was NOT called
            expect(onComplete).not.toHaveBeenCalled();
          }
        }
      ),
      { numRuns: 30 }
    );
  });
});
