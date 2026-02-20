/**
 * VoiceCommandSuggestions Component
 * 
 * Provides context-aware voice command suggestions based on the current dashboard section.
 * Shows help command responses, hover tooltips for UI elements, and dynamic hints.
 * 
 * Requirements: 14.2, 14.3, 14.4, 14.5
 * Feature: jojo-voice-assistant-enhanced
 */

import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Mic } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface VoiceCommandSuggestionsProps {
  /** Whether to show the suggestions panel */
  isVisible?: boolean;
  /** Custom class name */
  className?: string;
  /** Callback when a suggestion is clicked */
  onSuggestionClick?: (command: string) => void;
}

interface CommandSuggestion {
  command: string;
  description: string;
  category: string;
}

/**
 * Get context-aware command suggestions based on current page
 */
const getContextAwareCommands = (pathname: string): CommandSuggestion[] => {
  // Dashboard section
  if (pathname === '/dashboard' || pathname === '/index') {
    return [
      { command: 'Show me my pets', description: 'View all your pets', category: 'Navigation' },
      { command: 'Show health score for [pet name]', description: 'View pet health score', category: 'Query' },
      { command: 'What\'s my pet\'s health score?', description: 'Check health status', category: 'Query' },
      { command: 'Show milestones for [pet name]', description: 'View pet achievements', category: 'Query' },
      { command: 'Show tips', description: 'Get daily pet care tips', category: 'Query' },
      { command: 'Add expense for [pet name]', description: 'Log pet expense', category: 'Data Entry' },
      { command: 'Emergency', description: 'Activate emergency SOS', category: 'Navigation' },
      { command: 'Go to appointments', description: 'Navigate to appointments page', category: 'Navigation' },
    ];
  }

  // Appointments section
  if (pathname === '/appointments' || pathname.includes('/appointments')) {
    return [
      { command: 'Schedule a vet appointment for [pet name]', description: 'Book new appointment', category: 'Scheduling' },
      { command: 'When is [pet name]\'s next appointment?', description: 'Check upcoming appointments', category: 'Query' },
      { command: 'Cancel appointment for [pet name] on [date]', description: 'Remove scheduled appointment', category: 'Scheduling' },
      { command: 'Show all appointments', description: 'View appointment calendar', category: 'Query' },
      { command: 'Find nearby vet clinics', description: 'Search for veterinary services', category: 'Navigation' },
    ];
  }

  // Health Records section
  if (pathname.includes('/health-records')) {
    return [
      { command: 'Show [pet name]\'s health records', description: 'View medical history', category: 'Query' },
      { command: 'What\'s [pet name]\'s health score?', description: 'Check current health status', category: 'Query' },
      { command: 'Record weight for [pet name] - [weight] kg', description: 'Log weight measurement', category: 'Data Entry' },
      { command: 'Add vaccination record for [pet name]', description: 'Log new vaccination', category: 'Data Entry' },
      { command: 'Show vaccination history', description: 'View all vaccinations', category: 'Query' },
    ];
  }

  // Voice Assistant section
  if (pathname.includes('/voice-assistant')) {
    return [
      { command: 'Log feeding for [pet name]', description: 'Record feeding activity', category: 'Data Entry' },
      { command: 'What medications does [pet name] need today?', description: 'Check medication schedule', category: 'Query' },
      { command: 'Add medication reminder for [pet name]', description: 'Create new medication alert', category: 'Data Entry' },
      { command: 'Show health score', description: 'View pet health score', category: 'Query' },
      { command: 'Show milestones', description: 'View pet achievements', category: 'Query' },
      { command: 'Add expense [amount] for [category]', description: 'Log pet expense', category: 'Data Entry' },
      { command: 'Emergency', description: 'Activate emergency SOS', category: 'Navigation' },
      { command: 'Show tips', description: 'Get pet care tips', category: 'Query' },
    ];
  }

  // Profile section
  if (pathname === '/profile') {
    return [
      { command: 'Add new pet', description: 'Register a new pet', category: 'Data Entry' },
      { command: 'Edit [pet name]\'s profile', description: 'Update pet information', category: 'Data Entry' },
      { command: 'Show my pets', description: 'View all registered pets', category: 'Query' },
      { command: 'Update my profile', description: 'Edit user settings', category: 'Data Entry' },
      { command: 'Go to dashboard', description: 'Return to main dashboard', category: 'Navigation' },
    ];
  }

  // Vet Search section
  if (pathname === '/vet-search') {
    return [
      { command: 'Find vets near me', description: 'Search nearby veterinary clinics', category: 'Query' },
      { command: 'Show emergency vets', description: 'Find 24/7 emergency services', category: 'Query' },
      { command: 'Book appointment at [clinic name]', description: 'Schedule visit at specific clinic', category: 'Scheduling' },
      { command: 'Show vet reviews', description: 'View clinic ratings', category: 'Query' },
      { command: 'Get directions to [clinic name]', description: 'Navigate to clinic', category: 'Navigation' },
    ];
  }

  // Community section
  if (pathname === '/community') {
    return [
      { command: 'Show pet care tips', description: 'View helpful articles', category: 'Query' },
      { command: 'What\'s today\'s tip?', description: 'Get daily pet care advice', category: 'Query' },
      { command: 'Show seasonal guide', description: 'View season-specific care tips', category: 'Query' },
      { command: 'Find grooming tips for [pet type]', description: 'Get breed-specific advice', category: 'Query' },
      { command: 'Go to dashboard', description: 'Return to main dashboard', category: 'Navigation' },
    ];
  }

  // Default/General commands
  return [
    { command: 'Show me my pets', description: 'View all your pets', category: 'Navigation' },
    { command: 'Go to appointments', description: 'Navigate to appointments', category: 'Navigation' },
    { command: 'Show health records', description: 'View medical history', category: 'Navigation' },
    { command: 'What can you do?', description: 'Get help with voice commands', category: 'Help' },
    { command: 'Go back', description: 'Navigate to previous page', category: 'Navigation' },
  ];
};

