/**
 * Help Command Handler
 * 
 * Handles "What can you do?" and "Help" voice commands.
 * Returns context-relevant command lists based on current page.
 * 
 * Requirement: 14.3
 * Feature: jojo-voice-assistant-enhanced
 */

import type { CommandResult, ConversationContext } from './types';

interface HelpResponse {
  commands: string[];
  categories: Record<string, string[]>;
  contextualTip: string;
}

/**
 * Get help response based on current context
 */
export const getHelpResponse = (context: ConversationContext): HelpResponse => {
  const currentPage = context.currentPage || '/dashboard';
  
  // Get context-specific commands
  const contextCommands = getContextSpecificCommands(currentPage);
  
  // Get general commands that work everywhere
  const generalCommands = [
    'Go to [page name] - Navigate to any dashboard section',
    'Go back - Return to previous page',
    'Show me my pets - View all registered pets',
    'What can you do? - Show this help message',
    'Help - Show voice assistant help',
  ];

  // Combine all commands
  const allCommands = [...contextCommands, ...generalCommands];

  // Group commands by category
  const categories = groupCommandsByCategory(contextCommands);

  // Get contextual tip
  const contextualTip = getContextualTip(currentPage);

  return {
    commands: allCommands,
    categories,
    contextualTip
  };
};

/**
 * Get commands specific to the current page
 */
const getContextSpecificCommands = (pathname: string): string[] => {
  // Dashboard section
  if (pathname === '/dashboard' || pathname === '/index') {
    return [
      'Show me my pets - View all your pets',
      'Show health summary for all pets - Get overview of all pets health',
      'What reminders do I have today? - View today\'s tasks',
      'Go to appointments - Navigate to appointments page',
      'Show feeding schedule - View feeding reminders',
    ];
  }

  // Appointments section
  if (pathname.includes('/appointments')) {
    return [
      'Schedule a vet appointment for [pet name] - Book new appointment',
      'When is [pet name]\'s next appointment? - Check upcoming appointments',
      'Cancel appointment for [pet name] on [date] - Remove scheduled appointment',
      'Show all appointments - View appointment calendar',
      'Find nearby vet clinics - Search for veterinary services',
    ];
  }

  // Health Records section
  if (pathname.includes('/health-records')) {
    return [
      'Show [pet name]\'s health records - View medical history',
      'What\'s [pet name]\'s health score? - Check current health status',
      'Record weight for [pet name] - [weight] kg - Log weight measurement',
      'Add vaccination record for [pet name] - Log new vaccination',
      'Show vaccination history - View all vaccinations',
    ];
  }

  // Voice Assistant section
  if (pathname.includes('/voice-assistant')) {
    return [
      'Log feeding for [pet name] - Record feeding activity',
      'What medications does [pet name] need today? - Check medication schedule',
      'Add medication reminder for [pet name] - Create new medication alert',
      'Show feeding history for [pet name] - View past feeding logs',
      'Log walk for [pet name] - Record exercise activity',
    ];
  }

  // Profile section
  if (pathname === '/profile') {
    return [
      'Add new pet - Register a new pet',
      'Edit [pet name]\'s profile - Update pet information',
      'Show my pets - View all registered pets',
      'Update my profile - Edit user settings',
      'Go to dashboard - Return to main dashboard',
    ];
  }

  // Vet Search section
  if (pathname === '/vet-search') {
    return [
      'Find vets near me - Search nearby veterinary clinics',
      'Show emergency vets - Find 24/7 emergency services',
      'Book appointment at [clinic name] - Schedule visit at specific clinic',
      'Show vet reviews - View clinic ratings',
      'Get directions to [clinic name] - Navigate to clinic',
    ];
  }

  // Community section
  if (pathname === '/community') {
    return [
      'Show pet care tips - View helpful articles',
      'What\'s today\'s tip? - Get daily pet care advice',
      'Show seasonal guide - View season-specific care tips',
      'Find grooming tips for [pet type] - Get breed-specific advice',
      'Go to dashboard - Return to main dashboard',
    ];
  }

  // Default commands
  return [
    'Show me my pets - View all your pets',
    'Go to appointments - Navigate to appointments',
    'Show health records - View medical history',
    'Schedule a vet appointment - Book new appointment',
    'Log feeding for [pet name] - Record feeding activity',
  ];
};

/**
 * Group commands by category
 */
