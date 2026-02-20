/**
 * State Transition Animations
 * 
 * Provides smooth animated transitions between voice assistant states.
 * Enhances user experience with polished visual feedback.
 * 
 * Task: 41.2 - Add UI polish and animations
 * Feature: jojo-voice-assistant-enhanced
 */

import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

/**
 * Fade and slide transition variants
 */
export const fadeSlideVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1] // Custom easing for smooth feel
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

/**
 * Scale and fade transition variants
 */
export const scaleFadeVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

/**
 * Bounce transition variants
 */
export const bounceVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20
    }
  },
  exit: {
    opacity: 0,
    scale: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

/**
 * Slide from right transition variants
 */
export const slideRightVariants: Variants = {
  initial: {
    opacity: 0,
    x: 100
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

/**
 * Stagger children animation variants
 */
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

export const staggerItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

interface StateTransitionWrapperProps {
  /** Unique key for AnimatePresence */
  stateKey: string;
  /** Transition variant to use */
  variant?: 'fadeSlide' | 'scaleFade' | 'bounce' | 'slideRight';
  /** Children to animate */
  children: React.ReactNode;
  /** Custom class name */
  className?: string;
}

/**
 * State Transition Wrapper Component
 * 
 * Wraps content with smooth transition animations.
 * Use this for transitioning between different voice assistant states.
 */
export const StateTransitionWrapper: React.FC<StateTransitionWrapperProps> = ({
  stateKey,
  variant = 'fadeSlide',
  children,
  className = ''
}) => {
  const variantMap = {
    fadeSlide: fadeSlideVariants,
    scaleFade: scaleFadeVariants,
    bounce: bounceVariants,
    slideRight: slideRightVariants
  };

  const selectedVariant = variantMap[variant];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stateKey}
        variants={selectedVariant}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

interface PulseAnimationProps {
  /** Whether animation is active */
  isActive: boolean;
  /** Pulse color */
  color?: string;
  /** Size of the pulse */
  size?: number;
  /** Children to wrap */
  children: React.ReactNode;
  /** Custom class name */
  className?: string;
}

/**
 * Pulse Animation Component
 * 
 * Adds a pulsing glow effect around content.
 * Perfect for indicating active listening state.
 */
export const PulseAnimation: React.FC<PulseAnimationProps> = ({
  isActive,
  color = 'primary',
  size = 100,
  children,
  className = ''
}) => {
  const colorClasses = {
    primary: 'bg-primary/20',
    blue: 'bg-blue-500/20',
    green: 'bg-green-500/20',
    purple: 'bg-purple-500/20'
  };

  const pulseColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.primary;

  return (
    <div className={`relative ${className}`}>
      {/* Pulse rings */}
      {isActive && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 2, 2],
                opacity: [0.6, 0.3, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeOut'
              }}
              className={`absolute inset-0 rounded-full ${pulseColor}`}
              style={{
                width: size,
                height: size,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
        </>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

interface ShimmerEffectProps {
  /** Whether shimmer is active */
  isActive: boolean;
  /** Children to wrap */
  children: React.ReactNode;
  /** Custom class name */
  className?: string;
}

/**
 * Shimmer Effect Component
 * 
 * Adds a subtle shimmer animation to content.
 * Great for indicating processing or thinking state.
 */
export const ShimmerEffect: React.FC<ShimmerEffectProps> = ({
  isActive,
  children,
  className = ''
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      
      {/* Shimmer overlay */}
      {isActive && (
        <motion.div
          animate={{
            x: ['-100%', '200%']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear'
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{
            width: '50%'
          }}
        />
      )}
    </div>
  );
};

export default {
  StateTransitionWrapper,
  PulseAnimation,
  ShimmerEffect,
  fadeSlideVariants,
  scaleFadeVariants,
  bounceVariants,
  slideRightVariants,
  staggerContainerVariants,
  staggerItemVariants
};
