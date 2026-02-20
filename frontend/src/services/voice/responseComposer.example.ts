/**
 * ResponseComposer Service - Usage Examples
 * Feature: jojo-voice-assistant-enhanced
 * 
 * This file demonstrates how to use the ResponseComposer service
 * for generating natural language responses.
 */

import { responseComposer } from './responseComposer';
import { 
  CommandResult, 
  ConversationContext, 
  ParsedIntent, 
  CommandAction 
} from './types';

// ============================================================================
// Example 1: Success Response - Feeding Log
// ============================================================================

export function exampleFeedingLogResponse() {
  const result: CommandResult = {
    success: true,
    data: {
      petName: "Buddy",
      amount: 2,
      unit: "cups",
      time: "6 PM",
      foodType: "dry food"
    },
    message: "Feeding logged successfully",
    visualComponent: "log_feeding",
    requiresFollowUp: false,
    followUpPrompt: null
  };

  const context: ConversationContext = {
    activePet: "Buddy",
    previousIntents: [],
    currentPage: "/dashboard",
    recentEntities: []
  };

  const response = responseComposer.composeResponse(result, context);
  
  console.log("Feeding Log Response:");
  console.log("Text:", response.text);
  // Normal mode: "Got it! I've logged Buddy's feeding."
  // Conservation mode: "Logged feeding for Buddy."
  console.log("Display:", response.displayText);
  console.log("Priority:", response.priority);
}

// ============================================================================
// Example 2: Query Response - Appointments
// ============================================================================

export function exampleAppointmentQueryResponse() {
  const result: CommandResult = {
    success: true,
    data: {
      appointments: [
        {
          id: "1",
          petId: "buddy-123",
          date: "Tomorrow",
          time: "3 PM",
          clinic: "Mumbai Vet Clinic",
          reason: "Annual checkup"
        },
        {
          id: "2",
          petId: "buddy-123",
          date: "Next week",
          time: "10 AM",
          clinic: "Pet Care Center",
          reason: "Vaccination"
        }
      ]
    },
    message: "Appointments retrieved",
    visualComponent: "query_appointments",
    requiresFollowUp: false,
    followUpPrompt: null
  };

  const context: ConversationContext = {
    activePet: "Buddy",
    previousIntents: [],
    currentPage: "/appointments",
    recentEntities: []
  };

  const response = responseComposer.composeResponse(result, context);
  
  console.log("Appointment Query Response:");
  console.log("Text:", response.text);
  // Normal mode: "Buddy's next appointment is Tomorrow at 3 PM at Mumbai Vet Clinic."
  // Urgent mode: "Next appointment: Tomorrow at 3 PM."
  console.log("Visual Data:", response.visualData);
}

// ============================================================================
// Example 3: Error Response - API Failure
// ============================================================================

export function exampleErrorResponse() {
  const error = new Error("ElevenLabs API error: 503 Service Unavailable");
  
  const context: ConversationContext = {
    activePet: "Buddy",
    previousIntents: [],
    currentPage: "/dashboard",
    recentEntities: []
  };

  const response = responseComposer.composeErrorResponse(error, context);
  
  console.log("Error Response:");
  console.log("Text:", response.text);
  // "I'm having trouble right now. Please try again."
  console.log("Priority:", response.priority);
}

// ============================================================================
// Example 4: Confirmation Request - Cancellation
// ============================================================================

export function exampleConfirmationRequest() {
  const intent: ParsedIntent = {
    intentId: "cancel-123",
    action: CommandAction.CANCEL,
    target: "appointment",
    parameters: {
      appointmentId: "appt-456",
      petName: "Buddy"
    },
    confidence: 0.85,
    requiresConfirmation: true,
    priority: "high",
    entities: [],
    ambiguities: []
  };

  const response = responseComposer.composeConfirmation(intent);
  
  console.log("Confirmation Request:");
  console.log("Text:", response.text);
  // Normal mode: "This will cancel the item. Are you sure?"
  // Conservation mode: "Cancel this?"
  console.log("Priority:", response.priority);
}

// ============================================================================
// Example 5: Clarification Question - Multiple Pets
// ============================================================================

export function exampleClarificationQuestion() {
  const ambiguousIntent: ParsedIntent = {
    intentId: "query-789",
    action: CommandAction.QUERY,
    target: "appointments",
    parameters: {},
    confidence: 0.6,
    requiresConfirmation: false,
    priority: "normal",
    entities: [],
    ambiguities: ["Buddy", "Max", "Luna"]
  };

  const response = responseComposer.composeClarification(ambiguousIntent);
  
  console.log("Clarification Question:");
  console.log("Text:", response.text);
  // Normal mode: "I found multiple pets. Did you mean Buddy, Max, Luna?"
  // Conservation mode: "Which pet: Buddy, Max, Luna?"
}

// ============================================================================
// Example 6: Urgent Response - High Priority
// ============================================================================

