/**
 * Feature Components with Error Boundaries
 * Exports all feature components wrapped with error boundaries for graceful degradation
 */

import { ErrorBoundary } from '../ErrorBoundary';
import { HealthScoreDashboard } from '../HealthScoreDashboard';
import { ExpenseTracker } from '../ExpenseTracker';
import { MultiPetDashboard } from '../MultiPetDashboard';
import { MilestoneTracker } from '../milestones/MilestoneTracker';
import { EmergencySOS } from '../emergency/EmergencySOS';
import { DailyTip } from '../DailyTip';
import { ArticleList } from '../ArticleList';
import { ProfileSharing } from '../ProfileSharing';
import { NotificationCenter } from '../notifications/NotificationCenter';
import React from 'react';

/**
 * Health Score Dashboard with Error Boundary
 */
export const SafeHealthScoreDashboard: React.FC<{ petId: string }> = (props) => (
  <ErrorBoundary featureName="Health Score Dashboard">
    <HealthScoreDashboard {...props} />
  </ErrorBoundary>
);

/**
 * Expense Tracker with Error Boundary
 */
export const SafeExpenseTracker: React.FC<{ petId: string; userId: string }> = (props) => (
  <ErrorBoundary featureName="Expense Tracker">
    <ExpenseTracker {...props} />
  </ErrorBoundary>
);

/**
 * Multi-Pet Dashboard with Error Boundary
 */
export const SafeMultiPetDashboard: React.FC<{ userId: string; pets: any[] }> = (props) => (
  <ErrorBoundary featureName="Multi-Pet Comparison Dashboard">
    <MultiPetDashboard {...props} />
  </ErrorBoundary>
);

/**
 * Milestone Tracker with Error Boundary
 */
export const SafeMilestoneTracker: React.FC<{ petId: string }> = (props) => (
  <ErrorBoundary featureName="Milestone Tracker">
    <MilestoneTracker {...props} />
  </ErrorBoundary>
);

/**
 * Emergency SOS with Error Boundary
 */
export const SafeEmergencySOS: React.FC<{ petId: string; onClose: () => void }> = (props) => (
  <ErrorBoundary featureName="Emergency SOS">
    <EmergencySOS {...props} />
  </ErrorBoundary>
);

/**
 * Daily Tip with Error Boundary
 */
export const SafeDailyTip: React.FC<{ petType: string; breed?: string }> = (props) => (
  <ErrorBoundary featureName="Daily Tips">
    <DailyTip {...props} />
  </ErrorBoundary>
);

/**
 * Article List with Error Boundary
 */
export const SafeArticleList: React.FC<{ category?: string; petType?: string }> = (props) => (
  <ErrorBoundary featureName="Pet Care Articles">
    <ArticleList {...props} />
  </ErrorBoundary>
);

/**
 * Profile Sharing with Error Boundary
 */
export const SafeProfileSharing: React.FC<{ petId: string }> = (props) => (
  <ErrorBoundary featureName="Profile Sharing">
    <ProfileSharing {...props} />
  </ErrorBoundary>
);

/**
 * Notification Center with Error Boundary
 */
export const SafeNotificationCenter: React.FC<{ userId: string }> = (props) => (
  <ErrorBoundary featureName="Notification Center">
    <NotificationCenter {...props} />
  </ErrorBoundary>
);
