import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import LandingPreview from '@/pages/LandingPreview';

// Feature: outstanding-landing-page, Property 3: Border Radius Standards
describe('Property 3: Border Radius Standards', () => {
  beforeEach(() => {
    // Reset viewport
    window.innerWidth = 1024;
    window.innerHeight = 768;
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Helper function to parse border-radius values
   * Handles formats: 2.5rem, 5rem, 40px, 80px, etc.
   */
  const parseBorderRadius = (borderRadiusString: string): number | null => {
    if (!borderRadiusString || borderRadiusString === '0px' || borderRadiusString === 'none') {
      return null;
    }

    // Handle rem values
    const remMatch = borderRadiusString.match(/^([\d.]+)rem$/);
    if (remMatch) {
      return parseFloat(remMatch[1]);
    }

    // Handle px values - convert to rem (assuming 16px = 1rem)
    const pxMatch = borderRadiusString.match(/^([\d.]+)px$/);
    if (pxMatch) {
      return parseFloat(pxMatch[1]) / 16;
    }

    return null;
  };

  /**
   * Check if an element is a card component
   * Cards are identified by specific classes or being children of feature/pricing sections
   */
  const isCardComponent = (element: Element): boolean => {
    const classList = element.className || '';
    const classString = typeof classList === 'string' ? classList : classList.toString();
    
    // Check for card-related classes
    if (classString.includes('rounded-card')) {
      return true;
    }

    // Check if element has Card component styling patterns
    if (element.tagName === 'DIV') {
      const styles = window.getComputedStyle(element);
      const borderRadius = parseBorderRadius(styles.borderRadius);
      
      // If it has a border radius close to 2.5rem (40px), it's likely a card
      if (borderRadius !== null && Math.abs(borderRadius - 2.5) < 0.2) {
        return true;
      }
    }

    return false;
  };

  /**
   * Check if an element is a section container
   * Section containers are identified by specific classes or semantic section tags
   */
  const isSectionContainer = (element: Element): boolean => {
    const classList = element.className || '';
    const classString = typeof classList === 'string' ? classList : classList.toString();
    
    // Check for section-related classes
    if (classString.includes('rounded-section')) {
      return true;
    }

    // Check if it's a large container with section-like border radius
    if (element.tagName === 'DIV') {
      const styles = window.getComputedStyle(element);
      const borderRadius = parseBorderRadius(styles.borderRadius);
      
      // If it has a border radius close to 5rem (80px), it's likely a section container
      if (borderRadius !== null && Math.abs(borderRadius - 5) < 0.2) {
        return true;
      }
    }

    return false;
  };

  it('should apply 2.5rem border radius to all card components', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        // Test with different viewport sizes
        fc.constantFrom(320, 768, 1024, 1440),
        (viewportWidth) => {
          // Set viewport size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });

          window.dispatchEvent(new Event('resize'));

          // Render the landing page
          const { container } = render(
            <BrowserRouter>
              <LandingPreview />
            </BrowserRouter>
          );

          // Find all elements with rounded-card class
          const cardElements = container.querySelectorAll('.rounded-card, [class*="rounded-card"]');
          const violations: Array<{ element: string; expected: string; actual: string }> = [];

          cardElements.forEach((element) => {
            const styles = window.getComputedStyle(element);
            const borderRadius = styles.borderRadius;
            const borderRadiusValue = parseBorderRadius(borderRadius);

            if (borderRadiusValue !== null) {
              // Expected: 2.5rem = 40px
              // Allow small tolerance for browser rendering (±0.1rem = ±1.6px)
              const expectedRem = 2.5;
              const tolerance = 0.1;

              if (Math.abs(borderRadiusValue - expectedRem) > tolerance) {
                violations.push({
                  element: `${element.tagName.toLowerCase()}.${element.className.split(' ')[0]}`,
                  expected: '2.5rem (40px)',
                  actual: `${borderRadiusValue.toFixed(2)}rem (${(borderRadiusValue * 16).toFixed(0)}px)`,
                });
              }
            }
          });

          // Assert no violations
          if (violations.length > 0) {
            const uniqueViolations = Array.from(
              new Set(violations.map((v) => `${v.element}: expected ${v.expected}, got ${v.actual}`))
            ).slice(0, 10);

            expect(
              violations.length,
              `Found ${violations.length} card elements with incorrect border radius at viewport ${viewportWidth}px:\n${uniqueViolations.join('\n')}`
            ).toBe(0);
          }

          cleanup();
        }
      ),
      {
        numRuns: 20,
        verbose: true,
      }
    );
  });

  it('should apply 5rem border radius to all section containers', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        // Test with different viewport sizes
        fc.constantFrom(320, 768, 1024, 1440),
        (viewportWidth) => {
          // Set viewport size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });

          window.dispatchEvent(new Event('resize'));

          // Render the landing page
          const { container } = render(
            <BrowserRouter>
              <LandingPreview />
            </BrowserRouter>
          );

          // Find all elements with rounded-section class
          const sectionElements = container.querySelectorAll('.rounded-section, [class*="rounded-section"]');
          const violations: Array<{ element: string; expected: string; actual: string }> = [];

          sectionElements.forEach((element) => {
            const styles = window.getComputedStyle(element);
            const borderRadius = styles.borderRadius;
            const borderRadiusValue = parseBorderRadius(borderRadius);

            if (borderRadiusValue !== null) {
              // Expected: 5rem = 80px
              // Allow small tolerance for browser rendering (±0.1rem = ±1.6px)
              const expectedRem = 5;
              const tolerance = 0.1;

              if (Math.abs(borderRadiusValue - expectedRem) > tolerance) {
                violations.push({
                  element: `${element.tagName.toLowerCase()}.${element.className.split(' ')[0]}`,
                  expected: '5rem (80px)',
                  actual: `${borderRadiusValue.toFixed(2)}rem (${(borderRadiusValue * 16).toFixed(0)}px)`,
                });
              }
            }
          });

          // Assert no violations
          if (violations.length > 0) {
            const uniqueViolations = Array.from(
              new Set(violations.map((v) => `${v.element}: expected ${v.expected}, got ${v.actual}`))
            ).slice(0, 10);

            expect(
              violations.length,
              `Found ${violations.length} section containers with incorrect border radius at viewport ${viewportWidth}px:\n${uniqueViolations.join('\n')}`
            ).toBe(0);
          }

          cleanup();
        }
      ),
      {
        numRuns: 20,
        verbose: true,
      }
    );
  });

  it('should maintain border radius standards across all landing page sections', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        fc.constantFrom(768, 1024, 1440),
        (viewportWidth) => {
          // Set viewport size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });

          window.dispatchEvent(new Event('resize'));

          // Render the landing page
          const { container } = render(
            <BrowserRouter>
              <LandingPreview />
            </BrowserRouter>
          );

          // Check all elements with border radius
          const allElements = container.querySelectorAll('*');
          const cardViolations: string[] = [];
          const sectionViolations: string[] = [];

          allElements.forEach((element) => {
            const styles = window.getComputedStyle(element);
            const borderRadius = styles.borderRadius;
            const borderRadiusValue = parseBorderRadius(borderRadius);

            if (borderRadiusValue !== null && borderRadiusValue > 1) {
              // Only check significant border radius values (> 1rem)
              const isCard = isCardComponent(element);
              const isSection = isSectionContainer(element);

              if (isCard) {
                // Cards should have 2.5rem border radius
                const expectedRem = 2.5;
                const tolerance = 0.2;

                if (Math.abs(borderRadiusValue - expectedRem) > tolerance) {
                  cardViolations.push(
                    `Card element: expected 2.5rem, got ${borderRadiusValue.toFixed(2)}rem`
                  );
                }
              } else if (isSection) {
                // Section containers should have 5rem border radius
                const expectedRem = 5;
                const tolerance = 0.2;

                if (Math.abs(borderRadiusValue - expectedRem) > tolerance) {
                  sectionViolations.push(
                    `Section container: expected 5rem, got ${borderRadiusValue.toFixed(2)}rem`
                  );
                }
              }
            }
          });

          // Assert no violations
          const allViolations = [...cardViolations, ...sectionViolations];
          if (allViolations.length > 0) {
            const uniqueViolations = Array.from(new Set(allViolations)).slice(0, 10);
            expect(
              allViolations.length,
              `Found ${allViolations.length} border radius violations at viewport ${viewportWidth}px:\n${uniqueViolations.join('\n')}`
            ).toBe(0);
          }

          cleanup();
        }
      ),
      {
        numRuns: 15,
        verbose: true,
      }
    );
  });

  it('should verify FeatureCard components use 2.5rem border radius', () => {
    const { container } = render(
      <BrowserRouter>
        <LandingPreview />
      </BrowserRouter>
    );

    // Find feature cards specifically
    const featureSection = container.querySelector('section');
    if (featureSection) {
      const cards = featureSection.querySelectorAll('.rounded-card');
      
      expect(cards.length).toBeGreaterThan(0);

      cards.forEach((card) => {
        const styles = window.getComputedStyle(card);
        const borderRadius = parseBorderRadius(styles.borderRadius);

        if (borderRadius !== null) {
          // Expected: 2.5rem with small tolerance
          expect(Math.abs(borderRadius - 2.5)).toBeLessThan(0.2);
        }
      });
    }

    cleanup();
  });

  it('should verify InteractiveDemoSection uses 5rem border radius for main container', () => {
    const { container } = render(
      <BrowserRouter>
        <LandingPreview />
      </BrowserRouter>
    );

    // Find section containers with rounded-section class
    const sectionContainers = container.querySelectorAll('.rounded-section');
    
    if (sectionContainers.length > 0) {
      sectionContainers.forEach((sectionContainer) => {
        const styles = window.getComputedStyle(sectionContainer);
        const borderRadius = parseBorderRadius(styles.borderRadius);

        if (borderRadius !== null) {
          // Expected: 5rem with small tolerance
          expect(Math.abs(borderRadius - 5)).toBeLessThan(0.2);
        }
      });
    }

    cleanup();
  });
});
