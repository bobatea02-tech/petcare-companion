/**
 * Voice Assistant Configuration
 * Feature: jojo-voice-assistant-enhanced
 */

export const VOICE_CONFIG = {
  // ElevenLabs Configuration
  elevenlabs: {
    apiUrl: 'https://api.elevenlabs.io/v1',
    monthlyCharacterLimit: 10000, // Free tier limit
    warningThreshold: 0.8, // Warn at 80% usage
    voices: {
      rachel: '21m00Tcm4TlvDq8ikWAM',
      bella: 'EXAVITQu4vr4xnSDxMaL'
    },
    defaultVoice: 'rachel',
    voiceSettings: {
      stability: 0.75,
      similarityBoost: 0.75
    }
  },

  // Wake Word Detection Configuration
  wakeWord: {
    phrase: 'Hey JoJo',
    sensitivity: 0.7, // 0.0 to 1.0
    falsePositiveRateTarget: 0.05, // 5%
    detectionLatencyTarget: 500 // milliseconds
  },

  // Voice Recognition Configuration
  recognition: {
    language: 'en-IN', // English (India)
    continuous: true,
    interimResults: true,
    confidenceThreshold: 0.8,
    silenceThreshold: 1500 // milliseconds
  },

  // Voice Activity Detection Configuration
  vad: {
    silenceThreshold: 1500, // milliseconds
    samplingInterval: 100, // milliseconds
    speechThreshold: -50, // dB
    noiseGate: -60 // dB
  },

  // Response Cache Configuration
  cache: {
    maxEntries: 100,
    dbName: 'jojo_voice_cache',
    dbVersion: 1,
    storeName: 'tts_responses'
  },

  // Context Management Configuration
  context: {
    maxTurns: 10, // conversation turns to remember
    maxEntities: 20, // recent entities to track
    inactivityTimeout: 30 * 60 * 1000 // 30 minutes in milliseconds
  },

  // Audio Feedback Configuration
  feedback: {
    enableSounds: true,
    enableWaveform: true,
    enableAvatar: true,
    waveformUpdateInterval: 50 // milliseconds
  },

  // Performance Configuration
  performance: {
    wakeWordLatencyTarget: 500, // milliseconds
    intentParsingLatencyTarget: 1000, // milliseconds
    ttsLatencyTarget: 2000, // milliseconds
    maxCpuUsage: 0.05 // 5%
  },

  // Error Handling Configuration
  errorHandling: {
    maxRetries: 3,
    retryDelay: 1000, // milliseconds
    fallbackToText: true,
    logErrors: true
  },

  // Common Responses for Preloading
  commonResponses: [
    'Hello! How can I help you today?',
    'I\'m listening.',
    'Got it!',
    'Let me check that for you.',
    'I\'m sorry, I didn\'t catch that. Could you repeat?',
    'Is there anything else I can help you with?',
    'Done!',
    'I\'m having trouble with that. Could you try again?',
    'No problem!',
    'Sure thing!'
  ]
} as const;

// Type-safe access to configuration
export type VoiceConfig = typeof VOICE_CONFIG;

// Helper function to get configuration value
export function getVoiceConfig<K extends keyof VoiceConfig>(key: K): VoiceConfig[K] {
  return VOICE_CONFIG[key];
}

// Helper function to check if quota warning threshold is reached
export function shouldWarnAboutQuota(usagePercentage: number): boolean {
  return usagePercentage >= VOICE_CONFIG.elevenlabs.warningThreshold * 100;
}

// Helper function to check if quota is exhausted
export function isQuotaExhausted(usagePercentage: number): boolean {
  return usagePercentage >= 100;
}

// Helper function to get voice ID by name
export function getVoiceId(voiceName: keyof typeof VOICE_CONFIG.elevenlabs.voices): string {
  return VOICE_CONFIG.elevenlabs.voices[voiceName];
}
