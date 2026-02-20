/**
 * Dashboard Actions Service
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Wraps existing dashboard API calls for voice control integration.
 * Provides navigation, data entry, query, and scheduling actions.
 */

import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import type {
  DashboardActions,
  FeedingData,
  MedicationData,
  ActivityData,
  HealthRecord,
  Appointment,
  Medication,
  FeedingLog,
  HealthSummary,
  AppointmentData,
} from './types';

/**
 * Implementation of DashboardActions interface
 * Wraps existing dashboard API calls for voice control
 */
export class DashboardActionsService implements DashboardActions {
  private navigate: ReturnType<typeof useNavigate> | null = null;
  private navigationHistory: string[] = [];

  /**
   * Set the navigation function (must be called from a React component)
   */
  setNavigate(navigate: ReturnType<typeof useNavigate>): void {
    this.navigate = navigate;
  }

  // ============================================================================
  // Navigation Actions
  // ============================================================================

  /**
   * Navigate to a specific page with optional parameters
   */
  async navigateTo(page: string, params?: Record<string, any>): Promise<void> {
    if (!this.navigate) {
      throw new Error('Navigation not initialized. Call setNavigate() first.');
    }

    // Store current location in history
    this.navigationHistory.push(window.location.pathname);

    // Build path with parameters
    let path = page;
    if (params) {
      const queryString = new URLSearchParams(params as Record<string, string>).toString();
      path = `${page}?${queryString}`;
    }

    // Navigate to the page
    this.navigate(path);
  }

  /**
   * Navigate back to the previous page
   */
  async goBack(): Promise<void> {
    if (!this.navigate) {
      throw new Error('Navigation not initialized. Call setNavigate() first.');
    }

    // Use navigation history if available
    if (this.navigationHistory.length > 0) {
      const previousPath = this.navigationHistory.pop();
      if (previousPath) {
        this.navigate(previousPath);
        return;
      }
    }

    // Fallback to browser history
    this.navigate(-1);
  }

  // ============================================================================
  // Data Entry Actions
  // ============================================================================

  /**
   * Log feeding data for a pet
   */
  async logFeeding(petId: string, data: FeedingData): Promise<void> {
    // Use the health logs API to log feeding
    const response = await api.request('/v1/health-logs', {
      method: 'POST',
      body: JSON.stringify({
        pet_id: petId,
        log_type: 'feeding',
        log_date: data.time.toISOString(),
        notes: `Fed ${data.amount} ${data.unit} of ${data.foodType}`,
        metadata: {
          amount: data.amount,
          unit: data.unit,
          foodType: data.foodType,
        },
      }),
    });

    if (response.error) {
      throw new Error(`Failed to log feeding: ${response.error}`);
    }
  }

  /**
   * Log medication data for a pet
   */
  async logMedication(petId: string, data: MedicationData): Promise<void> {
    // Use the health logs API to log medication
    const response = await api.request('/v1/health-logs', {
      method: 'POST',
      body: JSON.stringify({
        pet_id: petId,
        log_type: 'medication',
        log_date: data.time.toISOString(),
        notes: data.notes || `Administered ${data.name} - ${data.dosage}`,
        metadata: {
          medicationName: data.name,
          dosage: data.dosage,
        },
      }),
    });

    if (response.error) {
      throw new Error(`Failed to log medication: ${response.error}`);
    }
  }

  /**
   * Log weight measurement for a pet
   */
  async logWeight(petId: string, weight: number, unit: string): Promise<void> {
    // Use the health logs API to log weight
    const response = await api.request('/v1/health-logs', {
      method: 'POST',
      body: JSON.stringify({
        pet_id: petId,
        log_type: 'weight',
        log_date: new Date().toISOString(),
        notes: `Weight recorded: ${weight} ${unit}`,
        metadata: {
          weight,
          unit,
        },
      }),
    });

    if (response.error) {
      throw new Error(`Failed to log weight: ${response.error}`);
    }
  }

  /**
   * Log activity data for a pet
   */
  async logActivity(petId: string, activity: ActivityData): Promise<void> {
    // Use the health logs API to log activity
    const response = await api.request('/v1/health-logs', {
      method: 'POST',
      body: JSON.stringify({
        pet_id: petId,
        log_type: 'activity',
        log_date: activity.time.toISOString(),
        notes: activity.notes || `${activity.type} activity${activity.duration ? ` for ${activity.duration} minutes` : ''}`,
        metadata: {
          activityType: activity.type,
          duration: activity.duration,
        },
      }),
    });

    if (response.error) {
      throw new Error(`Failed to log activity: ${response.error}`);
    }
  }

  // ============================================================================
  // Query Actions
  // ============================================================================

  /**
   * Get health records for a pet
   * Returns empty array if no health records found (Requirement 6.5)
   */
  async getHealthRecords(petId: string): Promise<HealthRecord[]> {
    const response = await api.getHealthLogs(parseInt(petId));

    if (response.error) {
      throw new Error(`Failed to get health records: ${response.error}`);
    }

    // Transform API response to HealthRecord format
    // Returns empty array if no data (graceful handling for Requirement 6.5)
    const logs = response.data || [];
    return logs.map((log: any) => ({
      id: log.id.toString(),
      petId: log.pet_id.toString(),
      type: log.log_type,
      date: new Date(log.log_date),
      data: {
        notes: log.notes,
        ...log.metadata,
      },
    }));
  }