/**
 * Get general help commands that work everywhere
 */
const getGeneralHelpCommands = (): CommandSuggestion[] => {
  return [
    { command: 'What can you do?', description: 'List available voice commands', category: 'Help' },
    { command: 'Help', description: 'Show voice assistant help', category: 'Help' },
    { command: 'Go to [page name]', description: 'Navigate to any dashboard section', category: 'Navigation' },
    { command: 'Go back', description: 'Return to previous page', category: 'Navigation' },
    { command: 'Show me my pets', description: 'View all registered pets', category: 'Query' },
  ];
};

/**
 * VoiceCommandSuggestions Component
 * 
 * Displays context-aware voice command suggestions based on the current page.
 * Updates dynamically as the user navigates through different dashboard sections.
 */
export const VoiceCommandSuggestions: React.FC<VoiceCommandSuggestionsProps> = ({
  isVisible = true,
  className = '',
  onSuggestionClick
}) => {
  const location = useLocation();

  // Get context-aware commands based on current page
  const contextCommands = useMemo(() => {
    return getContextAwareCommands(location.pathname);
  }, [location.pathname]);

  // Get general help commands
  const helpCommands = useMemo(() => {
    return getGeneralHelpCommands();
  }, []);

  // Get page title for display
  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/index') return 'Dashboard';
    if (path.includes('/appointments')) return 'Appointments';
    if (path.includes('/health-records')) return 'Health Records';
    if (path.includes('/voice-assistant')) return 'Voice Assistant';
    if (path === '/profile') return 'Profile';
    if (path === '/vet-search') return 'Vet Search';
    if (path === '/community') return 'Community';
    return 'General';
  }, [location.pathname]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandSuggestion[]> = {};
    contextCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [contextCommands]);

  const handleSuggestionClick = (command: string) => {
    onSuggestionClick?.(command);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`${className}`}
      >
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-semibold text-sm text-foreground">
              Voice Commands for {pageTitle}
            </h4>
          </div>

          <Separator className="mb-3" />

          {/* Context-aware commands */}
          <div className="space-y-3">
            {Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category}>
                <Badge variant="secondary" className="mb-2 text-xs">
                  {category}
                </Badge>
                <div className="space-y-2">
                  {commands.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.command)}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full text-left p-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-gray-200 dark:border-gray-700 group"
                    >
                      <div className="flex items-start gap-2">
                        <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0 group-hover:animate-pulse" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            "{suggestion.command}"
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* General help section */}
          <Separator className="my-3" />
          <div>
            <Badge variant="outline" className="mb-2 text-xs">
              General Commands
            </Badge>
            <div className="space-y-1">
              {helpCommands.slice(0, 3).map((suggestion, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.command)}
                  whileHover={{ scale: 1.01 }}
                  className="w-full text-left px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  • {suggestion.command}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              💡 <strong>Tip:</strong> Say "What can you do?" or "Help" to see all available commands
            </p>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Get voice command hint for a UI element
 * Used for hover tooltips showing equivalent voice commands
 * 
 * Requirement: 14.5
 */
export const getVoiceCommandHint = (elementType: string, elementContext?: any): string | null => {
  const hints: Record<string, string> = {
    // Navigation elements
    'nav-dashboard': 'Say "Go to dashboard"',
    'nav-appointments': 'Say "Go to appointments"',
    'nav-health-records': 'Say "Show health records"',
    'nav-profile': 'Say "Go to profile"',
    'nav-community': 'Say "Go to community"',
    'nav-vet-search': 'Say "Find vets near me"',
    'nav-back': 'Say "Go back"',
    
    // Pet actions
    'pet-card': elementContext?.petName 
      ? `Say "Show me ${elementContext.petName}'s details"` 
      : 'Say "Show me [pet name]\'s details"',
    'add-pet': 'Say "Add new pet"',
    'edit-pet': elementContext?.petName 
      ? `Say "Edit ${elementContext.petName}'s profile"` 
      : 'Say "Edit [pet name]\'s profile"',
    
    // Health actions
    'health-score': elementContext?.petName 
      ? `Say "What's ${elementContext.petName}'s health score?"` 
      : 'Say "What\'s [pet name]\'s health score?"',
    'add-health-record': elementContext?.petName 
      ? `Say "Add health record for ${elementContext.petName}"` 
      : 'Say "Add health record for [pet name]"',
    'add-vaccination': elementContext?.petName 
      ? `Say "Add vaccination for ${elementContext.petName}"` 
      : 'Say "Add vaccination for [pet name]"',
    'add-weight': elementContext?.petName 
      ? `Say "Record weight for ${elementContext.petName}"` 
      : 'Say "Record weight for [pet name]"',
    
    // Appointment actions
    'schedule-appointment': elementContext?.petName 
      ? `Say "Schedule appointment for ${elementContext.petName}"` 
      : 'Say "Schedule a vet appointment"',
    'view-appointments': 'Say "Show all appointments"',
    'cancel-appointment': 'Say "Cancel appointment"',
    
    // Feeding actions
    'log-feeding': elementContext?.petName 
      ? `Say "Log feeding for ${elementContext.petName}"` 
      : 'Say "Log feeding for [pet name]"',
    'feeding-history': elementContext?.petName 
      ? `Say "Show feeding history for ${elementContext.petName}"` 
      : 'Say "Show feeding history"',
    
    // Medication actions
    'add-medication': elementContext?.petName 
      ? `Say "Add medication for ${elementContext.petName}"` 
      : 'Say "Add medication reminder"',
    'view-medications': elementContext?.petName 
      ? `Say "What medications does ${elementContext.petName} need?"` 
      : 'Say "Show medications"',
    
    // General actions
    'help': 'Say "What can you do?" or "Help"',
    'search': 'Say "Find [what you\'re looking for]"',
  };

  return hints[elementType] || null;
};

export default VoiceCommandSuggestions;
