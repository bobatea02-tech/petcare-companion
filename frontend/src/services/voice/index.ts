/**
 * Voice Assistant Services - Main Export
 * Feature: jojo-voice-assistant-enhanced
 * 
 * This module provides the core infrastructure for the JoJo Voice Assistant,
 * including wake word detection, TTS with ElevenLabs, and response caching.
 */

// Export all types
export * from './types';

// Export configuration
export * from './config';

// Export service implementations
export { ElevenLabsClient, elevenLabsClient } from './elevenLabsClient';
export { ResponseCacheManager, responseCacheManager } from './responseCacheManager';
export { PorcupineWakeWordDetector, createWakeWordDetector, wakeWordDetector } from './wakeWordDetector';
export { VoiceRecognitionEngineImpl, createVoiceRecognitionEngine, voiceRecognitionEngine } from './voiceRecognitionEngine';
export { VoiceActivityDetectorImpl, createVoiceActivityDetector, voiceActivityDetector } from './voiceActivityDetector';
export { IntentParserService, intentParser } from './intentParser';
export { ContextManager, createContextManager } from './contextManager';
export { ContextSyncManager, createContextSyncManager, DashboardEventType } from './contextSyncManager';
export type { DashboardEvent, DataChangeEvent, DashboardEventListener, DataChangeListener } from './contextSyncManager';
export { CommandRouter, commandRouter } from './commandRouter';
export { DashboardActionsService, dashboardActions } from './dashboardActions';
export { ResponseComposerService, responseComposer } from './responseComposer';
export { 
  AudioFeedbackControllerImpl, 
  createAudioFeedbackController,
  FeedbackSound,
  AvatarState
} from './audioFeedbackController';
export type { AudioFeedbackController } from './audioFeedbackController';
export { ProactiveAlertManagerImpl, proactiveAlertManager } from './proactiveAlertManager';
export { DialogManager, dialogManager } from './dialogManager';
export type { DialogState, DialogType, ParameterDefinition, DialogPrompt, DialogResult } from './dialogManager';
export { ErrorRecoveryManager, getErrorRecoveryManager, resetErrorRecoveryManager, ErrorType } from './errorRecoveryManager';
export type { RecoveryStrategy, ErrorContext } from './errorRecoveryManager';
export { createHandsFreeModeManager } from './handsFreeMode Manager';
export type { HandsFreeModeManager, ModeStateCallback, InactivityCallback } from './handsFreeMode Manager';
export { UsageTrackerService, usageTracker } from './usageTracker';
export type { UsageTracker } from './usageTracker';

// Export command handlers
export * from './handlers';

// Export service instances for easy access
export const voiceServices = {
  tts: elevenLabsClient,
  cache: responseCacheManager,
  wakeWord: wakeWordDetector,
  recognition: voiceRecognitionEngine,
  activityDetector: voiceActivityDetector,
  intentParser: intentParser,
  commandRouter: commandRouter,
  dashboardActions: dashboardActions,
  responseComposer: responseComposer,
  proactiveAlerts: proactiveAlertManager,
  dialogManager: dialogManager,
  usageTracker: usageTracker
};