  /**
   * Get appointments for a pet
   * Returns empty array if no appointments found (Requirement 6.5)
   */
  async getAppointments(petId: string): Promise<Appointment[]> {
    const response = await api.getPetAppointments(petId, {
      include_past: false,
      include_cancelled: false,
    });

    if (response.error) {
      throw new Error(`Failed to get appointments: ${response.error}`);
    }

    // Transform API response to Appointment format
    // Returns empty array if no data (graceful handling for Requirement 6.5)
    const appointments = response.data || [];
    return appointments.map((apt: any) => ({
      id: apt.id.toString(),
      petId: apt.pet_id.toString(),
      date: new Date(apt.appointment_date),
      time: new Date(apt.appointment_date).toLocaleTimeString(),
      clinic: apt.clinic_name,
      reason: apt.purpose,
    }));
  }

  /**
   * Get medications for a pet
   * Returns empty array if no medications found (Requirement 6.5)
   */
  async getMedications(petId: string, date?: Date): Promise<Medication[]> {
    const response = await api.getMedicationHistory(parseInt(petId), true);

    if (response.error) {
      throw new Error(`Failed to get medications: ${response.error}`);
    }

    // Transform API response to Medication format
    // Returns empty array if no data (graceful handling for Requirement 6.5)
    const medications = response.data || [];
    return medications.map((med: any) => ({
      id: med.id.toString(),
      petId: med.pet_id.toString(),
      name: med.medication_name,
      dosage: med.dosage,
      schedule: med.frequency || 'As needed',
    }));
  }

  /**
   * Get feeding history for a pet
   * Returns empty array if no feeding logs found (Requirement 6.5)
   */
  async getFeedingHistory(petId: string, days: number = 7): Promise<FeedingLog[]> {
    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const response = await api.getHealthLogs(parseInt(petId), {
      logType: 'feeding',
      startDate: startDate.toISOString().split('T')[0],
      limit: 100,
    });

    if (response.error) {
      throw new Error(`Failed to get feeding history: ${response.error}`);
    }

    // Transform API response to FeedingLog format
    // Returns empty array if no data (graceful handling for Requirement 6.5)
    const logs = response.data || [];
    return logs.map((log: any) => ({
      id: log.id.toString(),
      petId: log.pet_id.toString(),
      amount: log.metadata?.amount || 0,
      unit: log.metadata?.unit || 'cups',
      foodType: log.metadata?.foodType || 'Unknown',
      time: new Date(log.log_date),
    }));
  }

  // ============================================================================
  // Scheduling Actions
  // ============================================================================

  /**
   * Create an appointment for a pet
   */
  async createAppointment(petId: string, appointment: AppointmentData): Promise<Appointment> {
    // Combine date and time
    const appointmentDateTime = new Date(appointment.date);
    const [hours, minutes] = appointment.time.split(':');
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

    const response = await api.createAppointment(petId, {
      appointment_date: appointmentDateTime.toISOString(),
      appointment_type: 'checkup',
      purpose: appointment.reason,
      clinic_name: appointment.clinic,
      clinic_address: '',
      clinic_phone: '',
      veterinarian: '',
      notes: '',
    });

    if (response.error) {
      throw new Error(`Failed to create appointment: ${response.error}`);
    }

    const apt = response.data;
    return {
      id: apt.id.toString(),
      petId: apt.pet_id.toString(),
      date: new Date(apt.appointment_date),
      time: new Date(apt.appointment_date).toLocaleTimeString(),
      clinic: apt.clinic_name,
      reason: apt.purpose,
    };
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: string): Promise<void> {
    // Extract pet ID from appointment (we'll need to get the appointment first)
    // For now, we'll use a workaround by getting all pets and finding the appointment
    const petsResponse = await api.getPets();
    if (petsResponse.error) {
      throw new Error(`Failed to get pets: ${petsResponse.error}`);
    }

    const pets = petsResponse.data || [];
    let found = false;

    for (const pet of pets) {
      const response = await api.deleteAppointment(pet.id.toString(), appointmentId);
      if (!response.error) {
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`Failed to cancel appointment: Appointment not found`);
    }
  }

  // ============================================================================
  // Bulk Actions
  // ============================================================================

  /**
   * Log feeding for all pets
   */
  async logFeedingForAll(data: FeedingData): Promise<void> {
    // Get all pets
    const response = await api.getPets();
    if (response.error) {
      throw new Error(`Failed to get pets: ${response.error}`);
    }

    const pets = response.data || [];

    // Log feeding for each pet
    const promises = pets.map((pet: any) =>
      this.logFeeding(pet.id.toString(), data)
    );

    await Promise.all(promises);
  }

  /**
   * Get health summary for all pets
   */
  async getHealthSummaryForAll(): Promise<HealthSummary[]> {
    // Get all pets
    const petsResponse = await api.getPets();
    if (petsResponse.error) {
      throw new Error(`Failed to get pets: ${petsResponse.error}`);
    }

    const pets = petsResponse.data || [];

    // Get health summary for each pet
    const summaries = await Promise.all(
      pets.map(async (pet: any) => {
        const summaryResponse = await api.getHealthSummary(pet.id);
        const summary = summaryResponse.data || {};

        return {
          petId: pet.id.toString(),
          petName: pet.name,
          healthScore: summary.health_score || 0,
          lastCheckup: summary.last_checkup ? new Date(summary.last_checkup) : new Date(),
          upcomingAppointments: summary.upcoming_appointments || 0,
        };
      })
    );

    return summaries;
  }
}

// Export singleton instance
export const dashboardActions = new DashboardActionsService();

// Export default
export default dashboardActions;
