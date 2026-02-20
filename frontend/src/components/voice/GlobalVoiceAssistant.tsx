/**
 * Global Voice Assistant Component
 * 
 * Provides voice control across all dashboard pages with seamless navigation
 * and feature access. This component is mounted at the app level and provides
 * voice control for all major features.
 * 
 * Task: 41.1 - Wire all components together
 * Requirements: 20.1, 20.5
 * Feature: jojo-voice-assistant-enhanced
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { VoiceAssistant } from './VoiceAssistant';
import { toast } from 'sonner';

interface GlobalVoiceAssistantProps {
  /** Whether voice assistant is enabled globally */
  enabled?: boolean;
}

/**
 * Global Voice Assistant Wrapper
 * 
 * Provides voice control across all dashboard pages:
 * - Automatically available on all pages
 * - Context-aware command suggestions based on current page
 * - Seamless navigation between pages via voice
 * - Integration with all major features
 */
export const GlobalVoiceAssistant: React.FC<GlobalVoiceAssistantProps> = ({
  enabled = true
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show on landing page or login page
  const shouldShow = enabled && 
    !location.pathname.includes('/login') && 
    !location.pathname.includes('/onboarding') &&
    location.pathname !== '/' &&
    !location.pathname.includes('/landing');

  // Log page changes for context awareness
  useEffect(() => {
    if (shouldShow) {
      console.log('Voice Assistant: Page changed to', location.pathname);
    }
  }, [location.pathname, shouldShow]);

  if (!shouldShow) {
    return null;
  }

  return (
    <VoiceAssistant
      isExpanded={isExpanded}
      onExpandedChange={setIsExpanded}
      showFirstTimeHelp={false}
      className="global-voice-assistant"
    />
  );
};

export default GlobalVoiceAssistant;
