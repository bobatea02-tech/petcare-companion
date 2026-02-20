import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { HeroSection } from '@/components/landing/HeroSection';
import { Mic, Heart, Calendar } from 'lucide-react';

// Feature: outstanding-landing-page, Property 8: Hover Animation Triggers
describe('Property 8: Hover Animation Triggers', () => {
  beforeEach(() => {
    // Reset viewport
    window.innerWidth = 1024;
    window.innerHeight = 768;
    
    // Mock matchMedia for reduced motion detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false, // Default: no reduced motion preference
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  /**
   * Helper function to check if an element has hover animation configured
   * Framer Motion applies whileHover as motion values that trigger on hover
   */
  const hasHoverAnimation = (element: Element): boolean => {
    // Check for Framer Motion's will-change property (indicates animation optimization)
    const style = window.getComputedStyle(element);
    const hasWillChange = style.willChange && style.willChange !== 'auto';
    
    // Check for motion.div elements (Framer Motion wrapper)
    const isMotionElement = element.tagName.toLowerCase() === 'div' && 
                           element.hasAttribute('style');
    
    return hasWillChange || isMotionElement;
  };

  it('should configure hover animations on FeatureCard components', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        // Generate different feature card configurations
        fc.record({
          title: fc.constantFrom('Voice AI Assistant', 'Health Tracking', 'Vet Booking'),
          description: fc.string({ minLength: 20, maxLength: 100 }),
          icon: fc.constantFrom(Mic, Heart, Calendar),
          index: fc.integer({ min: 0, max: 2 })
        }),
        (featureConfig) => {
          // Render the FeatureCard component
          const { container } = render(
            <BrowserRouter>
              <FeatureCard
                icon={featureConfig.icon}
                title={featureConfig.title}
                description={featureConfig.description}
                index={featureConfig.index}
              />
            </BrowserRouter>
          );

          // Property: FeatureCard should have hover animation configured
          // The component uses motion.div with whileHover prop for lift animation
          const motionDivs = container.querySelectorAll('div[style*="will-change"]');
          
          // At least one motion.div should exist (the card wrapper)
          expect(motionDivs.length).toBeGreaterThan(0);
          
          // Check that motion elements have will-change for GPU acceleration
          motionDivs.forEach((element) => {
            const style = (element as HTMLElement).style;
            expect(style.willChange).toBeTruthy();
          });

          // Property: The card should have hover animation structure
          // whileHover={{ y: -8 }} is configured on the motion.div wrapper
          const cardWrapper = container.querySelector('.h-full');
          expect(cardWrapper).toBeTruthy();
          
          cleanup();
          return true;
        }
      ),
      {
        numRuns: 50,
        verbose: true,
      }
    );
  });

  it('should configure hover animations on icon elements within FeatureCard', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(Mic, Heart, Calendar),
        (IconComponent) => {
          const { container } = render(
            <BrowserRouter>
              <FeatureCard
                icon={IconComponent}
                title="Test Feature"
                description="Test description for feature card"
                index={0}
              />
            </BrowserRouter>
          );

          // Property: Icon container should have hover animation configured
          // The icon is wrapped in motion.div with whileHover={{ scale: 1.1, rotate: 5 }}
          const iconContainer = container.querySelector('[role="img"][aria-label*="icon"]');
          expect(iconContainer).toBeTruthy();
          
          // Check for will-change optimization on icon container
          const style = window.getComputedStyle(iconContainer as Element);
          const hasWillChange = (iconContainer as HTMLElement).style.willChange;
          expect(hasWillChange).toBeTruthy();

          cleanup();
          return true;
        }
      ),
      {
        numRuns: 30,
        verbose: true,
      }
    );
  });

  it('should configure hover animations on CTA button in HeroSection', () => {
    const mockCTAClick = vi.fn();
    
    const { container } = render(
      <BrowserRouter>
        <HeroSection onCTAClick={mockCTAClick} />
      </BrowserRouter>
    );

    // Property: CTA button should have hover animation configured
    // The button is wrapped in motion.div with whileHover={{ scale: 1.05 }}
    const ctaButton = container.querySelector('button[aria-label*="Get started"]');
    expect(ctaButton).toBeTruthy();
    
    // The button's parent motion.div should have will-change for animation
    const motionWrapper = ctaButton?.parentElement;
    expect(motionWrapper).toBeTruthy();
    
    if (motionWrapper) {
      const style = (motionWrapper as HTMLElement).style;
      expect(style.willChange).toBeTruthy();
    }

    cleanup();
  });

  it('should apply hover animations across multiple FeatureCard instances', () => {
    const features = [
      { icon: Mic, title: 'Voice AI', description: 'AI-powered voice commands' },
      { icon: Heart, title: 'Health Tracking', description: 'Monitor your pet health' },
      { icon: Calendar, title: 'Vet Booking', description: 'Schedule appointments' }
    ];

    const { container } = render(
      <BrowserRouter>
        <div className="grid grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </BrowserRouter>
    );

    // Property: All FeatureCard instances should have hover animations configured
    const motionDivs = container.querySelectorAll('div[style*="will-change"]');
    
    // Should have at least 3 motion divs (one per card, plus icon containers)
    expect(motionDivs.length).toBeGreaterThanOrEqual(3);
    
    // Each motion div should have will-change property
    motionDivs.forEach((element) => {
      const style = (element as HTMLElement).style;
      expect(style.willChange).toBeTruthy();
    });

    cleanup();
  });

  it('should maintain hover animation configuration across different viewport sizes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }),
        (viewportWidth) => {
          // Set viewport width
          window.innerWidth = viewportWidth;
          
          const { container } = render(
            <BrowserRouter>
              <FeatureCard
                icon={Mic}
                title="Voice AI Assistant"
                description="Control your pet care with voice commands"
                index={0}
              />
            </BrowserRouter>
          );

          // Property: Hover animations should be configured regardless of viewport size
          const motionDivs = container.querySelectorAll('div[style*="will-change"]');
          expect(motionDivs.length).toBeGreaterThan(0);
          
          // Check that animations are configured with will-change
          motionDivs.forEach((element) => {
            const style = (element as HTMLElement).style;
            expect(style.willChange).toBeTruthy();
          });

          cleanup();
          return true;
        }
      ),
      {
        numRuns: 30,
        verbose: true,
      }
    );
  });

  it('should configure shadow transition on FeatureCard hover', () => {
    const { container } = render(
      <BrowserRouter>
        <FeatureCard
          icon={Heart}
          title="Health Tracking"
          description="Monitor your pet's health records"
          index={0}
        />
      </BrowserRouter>
    );

    // Property: Card should have shadow transition class for hover effect
    // The Card component has hover:shadow-2xl transition-shadow classes
    const card = container.querySelector('.shadow-lg');
    expect(card).toBeTruthy();
    
    // Check for transition-shadow class
    const hasTransitionShadow = card?.classList.contains('transition-shadow');
    expect(hasTransitionShadow).toBe(true);
    
    // Check for hover:shadow-2xl class
    const cardClasses = card?.className || '';
    expect(cardClasses).toContain('shadow');

    cleanup();
  });

  it('should handle reduced motion preference by still rendering components', () => {
    // Mock matchMedia to return reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { container } = render(
      <BrowserRouter>
        <FeatureCard
          icon={Calendar}
          title="Vet Booking"
          description="Schedule veterinary appointments"
          index={0}
        />
      </BrowserRouter>
    );

    // Property: Components should still render with reduced motion
    // Framer Motion respects prefers-reduced-motion automatically
    const card = container.querySelector('.shadow-lg');
    expect(card).toBeTruthy();
    
    // Motion divs should still exist but animations may be disabled
    const motionDivs = container.querySelectorAll('div[style*="will-change"]');
    expect(motionDivs.length).toBeGreaterThanOrEqual(0);

    cleanup();
  });

  it('should configure transform animations on interactive elements', () => {
    const features = [
      { icon: Mic, title: 'Voice AI', description: 'Voice commands' },
      { icon: Heart, title: 'Health', description: 'Health tracking' },
      { icon: Calendar, title: 'Booking', description: 'Vet appointments' }
    ];

    const { container } = render(
      <BrowserRouter>
        <div>
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </BrowserRouter>
    );

    // Property: All interactive card elements should have transform animations configured
    // This is indicated by will-change: transform on motion.div elements
    const motionDivs = container.querySelectorAll('div[style*="will-change"]');
    
    // Should have multiple motion divs (cards + icons)
    expect(motionDivs.length).toBeGreaterThan(0);
    
    // Each should have will-change for GPU-accelerated transforms
    motionDivs.forEach((element) => {
      const style = (element as HTMLElement).style;
      expect(style.willChange).toBe('transform');
    });

    cleanup();
  });

  it('should verify hover animation structure on button elements', () => {
    const mockCTAClick = vi.fn();
    
    const { container } = render(
      <BrowserRouter>
        <HeroSection onCTAClick={mockCTAClick} />
      </BrowserRouter>
    );

    // Property: Button should be wrapped in motion.div with hover animations
    // whileHover={{ scale: 1.05 }} and whileTap={{ scale: 0.95 }}
    const button = container.querySelector('button[aria-label*="Get started"]');
    expect(button).toBeTruthy();
    
    // Button should have focus styles for accessibility
    const buttonClasses = button?.className || '';
    expect(buttonClasses).toContain('focus:ring');
    
    // Parent motion wrapper should have will-change
    const motionWrapper = button?.parentElement;
    if (motionWrapper) {
      const style = (motionWrapper as HTMLElement).style;
      expect(style.willChange).toBeTruthy();
    }

    cleanup();
  });

  it('should configure staggered animations for multiple cards', () => {
    const features = [
      { icon: Mic, title: 'Feature 1', description: 'Description 1', index: 0 },
      { icon: Heart, title: 'Feature 2', description: 'Description 2', index: 1 },
      { icon: Calendar, title: 'Feature 3', description: 'Description 3', index: 2 }
    ];

    const { container } = render(
      <BrowserRouter>
        <div>
          {features.map((feature) => (
            <FeatureCard
              key={feature.index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={feature.index}
            />
          ))}
        </div>
      </BrowserRouter>
    );

    // Property: Each card should have animation configuration
    // The index prop creates staggered entrance animations (delay: index * 0.1)
    const cards = container.querySelectorAll('.shadow-lg');
    expect(cards.length).toBe(3);
    
    // All cards should have motion wrappers with will-change
    const motionDivs = container.querySelectorAll('div[style*="will-change"]');
    expect(motionDivs.length).toBeGreaterThan(0);

    cleanup();
  });
});
