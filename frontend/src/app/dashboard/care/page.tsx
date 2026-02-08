'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MedicationCard,
  MedicationDetailModal,
  FeedingScheduleCard,
  ReminderCard,
  DailyCareChecklist,
  MedicationHistory,
  QuickLogButtons,
} from '@/components/care'
import { PawIcon } from '@/components/icons'
import { Medication, FeedingSchedule, Reminder, CareTask, MedicationLog } from '@/types/care'

export default function CarePage() {
  const [medications, setMedications] = useState<Medication[]>([])
  const [feedingSchedules, setFeedingSchedules] = useState<FeedingSchedule[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [careTasks, setCareTasks] = useState<CareTask[]>([])
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([])
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch data on mount
  useEffect(() => {
    fetchCareData()
  }, [])

  const fetchCareData = async () => {
    try {
      setIsLoading(true)
      // In a real app, these would be actual API calls
      // For now, using mock data
      setMedications(mockMedications)
      setFeedingSchedules(mockFeedingSchedules)
      setReminders(mockReminders)
      setCareTasks(mockCareTasks)
      setMedicationLogs(mockMedicationLogs)
    } catch (error) {
      console.error('Error fetching care data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogMedication = async (medicationId: string) => {
    try {
      // await apiClient.post(`/care/medications/${medicationId}/log`)
      console.log('Logging medication:', medicationId)
      // Update local state
      setMedications((prev) =>
        prev.map((med) =>
          med.id === medicationId
            ? { ...med, current_quantity: med.current_quantity - 1 }
            : med
        )
      )
    } catch (error) {
      console.error('Error logging medication:', error)
    }
  }

  const handleLogFeeding = async (scheduleId: string, time: string) => {
    try {
      // await apiClient.post(`/care/feeding/${scheduleId}/log`, { time })
      console.log('Logging feeding:', scheduleId, time)
    } catch (error) {
      console.error('Error logging feeding:', error)
    }
  }

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      // await apiClient.patch(`/care/tasks/${taskId}`, { completed })
      setCareTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...task, completed, completed_at: completed ? new Date().toISOString() : undefined }
            : task
        )
      )
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  const handleDismissReminder = async (reminderId: string) => {
    try {
      // await apiClient.delete(`/notifications/${reminderId}`)
      setReminders((prev) => prev.filter((r) => r.id !== reminderId))
    } catch (error) {
      console.error('Error dismissing reminder:', error)
    }
  }

  const handleMarkReminderRead = async (reminderId: string) => {
    try {
      // await apiClient.patch(`/notifications/${reminderId}`, { read: true })
      setReminders((prev) =>
        prev.map((r) => (r.id === reminderId ? { ...r, read: true } : r))
      )
    } catch (error) {
      console.error('Error marking reminder as read:', error)
    }
  }

  const handleQuickLogMedication = async () => {
    console.log('Quick log medication')
  }

  const handleQuickLogFeeding = async () => {
    console.log('Quick log feeding')
  }

  const handleQuickLogActivity = async (activityType: string) => {
    console.log('Quick log activity:', activityType)
  }

  const medicationNames = medications.reduce(
    (acc, med) => {
      acc[med.id] = med.medication_name
      return acc
    },
    {} as Record<string, string>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <PawIcon size={48} className="mx-auto mb-4 text-primary-500 animate-pulse" />
          <p className="text-gray-600">Loading care data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <PawIcon size={40} className="text-primary-500" />
            Care Tracking
          </h1>
          <p className="text-gray-600">
            Manage medications, feeding schedules, and daily care tasks
          </p>
        </motion.div>

        {/* Reminders Section */}
        {reminders.filter((r) => !r.read).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Reminders</h2>
            <div className="space-y-3">
              {reminders
                .filter((r) => !r.read)
                .map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onDismiss={handleDismissReminder}
                    onMarkRead={handleMarkReminderRead}
                  />
                ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Checklist */}
            <DailyCareChecklist tasks={careTasks} onToggleTask={handleToggleTask} />

            {/* Medications */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Medications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medications.map((medication) => (
                  <MedicationCard
                    key={medication.id}
                    medication={medication}
                    onLog={handleLogMedication}
                    onViewDetails={setSelectedMedication}
                  />
                ))}
              </div>
            </div>

            {/* Feeding Schedules */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Feeding Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedingSchedules.map((schedule) => (
                  <FeedingScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    onLogFeeding={handleLogFeeding}
                  />
                ))}
              </div>
            </div>

            {/* Medication History */}
            <MedicationHistory logs={medicationLogs} medicationNames={medicationNames} />
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            <QuickLogButtons
              onLogMedication={handleQuickLogMedication}
              onLogFeeding={handleQuickLogFeeding}
              onLogActivity={handleQuickLogActivity}
            />
          </div>
        </div>
      </div>

      {/* Medication Detail Modal */}
      <MedicationDetailModal
        medication={selectedMedication}
        isOpen={!!selectedMedication}
        onClose={() => setSelectedMedication(null)}
      />
    </div>
  )
}

// Mock data for demonstration
const mockMedications: Medication[] = [
  {
    id: '1',
    pet_id: 'pet1',
    medication_name: 'Heartgard Plus',
    dosage: '1 tablet',
    frequency: 'Monthly',
    start_date: '2024-01-01',
    refill_threshold: 3,
    current_quantity: 2,
    administration_instructions: 'Give with food on the first of each month',
    active: true,
    created_at: '2024-01-01',
  },
  {
    id: '2',
    pet_id: 'pet1',
    medication_name: 'Apoquel',
    dosage: '16mg',
    frequency: 'Twice daily',
    start_date: '2024-01-15',
    refill_threshold: 10,
    current_quantity: 25,
    administration_instructions: 'Give morning and evening with meals',
    active: true,
    created_at: '2024-01-15',
  },
]

const mockFeedingSchedules: FeedingSchedule[] = [
  {
    id: '1',
    pet_id: 'pet1',
    food_type: 'Dry Kibble',
    amount: '1 cup',
    frequency: 'Twice daily',
    scheduled_times: ['8:00 AM', '6:00 PM'],
    active: true,
  },
]

const mockReminders: Reminder[] = [
  {
    id: '1',
    pet_id: 'pet1',
    reminder_type: 'medication',
    title: 'Apoquel Due',
    message: 'Time to give Apoquel (16mg) - morning dose',
    scheduled_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    sent: true,
    read: false,
  },
]

const mockCareTasks: CareTask[] = [
  {
    id: '1',
    pet_id: 'pet1',
    task_type: 'medication',
    title: 'Give Apoquel - Morning',
    description: '16mg with breakfast',
    scheduled_time: '2024-02-07T08:00:00',
    completed: false,
  },
  {
    id: '2',
    pet_id: 'pet1',
    task_type: 'feeding',
    title: 'Morning Feeding',
    description: '1 cup dry kibble',
    scheduled_time: '2024-02-07T08:00:00',
    completed: true,
    completed_at: '2024-02-07T08:05:00',
  },
]

const mockMedicationLogs: MedicationLog[] = [
  {
    id: '1',
    medication_id: '2',
    administered_at: '2024-02-07T08:05:00',
    administered_by: 'John Doe',
    notes: 'Given with breakfast',
  },
  {
    id: '2',
    medication_id: '2',
    administered_at: '2024-02-06T18:10:00',
    administered_by: 'Jane Doe',
  },
]
