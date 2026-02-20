/**
 * VoiceCommandExamples Component
 * 
 * Displays context-aware voice command examples with an interactive tutorial for first-time users.
 * Shows common examples on first activation and context-specific examples based on dashboard section.
 * 
 * Requirements: 14.1, 14.2
 * Feature: jojo-voice-assistant-enhanced
 * Task: 35.1
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, ChevronRight, Sparkles, BookOpen, Play } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface VoiceCommandExamplesProps {
  /** Whether to show the examples panel */
  isVisible?: boolean;
  /** Custom class name */
  className?: string;
  /** Callback when an example is clicked to try */
  onExampleClick?: (command: string) => void;
  /** Force show tutorial even if user has seen it */
  forceShowTutorial?: boolean;
}

interface CommandExample {
  command: string;
  description: string;
  category: string;
  example?: string;
}

const TUTORIAL_STORAGE_KEY = 'jojo_tutorial_completed';

/**
 * Get common voice command examples for first-time users
 */
const getCommonExamples = (): CommandExample[] => {
  return [
    {
      command: 'Show me my pets',
      description: 'View all your registered pets',
      category: 'Navigation',
      example: 'Try: "Show me my pets"'
    },
    {
      command: 'Go to appointments',
      description: 'Navigate to appointments page',
      category: 'Navigation',
      example: 'Try: "Go to appointments"'
    },
    {
      command: 'Schedule appointment for [pet name]',
      description: 'Book a vet appointment',
      category: 'Scheduling',
      example: 'Try: "Schedule appointment for Buddy"'
    },
    {
      command: 'Log feeding for [pet name]',
      description: 'Record a feeding activity',
      category: 'Data Entry',
      example: 'Try: "Log feeding for Max"'
    },
    {
      command: 'What\'s [pet name]\'s health score?',
      description: 'Check your pet\'s health status',
      category: 'Query',
      example: 'Try: "What\'s Bella\'s health score?"'
    },
    {
      command: 'Add medication for [pet name]',
      description: 'Create a medication reminder',
      category: 'Data Entry',
      example: 'Try: "Add medication for Charlie"'
    },
    {
      command: 'What can you do?',
      description: 'Get help with available commands',
      category: 'Help',
      example: 'Try: "What can you do?"'
    },
    {
      command: 'Go back',
      description: 'Navigate to previous page',
      category: 'Navigation',
      example: 'Try: "Go back"'
    }
  ];
};

/**
 * Get context-specific examples based on current page
 */
const getContextExamples = (pathname: string): CommandExample[] => {
  // Dashboard section
  if (pathname === '/dashboard' || pathname === '/index') {
    return [
      {
        command: 'Show health score for [pet name]',
        description: 'View detailed health metrics',
        category: 'Query',
        example: 'Try: "Show health score for Buddy"'
      },
      {
        command: 'Show milestones for [pet name]',
        description: 'View pet achievements and growth',
        category: 'Query',
        example: 'Try: "Show milestones for Max"'
      },
      {
        command: 'Add expense for [pet name]',
        description: 'Log a pet-related expense',
        category: 'Data Entry',
        example: 'Try: "Add expense for Bella"'
      },
      {
        command: 'Emergency',
        description: 'Activate emergency SOS mode',
        category: 'Emergency',
        example: 'Try: "Emergency"'
      }
    ];
  }

  // Appointments section
  if (pathname === '/appointments' || pathname.includes('/appointments')) {
    return [
      {
        command: 'Schedule a vet appointment for [pet name]',
        description: 'Book a new appointment',
        category: 'Scheduling',
        example: 'Try: "Schedule a vet appointment for Buddy"'
      },
      {
        command: 'When is [pet name]\'s next appointment?',
        description: 'Check upcoming appointments',
        category: 'Query',
        example: 'Try: "When is Max\'s next appointment?"'
      },
      {
        command: 'Cancel appointment for [pet name] on [date]',
        description: 'Remove a scheduled appointment',
        category: 'Scheduling',
        example: 'Try: "Cancel appointment for Bella on Monday"'
      },
      {
        command: 'Find nearby vet clinics',
        description: 'Search for veterinary services',
        category: 'Navigation',
        example: 'Try: "Find nearby vet clinics"'
      }
    ];
  }

  // Health Records section
  if (pathname.includes('/health-records')) {
    return [
      {
        command: 'Show [pet name]\'s health records',
        description: 'View complete medical history',
        category: 'Query',
        example: 'Try: "Show Buddy\'s health records"'
      },
      {
        command: 'Record weight for [pet name] - [weight] kg',
        description: 'Log a weight measurement',
        category: 'Data Entry',
        example: 'Try: "Record weight for Max - 25 kg"'
      },
      {
        command: 'Add vaccination record for [pet name]',
        description: 'Log a new vaccination',
        category: 'Data Entry',
        example: 'Try: "Add vaccination record for Bella"'
      },
      {
        command: 'Show vaccination history',
        description: 'View all vaccination records',
        category: 'Query',
        example: 'Try: "Show vaccination history"'
      }
    ];
  }

  // Voice Assistant section
  if (pathname.includes('/voice-assistant')) {
    return [
      {
        command: 'Log feeding for [pet name]',
        description: 'Record feeding activity',
        category: 'Data Entry',
        example: 'Try: "Log feeding for Buddy"'
      },
      {
        command: 'What medications does [pet name] need today?',
        description: 'Check today\'s medication schedule',
        category: 'Query',
        example: 'Try: "What medications does Max need today?"'
      },
      {
        command: 'Add medication reminder for [pet name]',
        description: 'Create a new medication alert',
        category: 'Data Entry',
        example: 'Try: "Add medication reminder for Bella"'
      },
      {
        command: 'Show tips',
        description: 'Get daily pet care tips',
        category: 'Query',
        example: 'Try: "Show tips"'
      }
    ];
  }

  // Default examples
  return getCommonExamples().slice(0, 4);
};

