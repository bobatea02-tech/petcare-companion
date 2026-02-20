/**
 * Type definitions for Additional Amazing Features
 * Feature: additional-amazing-features
 * Task: 1. Set up shared infrastructure and data models
 */

// ============================================================================
// Health Score Types
// ============================================================================

export interface HealthScore {
  overall: number; // 0-100
  nutrition: number;
  exercise: number;
  medical: number;
  grooming: number;
  lastCalculated: Date;
  recommendations: string[];
}

export interface HealthScoreRecord {
  id: string;
  petId: string;
  overallScore: number;
  nutritionScore: number;
  exerciseScore: number;
  medicalScore: number;
  groomingScore: number;
  calculatedAt: Date;
  dataPoints: {
    nutritionLogs: number;
    exerciseLogs: number;
    medicalRecords: number;
    groomingLogs: number;
  };
  recommendations: string[];
}

export type HealthCategory = 'nutrition' | 'exercise' | 'medical' | 'grooming';

export interface HealthTrendDataPoint {
  date: Date;
  score: number;
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType = 
  | 'predictive' 
  | 'medication' 
  | 'vaccination' 
  | 'grooming' 
  | 'birthday';

export interface Notification {
  id: string;
  type: NotificationType;
  petId: string;
  petName: string;
  title: string;
  message: string;
  actionRequired: string;
  createdAt: Date;
  read: boolean;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  petId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionRequired: string;
  scheduledFor: Date;
  sentAt?: Date;
  readAt?: Date;
  dismissed: boolean;
}

export interface PushSubscriptionRecord {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
}

export interface PredictiveAlert {
  petId: string;
  reason: string;
  confidence: number; // 0-1
  suggestedAction: string;
}

// ============================================================================
// Milestone Types
// ============================================================================

export type MilestoneType = 
  | 'first_vet_visit'
  | 'age_anniversary'
  | 'health_log_milestone'
  | 'weight_goal'
  | 'training_achievement';

export interface Milestone {
  id: string;
  petId: string;
  type: MilestoneType;
  title: string;
  description: string;
  achievedAt: Date;
  badge: string; // badge icon identifier
  shared: boolean;
}

export interface MilestoneRecord {
  id: string;
  petId: string;
  type: MilestoneType;
  title: string;
  description: string;
  achievedAt: Date;
  badge: string;
  sharedAt?: Date;
  sharedPlatforms: string[];
}

export interface ShareableCard {
  imageUrl: string; // generated card image
  text: string; // share text
  hashtags: string[];
}

// ============================================================================
// Emergency Types
// ============================================================================

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: 'family' | 'friend' | 'vet';
  phone: string;
  email?: string;
}

export interface EmergencyContactRecord {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  createdAt: Date;
}

export interface EmergencySession {
  sessionId: string;
  petId: string;
  startedAt: Date;
  medicalSummary: MedicalSummary;
  nearbyVets: VetClinic[];
  checklist: ChecklistItem[];
}

export interface EmergencySessionRecord {
  id: string;
  petId: string;
  userId: string;
  startedAt: Date;
  endedAt?: Date;
  actionsToken: string[];
  vetContacted?: string;
}

export interface VetClinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance: number; // kilometers
  is24Hour: boolean;
  location: { lat: number; lng: number };
}

export interface MedicalSummary {
  petName: string;
  species: string;
  breed: string;
  age: string;
  allergies: string[];
  currentMedications: Array<{name: string; dosage: string}>;
  recentVetVisits: Array<{date: Date; reason: string}>;
  vaccinations: Array<{name: string; date: Date}>;
  emergencyNotes: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

// ============================================================================
// Content Types
// ============================================================================

export interface Tip {
  id: string;
  title: string;
  content: string;
  category: 'nutrition' | 'training' | 'health' | 'grooming';
  petTypes: string[]; // ['dog', 'cat', 'bird', 'fish']
  breeds?: string[];
  seasonal?: 'monsoon' | 'summer' | 'winter';
  indiaSpecific: boolean;
}

export interface TipRecord {
  id: string;
  title: string;
  content: string;
  category: string;
  petTypes: string[];
  breeds: string[];
  seasonal?: string;
  indiaSpecific: boolean;
  priority: number;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  petTypes: string[];
  tags: string[];
  readTime: number; // minutes
  bookmarked: boolean;
  publishedAt: Date;
}

export interface ArticleRecord {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  petTypes: string[];
  tags: string[];
  readTime: number;
  publishedAt: Date;
}

export interface BookmarkRecord {
  id: string;
  userId: string;
  articleId: string;
  createdAt: Date;
}

export interface ArticleFilters {
  category?: string;
  petType?: string;
  tags?: string[];
  indiaSpecific?: boolean;
}

// ============================================================================
// Expense Types
// ============================================================================

export type ExpenseCategory = 'food' | 'vet' | 'grooming' | 'toys' | 'other';

export interface Expense {
  id: string;
  petId: string;
  category: ExpenseCategory;
  amount: number; // in rupees
  date: Date;
  description: string;
  notes?: string;
}

export interface ExpenseRecord {
  id: string;
  petId: string;
  userId: string;
  category: ExpenseCategory;
  amount: number;
  currency: 'INR';
  date: Date;
  description: string;
  notes?: string;
  createdAt: Date;
}

export interface BudgetSetting {
  id: string;
  petId: string;
  userId: string;
  monthlyLimit: number;
  alertThreshold: number; // percentage (e.g., 80 for 80%)
  enabled: boolean;
}

export interface MonthlyReport {
  totalSpending: number;
  byCategory: Record<ExpenseCategory, number>;
  comparisonToPreviousMonth: number; // percentage change
  topExpenses: Expense[];
}

// ============================================================================
// Profile Sharing Types
// ============================================================================

export type ProfileSection = 
  | 'basic_info'
  | 'medical_history'
  | 'allergies'
  | 'emergency_contacts'
  | 'feeding_schedule'
  | 'medications';

export interface ShareableProfile {
  id: string;
  petId: string;
  qrCode: string; // data URL
  shareUrl: string;
  includedSections: ProfileSection[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface ShareableProfileRecord {
  id: string;
  petId: string;
  userId: string;
  qrCodeData: string;
  shareUrl: string;
  includedSections: ProfileSection[];
  createdAt: Date;
  expiresAt?: Date;
  accessCount: number;
  lastAccessedAt?: Date;
  revoked: boolean;
}

// ============================================================================
// Multi-Pet Comparison Types
// ============================================================================

export interface PetComparison {
  petId: string;
  petName: string;
  healthScore: number;
  lastFed: Date;
  nextMedication: Date | null;
  upcomingAppointments: number;
}

export interface FeedingData {
  petId: string;
  petName: string;
  dailyFeedings: Array<{
    date: Date;
    count: number;
    totalAmount: number;
  }>;
}

export interface MedicationEvent {
  petId: string;
  petName: string;
  medicationName: string;
  time: Date;
  completed: boolean;
}
