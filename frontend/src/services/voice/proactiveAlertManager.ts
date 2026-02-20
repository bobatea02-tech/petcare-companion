/**
 * Proactive Alert Manager Service
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Manages proactive voice alerts for reminders and notifications.
 * Implements scheduling, triggering, and acknowledgment handling for:
 * - Medication reminders
 * - Appointment reminders
 * - Feeding overdue alerts
 * - Health check reminders
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.5, 7.6
 */

import { ProactiveAlertManager, ProactiveAlert, AlertType } from './types';

class ProactiveAlertManagerImpl implements ProactiveAlertManager {
  private alerts: Map<string, ProactiveAlert> = new Map();
  private alertQueue: ProactiveAlert[] = [];
  private checkInterval: number | null = null;
  private isUserActive: boolean = true;
  private onAlertCallback: ((alert: ProactiveAlert) => Promise<void>) | null = null;

  constructor() {
    this.loadAlertsFromStorage();
    this.startMonitoring();
    this.setupActivityTracking();
  }

  /**
   * Schedule a proactive alert
   * Stores alert and persists to localStorage
   */
  scheduleAlert(alert: ProactiveAlert): void {
    this.alerts.set(alert.id, alert);
    this.persistAlerts();
    console.log(`[ProactiveAlertManager] Scheduled alert: ${alert.id} for ${alert.scheduledTime}`);
  }

  /**
   * Cancel a scheduled alert
   */
  cancelAlert(alertId: string): void {
    if (this.alerts.has(alertId)) {
      this.alerts.delete(alertId);
      this.persistAlerts();
      console.log(`[ProactiveAlertManager] Cancelled alert: ${alertId}`);
    }

    // Also remove from queue if present
    this.alertQueue = this.alertQueue.filter(alert => alert.id !== alertId);
  }

  /**
   * Trigger an alert immediately
   * Bypasses scheduling and fires the alert right away
   */
  async triggerAlert(alert: ProactiveAlert): Promise<void> {
    console.log(`[ProactiveAlertManager] Triggering alert immediately: ${alert.id}`);
    
    if (this.onAlertCallback) {
      try {
        await this.onAlertCallback(alert);
      } catch (error) {
        console.error(`[ProactiveAlertManager] Error triggering alert:`, error);
      }
    } else {
      console.warn(`[ProactiveAlertManager] No alert callback registered`);
    }
  }

  /**
   * Get all pending alerts
   */
  getPendingAlerts(): ProactiveAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Mark an alert as acknowledged
   * Removes it from scheduled alerts
   */
  acknowledgeAlert(alertId: string): void {
    this.cancelAlert(alertId);
    console.log(`[ProactiveAlertManager] Alert acknowledged: ${alertId}`);
  }

  /**
   * Register callback for when alerts are triggered
   */
  onAlert(callback: (alert: ProactiveAlert) => Promise<void>): void {
    this.onAlertCallback = callback;
  }

  /**
   * Start monitoring for due alerts
   * Checks every minute for alerts that need to be triggered
   */
  private startMonitoring(): void {
    // Check every minute (60000ms)
    this.checkInterval = window.setInterval(() => {
      this.checkDueAlerts();
    }, 60000);

    // Also check immediately
    this.checkDueAlerts();
  }

  /**
   * Stop monitoring (cleanup)
   */
  stopMonitoring(): void {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check for alerts that are due and trigger them
   */
  private checkDueAlerts(): void {
    const now = new Date();
    const dueAlerts: ProactiveAlert[] = [];

    this.alerts.forEach((alert) => {
      if (alert.scheduledTime <= now) {
        dueAlerts.push(alert);
      }
    });

    if (dueAlerts.length === 0) {
      return;
    }

    console.log(`[ProactiveAlertManager] Found ${dueAlerts.length} due alerts`);

    // Sort by priority (high > normal > low)
    dueAlerts.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Process alerts based on user activity
    if (this.isUserActive) {
      // User is active - trigger alerts immediately (one at a time)
      this.processDueAlerts(dueAlerts);
    } else {
      // User is inactive - queue alerts for next session
      console.log(`[ProactiveAlertManager] User inactive, queuing ${dueAlerts.length} alerts`);
      this.alertQueue.push(...dueAlerts);
      
      // Remove from scheduled alerts
      dueAlerts.forEach(alert => this.alerts.delete(alert.id));
      this.persistAlerts();
    }
  }

  /**
   * Process due alerts one at a time
   */
  private async processDueAlerts(alerts: ProactiveAlert[]): Promise<void> {
    for (const alert of alerts) {
      // Remove from scheduled alerts
      this.alerts.delete(alert.id);
      
      // Trigger the alert
      await this.triggerAlert(alert);
      
      // Wait a bit between alerts to avoid overwhelming the user
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.persistAlerts();
  }

  /**
   * Process queued alerts when user becomes active
   */
  private async processQueuedAlerts(): Promise<void> {
    if (this.alertQueue.length === 0) {
      return;
    }

    console.log(`[ProactiveAlertManager] Processing ${this.alertQueue.length} queued alerts`);
    
    const alerts = [...this.alertQueue];
    this.alertQueue = [];
    
    await this.processDueAlerts(alerts);
  }

  /**
   * Setup user activity tracking
   * Detects when user is active on the dashboard
   */
  private setupActivityTracking(): void {
    // Track user activity via mouse/keyboard events
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        const wasInactive = !this.isUserActive;
        this.isUserActive = true;
        
        // If user just became active, process queued alerts
        if (wasInactive && this.alertQueue.length > 0) {
          this.processQueuedAlerts();
        }
      });
    });

    // Mark as inactive after 5 minutes of no activity
    let inactivityTimer: number | null = null;
    
    const resetInactivityTimer = () => {
      if (inactivityTimer !== null) {
        clearTimeout(inactivityTimer);
      }
      
      inactivityTimer = window.setTimeout(() => {
        this.isUserActive = false;
        console.log(`[ProactiveAlertManager] User marked as inactive`);
      }, 5 * 60 * 1000); // 5 minutes
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });

    // Start the timer
    resetInactivityTimer();
  }

  /**
   * Load alerts from localStorage
   */
  private loadAlertsFromStorage(): void {
    try {
      const stored = localStorage.getItem('jojo_proactive_alerts');
      if (stored) {
        const alertsData = JSON.parse(stored);
        alertsData.forEach((alertData: any) => {
          // Convert date strings back to Date objects
          alertData.scheduledTime = new Date(alertData.scheduledTime);
          this.alerts.set(alertData.id, alertData);
        });
        console.log(`[ProactiveAlertManager] Loaded ${this.alerts.size} alerts from storage`);
      }
    } catch (error) {
      console.error(`[ProactiveAlertManager] Error loading alerts from storage:`, error);
    }
  }

  /**
   * Persist alerts to localStorage
   */
  private persistAlerts(): void {
    try {
      const alertsArray = Array.from(this.alerts.values());
      localStorage.setItem('jojo_proactive_alerts', JSON.stringify(alertsArray));
    } catch (error) {
      console.error(`[ProactiveAlertManager] Error persisting alerts:`, error);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopMonitoring();
    this.alerts.clear();
    this.alertQueue = [];
  }
}

// Export singleton instance
export const proactiveAlertManager = new ProactiveAlertManagerImpl();

// Export class for testing
export { ProactiveAlertManagerImpl };
