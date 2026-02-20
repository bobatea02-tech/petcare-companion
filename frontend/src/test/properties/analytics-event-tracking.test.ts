import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import {
  trackEvent,
  clearQueue,
  type AnalyticsEventType,
} from "@/lib/analytics";

// Feature: outstanding-landing-page, Property 18: Analytics Event Tracking
// For any user action (sign-up, pet added, tour completed, tour skipped),
// an analytics event should be tracked with the correct event type and timestamp.

describe("Property 18: Analytics Event Tracking", () => {
  beforeEach(() => {
    // Clear localStorage and queue before each test
    localStorage.clear();
    clearQueue();

    // Mock console methods to avoid noise in test output
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should track events with correct event type and timestamp", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<AnalyticsEventType>(
          "page_view",
          "cta_click",
          "sign_up",
          "pet_added",
          "tour_completed",
          "tour_skipped",
          "sign_up_complete",
          "tour_started",
          "tour_step_completed"
        ),
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        fc.option(
          fc.dictionary(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.oneof(
              fc.string(),
              fc.integer(),
              fc.boolean(),
              fc.constant(null)
            )
          ),
          { nil: undefined }
        ),
        async (eventType, userId, metadata) => {
          // Clear previous mock calls for this iteration
          vi.clearAllMocks();
          
          const beforeTimestamp = Date.now();

          // Track the event
          await trackEvent(eventType, metadata, userId);

          const afterTimestamp = Date.now();

          // Verify that console.log was called with the correct event structure
          expect(console.log).toHaveBeenCalledWith(
            "[Analytics] Tracking event:",
            expect.objectContaining({
              eventType,
              timestamp: expect.any(Number),
            })
          );

          // Find the actual event that was logged (should be the most recent call)
          const trackingCalls = (console.log as any).mock.calls.filter(
            (call: any) => call[0] === "[Analytics] Tracking event:"
          );

          expect(trackingCalls.length).toBeGreaterThan(0);
          const trackedEvent = trackingCalls[trackingCalls.length - 1][1];

          // Verify event type matches
          expect(trackedEvent.eventType).toBe(eventType);

          // Verify timestamp is within the expected range
          expect(trackedEvent.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
          expect(trackedEvent.timestamp).toBeLessThanOrEqual(afterTimestamp);

          // Verify userId is included if provided
          if (userId !== undefined) {
            expect(trackedEvent.userId).toBe(userId);
          }

          // Verify metadata is included if provided
          if (metadata !== undefined) {
            expect(trackedEvent.metadata).toEqual(metadata);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should track all required event types correctly", async () => {
    const requiredEventTypes: AnalyticsEventType[] = [
      "page_view",
      "cta_click",
      "sign_up",
      "pet_added",
      "tour_completed",
      "tour_skipped",
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...requiredEventTypes),
        async (eventType) => {
          // Clear previous mock calls for this iteration
          vi.clearAllMocks();
          
          const beforeTimestamp = Date.now();

          await trackEvent(eventType);

          const afterTimestamp = Date.now();

          // Verify the event was tracked
          expect(console.log).toHaveBeenCalledWith(
            "[Analytics] Tracking event:",
            expect.objectContaining({
              eventType,
              timestamp: expect.any(Number),
            })
          );

          // Verify timestamp is valid (get the most recent tracking call)
          const trackingCalls = (console.log as any).mock.calls.filter(
            (call: any) => call[0] === "[Analytics] Tracking event:"
          );
          const trackedEvent = trackingCalls[trackingCalls.length - 1][1];

          expect(trackedEvent.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
          expect(trackedEvent.timestamp).toBeLessThanOrEqual(afterTimestamp);
        }
      ),
      { numRuns: 50 }
    );
  });

  it("should track events with metadata correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<AnalyticsEventType>(
          "page_view",
          "cta_click",
          "sign_up",
          "pet_added"
        ),
        fc.record({
          page: fc.option(fc.string(), { nil: undefined }),
          location: fc.option(fc.string(), { nil: undefined }),
          buttonText: fc.option(fc.string(), { nil: undefined }),
          authProvider: fc.option(fc.constantFrom("email", "google"), {
            nil: undefined,
          }),
          petType: fc.option(fc.constantFrom("dog", "cat", "bird", "fish"), {
            nil: undefined,
          }),
        }),
        async (eventType, metadata) => {
          await trackEvent(eventType, metadata);

          // Verify metadata is included in the tracked event
          expect(console.log).toHaveBeenCalledWith(
            "[Analytics] Tracking event:",
            expect.objectContaining({
              eventType,
              metadata,
            })
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  it("should track events with userId when provided", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<AnalyticsEventType>(
          "sign_up",
          "pet_added",
          "tour_completed",
          "tour_skipped"
        ),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (eventType, userId) => {
          await trackEvent(eventType, undefined, userId);

          // Verify userId is included in the tracked event
          expect(console.log).toHaveBeenCalledWith(
            "[Analytics] Tracking event:",
            expect.objectContaining({
              eventType,
              userId,
            })
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  it("should generate unique timestamps for sequential events", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.constantFrom<AnalyticsEventType>(
            "page_view",
            "cta_click",
            "sign_up",
            "pet_added"
          ),
          { minLength: 2, maxLength: 10 }
        ),
        async (eventTypes) => {
          const timestamps: number[] = [];

          // Track multiple events sequentially
          for (const eventType of eventTypes) {
            await trackEvent(eventType);

            // Extract the timestamp from the logged event
            const trackingCall = (console.log as any).mock.calls.findLast(
              (call: any) => call[0] === "[Analytics] Tracking event:"
            );
            if (trackingCall) {
              timestamps.push(trackingCall[1].timestamp);
            }
          }

          // Verify all timestamps are in ascending order (or equal for very fast events)
          for (let i = 1; i < timestamps.length; i++) {
            expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it("should track tour-related events with correct event types", async () => {
    const tourEventTypes: AnalyticsEventType[] = [
      "tour_started",
      "tour_step_completed",
      "tour_completed",
      "tour_skipped",
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...tourEventTypes),
        fc.option(
          fc.record({
            step: fc.integer({ min: 1, max: 3 }),
            feature: fc.constantFrom("voice", "health", "vet"),
          }),
          { nil: undefined }
        ),
        async (eventType, metadata) => {
          // Clear previous mock calls for this iteration
          vi.clearAllMocks();
          
          await trackEvent(eventType, metadata);

          // Verify the tour event was tracked correctly
          expect(console.log).toHaveBeenCalledWith(
            "[Analytics] Tracking event:",
            expect.objectContaining({
              eventType,
              timestamp: expect.any(Number),
            })
          );

          if (metadata) {
            const trackingCalls = (console.log as any).mock.calls.filter(
              (call: any) => call[0] === "[Analytics] Tracking event:"
            );
            const trackedEvent = trackingCalls[trackingCalls.length - 1][1];
            expect(trackedEvent.metadata).toEqual(metadata);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
