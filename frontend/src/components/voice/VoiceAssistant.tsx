/**
 * Enhanced VoiceAssistant Component
 * 
 * Main UI component that integrates all voice services for the JoJo voice assistant.
 * Provides hands-free mode toggle, voice command suggestions, and error recovery flows.
 * 
 * Requirements: 1.1, 13.1, 13.3, 14.1, 14.2
 * Feature: jojo-voice-assistant-enhanced
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Sparkles, Volume2, VolumeX, HelpCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AudioFeedbackDisplay } from './AudioFeedbackDisplay';
import { VoiceControls } from './VoiceControls';
import { VoiceCommandSuggestions } from './VoiceCommandSuggestions';
import { HandsFreeModeToggle } from './HandsFreeModeToggle';
import { HandsFreeModeIndicator } from './HandsFreeModeIndicator';
import { InactivityDialog } from './InactivityDialog';
import { LowConfidenceWarning } from './LowConfidenceWarning';
import { AnimatedAvatar } from './AnimatedAvatar';
import { EnhancedWaveform } from './EnhancedWaveform';
import { StateTransitionWrapper, PulseAnimation } from './StateTransitions';
import { MicrophoneSelector } from './MicrophoneSelector';
import { VoicePrivacyConsent } from './VoicePrivacyConsent';
import { toast } from 'sonner';

// Import voice services
import { createWakeWordDetector } from '@/services/voice/wakeWordDetector';
import { createVoiceRecognitionEngine } from '@/services/voice/voiceRecognitionEngine';
import { createIntentParser } from '@/services/voice/intentParser';
import { createContextManager } from '@/services/voice/contextManager';
import { createCommandRouter } from '@/services/voice/commandRouter';
import { createResponseComposer } from '@/services/voice/responseComposer';
import { createAudioFeedbackController, AvatarState } from '@/services/voice/audioFeedbackController';
import { createHandsFreeModeManager } from '@/services/voice/handsFreeMode Manager';
import type {
  WakeWordDetector,
  VoiceRecognitionEngine,
  IntentParser,
  ContextManager,
  CommandRouter,
  ResponseComposer,
  AudioFeedbackController,
  ParsedIntent,
  CommandResult,
  Response
} from '@/services/voice/types';
import type { HandsFreeModeManager } from '@/services/voice/handsFreeMode Manager';

interface VoiceAssistantProps {
  /** Whether to show the component in expanded mode */
  isExpanded?: boolean;
  /** Callback when expanded state changes */
  onExpandedChange?: (expanded: boolean) => void;
  /** Whether to show first-time help */
  showFirstTimeHelp?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Enhanced VoiceAssistant Component
 * 
 * Integrates all voice services to provide a complete voice interaction experience:
 * - Wake word detection for hands-free mode
 * - Voice recognition and intent parsing
 * - Command execution and response generation
 * - Audio feedback and visual indicators
 * - Voice command suggestions
 * - Error recovery flows
 */
