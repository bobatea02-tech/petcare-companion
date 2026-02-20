import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import Dashboard from "@/pages/Dashboard";

// Feature: outstanding-landing-page, Property 10: Guided Tour Activation
// For any user completing onboarding, the Guided Tour overlay should automatically
// appear on the dashboard with the first tooltip visible.
// Validates: Requirements 7.1

describe("Property 10: Guided Tour Activation", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock fetch for pets API
    global.fetch = vi.fn((url) => {
      if (url.includes("/api/v1/pets")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);
      }
      return Promise.reject(new Error("Unknown URL"));
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("should activate tour when start_tour flag is set and tour not completed", async () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          email: fc.emailAddress(),
          petId: fc.uuid(),
        }),
        async (userData) => {
          // Simulate onboarding completion by setting the start_tour flag
          localStorage.setItem("start_tour", "true");
          localStorage.setItem("user_id", userData.userId);
          
          // Render Dashboard
          const { container } = renderWithProviders(<Dashboard />);

          // Wait for tour to activate (there's a 1 second delay in the code)
          await waitFor(
            () => {
              // Check that the tour overlay is present
              // The tour should display the first tooltip
              const tourElements = container.querySelectorAll('[data-testid*="tour"]');
              const tooltipElements = container.querySelectorAll('[role="dialog"]');
              
              // Tour should be active - either tour elements or tooltip should be present
              const tourActive = tourElements.length > 0 || tooltipElements.length > 0;
              
              // Also check if the backdrop is present (semi-transparent overlay)
              const backdrop = container.querySelector('.fixed.inset-0');
              
              expect(tourActive || backdrop !== null).toBe(true);
            },
            { timeout: 2000 }
          );

          // Verify start_tour flag was removed after activation
          expect(localStorage.getItem("start_tour")).toBeNull();
        }
      ),
      { numRuns: 20 }
    );
  });

  it("should NOT activate tour when tour_completed flag is set", async () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          email: fc.emailAddress(),
        }),
        async (userData) => {
          // Simulate completed tour
          localStorage.setItem("start_tour", "true");
          localStorage.setItem("tour_completed", "true");
          localStorage.setItem("user_id", userData.userId);
          
          // Render Dashboard
          const { container } = renderWithProviders(<Dashboard />);

          // Wait a bit to ensure tour doesn't activate
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Tour should NOT be active
          const tourElements = container.querySelectorAll('[data-testid*="tour"]');
          const tooltipElements = container.querySelectorAll('[role="dialog"]');
          
          // Check that no tour elements are present
          expect(tourElements.length).toBe(0);
          expect(tooltipElements.length).toBe(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  it("should NOT activate tour when start_tour flag is not set", async () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          email: fc.emailAddress(),
        }),
        async (userData) => {
          // No start_tour flag set
          localStorage.setItem("user_id", userData.userId);
          
          // Render Dashboard
          const { container } = renderWithProviders(<Dashboard />);

          // Wait a bit to ensure tour doesn't activate
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Tour should NOT be active
          const tourElements = container.querySelectorAll('[data-testid*="tour"]');
          const tooltipElements = container.querySelectorAll('[role="dialog"]');
          
          // Check that no tour elements are present
          expect(tourElements.length).toBe(0);
          expect(tooltipElements.length).toBe(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  it("should activate tour with first tooltip visible", async () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          // Set up for tour activation
          localStorage.setItem("start_tour", "true");
          localStorage.setItem("user_id", userId);
          
          // Render Dashboard
          const { container } = renderWithProviders(<Dashboard />);

          // Wait for tour to activate
          await waitFor(
            () => {
              // The first tooltip should be about the Voice Assistant (JoJo)
              // Check for tour-related text or elements
              const hasTooltip = 
                container.textContent?.includes("JoJo") ||
                container.textContent?.includes("Voice Assistant") ||
                container.querySelector('[role="dialog"]') !== null;
              
              expect(hasTooltip).toBe(true);
            },
            { timeout: 2000 }
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  it("should track tour_started analytics event on activation", async () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          // Clear analytics events
          localStorage.removeItem("analytics_events");
          
          // Set up for tour activation
          localStorage.setItem("start_tour", "true");
          localStorage.setItem("user_id", userId);
          
          // Render Dashboard
          renderWithProviders(<Dashboard />);

          // Wait for tour to activate and analytics to be tracked
          await waitFor(
            () => {
              const events = JSON.parse(localStorage.getItem("analytics_events") || "[]");
              const tourStartedEvent = events.find(
                (e: any) => e.eventType === "tour_started"
              );
              
              expect(tourStartedEvent).toBeDefined();
            },
            { timeout: 2000 }
          );
        }
      ),
      { numRuns: 20 }
    );
  });
});
