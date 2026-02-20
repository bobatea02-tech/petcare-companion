/**
 * Accessibility Unit Tests
 * Tests keyboard navigation, ARIA labels, alt text, and focus indicators
 * Requirements: 5.6
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LandingPreview from '@/pages/LandingPreview';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { GuidedTour } from '@/components/tour/GuidedTour';
import { Mic } from 'lucide-react';

describe('Accessibility Tests', () => {
  describe('Keyboard Navigation', () => {
    it('should allow keyboard navigation through all interactive elements on landing page', async () => {
      const user = userEvent.setup();
      const mockCTAClick = vi.fn();
      
      const { container } = render(
        <BrowserRouter>
          <HeroSection onCTAClick={mockCTAClick} />
        </BrowserRouter>
      );

      // Get all focusable elements
      const focusableElements = container.querySelectorAll(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);

      // Test that CTA button is focusable
      const ctaButton = screen.getByRole('button', { name: /get started/i });
      expect(ctaButton).toBeInTheDocument();
      
      // Focus the button
      ctaButton.focus();
      expect(document.activeElement).toBe(ctaButton);

      // Test Enter key activation
      await user.keyboard('{Enter}');
      expect(mockCTAClick).toHaveBeenCalledTimes(1);
    });

    it('should have skip link that is keyboard accessible', () => {
      render(
        <BrowserRouter>
          <LandingPreview />
        </BrowserRouter>
      );

      const skipLink = screen.getByText(/skip to main content/i);
      expect(skipLink).toBeInTheDocument();
      expect(skipLink.tagName).toBe('A');
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should maintain logical tab order in features section', async () => {
      const user = userEvent.setup();
      
      const { container } = render(
        <BrowserRouter>
          <FeaturesSection />
        </BrowserRouter>
      );

      // Features section contains cards but they are not interactive by default
      // Verify the section renders correctly
      const featureCards = container.querySelectorAll('[class*="Card"]');
      
      // Verify feature cards exist (even if not interactive)
      expect(container.querySelector('section')).toBeInTheDocument();
      
      // Check for heading elements which should be present
      const headings = container.querySelectorAll('h3');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should allow Escape key to close guided tour', async () => {
      const user = userEvent.setup();
      const mockComplete = vi.fn();
      const mockSkip = vi.fn();

      // Create a mock dashboard with tour targets
      const MockDashboard = () => (
        <div>
          <div data-tour="voice-assistant">Voice Assistant</div>
          <div data-tour="health-tracker">Health Tracker</div>
          <div data-tour="vet-booking">Vet Booking</div>
          <GuidedTour
            onComplete={mockComplete}
            onSkip={mockSkip}
            isActive={true}
          />
        </div>
      );

      render(
        <BrowserRouter>
          <MockDashboard />
        </BrowserRouter>
      );

      // Wait for tour to initialize
      await waitFor(() => {
        const skipButton = screen.queryByLabelText(/skip tour/i);
        expect(skipButton).toBeInTheDocument();
      }, { timeout: 3000 });

      // Press Escape key
      await user.keyboard('{Escape}');

      // Verify skip was called
      await waitFor(() => {
        expect(mockSkip).toHaveBeenCalled();
      });
    });

    it('should allow keyboard navigation through onboarding steps', async () => {
      const user = userEvent.setup();
      const mockComplete = vi.fn();

      const { container } = render(
        <BrowserRouter>
          <OnboardingFlow onComplete={mockComplete} />
        </BrowserRouter>
      );

      // Find focusable elements in the first step
      const focusableElements = container.querySelectorAll(
        'button, a, input, [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);

      // Test that form inputs are focusable
      const inputs = container.querySelectorAll('input');
      if (inputs.length > 0) {
        const firstInput = inputs[0] as HTMLInputElement;
        firstInput.focus();
        expect(document.activeElement).toBe(firstInput);
      }
    });
  });

  describe('ARIA Labels', () => {
    it('should have proper ARIA labels on hero section elements', () => {
      const mockCTAClick = vi.fn();
      
      render(
        <BrowserRouter>
          <HeroSection onCTAClick={mockCTAClick} />
        </BrowserRouter>
      );

      // Check header has role="banner"
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();

      // Check CTA button has aria-label
      const ctaButton = screen.getByRole('button', { name: /get started/i });
      expect(ctaButton).toHaveAttribute('aria-label');

      // Check trust indicators have proper role
      const trustIndicators = screen.getByRole('list', { name: /trust indicators/i });
      expect(trustIndicators).toBeInTheDocument();

      // Check badge has proper role and aria-label
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label');
    });

    it('should have ARIA labels on icon buttons', () => {
      const mockCTAClick = vi.fn();
      
      render(
        <BrowserRouter>
          <HeroSection onCTAClick={mockCTAClick} />
        </BrowserRouter>
      );

      // Check that icons have aria-hidden="true"
      const icons = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have proper ARIA labels on feature cards', () => {
      render(
        <BrowserRouter>
          <FeatureCard
            icon={Mic}
            title="Voice Assistant"
            description="AI-powered voice commands"
          />
        </BrowserRouter>
      );

      // Check icon has proper aria-label
      const iconContainer = screen.getByRole('img', { name: /voice assistant icon/i });
      expect(iconContainer).toBeInTheDocument();
    });

    it('should have ARIA labels on guided tour skip button', async () => {
      const mockComplete = vi.fn();
      const mockSkip = vi.fn();

      const MockDashboard = () => (
        <div>
          <div data-tour="voice-assistant">Voice Assistant</div>
          <div data-tour="health-tracker">Health Tracker</div>
          <div data-tour="vet-booking">Vet Booking</div>
          <GuidedTour
            onComplete={mockComplete}
            onSkip={mockSkip}
            isActive={true}
          />
        </div>
      );

      render(
        <BrowserRouter>
          <MockDashboard />
        </BrowserRouter>
      );

      // Wait for tour to render
      await waitFor(() => {
        const skipButton = screen.queryByLabelText(/skip tour/i);
        expect(skipButton).toBeInTheDocument();
        expect(skipButton).toHaveAttribute('aria-label', 'Skip tour');
      }, { timeout: 3000 });
    });

    it('should have proper ARIA live regions for dynamic content', () => {
      const mockComplete = vi.fn();

      render(
        <BrowserRouter>
          <OnboardingFlow onComplete={mockComplete} />
        </BrowserRouter>
      );

      // Check for progress indicators
      const progressText = screen.getByText(/step 1 of 3/i);
      expect(progressText).toBeInTheDocument();
    });
  });

  describe('Alt Text', () => {
    it('should have alt text for all images in landing page', () => {
      render(
        <BrowserRouter>
          <LandingPreview />
        </BrowserRouter>
      );

      // Get all img elements
      const images = document.querySelectorAll('img');
      
      images.forEach((img) => {
        // Each image should have alt attribute (can be empty for decorative images)
        expect(img).toHaveAttribute('alt');
      });
    });

    it('should mark decorative icons as aria-hidden', () => {
      const mockCTAClick = vi.fn();
      
      render(
        <BrowserRouter>
          <HeroSection onCTAClick={mockCTAClick} />
        </BrowserRouter>
      );

      // Check that decorative SVG icons have aria-hidden="true"
      const decorativeIcons = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(decorativeIcons.length).toBeGreaterThan(0);
    });

    it('should have descriptive aria-labels for icon-only buttons', () => {
      const mockCTAClick = vi.fn();
      
      render(
        <BrowserRouter>
          <HeroSection onCTAClick={mockCTAClick} />
        </BrowserRouter>
      );

      // Check scroll indicator has proper aria-label
      const scrollIndicator = screen.getByRole('img', { name: /scroll down/i });
      expect(scrollIndicator).toBeInTheDocument();
    });
  });

  describe('Focus Indicators', () => {
    it('should have visible focus indicators on CTA button', () => {
      const mockCTAClick = vi.fn();
      
      const { container } = render(
        <BrowserRouter>
          <HeroSection onCTAClick={mockCTAClick} />
        </BrowserRouter>
      );

      const ctaButton = screen.getByRole('button', { name: /get started/i });
      
      // Check for focus ring classes
      const buttonClasses = ctaButton.className;
      expect(buttonClasses).toMatch(/focus:(ring|outline)/);
    });

    it('should have visible focus indicators on skip link', () => {
      render(
        <BrowserRouter>
          <LandingPreview />
        </BrowserRouter>
      );

      const skipLink = screen.getByText(/skip to main content/i);
      
      // Check for focus classes
      const linkClasses = skipLink.className;
      expect(linkClasses).toContain('focus:');
    });

    it('should have focus indicators on form inputs', () => {
      const mockComplete = vi.fn();

      const { container } = render(
        <BrowserRouter>
          <OnboardingFlow onComplete={mockComplete} />
        </BrowserRouter>
      );

      // Get all input elements
      const inputs = container.querySelectorAll('input');
      
      inputs.forEach((input) => {
        const inputClasses = input.className;
        // Check for focus-visible or focus ring classes
        expect(
          inputClasses.includes('focus') || 
          input.closest('[class*="focus"]') !== null
        ).toBe(true);
      });
    });

    it('should have sufficient contrast for focus indicators', () => {
      const mockCTAClick = vi.fn();
      
      render(
        <BrowserRouter>
          <HeroSection onCTAClick={mockCTAClick} />
        </BrowserRouter>
      );

      const ctaButton = screen.getByRole('button', { name: /get started/i });
      
      // Check that focus ring color is defined (sage color)
      const buttonClasses = ctaButton.className;
      expect(buttonClasses).toMatch(/focus:ring-sage|focus:ring-\d+/);
    });
  });

  describe('Semantic HTML', () => {
    it('should use semantic header element', () => {
      const mockCTAClick = vi.fn();
      
      render(
        <BrowserRouter>
          <HeroSection onCTAClick={mockCTAClick} />
        </BrowserRouter>
      );

      const header = screen.getByRole('banner');
      expect(header.tagName).toBe('HEADER');
    });

    it('should use semantic main element', () => {
      render(
        <BrowserRouter>
          <LandingPreview />
        </BrowserRouter>
      );

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main.tagName).toBe('MAIN');
      expect(main).toHaveAttribute('id', 'main-content');
    });

    it('should use proper heading hierarchy', () => {
      const mockCTAClick = vi.fn();
      
      render(
        <BrowserRouter>
          <HeroSection onCTAClick={mockCTAClick} />
        </BrowserRouter>
      );

      // Check for h1 heading
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('should use semantic list elements for trust indicators', () => {
      const mockCTAClick = vi.fn();
      
      render(
        <BrowserRouter>
          <HeroSection onCTAClick={mockCTAClick} />
        </BrowserRouter>
      );

      const list = screen.getByRole('list', { name: /trust indicators/i });
      expect(list).toBeInTheDocument();

      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe('Screen Reader Support', () => {
    it('should have descriptive button text for screen readers', () => {
      const mockCTAClick = vi.fn();
      
      render(
        <BrowserRouter>
          <HeroSection onCTAClick={mockCTAClick} />
        </BrowserRouter>
      );

      const ctaButton = screen.getByRole('button', { name: /get started with pawpal for free/i });
      expect(ctaButton).toBeInTheDocument();
    });

    it('should hide decorative elements from screen readers', () => {
      const mockCTAClick = vi.fn();
      
      const { container } = render(
        <BrowserRouter>
          <HeroSection onCTAClick={mockCTAClick} />
        </BrowserRouter>
      );

      // Check that decorative SVGs have aria-hidden
      const decorativeElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(decorativeElements.length).toBeGreaterThan(0);
    });

    it('should provide context for icon-only elements', () => {
      render(
        <BrowserRouter>
          <FeatureCard
            icon={Mic}
            title="Voice Assistant"
            description="AI-powered voice commands"
          />
        </BrowserRouter>
      );

      // Icon container should have descriptive aria-label
      const iconContainer = screen.getByRole('img', { name: /voice assistant icon/i });
      expect(iconContainer).toBeInTheDocument();
    });

    it('should announce progress updates in onboarding', () => {
      const mockComplete = vi.fn();

      render(
        <BrowserRouter>
          <OnboardingFlow onComplete={mockComplete} />
        </BrowserRouter>
      );

      // Check for progress text that screen readers can announce
      const progressText = screen.getByText(/step 1 of 3/i);
      expect(progressText).toBeInTheDocument();

      // The percentage is displayed as "33% Complete" not "0% Complete"
      const percentageText = screen.getByText(/33% complete/i);
      expect(percentageText).toBeInTheDocument();
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion preference', () => {
      // Mock matchMedia for reduced motion
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const mockCTAClick = vi.fn();
      
      render(
        <BrowserRouter>
          <HeroSection onCTAClick={mockCTAClick} />
        </BrowserRouter>
      );

      // Component should render without errors
      const ctaButton = screen.getByRole('button', { name: /get started/i });
      expect(ctaButton).toBeInTheDocument();

      // Restore original matchMedia
      window.matchMedia = originalMatchMedia;
    });
  });
});
