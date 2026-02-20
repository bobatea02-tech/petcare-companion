/**
 * GuidedTour Component
 * Main guided tour component that manages tour steps and displays tooltips
 * Highlights Voice Assistant, Health Tracker, and Vet Booking features
 */

import { useState, useEffect } from "react";
import { TooltipOverlay } from "./TooltipOverlay";
import { TOUR_STEPS } from "@/lib/design-system";
import { storeSampleDataForTour, clearSampleDataForTour } from "@/lib/sampleData";
import { trackEvent } from "@/lib/analytics";

export interface GuidedTourProps {
  /** Callback when tour is completed */
  onComplete: () => void;
  /** Callback when tour is skipped */
  onSkip: () => void;
  /** Whether the tour should be active */
  isActive: boolean;
}

interface TourStep {
  id: number;
  targetSelector: string;
  title: string;
  description: string;
}

const tourSteps: TourStep[] = [
  {
    id: TOUR_STEPS.VOICE_ASSISTANT,
    targetSelector: '[data-tour="voice-assistant"]',
    title: "Meet JoJo, Your Voice Assistant",
    description: 'Try saying: "Show me Buddy\'s health records" or ask any pet care question. JoJo is here to help you 24/7!',
  },
  {
    id: TOUR_STEPS.HEALTH_TRACKER,
    targetSelector: '[data-tour="health-tracker"]',
    title: "Track Your Pet's Health",
    description: "Keep all health records, vaccinations, and medications in one place. Never miss an important vet appointment or medication dose.",
  },
  {
    id: TOUR_STEPS.VET_BOOKING,
    targetSelector: '[data-tour="vet-booking"]',
    title: "Book Vet Appointments",
    description: "Find nearby veterinarians and book appointments directly through the app. Get reminders before each visit.",
  },
];

export const GuidedTour = ({ onComplete, onSkip, isActive }: GuidedTourProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tourStartTime, setTourStartTime] = useState<number | null>(null);
  const [sampleDataFailed, setSampleDataFailed] = useState(false);
  const [skippedSteps, setSkippedSteps] = useState<Set<number>>(new Set());

  // Initialize tour
  useEffect(() => {
    if (isActive) {
      // Try to store sample data for the tour
      try {
        storeSampleDataForTour();
      } catch (error) {
        console.error('[GuidedTour] Failed to generate sample data:', error);
        setSampleDataFailed(true);
        
        // Skip tour if sample data generation fails
        trackEvent('tour_skipped', {
          reason: 'sample_data_generation_failed',
          userId: localStorage.getItem("user_id"),
        });
        
        // Notify parent to skip tour
        setTimeout(() => {
          onSkip();
        }, 100);
        return;
      }
      
      // Track tour start time
      setTourStartTime(Date.now());
      
      // Track tour started event
      trackEvent('tour_started', {
        userId: localStorage.getItem("user_id"),
      });
    }

    return () => {
      // Cleanup when tour ends
      if (!isActive) {
        try {
          clearSampleDataForTour();
        } catch (error) {
          console.error('[GuidedTour] Failed to clear sample data:', error);
        }
      }
    };
  }, [isActive, onSkip]);

  // Check if target element exists for current step
  useEffect(() => {
    if (!isActive) return;

    // Handle Escape key to close tour
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleSkip();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    const currentStep = tourSteps[currentStepIndex];
    const checkInterval = setInterval(() => {
      const targetElement = document.querySelector(currentStep.targetSelector);
      
      if (!targetElement && !skippedSteps.has(currentStepIndex)) {
        console.warn(`[GuidedTour] Target element not found: ${currentStep.targetSelector}`);
        
        // Skip this step if target not found after 2 seconds
        setTimeout(() => {
          const element = document.querySelector(currentStep.targetSelector);
          if (!element) {
            console.warn(`[GuidedTour] Skipping step ${currentStepIndex + 1} - target not found`);
            setSkippedSteps(prev => new Set(prev).add(currentStepIndex));
            
            // Move to next step
            if (currentStepIndex < tourSteps.length - 1) {
              setCurrentStepIndex(currentStepIndex + 1);
            } else {
              handleComplete();
            }
          }
        }, 2000);
      }
    }, 500);

    return () => {
      clearInterval(checkInterval);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive, currentStepIndex, skippedSteps]);

  // Handle next step
  const handleNext = () => {
    if (currentStepIndex < tourSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      trackEvent('tour_step_completed', {
        step: currentStepIndex + 1,
        stepName: tourSteps[currentStepIndex].title,
        userId: localStorage.getItem("user_id"),
      });
    } else {
      handleComplete();
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  // Handle tour completion
  const handleComplete = () => {
    const duration = tourStartTime ? Date.now() - tourStartTime : 0;
    
    trackEvent('tour_completed', {
      duration,
      totalSteps: tourSteps.length,
      skippedSteps: Array.from(skippedSteps),
      userId: localStorage.getItem("user_id"),
    });
    
    try {
      clearSampleDataForTour();
    } catch (error) {
      console.error('[GuidedTour] Failed to clear sample data:', error);
    }
    
    onComplete();
  };

  // Handle tour skip
  const handleSkip = () => {
    const duration = tourStartTime ? Date.now() - tourStartTime : 0;
    
    trackEvent('tour_skipped', {
      duration,
      currentStep: currentStepIndex + 1,
      totalSteps: tourSteps.length,
      userId: localStorage.getItem("user_id"),
    });
    
    try {
      clearSampleDataForTour();
    } catch (error) {
      console.error('[GuidedTour] Failed to clear sample data:', error);
    }
    
    onSkip();
  };

  if (!isActive || sampleDataFailed) return null;

  const currentStep = tourSteps[currentStepIndex];

  return (
    <TooltipOverlay
      targetSelector={currentStep.targetSelector}
      title={currentStep.title}
      description={currentStep.description}
      currentStep={currentStepIndex + 1}
      totalSteps={tourSteps.length}
      onNext={currentStepIndex < tourSteps.length - 1 ? handleNext : undefined}
      onPrevious={currentStepIndex > 0 ? handlePrevious : undefined}
      onSkip={handleSkip}
      isVisible={isActive}
    />
  );
};
