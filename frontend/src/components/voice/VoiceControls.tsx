/**
 * Voice Controls Component
 * Microphone button and mute toggle
 */

import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VoiceControlsProps {
  isListening: boolean;
  isMuted: boolean;
  onToggleListening: () => void;
  onToggleMute: () => void;
  disabled?: boolean;
}

export const VoiceControls = ({
  isListening,
  isMuted,
  onToggleListening,
  onToggleMute,
  disabled = false,
}: VoiceControlsProps) => {
  return (
    <div className="flex items-center gap-2">
      {/* Mute/Unmute Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMute}
            disabled={disabled}
            className="w-10 h-10 rounded-full"
            aria-label={isMuted ? 'Unmute voice responses' : 'Mute voice responses'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isMuted ? 'Unmute voice responses' : 'Mute voice responses'}</p>
        </TooltipContent>
      </Tooltip>

      {/* Microphone Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            onClick={onToggleListening}
            disabled={disabled}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening
                ? 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/50'
                : 'bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isListening ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <MicOff className="w-6 h-6" />
              </motion.div>
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isListening ? 'Stop listening' : 'Start voice input'}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
