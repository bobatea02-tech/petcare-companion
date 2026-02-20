import { useEffect, lazy, Suspense } from 'react';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { useNavigate } from 'react-router-dom';
import { initializeAnalytics, trackEvent, trackPageLoadTime } from '@/lib/analytics';
import { LazyLoad } from '@/lib/lazyLoad';

// Lazy load below-fold sections for better performance
const HowItWorksSection = lazy(() => import('@/components/landing/HowItWorksSection').then(m => ({ default: m.HowItWorksSection })));
const SocialProofSection = lazy(() => import('@/components/landing/SocialProofSection').then(m => ({ default: m.SocialProofSection })));
const InteractiveDemoSection = lazy(() => import('@/components/landing/InteractiveDemoSection').then(m => ({ default: m.InteractiveDemoSection })));
const PricingSection = lazy(() => import('@/components/landing/PricingSection').then(m => ({ default: m.PricingSection })));
const FinalCTASection = lazy(() => import('@/components/landing/FinalCTASection').then(m => ({ default: m.FinalCTASection })));

const LandingPreview = () => {
  const navigate = useNavigate();

  // Initialize analytics and track page view
  useEffect(() => {
    initializeAnalytics();
    
    // Track page view
    trackEvent('page_view', {
      page: 'landing',
      url: window.location.pathname,
    });

    // Track page load time when page is fully loaded
    if (document.readyState === 'complete') {
      trackPageLoadTime();
    } else {
      window.addEventListener('load', trackPageLoadTime);
      return () => window.removeEventListener('load', trackPageLoadTime);
    }
  }, []);

  const handleCTAClick = () => {
    // Track CTA click
    trackEvent('cta_click', {
      location: 'landing_page',
      buttonText: 'Get Started Free',
    });
    
    console.log('CTA clicked - would navigate to onboarding');
    // navigate('/onboarding');
  };

  // Loading fallback for lazy-loaded sections
  const SectionFallback = () => (
    <div className="py-20 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-sage border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-cream focus:text-forest focus:rounded-card focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2"
      >
        Skip to main content
      </a>
      
      {/* Above-the-fold: Load immediately */}
      <HeroSection onCTAClick={handleCTAClick} />
      <main id="main-content">
        <FeaturesSection />
      
      {/* Below-the-fold: Lazy load with intersection observer */}
      <LazyLoad fallback={<SectionFallback />}>
        <Suspense fallback={<SectionFallback />}>
          <HowItWorksSection />
        </Suspense>
      </LazyLoad>
      
      <LazyLoad fallback={<SectionFallback />}>
        <Suspense fallback={<SectionFallback />}>
          <SocialProofSection />
        </Suspense>
      </LazyLoad>
      
      <LazyLoad fallback={<SectionFallback />}>
        <Suspense fallback={<SectionFallback />}>
          <InteractiveDemoSection />
        </Suspense>
      </LazyLoad>
      
      <LazyLoad fallback={<SectionFallback />}>
        <Suspense fallback={<SectionFallback />}>
          <PricingSection />
        </Suspense>
      </LazyLoad>
      
      <LazyLoad fallback={<SectionFallback />}>
        <Suspense fallback={<SectionFallback />}>
          <FinalCTASection onCTAClick={handleCTAClick} />
        </Suspense>
      </LazyLoad>
      </main>
    </div>
  );
};

export default LandingPreview;
