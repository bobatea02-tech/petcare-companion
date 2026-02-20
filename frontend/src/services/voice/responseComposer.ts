/**
 * Response Composer Service
 * Feature: jojo-voice-assistant-enhanced
 * Requirements: 3.5, 8.1, 15.3, 16.4, 16.5
 * 
 * Generates natural language responses based on command results with:
 * - Warm, friendly, helpful personality
 * - Quota-aware response optimization
 * - Multi-modal response generation (voice + visual)
 * - Context-aware personalization
 */

import { 
  ResponseComposer, 
  Response, 
  CommandResult, 
  ConversationContext, 
  ParsedIntent,
  CommandAction 
} from './types';
import { elevenLabsClient } from './elevenLabsClient';

// Response template categories
type ResponseTemplate = {
  text: string;
  displayText?: string;
  priority?: "low" | "normal" | "high";
};

type TemplateFunction = (data: any, context?: ConversationContext) => ResponseTemplate;

export class ResponseComposerService implements ResponseComposer {
  private usageThreshold = 8000; // 80% of 10,000 char limit
  private conservationMode = false;

  /**
   * Compose response from command result
   * Requirements: 3.5, 8.1, 15.3, 16.4, 16.5
   */
  composeResponse(result: CommandResult, context: ConversationContext): Response {
    // Check if we need to activate conservation mode
    this.updateConservationMode();

    let template: ResponseTemplate;

    if (result.success) {
      template = this.composeSuccessResponse(result, context);
    } else {
      template = this.composeFailureResponse(result, context);
    }

    // Apply quota conservation if needed
    if (this.conservationMode) {
      template = this.shortenResponse(template);
    }

    return {
      text: template.text,
      displayText: template.displayText || template.text,
      visualData: result.data,
      audioUrl: null, // Will be populated by TTS engine
      priority: template.priority || "normal"
    };
  }

  /**
   * Compose error response
   * Requirements: 16.4 (direct tone for errors)
   */
  composeErrorResponse(error: Error, context: ConversationContext): Response {
    this.updateConservationMode();

    const errorTemplates: Record<string, TemplateFunction> = {
      'recognition_failure': () => ({
        text: "Sorry, I didn't catch that. Could you repeat?",
        priority: "normal" as const
      }),
      'api_failure': () => ({
        text: "I'm having trouble right now. Please try again.",
        priority: "normal" as const
      }),
      'invalid_command': () => ({
        text: "I'm not sure how to help with that. Try asking about your pets' health, appointments, or feeding.",
        priority: "normal" as const
      }),
      'quota_exceeded': () => ({
        text: "I've reached my voice limit for this month. I'll show you the information instead.",
        displayText: "Voice quota exceeded. Displaying text response.",
        priority: "high" as const
      }),
      'network_error': () => ({
        text: "I need an internet connection to work. Please check your connection.",
        priority: "high" as const
      })
    };

    const errorType = this.detectErrorType(error);
    const template = errorTemplates[errorType] 
      ? errorTemplates[errorType]({}, context)
      : { text: "Something went wrong. Let's try that again.", priority: "normal" as const };

    if (this.conservationMode) {
      return {
        text: this.shortenResponse(template).text,
        displayText: template.displayText || template.text,
        visualData: null,
        audioUrl: null,
        priority: template.priority || "normal"
      };
    }

    return {
      text: template.text,
      displayText: template.displayText || template.text,
      visualData: null,
      audioUrl: null,
      priority: template.priority || "normal"
    };
  }