const groupCommandsByCategory = (commands: string[]): Record<string, string[]> => {
  const categories: Record<string, string[]> = {
    'Navigation': [],
    'Data Entry': [],
    'Query': [],
    'Scheduling': [],
  };

  commands.forEach(cmd => {
    if (cmd.includes('Go to') || cmd.includes('Navigate') || cmd.includes('Show')) {
      if (cmd.includes('Show') && !cmd.includes('Navigate')) {
        categories['Query'].push(cmd);
      } else {
        categories['Navigation'].push(cmd);
      }
    } else if (cmd.includes('Log') || cmd.includes('Add') || cmd.includes('Record') || cmd.includes('Edit')) {
      categories['Data Entry'].push(cmd);
    } else if (cmd.includes('Schedule') || cmd.includes('Book') || cmd.includes('Cancel')) {
      categories['Scheduling'].push(cmd);
    } else if (cmd.includes('What') || cmd.includes('When') || cmd.includes('Find')) {
      categories['Query'].push(cmd);
    }
  });

  // Remove empty categories
  Object.keys(categories).forEach(key => {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  });

  return categories;
};

/**
 * Get contextual tip based on current page
 */
const getContextualTip = (pathname: string): string => {
  if (pathname === '/dashboard' || pathname === '/index') {
    return 'You\'re on the dashboard. Try saying "Show me my pets" or "What reminders do I have today?"';
  }

  if (pathname.includes('/appointments')) {
    return 'You\'re viewing appointments. Try saying "Schedule a vet appointment" or "When is my next appointment?"';
  }

  if (pathname.includes('/health-records')) {
    return 'You\'re viewing health records. Try saying "Show health records" or "Record weight for [pet name]"';
  }

  if (pathname.includes('/voice-assistant')) {
    return 'You\'re using the voice assistant. Try saying "Log feeding" or "What medications are due?"';
  }

  if (pathname === '/profile') {
    return 'You\'re on your profile. Try saying "Add new pet" or "Edit pet profile"';
  }

  if (pathname === '/vet-search') {
    return 'You\'re searching for vets. Try saying "Find vets near me" or "Show emergency vets"';
  }

  if (pathname === '/community') {
    return 'You\'re in the community section. Try saying "Show pet care tips" or "What\'s today\'s tip?"';
  }

  return 'Try saying "Go to [page name]" to navigate, or ask "What can you do?" for more help';
};

/**
 * Handle help command and return formatted response
 */
export const handleHelpCommand = (context: ConversationContext): CommandResult => {
  const helpResponse = getHelpResponse(context);
  
  // Format response text for TTS
  const responseText = formatHelpResponseForSpeech(helpResponse);
  
  // Format display text with categories
  const displayText = formatHelpResponseForDisplay(helpResponse);

  return {
    success: true,
    data: helpResponse,
    message: responseText,
    visualComponent: 'help-panel',
    requiresFollowUp: false,
    followUpPrompt: null
  };
};

/**
 * Format help response for speech output
 */
const formatHelpResponseForSpeech = (helpResponse: HelpResponse): string => {
  const categoryCount = Object.keys(helpResponse.categories).length;
  const commandCount = helpResponse.commands.length;

  let speech = `I can help you with ${commandCount} voice commands. `;
  
  // Add contextual tip
  speech += helpResponse.contextualTip + ' ';

  // List top 3 commands from each category
  const categories = Object.entries(helpResponse.categories);
  if (categories.length > 0) {
    speech += 'Here are some examples: ';
    
    categories.slice(0, 2).forEach(([category, commands], index) => {
      const topCommands = commands.slice(0, 2);
      speech += `For ${category.toLowerCase()}, you can say ${topCommands.map(cmd => {
        const commandText = cmd.split(' - ')[0];
        return `"${commandText}"`;
      }).join(' or ')}. `;
    });
  }

  speech += 'Say "Show help panel" to see all available commands.';

  return speech;
};

/**
 * Format help response for visual display
 */
const formatHelpResponseForDisplay = (helpResponse: HelpResponse): string => {
  let display = '**Available Voice Commands**\n\n';
  
  display += `_${helpResponse.contextualTip}_\n\n`;

  // List commands by category
  Object.entries(helpResponse.categories).forEach(([category, commands]) => {
    display += `**${category}:**\n`;
    commands.forEach(cmd => {
      display += `• ${cmd}\n`;
    });
    display += '\n';
  });

  return display;
};

/**
 * Check if a command is a help request
 */
export const isHelpCommand = (transcription: string): boolean => {
  const helpPatterns = [
    /what can you do/i,
    /what do you do/i,
    /help me/i,
    /^help$/i,
    /show help/i,
    /voice commands/i,
    /available commands/i,
    /how do i/i,
    /how can i/i,
  ];

  return helpPatterns.some(pattern => pattern.test(transcription));
};
