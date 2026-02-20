/**
 * Navigation Command Handler
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Handles voice commands for dashboard navigation
 * Requirements: 4.1, 4.5, 4.6
 */

import {
  CommandHandler,
  ParsedIntent,
  ConversationContext,
  CommandResult,
} from '../types';

export class NavigationHandler implements CommandHandler {
  /**
   * Execute navigation command
   */
  async execute(
    intent: ParsedIntent,
    context: ConversationContext
  ): Promise<CommandResult> {
    const { target, parameters } = intent;

    try {
      // Map voice targets to actual routes
      const routeMap: Record<string, string> = {
        // Appointments
        'appointments': '/appointments',
        'appointment': '/appointments',
        'vet_appointments': '/appointments',
        'book_appointment': '/appointments',
        
        // Health Records
        'health': '/health-records',
        'health_records': '/health-records',
        'medical_records': '/health-records',
        'records': '/health-records',
        
        // Medication
        'medication': '/medications',
        'medications': '/medications',
        'medication_tracker': '/medications',
        'meds': '/medications',
        
        // Feeding
        'feeding': '/feeding',
        'feeding_schedule': '/feeding',
        'food': '/feeding',
        
        // Pets
        'pets': '/dashboard',
        'all_pets': '/dashboard',
        'pet_list': '/dashboard',
        'my_pets': '/dashboard',
        
        // Dashboard/Home
        'dashboard': '/dashboard',
        'home': '/dashboard',
        'main': '/dashboard',
        
        // Profile
        'profile': '/profile',
        'my_profile': '/profile',
        'account': '/profile',
        
        // Community
        'community': '/community',
        'social': '/community',
        'forum': '/community',
        
        // Messages
        'messages': '/messages',
        'inbox': '/messages',
        'chat': '/messages',
        
        // Vet Search
        'vet_search': '/vet-search',
        'find_vet': '/vet-search',
        'search_vets': '/vet-search',
        'veterinarian': '/vet-search',
        
        // Emergency
        'emergency': '/emergency',
        'sos': '/emergency',
        'urgent': '/emergency',
        
        // Milestones
        'milestones': '/milestones',
        'achievements': '/milestones',
        'progress': '/milestones',
        
        // Tips
        'tips': '/tips',
        'care_tips': '/tips',
        'advice': '/tips',
        
        // Expenses
        'expenses': '/expenses',
        'expense_tracker': '/expenses',
        'budget': '/expenses',
        'spending': '/expenses',
        
        // Profile Sharing
        'profile_sharing': '/profile-sharing',
        'share_profile': '/profile-sharing',
        'qr_code': '/profile-sharing',
      };

      // Handle "go back" command
      if (target === 'back' || target === 'previous') {
        window.history.back();
        return {
          success: true,
          data: { action: 'back' },
          message: 'Going back to previous page',
          visualComponent: null,
          requiresFollowUp: false,
          followUpPrompt: null,
        };
      }

      // Handle pet-specific navigation
      if (parameters.petId || parameters.petName) {
        const petIdentifier = parameters.petId || parameters.petName;
        const route = routeMap[target] || '/dashboard';
        const fullRoute = `${route}?pet=${encodeURIComponent(petIdentifier)}`;
        
        window.location.href = fullRoute;
        
        return {
          success: true,
          data: { route: fullRoute, pet: petIdentifier },
          message: `Navigating to ${target} for ${petIdentifier}`,
          visualComponent: null,
          requiresFollowUp: false,
          followUpPrompt: null,
        };
      }

      // Handle general navigation
      const route = routeMap[target];
      
      if (!route) {
        return {
          success: false,
          data: null,
          message: `I don't know how to navigate to "${target}". Try saying "Go to appointments" or "Show all pets"`,
          visualComponent: null,
          requiresFollowUp: false,
          followUpPrompt: null,
        };
      }

      window.location.href = route;

      return {
        success: true,
        data: { route },
        message: `Navigating to ${target}`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to navigate: ${error instanceof Error ? error.message : 'Unknown error'}`,
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null,
      };
    }
  }

  /**
   * Check if command can be executed
   */
  canExecute(intent: ParsedIntent): boolean {
    // Navigation commands always have a target
    return !!intent.target;
  }

  /**
   * Get required parameters for navigation
   */
  getRequiredParameters(): string[] {
    return ['target'];
  }
}
