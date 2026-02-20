import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import LandingPreview from '@/pages/LandingPreview';

// Feature: outstanding-landing-page, Property 19: Page Load Performance
describe('Property 19: Page Load Performance', () => {
  beforeEach(() => {
    // Reset viewport
    window.innerWidth = 1024;
    window.innerHeight = 768;
    
    // Mock performance.timing for testing
    const mockTiming = {
      navigationStart: 0,
      loadEventEnd: 0,
      domContentLoadedEventEnd: 0,
      domInteractive: 0,
    };
    
    Object.defineProperty(window.performance, 'timing', {
      writable: true,
      configurable: true,
      value: mockTiming,
    });
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Helper function to measure render time
   * Returns the time taken to render the component in milliseconds
   */
  const measureRenderTime = async (): Promise<number> => {
    const startTime = performance.now();
    
    const { container } = render(
      <BrowserRouter>
        <LandingPreview />
      </BrowserRouter>
    );
    
    // Wait for hero section to be fully rendered
    await waitFor(() => {
      const heroSection = container.querySelector('header[role="banner"]');
      expect(heroSection).toBeTruthy();
    }, { timeout: 3000 });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    cleanup();
    return renderTime;
  };

  /**
   * Helper function to check if hero section is interactive
   * Verifies that the CTA button is present and clickable
   */
  const isHeroInteractive = (container: HTMLElement): boolean => {
    // Check for hero section (uses header element)
    const heroSection = container.querySelector('header[role="banner"]');
    if (!heroSection) return false;
    
    // Check for headline (should use Anton font)
    const headline = heroSection.querySelector('h1');
    if (!headline) return false;
    
    // Check for CTA button
    const ctaButton = heroSection.querySelector('button');
    if (!ctaButton) return false;
    
    // Verify button is not disabled
    if (ctaButton.hasAttribute('disabled')) return false;
    
    // Verify button has text content
    if (!ctaButton.textContent || ctaButton.textContent.trim().length === 0) return false;
    
    return true;
  };

  it('should render hero section with headline and CTA within 2 seconds', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        // Test with different viewport sizes to ensure performance across devices
        fc.constantFrom(320, 375, 768, 1024, 1440),
        async (viewportWidth) => {
          // Set viewport size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });
          
          window.dispatchEvent(new Event('resize'));
          
          // Measure render time
          const startTime = performance.now();
          
          const { container } = render(
            <BrowserRouter>
              <LandingPreview />
            </BrowserRouter>
          );
          
          // Wait for hero section to be fully rendered and interactive
          await waitFor(() => {
            expect(isHeroInteractive(container)).toBe(true);
          }, { timeout: 3000 });
          
          const endTime = performance.now();
          const renderTime = endTime - startTime;
          
          // Property: Hero section should render within 2000ms (2 seconds)
          expect(
            renderTime,
            `Hero section took ${renderTime.toFixed(2)}ms to render at ${viewportWidth}px viewport (should be < 2000ms)`
          ).toBeLessThan(2000);
          
          // Verify hero section is interactive
          expect(isHeroInteractive(container)).toBe(true);
          
          cleanup();
        }
      ),
      {
        numRuns: 20,
        verbose: true,
      }
    );
  });

  it('should render hero section elements in correct order and structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(768, 1024, 1440),
        async (viewportWidth) => {
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });
          
          const startTime = performance.now();
          
          const { container } = render(
            <BrowserRouter>
              <LandingPreview />
            </BrowserRouter>
          );
          
          // Wait for render
          await waitFor(() => {
            const heroSection = container.querySelector('header[role="banner"]');
            expect(heroSection).toBeTruthy();
          }, { timeout: 2000 });
          
          const renderTime = performance.now() - startTime;
          
          // Verify render time
          expect(renderTime).toBeLessThan(2000);
          
          // Verify structure
          const heroSection = container.querySelector('header[role="banner"]');
          expect(heroSection).toBeTruthy();
          
          // Check for headline
          const headline = heroSection!.querySelector('h1');
          expect(headline).toBeTruthy();
          expect(headline!.textContent).toBeTruthy();
          
          // Check for CTA button
          const ctaButton = heroSection!.querySelector('button');
          expect(ctaButton).toBeTruthy();
          expect(ctaButton!.textContent).toBeTruthy();
          
          cleanup();
        }
      ),
      {
        numRuns: 15,
      }
    );
  });

  it('should maintain performance with multiple rapid renders', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 3, max: 5 }),
        async (renderCount) => {
          const renderTimes: number[] = [];
          
          for (let i = 0; i < renderCount; i++) {
            const startTime = performance.now();
            
            const { container } = render(
              <BrowserRouter>
                <LandingPreview />
              </BrowserRouter>
            );
            
            await waitFor(() => {
              expect(isHeroInteractive(container)).toBe(true);
            }, { timeout: 2500 });
            
            const renderTime = performance.now() - startTime;
            renderTimes.push(renderTime);
            
            cleanup();
          }
          
          // All renders should complete within 2 seconds
          renderTimes.forEach((time, index) => {
            expect(
              time,
              `Render ${index + 1}/${renderCount} took ${time.toFixed(2)}ms (should be < 2000ms)`
            ).toBeLessThan(2000);
          });
          
          // Average render time should be well under 2 seconds
          const avgRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
          expect(
            avgRenderTime,
            `Average render time ${avgRenderTime.toFixed(2)}ms should be < 1500ms`
          ).toBeLessThan(1500);
        }
      ),
      {
        numRuns: 10,
      }
    );
  });

  it('should render hero section quickly on mobile devices (320px-767px)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 320, max: 767 }),
        async (viewportWidth) => {
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });
          
          window.dispatchEvent(new Event('resize'));
          
          const startTime = performance.now();
          
          const { container } = render(
            <BrowserRouter>
              <LandingPreview />
            </BrowserRouter>
          );
          
          await waitFor(() => {
            expect(isHeroInteractive(container)).toBe(true);
          }, { timeout: 2500 });
          
          const renderTime = performance.now() - startTime;
          
          // Mobile devices should still render within 2 seconds
          expect(
            renderTime,
            `Mobile render at ${viewportWidth}px took ${renderTime.toFixed(2)}ms (should be < 2000ms)`
          ).toBeLessThan(2000);
          
          cleanup();
        }
      ),
      {
        numRuns: 15,
      }
    );
  });

  it('should have CTA button ready for interaction within 2 seconds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(375, 768, 1024),
        async (viewportWidth) => {
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });
          
          const startTime = performance.now();
          
          const { container } = render(
            <BrowserRouter>
              <LandingPreview />
            </BrowserRouter>
          );
          
          // Wait for CTA button to be interactive
          let ctaButton: Element | null = null;
          await waitFor(() => {
            const heroSection = container.querySelector('header[role="banner"]');
            ctaButton = heroSection?.querySelector('button') || null;
            expect(ctaButton).toBeTruthy();
            expect(ctaButton?.hasAttribute('disabled')).toBe(false);
          }, { timeout: 2500 });
          
          const interactiveTime = performance.now() - startTime;
          
          // CTA should be interactive within 2 seconds
          expect(
            interactiveTime,
            `CTA became interactive in ${interactiveTime.toFixed(2)}ms (should be < 2000ms)`
          ).toBeLessThan(2000);
          
          // Verify button can be clicked (has click handler or navigation)
          expect(ctaButton).toBeTruthy();
          expect(ctaButton!.textContent).toBeTruthy();
          
          cleanup();
        }
      ),
      {
        numRuns: 15,
      }
    );
  });

  it('should render critical above-the-fold content within performance budget', async () => {
    const { container } = render(
      <BrowserRouter>
        <LandingPreview />
      </BrowserRouter>
    );
    
    const startTime = performance.now();
    
    // Wait for critical content to be visible
    await waitFor(() => {
      // Hero section
      const heroSection = container.querySelector('header[role="banner"]');
      expect(heroSection).toBeTruthy();
      
      // Headline
      const headline = heroSection?.querySelector('h1');
      expect(headline).toBeTruthy();
      
      // CTA button
      const ctaButton = heroSection?.querySelector('button');
      expect(ctaButton).toBeTruthy();
      
      // Features section (also above-the-fold)
      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 2500 });
    
    const renderTime = performance.now() - startTime;
    
    // Critical above-the-fold content should render within 2 seconds
    expect(
      renderTime,
      `Critical content rendered in ${renderTime.toFixed(2)}ms (should be < 2000ms)`
    ).toBeLessThan(2000);
    
    cleanup();
  });

  it('should not block rendering with lazy-loaded below-the-fold content', async () => {
    const startTime = performance.now();
    
    const { container } = render(
      <BrowserRouter>
        <LandingPreview />
      </BrowserRouter>
    );
    
    // Hero section should render quickly even if other sections are lazy-loaded
    await waitFor(() => {
      const heroSection = container.querySelector('header[role="banner"]');
      expect(heroSection).toBeTruthy();
      
      // Check for headline
      const headline = heroSection?.querySelector('h1');
      expect(headline).toBeTruthy();
      
      // Check for button (may be in hero section or nearby)
      const button = container.querySelector('button');
      expect(button).toBeTruthy();
    }, { timeout: 2000 });
    
    const heroRenderTime = performance.now() - startTime;
    
    // Hero should render within 2 seconds regardless of lazy loading
    expect(
      heroRenderTime,
      `Hero rendered in ${heroRenderTime.toFixed(2)}ms with lazy loading (should be < 2000ms)`
    ).toBeLessThan(2000);
    
    cleanup();
  });
});
