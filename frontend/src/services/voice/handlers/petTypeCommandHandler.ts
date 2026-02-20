/**
 * Pet Type Command Handler
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Handles pet-type-specific activity logging and command validation.
 * Supports dogs, cats, birds, and fish with appropriate activities for each.
 * 
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
 */

import {
  CommandHandler,
  ParsedIntent,
  ConversationContext,
  CommandResult,
} from '../types';
import { dashboardActions } from '../dashboardActions';
import api from '../../../lib/api';

/**
 * Pet type enumeration
 */
export enum PetType {
  DOG = 'dog',
  CAT = 'cat',
  BIRD = 'bird',
  FISH = 'fish',
}

/**
 * Pet-type-specific activity types
 */
export interface PetTypeActivities {
  [PetType.DOG]: 'walk' | 'training' | 'grooming';
  [PetType.CAT]: 'litter_box' | 'grooming';
  [PetType.BIRD]: 'cage_cleaning' | 'wing_clipping';
  [PetType.FISH]: 'water_change' | 'tank_maintenance';
}

/**
 * Activity metadata for each pet type
 */
interface ActivityMetadata {
  name: string;
  description: string;
  suggestedDuration?: number; // in minutes
  requiresNotes?: boolean;
}

/**
 * Pet Type Command Handler
 * Handles pet-type-specific activity logging and validation
 */
export class PetTypeCommandHandler implements CommandHandler {
  /**
   * Map of pet types to their supported activities
   */
  private readonly petTypeActivities: Record<PetType, ActivityMetadata[]> = {
    [PetType.DOG]: [
      {
        name: 'walk',
        description: 'Log a walk activity',
        suggestedDuration: 30,
        requiresNotes: false,
      },
      {
        name: 'training',
        description: 'Log a training session',
        suggestedDuration: 20,
        requiresNotes: true,
      },
      {
        name: 'grooming',
        description: 'Log grooming activity',
        suggestedDuration: 45,
        requiresNotes: false,
      },
    ],
    [PetType.CAT]: [
      {
        name: 'litter_box',
        description: 'Log litter box change',
        requiresNotes: false,
      },
      {
        name: 'grooming',
        description: 'Log grooming activity',
        suggestedDuration: 30,
        requiresNotes: false,
      },
    ],
    [PetType.BIRD]: [
      {
        name: 'cage_cleaning',
        description: 'Log cage cleaning',
        requiresNotes: false,
      },
      {
        name: 'wing_clipping',
        description: 'Log wing clipping',
        requiresNotes: true,
      },
    ],
    [PetType.FISH]: [
      {
        name: 'water_change',
        description: 'Log water change',
        requiresNotes: false,
      },
      {
        name: 'tank_maintenance',
        description: 'Log tank maintenance',
        requiresNotes: true,
      },
    ],
  };

  /**
   * Execute pet-type-specific command
   */
  async execute(
    intent: ParsedIntent,
    context: ConversationContext
  ): Promise<CommandResult> {
    const { target, parameters } = intent;

    try {
      // Get pet information
      const petId = parameters.petId || parameters.petName;
      const petType = await this.getPetType(petId, context);

      if (!petType) {
        return {
          success: false,
          data: null,
          message: `I couldn't determine the pet type. Please specify which pet you're referring to.`,
          visualComponent: null,
          requiresFollowUp: true,
          followUpPrompt: 'Which pet would you like to log this activity for?',
        };
      }

      // Validate activity is appropriate for pet type
      const activityType = parameters.activityType || target;
      const validationResult = this.validateActivityForPetType(activityType, petType);

      if (!validationResult.valid) {
        return {
          success: false,
          data: { petType, activityType, suggestions: validationResult.suggestions },
          message: validationResult.message,
          visualComponent: null,
          requiresFollowUp: false,
          followUpPrompt: null,
        };
      }

      // Log the activity
      return await this.logPetTypeActivity(petId, petType, activityType, parameters);
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to log activity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }
  }

  /**
   * Get pet type from pet ID or context
   */
  private async getPetType(
    petId: string,
    context: ConversationContext
  ): Promise<PetType | null> {
    try {
      // First, check if pet type is explicitly mentioned in context entities
      const petTypeEntity = context.recentEntities.find(
        (entity) => entity.type === 'PET_TYPE' || entity.type === 'pet_type'
      );
      
      if (petTypeEntity) {
        const typeValue = petTypeEntity.value.toLowerCase();
        if (Object.values(PetType).includes(typeValue as PetType)) {
          return typeValue as PetType;
        }
      }
      
      // Try to fetch pet data from the API
      if (petId) {
        const response = await api.request(`/v1/pets/${petId}`, {
          method: 'GET',
        });
        
        if (response.data && response.data.species) {
          const species = response.data.species.toLowerCase();
          if (Object.values(PetType).includes(species as PetType)) {
            return species as PetType;
          }
        }
      }
      
      // Fallback: return null to indicate we need more information
      return null;
    } catch (error) {
      console.error('Error getting pet type:', error);
      return null;
    }
  }