  /**
   * Compose confirmation request
   * Requirements: 16.5 (detailed for calm interactions)
   */
  composeConfirmation(intent: ParsedIntent): Response {
    this.updateConservationMode();

    const confirmationTemplates: Record<CommandAction, TemplateFunction> = {
      [CommandAction.LOG_DATA]: (data) => {
        const petName = data.parameters.petName || "your pet";
        const action = data.target;
        return {
          text: this.conservationMode 
            ? `Log ${action} for ${petName}?`
            : `I'll log ${action} for ${petName}. Is that correct?`,
          priority: "normal" as const
        };
      },
      [CommandAction.SCHEDULE]: (data) => {
        const petName = data.parameters.petName || "your pet";
        return {
          text: this.conservationMode
            ? `Schedule appointment for ${petName}?`
            : `I'll schedule an appointment for ${petName}. Should I continue?`,
          priority: "normal" as const
        };
      },
      [CommandAction.CANCEL]: (data) => {
        return {
          text: this.conservationMode
            ? `Cancel this?`
            : `This will cancel the item. Are you sure?`,
          priority: "high" as const
        };
      },
      [CommandAction.BULK_ACTION]: (data) => {
        const count = data.parameters.petCount || "all";
        return {
          text: this.conservationMode
            ? `Apply to ${count} pets?`
            : `This will affect ${count} pets. Should I proceed?`,
          priority: "normal" as const
        };
      },
      [CommandAction.NAVIGATE]: () => ({ text: "Navigate there?", priority: "low" as const }),
      [CommandAction.QUERY]: () => ({ text: "Show that info?", priority: "low" as const }),
      [CommandAction.UPDATE]: () => ({ text: "Update this?", priority: "normal" as const }),
      [CommandAction.HELP]: () => ({ text: "Show help?", priority: "low" as const })
    };

    const template = confirmationTemplates[intent.action]
      ? confirmationTemplates[intent.action](intent, undefined)
      : { text: "Is that what you want?", priority: "normal" as const };

    return {
      text: template.text,
      displayText: template.displayText || template.text,
      visualData: null,
      audioUrl: null,
      priority: template.priority || "normal"
    };
  }

  /**
   * Compose clarification question
   * Requirements: 16.5 (detailed, conversational)
   */
  composeClarification(ambiguousIntent: ParsedIntent): Response {
    this.updateConservationMode();

    const clarificationTemplates: Record<string, TemplateFunction> = {
      'multiple_pets': (data) => {
        const pets = data.ambiguities.join(", ");
        return {
          text: this.conservationMode
            ? `Which pet: ${pets}?`
            : `I found multiple pets. Did you mean ${pets}?`,
          priority: "normal" as const
        };
      },
      'missing_parameter': (data) => {
        const param = data.ambiguities[0] || "information";
        return {
          text: this.conservationMode
            ? `What ${param}?`
            : `I need to know the ${param}. Can you tell me?`,
          priority: "normal" as const
        };
      },
      'ambiguous_action': (data) => {
        const actions = data.ambiguities.join(" or ");
        return {
          text: this.conservationMode
            ? `${actions}?`
            : `Did you want to ${actions}?`,
          priority: "normal" as const
        };
      },
      'unclear_intent': () => ({
        text: this.conservationMode
          ? "Can you clarify?"
          : "I'm not quite sure what you mean. Could you rephrase that?",
        priority: "normal" as const
      })
    };

    const clarificationType = this.detectClarificationType(ambiguousIntent);
    const template = clarificationTemplates[clarificationType]
      ? clarificationTemplates[clarificationType](ambiguousIntent, undefined)
      : { text: "Could you be more specific?", priority: "normal" as const };

    return {
      text: template.text,
      displayText: template.displayText || template.text,
      visualData: null,
      audioUrl: null,
      priority: template.priority || "normal"
    };
  }

