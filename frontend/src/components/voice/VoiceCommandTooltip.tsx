/**
 * VoiceCommandTooltip Component
 * 
 * Displays voice command hints when hovering over UI elements.
 * Shows the equivalent voice command for any interactive element.
 * 
 * Requirement: 14.5
 * Feature: jojo-voice-assistant-enhanced
 */

import React from 'react';
import { Mic } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getVoiceCommandHint } from './VoiceCommandSuggestions';

interface VoiceCommandTooltipProps {
  /** The type of UI element (used to determine voice command) */
  elementType: string;
  /** Additional context for generating the voice command hint */
  elementContext?: any;
  /** The child element to wrap with the tooltip */
  children: React.ReactNode;
  /** Whether to show the tooltip */
  enabled?: boolean;
  /** Custom voice command hint (overrides auto-generated hint) */
  customHint?: string;
  /** Tooltip side */
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * VoiceCommandTooltip Component
 * 
 * Wraps UI elements with a tooltip that shows the equivalent voice command.
 * Automatically generates hints based on element type and context.
 * 
 * Example usage:
 * ```tsx
 * <VoiceCommandTooltip elementType="pet-card" elementContext={{ petName: "Buddy" }}>
 *   <PetCard pet={pet} />
 * </VoiceCommandTooltip>
 * ```
 */
export const VoiceCommandTooltip: React.FC<VoiceCommandTooltipProps> = ({
  elementType,
  elementContext,
  children,
  enabled = true,
  customHint,
  side = 'top'
}) => {
  // Get the voice command hint
  const hint = customHint || getVoiceCommandHint(elementType, elementContext);

  // If no hint or disabled, just return children
  if (!enabled || !hint) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <div className="flex items-center gap-2">
            <Mic className="w-3 h-3 text-blue-500" />
            <span className="text-xs">{hint}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VoiceCommandTooltip;
