/**
 * Milestone Detector Service
 * Feature: additional-amazing-features
 * Task: 5.1 Create MilestoneDetector service
 * 
 * Detects and records pet milestones automatically based on pet data and health logs.
 * Generates shareable cards and manages milestone storage in IndexedDB.
 */

import { databaseManager } from '../lib/storage/database';
import { STORE_NAMES } from '../lib/storage/constants';
import type { 
  Milestone, 
  MilestoneRecord, 
  MilestoneType, 
  ShareableCard 
} from '../types/features';

// Badge identifiers for different milestone types
const MILESTONE_BADGES = {
  first_vet_visit: '🏥',
  age_anniversary: '🎂',
  health_log_milestone: '📊',
  weight_goal: '⚖️',
  training_achievement: '🏆',
} as const;

// Age anniversary milestones (in months)
const AGE_MILESTONES = [1, 6, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120]; // 1 month, 6 months, 1 year, then yearly

// Health log count milestones
const HEALTH_LOG_MILESTONES = [10, 50, 100, 500];

/**
 * Pet interface for milestone detection
 */
interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  dateOfBirth?: Date;
  photo?: string;
}

/**
 * Health log interface for milestone detection
 */
interface HealthLog {
  id: string;
  petId: string;
  date: Date;
  type: string;
}

/**
 * Medical record interface for milestone detection
 */
interface MedicalRecord {
  id: string;
  petId: string;
  date: Date;
  type: string;
  description: string;
}

/**
 * MilestoneDetector Service Class
 * Handles milestone detection, recording, and shareable card generation
 */
export class MilestoneDetector {
  /**
   * Detect all milestones for a pet
   * @param petId - The pet's ID
   * @param pet - Pet data
   * @param healthLogs - Array of health logs
   * @param medicalRecords - Array of medical records
   * @returns Array of newly detected milestones
   */
  async detectMilestones(
    petId: string,
    pet: Pet,
    healthLogs: HealthLog[],
    medicalRecords: MedicalRecord[]
  ): Promise<Milestone[]> {
    const newMilestones: Milestone[] = [];

    // Get existing milestones to avoid duplicates
    const existingMilestones = await this.getMilestones(petId);
    const existingTypes = new Set(existingMilestones.map(m => `${m.type}-${m.title}`));

    // Check for first vet visit
    const firstVetVisit = await this.checkFirstVetVisit(petId, medicalRecords, existingTypes);
    if (firstVetVisit) {
      newMilestones.push(firstVetVisit);
    }

    // Check for age anniversaries
    if (pet.dateOfBirth) {
      const ageAnniversaries = await this.checkAgeAnniversary(pet, existingTypes);
      newMilestones.push(...ageAnniversaries);
    }

    // Check for health log milestones
    const healthLogMilestones = await this.checkHealthLogCount(petId, healthLogs, existingTypes);
    newMilestones.push(...healthLogMilestones);

    // Store new milestones
    for (const milestone of newMilestones) {
      await this.recordMilestone(milestone);
    }

    return newMilestones;
  }

  /**
   * Check for first vet visit milestone
   * @param petId - The pet's ID
   * @param medicalRecords - Array of medical records
   * @param existingTypes - Set of existing milestone type-title combinations
   * @returns First vet visit milestone or null
   */
  async checkFirstVetVisit(
    petId: string,
    medicalRecords: MedicalRecord[],
    existingTypes: Set<string>
  ): Promise<Milestone | null> {
    const milestoneKey = 'first_vet_visit-First Vet Visit';
    
    // Check if milestone already exists
    if (existingTypes.has(milestoneKey)) {
      return null;
    }

    // Find first vet visit
    const vetVisits = medicalRecords
      .filter(record => record.type === 'vet_visit' || record.type === 'checkup')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (vetVisits.length === 0) {
      return null;
    }

    const firstVisit = vetVisits[0];
    
    return {
      id: this.generateId(),
      petId,
      type: 'first_vet_visit',
      title: 'First Vet Visit',
      description: 'Completed the first veterinary checkup!',
      achievedAt: new Date(firstVisit.date),
      badge: MILESTONE_BADGES.first_vet_visit,
      shared: false,
    };
  }

  /**
   * Check for age anniversary milestones
   * @param pet - Pet data
   * @param existingTypes - Set of existing milestone type-title combinations
   * @returns Array of age anniversary milestones
   */
  async checkAgeAnniversary(
    pet: Pet,
    existingTypes: Set<string>
  ): Promise<Milestone[]> {
    if (!pet.dateOfBirth) {
      return [];
    }

    const milestones: Milestone[] = [];
    const birthDate = new Date(pet.dateOfBirth);
    const now = new Date();
    const ageInMonths = this.calculateAgeInMonths(birthDate, now);

    for (const milestoneMonth of AGE_MILESTONES) {
      if (ageInMonths >= milestoneMonth) {
        const milestoneKey = `age_anniversary-${this.getAgeTitle(milestoneMonth)}`;
        
        // Check if milestone already exists
        if (existingTypes.has(milestoneKey)) {
          continue;
        }

        const achievedDate = new Date(birthDate);
        achievedDate.setMonth(achievedDate.getMonth() + milestoneMonth);

        milestones.push({
          id: this.generateId(),
          petId: pet.id,
          type: 'age_anniversary',
          title: this.getAgeTitle(milestoneMonth),
          description: `${pet.name} turned ${this.getAgeDescription(milestoneMonth)}!`,
          achievedAt: achievedDate,
          badge: MILESTONE_BADGES.age_anniversary,
          shared: false,
        });
      }
    }

    return milestones;
  }

