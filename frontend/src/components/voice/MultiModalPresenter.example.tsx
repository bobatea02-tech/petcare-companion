/**
 * MultiModalPresenter Example Usage
 * 
 * This file demonstrates how to integrate the MultiModalPresenter component
 * with the voice assistant system for synchronized voice and visual output.
 */

import React, { useState, useEffect } from 'react';
import { MultiModalPresenter, VisualData } from './MultiModalPresenter';
import {
  createHealthChartData,
  createFeedingTimelineData,
  createMedicationTimelineData,
  createAppointmentsCalendarData,
  syncVisualizationWithSpeech
} from '@/services/voice/multiModalHelper';

/**
 * Example 1: Health Records Display
 * Shows health metrics chart while JoJo speaks about the pet's health
 */
export function HealthRecordsExample() {
  const [visualData, setVisualData] = useState<VisualData | null>(null);
  const [currentSpeech, setCurrentSpeech] = useState<string>('');
  const [isActive, setIsActive] = useState(false);

  // Simulate voice query: "Show me Buddy's health records"
  useEffect(() => {
    const healthRecords = [
      { date: '2024-01-01', weight: 25, temperature: 38.5 },
      { date: '2024-01-15', weight: 26, temperature: 38.3 },
      { date: '2024-02-01', weight: 27, temperature: 38.4 },
      { date: '2024-02-15', weight: 26.5, temperature: 38.6 }
    ];

    const visualData = createHealthChartData(healthRecords);
    setVisualData(visualData);
    setIsActive(true);

    // Simulate speech segments
    const speechSegments = [
      "Here are Buddy's health records.",
      "His weight has been stable around 26 kilograms.",
      "Temperature readings are all within normal range."
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < speechSegments.length) {
        setCurrentSpeech(speechSegments[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Health Records Example</h2>
      <MultiModalPresenter
        visualData={visualData}
        isActive={isActive}
        currentSpeechSegment={currentSpeech}
        onVisualizationComplete={() => console.log('Visualization complete')}
      />
    </div>
  );
}

/**
 * Example 2: Feeding History Timeline
 * Shows feeding timeline while JoJo narrates feeding patterns
 */
export function FeedingHistoryExample() {
  const [visualData, setVisualData] = useState<VisualData | null>(null);
  const [currentSpeech, setCurrentSpeech] = useState<string>('');
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const feedingLogs = [
      { id: 'f1', time: '08:00 AM', amount: '2 cups', foodType: 'Dry kibble', notes: 'Ate everything' },
      { id: 'f2', time: '12:00 PM', amount: '1 cup', foodType: 'Wet food', notes: 'Left some food' },
      { id: 'f3', time: '06:00 PM', amount: '2 cups', foodType: 'Dry kibble', notes: 'Ate everything' }
    ];

    const visualData = createFeedingTimelineData(feedingLogs);
    setVisualData(visualData);
    setIsActive(true);

    // Simulate speech with highlighting
    const speechSegments = [
      "Here's today's feeding history.",
      "At 8 AM, Buddy had 2 cups of dry kibble.",
      "At noon, he had 1 cup of wet food but left some.",
      "At 6 PM, he finished all 2 cups of dry kibble."
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < speechSegments.length) {
        setCurrentSpeech(speechSegments[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Feeding History Example</h2>
      <MultiModalPresenter
        visualData={visualData}
        isActive={isActive}
        currentSpeechSegment={currentSpeech}
        onVisualizationComplete={() => console.log('Visualization complete')}
      />
    </div>
  );
}

/**
 * Example 3: Medication Schedule
 * Shows medication timeline with real-time highlighting
 */
export function MedicationScheduleExample() {
  const [visualData, setVisualData] = useState<VisualData | null>(null);
  const [currentSpeech, setCurrentSpeech] = useState<string>('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const medications = [
      { id: 'm1', time: '09:00 AM', name: 'Heartgard', dosage: '1 tablet', frequency: 'Monthly' },
      { id: 'm2', time: '02:00 PM', name: 'Antibiotics', dosage: '250mg', frequency: 'Twice daily' },
      { id: 'm3', time: '09:00 PM', name: 'Antibiotics', dosage: '250mg', frequency: 'Twice daily' }
    ];

    const visualData = createMedicationTimelineData(medications);
    setVisualData(visualData);
    setIsActive(true);

    // Simulate speech with synchronized highlighting
    const speechWithHighlights = [
      { speech: "Here's today's medication schedule.", highlight: null },
      { speech: "At 9 AM, give Heartgard tablet.", highlight: 'm1' },
      { speech: "At 2 PM, give 250mg of Antibiotics.", highlight: 'm2' },
      { speech: "At 9 PM, give another dose of Antibiotics.", highlight: 'm3' }
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < speechWithHighlights.length) {
        setCurrentSpeech(speechWithHighlights[index].speech);
        setHighlightedId(speechWithHighlights[index].highlight);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Medication Schedule Example</h2>
      <MultiModalPresenter
        visualData={visualData}
        isActive={isActive}
        currentSpeechSegment={currentSpeech}
        onVisualizationComplete={() => console.log('Visualization complete')}
      />
    </div>
  );
}

/**
 * Example 4: Appointments Calendar
 * Shows calendar with highlighted dates while JoJo speaks
 */
export function AppointmentsCalendarExample() {
  const [visualData, setVisualData] = useState<VisualData | null>(null);
  const [currentSpeech, setCurrentSpeech] = useState<string>('');
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const appointments = [
      { id: 'a1', date: new Date('2024-03-15'), title: 'Annual Checkup' },
      { id: 'a2', date: new Date('2024-03-22'), title: 'Vaccination' },
      { id: 'a3', date: new Date('2024-04-05'), title: 'Dental Cleaning' }
    ];

    const visualData = createAppointmentsCalendarData(appointments);
    setVisualData(visualData);
    setIsActive(true);

    // Simulate speech
    const speechSegments = [
      "Here are Buddy's upcoming appointments.",
      "On March 15th, you have an annual checkup scheduled.",
      "On March 22nd, Buddy needs his vaccination.",
      "On April 5th, there's a dental cleaning appointment."
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < speechSegments.length) {
        setCurrentSpeech(speechSegments[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Appointments Calendar Example</h2>
      <MultiModalPresenter
        visualData={visualData}
        isActive={isActive}
        currentSpeechSegment={currentSpeech}
        onVisualizationComplete={() => console.log('Visualization complete')}
      />
    </div>
  );
}

/**
 * Example 5: Integration with Voice Assistant
 * Shows how to integrate MultiModalPresenter with the voice assistant system
 */
export function VoiceAssistantIntegrationExample() {
  const [visualData, setVisualData] = useState<VisualData | null>(null);
  const [currentSpeech, setCurrentSpeech] = useState<string>('');
  const [isActive, setIsActive] = useState(false);

  // This would be called from your voice command handler
  const handleVoiceQuery = async (query: string) => {
    // Example: User asks "Show me Buddy's health records"
    if (query.toLowerCase().includes('health records')) {
      const healthRecords = await fetchHealthRecords(); // Your API call
      const visualData = createHealthChartData(healthRecords);
      setVisualData(visualData);
      setIsActive(true);

      // Start TTS playback
      const response = "Here are Buddy's health records. His weight has been stable...";
      speakWithHighlighting(response, visualData);
    }
  };

  // Simulate TTS with word-by-word highlighting
  const speakWithHighlighting = (text: string, visualData: VisualData) => {
    const words = text.split(' ');
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        const currentWord = words[currentIndex];
        const segment = words.slice(0, currentIndex + 1).join(' ');
        setCurrentSpeech(segment);

        // Sync visualization with current word
        const highlightId = syncVisualizationWithSpeech(segment, visualData, currentWord);
        if (highlightId) {
          // Update highlighted item in visual data
          console.log('Highlighting:', highlightId);
        }

        currentIndex++;
      } else {
        clearInterval(interval);
        setIsActive(false);
      }
    }, 300); // Adjust timing based on TTS speed
  };

  // Mock API call
  const fetchHealthRecords = async () => {
    return [
      { date: '2024-01-01', weight: 25, temperature: 38.5 },
      { date: '2024-02-01', weight: 26, temperature: 38.3 }
    ];
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Voice Assistant Integration</h2>
      <button
        onClick={() => handleVoiceQuery("Show me Buddy's health records")}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg mb-4"
      >
        Simulate Voice Query
      </button>
      <MultiModalPresenter
        visualData={visualData}
        isActive={isActive}
        currentSpeechSegment={currentSpeech}
        onVisualizationComplete={() => {
          console.log('Visualization complete');
          setIsActive(false);
        }}
      />
    </div>
  );
}
