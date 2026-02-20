/**
 * HandsFreeModeIndicator Component
 * 
 * Visual indicator showing hands-free mode state.
 * Displays a persistent badge when hands-free mode is active.
 * 
 * Requirements: 13.3
 * Feature: jojo-voice-assistant-enhanced
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HandsFreeModeIndicatorProps {
  /** Whether hands-free mode is enabled */
  isEnabled: boolean;
  /** Custom class name */
  className?: string;
  /** Position variant */
  position?: 'floating' | 'inline';
  /** Show label text */
  showLabel?: boolean;
}

/**
 * HandsFreeModeIndicator Component
 * 
 * Displays a visual indicator for hands-free mode state.
 * Shows a pulsing badge when enabled, hidden when disabled.
 */
export const HandsFreeModeIndicator: React.FC<HandsFreeModeIndicatorProps> = ({
  isEnabled,
  className = '',
  position = 'floating',
  showLabel = true
}) => {
  return (
    <AnimatePresence>
      {isEnabled && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={cn(
            position === 'floating' && 'fixed bottom-48 right-6 z-40',
            className
          )}
        >
          <Badge
            variant="secondary"
            className="shadow-lg relative overflow-hidden"
          >
            {/* Pulsing background animation */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="absolute inset-0 bg-primary/20 rounded-full"
            />
            
            {/* Icon and label */}
            <div className="relative flex items-center gap-1.5">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <Mic className="w-3 h-3" />
              </motion.div>
              {showLabel && <span className="text-xs font-medium">Hands-free</span>}
            </div>
          </Badge>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HandsFreeModeIndicator;