export function exampleUrgentResponse() {
  const result: CommandResult = {
    success: true,
    data: {
      petName: "Buddy",
      medicationName: "Antibiotics",
      dosage: "500mg",
      priority: "urgent" // Mark as urgent
    },
    message: "Medication logged",
    visualComponent: "log_medication",
    requiresFollowUp: false,
    followUpPrompt: null
  };

  const context: ConversationContext = {
    activePet: "Buddy",
    previousIntents: [],
    currentPage: "/medications",
    recentEntities: []
  };

  const response = responseComposer.composeResponse(result, context);
  
  console.log("Urgent Response:");
  console.log("Text:", response.text);
  // Urgent mode: "Logged Antibiotics for Buddy."
  // (Direct, action-oriented, no pleasantries)
  console.log("Priority:", response.priority);
}

// ============================================================================
// Example 7: Empty Query Results
// ============================================================================

export function exampleEmptyQueryResponse() {
  const result: CommandResult = {
    success: true,
    data: {
      appointments: [] // No appointments
    },
    message: "No appointments found",
    visualComponent: "query_appointments",
    requiresFollowUp: false,
    followUpPrompt: null
  };

  const context: ConversationContext = {
    activePet: "Buddy",
    previousIntents: [],
    currentPage: "/appointments",
    recentEntities: []
  };

  const response = responseComposer.composeResponse(result, context);
  
  console.log("Empty Query Response:");
  console.log("Text:", response.text);
  // "Buddy has no upcoming appointments."
}

// ============================================================================
// Example 8: Bulk Action Response
// ============================================================================

export function exampleBulkActionResponse() {
  const result: CommandResult = {
    success: true,
    data: {
      petCount: 3,
      action: "feeding",
      amount: 2,
      unit: "cups"
    },
    message: "Bulk feeding logged",
    visualComponent: "bulk_action",
    requiresFollowUp: false,
    followUpPrompt: null
  };

  const context: ConversationContext = {
    activePet: null, // No specific pet
    previousIntents: [],
    currentPage: "/dashboard",
    recentEntities: []
  };

  const response = responseComposer.composeResponse(result, context);
  
  console.log("Bulk Action Response:");
  console.log("Text:", response.text);
  // Normal mode: "All done! I've updated 3 pets."
  // Urgent mode: "Applied to 3 pets."
}

// ============================================================================
// Example 9: Quota Exceeded Error
// ============================================================================

export function exampleQuotaExceededError() {
  const error = new Error("Monthly character quota exceeded");
  
  const context: ConversationContext = {
    activePet: "Buddy",
    previousIntents: [],
    currentPage: "/dashboard",
    recentEntities: []
  };

  const response = responseComposer.composeErrorResponse(error, context);
  
  console.log("Quota Exceeded Error:");
  console.log("Text:", response.text);
  // "I've reached my voice limit for this month. I'll show you the information instead."
  console.log("Display:", response.displayText);
  // "Voice quota exceeded. Displaying text response."
}

// ============================================================================
// Example 10: Health Score Query with Visual Data
// ============================================================================

export function exampleHealthScoreResponse() {
  const result: CommandResult = {
    success: true,
    data: {
      petName: "Buddy",
      healthScore: 85,
      lastCheckup: "2024-01-10",
      trends: {
        weight: [20, 21, 21.5, 22],
        activity: [80, 85, 82, 88]
      }
    },
    message: "Health score retrieved",
    visualComponent: "query_health",
    requiresFollowUp: false,
    followUpPrompt: null
  };

  const context: ConversationContext = {
    activePet: "Buddy",
    previousIntents: [],
    currentPage: "/health",
    recentEntities: []
  };

  const response = responseComposer.composeResponse(result, context);
  
  console.log("Health Score Response:");
  console.log("Text:", response.text);
  // Normal mode: "Buddy's health score is 85. Looking good!"
  // Urgent mode: "Health score: 85."
  console.log("Display:", response.displayText);
  // "Health Score: 85/100"
  console.log("Visual Data:", response.visualData);
  // Includes trends for chart display
}

// ============================================================================
// Run All Examples
// ============================================================================

export function runAllExamples() {
  console.log("=".repeat(80));
  console.log("ResponseComposer Service - Usage Examples");
  console.log("=".repeat(80));
  console.log();

  exampleFeedingLogResponse();
  console.log();
  
  exampleAppointmentQueryResponse();
  console.log();
  
  exampleErrorResponse();
  console.log();
  
  exampleConfirmationRequest();
  console.log();
  
  exampleClarificationQuestion();
  console.log();
  
  exampleUrgentResponse();
  console.log();
  
  exampleEmptyQueryResponse();
  console.log();
  
  exampleBulkActionResponse();
  console.log();
  
  exampleQuotaExceededError();
  console.log();
  
  exampleHealthScoreResponse();
  console.log();
  
  console.log("=".repeat(80));
  console.log("All examples completed!");
  console.log("=".repeat(80));
}

// Uncomment to run examples:
// runAllExamples();
