/**
 * Bulk Action Command Handler
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Handles voice commands for bulk operations on multiple pets
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */

import api from '../../../lib/api';
import {
  CommandHandler,
  ParsedIntent,
  ConversationContext,
  CommandResult,
  FeedingData,
} from '../types';
import { dashboardActions } from '../dashboardActions';

/**
 * Pet type for filtering
 */
type PetType = 'dog' | 'cat' | 'bird' | 'fish';

/**
 * Pet interface matching API response
 */
interface Pet {
  id: number;
  name: string;
  species: string;
  breed?: string;
  age?: number;
}

export class BulkActionHandler implements CommandHandler {
  /**
   * Execute bulk action command
   */
  async execute(
    intent: ParsedIntent,
    context: ConversationContext
  ): Promise<CommandResult> {
    const { target, parameters } = intent;

    try {
      // Determine pet filter
      const petFilter = parameters.petFilter || 'all'; // 'all', 'dogs', 'cats', 'birds', 'fish'
      
      switch (target) {
        case 'feeding':
        case 'log_feeding':
          return await this.bulkLogFeeding(parameters, petFilter);
        
        case 'medication':
        case 'log_medication':
          return await this.bulkLogMedication(parameters, petFilter);
        
        case 'weight':
        case 'log_weight':
          return await this.bulkLogWeight(parameters, petFilter);
        
        case 'activity':
        case 'log_activity':
          return await this.bulkLogActivity(parameters, petFilter);
        
        case 'health_summary':
        case 'health':
          return await this.bulkHealthSummary(petFilter);
        
        default:
          return {
            success: false,
            data: null,
            message: `I don't know how to perform bulk action for "${target}"`,
            visualComponent: null,
            requiresFollowUp: false,
            followUpPrompt: null,
          };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to perform bulk action: ${error instanceof Error ? error.message : 'Unknown error'}`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }
  }

  /**
   * Get filtered pets based on pet type
   * Requirements: 19.3, 19.5
   */
  private async getFilteredPets(petFilter: string): Promise<Pet[]> {
    const response = await api.getPets();
    
    if (response.error) {
      throw new Error(`Failed to get pets: ${response.error}`);
    }

    const allPets: Pet[] = response.data || [];

    // If filter is 'all', return all pets
    if (petFilter === 'all') {
      return allPets;
    }

    // Normalize filter (remove 's' if present, e.g., 'dogs' -> 'dog')
    const normalizedFilter = petFilter.toLowerCase().replace(/s$/, '');

    // Filter pets by species
    return allPets.filter((pet) => {
      const species = pet.species.toLowerCase();
      return species === normalizedFilter || species.startsWith(normalizedFilter);
    });
  }

  /**
   * Generate confirmation prompt for bulk actions
   * Requirements: 19.4
   */
  private generateConfirmationPrompt(
    petCount: number,
    petFilter: string,
    action: string
  ): string {
    const filterText = petFilter === 'all' ? 'all pets' : `all ${petFilter}`;
    return `This will affect ${petCount} ${petCount === 1 ? 'pet' : 'pets'} (${filterText}). Should I proceed?`;
  }

  /**
   * Log feeding for multiple pets
   * Requirements: 19.1, 19.3, 19.4
   */
  private async bulkLogFeeding(
    parameters: Record<string, any>,
    petFilter: string
  ): Promise<CommandResult> {
    const { amount, unit, foodType, confirmed } = parameters;

    // Check for missing required fields
    const missingFields: string[] = [];
    if (!amount) missingFields.push('amount');
    if (!foodType) missingFields.push('food type');

    if (missingFields.length > 0) {
      return {
        success: false,
        data: { missingFields },
        message: `I need more information to log feeding for all pets`,
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: `What ${missingFields[0]} should I use?`,
      };
    }

    // Get filtered pets
    const pets = await this.getFilteredPets(petFilter);

    if (pets.length === 0) {
      const filterText = petFilter === 'all' ? 'pets' : petFilter;
      return {
        success: false,
        data: null,
        message: `No ${filterText} found to log feeding for`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }

    // Request confirmation if not already confirmed
    if (!confirmed) {
      return {
        success: false,
        data: {
          petCount: pets.length,
          petFilter,
          amount,
          unit: unit || 'cups',
          foodType,
          requiresConfirmation: true,
        },
        message: this.generateConfirmationPrompt(pets.length, petFilter, 'log feeding'),
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: 'Say "yes" to confirm or "no" to cancel',
      };
    }

    // Log feeding for each pet
    const feedingData: FeedingData = {
      amount: parseFloat(amount),
      unit: unit || 'cups',
      foodType,
      time: new Date(),
    };

    const results = await Promise.allSettled(
      pets.map((pet) => dashboardActions.logFeeding(pet.id.toString(), feedingData))
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failureCount = results.filter((r) => r.status === 'rejected').length;

    const filterText = petFilter === 'all' ? 'all pets' : `all ${petFilter}`;

    if (failureCount === 0) {
      return {
        success: true,
        data: {
          affectedPets: pets.map((p) => p.name),
          successCount,
          amount,
          unit: unit || 'cups',
          foodType,
          petFilter,
        },
        message: `Successfully logged feeding for ${filterText} (${successCount} ${successCount === 1 ? 'pet' : 'pets'}): ${amount} ${unit || 'cups'} of ${foodType}`,
        visualComponent: 'BulkFeedingConfirmation',
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    } else {
      return {
        success: true,
        data: {
          affectedPets: pets.map((p) => p.name),
          successCount,
          failureCount,
          amount,
          unit: unit || 'cups',
          foodType,
          petFilter,
        },
        message: `Logged feeding for ${successCount} ${successCount === 1 ? 'pet' : 'pets'}, but ${failureCount} failed`,
        visualComponent: 'BulkFeedingConfirmation',
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }
  }

  /**
   * Log medication for multiple pets
   * Requirements: 19.1, 19.3, 19.4
   */
  private async bulkLogMedication(
    parameters: Record<string, any>,
    petFilter: string
  ): Promise<CommandResult> {
    const { medicationName, dosage, confirmed } = parameters;

    // Check for missing required fields
    const missingFields: string[] = [];
    if (!medicationName) missingFields.push('medication name');
    if (!dosage) missingFields.push('dosage');

    if (missingFields.length > 0) {
      return {
        success: false,
        data: { missingFields },
        message: `I need more information to log medication for all pets`,
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: `What ${missingFields[0]} should I use?`,
      };
    }

    // Get filtered pets
    const pets = await this.getFilteredPets(petFilter);

    if (pets.length === 0) {
      const filterText = petFilter === 'all' ? 'pets' : petFilter;
      return {
        success: false,
        data: null,
        message: `No ${filterText} found to log medication for`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }

    // Request confirmation if not already confirmed
    if (!confirmed) {
      return {
        success: false,
        data: {
          petCount: pets.length,
          petFilter,
          medicationName,
          dosage,
          requiresConfirmation: true,
        },
        message: this.generateConfirmationPrompt(pets.length, petFilter, 'log medication'),
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: 'Say "yes" to confirm or "no" to cancel',
      };
    }

    // Log medication for each pet
    const results = await Promise.allSettled(
      pets.map((pet) =>
        dashboardActions.logMedication(pet.id.toString(), {
          name: medicationName,
          dosage,
          time: new Date(),
        })
      )
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failureCount = results.filter((r) => r.status === 'rejected').length;

    const filterText = petFilter === 'all' ? 'all pets' : `all ${petFilter}`;

    if (failureCount === 0) {
      return {
        success: true,
        data: {
          affectedPets: pets.map((p) => p.name),
          successCount,
          medicationName,
          dosage,
          petFilter,
        },
        message: `Successfully logged ${medicationName} (${dosage}) for ${filterText} (${successCount} ${successCount === 1 ? 'pet' : 'pets'})`,
        visualComponent: 'BulkMedicationConfirmation',
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    } else {
      return {
        success: true,
        data: {
          affectedPets: pets.map((p) => p.name),
          successCount,
          failureCount,
          medicationName,
          dosage,
          petFilter,
        },
        message: `Logged medication for ${successCount} ${successCount === 1 ? 'pet' : 'pets'}, but ${failureCount} failed`,
        visualComponent: 'BulkMedicationConfirmation',
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }
  }

  /**
   * Log weight for multiple pets
   * Requirements: 19.1, 19.3, 19.4
   */
  private async bulkLogWeight(
    parameters: Record<string, any>,
    petFilter: string
  ): Promise<CommandResult> {
    const { weight, unit, confirmed } = parameters;

    // Check for missing required fields
    const missingFields: string[] = [];
    if (!weight) missingFields.push('weight');

    if (missingFields.length > 0) {
      return {
        success: false,
        data: { missingFields },
        message: `I need more information to log weight for all pets`,
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: `What ${missingFields[0]} should I use?`,
      };
    }

    // Get filtered pets
    const pets = await this.getFilteredPets(petFilter);

    if (pets.length === 0) {
      const filterText = petFilter === 'all' ? 'pets' : petFilter;
      return {
        success: false,
        data: null,
        message: `No ${filterText} found to log weight for`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }

    // Request confirmation if not already confirmed
    if (!confirmed) {
      return {
        success: false,
        data: {
          petCount: pets.length,
          petFilter,
          weight,
          unit: unit || 'kg',
          requiresConfirmation: true,
        },
        message: this.generateConfirmationPrompt(pets.length, petFilter, 'log weight'),
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: 'Say "yes" to confirm or "no" to cancel',
      };
    }

    // Log weight for each pet
    const results = await Promise.allSettled(
      pets.map((pet) =>
        dashboardActions.logWeight(pet.id.toString(), parseFloat(weight), unit || 'kg')
      )
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failureCount = results.filter((r) => r.status === 'rejected').length;

    const filterText = petFilter === 'all' ? 'all pets' : `all ${petFilter}`;

    if (failureCount === 0) {
      return {
        success: true,
        data: {
          affectedPets: pets.map((p) => p.name),
          successCount,
          weight,
          unit: unit || 'kg',
          petFilter,
        },
        message: `Successfully logged weight for ${filterText} (${successCount} ${successCount === 1 ? 'pet' : 'pets'}): ${weight} ${unit || 'kg'}`,
        visualComponent: 'BulkWeightConfirmation',
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    } else {
      return {
        success: true,
        data: {
          affectedPets: pets.map((p) => p.name),
          successCount,
          failureCount,
          weight,
          unit: unit || 'kg',
          petFilter,
        },
        message: `Logged weight for ${successCount} ${successCount === 1 ? 'pet' : 'pets'}, but ${failureCount} failed`,
        visualComponent: 'BulkWeightConfirmation',
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }
  }

  /**
   * Log activity for multiple pets
   * Requirements: 19.1, 19.3, 19.4
   */
  private async bulkLogActivity(
    parameters: Record<string, any>,
    petFilter: string
  ): Promise<CommandResult> {
    const { activityType, duration, confirmed } = parameters;

    // Check for missing required fields
    const missingFields: string[] = [];
    if (!activityType) missingFields.push('activity type');

    if (missingFields.length > 0) {
      return {
        success: false,
        data: { missingFields },
        message: `I need more information to log activity for all pets`,
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: `What ${missingFields[0]} should I use?`,
      };
    }

    // Get filtered pets
    const pets = await this.getFilteredPets(petFilter);

    if (pets.length === 0) {
      const filterText = petFilter === 'all' ? 'pets' : petFilter;
      return {
        success: false,
        data: null,
        message: `No ${filterText} found to log activity for`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }

    // Request confirmation if not already confirmed
    if (!confirmed) {
      return {
        success: false,
        data: {
          petCount: pets.length,
          petFilter,
          activityType,
          duration,
          requiresConfirmation: true,
        },
        message: this.generateConfirmationPrompt(pets.length, petFilter, 'log activity'),
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: 'Say "yes" to confirm or "no" to cancel',
      };
    }

    // Log activity for each pet
    const results = await Promise.allSettled(
      pets.map((pet) =>
        dashboardActions.logActivity(pet.id.toString(), {
          type: activityType,
          duration: duration ? parseInt(duration) : undefined,
          time: new Date(),
        })
      )
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failureCount = results.filter((r) => r.status === 'rejected').length;

    const filterText = petFilter === 'all' ? 'all pets' : `all ${petFilter}`;
    const durationText = duration ? ` for ${duration} minutes` : '';

    if (failureCount === 0) {
      return {
        success: true,
        data: {
          affectedPets: pets.map((p) => p.name),
          successCount,
          activityType,
          duration,
          petFilter,
        },
        message: `Successfully logged ${activityType}${durationText} for ${filterText} (${successCount} ${successCount === 1 ? 'pet' : 'pets'})`,
        visualComponent: 'BulkActivityConfirmation',
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    } else {
      return {
        success: true,
        data: {
          affectedPets: pets.map((p) => p.name),
          successCount,
          failureCount,
          activityType,
          duration,
          petFilter,
        },
        message: `Logged activity for ${successCount} ${successCount === 1 ? 'pet' : 'pets'}, but ${failureCount} failed`,
        visualComponent: 'BulkActivityConfirmation',
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }
  }

  /**
   * Get health summary for multiple pets
   * Requirements: 19.2, 19.3, 19.5
   */
  private async bulkHealthSummary(petFilter: string): Promise<CommandResult> {
    // Get filtered pets
    const pets = await this.getFilteredPets(petFilter);

    if (pets.length === 0) {
      const filterText = petFilter === 'all' ? 'pets' : petFilter;
      return {
        success: false,
        data: null,
        message: `No ${filterText} found to get health summary for`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }

    // Get health summary for each pet
    const healthSummaries = await Promise.all(
      pets.map(async (pet) => {
        try {
          const summaryResponse = await api.getHealthSummary(pet.id);
          const summary = summaryResponse.data || {};

          return {
            petId: pet.id.toString(),
            petName: pet.name,
            healthScore: summary.health_score || 0,
            lastCheckup: summary.last_checkup ? new Date(summary.last_checkup) : new Date(),
            upcomingAppointments: summary.upcoming_appointments || 0,
          };
        } catch (error) {
          // Return default values if health summary fails for a pet
          return {
            petId: pet.id.toString(),
            petName: pet.name,
            healthScore: 0,
            lastCheckup: new Date(),
            upcomingAppointments: 0,
          };
        }
      })
    );

    const filterText = petFilter === 'all' ? 'all pets' : `all ${petFilter}`;
    const avgHealthScore = healthSummaries.length > 0
      ? Math.round(
          healthSummaries.reduce((sum, pet) => sum + pet.healthScore, 0) / healthSummaries.length
        )
      : 0;

    return {
      success: true,
      data: { healthSummaries, petFilter },
      message: `Health summary for ${filterText}: Average health score is ${avgHealthScore}. ${healthSummaries.length} ${healthSummaries.length === 1 ? 'pet' : 'pets'} total.`,
      visualComponent: 'BulkHealthSummary',
      requiresFollowUp: false,
      followUpPrompt: null,
    };
  }

  /**
   * Check if command can be executed
   */
  canExecute(intent: ParsedIntent): boolean {
    return !!intent.target;
  }

  /**
   * Get required parameters
   */
  getRequiredParameters(): string[] {
    return ['target'];
  }
}
