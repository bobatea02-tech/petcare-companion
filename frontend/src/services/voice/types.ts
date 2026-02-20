/**
 * Core type definitions for the JoJo Voice Assistant system
 * Feature: jojo-voice-assistant-enhanced
 */

// ============================================================================
// Wake Word Detection Types
// ============================================================================

export interface WakeWordDetector {
  // Initialize detector with wake word model
  initialize(wakeWord: string): Promise<void>;
  
  // Start continuous monitoring
  startListening(): void;
  
  // Stop monitoring
  stopListening(): void;
  
  // Event fired when wake word detected
  onWakeWordDetected: (callback: () => void) => void;
  
  // Get current listening state
  isListening(): boolean;
}

// ============================================================================
// Voice Recognition Types
// ============================================================================

export interface VoiceRecognitionEngine {
  // Start listening for speech
  startRecognition(): void;
  
  // Stop listening
  stopRecognition(): void;
  
  // Event fired with interim results
  onInterimResult: (callback: (text: string) => void) => void;
  
  // Event fired with final transcription
  onFinalResult: (callback: (text: string, confidence: number) => void) => void;
  
  // Event fired on recognition error
  onError: (callback: (error: RecognitionError) => void) => void;
  
  // Configure language
  setLanguage(lang: string): void;
  
  // Configure continuous mode
  setContinuous(continuous: boolean): void;
}

export interface RecognitionError {
  code: string;
  message: string;
}

// ============================================================================
// Voice Activity Detection Types
// ============================================================================

export interface VoiceActivityDetector {
  // Start monitoring audio stream
  startMonitoring(stream: MediaStream): void;
  
  // Stop monitoring
  stopMonitoring(): void;
  
  // Event fired when speech starts
  onSpeechStart: (callback: () => void) => void;
  
  // Event fired when speech ends
  onSpeechEnd: (callback: () => void) => void;
  
  // Get current audio level (0-100)
  getAudioLevel(): number;
  
  // Configure silence threshold (ms)
  setSilenceThreshold(ms: number): void;
  
  // Mark filler word detected (for intelligent pause handling)
  markFillerWord(): void;
}

// ============================================================================
// Intent Parsing Types
// ============================================================================

export interface IntentParser {
  // Parse transcription into structured command
  parseIntent(transcription: string, context: ConversationContext): Promise<ParsedIntent>;
  
  // Validate if command is executable
  validateIntent(intent: ParsedIntent): ValidationResult;
  
  // Extract entities (pet names, dates, amounts, etc.)
  extractEntities(transcription: string): Entity[];
}

export interface ParsedIntent {
  intentId: string;
  action: CommandAction;
  target: string;
  parameters: Record<string, any>;
  confidence: number;
  requiresConfirmation: boolean;
  priority: "low" | "normal" | "high" | "urgent";
  entities: Entity[];
  ambiguities: string[];
}

export enum CommandAction {
  NAVIGATE = "navigate",
  LOG_DATA = "log_data",
  QUERY = "query",
  SCHEDULE = "schedule",
  CANCEL = "cancel",
  UPDATE = "update",
  BULK_ACTION = "bulk_action",
  HELP = "help"
}

export interface Entity {
  type: EntityType;
  value: string;
  confidence: number;
  resolvedValue: any;
}

export enum EntityType {
  PET_NAME = "pet_name",
  PET_TYPE = "pet_type",
  DATE = "date",
  TIME = "time",
  AMOUNT = "amount",
  UNIT = "unit",
  MEDICATION_NAME = "medication",
  ACTIVITY_TYPE = "activity",
  LOCATION = "location"
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Context Management Types
// ============================================================================

export interface ContextManager {
  // Update context with new intent
  updateContext(intent: ParsedIntent): void;
  
  // Get current conversation context
  getContext(): ConversationContext;
  
  // Set active pet for subsequent commands
  setActivePet(petName: string): void;
  
  // Get active pet
  getActivePet(): string | null;
  
  // Add entity to recent entities
  addEntity(entity: Entity): void;
  
  // Clear conversation history
  clearContext(): void;
  