  /**
   * Validate if an activity is appropriate for a pet type
   */
  private validateActivityForPetType(
    activityType: string,
    petType: PetType
  ): { valid: boolean; message: string; suggestions?: string[] } {
    const normalizedActivity = activityType.toLowerCase().replace(/\s+/g, '_');
    const supportedActivities = this.petTypeActivities[petType];

    // Check if activity is supported for this pet type
    const isSupported = supportedActivities.some(
      (activity) => activity.name === normalizedActivity
    );

    if (isSupported) {
      return { valid: true, message: '' };
    }

    // Activity not supported - provide helpful message
    const suggestions = supportedActivities.map((activity) => activity.name);
    const petTypeName = petType.charAt(0).toUpperCase() + petType.slice(1);

    return {
      valid: false,
      message: `I can't log "${activityType}" for ${petTypeName}s. For ${petTypeName}s, I can log: ${suggestions.join(', ')}.`,
      suggestions,
    };
  }

  /**
   * Log pet-type-specific activity
   */
  private async logPetTypeActivity(
    petId: string,
    petType: PetType,
    activityType: string,
    parameters: Record<string, any>
  ): Promise<CommandResult> {
    const normalizedActivity = activityType.toLowerCase().replace(/\s+/g, '_');
    const activityMetadata = this.petTypeActivities[petType].find(
      (activity) => activity.name === normalizedActivity
    );

    if (!activityMetadata) {
      return {
        success: false,
        data: null,
        message: `Activity "${activityType}" is not supported for ${petType}s.`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }

    // Extract activity parameters
    const duration = parameters.duration || activityMetadata.suggestedDuration;
    const notes = parameters.notes || '';
    const time = parameters.time || new Date();

    // Check for missing required fields
    if (activityMetadata.requiresNotes && !notes) {
      return {
        success: false,
        data: { missingFields: ['notes'] },
        message: `I need some notes about the ${activityMetadata.name.replace('_', ' ')}`,
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: `What would you like to note about this ${activityMetadata.name.replace('_', ' ')}?`,
      };
    }

    // Log the activity using dashboard actions
    await dashboardActions.logActivity(petId, {
      type: normalizedActivity,
      duration,
      notes: notes || `${activityMetadata.description}${duration ? ` for ${duration} minutes` : ''}`,
      time,
    });

    // Compose success message
    const petTypeName = petType.charAt(0).toUpperCase() + petType.slice(1);
    const activityName = activityMetadata.name.replace('_', ' ');
    const durationText = duration ? ` for ${duration} minutes` : '';

    return {
      success: true,
      data: {
        petId,
        petType,
        activityType: normalizedActivity,
        duration,
        notes,
        time,
      },
      message: `Logged ${activityName}${durationText} for your ${petTypeName}`,
      visualComponent: 'ActivityLogConfirmation',
      requiresFollowUp: false,
      followUpPrompt: null,
    };
  }

  /**
   * Get command suggestions for a specific pet type
   */
  public getCommandSuggestionsForPetType(petType: PetType): string[] {
    const activities = this.petTypeActivities[petType];
    return activities.map((activity) => {
      const activityName = activity.name.replace('_', ' ');
      return `Log ${activityName}`;
    });
  }

  /**
   * Get pet-type-aware suggestions for active pet in context
   */
  public async getContextualSuggestions(
    context: ConversationContext
  ): Promise<string[]> {
    const activePet = context.activePet;
    if (!activePet) {
      return [];
    }

    const petType = await this.getPetType(activePet, context);
    if (!petType) {
      return [];
    }

    return this.getCommandSuggestionsForPetType(petType);
  }

  /**
   * Get all supported activities for a pet type
   */
  public getSupportedActivities(petType: PetType): ActivityMetadata[] {
    return this.petTypeActivities[petType] || [];
  }

  /**
   * Check if command can be executed
   */
  canExecute(intent: ParsedIntent): boolean {
    // Pet type commands need either a target or activityType parameter
    return !!intent.target || !!intent.parameters.activityType;
  }

  /**
   * Get required parameters
   */
  getRequiredParameters(): string[] {
    return ['petId', 'activityType'];
  }
}

// Export singleton instance
export const petTypeCommandHandler = new PetTypeCommandHandler();

// Export default
export default petTypeCommandHandler;