  /**
   * Compose success response based on command type
   * Requirements: 8.1 (multi-modal), 16.4, 16.5 (tone adaptation)
   */
  private composeSuccessResponse(result: CommandResult, context: ConversationContext): ResponseTemplate {
    const petName = context.activePet || "your pet";
    const isUrgent = result.data?.priority === "urgent" || result.data?.priority === "high";

    // Success templates by action type
    const templates: Record<string, TemplateFunction> = {
      // Navigation responses
      'navigate': (data) => ({
        text: isUrgent 
          ? `Opening ${data.target}.`
          : `Sure! I'm showing you ${data.target}.`,
        priority: isUrgent ? "high" as const : "normal" as const
      }),

      // Data entry responses with confirmation (Requirements 5.7, 11.6)
      'log_feeding': (data) => {
        const amount = data.amount || 'feeding';
        const foodType = data.foodType ? ` of ${data.foodType}` : '';
        const time = data.time ? ` at ${new Date(data.time).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : '';
        
        return {
          text: this.conservationMode
            ? `Logged ${amount}${foodType} for ${petName}`
            : `I've logged ${amount}${foodType} for ${petName}${time}`,
          displayText: `Feeding logged for ${petName}: ${amount}${foodType}${time}`,
          priority: isUrgent ? "high" as const : "normal" as const
        };
      },

      'log_medication': (data) => {
        const medName = data.medicationName || data.name || 'medication';
        const dosage = data.dosage ? ` - ${data.dosage}` : '';
        
        return {
          text: this.conservationMode
            ? `Logged ${medName} for ${petName}`
            : `I've recorded ${medName}${dosage} for ${petName}`,
          displayText: `Medication logged: ${medName}${dosage}`,
          priority: isUrgent ? "high" as const : "normal" as const
        };
      },

      'log_weight': (data) => {
        const weight = data.weight || 0;
        const unit = data.unit || 'kg';
        
        return {
          text: this.conservationMode
            ? `Logged ${petName}'s weight as ${weight} ${unit}`
            : `I've logged ${petName}'s weight as ${weight} ${unit}`,
          displayText: `Weight logged: ${weight} ${unit}`,
          priority: isUrgent ? "high" as const : "normal" as const
        };
      },

      // Query responses with empty result handling (Requirement 6.5)
      'query_appointments': (data) => {
        if (!data.appointments || data.appointments.length === 0) {
          return {
            text: this.conservationMode
              ? `${petName} has no appointments. Want to schedule one?`
              : `${petName} doesn't have any upcoming appointments. Would you like to schedule a vet visit?`,
            displayText: `No appointments found for ${petName}`,
            priority: "normal" as const
          };
        }
        
        // Requirement 6.6: Summarize key information for large result sets
        if (data.appointments.length > 3) {
          const next = data.appointments[0];
          const total = data.appointments.length;
          return {
            text: isUrgent
              ? `${total} appointments. Next: ${next.date} at ${next.time}. Say "show more details" for all.`
              : `${petName} has ${total} appointments scheduled. The next one is ${next.date} at ${next.time}. Say "show more details" to see all appointments.`,
            displayText: `Showing ${total} appointments (summarized)`,
            priority: isUrgent ? "high" as const : "normal" as const
          };
        }
        
        const next = data.appointments[0];
        return {
          text: isUrgent
            ? `Next appointment: ${next.date} at ${next.time}.`
            : `${petName}'s next appointment is ${next.date} at ${next.time} at ${next.clinic}.`,
          displayText: `Showing ${data.appointments.length} appointment(s)`,
          priority: isUrgent ? "high" as const : "normal" as const
        };
      },

      'query_medications': (data) => {
        if (!data.medications || data.medications.length === 0) {
          return {
            text: this.conservationMode
              ? `No medications for ${petName}. Need to add one?`
              : `${petName} doesn't have any medications scheduled. Would you like to add a medication reminder?`,
            displayText: `No medications found for ${petName}`,
            priority: "normal" as const
          };
        }
        
        // Requirement 6.6: Summarize key information for large result sets
        if (data.medications.length > 3) {
          const dueToday = data.medications.filter((m: any) => {
            const dueDate = new Date(m.dueDate || m.nextDose);
            const today = new Date();
            return dueDate.toDateString() === today.toDateString();
          }).length;
          const total = data.medications.length;
          
          return {
            text: isUrgent
              ? `${dueToday} due today, ${total} total. Say "show more details" for all.`
              : `${petName} has ${dueToday} medication${dueToday !== 1 ? 's' : ''} due today out of ${total} total. Say "show more details" to see the full list.`,
            displayText: `${dueToday} due today, ${total} total medications`,
            priority: isUrgent ? "high" as const : "normal" as const
          };
        }
        
        const count = data.medications.length;
        return {
          text: isUrgent
            ? `${count} medication${count > 1 ? 's' : ''} today.`
            : `${petName} has ${count} medication${count > 1 ? 's' : ''} scheduled today.`,
          displayText: `Showing ${count} medication(s)`,
          priority: isUrgent ? "high" as const : "normal" as const
        };
      },

      'query_health': (data) => {
        // Handle missing health score (Requirement 6.5)
        if (data.healthScore === undefined || data.healthScore === null) {
          return {
            text: this.conservationMode
              ? `No health data for ${petName}. Want to add a health record?`
              : `I don't have any health data for ${petName} yet. Would you like to add a health record?`,
            displayText: `No health data available for ${petName}`,
            priority: "normal" as const
          };
        }
        return {
          text: isUrgent
            ? `Health score: ${data.healthScore}.`
            : `${petName}'s health score is ${data.healthScore}. Looking good!`,
          displayText: `Health Score: ${data.healthScore}/100`,
          priority: isUrgent ? "high" as const : "normal" as const
        };
      },

      'query_feeding': (data) => {
        // Handle empty feeding history (Requirement 6.5)
        if (!data.feedingLogs || data.feedingLogs.length === 0) {
          return {
            text: this.conservationMode
              ? `No feeding data for ${petName}. Want to log a feeding?`
              : `You haven't logged any feeding data for ${petName} yet. Would you like to add a feeding entry?`,
            displayText: `No feeding history found for ${petName}`,
            priority: "normal" as const
          };
        }
        
        // Requirement 6.6: Summarize key information for large result sets
        if (data.feedingLogs.length > 5) {
          const count = data.feedingLogs.length;
          const lastFeeding = data.feedingLogs[0];
          const lastTime = new Date(lastFeeding.timestamp || lastFeeding.time).toLocaleString('en-IN', { 
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit' 
          });
          
          return {
            text: isUrgent
              ? `${count} feedings logged. Last: ${lastTime}. Say "show more details" for all.`
              : `${petName} has ${count} feeding entries. The last feeding was ${lastFeeding.amount} ${lastFeeding.unit} at ${lastTime}. Say "show more details" to see the full history.`,
            displayText: `${count} feeding logs (summarized)`,
            priority: isUrgent ? "high" as const : "normal" as const
          };
        }
        
        const count = data.feedingLogs.length;
        const lastFeeding = data.feedingLogs[0];
        return {
          text: isUrgent
            ? `${count} feeding${count > 1 ? 's' : ''} logged.`
            : `${petName} has ${count} feeding${count > 1 ? 's' : ''} logged. Last feeding was ${lastFeeding.amount} ${lastFeeding.unit}.`,
          displayText: `Showing ${count} feeding log(s)`,
          priority: isUrgent ? "high" as const : "normal" as const
        };
      },

      'query_health_records': (data) => {
        // Handle empty health records (Requirement 6.5)
        if (!data.healthRecords || data.healthRecords.length === 0) {
          return {
            text: this.conservationMode
              ? `No health records for ${petName}. Want to add one?`
              : `${petName} doesn't have any health records yet. Would you like to add a health record?`,
            displayText: `No health records found for ${petName}`,
            priority: "normal" as const
          };
        }
        
        // Requirement 6.6: Summarize key information for large result sets
        if (data.healthRecords.length > 4) {
          const count = data.healthRecords.length;
          const latest = data.healthRecords[0];
          const latestDate = new Date(latest.date || latest.timestamp).toLocaleDateString('en-IN', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          });
          
          return {
            text: isUrgent
              ? `${count} health records. Latest: ${latestDate}. Say "show more details" for all.`
              : `${petName} has ${count} health records on file. The most recent one is from ${latestDate}. Say "show more details" to see all records.`,
            displayText: `${count} health records (summarized)`,
            priority: isUrgent ? "high" as const : "normal" as const
          };
        }
        
        const count = data.healthRecords.length;
        return {
          text: isUrgent
            ? `${count} health record${count > 1 ? 's' : ''} found.`
            : `${petName} has ${count} health record${count > 1 ? 's' : ''} on file.`,
          displayText: `Showing ${count} health record(s)`,
          priority: isUrgent ? "high" as const : "normal" as const
        };
      },

