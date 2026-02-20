/**
 * Comparison Service
 * Provides multi-pet comparison functionality for health scores, feeding patterns, and medication schedules
 * Feature: additional-amazing-features
 * Task: 9.1 Create ComparisonService
 */

import { HealthScore } from './HealthScoreCalculator';
import { PetComparison, FeedingData, MedicationEvent } from '../types/features';

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  dateOfBirth?: Date;
}

export interface FeedingLog {
  petId: string;
  date: Date;
  amount: number;
  [key: string]: any;
}

export interface Medication {
  petId: string;
  name: string;
  schedule: Date[];
  completed?: boolean;
}

export class ComparisonService {
  /**
   * Compare health scores for multiple pets
   * Supports up to 10 pets simultaneously
   * Requirements: 6.1, 6.2, 6.5, 6.6
   */
  compareHealthScores(
    pets: Pet[],
    healthScores: Map<string, HealthScore>
  ): PetComparison[] {
    // Validate input
    if (!pets || pets.length === 0) {
      return [];
    }

    // Limit to 10 pets
    const petsToCompare = pets.slice(0, 10);

    const comparisons: PetComparison[] = [];

    for (const pet of petsToCompare) {
      const healthScore = healthScores.get(pet.id);
      
      // Create comparison entry even if some data is missing
      const comparison: PetComparison = {
        petId: pet.id,
        petName: pet.name,
        healthScore: healthScore?.overall ?? 50, // Default to 50 if no score
        lastFed: new Date(), // Placeholder - would be fetched from feeding logs
        nextMedication: null, // Placeholder - would be fetched from medication schedule
        upcomingAppointments: 0, // Placeholder - would be fetched from appointments
      };

      comparisons.push(comparison);
    }

    return comparisons;
  }

  /**
   * Compare feeding patterns across multiple pets with date range support
   * Requirements: 6.3
   */
  compareFeedingPatterns(
    pets: Pet[],
    feedingLogs: FeedingLog[],
    days: number = 30
  ): FeedingData[] {
    // Validate input
    if (!pets || pets.length === 0) {
      return [];
    }

    // Limit to 10 pets
    const petsToCompare = pets.slice(0, 10);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const feedingData: FeedingData[] = [];

    for (const pet of petsToCompare) {
      // Filter logs for this pet within date range
      const petLogs = feedingLogs.filter(log => {
        const logDate = new Date(log.date);
        return log.petId === pet.id && 
               logDate >= startDate && 
               logDate <= endDate;
      });

      // Group logs by date
      const dailyFeedingsMap = new Map<string, { count: number; totalAmount: number }>();

      for (const log of petLogs) {
        const dateKey = new Date(log.date).toISOString().split('T')[0];
        const existing = dailyFeedingsMap.get(dateKey) || { count: 0, totalAmount: 0 };
        
        dailyFeedingsMap.set(dateKey, {
          count: existing.count + 1,
          totalAmount: existing.totalAmount + (log.amount || 0),
        });
      }

      // Convert map to array
      const dailyFeedings = Array.from(dailyFeedingsMap.entries()).map(([dateStr, data]) => ({
        date: new Date(dateStr),
        count: data.count,
        totalAmount: data.totalAmount,
      }));

      feedingData.push({
        petId: pet.id,
        petName: pet.name,
        dailyFeedings,
      });
    }

    return feedingData;
  }

  /**
   * Get unified medication calendar for all pets
   * Requirements: 6.4
   */
  getMedicationCalendar(
    pets: Pet[],
    medications: Medication[],
    startDate: Date,
    endDate: Date
  ): MedicationEvent[] {
    // Validate input
    if (!pets || pets.length === 0) {
      return [];
    }

    // Limit to 10 pets
    const petsToCompare = pets.slice(0, 10);

    const events: MedicationEvent[] = [];

    for (const pet of petsToCompare) {
      // Filter medications for this pet
      const petMedications = medications.filter(med => med.petId === pet.id);

      for (const medication of petMedications) {
        // Filter schedule dates within range
        const scheduleDates = medication.schedule.filter(date => {
          const scheduleDate = new Date(date);
          return scheduleDate >= startDate && scheduleDate <= endDate;
        });

        // Create event for each scheduled date
        for (const scheduleDate of scheduleDates) {
          events.push({
            petId: pet.id,
            petName: pet.name,
            medicationName: medication.name,
            time: new Date(scheduleDate),
            completed: medication.completed ?? false,
          });
        }
      }
    }

    // Sort events by time
    events.sort((a, b) => a.time.getTime() - b.time.getTime());

    return events;
  }

  /**
   * Get quick switcher data for pet navigation
   * Requirements: 6.5
   */
  getQuickSwitcherData(pets: Pet[]): Pet[] {
    // Validate input
    if (!pets || pets.length === 0) {
      return [];
    }

    // Limit to 10 pets and return basic pet info for quick switching
    return pets.slice(0, 10);
  }
}

// Export singleton instance
export const comparisonService = new ComparisonService();
