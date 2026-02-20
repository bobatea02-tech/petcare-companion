/**
 * Notification Service
 * Manages smart reminders, predictive alerts, and Web Push notifications
 */

export interface Notification {
  id: string;
  type: 'predictive' | 'medication' | 'vaccination' | 'grooming' | 'birthday';
  petId: string;
  petName: string;
  title: string;
  message: string;
  actionRequired: string;
  createdAt: Date;
  read: boolean;
  scheduledFor?: Date;
}

export interface PredictiveAlert {
  petId: string;
  reason: string;
  confidence: number; // 0-1
  suggestedAction: string;
}

export interface Medication {
  id: string;
  petId: string;
  name: string;
  quantity: number;
  dailyDosage: number;
  dueDate?: Date;
}

export interface Vaccination {
  id: string;
  petId: string;
  name: string;
  dueDate: Date;
}

export interface GroomingTask {
  id: string;
  petId: string;
  type: string;
  scheduledTime: Date;
}

export interface Pet {
  id: string;
  name: string;
  birthday?: Date;
}

export interface HealthScoreTrend {
  date: Date;
  score: number;
}

export interface MedicationLog {
  date: Date;
  taken: boolean;
}

export interface ExerciseLog {
  date: Date;
  duration: number;
}

export interface WeightLog {
  date: Date;
  weight: number;
}

export class NotificationService {
  private db: IDBDatabase | null = null;
  private pushSubscription: PushSubscription | null = null;
  private readonly DB_NAME = 'PetCareDB';
  private readonly DB_VERSION = 2;
  private readonly NOTIFICATION_STORE = 'notifications';

  constructor() {
    this.initializeDB();
  }

  /**
   * Initialize IndexedDB
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create notifications store if it doesn't exist
        if (!db.objectStoreNames.contains(this.NOTIFICATION_STORE)) {
          const store = db.createObjectStore(this.NOTIFICATION_STORE, { keyPath: 'id' });
          store.createIndex('petId', 'petId', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('scheduledFor', 'scheduledFor', { unique: false });
          store.createIndex('read', 'read', { unique: false });
        }
      };
    });
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    localStorage.setItem('notification_permission_status', permission);
    return permission;
  }

  /**
   * Subscribe to Web Push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return null;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        this.pushSubscription = existingSubscription;
        return existingSubscription;
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.VITE_VAPID_PUBLIC_KEY || ''
        ),
      });

      this.pushSubscription = subscription;
      localStorage.setItem('push_subscription_data', JSON.stringify(subscription));
      
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  /**
   * Send notification (Web Push or in-app fallback)
   */
  async sendNotification(notification: Notification): Promise<void> {
    try {
      // Store notification in IndexedDB
      await this.storeNotification(notification);

      const permission = Notification.permission;

      if (permission === 'granted' && this.pushSubscription) {
        // Send Web Push notification
        await this.sendPushNotification(notification);
      } else {
        // Fallback to in-app notification
        this.showInAppNotification(notification);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      // Retry logic
      await this.retryNotification(notification);
    }
  }

  /**
   * Schedule medication reminder
   */
  scheduleMedicationReminder(medication: Medication, petName: string): void {
    const daysSupply = medication.quantity / medication.dailyDosage;
    
    if (daysSupply < 7) {
      const notification: Notification = {
        id: `med-${medication.id}-${Date.now()}`,
        type: 'medication',
        petId: medication.petId,
        petName,
        title: 'Medication Refill Reminder',
        message: `${medication.name} is running low (${Math.floor(daysSupply)} days remaining)`,
        actionRequired: 'Order refill or contact your vet',
        createdAt: new Date(),
        read: false,
      };

      this.sendNotification(notification);
    }
  }

  /**
   * Schedule vaccination reminder
   */
  scheduleVaccinationReminder(vaccination: Vaccination, petName: string): void {
    const now = new Date();
    const dueDate = new Date(vaccination.dueDate);
    const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue <= 14 && daysUntilDue >= 0) {
      const notification: Notification = {
        id: `vac-${vaccination.id}-${Date.now()}`,
        type: 'vaccination',
        petId: vaccination.petId,
        petName,
        title: 'Vaccination Due Soon',
        message: `${vaccination.name} vaccination is due in ${daysUntilDue} days`,
        actionRequired: 'Schedule vet appointment',
        createdAt: new Date(),
        read: false,
        scheduledFor: dueDate,
      };

      this.sendNotification(notification);
    }
  }