      // Requirement 6.6: Full details responses for "show more details" follow-up
      'show_full_appointments': (data) => {
        const count = data.appointments?.length || 0;
        return {
          text: isUrgent
            ? `Showing all ${count} appointments.`
            : `Here are all ${count} appointments for ${petName}.`,
          displayText: `All ${count} appointments`,
          priority: isUrgent ? "high" as const : "normal" as const
        };
      },

      'show_full_medications': (data) => {
        const count = data.medications?.length || 0;
        return {
          text: isUrgent
            ? `Showing all ${count} medications.`
            : `Here's the complete list of ${count} medications for ${petName}.`,
          displayText: `All ${count} medications`,
          priority: isUrgent ? "high" as const : "normal" as const
        };
      },

      'show_full_feeding': (data) => {
        const count = data.feedingLogs?.length || 0;
        return {
          text: isUrgent
            ? `Showing all ${count} feeding entries.`
            : `Here's the complete feeding history for ${petName} - ${count} entries.`,
          displayText: `All ${count} feeding logs`,
          priority: isUrgent ? "high" as const : "normal" as const
        };
      },

      'show_full_health_records': (data) => {
        const count = data.healthRecords?.length || 0;
        return {
          text: isUrgent
            ? `Showing all ${count} health records.`
            : `Here are all ${count} health records for ${petName}.`,
          displayText: `All ${count} health records`,
          priority: isUrgent ? "high" as const : "normal" as const
        };
      },

