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
      
      if (!SpeechRecognition) {
        const errorMsg = 'Speech recognition is not available. Please use Chrome, Edge, or Safari.';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }
      
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy

      recognition.onstart = () => {
        console.log('🎤 Voice recognition started');
        setIsListening(true);
        setTranscript('');
        setError(null);
        onListeningChange?.(true);

        // Set timeout
        timeoutRef.current = setTimeout(() => {
          console.log('⏱️ Voice recognition timeout');
          recognition.stop();
          const errorMsg = 'Listening timeout - no speech detected for 1 minute.';
          setError(errorMsg);
          onError?.(errorMsg);
        }, timeout);
      };

      recognition.onresult = (event: any) => {
        console.log('🎯 Voice recognition result received');
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          console.log(`  Result ${i}: "${transcriptPiece}" (confidence: ${confidence})`);
          
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece;
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);

        if (finalTranscript) {
          console.log('✅ Final transcript:', finalTranscript);
          // Clear timeout on successful transcription
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          onTranscript?.(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Voice recognition error:', event.error);
        let errorMsg = 'Speech recognition error occurred.';
        
        switch (event.error) {
          case 'no-speech':
            errorMsg = 'No speech detected. Please try again and speak clearly.';
            break;
          case 'audio-capture':
            errorMsg = 'Microphone not found. Please check your device and browser permissions.';
            break;
          case 'not-allowed':
            errorMsg = 'Microphone permission denied. Please click the microphone icon in your browser address bar and allow access.';
            break;
          case 'network':
            errorMsg = 'Network error occurred. Voice recognition requires an internet connection.';
            break;
          case 'aborted':
            // Don't show error for user-initiated abort
            errorMsg = '';
            break;
          case 'service-not-allowed':
            errorMsg = 'Speech recognition service is not available. Please check your browser settings or try Chrome/Edge.';
            break;
        }

        if (errorMsg) {
          setError(errorMsg);
          onError?.(errorMsg);
        }
        setIsListening(false);
        onListeningChange?.(false);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };

      recognition.onend = () => {
        console.log('🛑 Voice recognition ended');
        setIsListening(false);
        onListeningChange?.(false);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };

      recognitionRef.current = recognition;
      
      // Request microphone permission explicitly
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          console.log('✅ Microphone permission granted');
          recognition.start();
        })
        .catch((err) => {
          console.error('❌ Microphone permission error:', err);
          const errorMsg = 'Microphone access denied. Please allow microphone access in your browser settings and refresh the page.';
          setError(errorMsg);
          onError?.(errorMsg);
        });
    } catch (err) {
      console.error('❌ Failed to initialize speech recognition:', err);
      const errorMsg = 'Failed to start speech recognition. Please ensure microphone permissions are granted and you are using a supported browser (Chrome, Edge, or Safari).';
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
    if (!isSupported) {
      console.warn('Speech synthesis not supported');
      return;
    }

    if (isMuted) {
      console.log('🔇 Speech muted, skipping TTS');
      return;
    }

    console.log('🔊 Starting speech synthesis:', text.substring(0, 50) + '...');

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
      console.log('🎙️ Using voice:', bestVoice.name);
    } else {
      console.warn('⚠️ No preferred voice found, using default');
    }

    utterance.onstart = () => {
      console.log('🗣️ Speech started');
      setIsSpeaking(true);
      onSpeakingChange?.(true);
    };

    utterance.onend = () => {
      console.log('✅ Speech completed');
      setIsSpeaking(false);
      onSpeakingChange?.(false);
    };

    utterance.onerror = (event) => {
      console.error('❌ Speech synthesis error:', event.error);
      // Log more details about the error
      console.error('Error details:', {
        error: event.error,
        charIndex: event.charIndex,
        elapsedTime: event.elapsedTime,
        name: event.name
      });
      setIsSpeaking(false);
      onSpeakingChange?.(false);
      
      // Try to recover from certain errors
      if (event.error === 'interrupted' || event.error === 'canceled') {
        console.log('Speech was interrupted, this is normal');
      } else {
        // For other errors, notify the user
        const errorMsg = `Speech synthesis failed: ${event.error}`;
        setError(errorMsg);
        onError?.(errorMsg);
      }
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
