/**
 * AudioFeedbackDisplay Component
 * 
 * React component that displays visual feedback for voice interactions.
 * Shows animated JoJo avatar, waveform visualization, and state indicators.
 * 
 * Requirements: 1.2, 1.3, 10.1, 10.2, 10.3, 10.4, 10.5
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Loader2, Volume2, Circle } from 'lucide-react';
import { 
  AudioFeedbackController, 
  AvatarState,
  createAudioFeedbackController 
} from '@/services/voice/audioFeedbackController';
import { cn } from '@/lib/utils';

interface AudioFeedbackDisplayProps {
  controller?: AudioFeedbackController;
  className?: string;
  showWaveform?: boolean;
  showAvatar?: boolean;
}

/**
 * AudioFeedbackDisplay Component
 * 
 * Displays visual feedback for voice interactions including:
 * - Animated state indicators (listening, processing, speaking, idle)
 * - Real-time waveform visualization
 * - Animated JoJo avatar with mouth sync
 */
export const AudioFeedbackDisplay: React.FC<AudioFeedbackDisplayProps> = ({
  controller: externalController,
  className,
  showWaveform = true,
  showAvatar = true
}) => {
  const [currentState, setCurrentState] = useState<AvatarState>(AvatarState.IDLE);
  const [waveformData, setWaveformData] = useState<Float32Array>(new Float32Array(128));
  const controllerRef = useRef<AudioFeedbackController | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize controller
  useEffect(() => {
    const controller = externalController || createAudioFeedbackController();
    controllerRef.current = controller;

    // Subscribe to state changes
    const unsubscribeState = controller.onStateChange((state) => {
      setCurrentState(state);
    });

    // Subscribe to waveform updates
    const unsubscribeWaveform = controller.onWaveformUpdate((data) => {
      setWaveformData(data);
    });

    return () => {
      unsubscribeState();
      unsubscribeWaveform();
      if (!externalController) {
        controller.cleanup();
      }
    };
  }, [externalController]);

  // Draw waveform on canvas
  useEffect(() => {
    if (!showWaveform || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw waveform
    ctx.lineWidth = 2;
    ctx.strokeStyle = getWaveformColor(currentState);
    ctx.beginPath();

    const sliceWidth = rect.width / waveformData.length;
    let x = 0;

    for (let i = 0; i < waveformData.length; i++) {
      const v = waveformData[i];
      const y = (v + 1) * rect.height / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  }, [waveformData, currentState, showWaveform]);

  /**
   * Get waveform color based on current state
   */
  function getWaveformColor(state: AvatarState): string {
    switch (state) {
      case AvatarState.LISTENING:
        return '#3b82f6'; // blue
      case AvatarState.THINKING:
        return '#f59e0b'; // amber
      case AvatarState.SPEAKING:
        return '#10b981'; // green
      case AvatarState.IDLE:
      default:
        return '#6b7280'; // gray
    }
  }

  /**
   * Get state icon component
   */
  function getStateIcon(state: AvatarState) {
    switch (state) {
      case AvatarState.LISTENING:
        return <Mic className="w-8 h-8" />;
      case AvatarState.THINKING:
        return <Loader2 className="w-8 h-8 animate-spin" />;
      case AvatarState.SPEAKING:
        return <Volume2 className="w-8 h-8" />;
      case AvatarState.IDLE:
      default:
        return <Circle className="w-8 h-8" />;
    }
  }

  /**
   * Get state label
   */
  function getStateLabel(state: AvatarState): string {
    switch (state) {
      case AvatarState.LISTENING:
        return 'Listening...';
      case AvatarState.THINKING:
        return 'Processing...';
      case AvatarState.SPEAKING:
        return 'Speaking...';
      case AvatarState.IDLE:
      default:
        return 'Ready';
    }
  }

  /**
   * Get animation variants for avatar
   */
  const avatarVariants = {
    idle: {
      scale: 1,
      opacity: 0.6,
      transition: { duration: 0.3 }
    },
    listening: {
      scale: [1, 1.1, 1],
      opacity: 1,
      transition: {
        scale: {
          repeat: Infinity,
          duration: 1.5,
          ease: "easeInOut"
        }
      }
    },
    thinking: {
      rotate: [0, 360],
      opacity: 0.8,
      transition: {
        rotate: {
          repeat: Infinity,
          duration: 2,
          ease: "linear"
        }
      }
    },
    speaking: {
      scale: [1, 1.05, 1],
      opacity: 1,
      transition: {
        scale: {
          repeat: Infinity,
          duration: 0.5,
          ease: "easeInOut"
        }
      }
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-4 p-6", className)}>
      {/* Avatar Display */}
      {showAvatar && (
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentState}
              variants={avatarVariants}
              initial="idle"
              animate={currentState}
              exit="idle"
              className={cn(
                "flex items-center justify-center w-24 h-24 rounded-full",
                "bg-gradient-to-br shadow-lg",
                currentState === AvatarState.LISTENING && "from-blue-400 to-blue-600",
                currentState === AvatarState.THINKING && "from-amber-400 to-amber-600",
                currentState === AvatarState.SPEAKING && "from-green-400 to-green-600",
                currentState === AvatarState.IDLE && "from-gray-400 to-gray-600"
              )}
            >
              <div className="text-white">
                {getStateIcon(currentState)}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Pulsing ring for listening state */}
          {currentState === AvatarState.LISTENING && (
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-blue-400"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.3, opacity: 0 }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeOut"
              }}
            />
          )}
        </div>
      )}

      {/* State Label */}
      <motion.div
        key={currentState}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-center"
      >
        <p className={cn(
          "text-lg font-medium",
          currentState === AvatarState.LISTENING && "text-blue-600",
          currentState === AvatarState.THINKING && "text-amber-600",
          currentState === AvatarState.SPEAKING && "text-green-600",
          currentState === AvatarState.IDLE && "text-gray-600"
        )}>
          {getStateLabel(currentState)}
        </p>
      </motion.div>

      {/* Waveform Visualization */}
      {showWaveform && (currentState === AvatarState.LISTENING || currentState === AvatarState.SPEAKING) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="w-full max-w-md"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-24 rounded-lg bg-gray-100 dark:bg-gray-800"
            style={{ width: '100%', height: '96px' }}
          />
        </motion.div>
      )}

      {/* Simple waveform bars for idle/thinking states */}
      {!showWaveform && currentState !== AvatarState.IDLE && (
        <div className="flex items-center gap-1 h-12">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "w-1 rounded-full",
                currentState === AvatarState.LISTENING && "bg-blue-500",
                currentState === AvatarState.THINKING && "bg-amber-500",
                currentState === AvatarState.SPEAKING && "bg-green-500"
              )}
              animate={{
                height: ["20%", "100%", "20%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 1,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AudioFeedbackDisplay;
