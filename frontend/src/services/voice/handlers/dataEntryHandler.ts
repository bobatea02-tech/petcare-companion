/**
 * Data Entry Command Handler
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Handles voice commands for logging pet care data
 * Requirements: 5.1, 5.2, 5.4, 5.5, 5.7 (voice confirmation)
 */

import {
  CommandHandler,
  ParsedIntent,
  ConversationContext,
  CommandResult,
} from '../types';
import { dashboardActions } from '../dashboardActions';

export class DataEntryHandler implements CommandHandler {
  /**
   * Execute data entry command
   */
  async execute(
    intent: ParsedIntent,
    context: ConversationContext
  ): Promise<CommandResult> {
    const { target, parameters } = intent;

    try {
      // Determine what type of data to log
      switch (target) {
        case 'feeding':
          return await this.logFeeding(parameters);
        
        case 'medication':
          return await this.logMedication(parameters);
        
        case 'weight':
          return await this.logWeight(parameters);
        
        case 'activity':
          return await this.logActivity(parameters);
        
        case 'expense':
          return await this.logExpense(parameters);
        
        default:
          return {
            success: false,
            data: null,
            message: `I don't know how to log "${target}". Try "Log feeding", "Add medication", "Record weight", or "Add expense"`,
            visualComponent: null,
            requiresFollowUp: false,
            followUpPrompt: null,
          };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to log data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }
  }

  /**
   * Log feeding data
   * Requirement 5.7: Confirm action via voice after successful data entry
   */
  private async logFeeding(parameters: Record<string, any>): Promise<CommandResult> {
    const { petId, petName, amount, unit, foodType, time } = parameters;

    // Check for missing required fields
    const missingFields: string[] = [];
    if (!petId && !petName) missingFields.push('pet name');
    if (!amount) missingFields.push('amount');
    if (!foodType) missingFields.push('food type');

    if (missingFields.length > 0) {
      return {
        success: false,
        data: { missingFields },
        message: `I need more information to log feeding`,
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: `What ${missingFields[0]} should I use?`,
      };
    }

    try {
      // Call DashboardActions to log feeding
      const feedingData = {
        amount: parseFloat(amount),
        unit: unit || 'cups',
        foodType,
        time: time ? new Date(time) : new Date(),
      };

      await dashboardActions.logFeeding(petId, feedingData);

      // Return success with data for voice confirmation
      return {
        success: true,
        data: {
          petName: petName || petId,
          amount: feedingData.amount,
          unit: feedingData.unit,
          foodType: feedingData.foodType,
          time: feedingData.time,
        },
        message: `log_feeding`, // Used by ResponseComposer to select template
        visualComponent: 'FeedingLogConfirmation',
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to log feeding: ${error instanceof Error ? error.message : 'Unknown error'}`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }
  }

  /**
   * Log medication data
   * Requirement 5.7: Confirm action via voice after successful data entry
   */
  private async logMedication(parameters: Record<string, any>): Promise<CommandResult> {
    const { petId, petName, medicationName, dosage, time, notes } = parameters;

    // Check for missing required fields
    const missingFields: string[] = [];
    if (!petId && !petName) missingFields.push('pet name');
    if (!medicationName) missingFields.push('medication name');
    if (!dosage) missingFields.push('dosage');

    if (missingFields.length > 0) {
      return {
        success: false,
        data: { missingFields },
        message: `I need more information to log medication`,
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: `What ${missingFields[0]} should I use?`,
      };
    }

    try {
      // Call DashboardActions to log medication
      const medicationData = {
        name: medicationName,
        dosage,
        time: time ? new Date(time) : new Date(),
        notes: notes || '',
      };

      await dashboardActions.logMedication(petId, medicationData);

      // Return success with data for voice confirmation
      return {
        success: true,
        data: {
          petName: petName || petId,
          medicationName,
          dosage,
          time: medicationData.time,
        },
        message: `log_medication`, // Used by ResponseComposer to select template
        visualComponent: 'MedicationLogConfirmation',
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to log medication: ${error instanceof Error ? error.message : 'Unknown error'}`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }
  }

  /**
   * Log weight data
   * Requirement 5.7: Confirm action via voice after successful data entry
   */
  private async logWeight(parameters: Record<string, any>): Promise<CommandResult> {
    const { petId, petName, weight, unit } = parameters;

    // Check for missing required fields
    const missingFields: string[] = [];
    if (!petId && !petName) missingFields.push('pet name');
    if (!weight) missingFields.push('weight');

    if (missingFields.length > 0) {
      return {
        success: false,
        data: { missingFields },
        message: `I need more information to log weight`,
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: `What ${missingFields[0]} should I use?`,
      };
    }

    try {
      // Call DashboardActions to log weight
      const weightValue = parseFloat(weight);
      const weightUnit = unit || 'kg';

      await dashboardActions.logWeight(petId, weightValue, weightUnit);

      // Return success with data for voice confirmation
      return {
        success: true,
        data: {
          petName: petName || petId,
          weight: weightValue,
          unit: weightUnit,
        },
        message: `log_weight`, // Used by ResponseComposer to select template
        visualComponent: 'WeightLogConfirmation',
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to log weight: ${error instanceof Error ? error.message : 'Unknown error'}`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }
  }

  /**
   * Log activity data
   */
  private async logActivity(parameters: Record<string, any>): Promise<CommandResult> {
    const { petId, petName, activityType, duration, notes } = parameters;

    // Check for missing required fields
    const missingFields: string[] = [];
    if (!petId && !petName) missingFields.push('pet name');
    if (!activityType) missingFields.push('activity type');

    if (missingFields.length > 0) {
      return {
        success: false,
        data: { missingFields },
        message: `I need more information to log activity`,
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: `What ${missingFields[0]} should I use?`,
      };
    }

    // TODO: Call actual API to log activity
    const activityData = {
      petId: petId || petName,
      type: activityType,
      duration,
      notes,
      time: new Date(),
    };

    return {
      success: true,
      data: activityData,
      message: `Logged ${activityType} for ${petName || petId}${duration ? ` for ${duration} minutes` : ''}`,
      visualComponent: 'ActivityLogConfirmation',
      requiresFollowUp: false,
      followUpPrompt: null,
    };
  }

  /**
   * Log expense data
   */
  private async logExpense(parameters: Record<string, any>): Promise<CommandResult> {
    const { petId, petName, amount, category, description, notes } = parameters;

    // Check for missing required fields
    const missingFields: string[] = [];
    if (!petId && !petName) missingFields.push('pet name');
    if (!amount) missingFields.push('amount');
    if (!category) missingFields.push('category');

    if (missingFields.length > 0) {
      return {
        success: false,
        data: { missingFields },
        message: `I need more information to log expense`,
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: `What ${missingFields[0]} should I use?`,
      };
    }

    // Validate category
    const validCategories = ['food', 'vet', 'grooming', 'toys', 'other'];
    const normalizedCategory = category.toLowerCase();
    if (!validCategories.includes(normalizedCategory)) {
      return {
        success: false,
        data: null,
        message: `Invalid category "${category}". Please use one of: food, vet, grooming, toys, or other`,
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: 'Which category should I use?',
      };
    }

    // TODO: Call actual API to log expense
    const expenseData = {
      petId: petId || petName,
      amount: parseFloat(amount),
      category: normalizedCategory,
      description: description || `${normalizedCategory} expense`,
      notes,
      date: new Date(),
    };

    return {
      success: true,
      data: expenseData,
      message: `Logged expense for ${petName || petId}: ₹${amount} for ${normalizedCategory}`,
      visualComponent: 'ExpenseLogConfirmation',
      requiresFollowUp: false,
      followUpPrompt: null,
    };
  }

  /**
   * Check if command can be executed
   */
  canExecute(intent: ParsedIntent): boolean {
    // Data entry commands need a target (what to log)
    return !!intent.target;
  }

  /**
   * Get required parameters
   */
  getRequiredParameters(): string[] {
    return ['target'];
  }
}