      // Scheduling responses with confirmation (Requirement 11.6)
      'schedule_appointment': (data) => {
        const date = data.date ? new Date(data.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'the scheduled date';
        const time = data.time || '';
        const clinic = data.clinic ? ` with ${data.clinic}` : '';
        
        return {
          text: this.conservationMode
            ? `Scheduled appointment for ${petName} on ${date}`
            : `I've scheduled a vet appointment for ${petName} on ${date} at ${time}${clinic}`,
          displayText: `Appointment: ${date} at ${time}${clinic}`,
          priority: isUrgent ? "high" as const : "normal" as const
        };
      },

      'cancel_appointment': () => ({
        text: isUrgent
          ? `Appointment cancelled.`
          : `Done! I've cancelled that appointment for ${petName}.`,
        priority: isUrgent ? "high" as const : "normal" as const
      }),

      // Bulk action responses
      'bulk_action': (data) => ({
        text: isUrgent
          ? `Applied to ${data.petCount} pets.`
          : `All done! I've updated ${data.petCount} pets.`,
        priority: isUrgent ? "high" as const : "normal" as const
      }),

      // Default response
      'default': () => ({
        text: isUrgent ? "Done." : "All set!",
        priority: isUrgent ? "high" as const : "normal" as const
      })
    };

    // Determine response type from result
    const responseType = this.determineResponseType(result);
    const templateFn = templates[responseType] || templates['default'];
    
