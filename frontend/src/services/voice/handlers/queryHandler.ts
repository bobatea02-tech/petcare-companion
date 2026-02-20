/**
 * Query Command Handler
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Handles voice commands for querying pet information
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import {
  CommandHandler,
  ParsedIntent,
  ConversationContext,
  CommandResult,
} from '../types';

export class QueryHandler implements CommandHandler {
  /**
   * Execute query command
   */
  async execute(
    intent: ParsedIntent,
    context: ConversationContext
  ): Promise<CommandResult> {
    const { target, parameters } = intent;

    try {
      // Requirement 6.6: Handle "show more details" follow-up command
      if (target === 'show_more_details' || target === 'more_details' || target === 'full_details') {
        return await this.showMoreDetails(context);
      }

      // Determine what type of query
      switch (target) {
        case 'appointments':
        case 'next_appointment':
          return await this.queryAppointments(parameters);
        
        case 'medications':
        case 'medication_schedule':
          return await this.queryMedications(parameters);
        
        case 'health_score':
        case 'health':
          return await this.queryHealthScore(parameters);
        
        case 'feeding_history':
        case 'feeding':
          return await this.queryFeedingHistory(parameters);
        
        case 'health_records':
          return await this.queryHealthRecords(parameters);
        
        case 'milestones':
        case 'achievements':
          return await this.queryMilestones(parameters);
        
        case 'tips':
        case 'care_tips':
          return await this.queryTips(parameters);
        
        default:
          return {
            success: false,
            data: null,
            message: `I don't know how to query "${target}". Try asking about appointments, medications, health records, milestones, or tips`,
            visualComponent: null,
            requiresFollowUp: false,
            followUpPrompt: null,
          };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to query data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }
  }

  /**
   * Show more details for previously summarized query
   * Requirement 6.6: Handle "show more details" follow-up command
   */
  private async showMoreDetails(context: ConversationContext): Promise<CommandResult> {
    const summarizedQuery = context.lastSummarizedQuery;

    if (!summarizedQuery) {
      return {
        success: false,
        data: null,
        message: "I don't have any summarized information to show. Try asking about your pet's appointments, medications, feeding history, or health records first.",
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }

    const { queryType, fullData, petName } = summarizedQuery;

    // Return full details based on query type
    switch (queryType) {
      case 'appointments':
        return {
          success: true,
          data: fullData,
          message: `show_full_appointments`, // Special message for ResponseComposer
          visualComponent: 'AppointmentsList',
          requiresFollowUp: false,
          followUpPrompt: null,
        };

      case 'medications':
        return {
          success: true,
          data: fullData,
          message: `show_full_medications`, // Special message for ResponseComposer
          visualComponent: 'MedicationsList',
          requiresFollowUp: false,
          followUpPrompt: null,
        };

      case 'feeding':
        return {
          success: true,
          data: fullData,
          message: `show_full_feeding`, // Special message for ResponseComposer
          visualComponent: 'FeedingHistoryChart',
          requiresFollowUp: false,
          followUpPrompt: null,
        };

      case 'health_records':
        return {
          success: true,
          data: fullData,
          message: `show_full_health_records`, // Special message for ResponseComposer
          visualComponent: 'HealthRecordsList',
          requiresFollowUp: false,
          followUpPrompt: null,
        };

      default:
        return {
          success: false,
          data: null,
          message: `I'm not sure how to show more details for ${queryType}`,
          visualComponent: null,
          requiresFollowUp: false,
          followUpPrompt: null,
        };
    }
  }

  /**
   * Query appointments
   */
  private async queryAppointments(parameters: Record<string, any>): Promise<CommandResult> {
    const { petId, petName } = parameters;

    if (!petId && !petName) {
      return {
        success: false,
        data: null,
        message: 'Which pet would you like to check appointments for?',
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: 'Which pet?',
      };
    }

    // TODO: Call actual API to get appointments
    // Mock data for now
    const appointments = [
      {
        id: '1',
        petId: petId || petName,
        date: new Date('2026-02-25'),
        time: '10:00 AM',
        clinic: 'Mumbai Pet Clinic',
        reason: 'Annual checkup',
      },
    ];

    if (appointments.length === 0) {
      return {
        success: true,
        data: { appointments: [] },
        message: `${petName || petId} has no upcoming appointments`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }

    const nextAppointment = appointments[0];
    const dateStr = nextAppointment.date.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    return {
      success: true,
      data: { appointments },
      message: `${petName || petId}'s next appointment is on ${dateStr} at ${nextAppointment.time} at ${nextAppointment.clinic} for ${nextAppointment.reason}`,
      visualComponent: 'AppointmentsList',
      requiresFollowUp: false,
      followUpPrompt: null,
    };
  }

  /**
   * Query medications
   */
  private async queryMedications(parameters: Record<string, any>): Promise<CommandResult> {
    const { petId, petName, date } = parameters;

    if (!petId && !petName) {
      return {
        success: false,
        data: null,
        message: 'Which pet would you like to check medications for?',
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: 'Which pet?',
      };
    }

    // TODO: Call actual API to get medications
    // Mock data for now
    const medications = [
      {
        id: '1',
        petId: petId || petName,
        name: 'Heartgard',
        dosage: '1 tablet',
        schedule: 'Monthly',
        nextDue: new Date('2026-03-01'),
      },
    ];

    if (medications.length === 0) {
      return {
        success: true,
        data: { medications: [] },
        message: `${petName || petId} has no medications scheduled${date ? ' for that date' : ' today'}`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }

    const medList = medications.map(med => `${med.name} (${med.dosage})`).join(', ');

    return {
      success: true,
      data: { medications },
      message: `${petName || petId} needs: ${medList}`,
      visualComponent: 'MedicationsList',
      requiresFollowUp: false,
      followUpPrompt: null,
    };
  }

  /**
   * Query health score
   */
  private async queryHealthScore(parameters: Record<string, any>): Promise<CommandResult> {
    const { petId, petName } = parameters;

    if (!petId && !petName) {
      return {
        success: false,
        data: null,
        message: 'Which pet would you like to check the health score for?',
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: 'Which pet?',
      };
    }

    // TODO: Call actual API to get health score
    // Mock data for now
    const healthScore = 85;

    return {
      success: true,
      data: { healthScore, petId: petId || petName },
      message: `${petName || petId}'s health score is ${healthScore} out of 100. That's looking good!`,
      visualComponent: 'HealthScoreDisplay',
      requiresFollowUp: false,
      followUpPrompt: null,
    };
  }

  /**
   * Query feeding history
   */
  private async queryFeedingHistory(parameters: Record<string, any>): Promise<CommandResult> {
    const { petId, petName, days } = parameters;

    if (!petId && !petName) {
      return {
        success: false,
        data: null,
        message: 'Which pet would you like to check feeding history for?',
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: 'Which pet?',
      };
    }

    // TODO: Call actual API to get feeding history
    // Mock data for now
    const feedingLogs = [
      {
        id: '1',
        petId: petId || petName,
        amount: 2,
        unit: 'cups',
        foodType: 'dry food',
        time: new Date('2026-02-20T08:00:00'),
      },
      {
        id: '2',
        petId: petId || petName,
        amount: 1.5,
        unit: 'cups',
        foodType: 'wet food',
        time: new Date('2026-02-19T18:00:00'),
      },
    ];

    if (feedingLogs.length === 0) {
      return {
        success: true,
        data: { feedingLogs: [] },
        message: `No feeding history found for ${petName || petId}`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }

    const daysText = days ? `the last ${days} days` : 'recently';
    const summary = `${petName || petId} has been fed ${feedingLogs.length} times ${daysText}`;

    return {
      success: true,
      data: { feedingLogs },
      message: summary,
      visualComponent: 'FeedingHistoryChart',
      requiresFollowUp: false,
      followUpPrompt: null,
    };
  }

  /**
   * Query health records
   */
  private async queryHealthRecords(parameters: Record<string, any>): Promise<CommandResult> {
    const { petId, petName } = parameters;

    if (!petId && !petName) {
      return {
        success: false,
        data: null,
        message: 'Which pet would you like to check health records for?',
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: 'Which pet?',
      };
    }

    // TODO: Call actual API to get health records
    // Mock data for now
    const healthRecords = [
      {
        id: '1',
        petId: petId || petName,
        type: 'vaccination',
        date: new Date('2026-01-15'),
        data: { vaccine: 'Rabies', nextDue: '2027-01-15' },
      },
    ];

    return {
      success: true,
      data: { healthRecords },
      message: `Showing health records for ${petName || petId}`,
      visualComponent: 'HealthRecordsList',
      requiresFollowUp: false,
      followUpPrompt: null,
    };
  }

  /**
   * Query milestones
   */
  private async queryMilestones(parameters: Record<string, any>): Promise<CommandResult> {
    const { petId, petName } = parameters;

    if (!petId && !petName) {
      return {
        success: false,
        data: null,
        message: 'Which pet would you like to check milestones for?',
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: 'Which pet?',
      };
    }

    // TODO: Call actual API to get milestones
    // Mock data for now
    const milestones = [
      {
        id: '1',
        petId: petId || petName,
        type: 'first_vet_visit',
        title: 'First Vet Visit',
        achievedAt: new Date('2025-12-15'),
        badge: '🏥',
      },
      {
        id: '2',
        petId: petId || petName,
        type: 'age_anniversary',
        title: '1 Year Old',
        achievedAt: new Date('2026-01-01'),
        badge: '🎂',
      },
    ];

    if (milestones.length === 0) {
      return {
        success: true,
        data: { milestones: [] },
        message: `${petName || petId} hasn't achieved any milestones yet. Keep logging activities to unlock achievements!`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }

    const latestMilestone = milestones[0];
    return {
      success: true,
      data: { milestones },
      message: `${petName || petId} has achieved ${milestones.length} milestones! The latest is "${latestMilestone.title}" ${latestMilestone.badge}`,
      visualComponent: 'MilestonesList',
      requiresFollowUp: false,
      followUpPrompt: null,
    };
  }

  /**
   * Query care tips
   */
  private async queryTips(parameters: Record<string, any>): Promise<CommandResult> {
    const { petType, breed } = parameters;

    // TODO: Call actual API to get tips
    // Mock data for now
    const tip = {
      id: '1',
      title: 'Daily Exercise',
      content: 'Dogs need at least 30 minutes of exercise daily to stay healthy and happy.',
      category: 'health',
    };

    return {
      success: true,
      data: { tip },
      message: `Here's a tip: ${tip.title}. ${tip.content}`,
      visualComponent: 'TipDisplay',
      requiresFollowUp: false,
      followUpPrompt: null,
    };
  }

  /**
   * Check if command can be executed
   */
  canExecute(intent: ParsedIntent): boolean {
    // Query commands need a target (what to query)
    return !!intent.target;
  }

  /**
   * Get required parameters
   */
  getRequiredParameters(): string[] {
    return ['target'];
  }
}
