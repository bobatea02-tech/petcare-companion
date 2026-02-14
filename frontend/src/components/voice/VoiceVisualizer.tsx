/**
 * Voice Visualizer Component
 * Shows different animations based on voice state
 */

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface VoiceVisualizerProps {
  state: 'idle' | 'listening' | 'processing' | 'speaking';
  className?: string;
}

export const VoiceVisualizer = ({ state, className = '' }: VoiceVisualizerProps) => {
  if (state === 'idle') {
    return null;
  }

  if (state === 'processing') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (state === 'speaking') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 bg-primary rounded-full"
            animate={{
              height: ['8px', '24px', '8px'],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    );
  }

  if (state === 'listening') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <motion.div
          className="relative w-16 h-16"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="absolute inset-0 rounded-full bg-destructive/20" />
          <motion.div
            className="absolute inset-2 rounded-full bg-destructive/40"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <div className="absolute inset-4 rounded-full bg-destructive" />
        </motion.div>
      </div>
    );
  }

  return null;
};