  /**
   * Schedule grooming reminder
   */
  scheduleGroomingReminder(grooming: GroomingTask, petName: string): void {
    const now = new Date();
    const scheduledTime = new Date(grooming.scheduledTime);
    const hoursUntil = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil <= 24 && hoursUntil > 0) {
      const notification: Notification = {
        id: `groom-${grooming.id}-${Date.now()}`,
        type: 'grooming',
        petId: grooming.petId,
        petName,
        title: 'Grooming Appointment Reminder',
        message: `${grooming.type} appointment scheduled for ${scheduledTime.toLocaleString()}`,
        actionRequired: 'Prepare for grooming appointment',
        createdAt: new Date(),
        read: false,
        scheduledFor: scheduledTime,
      };

      this.sendNotification(notification);
    }
  }

  /**
   * Schedule birthday reminder
   */
  scheduleBirthdayReminder(pet: Pet): void {
    if (!pet.birthday) return;

    const now = new Date();
    const birthday = new Date(pet.birthday);
    const thisYearBirthday = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate());

    // Check if birthday is today
    if (
      now.getDate() === thisYearBirthday.getDate() &&
      now.getMonth() === thisYearBirthday.getMonth()
    ) {
      const age = now.getFullYear() - birthday.getFullYear();
      const notification: Notification = {
        id: `bday-${pet.id}-${Date.now()}`,
        type: 'birthday',
        petId: pet.id,
        petName: pet.name,
        title: `🎉 Happy Birthday ${pet.name}!`,
        message: `${pet.name} is turning ${age} today! Time to celebrate!`,
        actionRequired: 'Celebrate with treats and extra love',
        createdAt: new Date(),
        read: false,
      };

      this.sendNotification(notification);
    }
  }

  /**
   * Analyze patterns for predictive alerts
   */
  analyzePatternsForAlerts(
    petId: string,
    petName: string,
    data: {
      healthScoreTrend?: HealthScoreTrend[];
      medicationLogs?: MedicationLog[];
      exerciseLogs?: ExerciseLog[];
      weightLogs?: WeightLog[];
    }
  ): PredictiveAlert[] {
    const alerts: PredictiveAlert[] = [];

    // Analyze declining health score
    if (data.healthScoreTrend && data.healthScoreTrend.length >= 7) {
      const recentScores = data.healthScoreTrend.slice(-7);
      const isDeclining = this.isScoreDeclining(recentScores);
      
      if (isDeclining) {
        alerts.push({
          petId,
          reason: 'Health score has been declining over the past 7 days',
          confidence: 0.8,
          suggestedAction: 'Review recent health logs and consider scheduling a vet checkup',
        });

        // Create notification
        const notification: Notification = {
          id: `pred-score-${petId}-${Date.now()}`,
          type: 'predictive',
          petId,
          petName,
          title: 'Health Score Alert',
          message: 'Health score has been declining over the past week',
          actionRequired: 'Review health logs and consider vet consultation',
          createdAt: new Date(),
          read: false,
        };
        this.sendNotification(notification);
      }
    }

    // Analyze medication adherence
    if (data.medicationLogs && data.medicationLogs.length >= 7) {
      const recentLogs = data.medicationLogs.slice(-7);
      const missedCount = recentLogs.filter(log => !log.taken).length;
      
      if (missedCount >= 2) {
        alerts.push({
          petId,
          reason: `Missed ${missedCount} medication doses in the past week`,
          confidence: 0.9,
          suggestedAction: 'Set up medication reminders and ensure consistent dosing',
        });

        const notification: Notification = {
          id: `pred-med-${petId}-${Date.now()}`,
          type: 'predictive',
          petId,
          petName,
          title: 'Medication Adherence Alert',
          message: `${missedCount} doses missed this week`,
          actionRequired: 'Review medication schedule and set reminders',
          createdAt: new Date(),
          read: false,
        };
        this.sendNotification(notification);
      }
    }

    // Analyze exercise patterns
    if (data.exerciseLogs && data.exerciseLogs.length >= 10) {
      const recentLogs = data.exerciseLogs.slice(-5);
      const previousLogs = data.exerciseLogs.slice(-10, -5);
      
      const recentAvg = recentLogs.reduce((sum, log) => sum + log.duration, 0) / recentLogs.length;
      const previousAvg = previousLogs.reduce((sum, log) => sum + log.duration, 0) / previousLogs.length;
      
      const reduction = ((previousAvg - recentAvg) / previousAvg) * 100;
      
      if (reduction >= 50) {
        alerts.push({
          petId,
          reason: `Exercise activity reduced by ${Math.round(reduction)}% over the past 5 days`,
          confidence: 0.75,
          suggestedAction: 'Increase daily activity and monitor for signs of illness or discomfort',
        });

        const notification: Notification = {
          id: `pred-exercise-${petId}-${Date.now()}`,
          type: 'predictive',
          petId,
          petName,
          title: 'Activity Level Alert',
          message: `Exercise activity has decreased significantly`,
          actionRequired: 'Monitor pet behavior and increase activity',
          createdAt: new Date(),
          read: false,
        };
        this.sendNotification(notification);
      }
    }

    // Analyze weight changes
    if (data.weightLogs && data.weightLogs.length >= 2) {
      const latestWeight = data.weightLogs[data.weightLogs.length - 1];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const oldWeightLog = data.weightLogs.find(
        log => new Date(log.date) <= thirtyDaysAgo
      );
      
      if (oldWeightLog) {
        const weightChange = Math.abs(latestWeight.weight - oldWeightLog.weight);
        const percentChange = (weightChange / oldWeightLog.weight) * 100;
        
        if (percentChange >= 10) {
          alerts.push({
            petId,
            reason: `Weight changed by ${Math.round(percentChange)}% in the past 30 days`,
            confidence: 0.85,
            suggestedAction: 'Consult your vet about the weight change and adjust diet if needed',
          });

          const notification: Notification = {
            id: `pred-weight-${petId}-${Date.now()}`,
            type: 'predictive',
            petId,
            petName,
            title: 'Weight Change Alert',
            message: `Significant weight change detected (${Math.round(percentChange)}%)`,
            actionRequired: 'Schedule vet consultation',
            createdAt: new Date(),
            read: false,
          };
          this.sendNotification(notification);
        }
      }
    }

    return alerts;
  }

  /**
   * Store notification in IndexedDB
   */
  private async storeNotification(notification: Notification): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.NOTIFICATION_STORE], 'readwrite');
      const store = transaction.objectStore(this.NOTIFICATION_STORE);
      const request = store.add(notification);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieve notifications from IndexedDB
   */
  async getNotifications(petId?: string): Promise<Notification[]> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.NOTIFICATION_STORE], 'readonly');
      const store = transaction.objectStore(this.NOTIFICATION_STORE);
      
      let request: IDBRequest;
      if (petId) {
        const index = store.index('petId');
        request = index.getAll(petId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const notifications = request.result as Notification[];
        // Sort by creation date, newest first
        notifications.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        resolve(notifications);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.NOTIFICATION_STORE], 'readwrite');
      const store = transaction.objectStore(this.NOTIFICATION_STORE);
      const getRequest = store.get(notificationId);

      getRequest.onsuccess = () => {
        const notification = getRequest.result as Notification;
        if (notification) {
          notification.read = true;
          const updateRequest = store.put(notification);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.NOTIFICATION_STORE], 'readwrite');
      const store = transaction.objectStore(this.NOTIFICATION_STORE);
      const request = store.delete(notificationId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Helper: Check if health score is declining
   */
  private isScoreDeclining(scores: HealthScoreTrend[]): boolean {
    if (scores.length < 2) return false;

    // Calculate trend using simple linear regression
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = scores.length;

    scores.forEach((point, index) => {
      const x = index;
      const y = point.score;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Negative slope indicates declining trend
    return slope < -1; // Threshold: declining by more than 1 point per day
  }

  /**
   * Helper: Send Web Push notification
   */
  private async sendPushNotification(notification: Notification): Promise<void> {
    if (!this.pushSubscription) return;

    // In a real implementation, this would send to your backend server
    // which would then use the Web Push protocol to send the notification
    console.log('Sending push notification:', notification);
    
    // For now, show browser notification directly
    new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
      requireInteraction: true,
    });
  }

  /**
   * Helper: Show in-app notification fallback
   */
  private showInAppNotification(notification: Notification): void {
    // Dispatch custom event for in-app notification display
    const event = new CustomEvent('inAppNotification', { detail: notification });
    window.dispatchEvent(event);
  }

  /**
   * Helper: Retry failed notification
   */
  private async retryNotification(notification: Notification, attempt: number = 1): Promise<void> {
    const maxRetries = 3;
    const backoffDelay = Math.pow(2, attempt) * 1000; // Exponential backoff

    if (attempt >= maxRetries) {
      console.error('Max retries reached for notification:', notification.id);
      return;
    }

    setTimeout(async () => {
      try {
        await this.sendNotification(notification);
      } catch (error) {
        console.error(`Retry ${attempt} failed:`, error);
        await this.retryNotification(notification, attempt + 1);
      }
    }, backoffDelay);
  }

  /**
   * Helper: Convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