    return templateFn(result.data, context);
  }

  /**
   * Compose failure response
   */
  private composeFailureResponse(result: CommandResult, context: ConversationContext): ResponseTemplate {
    return {
      text: result.message || "I couldn't complete that action. Please try again.",
      priority: "normal"
    };
  }

  /**
   * Shorten response for quota conservation
   * Requirement 15.3: Shorten responses when usage exceeds 8,000 characters
   */
  private shortenResponse(template: ResponseTemplate): ResponseTemplate {
    const text = template.text;
    
    // Remove pleasantries and filler words
    let shortened = text
      .replace(/^(Sure!|Great!|Perfect!|All set!|Got it!|Done!)\s*/i, '')
      .replace(/\s+(Looking good!|All done!)$/i, '')
      .replace(/I've |I'm /g, '')
      .trim();

    // If still too long, use more aggressive shortening
    if (shortened.length > 80) {
      // Extract key information only
      shortened = shortened
        .replace(/Could you |Can you |Please /gi, '')
        .replace(/\?$/,'?')
        .substring(0, 80);
    }

    return {
      ...template,
      text: shortened
    };
  }

  /**
   * Update conservation mode based on current usage
   * Requirement 3.5: Activate conservation at 80% quota
   */
  private async updateConservationMode(): Promise<void> {
    try {
      const stats = await elevenLabsClient.getUsageStats();
      this.conservationMode = stats.charactersUsed >= this.usageThreshold;
    } catch (error) {
      console.error('Error checking usage stats:', error);
      // Default to conservation mode on error to be safe
      this.conservationMode = true;
    }
  }

  /**
   * Determine response type from command result
   */
  private determineResponseType(result: CommandResult): string {
    // First check the message field directly (it may contain the response type identifier)
    const message = result.message.toLowerCase();
    
    // Requirement 6.6: Handle full details responses
    if (message === 'show_full_appointments') return 'show_full_appointments';
    if (message === 'show_full_medications') return 'show_full_medications';
    if (message === 'show_full_feeding') return 'show_full_feeding';
    if (message === 'show_full_health_records') return 'show_full_health_records';
    
    // Check for query type identifiers
    if (message === 'query_appointments') return 'query_appointments';
    if (message === 'query_medications') return 'query_medications';
    if (message === 'query_health') return 'query_health';
    if (message === 'query_health_records') return 'query_health_records';
    if (message === 'query_feeding') return 'query_feeding';
    if (message === 'log_feeding') return 'log_feeding';
    if (message === 'log_medication') return 'log_medication';
    if (message === 'log_weight') return 'log_weight';
    if (message === 'schedule_appointment') return 'schedule_appointment';
    if (message === 'cancel_appointment') return 'cancel_appointment';
    if (message === 'bulk_action') return 'bulk_action';
    if (message === 'navigate') return 'navigate';
    
    // Fall back to visual component if available
    if (result.visualComponent) {
      return result.visualComponent;
    }
    
    // Infer from message content (for backwards compatibility)
    if (message.includes('appointment')) {
      if (message.includes('cancel')) return 'cancel_appointment';
      if (message.includes('schedule')) return 'schedule_appointment';
      return 'query_appointments';
    }
    
    if (message.includes('medication')) return 'query_medications';
    if (message.includes('health score')) return 'query_health';
    if (message.includes('health record')) return 'query_health_records';
    if (message.includes('feeding') && message.includes('history')) return 'query_feeding';
    if (message.includes('feeding') && !message.includes('history')) return 'log_feeding';
    if (message.includes('weight')) return 'log_weight';
    if (message.includes('navigate')) return 'navigate';
    if (message.includes('bulk') || message.includes('all pets')) return 'bulk_action';

    return 'default';
  }

  /**
   * Detect error type from error object
   */
  private detectErrorType(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('quota') || message.includes('limit')) return 'quota_exceeded';
    if (message.includes('network') || message.includes('connection')) return 'network_error';
    if (message.includes('api') || message.includes('server')) return 'api_failure';
    if (message.includes('recognition') || message.includes('speech')) return 'recognition_failure';
    if (message.includes('invalid') || message.includes('unknown')) return 'invalid_command';
    
    return 'unknown';
  }

  /**
   * Detect clarification type from ambiguous intent
   */
  private detectClarificationType(intent: ParsedIntent): string {
    if (intent.ambiguities.length === 0) return 'unclear_intent';
    
    const firstAmbiguity = intent.ambiguities[0].toLowerCase();
    
    if (firstAmbiguity.includes('pet')) return 'multiple_pets';
    if (firstAmbiguity.includes('parameter') || firstAmbiguity.includes('missing')) return 'missing_parameter';
    if (firstAmbiguity.includes('action')) return 'ambiguous_action';
    
    return 'unclear_intent';
  }
}

// Export singleton instance
export const responseComposer = new ResponseComposerService();

// Factory function for creating response composer instances
export function createResponseComposer(): ResponseComposer {
  return new ResponseComposerService();
}
