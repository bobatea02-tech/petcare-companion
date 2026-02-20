/**
 * Analytics Module Tests
 * Tests for the analytics utility module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initializeAnalytics,
  trackEvent,
  trackPageLoadTime,
  getQueueSize,
  clearQueue,
} from '@/lib/analytics';

describe('Analytics Module', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    clearQueue();
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initializeAnalytics', () => {
    it('should initialize without errors', () => {
      expect(() => initializeAnalytics()).not.toThrow();
    });

    it('should load queued events from localStorage', () => {
      // Pre-populate localStorage with queued events
      const queuedEvents = [
        {
          eventType: 'page_view',
          timestamp: Date.now(),
          retryCount: 0,
          nextRetryTime: Date.now() + 1000,
        },
      ];
      localStorage.setItem('analytics_event_queue', JSON.stringify(queuedEvents));

      initializeAnalytics();
      
      // Queue should be loaded
      expect(getQueueSize()).toBe(1);
    });
  });

  describe('trackEvent', () => {
    it('should track a page_view event', async () => {
      await trackEvent('page_view', { page: 'landing' });
      
      // Event should be logged
      expect(console.log).toHaveBeenCalledWith(
        '[Analytics] Tracking event:',
        expect.objectContaining({
          eventType: 'page_view',
          metadata: { page: 'landing' },
        })
      );
    });

    it('should track a cta_click event with metadata', async () => {
      await trackEvent('cta_click', { location: 'hero', buttonText: 'Get Started' });
      
      expect(console.log).toHaveBeenCalledWith(
        '[Analytics] Tracking event:',
        expect.objectContaining({
          eventType: 'cta_click',
          metadata: { location: 'hero', buttonText: 'Get Started' },
        })
      );
    });

    it('should track a sign_up event with userId', async () => {
      await trackEvent('sign_up', { authProvider: 'email' }, 'user-123');
      
      expect(console.log).toHaveBeenCalledWith(
        '[Analytics] Tracking event:',
        expect.objectContaining({
          eventType: 'sign_up',
          userId: 'user-123',
          metadata: { authProvider: 'email' },
        })
      );
    });

    it('should include timestamp in event', async () => {
      const beforeTimestamp = Date.now();
      await trackEvent('page_view');
      const afterTimestamp = Date.now();
      
      expect(console.log).toHaveBeenCalledWith(
        '[Analytics] Tracking event:',
        expect.objectContaining({
          timestamp: expect.any(Number),
        })
      );
      
      const call = (console.log as any).mock.calls.find(
        (call: any) => call[0] === '[Analytics] Tracking event:'
      );
      const event = call[1];
      expect(event.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(event.timestamp).toBeLessThanOrEqual(afterTimestamp);
    });
  });

  describe('trackPageLoadTime', () => {
    it('should return null if performance data not available', () => {
      // Mock performance.timing to return invalid data
      const originalTiming = window.performance.timing;
      Object.defineProperty(window.performance, 'timing', {
        value: {
          navigationStart: 0,
          loadEventEnd: 0,
        },
        configurable: true,
      });

      const result = trackPageLoadTime();
      expect(result).toBeNull();

      // Restore
      Object.defineProperty(window.performance, 'timing', {
        value: originalTiming,
        configurable: true,
      });
    });
  });

  describe('Event Queue', () => {
    it('should queue events when offline', async () => {
      // Mock navigator.onLine to return false
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      await trackEvent('page_view');
      
      // Event should be queued
      expect(getQueueSize()).toBeGreaterThan(0);

      // Restore
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });
    });

    it('should clear queue', () => {
      clearQueue();
      expect(getQueueSize()).toBe(0);
    });
  });

  describe('Event Types', () => {
    const eventTypes = [
      'page_view',
      'cta_click',
      'sign_up',
      'pet_added',
      'tour_completed',
      'tour_skipped',
      'sign_up_complete',
      'tour_started',
      'tour_step_completed',
    ];

    eventTypes.forEach((eventType) => {
      it(`should track ${eventType} event`, async () => {
        await trackEvent(eventType as any);
        
        expect(console.log).toHaveBeenCalledWith(
          '[Analytics] Tracking event:',
          expect.objectContaining({
            eventType,
          })
        );
      });
    });
  });
});
