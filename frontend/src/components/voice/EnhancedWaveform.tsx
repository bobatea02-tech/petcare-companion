/**
 * Enhanced Waveform Visualizer
 * 
 * Displays polished real-time audio waveform visualization with smooth animations.
 * Provides visual feedback for voice input and TTS output.
 * 
 * Task: 41.2 - Add UI polish and animations
 * Feature: jojo-voice-assistant-enhanced
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface EnhancedWaveformProps {
  /** Audio stream to visualize */
  audioStream?: MediaStream | null;
  /** Whether waveform is active */
  isActive: boolean;
  /** Waveform color */
  color?: string;
  /** Height of the waveform in pixels */
  height?: number;
  /** Number of bars in the waveform */
  barCount?: number;
  /** Custom class name */
  className?: string;
}

/**
 * Enhanced Waveform Visualizer
 * 
 * Features:
 * - Smooth bar animations with framer-motion
 * - Gradient colors for visual appeal
 * - Responsive to audio amplitude
 * - Fallback animation when no audio stream
 * - 60fps performance optimization
 */
export const EnhancedWaveform: React.FC<EnhancedWaveformProps> = ({
  audioStream,
  isActive,
  color = 'primary',
  height = 60,
  barCount = 32,
  className = ''
}) => {
  const [audioData, setAudioData] = useState<number[]>(
    Array(barCount).fill(0)
  );
  const animationFrameRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Initialize audio analyzer
  useEffect(() => {
    if (!audioStream || !isActive) {
      // Clean up
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      analyserRef.current = null;
      dataArrayRef.current = null;
      return;
    }

    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(audioStream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      // Start visualization loop
      visualize();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        source.disconnect();
        audioContext.close();
      };
    } catch (error) {
      console.error('Error initializing audio analyzer:', error);
    }
  }, [audioStream, isActive]);

  // Visualization loop
  const visualize = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Sample data at regular intervals
    const step = Math.floor(dataArrayRef.current.length / barCount);
    const newData: number[] = [];
    
    for (let i = 0; i < barCount; i++) {
      const index = i * step;
      const value = dataArrayRef.current[index] / 255; // Normalize to 0-1
      newData.push(value);
    }
    
    setAudioData(newData);
    animationFrameRef.current = requestAnimationFrame(visualize);
  };

  // Fallback animation when no audio stream
  useEffect(() => {
    if (!audioStream && isActive) {
      const interval = setInterval(() => {
        setAudioData(prev => 
          prev.map((_, i) => 
            Math.sin(Date.now() / 200 + i * 0.5) * 0.5 + 0.5
          )
        );
      }, 50);

      return () => clearInterval(interval);
    }
  }, [audioStream, isActive, barCount]);

  // Reset to zero when inactive
  useEffect(() => {
    if (!isActive) {
      setAudioData(Array(barCount).fill(0));
    }
  }, [isActive, barCount]);

  // Color variants
  const colorClasses = {
    primary: 'from-primary to-accent',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  const gradientClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.primary;

  return (
    <div 
      className={`flex items-end justify-center gap-1 ${className}`}
      style={{ height: `${height}px` }}
    >
      {audioData.map((value, index) => {
        // Calculate bar height with minimum height for visual appeal
        const barHeight = Math.max(value * height, 4);
        
        return (
          <motion.div
            key={index}
            animate={{
              height: barHeight,
              opacity: isActive ? 1 : 0.3
            }}
            transition={{
              height: {
                duration: 0.1,
                ease: 'easeOut'
              },
              opacity: {
                duration: 0.3
              }
            }}
            className={`
              w-1 rounded-full bg-gradient-to-t ${gradientClass}
              shadow-sm
            `}
            style={{
              minHeight: '4px'
            }}
          />
        );
      })}
    </div>
  );
};

export default EnhancedWaveform;
