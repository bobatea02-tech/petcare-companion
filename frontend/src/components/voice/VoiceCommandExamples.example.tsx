/**
 * VoiceCommandExamples Usage Examples
 * 
 * This file demonstrates how to integrate the VoiceCommandExamples component
 * into different parts of the dashboard.
 */

import React from 'react';
import { VoiceCommandExamples } from './VoiceCommandExamples';

/**
 * Example 1: Basic Usage in Dashboard
 * 
 * Shows the examples panel with default settings.
 * The component automatically detects the current page and shows relevant examples.
 */
export const BasicUsageExample = () => {
  return (
    <div className="p-4">
      <VoiceCommandExamples />
    </div>
  );
};

/**
 * Example 2: With Click Handler
 * 
 * Handles when a user clicks on an example to try it.
 * This can trigger the voice assistant to execute the command.
 */
export const WithClickHandlerExample = () => {
  const handleExampleClick = (command: string) => {
    console.log('User wants to try command:', command);
    // You can trigger the voice assistant here
    // For example: voiceAssistant.executeCommand(command);
  };

  return (
    <div className="p-4">
      <VoiceCommandExamples
        onExampleClick={handleExampleClick}
      />
    </div>
  );
};

/**
 * Example 3: Conditional Display
 * 
 * Shows the examples panel only when certain conditions are met.
 * For example, only show when voice assistant is active.
 */
export const ConditionalDisplayExample = () => {
  const [isVoiceActive, setIsVoiceActive] = React.useState(false);

  return (
    <div className="p-4">
      <button onClick={() => setIsVoiceActive(!isVoiceActive)}>
        Toggle Voice Assistant
      </button>
      
      <VoiceCommandExamples
        isVisible={isVoiceActive}
      />
    </div>
  );
};

/**
 * Example 4: Force Show Tutorial
 * 
 * Useful for a "Help" button that reopens the tutorial.
 */
export const ForceShowTutorialExample = () => {
  const [showTutorial, setShowTutorial] = React.useState(false);

  return (
    <div className="p-4">
      <button onClick={() => setShowTutorial(true)}>
        Show Tutorial Again
      </button>
      
      <VoiceCommandExamples
        forceShowTutorial={showTutorial}
      />
    </div>
  );
};

/**
 * Example 5: Integration with VoiceAssistant Component
 * 
 * Shows how to integrate VoiceCommandExamples with the main VoiceAssistant.
 */
export const IntegratedExample = () => {
  const [isVoiceExpanded, setIsVoiceExpanded] = React.useState(false);

  const handleExampleClick = (command: string) => {
    // Expand voice assistant
    setIsVoiceExpanded(true);
    
    // Execute the command
    console.log('Executing command:', command);
    // voiceAssistant.executeCommand(command);
  };

  return (
    <div className="space-y-4 p-4">
      {/* Voice Assistant UI */}
      <div className="fixed bottom-4 right-4">
        {/* VoiceAssistant component would go here */}
        <button onClick={() => setIsVoiceExpanded(!isVoiceExpanded)}>
          Toggle Voice Assistant
        </button>
      </div>

      {/* Examples Panel - shown when voice is expanded */}
      {isVoiceExpanded && (
        <div className="max-w-md mx-auto">
          <VoiceCommandExamples
            onExampleClick={handleExampleClick}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Example 6: Sidebar Integration
 * 
 * Shows how to add the examples panel to a dashboard sidebar.
 */
export const SidebarIntegrationExample = () => {
  return (
    <div className="flex h-screen">
      {/* Main content */}
      <div className="flex-1 p-4">
        <h1>Dashboard Content</h1>
      </div>

      {/* Sidebar with voice examples */}
      <aside className="w-80 border-l p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Voice Commands</h2>
        <VoiceCommandExamples
          className="sticky top-4"
        />
      </aside>
    </div>
  );
};

/**
 * Example 7: Mobile-Friendly Bottom Sheet
 * 
 * Shows examples in a bottom sheet on mobile devices.
 */
export const MobileBottomSheetExample = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative h-screen">
      {/* Main content */}
      <div className="p-4">
        <button onClick={() => setIsOpen(true)}>
          Show Voice Commands
        </button>
      </div>

      {/* Bottom sheet */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl p-4 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Voice Commands</h3>
            <button onClick={() => setIsOpen(false)}>Close</button>
          </div>
          <VoiceCommandExamples />
        </div>
      )}
    </div>
  );
};

/**
 * Example 8: First-Time User Onboarding
 * 
 * Automatically shows the tutorial for new users during onboarding.
 */
export const OnboardingExample = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = React.useState(false);

  return (
    <div className="p-4">
      {!hasCompletedOnboarding ? (
        <div>
          <h1>Welcome to PetPal!</h1>
          <p>Let's learn how to use voice commands...</p>
          
          {/* Tutorial will show automatically for first-time users */}
          <VoiceCommandExamples
            forceShowTutorial={true}
          />
          
          <button onClick={() => setHasCompletedOnboarding(true)}>
            Continue to Dashboard
          </button>
        </div>
      ) : (
        <div>
          <h1>Dashboard</h1>
          {/* Regular examples without tutorial */}
          <VoiceCommandExamples />
        </div>
      )}
    </div>
  );
};

/**
 * Integration Notes:
 * 
 * 1. The component automatically shows a tutorial for first-time users
 * 2. Tutorial completion is stored in localStorage
 * 3. Examples update automatically based on the current route
 * 4. Click handlers can be used to trigger voice commands
 * 5. The component is fully responsive and works on mobile
 * 6. Tutorial can be restarted using the "Tutorial" button
 * 7. Use forceShowTutorial prop to show tutorial on demand
 */
