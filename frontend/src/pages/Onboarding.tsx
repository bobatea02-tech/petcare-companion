import { OnboardingFlow, OnboardingCompletionData } from '@/components/onboarding/OnboardingFlow';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '@/lib/analytics';

const Onboarding = () => {
  const navigate = useNavigate();

  const handleOnboardingComplete = (data: OnboardingCompletionData) => {
    // Track onboarding completion
    trackEvent('onboarding_complete', {
      userId: data.userId,
      petId: data.petId,
      startTour: data.startTour,
      totalDuration: data.totalDuration,
    });

    // Navigate to dashboard
    navigate('/dashboard');
  };

  return <OnboardingFlow onComplete={handleOnboardingComplete} />;
};

export default Onboarding;
