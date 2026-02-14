/**
 * Custom hook for voice assistant functionality
 * Handles Speech-to-Text (STT) and Text-to-Speech (TTS)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { getBestSoftVoice, getSoftVoiceSettings } from '@/lib/voiceUtils';

interface VoiceAssistantOptions {
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  language?: string;
  timeout?: number; // in milliseconds
}

interface VoiceAssistantReturn {
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  toggleMute: () => void;
  clearError: () => void;
}

export const useVoiceAssistant = (options: VoiceAssistantOptions = {}): VoiceAssistantReturn => {
  const {
    onTranscript,
    onError,
    onListeningChange,
    onSpeakingChange,
    language = 'en-US',
    timeout = 60000, // 1 minute default
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check browser support
  useEffect(() => {
    const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const hasSpeechSynthesis = 'speechSynthesis' in window;
    setIsSupported(hasSpeechRecognition && hasSpeechSynthesis);

    if (!hasSpeechRecognition || !hasSpeechSynthesis) {
      const errorMsg = 'Voice features are not supported in this browser. Please use Chrome, Edge, or Safari.';
      setError(errorMsg);
      onError?.(errorMsg);
    }

    // Load voices (some browsers need this)
    if (hasSpeechSynthesis) {
      // Load voices immediately
      window.speechSynthesis.getVoices();
      
      // Also listen for voiceschanged event
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, [onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      const errorMsg = 'Speech recognition is not supported in this browser.';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (isListening) return;

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setError(null);
        onListeningChange?.(true);

        // Set timeout
        timeoutRef.current = setTimeout(() => {
          recognition.stop();
          const errorMsg = 'Listening timeout - no speech detected for 1 minute.';
          setError(errorMsg);
          onError?.(errorMsg);
        }, timeout);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece;
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);

        if (finalTranscript) {
          onTranscript?.(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        let errorMsg = 'Speech recognition error occurred.';
        
        switch (event.error) {
          case 'no-speech':
            errorMsg = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMsg = 'Microphone not found. Please check your device.';
            break;
          case 'not-allowed':
            errorMsg = 'Microphone permission denied. Please allow microphone access.';
            break;
          case 'network':
            errorMsg = 'Network error occurred. Please check your connection.';
            break;
          case 'aborted':
            errorMsg = 'Speech recognition was aborted.';
            break;
        }

        setError(errorMsg);
        onError?.(errorMsg);
        setIsListening(false);
        onListeningChange?.(false);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        onListeningChange?.(false);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      const errorMsg = 'Failed to start speech recognition.';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [isSupported, isListening, language, timeout, onTranscript, onError, onListeningChange]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsListening(false);
    onListeningChange?.(false);
  }, [onListeningChange]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const speak = useCallback((text: string) => {
    if (!isSupported || isMuted) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    
    // Apply soft voice settings
    const settings = getSoftVoiceSettings();
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    // Select the best soft voice
    const bestVoice = getBestSoftVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      onSpeakingChange?.(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      onSpeakingChange?.(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      onSpeakingChange?.(false);
    };

    utteranceRef.current = utterance;
    
    // Small delay to ensure voices are loaded
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  }, [isSupported, isMuted, language, onSpeakingChange]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    onSpeakingChange?.(false);
  }, [onSpeakingChange]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (newMuted && isSpeaking) {
        stopSpeaking();
      }
      return newMuted;
    });
  }, [isSpeaking, stopSpeaking]);

  return {
    isListening,
    isSpeaking,
    isMuted,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    toggleMute,
    clearError,
  };
};