  // Get conversation turn count
  getTurnCount(): number;
}

export interface ConversationContext {
  previousIntents: ParsedIntent[];
  activePet: string | null;
  currentPage: string;
  recentEntities: Entity[];
  // Requirement 6.6: Track summarized query results for "show more details" follow-up
  lastSummarizedQuery?: {
    queryType: string;  // 'appointments', 'medications', 'feeding', 'health_records'
    fullData: any;      // Complete result set
    petName: string;    // Pet the query was for
  };
}

// ============================================================================
// Command Routing Types
// ============================================================================

export interface CommandRouter {
  // Register command handler
  registerHandler(action: CommandAction, handler: CommandHandler): void;
  
  // Execute command
  executeCommand(intent: ParsedIntent): Promise<CommandResult>;
  
  // Get available commands for context
  getAvailableCommands(context: ConversationContext): CommandInfo[];
}

export interface CommandHandler {
  // Execute the command
  execute(intent: ParsedIntent, context: ConversationContext): Promise<CommandResult>;
  
  // Validate command can be executed
  canExecute(intent: ParsedIntent): boolean;
  
  // Get required parameters
  getRequiredParameters(): string[];
}

export interface CommandResult {
  success: boolean;
  data: any;
  message: string;
  visualComponent: string | null;
  requiresFollowUp: boolean;
  followUpPrompt: string | null;
}

export interface CommandInfo {
  action: CommandAction;
  description: string;
  examples: string[];
}

// ============================================================================
// Dashboard Actions Types
// ============================================================================

export interface DashboardActions {
  // Navigation actions
  navigateTo(page: string, params?: Record<string, any>): Promise<void>;
  goBack(): Promise<void>;
  
  // Data entry actions
  logFeeding(petId: string, data: FeedingData): Promise<void>;
  logMedication(petId: string, data: MedicationData): Promise<void>;
  logWeight(petId: string, weight: number, unit: string): Promise<void>;
  logActivity(petId: string, activity: ActivityData): Promise<void>;
  
  // Query actions
  getHealthRecords(petId: string): Promise<HealthRecord[]>;
  getAppointments(petId: string): Promise<Appointment[]>;
  getMedications(petId: string, date?: Date): Promise<Medication[]>;
  getFeedingHistory(petId: string, days?: number): Promise<FeedingLog[]>;
  
  // Scheduling actions
  createAppointment(petId: string, appointment: AppointmentData): Promise<Appointment>;
  cancelAppointment(appointmentId: string): Promise<void>;
  
  // Bulk actions
  logFeedingForAll(data: FeedingData): Promise<void>;
  getHealthSummaryForAll(): Promise<HealthSummary[]>;
}

export interface FeedingData {
  amount: number;
  unit: string;
  foodType: string;
  time: Date;
}

export interface MedicationData {
  name: string;
  dosage: string;
  time: Date;
  notes?: string;
}

export interface ActivityData {
  type: string;
  duration?: number;
  notes?: string;
  time: Date;
}

export interface HealthRecord {
  id: string;
  petId: string;
  type: string;
  date: Date;
  data: any;
}

export interface Appointment {
  id: string;
  petId: string;
  date: Date;
  time: string;
  clinic: string;
  reason: string;
}

export interface Medication {
  id: string;
  petId: string;
  name: string;
  dosage: string;
  schedule: string;
}

export interface FeedingLog {
  id: string;
  petId: string;
  amount: number;
  unit: string;
  foodType: string;
  time: Date;
}

export interface HealthSummary {
  petId: string;
  petName: string;
  healthScore: number;
  lastCheckup: Date;
  upcomingAppointments: number;
}

export interface AppointmentData {
  date: Date;
  time: string;
  clinic: string;
  reason: string;
}

// ============================================================================
// Response Composition Types
// ============================================================================

export interface ResponseComposer {
  // Compose response from command result
  composeResponse(result: CommandResult, context: ConversationContext): Response;
  
  // Compose error response
  composeErrorResponse(error: Error, context: ConversationContext): Response;
  
  // Compose confirmation request
  composeConfirmation(intent: ParsedIntent): Response;
  
  // Compose clarification question
  composeClarification(ambiguousIntent: ParsedIntent): Response;
}

export interface Response {
  text: string;
  displayText: string;
  visualData: any;
  audioUrl: string | null;
  priority: "low" | "normal" | "high";
}

// ============================================================================
// TTS Engine Types
// ============================================================================

export interface TTSEngine {
  // Generate speech from text
  synthesize(text: string, options?: TTSOptions): Promise<AudioBuffer>;
  
