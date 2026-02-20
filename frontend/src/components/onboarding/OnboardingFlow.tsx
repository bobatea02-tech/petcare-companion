import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { SignUpStep } from "./SignUpStep";
import { AddPetStep } from "./AddPetStep";
import { TourIntroStep } from "./TourIntroStep";
import { ONBOARDING_STEPS } from "@/lib/design-system";

interface OnboardingFlowProps {
  onComplete: (data: OnboardingCompletionData) => void;
}

export interface OnboardingCompletionData {
  userId: string;
  email: string;
  petId: string;
  startTour: boolean;
  totalDuration: number;
}

interface OnboardingState {
  currentStep: 1 | 2 | 3;
  userId: string | null;
  email: string | null;
  petId: string | null;
  startTime: number;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [state, setState] = useState<OnboardingState>({
    currentStep: ONBOARDING_STEPS.SIGN_UP,
    userId: null,
    email: null,
    petId: null,
    startTime: Date.now(),
  });

  // Calculate progress percentage
  const progressPercentage = (state.currentStep / 3) * 100;

  // Handle sign-up completion
  const handleSignUpComplete = (userId: string, email: string) => {
    setState((prev) => ({
      ...prev,
      currentStep: ONBOARDING_STEPS.ADD_PET,
      userId,
      email,
    }));
  };

  // Handle add pet completion
  const handleAddPetComplete = (petId: string) => {
    setState((prev) => ({
      ...prev,
      currentStep: ONBOARDING_STEPS.TOUR_INTRO,
      petId,
    }));
  };

  // Handle tour start
  const handleStartTour = () => {
    const totalDuration = Date.now() - state.startTime;
    
    if (state.userId && state.email && state.petId) {
      // Set flag for dashboard to start tour
      localStorage.setItem("start_tour", "true");
      
      onComplete({
        userId: state.userId,
        email: state.email,
        petId: state.petId,
        startTour: true,
        totalDuration,
      });
    }
  };

  // Handle tour skip
  const handleSkipTour = () => {
    const totalDuration = Date.now() - state.startTime;
    
    if (state.userId && state.email && state.petId) {
      onComplete({
        userId: state.userId,
        email: state.email,
        petId: state.petId,
        startTour: false,
        totalDuration,
      });
    }
  };

  // Track onboarding duration for analytics
  useEffect(() => {
    // Store start time in localStorage for persistence
    localStorage.setItem("onboarding_start_time", state.startTime.toString());

    return () => {
      // Cleanup
      localStorage.removeItem("onboarding_start_time");
    };
  }, [state.startTime]);

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 rounded-full bg-sage/20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-moss/20"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mb-8 relative z-10"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-body text-sm text-muted-foreground">
            Step {state.currentStep} of 3
          </span>
          <span className="font-body text-sm text-muted-foreground">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
        <Progress
          value={progressPercentage}
          className="h-2 bg-olive"
          style={{
            // Override default styles to use Sage color
            // @ts-ignore
            "--progress-background": "hsl(80 30% 80%)",
          }}
        />
      </motion.div>

      {/* Step Content */}
      <div className="w-full max-w-2xl relative z-10">
        <AnimatePresence mode="wait">
          {state.currentStep === ONBOARDING_STEPS.SIGN_UP && (
            <SignUpStep
              key="signup"
              onComplete={handleSignUpComplete}
            />
          )}

          {state.currentStep === ONBOARDING_STEPS.ADD_PET && (
            <AddPetStep
              key="addpet"
              onComplete={handleAddPetComplete}
            />
          )}

          {state.currentStep === ONBOARDING_STEPS.TOUR_INTRO && (
            <TourIntroStep
              key="tourintro"
              onStartTour={handleStartTour}
              onSkipTour={handleSkipTour}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Step Indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex gap-2 mt-8 relative z-10"
      >
        {[1, 2, 3].map((step) => (
          <motion.div
            key={step}
            className={`w-3 h-3 rounded-full transition-colors ${
              step === state.currentStep
                ? "bg-primary"
                : step < state.currentStep
                ? "bg-sage"
                : "bg-olive"
            }`}
            animate={{
              scale: step === state.currentStep ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 1,
              repeat: step === state.currentStep ? Infinity : 0,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};
