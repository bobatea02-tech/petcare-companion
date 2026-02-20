/**
 * Context Sync Manager Usage Examples
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Demonstrates how to use ContextSyncManager for bidirectional synchronization
 * between manual Dashboard interactions and voice commands.
 */

import { ContextManager } from './contextManager';
import { ContextSyncManager, DashboardEventType } from './contextSyncManager';

// ============================================================================
// Example 1: Basic Setup and Initialization
// ============================================================================

function example1_BasicSetup() {
  console.log('=== Example 1: Basic Setup ===\n');

  // Create context manager
  const contextManager = new ContextManager('/dashboard');

  // Create sync manager
  const syncManager = new ContextSyncManager(contextManager);

  // Initialize sync manager
  syncManager.initialize();

  // Check status
  const status = syncManager.getSyncStatus();
  console.log('Sync Manager Status:', status);
  console.log('Initialized:', status.initialized);
  console.log('Current Page:', status.currentPage);
  console.log();
}

// ============================================================================
// Example 2: Tracking Manual Navigation
// ============================================================================

function example2_ManualNavigation() {
  console.log('=== Example 2: Manual Navigation ===\n');

  const contextManager = new ContextManager('/');
  const syncManager = new ContextSyncManager(contextManager);
  syncManager.initialize();

  // User clicks on "Appointments" in navigation menu
  console.log('User navigates to appointments page...');
  syncManager.handleNavigation('/appointments');

  // Check context update
  const context = contextManager.getContext();
  console.log('Context updated - Current page:', context.currentPage);

  // User navigates to specific pet's health records
  console.log('\nUser navigates to pet health records...');
  syncManager.handleNavigation('/pet/123/health', { petId: '123' });

  // Voice commands now know the user is viewing pet 123's health records
  console.log('Context aware of pet ID:', context.previousIntents[0]?.parameters.petId);
  console.log();
}

// ============================================================================
// Example 3: Tracking Pet Selection
// ============================================================================

function example3_PetSelection() {
  console.log('=== Example 3: Pet Selection ===\n');

  const contextManager = new ContextManager('/');
  const syncManager = new ContextSyncManager(contextManager);
  syncManager.initialize();

  // User clicks on pet card for "Buddy"
  console.log('User selects pet: Buddy (ID: 456)');
  syncManager.handlePetSelection('456', 'Buddy');

  // Check context update
  const activePet = contextManager.getActivePet();
  console.log('Active pet in context:', activePet);

  // Now voice commands like "show his medications" will resolve to Buddy
  console.log('Voice commands will now reference Buddy by default');

  // User selects different pet
  console.log('\nUser selects pet: Max (ID: 789)');
  syncManager.handlePetSelection('789', 'Max');

  console.log('Active pet updated to:', contextManager.getActivePet());
  console.log();
}

// ============================================================================
// Example 4: Tracking Manual Data Entry
// ============================================================================

function example4_ManualDataEntry() {
  console.log('=== Example 4: Manual Data Entry ===\n');

  const contextManager = new ContextManager('/');
  const syncManager = new ContextSyncManager(contextManager);
  syncManager.initialize();

  // User manually logs feeding via form
  console.log('User logs feeding for pet 123...');
  const feedingData = {
    amount: 2,
    unit: 'cups',
    foodType: 'dry food',
    time: new Date(),
  };
  syncManager.handleDataEntry('feeding', '123', feedingData);

  // Context now knows about this feeding entry
  const context = contextManager.getContext();
  const lastIntent = context.previousIntents[context.previousIntents.length - 1];
  console.log('Last intent action:', lastIntent.action);
  console.log('Last intent target:', lastIntent.target);
  console.log('Feeding amount:', lastIntent.parameters.amount);

  // User logs medication
  console.log('\nUser logs medication for pet 123...');
  const medicationData = {
    name: 'Heartgard',
    dosage: '1 tablet',
    time: new Date(),
  };
  syncManager.handleDataEntry('medication', '123', medicationData);

  console.log('Context updated with medication entry');
  console.log('Total intents in context:', context.previousIntents.length);
  console.log();
}

// ============================================================================
// Example 5: Voice Command Data Updates
// ============================================================================

function example5_VoiceCommandUpdates() {
  console.log('=== Example 5: Voice Command Data Updates ===\n');

  const contextManager = new ContextManager('/');
  const syncManager = new ContextSyncManager(contextManager);
  syncManager.initialize();

  // Subscribe to data changes (simulating multiple views)
  const appointmentsView: any[] = [];
  const calendarView: any[] = [];
  const dashboardView: any[] = [];

  syncManager.onDataChange(event => appointmentsView.push(event));
  syncManager.onDataChange(event => calendarView.push(event));
  syncManager.onDataChange(event => dashboardView.push(event));

  // Voice command creates new appointment
  console.log('Voice command: "Schedule appointment for Buddy tomorrow at 3 PM"');
  syncManager.notifyDataChange('appointment', '999', 'create', {
    petId: '456',
    petName: 'Buddy',
    date: new Date('2024-01-15'),
    time: '15:00',
    clinic: 'Pet Clinic',
    reason: 'Checkup',
  });

  // All views receive the update
  console.log('\nAppointments view received update:', appointmentsView.length > 0);
  console.log('Calendar view received update:', calendarView.length > 0);
  console.log('Dashboard view received update:', dashboardView.length > 0);

  console.log('\nUpdate details:');
  console.log('Entity type:', appointmentsView[0].entityType);
  console.log('Entity ID:', appointmentsView[0].entityId);
  console.log('Change type:', appointmentsView[0].changeType);
  console.log('Pet name:', appointmentsView[0].data.petName);
  console.log();
}

// ============================================================================
// Example 6: Event Listeners
// ============================================================================