  // Stream speech for immediate playback
  synthesizeStream(text: string, options?: TTSOptions): Promise<ReadableStream>;
  
  // Get current month's character usage
  getUsageStats(): Promise<UsageStats>;
  
  // Check if text is cached
  isCached(text: string): boolean;
  
  // Preload common responses
  preloadResponses(responses: string[]): Promise<void>;
}

export interface TTSOptions {
  voice: string;
  stability: number;
  similarityBoost: number;
  useCache: boolean;
}

export interface UsageStats {
  charactersUsed: number;
  charactersLimit: number;
  percentageUsed: number;
  resetDate: Date;
}

// ============================================================================
// Response Cache Types
// ============================================================================

export interface ResponseCache {
  // Store audio for text
  store(text: string, audio: AudioBuffer): Promise<void>;
  
  // Retrieve cached audio
  get(text: string): Promise<AudioBuffer | null>;
  
  // Check if text is cached
  has(text: string): boolean;
  
  // Get cache statistics
  getStats(): CacheStats;
  
  // Clear old/unused entries
  evictLRU(count: number): Promise<void>;
  
  // Preload common responses
  preload(responses: Array<{text: string, audio: AudioBuffer}>): Promise<void>;
}

export interface CacheStats {
  entryCount: number;
  totalSize: number;
  hitRate: number;
  mostUsed: Array<{text: string, hitCount: number}>;
}

export interface CacheEntry {
  text: string;
  textHash: string;
  audioBuffer: AudioBuffer;
  audioUrl: string;
  createdAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  characterCount: number;
}

// ============================================================================
// Audio Feedback Types
// ============================================================================

export interface AudioFeedbackController {
  // Show listening indicator
  showListening(): void;
  
  // Show processing indicator
  showProcessing(): void;
  
  // Show speaking indicator with waveform
  showSpeaking(audioStream: MediaStream): void;
  
  // Show idle state
  showIdle(): void;
  
  // Update voice waveform visualization
  updateWaveform(audioData: Float32Array): void;
  
  // Play feedback sound (chime, error, etc.)
  playFeedbackSound(sound: FeedbackSound): void;
  
  // Animate JoJo avatar
  animateAvatar(state: AvatarState): void;
}

export enum FeedbackSound {
  WAKE_WORD_DETECTED = "chime",
  COMMAND_ACCEPTED = "success",
  ERROR = "error",
  PROCESSING = "thinking"
}

export enum AvatarState {
  IDLE = "idle",
  LISTENING = "listening",
  THINKING = "thinking",
  SPEAKING = "speaking"
}

// ============================================================================
// Proactive Alert Types
// ============================================================================

export interface ProactiveAlertManager {
  // Schedule proactive alert
  scheduleAlert(alert: ProactiveAlert): void;
  
  // Cancel scheduled alert
  cancelAlert(alertId: string): void;
  
  // Trigger alert immediately
  triggerAlert(alert: ProactiveAlert): Promise<void>;
  
  // Get pending alerts
  getPendingAlerts(): ProactiveAlert[];
  
  // Mark alert as acknowledged
  acknowledgeAlert(alertId: string): void;
}

export interface ProactiveAlert {
  id: string;
  type: AlertType;
  petId: string;
  message: string;
  scheduledTime: Date;
  priority: "low" | "normal" | "high";
  visualData: any;
  requiresAcknowledgment: boolean;
}

export enum AlertType {
  MEDICATION_REMINDER = "medication",
  APPOINTMENT_REMINDER = "appointment",
  FEEDING_OVERDUE = "feeding",
  HEALTH_CHECK = "health"
}

// ============================================================================
// Voice Session Types
// ============================================================================

export interface VoiceSession {
  sessionId: string;
  startTime: Date;
  endTime: Date | null;
  isActive: boolean;
  handsFreeMode: boolean;
  conversationTurns: ConversationTurn[];
  context: ConversationContext;
}

export interface ConversationTurn {
  turnId: string;
  timestamp: Date;
  userInput: string;
  transcriptionConfidence: number;
  parsedIntent: ParsedIntent;
  commandResult: CommandResult;
  response: Response;
  audioPlayed: boolean;
}

// ============================================================================
// Usage Tracking Types
// ============================================================================

export interface UsageTracking {
  month: string;
  charactersUsed: number;
  apiCallCount: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  errorCount: number;
  lastUpdated: Date;
}