/**
 * Interactive Tutorial Component for First-Time Users
 */
const FirstTimeTutorial: React.FC<{
  onComplete: () => void;
  onSkip: () => void;
}> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const commonExamples = getCommonExamples();

  const tutorialSteps = [
    {
      title: 'Welcome to JoJo Voice Assistant! 🎉',
      description: 'Control your pet care dashboard completely hands-free with natural voice commands.',
      icon: <Sparkles className="w-8 h-8 text-purple-600" />
    },
    {
      title: 'How to Activate JoJo',
      description: 'Say "Hey JoJo" to wake up the assistant, or click the microphone button to start speaking.',
      icon: <Mic className="w-8 h-8 text-blue-600" />
    },
    {
      title: 'Try These Common Commands',
      description: 'Here are some examples to get you started. Click any command to try it!',
      icon: <BookOpen className="w-8 h-8 text-green-600" />
    }
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <Card className="max-w-2xl w-full p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-2 border-purple-300 dark:border-purple-700">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close tutorial"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tutorial content */}
        <div className="text-center mb-6">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4"
          >
            {tutorialSteps[currentStep].icon}
            <h2 className="text-2xl font-bold text-foreground">
              {tutorialSteps[currentStep].title}
            </h2>
            <p className="text-muted-foreground max-w-md">
              {tutorialSteps[currentStep].description}
            </p>
          </motion.div>
        </div>

        {/* Show examples on last step */}
        {currentStep === tutorialSteps.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 max-h-64 overflow-y-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {commonExamples.slice(0, 6).map((example, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-2">
                    <Mic className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0 group-hover:animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        "{example.command}"
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {example.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-purple-600'
                  : 'w-2 bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip Tutorial
          </Button>
          <Button
            onClick={handleNext}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {currentStep === tutorialSteps.length - 1 ? (
              <>
                Get Started
                <Play className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

/**
 * VoiceCommandExamples Component
 * 
 * Main component that displays context-aware voice command examples
 * and manages the first-time user tutorial experience.
 */
export const VoiceCommandExamples: React.FC<VoiceCommandExamplesProps> = ({
  isVisible = true,
  className = '',
  onExampleClick,
  forceShowTutorial = false
}) => {
  const location = useLocation();
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);

  // Check if user has completed tutorial
  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!completed || forceShowTutorial) {
      setShowTutorial(true);
    } else {
      setTutorialCompleted(true);
    }
  }, [forceShowTutorial]);

  // Get context-specific examples
  const contextExamples = useMemo(() => {
    return getContextExamples(location.pathname);
  }, [location.pathname]);

  // Get common examples
  const commonExamples = useMemo(() => {
    return getCommonExamples();
  }, []);

  // Get page title
  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/index') return 'Dashboard';
    if (path.includes('/appointments')) return 'Appointments';
    if (path.includes('/health-records')) return 'Health Records';
    if (path.includes('/voice-assistant')) return 'Voice Assistant';
    if (path === '/profile') return 'Profile';
    if (path === '/vet-search') return 'Vet Search';
    if (path === '/community') return 'Community';
    return 'General';
  }, [location.pathname]);

  const handleTutorialComplete = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setShowTutorial(false);
    setTutorialCompleted(true);
  };

  const handleTutorialSkip = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setShowTutorial(false);
    setTutorialCompleted(true);
  };

  const handleExampleClick = (command: string) => {
    onExampleClick?.(command);
  };

  const handleRestartTutorial = () => {
    setShowTutorial(true);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* First-time tutorial */}
      <AnimatePresence>
        {showTutorial && (
          <FirstTimeTutorial
            onComplete={handleTutorialComplete}
            onSkip={handleTutorialSkip}
          />
        )}
      </AnimatePresence>

      {/* Main examples panel */}
      {tutorialCompleted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={className}
        >
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h4 className="font-semibold text-sm text-foreground">
                  Try These Commands - {pageTitle}
                </h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestartTutorial}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <BookOpen className="w-3 h-3 mr-1" />
                Tutorial
              </Button>
            </div>

            <Separator className="mb-3" />

            {/* Context-specific examples */}
            <div className="space-y-2 mb-4">
              <Badge variant="secondary" className="text-xs">
                For This Page
              </Badge>
              <div className="grid grid-cols-1 gap-2">
                {contextExamples.map((example, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleExampleClick(example.command)}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left p-3 rounded-lg bg-white dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors border border-gray-200 dark:border-gray-700 group"
                  >
                    <div className="flex items-start gap-2">
                      <Mic className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0 group-hover:animate-pulse" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          "{example.command}"
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {example.description}
                        </p>
                        {example.example && (
                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 italic">
                            {example.example}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Common examples */}
            <Separator className="mb-3" />
            <div>
              <Badge variant="outline" className="text-xs mb-2">
                Common Commands
              </Badge>
              <div className="space-y-1">
                {commonExamples.slice(0, 4).map((example, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleExampleClick(example.command)}
                    whileHover={{ scale: 1.01 }}
                    className="w-full text-left px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    • {example.command}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Help tip */}
            <div className="mt-3 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <p className="text-xs text-purple-900 dark:text-purple-100">
                💡 <strong>Tip:</strong> Say "Hey JoJo" to activate hands-free mode, or click the mic button to speak
              </p>
            </div>
          </Card>
        </motion.div>
      )}
    </>
  );
};

export default VoiceCommandExamples;
