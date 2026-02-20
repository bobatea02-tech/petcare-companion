/**
 * LowConfidenceWarning Component
 * 
 * Displays a visual warning badge when voice recognition confidence is low (below 80%).
 * Provides clear feedback to users that the system may have misunderstood their command.
 * 
 * Requirements: 10.6
 * Feature: jojo-voice-assistant-enhanced
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LowConfidenceWarningProps {
  /** Whether to show the warning */
  isVisible: boolean;
  /** Confidence level (0-1) */
  confidence?: number;
  /** Custom class name */
  className?: string;
}

/**
 * LowConfidenceWarning Component
 * 
 * Displays a warning badge when voice recognition confidence is below the threshold (80%).
 * The badge includes an alert icon and shows the confidence percentage.
 */
export const LowConfidenceWarning: React.FC<LowConfidenceWarningProps> = ({
  isVisible,
  confidence,
  className = ''
}) => {
  const confidencePercent = confidence ? Math.round(confidence * 100) : 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className={cn('flex items-center justify-center', className)}
        >
          <Badge
            variant="destructive"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium shadow-md"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </motion.div>
            <span>Low Confidence</span>
            {confidence !== undefined && (
              <span className="ml-1 opacity-90">({confidencePercent}%)</span>
            )}
          </Badge>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LowConfidenceWarning;