export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  isExpanded: controlledExpanded,
  onExpandedChange,
  showFirstTimeHelp = false,
  className = ''
}) => {
  // State management
  const [isExpanded, setIsExpanded] = useState(controlledExpanded ?? false);
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState<Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(showFirstTimeHelp);
  const [showSettings, setShowSettings] = useState(false);
  const [showInactivityDialog, setShowInactivityDialog] = useState(false);
  const [recognitionConfidence, setRecognitionConfidence] = useState<number>(1.0);
  const [showLowConfidenceWarning, setShowLowConfidenceWarning] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [avatarState, setAvatarState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [hasVoiceConsent, setHasVoiceConsent] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(true);

  // Service refs
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null);
  const voiceRecognitionRef = useRef<VoiceRecognitionEngine | null>(null);
  const intentParserRef = useRef<IntentParser | null>(null);
  const contextManagerRef = useRef<ContextManager | null>(null);
  const commandRouterRef = useRef<CommandRouter | null>(null);
  const responseComposerRef = useRef<ResponseComposer | null>(null);
  const audioFeedbackRef = useRef<AudioFeedbackController | null>(null);
  const handsFreeManagerRef = useRef<HandsFreeModeManager | null>(null);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize all voice services
        wakeWordDetectorRef.current = createWakeWordDetector();
        voiceRecognitionRef.current = createVoiceRecognitionEngine();
        intentParserRef.current = createIntentParser();
        contextManagerRef.current = createContextManager();
        commandRouterRef.current = createCommandRouter();
        responseComposerRef.current = createResponseComposer();
        audioFeedbackRef.current = createAudioFeedbackController();
        handsFreeManagerRef.current = createHandsFreeModeManager();

        // Initialize hands-free manager with wake word detector
        if (handsFreeManagerRef.current && wakeWordDetectorRef.current) {
          await handsFreeManagerRef.current.initialize(wakeWordDetectorRef.current);
          
          // Set up mode change callback
          handsFreeManagerRef.current.onModeChange((enabled) => {
            setHandsFreeMode(enabled);
            if (enabled) {
              toast.success('Hands-free mode enabled', {
                description: 'Say "Hey JoJo" to activate'
              });
            } else {
              toast.info('Hands-free mode disabled');
            }
          });

          // Set up inactivity callback
          handsFreeManagerRef.current.onInactivityTimeout(async () => {
            setShowInactivityDialog(true);
            return new Promise((resolve) => {
              // The dialog will call handleInactivityContinue or handleInactivityDisable
              // which will resolve this promise
              (window as any).__inactivityPromiseResolve = resolve;
            });
          });

          // Load saved preference
          const savedPreference = handsFreeManagerRef.current.getPreference();
          setHandsFreeMode(savedPreference);
        }

        // Set up wake word detection callback
        if (wakeWordDetectorRef.current) {
          wakeWordDetectorRef.current.onWakeWordDetected(() => {
            handleWakeWordDetected();
          });
        }

        // Set up voice recognition callbacks
        if (voiceRecognitionRef.current) {
          voiceRecognitionRef.current.onInterimResult((text) => {
            setTranscript(text);
          });

          voiceRecognitionRef.current.onFinalResult(async (text, confidence) => {
            setTranscript(text);
            await handleTranscription(text, confidence);
          });

          voiceRecognitionRef.current.onError((error) => {
            handleError(error.message);
          });
        }
      } catch (err) {
        console.error('Failed to initialize voice services:', err);
        handleError('Failed to initialize voice assistant. Please refresh the page.');
      }
    };

    initializeServices();

    // Set up activity tracking
    const trackActivity = () => {
      handsFreeManagerRef.current?.trackActivity();
    };

    // Track user activity on various events
    window.addEventListener('mousemove', trackActivity);
    window.addEventListener('keydown', trackActivity);
    window.addEventListener('click', trackActivity);
    window.addEventListener('scroll', trackActivity);
    window.addEventListener('touchstart', trackActivity);

    // Cleanup on unmount
    return () => {
      if (wakeWordDetectorRef.current?.isListening()) {
        wakeWordDetectorRef.current.stopListening();
      }
      if (voiceRecognitionRef.current) {
        voiceRecognitionRef.current.stopRecognition();
      }
      if (audioFeedbackRef.current) {
        audioFeedbackRef.current.cleanup();
      }
      if (handsFreeManagerRef.current) {
        handsFreeManagerRef.current.cleanup();
      }

      // Remove activity tracking listeners
      window.removeEventListener('mousemove', trackActivity);
      window.removeEventListener('keydown', trackActivity);
      window.removeEventListener('click', trackActivity);
      window.removeEventListener('scroll', trackActivity);
      window.removeEventListener('touchstart', trackActivity);
    };
  }, []);

  // Sync controlled expanded state
  useEffect(() => {
    if (controlledExpanded !== undefined) {
      setIsExpanded(controlledExpanded);
    }
  }, [controlledExpanded]);

  /**
   * Handle wake word detection
   */
  const handleWakeWordDetected = useCallback(() => {
    if (!handsFreeMode) return;

    // Play wake word detected sound
    audioFeedbackRef.current?.playFeedbackSound('chime' as any);
    
    // Show visual feedback
    audioFeedbackRef.current?.showListening();
    
    // Start voice recognition
    startListening();
    
    // Expand the UI
    setIsExpanded(true);
    onExpandedChange?.(true);
    
    toast.success('Wake word detected', {
      description: 'JoJo is listening...',
      duration: 2000
    });
  }, [handsFreeMode, onExpandedChange]);

  /**
   * Toggle hands-free mode
   */
  const toggleHandsFreeMode = async () => {
    if (!handsFreeManagerRef.current) return;
    
    try {
      await handsFreeManagerRef.current.toggle();
    } catch (err) {
      console.error('Failed to toggle hands-free mode:', err);
      handleError('Failed to toggle hands-free mode. Please check microphone permissions.');
    }
  };

  /**
   * Handle inactivity dialog - Continue
   */
  const handleInactivityContinue = () => {
    setShowInactivityDialog(false);
    handsFreeManagerRef.current?.trackActivity();
    
    // Resolve the promise
    if ((window as any).__inactivityPromiseResolve) {
      (window as any).__inactivityPromiseResolve(true);
      delete (window as any).__inactivityPromiseResolve;
    }
  };

  /**
   * Handle inactivity dialog - Disable
   */
  const handleInactivityDisable = () => {
    setShowInactivityDialog(false);
    handsFreeManagerRef.current?.disable();
    
    // Resolve the promise
    if ((window as any).__inactivityPromiseResolve) {
      (window as any).__inactivityPromiseResolve(false);
      delete (window as any).__inactivityPromiseResolve;
    }
  };

  /**
   * Handle voice privacy consent
   */
  const handleVoiceConsent = (accepted: boolean) => {
    setHasVoiceConsent(accepted);
    setShowConsentDialog(false);

    if (!accepted) {
      toast.info('Voice Features Disabled', {
        description: 'You can still use text input to interact with PawPal.'
      });
    } else {
      toast.success('Voice Features Enabled', {
        description: 'You can now use voice commands with JoJo.'
      });
    }
  };


  /**
   * Start listening for voice input
   */
  const startListening = useCallback(() => {
    if (isListening) return;

    // Check for voice consent first
    if (!hasVoiceConsent) {
      setShowConsentDialog(true);
      toast.warning('Privacy Consent Required', {
        description: 'Please accept the privacy policy to use voice features.'
      });
      return;
    }

    setIsListening(true);
    setTranscript('');
    setError(null);
    setShowLowConfidenceWarning(false); // Clear any previous warning
    setAvatarState('listening');
    audioFeedbackRef.current?.showListening();
    
    voiceRecognitionRef.current?.startRecognition();
    
    // Get audio stream for waveform visualization using selected microphone
    const savedDevice = localStorage.getItem('preferred_microphone');
    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };
    
    // Add device ID if saved
    if (savedDevice && savedDevice !== 'default') {
      audioConstraints.deviceId = { exact: savedDevice };
    }
    
    navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
      .then(stream => setAudioStream(stream))
      .catch(err => {
        console.error('Error getting audio stream:', err);
        // Fallback to default device if selected device fails
        if (savedDevice) {
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => setAudioStream(stream))
            .catch(err => console.error('Error getting default audio stream:', err));
        }
      });
  }, [isListening, hasVoiceConsent]);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    if (!isListening) return;

    setIsListening(false);
    setAvatarState('idle');
    voiceRecognitionRef.current?.stopRecognition();
    audioFeedbackRef.current?.showIdle();
    
    // Stop audio stream
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
  }, [isListening, audioStream]);

  /**
   * Toggle listening state
   */
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  /**
   * Handle transcription result
   */
  const handleTranscription = async (text: string, confidence: number) => {
    try {
      setIsProcessing(true);
      setAvatarState('thinking');
      audioFeedbackRef.current?.showProcessing();

      // Store confidence level
      setRecognitionConfidence(confidence);

      // Check confidence threshold (80% as per requirements)
      if (confidence < 0.8) {
        // Show low confidence warning
        setShowLowConfidenceWarning(true);
        
        // Low confidence - request confirmation
        const confirmationResponse = responseComposerRef.current?.composeConfirmation({
          intentId: '',
          action: 'QUERY' as any,
          target: text,
          parameters: {},
          confidence,
          requiresConfirmation: true,
          priority: 'normal',
          entities: [],
          ambiguities: []
        });
        
        if (confirmationResponse) {
          setResponse(confirmationResponse);
          await speakResponse(confirmationResponse.text);
        }
        return;
      }

      // Hide low confidence warning if confidence is good
      setShowLowConfidenceWarning(false);

      // Parse intent
      const context = contextManagerRef.current?.getContext();
      const intent = await intentParserRef.current?.parseIntent(text, context!);
      
      if (!intent) {
        throw new Error('Failed to parse intent');
      }

      // Update context
      contextManagerRef.current?.updateContext(intent);

      // Execute command
      const result = await commandRouterRef.current?.executeCommand(intent);
      
      if (!result) {
        throw new Error('Failed to execute command');
      }

      // Compose response
      const responseData = responseComposerRef.current?.composeResponse(result, context!);
      
      if (responseData) {
        setResponse(responseData);
        await speakResponse(responseData.text);
      }

      // Play success sound
      audioFeedbackRef.current?.playFeedbackSound('success' as any);

    } catch (err) {
      console.error('Error processing transcription:', err);
      const errorResponse = responseComposerRef.current?.composeErrorResponse(
        err as Error,
        contextManagerRef.current?.getContext()!
      );
      
      if (errorResponse) {
        setResponse(errorResponse);
        await speakResponse(errorResponse.text);
      }
      
      audioFeedbackRef.current?.playFeedbackSound('error' as any);
    } finally {
      setIsProcessing(false);
      setIsListening(false);
      setAvatarState('idle');
      audioFeedbackRef.current?.showIdle();
    }
  };

  /**
   * Speak response text
   */
  const speakResponse = async (text: string) => {
    if (isMuted) return;

    setIsSpeaking(true);
    setAvatarState('speaking');
    audioFeedbackRef.current?.showSpeaking(null as any);

    // Use Web Speech API for now (TTS engine integration will be added later)
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setAvatarState('idle');
      audioFeedbackRef.current?.showIdle();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setAvatarState('idle');
      audioFeedbackRef.current?.showIdle();
    };

    window.speechSynthesis.speak(utterance);
  };

  /**
   * Handle error
   */
  const handleError = (message: string) => {
    setError(message);
    toast.error('Voice Assistant Error', {
      description: message
    });
    audioFeedbackRef.current?.playFeedbackSound('error' as any);
  };

  /**
   * Clear error
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Toggle mute
   */
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  /**
   * Toggle expanded state
   */
  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandedChange?.(newExpanded);
  };

  /**
   * Common voice command examples
   */
  const commandExamples = [
    'Show me my pets',
    'Schedule a vet appointment',
    'Log feeding for [pet name]',
    'What medications does [pet name] need today?',
    'Show health records',
    'Go to appointments'
  ];

  return (
    <>
      {/* Voice Privacy Consent Dialog */}
      <VoicePrivacyConsent
        onConsent={(accepted) => {
          setHasVoiceConsent(accepted);
          if (!accepted) {
            toast.info('Voice Features Disabled', {
              description: 'You can still use text input for all features.'
            });
          }
        }}
      />

      {/* Floating JoJo Button */}
      <motion.button
        onClick={toggleExpanded}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`fixed bottom-28 right-6 z-50 w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          isExpanded
            ? 'bg-destructive text-destructive-foreground'
            : 'bg-primary text-primary-foreground'
        } ${className}`}
        title="Talk to JoJo"
        data-tour="voice-assistant"
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="close"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="mic"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="relative"
            >
              <Sparkles className="w-6 h-6" />
              {handsFreeMode && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-primary-foreground/20"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Hands-free mode indicator */}
      <HandsFreeModeIndicator
        isEnabled={handsFreeMode && !isExpanded}
        position="floating"
      />

      {/* Inactivity Dialog */}
      <InactivityDialog
        isOpen={showInactivityDialog}
        onContinue={handleInactivityContinue}
        onDisable={handleInactivityDisable}
      />

      {/* Voice Privacy Consent Dialog */}
      {showConsentDialog && (
        <VoicePrivacyConsent onConsent={handleVoiceConsent} />
      )}

      {/* Voice Assistant Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-48 right-6 z-50 w-96 max-h-[600px] overflow-y-auto"
          >
            <Card className="p-6 shadow-2xl border-2 border-primary">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-lg text-foreground">JoJo Voice Assistant</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowHelp(!showHelp)}
                        aria-label="Show help"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Show help</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSettings(!showSettings)}
                        aria-label="Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Settings</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <Separator className="mb-4" />

              {/* Settings Panel */}
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-4 bg-muted rounded-lg space-y-4"
                >
                  <HandsFreeModeToggle
                    isEnabled={handsFreeMode}
                    onToggle={toggleHandsFreeMode}
                  />
                  
                  <Separator />
                  
                  <MicrophoneSelector
                    onDeviceChange={(deviceId) => {
                      // Voice recognition will automatically use the selected device
                      // from localStorage on next startListening() call
                    }}
                  />
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Privacy</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        // Open privacy policy in new tab
                        window.open('/VOICE_PRIVACY_POLICY.md', '_blank');
                      }}
                    >
                      View Voice Privacy Policy
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Learn how we handle your voice data
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Help Panel - Voice Command Suggestions */}
              {showHelp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <VoiceCommandSuggestions
                    isVisible={true}
                    onSuggestionClick={(command) => {
                      // Simulate speaking the command
                      setTranscript(command);
                      handleTranscription(command, 1.0);
                    }}
                  />
                </motion.div>
              )}

              {/* Animated Avatar and Waveform */}
              <div className="mb-6 flex flex-col items-center gap-4">
                <PulseAnimation
                  isActive={isListening}
                  color="blue"
                  size={120}
                >
                  <AnimatedAvatar
                    state={avatarState}
                    size={100}
                    showIcon={true}
                  />
                </PulseAnimation>
                
                <EnhancedWaveform
                  audioStream={audioStream}
                  isActive={isListening || isSpeaking}
                  color={isListening ? 'blue' : isSpeaking ? 'green' : 'primary'}
                  height={60}
                  barCount={32}
                  className="w-full"
                />
              </div>

              {/* Low Confidence Warning */}
              <LowConfidenceWarning
                isVisible={showLowConfidenceWarning}
                confidence={recognitionConfidence}
                className="mb-4"
              />

              {/* Transcript Display */}
              <AnimatePresence mode="wait">
                {transcript && (
                  <StateTransitionWrapper
                    stateKey={`transcript-${transcript}`}
                    variant="fadeSlide"
                  >
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>You said:</strong> {transcript}
                      </p>
                    </div>
                  </StateTransitionWrapper>
                )}
              </AnimatePresence>

              {/* Response Display */}
              <AnimatePresence mode="wait">
                {response && (
                  <StateTransitionWrapper
                    stateKey={`response-${response.text}`}
                    variant="fadeSlide"
                  >
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-900 dark:text-green-100">
                        <strong>JoJo:</strong> {response.displayText || response.text}
                      </p>
                    </div>
                  </StateTransitionWrapper>
                )}
              </AnimatePresence>

              {/* Error Display */}
              <AnimatePresence mode="wait">
                {error && (
                  <StateTransitionWrapper
                    stateKey={`error-${error}`}
                    variant="bounce"
                  >
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-900 dark:text-red-100">
                        <strong>Error:</strong> {error}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearError}
                        className="mt-2"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </StateTransitionWrapper>
                )}
              </AnimatePresence>

              {/* Voice Controls */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <VoiceControls
                  isListening={isListening}
                  isMuted={isMuted}
                  onToggleListening={toggleListening}
                  onToggleMute={toggleMute}
                  disabled={isProcessing}
                />
              </div>

              {/* Status Text */}
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  {isListening && 'Listening...'}
                  {isProcessing && 'Processing...'}
                  {isSpeaking && 'Speaking...'}
                  {!isListening && !isProcessing && !isSpeaking && 'Ready to listen'}
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceAssistant;
