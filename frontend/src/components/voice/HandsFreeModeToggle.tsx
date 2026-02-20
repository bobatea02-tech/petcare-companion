/**
 * HandsFreeModeToggle Component
 * 
 * Toggle button for enabling/disabling hands-free mode.
 * Provides visual feedback and accessibility support.
 * 
 * Requirements: 13.5
 * Feature: jojo-voice-assistant-enhanced
 */

import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HandsFreeModeToggleProps {
  /** Whether hands-free mode is enabled */
  isEnabled: boolean;
  /** Callback when toggle state changes */
  onToggle: (enabled: boolean) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Show label text */
  showLabel?: boolean;
  /** Show description text */
  showDescription?: boolean;
}

/**
 * HandsFreeModeToggle Component
 * 
 * Provides a toggle switch for hands-free mode with visual feedback.
 * Includes icon, label, and description for clarity.
 */
export const HandsFreeModeToggle: React.FC<HandsFreeModeToggleProps> = ({
  isEnabled,
  onToggle,
  disabled = false,
  className = '',
  showLabel = true,
  showDescription = true
}) => {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {isEnabled ? (
          <Mic className="w-4 h-4 text-primary" />
        ) : (
          <MicOff className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Label and Description */}
      <div className="flex-1 space-y-1">
        {showLabel && (
          <Label
            htmlFor="hands-free-toggle"
            className="text-sm font-medium cursor-pointer"
          >
            Hands-free Mode
          </Label>
        )}
        {showDescription && (
          <p className="text-xs text-muted-foreground">
            When enabled, say "Hey JoJo" to activate voice commands without clicking
          </p>
        )}
      </div>

      {/* Toggle Switch */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Switch
              id="hands-free-toggle"
              checked={isEnabled}
              onCheckedChange={onToggle}
              disabled={disabled}
              aria-label="Toggle hands-free mode"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isEnabled ? 'Disable hands-free mode' : 'Enable hands-free mode'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default HandsFreeModeToggle;
