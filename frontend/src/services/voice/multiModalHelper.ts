import { VisualData } from '@/components/voice/MultiModalPresenter';
import { CommandResult } from './types';

/**
 * Multi-Modal Helper
 * 
 * Utilities for creating visual data representations from command results
 * to be displayed by the MultiModalPresenter component.
 */

export interface HealthDataPoint {
  name: string;
  value: number;
  date?: string;
}

export interface TimelineEntry {
  id: string;
  time: string;
  title: string;
  description: string;
}

export interface AppointmentEntry {
  date: Date;
  title: string;
  id: string;
}

/**
 * Create visual data for health records display
 */
export function createHealthChartData(healthRecords: any[]): VisualData {
  const data: HealthDataPoint[] = healthRecords.map((record, index) => ({
    name: record.date || `Record ${index + 1}`,
    value: record.weight || record.temperature || record.heartRate || 0,
    date: record.date
  }));

  return {
    type: 'chart',
    title: 'Health Metrics',
    data,
    highlightKey: 'weight' // Can be dynamically set based on what's being discussed
  };
}

/**
 * Create visual data for feeding history timeline
 */
export function createFeedingTimelineData(feedingLogs: any[]): VisualData {
  const data: TimelineEntry[] = feedingLogs.map((log, index) => ({
    id: log.id || `feeding-${index}`,
    time: log.time || new Date(log.timestamp).toLocaleTimeString(),
    title: `${log.amount || 'Unknown amount'} of ${log.foodType || 'food'}`,
    description: log.notes || 'No additional notes'
  }));

  return {
    type: 'timeline',
    title: 'Feeding History',
    data,
    highlightKey: 'feeding'
  };
}

/**
 * Create visual data for medication schedule timeline
 */
export function createMedicationTimelineData(medications: any[]): VisualData {
  const data: TimelineEntry[] = medications.map((med, index) => ({
    id: med.id || `med-${index}`,
    time: med.time || new Date(med.scheduledTime).toLocaleTimeString(),
    title: med.name || 'Medication',
    description: `${med.dosage || 'Unknown dosage'} - ${med.frequency || 'As prescribed'}`
  }));

  return {
    type: 'timeline',
    title: 'Medication Schedule',
    data,
    highlightKey: 'medication'
  };
}

/**
 * Create visual data for appointments calendar
 */
export function createAppointmentsCalendarData(appointments: any[]): VisualData {
  const appointmentEntries: AppointmentEntry[] = appointments.map((apt, index) => ({
    date: new Date(apt.date || apt.scheduledDate),
    title: apt.title || apt.reason || 'Appointment',
    id: apt.id || `apt-${index}`
  }));

  return {
    type: 'calendar',
    title: 'Upcoming Appointments',
    data: { appointments: appointmentEntries },
    highlightKey: 'appointment'
  };
}

/**
 * Create visual data for list view (medications, reminders, etc.)
 */
export function createListViewData(items: any[], title: string): VisualData {
  const data = items.map((item, index) => ({
    id: item.id || `item-${index}`,
    title: item.title || item.name || 'Item',
    subtitle: item.subtitle || item.description,
    value: item.value || item.status
  }));

  return {
    type: 'list',
    title,
    data,
    highlightKey: 'item'
  };
}

/**
 * Create visual data from command result
 * Automatically determines the best visualization type based on the command result
 */
export function createVisualDataFromCommandResult(result: CommandResult): VisualData | null {
  if (!result.success || !result.visualComponent) {
    return null;
  }

  const { visualComponent, data } = result;

  switch (visualComponent) {
    case 'health-chart':
      return createHealthChartData(data?.healthRecords || []);
    
    case 'feeding-timeline':
      return createFeedingTimelineData(data?.feedingLogs || []);
    
    case 'medication-timeline':
      return createMedicationTimelineData(data?.medications || []);
    
    case 'appointments-calendar':
      return createAppointmentsCalendarData(data?.appointments || []);
    
    case 'list':
      return createListViewData(data?.items || [], data?.title || 'Items');
    
    default:
      // Default to list view for unknown types
      if (Array.isArray(data)) {
        return createListViewData(data, 'Results');
      }
      return null;
  }
}

/**
 * Extract highlight key from speech text
 * Used to determine which visual element should be highlighted based on what's being spoken
 */
export function extractHighlightKeyFromSpeech(speech: string, visualData: VisualData): string | null {
  const lowerSpeech = speech.toLowerCase();
  
  // Health-related keywords
  if (lowerSpeech.includes('weight') && visualData.type === 'chart') {
    return 'weight';
  }
  if (lowerSpeech.includes('temperature') && visualData.type === 'chart') {
    return 'temperature';
  }
  
  // Timeline-related keywords
  if (lowerSpeech.includes('feeding') || lowerSpeech.includes('meal')) {
    return 'feeding';
  }
  if (lowerSpeech.includes('medication') || lowerSpeech.includes('medicine')) {
    return 'medication';
  }
  
  // Appointment-related keywords
  if (lowerSpeech.includes('appointment') || lowerSpeech.includes('visit')) {
    return 'appointment';
  }
  
  return null;
}

/**
 * Sync visual highlighting with TTS playback
 * Returns the segment of visual data that should be highlighted based on playback progress
 */
export function syncVisualizationWithSpeech(
  speechText: string,
  visualData: VisualData,
  currentWord: string
): string | null {
  // Extract IDs or keys from the speech text that match visual data items
  if (visualData.type === 'timeline') {
    const timelineData = visualData.data as TimelineEntry[];
    const matchedItem = timelineData.find(item => 
      speechText.toLowerCase().includes(item.title.toLowerCase()) ||
      currentWord.toLowerCase().includes(item.title.toLowerCase())
    );
    return matchedItem?.id || null;
  }
  
  if (visualData.type === 'list') {
    const listData = visualData.data as Array<{ id: string; title: string }>;
    const matchedItem = listData.find(item =>
      speechText.toLowerCase().includes(item.title.toLowerCase()) ||
      currentWord.toLowerCase().includes(item.title.toLowerCase())
    );
    return matchedItem?.id || null;
  }
  
  if (visualData.type === 'calendar') {
    const calendarData = visualData.data as { appointments: AppointmentEntry[] };
    const matchedItem = calendarData.appointments.find(apt =>
      speechText.toLowerCase().includes(apt.title.toLowerCase()) ||
      currentWord.toLowerCase().includes(apt.title.toLowerCase())
    );
    return matchedItem?.id || null;
  }
  
  return null;
}
