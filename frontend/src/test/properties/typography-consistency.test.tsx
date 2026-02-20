import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import LandingPreview from '@/pages/LandingPreview';
import { FONTS } from '@/lib/design-system';

// Feature: outstanding-landing-page, Property 2: Typography Consistency
describe('Property 2: Typography Consistency', () => {
  beforeEach(() => {
    // Reset viewport
    window.innerWidth = 1024;
    window.innerHeight = 768;
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Helper function to extract font family from computed styles
   * Handles various font-family formats and normalizes them
   */
  const extractFontFamily = (fontFamilyString: string): string => {
    if (!fontFamilyString) return '';
    
    // Remove quotes and normalize
    const normalized = fontFamilyString
      .replace(/['"]/g, '')
      .split(',')[0]
      .trim()
      .toLowerCase();
    
    return normalized;
  };

  /**
   * Check if an element is a heading element (h1-h6)
   */
  const isHeadingElement = (element: Element): boolean => {
    const tagName = element.tagName.toLowerCase();
    return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName);
  };

  /**
   * Check if an element is a body text element (p, span, div with text content)
   */
  const isBodyTextElement = (element: Element): boolean => {
    const tagName = element.tagName.toLowerCase();
    const hasTextContent = element.textContent && element.textContent.trim().length > 0;
    
    // Body text elements: p, span, div (with text), li, a, label, etc.
    const bodyTextTags = ['p', 'span', 'div', 'li', 'a', 'label', 'button'];
    
    return bodyTextTags.includes(tagName) && hasTextContent;
  };

  /**
   * Check if element has font-display class (Anton font)
   */
  const hasDisplayFont = (element: Element): boolean => {
    return element.classList.contains('font-display');
  };

  /**
   * Check if element has font-body class (Inter font)
   */
  const hasBodyFont = (element: Element): boolean => {
    return element.classList.contains('font-body');
  };

  /**
   * Verify that computed font family matches expected font
   */
  const verifyFontFamily = (element: Element, expectedFont: string): boolean => {
    const styles = window.getComputedStyle(element);
    const fontFamily = extractFontFamily(styles.fontFamily);
    
    // Check if the font family contains the expected font
    return fontFamily.includes(expectedFont.toLowerCase());
  };

  it('should use Anton font for all heading elements (h1-h6)', { timeout: 60000 }, () => {
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

          // Find all heading elements
          const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
          const violations: Array<{ element: string; font: string }> = [];

          headings.forEach((heading) => {
            const tagName = heading.tagName.toLowerCase();
            const hasDisplayClass = hasDisplayFont(heading);
            const computedFont = verifyFontFamily(heading, FONTS.display);

            // Heading should have font-display class or inherit Anton font
            if (!hasDisplayClass && !computedFont) {
              const styles = window.getComputedStyle(heading);
              violations.push({
                element: `${tagName}${heading.className ? '.' + heading.className.split(' ')[0] : ''}`,
                font: extractFontFamily(styles.fontFamily),
              });
            }
          });

          // Assert that all headings use Anton font
          if (violations.length > 0) {
            const uniqueViolations = Array.from(
              new Set(violations.map((v) => `${v.element}: ${v.font}`))
            ).slice(0, 10);

            expect(
              violations.length,
              `Found ${violations.length} heading elements not using Anton font at viewport ${viewportWidth}px:\n${uniqueViolations.join('\n')}`
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

  it('should use Inter font for all body text elements', { timeout: 60000 }, () => {
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

          // Find all body text elements (p, span, div with text)
          const bodyElements = container.querySelectorAll('p, span');
          const violations: Array<{ element: string; font: string }> = [];

          bodyElements.forEach((element) => {
            const tagName = element.tagName.toLowerCase();
            const hasText = element.textContent && element.textContent.trim().length > 0;
            
            // Skip elements without text content
            if (!hasText) return;
            
            // Skip heading elements
            if (isHeadingElement(element)) return;

            const hasBodyClass = hasBodyFont(element);
            const computedFont = verifyFontFamily(element, FONTS.body);

            // Body text should have font-body class or inherit Inter font
            if (!hasBodyClass && !computedFont) {
              const styles = window.getComputedStyle(element);
              const fontFamily = extractFontFamily(styles.fontFamily);
              
              // Skip if it's using Anton (might be inside a heading)
              if (fontFamily.includes('anton')) return;
              
              violations.push({
                element: `${tagName}${element.className ? '.' + element.className.split(' ')[0] : ''}`,
                font: fontFamily,
              });
            }
          });

          // Assert that all body text uses Inter font
          if (violations.length > 0) {
            const uniqueViolations = Array.from(
              new Set(violations.map((v) => `${v.element}: ${v.font}`))
            ).slice(0, 10);

            expect(
              violations.length,
              `Found ${violations.length} body text elements not using Inter font at viewport ${viewportWidth}px:\n${uniqueViolations.join('\n')}`
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

  it('should maintain typography consistency across all landing page sections', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'hero',
          'features',
          'how-it-works',
          'social-proof',
          'interactive-demo',
          'pricing',
          'final-cta'
        ),
        (sectionType) => {
          const { container } = render(
            <BrowserRouter>
              <LandingPreview />
            </BrowserRouter>
          );

          // Find all sections
          const sections = container.querySelectorAll('section, header');
          expect(sections.length).toBeGreaterThan(0);

          // Check typography in each section
          sections.forEach((section) => {
            // Check headings use Anton
            const headings = section.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headings.forEach((heading) => {
              const hasDisplayClass = hasDisplayFont(heading);
              const computedFont = verifyFontFamily(heading, FONTS.display);
              
              expect(
                hasDisplayClass || computedFont,
                `Heading in section should use Anton font: ${heading.tagName}`
              ).toBe(true);
            });

            // Check body text uses Inter
            const bodyElements = section.querySelectorAll('p');
            bodyElements.forEach((element) => {
              const hasText = element.textContent && element.textContent.trim().length > 0;
              if (!hasText) return;

              const hasBodyClass = hasBodyFont(element);
              const computedFont = verifyFontFamily(element, FONTS.body);
              
              expect(
                hasBodyClass || computedFont,
                `Body text in section should use Inter font: ${element.tagName}`
              ).toBe(true);
            });
          });

          cleanup();
        }
      ),
      {
        numRuns: 10,
      }
    );
  });

  it('should verify font-display class applies Anton font correctly', () => {
    const { container } = render(
      <BrowserRouter>
        <LandingPreview />
      </BrowserRouter>
    );

    // Find all elements with font-display class
    const displayElements = container.querySelectorAll('.font-display');
    
    expect(displayElements.length).toBeGreaterThan(0);

    displayElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const fontFamily = extractFontFamily(styles.fontFamily);
      
      expect(
        fontFamily.includes('anton'),
        `Element with font-display class should use Anton font, got: ${fontFamily}`
      ).toBe(true);
    });

    cleanup();
  });

  it('should verify font-body class applies Inter font correctly', () => {
    const { container } = render(
      <BrowserRouter>
        <LandingPreview />
      </BrowserRouter>
    );

    // Find all elements with font-body class
    const bodyElements = container.querySelectorAll('.font-body');
    
    expect(bodyElements.length).toBeGreaterThan(0);

    bodyElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const fontFamily = extractFontFamily(styles.fontFamily);
      
      expect(
        fontFamily.includes('inter'),
        `Element with font-body class should use Inter font, got: ${fontFamily}`
      ).toBe(true);
    });

    cleanup();
  });

  it('should ensure no mixing of display and body fonts within same element', () => {
    const { container } = render(
      <BrowserRouter>
        <LandingPreview />
      </BrowserRouter>
    );

    // Find all text elements
    const allTextElements = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a, button, label');
    
    allTextElements.forEach((element) => {
      const hasDisplayClass = hasDisplayFont(element);
      const hasBodyClass = hasBodyFont(element);
      
      // Element should not have both font classes
      expect(
        hasDisplayClass && hasBodyClass,
        `Element should not have both font-display and font-body classes: ${element.tagName}.${element.className}`
      ).toBe(false);
    });

    cleanup();
  });
});