function example6_EventListeners() {
  console.log('=== Example 6: Event Listeners ===\n');

  const contextManager = new ContextManager('/');
  const syncManager = new ContextSyncManager(contextManager);
  syncManager.initialize();

  // Subscribe to navigation events
  const unsubscribeNav = syncManager.addEventListener(
    DashboardEventType.NAVIGATION,
    (event) => {
      console.log('Navigation event:', event.data.page);
    }
  );

  // Subscribe to pet selection events
  const unsubscribePet = syncManager.addEventListener(
    DashboardEventType.PET_SELECTION,
    (event) => {
      console.log('Pet selected:', event.data.petName);
    }
  );

  // Trigger some events
  syncManager.handleNavigation('/appointments');
  syncManager.handlePetSelection('123', 'Buddy');
  syncManager.handleNavigation('/health-records');

  // Unsubscribe
  console.log('\nUnsubscribing from events...');
  unsubscribeNav();
  unsubscribePet();

  // These won't trigger listeners
  syncManager.handleNavigation('/medications');
  console.log('Navigation after unsubscribe (no listener output)');
  console.log();
}

// ============================================================================
// Example 7: Cross-Tab Synchronization
// ============================================================================

function example7_CrossTabSync() {
  console.log('=== Example 7: Cross-Tab Synchronization ===\n');

  const contextManager = new ContextManager('/');
  const syncManager = new ContextSyncManager(contextManager);
  syncManager.initialize();

  // User selects pet in Tab 1
  console.log('Tab 1: User selects Buddy');
  syncManager.handlePetSelection('456', 'Buddy');
  syncManager.persistActivePet('Buddy');

  // Simulate Tab 2 syncing from localStorage
  console.log('\nTab 2: Syncing from Dashboard state...');
  const contextManager2 = new ContextManager('/');
  const syncManager2 = new ContextSyncManager(contextManager2);
  syncManager2.initialize();
  syncManager2.syncFromDashboard();

  console.log('Tab 2 active pet:', contextManager2.getActivePet());
  console.log('Tabs are now in sync!');

  // Clean up
  syncManager.clearPersistedActivePet();
  console.log();
}

// ============================================================================
// Example 8: React Component Integration
// ============================================================================

function example8_ReactIntegration() {
  console.log('=== Example 8: React Component Integration ===\n');

  console.log('Example React component code:\n');

  const exampleCode = `
// PetCard Component
import { syncManager } from './services/voice';

function PetCard({ pet }) {
  const handleClick = () => {
    // Track manual pet selection
    syncManager.handlePetSelection(pet.id, pet.name);
    
    // Navigate to pet profile
    navigate(\`/pet/\${pet.id}\`);
  };

  return (
    <div onClick={handleClick}>
      <h3>{pet.name}</h3>
      <p>{pet.type}</p>
    </div>
  );
}

// AppointmentsView Component
import { useEffect, useState } from 'react';
import { syncManager } from './services/voice';

function AppointmentsView() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    // Subscribe to data changes
    const unsubscribe = syncManager.onDataChange((event) => {
      if (event.entityType === 'appointment') {
        // Refresh appointments when voice command modifies data
        fetchAppointments();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      {appointments.map(apt => (
        <AppointmentCard key={apt.id} appointment={apt} />
      ))}
    </div>
  );
}

// App Component with Navigation Tracking
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { syncManager } from './services/voice';

function App() {
  const location = useLocation();

  useEffect(() => {
    // Track navigation for context updates
    syncManager.handleNavigation(location.pathname);
  }, [location]);

  return <Routes>...</Routes>;
}
  `;

  console.log(exampleCode);
  console.log();
}

// ============================================================================
// Example 9: Complete Workflow
// ============================================================================

function example9_CompleteWorkflow() {
  console.log('=== Example 9: Complete Workflow ===\n');

  const contextManager = new ContextManager('/');
  const syncManager = new ContextSyncManager(contextManager);
  syncManager.initialize();

  // Set up view listeners
  const updates: string[] = [];
  syncManager.onDataChange(event => {
    updates.push(`${event.changeType} ${event.entityType} ${event.entityId}`);
  });

  console.log('Step 1: User navigates to dashboard');
  syncManager.handleNavigation('/dashboard');

  console.log('Step 2: User selects pet "Buddy"');
  syncManager.handlePetSelection('456', 'Buddy');

  console.log('Step 3: User manually logs feeding');
  syncManager.handleDataEntry('feeding', '456', {
    amount: 2,
    unit: 'cups',
    time: new Date(),
  });

  console.log('Step 4: User says "Schedule vet appointment for tomorrow"');
  syncManager.notifyDataChange('appointment', '999', 'create', {
    petId: '456',
    date: new Date(),
  });

  console.log('Step 5: User navigates to appointments page');
  syncManager.handleNavigation('/appointments');

  console.log('Step 6: User says "Cancel that appointment"');
  syncManager.notifyDataChange('appointment', '999', 'delete', {});

  // Check final state
  const context = contextManager.getContext();
  console.log('\nFinal State:');
  console.log('Active pet:', context.activePet);
  console.log('Current page:', context.currentPage);
  console.log('Intent history:', context.previousIntents.length);
  console.log('Data updates broadcast:', updates.length);
  console.log('Updates:', updates);
  console.log();
}

// ============================================================================
// Run All Examples
// ============================================================================

export function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Context Sync Manager - Usage Examples                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  example1_BasicSetup();
  example2_ManualNavigation();
  example3_PetSelection();
  example4_ManualDataEntry();
  example5_VoiceCommandUpdates();
  example6_EventListeners();
  example7_CrossTabSync();
  example8_ReactIntegration();
  example9_CompleteWorkflow();

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     All Examples Completed                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
}

// Uncomment to run examples
// runAllExamples();
