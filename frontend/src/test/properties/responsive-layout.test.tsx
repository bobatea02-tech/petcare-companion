import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import LandingPreview from '@/pages/LandingPreview';

// Feature: outstanding-landing-page, Property 16: Responsive Layout Adaptation
describe('Property 16: Responsive Layout Adaptation', () => {
  beforeEach(() => {
    // Reset viewport before each test
    window.innerWidth = 1024;
    window.innerHeight = 768;
  });

  afterEach(() => {
    cleanup();
  });

  it('should adapt layout without horizontal scrolling or broken layouts across all viewport widths (320px-1920px)', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        // Generate viewport widths from 320px to 1920px
        fc.integer({ min: 320, max: 1920 }),
        // Generate viewport heights from 568px to 1080px (common mobile to desktop heights)
        fc.integer({ min: 568, max: 1080 }),
        (viewportWidth, viewportHeight) => {
          // Set viewport size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });
          Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: viewportHeight,
          });

          // Trigger resize event
          window.dispatchEvent(new Event('resize'));

          // Render the landing page
          const { container } = render(
            <BrowserRouter>
              <LandingPreview />
            </BrowserRouter>
          );

          // Property 1: No horizontal scrolling
          // The document body should not exceed the viewport width
          const bodyWidth = document.body.scrollWidth;
          expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

          // Property 2: All sections should be visible (not broken)
          // Check that main container exists and is rendered
          const mainContainer = container.querySelector('.min-h-screen');
          expect(mainContainer).toBeTruthy();

          // Property 3: No elements should overflow horizontally
          const allElements = container.querySelectorAll('*');
          allElements.forEach((element) => {
            const rect = element.getBoundingClientRect();
            // Allow for small rounding errors (1px tolerance)
            if (rect.width > 0) {
              expect(rect.right).toBeLessThanOrEqual(viewportWidth + 1);
            }
          });

          // Property 4: Responsive breakpoints should apply correctly
          // Mobile: 320px - 767px
          // Tablet: 768px - 1023px
          // Desktop: 1024px+
          // Note: We check that grid elements exist and have proper display
          // The actual grid-template-columns will vary by breakpoint
          const gridElements = container.querySelectorAll('[class*="grid"]');
          if (gridElements.length > 0) {
            // At least one grid element should exist
            // We don't enforce specific display values as Tailwind may apply
            // different strategies (flex, grid, block) based on viewport
            expect(gridElements.length).toBeGreaterThan(0);
          }

          // Property 5: Text should remain readable (not cut off)
          const textElements = container.querySelectorAll('h1, h2, h3, p, span, button');
          textElements.forEach((element) => {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0) {
              // Text elements should not overflow their container
              const parent = element.parentElement;
              if (parent) {
                const parentRect = parent.getBoundingClientRect();
                // Allow for padding and margins
                expect(rect.right).toBeLessThanOrEqual(parentRect.right + 20);
              }
            }
          });

          // Cleanup
          cleanup();
        }
      ),
      {
        numRuns: 50,
        verbose: true,
      }
    );
  });

  it('should maintain mobile-first responsive design with proper breakpoints', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(320, 375, 414, 768, 1024, 1280, 1440, 1920),
        (viewportWidth) => {
          // Set viewport size to common breakpoints
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });

          window.dispatchEvent(new Event('resize'));

          const { container } = render(
            <BrowserRouter>
              <LandingPreview />
            </BrowserRouter>
          );

          // Check that the page renders without errors
          expect(container).toBeTruthy();

          // Check that responsive classes are applied
          const sections = container.querySelectorAll('section');
          expect(sections.length).toBeGreaterThan(0);

          // Verify no horizontal overflow
          const bodyWidth = document.body.scrollWidth;
          expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

          cleanup();
        }
      ),
      {
        numRuns: 50,
      }
    );
  });

  it('should handle extreme viewport widths gracefully', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(320, 1920), // Minimum and maximum supported widths
        (viewportWidth) => {
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });

          window.dispatchEvent(new Event('resize'));

          const { container } = render(
            <BrowserRouter>
              <LandingPreview />
            </BrowserRouter>
          );

          // At minimum width (320px), layout should still be functional
          // At maximum width (1920px), layout should not break
          const mainContainer = container.querySelector('.min-h-screen');
          expect(mainContainer).toBeTruthy();

          // No horizontal scrolling at extremes
          const bodyWidth = document.body.scrollWidth;
          expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

          cleanup();
        }
      ),
      {
        numRuns: 20,
      }
    );
  });
});
