/**
 * Voice Integration Setup
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Initializes voice control integration with dashboard components.
 * Sets up command handlers and dashboard actions.
 * 
 * Requirements: 20.1, 20.3, 20.4
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { commandRouter } from './commandRouter';
import { dashboardActions } from './dashboardActions';
import {
  NavigationHandler,
  DataEntryHandler,
  QueryHandler,
  SchedulingHandler,
  BulkActionHandler,
} from './handlers';
import { CommandAction } from './types';

/**
 * Hook to initialize voice integration
 * Must be called from a component that has access to React Router
 */
export const useVoiceIntegration = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize dashboard actions with navigation
    dashboardActions.setNavigate(navigate);

    // Register command handlers if not already registered
    if (!commandRouter.hasHandler(CommandAction.NAVIGATE)) {
      const navigationHandler = new NavigationHandler(dashboardActions);
      commandRouter.registerHandler(CommandAction.NAVIGATE, navigationHandler);
    }

    if (!commandRouter.hasHandler(CommandAction.LOG_DATA)) {
      const dataEntryHandler = new DataEntryHandler(dashboardActions);
      commandRouter.registerHandler(CommandAction.LOG_DATA, dataEntryHandler);
    }

    if (!commandRouter.hasHandler(CommandAction.QUERY)) {
      const queryHandler = new QueryHandler(dashboardActions);
      commandRouter.registerHandler(CommandAction.QUERY, queryHandler);
    }

    if (!commandRouter.hasHandler(CommandAction.SCHEDULE)) {
      const schedulingHandler = new SchedulingHandler(dashboardActions);
      commandRouter.registerHandler(CommandAction.SCHEDULE, schedulingHandler);
    }

    if (!commandRouter.hasHandler(CommandAction.BULK_ACTION)) {
      const bulkActionHandler = new BulkActionHandler(dashboardActions);
      commandRouter.registerHandler(CommandAction.BULK_ACTION, bulkActionHandler);
    }

    // Cleanup is not needed as handlers persist across navigation
  }, [navigate]);
};

/**
 * Initialize voice integration without React hooks
 * Use this in non-React contexts or when you have navigate function directly
 */
export const initializeVoiceIntegration = (navigate: any) => {
  // Initialize dashboard actions with navigation
  dashboardActions.setNavigate(navigate);

  // Register command handlers
  const navigationHandler = new NavigationHandler(dashboardActions);
  commandRouter.registerHandler(CommandAction.NAVIGATE, navigationHandler);

  const dataEntryHandler = new DataEntryHandler(dashboardActions);
  commandRouter.registerHandler(CommandAction.LOG_DATA, dataEntryHandler);

  const queryHandler = new QueryHandler(dashboardActions);
  commandRouter.registerHandler(CommandAction.QUERY, queryHandler);

  const schedulingHandler = new SchedulingHandler(dashboardActions);
  commandRouter.registerHandler(CommandAction.SCHEDULE, schedulingHandler);

  const bulkActionHandler = new BulkActionHandler(dashboardActions);
  commandRouter.registerHandler(CommandAction.BULK_ACTION, bulkActionHandler);
};

export default useVoiceIntegration;
