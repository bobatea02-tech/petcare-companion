/**
 * Scheduling Command Handler
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Handles voice commands for scheduling appointments with multi-turn dialog support
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

import {
  CommandHandler,
  ParsedIntent,
  ConversationContext,
  CommandResult,
  EntityType,
} from '../types';
import { DialogManager, DialogType, ParameterDefinition } from '../dialogManager';
import { DashboardActionsService } from '../dashboardActions';

export class SchedulingHandler implements CommandHandler {
  private dialogManager: DialogManager;
  private dashboardActions: DashboardActionsService;
  private activeDialogId: string | null = null;

  constructor(dialogManager: DialogManager, dashboardActions: DashboardActionsService) {
    this.dialogManager = dialogManager;
    this.dashboardActions = dashboardActions;
  }
  /**
   * Execute scheduling command
   */
  async execute(
    intent: ParsedIntent,
    context: ConversationContext
  ): Promise<CommandResult> {
    const { target, parameters } = intent;

    try {
      switch (target) {
        case 'appointment':
        case 'vet_appointment':
          return await this.scheduleAppointment(intent, context);
        
        case 'cancel_appointment':
          return await this.cancelAppointment(parameters, context);
        
        default:
          return {
            success: false,
            data: null,
            message: `I don't know how to schedule "${target}". Try "Schedule appointment" or "Cancel appointment"`,
            visualComponent: null,
            requiresFollowUp: false,
            followUpPrompt: null,
          };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to schedule: ${error instanceof Error ? error.message : 'Unknown error'}`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }
  }

  /**
   * Schedule an appointment with multi-turn dialog support
   */
  private async scheduleAppointment(
    intent: ParsedIntent,
    context: ConversationContext
  ): Promise<CommandResult> {
    const { parameters } = intent;

    // Define required parameters for appointment booking
    const requiredParameters: ParameterDefinition[] = [
      {
        name: 'petId',
        type: EntityType.PET_NAME,
        required: true,
        prompt: 'Which pet is this appointment for?',
        examples: ['Max', 'Bella', 'Charlie'],
      },
      {
        name: 'date',
        type: EntityType.DATE,
        required: true,
        prompt: 'What date would you like to schedule the appointment?',
        examples: ['Tomorrow', 'Next Monday', 'January 15th'],
        validationFn: (value: any) => {
          const date = new Date(value);
          return date > new Date(); // Must be in the future
        },
        validationError: 'The appointment date must be in the future.',
      },
      {
        name: 'time',
        type: EntityType.TIME,
        required: true,
        prompt: 'What time works best for you?',
        examples: ['10:00 AM', '2:30 PM', '4:00 PM'],
      },
      {
        name: 'clinic',
        type: 'string',
        required: true,
        prompt: 'Which vet clinic would you like to visit?',
        examples: ['City Vet Clinic', 'Pet Care Center', 'Animal Hospital'],
      },
      {
        name: 'reason',
        type: 'string',
        required: false,
        prompt: 'What is the reason for the visit?',
        examples: ['Checkup', 'Vaccination', 'Follow-up'],
      },
    ];

    // Check if all required parameters are already collected
    const missingParams = requiredParameters.filter(
      (param) => param.required && !parameters[param.name]
    );

    // If we have all required parameters and no active dialog, proceed directly
    if (missingParams.length === 0 && !this.activeDialogId) {
      // Skip dialog, proceed to appointment creation
      const { petId, date, time, clinic, reason } = parameters;
    
      try {
        // Get existing appointments for conflict detection
        const existingAppointments = await this.dashboardActions.getAppointments(petId);
        const appointmentDate = new Date(date);
        
        // Check for conflicts (same day appointments)
        const conflicts = existingAppointments.filter((apt) => {
          const aptDate = new Date(apt.date);
          return (
            aptDate.toDateString() === appointmentDate.toDateString() &&
            apt.time === time
          );
        });

        if (conflicts.length > 0) {
          // Suggest alternative times
          const alternativeTimes = this.suggestAlternativeTimes(time);
          return {
            success: false,
            data: { conflicts, alternativeTimes },
            message: `There's already an appointment scheduled for ${petId} on ${this.formatDate(appointmentDate)} at ${time}. Would you like to try ${alternativeTimes[0]} or ${alternativeTimes[1]} instead?`,
            visualComponent: 'AppointmentConflict',
            requiresFollowUp: true,
            followUpPrompt: `Would you like to schedule at ${alternativeTimes[0]} instead?`,
          };
        }

        // Create the appointment
        const appointmentData = {
          date: appointmentDate,
          time,
          clinic,
          reason: reason || 'General checkup',
        };

        const createdAppointment = await this.dashboardActions.createAppointment(
          petId,
          appointmentData
        );

        // Return success with data for voice confirmation (Requirement 11.6)
        const dateStr = this.formatDate(appointmentDate);
        return {
          success: true,
          data: {
            ...createdAppointment,
            petName: petId,
            date: dateStr,
            time,
            clinic,
            reason: reason || 'General checkup',
          },
          message: `schedule_appointment`, // Used by ResponseComposer to select template
          visualComponent: 'AppointmentConfirmation',
          requiresFollowUp: false,
          followUpPrompt: null,
        };
      } catch (error) {
        throw error;
      }
    }

    // Missing parameters - need to start or continue dialog
    if (missingParams.length > 0) {
      if (!this.activeDialogId) {
        // Start new dialog
        const dialogState = this.dialogManager.startDialog(
          intent,
          requiredParameters,
          DialogType.APPOINTMENT_BOOKING
        );
        this.activeDialogId = dialogState.dialogId;

        // Get first prompt
        const prompt = this.dialogManager.getNextPrompt(this.activeDialogId);
        if (prompt) {
          return {
            success: false,
            data: { dialogId: this.activeDialogId },
            message: prompt.text,
            visualComponent: null,
            requiresFollowUp: true,
            followUpPrompt: prompt.text,
          };
        }
      }

      // Continue dialog to collect missing parameters
      return {
        success: false,
        data: { missingFields: missingParams.map((p) => p.name) },
        message: `I need more information to schedule the appointment`,
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: missingParams[0].prompt,
      };
    }

    // Should not reach here - all parameters should be collected by now
    throw new Error('Unexpected state in appointment scheduling');
  }

  /**
   * Cancel an appointment via voice
   */
  private async cancelAppointment(
    parameters: Record<string, any>,
    context: ConversationContext
  ): Promise<CommandResult> {
    const { appointmentId, petId, petName, date } = parameters;

    // Need at least pet identification
    if (!appointmentId && !petId && !petName) {
      return {
        success: false,
        data: null,
        message: 'Which appointment would you like to cancel?',
        visualComponent: null,
        requiresFollowUp: true,
        followUpPrompt: 'Which pet is the appointment for?',
      };
    }

    try {
      const targetPetId = petId || petName || context.activePet;
      
      if (!targetPetId) {
        return {
          success: false,
          data: null,
          message: 'I need to know which pet the appointment is for.',
          visualComponent: null,
          requiresFollowUp: true,
          followUpPrompt: 'Which pet is the appointment for?',
        };
      }

      // If we have appointment ID, cancel directly
      if (appointmentId) {
        await this.dashboardActions.cancelAppointment(appointmentId);
        return {
          success: true,
          data: { appointmentId, petId: targetPetId },
          message: `I've cancelled the appointment for ${targetPetId}.`,
          visualComponent: null,
          requiresFollowUp: false,
          followUpPrompt: null,
        };
      }

      // Otherwise, find appointments by pet and date
      const appointments = await this.dashboardActions.getAppointments(targetPetId);
      
      if (appointments.length === 0) {
        return {
          success: false,
          data: null,
          message: `I couldn't find any appointments for ${targetPetId}.`,
          visualComponent: null,
          requiresFollowUp: false,
          followUpPrompt: null,
        };
      }

      // If date is specified, filter by date
      let targetAppointment = appointments[0];
      if (date) {
        const targetDate = new Date(date);
        const matchingAppointments = appointments.filter((apt) => {
          const aptDate = new Date(apt.date);
          return aptDate.toDateString() === targetDate.toDateString();
        });

        if (matchingAppointments.length === 0) {
          return {
            success: false,
            data: null,
            message: `I couldn't find an appointment for ${targetPetId} on ${this.formatDate(targetDate)}.`,
            visualComponent: null,
            requiresFollowUp: false,
            followUpPrompt: null,
          };
        }

        targetAppointment = matchingAppointments[0];
      }

      // Cancel the appointment
      await this.dashboardActions.cancelAppointment(targetAppointment.id);

      const dateStr = this.formatDate(new Date(targetAppointment.date));
      return {
        success: true,
        data: { appointmentId: targetAppointment.id, petId: targetPetId },
        message: `I've cancelled the appointment for ${targetPetId} on ${dateStr} at ${targetAppointment.time}.`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Suggest alternative appointment times
   */
  private suggestAlternativeTimes(conflictTime: string): string[] {
    // Parse the conflict time
    const [hours, minutes] = conflictTime.split(':').map((s) => parseInt(s.replace(/[^\d]/g, '')));
    const isPM = conflictTime.toLowerCase().includes('pm');
    let hour24 = isPM && hours !== 12 ? hours + 12 : hours;
    if (!isPM && hours === 12) hour24 = 0;

    // Suggest times 1 hour before and after
    const alternatives: string[] = [];
    
    // 1 hour before
    const beforeHour = hour24 - 1;
    if (beforeHour >= 9) { // Clinic hours start at 9 AM
      alternatives.push(this.formatTime(beforeHour, minutes));
    }

    // 1 hour after
    const afterHour = hour24 + 1;
    if (afterHour <= 17) { // Clinic hours end at 5 PM
      alternatives.push(this.formatTime(afterHour, minutes));
    }

    // 2 hours after if we don't have 2 alternatives yet
    if (alternatives.length < 2) {
      const twoHoursAfter = hour24 + 2;
      if (twoHoursAfter <= 17) {
        alternatives.push(this.formatTime(twoHoursAfter, minutes));
      }
    }

    return alternatives.length > 0 ? alternatives : ['10:00 AM', '2:00 PM'];
  }

  /**
   * Format time in 12-hour format
   */
  private formatTime(hour24: number, minutes: number): string {
    const isPM = hour24 >= 12;
    const hour12 = hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24;
    const minuteStr = minutes.toString().padStart(2, '0');
    return `${hour12}:${minuteStr} ${isPM ? 'PM' : 'AM'}`;
  }

  /**
   * Format date in readable format
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
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
