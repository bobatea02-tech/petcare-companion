import "@testing-library/jest-dom";
import "fake-indexeddb/auto";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock IntersectionObserver for Framer Motion viewport features
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver for Embla Carousel
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock getComputedStyle to return proper font families based on classes
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = function(element: Element, pseudoElt?: string | null): CSSStyleDeclaration {
  const styles = originalGetComputedStyle.call(this, element, pseudoElt);
  const classList = element.classList;
  
  // Create a proxy to intercept fontFamily access
  return new Proxy(styles, {
    get(target, prop) {
      if (prop === 'fontFamily') {
        // Check for font classes
        if (classList.contains('font-display')) {
          return 'Anton, sans-serif';
        }
        if (classList.contains('font-body')) {
          return 'Inter, sans-serif';
        }
        // Check for heading elements
        const tagName = element.tagName.toLowerCase();
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
          return 'Anton, sans-serif';
        }
        // Default to Inter for body text
        if (['p', 'span', 'div', 'a', 'li'].includes(tagName)) {
          return 'Inter, sans-serif';
        }
        return target.fontFamily || 'Inter, sans-serif';
      }
      return target[prop as keyof CSSStyleDeclaration];
    }
  }) as CSSStyleDeclaration;
};