  /**
   * Check for health log count milestones
   * @param petId - The pet's ID
   * @param healthLogs - Array of health logs
   * @param existingTypes - Set of existing milestone type-title combinations
   * @returns Array of health log milestones
   */
  async checkHealthLogCount(
    petId: string,
    healthLogs: HealthLog[],
    existingTypes: Set<string>
  ): Promise<Milestone[]> {
    const milestones: Milestone[] = [];
    const logCount = healthLogs.length;

    for (const milestoneCount of HEALTH_LOG_MILESTONES) {
      if (logCount >= milestoneCount) {
        const milestoneKey = `health_log_milestone-${milestoneCount} Health Logs`;
        
        // Check if milestone already exists
        if (existingTypes.has(milestoneKey)) {
          continue;
        }

        // Find the date when this milestone was achieved (the date of the Nth log)
        const sortedLogs = [...healthLogs].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        const achievedDate = sortedLogs[milestoneCount - 1]?.date || new Date();

        milestones.push({
          id: this.generateId(),
          petId,
          type: 'health_log_milestone',
          title: `${milestoneCount} Health Logs`,
          description: `Logged ${milestoneCount} health entries! Great job tracking your pet's health.`,
          achievedAt: new Date(achievedDate),
          badge: MILESTONE_BADGES.health_log_milestone,
          shared: false,
        });
      }
    }

    return milestones;
  }

  /**
   * Record a milestone in IndexedDB
   * @param milestone - The milestone to record
   */
  async recordMilestone(milestone: Milestone): Promise<void> {
    const record: MilestoneRecord = {
      id: milestone.id,
      petId: milestone.petId,
      type: milestone.type,
      title: milestone.title,
      description: milestone.description,
      achievedAt: milestone.achievedAt,
      badge: milestone.badge,
      sharedAt: milestone.shared ? new Date() : undefined,
      sharedPlatforms: [],
    };

    await databaseManager.add(STORE_NAMES.MILESTONES, record);
  }

  /**
   * Get all milestones for a pet
   * @param petId - The pet's ID
   * @returns Array of milestones
   */
  async getMilestones(petId: string): Promise<Milestone[]> {
    const records = await databaseManager.getByIndex<MilestoneRecord>(
      STORE_NAMES.MILESTONES,
      'petId',
      petId
    );

    return records.map(record => ({
      id: record.id,
      petId: record.petId,
      type: record.type,
      title: record.title,
      description: record.description,
      achievedAt: new Date(record.achievedAt),
      badge: record.badge,
      shared: record.sharedPlatforms.length > 0,
    }));
  }

  /**
   * Get milestones sorted by date (most recent first)
   * @param petId - The pet's ID
   * @returns Array of milestones sorted by achievedAt date
   */
  async getMilestonesSorted(petId: string): Promise<Milestone[]> {
    const milestones = await this.getMilestones(petId);
    return milestones.sort((a, b) => 
      new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
    );
  }

  /**
   * Generate a shareable card for a milestone
   * @param milestone - The milestone
   * @param pet - Pet data
   * @returns Shareable card data
   */
  async generateShareableCard(milestone: Milestone, pet: Pet): Promise<ShareableCard> {
    const hashtags = [
      '#PetMilestone',
      '#PetCare',
      `#${pet.species}Love`,
      '#PetParent',
    ];

    const text = `🎉 ${pet.name} achieved a milestone!\n\n${milestone.badge} ${milestone.title}\n${milestone.description}\n\nProudly tracking with PetPal! 🐾`;

    // In a real implementation, this would generate an actual image
    // For now, we'll use a placeholder URL
    const imageUrl = pet.photo || '/placeholder-pet.png';

    return {
      imageUrl,
      text,
      hashtags,
    };
  }

  /**
   * Mark a milestone as shared
   * @param milestoneId - The milestone ID
   * @param platform - The platform it was shared on
   */
  async markAsShared(milestoneId: string, platform: 'whatsapp' | 'facebook'): Promise<void> {
    const record = await databaseManager.get<MilestoneRecord>(
      STORE_NAMES.MILESTONES,
      milestoneId
    );

    if (record) {
      record.sharedAt = new Date();
      if (!record.sharedPlatforms.includes(platform)) {
        record.sharedPlatforms.push(platform);
      }
      await databaseManager.put(STORE_NAMES.MILESTONES, record);
    }
  }

  /**
   * Calculate age in months
   * @param birthDate - Date of birth
   * @param currentDate - Current date
   * @returns Age in months
   */
  private calculateAgeInMonths(birthDate: Date, currentDate: Date): number {
    const years = currentDate.getFullYear() - birthDate.getFullYear();
    const months = currentDate.getMonth() - birthDate.getMonth();
    return years * 12 + months;
  }

  /**
   * Get age title for milestone
   * @param months - Age in months
   * @returns Age title string
   */
  private getAgeTitle(months: number): string {
    if (months < 12) {
      return `${months} Month${months > 1 ? 's' : ''} Old`;
    }
    const years = Math.floor(months / 12);
    return `${years} Year${years > 1 ? 's' : ''} Old`;
  }

  /**
   * Get age description for milestone
   * @param months - Age in months
   * @returns Age description string
   */
  private getAgeDescription(months: number): string {
    if (months < 12) {
      return `${months} month${months > 1 ? 's' : ''} old`;
    }
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} old`;
  }

  /**
   * Generate a unique ID for a milestone
   * @returns Unique ID string
   */
  private generateId(): string {
    return `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const milestoneDetector = new MilestoneDetector();
