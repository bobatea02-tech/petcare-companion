/**
 * Animated Avatar Component
 * 
 * Displays an animated JoJo avatar with personality and mouth movements
 * synchronized to speech. Provides visual feedback for voice assistant state.
 * 
 * Task: 41.2 - Add UI polish and animations
 * Feature: jojo-voice-assistant-enhanced
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mic, Volume2, Loader2 } from 'lucide-react';

export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface AnimatedAvatarProps {
  /** Current avatar state */
  state: AvatarState;
  /** Size of the avatar in pixels */
  size?: number;
  /** Whether to show state icon */
  showIcon?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Animated Avatar Component
 * 
 * Features:
 * - Smooth state transitions with framer-motion
 * - Pulsing animation for listening state
 * - Rotating animation for thinking state
 * - Mouth movement simulation for speaking state
 * - Personality through color and animation variations
 */
export const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({
  state,
  size = 80,
  showIcon = true,
  className = ''
}) => {
  const [mouthOpen, setMouthOpen] = useState(false);

  // Simulate mouth movements when speaking
  useEffect(() => {
    if (state === 'speaking') {
      const interval = setInterval(() => {
        setMouthOpen(prev => !prev);
      }, 200); // Toggle every 200ms for natural speech rhythm

      return () => clearInterval(interval);
    } else {
      setMouthOpen(false);
    }
  }, [state]);

  // State-specific colors and animations
  const stateConfig = {
    idle: {
      bgColor: 'bg-gradient-to-br from-primary/20 to-accent/20',
      borderColor: 'border-primary/30',
      icon: Sparkles,
      iconColor: 'text-primary',
      animation: {
        scale: [1, 1.05, 1],
        rotate: [0, 5, -5, 0],
      },
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    },
    listening: {
      bgColor: 'bg-gradient-to-br from-blue-500/30 to-blue-600/30',
      borderColor: 'border-blue-500',
      icon: Mic,
      iconColor: 'text-blue-600',
      animation: {
        scale: [1, 1.15, 1],
        boxShadow: [
          '0 0 0 0 rgba(59, 130, 246, 0.4)',
          '0 0 0 20px rgba(59, 130, 246, 0)',
          '0 0 0 0 rgba(59, 130, 246, 0)'
        ]
      },
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    },
    thinking: {
      bgColor: 'bg-gradient-to-br from-purple-500/30 to-purple-600/30',
      borderColor: 'border-purple-500',
      icon: Loader2,
      iconColor: 'text-purple-600',
      animation: {
        rotate: 360,
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear'
      }
    },
    speaking: {
      bgColor: 'bg-gradient-to-br from-green-500/30 to-green-600/30',
      borderColor: 'border-green-500',
      icon: Volume2,
      iconColor: 'text-green-600',
      animation: {
        scale: mouthOpen ? 1.1 : 1,
      },
      transition: {
        duration: 0.2,
        ease: 'easeInOut'
      }
    }
  };

  const config = stateConfig[state];
  const IconComponent = config.icon;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Avatar Circle */}
      <motion.div
        animate={config.animation}
        transition={config.transition}
        className={`
          relative rounded-full border-4 ${config.borderColor} ${config.bgColor}
          flex items-center justify-center overflow-hidden
          shadow-lg
        `}
        style={{
          width: size,
          height: size
        }}
      >
        {/* Background Glow Effect */}
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className={`absolute inset-0 ${config.bgColor} blur-xl`}
        />

        {/* Icon */}
        {showIcon && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <IconComponent 
              className={`${config.iconColor}`}
              size={size * 0.4}
              strokeWidth={2.5}
            />
          </motion.div>
        )}

        {/* Mouth Animation for Speaking State */}
        {state === 'speaking' && (
          <motion.div
            animate={{
              scaleY: mouthOpen ? 1.5 : 0.5,
              opacity: mouthOpen ? 1 : 0.5
            }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-6 w-8 h-2 bg-current rounded-full"
            style={{ color: config.iconColor.replace('text-', '') }}
          />
        )}

        {/* Particle Effects for Idle State */}
        {state === 'idle' && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [-10, -30, -10],
                  x: [0, Math.sin(i) * 15, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: 'easeInOut'
                }}
                className="absolute top-2 w-2 h-2 bg-primary rounded-full"
                style={{
                  left: `${30 + i * 20}%`
                }}
              />
            ))}
          </>
        )}

        {/* Sound Waves for Speaking State */}
        {state === 'speaking' && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.6, 0, 0.6]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeOut'
                }}
                className="absolute inset-0 border-2 border-green-500 rounded-full"
              />
            ))}
          </>
        )}
      </motion.div>

      {/* State Label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="text-sm font-medium text-muted-foreground capitalize"
        >
          {state === 'thinking' ? 'Processing...' : state}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AnimatedAvatar;
