'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { PetGallery, QuickActions } from '@/components/dashboard'
import { PetSwitcher, PetTimeline } from '@/components/pets'
import { Pet, TimelineEvent } from '@/types/pets'
import apiClient from '@/lib/api'

// Mock data - will be replaced with actual API calls
const mockPets: Pet[] = [
  {
    id: '1',
    user_id: 'user1',
    name: 'Buddy',
    species: 'dog',
    breed: 'Golden Retriever',
    birth_date: '2021-03-15',
    age_years: 3,
    weight: 65,
    gender: 'male',
    health_status: 'excellent',
    last_checkup: '2 weeks ago',
    photo_url: undefined,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'user1',
    name: 'Whiskers',
    species: 'cat',
    breed: 'Persian',
    birth_date: '2019-07-20',
    age_years: 5,
    weight: 12,
    gender: 'female',
    health_status: 'good',
    last_checkup: '1 month ago',
    photo_url: undefined,
    allergies: 'Chicken',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

const mockTimelineEvents: TimelineEvent[] = [
  {
    id: '1',
    pet_id: '1',
    type: 'medication',
    title: 'Morning medication given',
    description: 'Arthritis medication - 50mg',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    pet_id: '1',
    type: 'feeding',
    title: 'Breakfast',
    description: '2 cups of dry food',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    pet_id: '2',
    type: 'grooming',
    title: 'Brushing session',
    description: 'Regular grooming to prevent matting',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>(mockPets)
  const [selectedPetId, setSelectedPetId] = useState<string>(mockPets[0]?.id || '')
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(mockTimelineEvents)
  const [isLoading, setIsLoading] = useState(false)

  // Filter timeline events for selected pet
  const selectedPetEvents = timelineEvents.filter(e => e.pet_id === selectedPetId)

  const quickActions = [
    {
      id: 'ai-assistant',
      label: 'AI Assistant',
      icon: '🤖',
      variant: 'primary' as const,
      onClick: () => router.push('/dashboard/chat'),
    },
    {
      id: 'log-medication',
      label: 'Log Medication',
      icon: '💊',
      variant: 'secondary' as const,
      onClick: () => router.push('/dashboard/medications'),
      badge: 2,
    },
    {
      id: 'book-appointment',
      label: 'Book Appointment',
      icon: '📅',
      variant: 'accent' as const,
      onClick: () => router.push('/dashboard/appointments'),
    },
    {
      id: 'add-pet',
      label: 'Add Pet',
      icon: '➕',
      variant: 'outline' as const,
      onClick: () => router.push('/dashboard/pets/new'),
    },
  ]

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-lg text-white/90">
              Here's what's happening with your pets today
            </p>
          </div>
          <div className="hidden md:block text-8xl animate-bounce">
            🐾
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-display font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <QuickActions actions={quickActions} />
      </div>

      {/* Pet Gallery */}
      <PetGallery
        pets={pets}
        onPetClick={(petId) => router.push(`/dashboard/pets/${petId}`)}
        onAddPet={() => router.push('/dashboard/pets/new')}
      />

      {/* Pet Switcher & Timeline (only show if pets exist) */}
      {pets.length > 0 && (
        <>
          <div>
            <h2 className="text-xl font-display font-semibold text-gray-900 mb-4">
              Pet Activity Timeline
            </h2>
            <PetSwitcher
              pets={pets}
              selectedPetId={selectedPetId}
              onPetChange={setSelectedPetId}
              className="mb-6"
            />
            <PetTimeline events={selectedPetEvents} showFilters={true} />
          </div>
        </>
      )}

      {/* Today's Tasks */}
      {pets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📋</span>
              Today's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-colors">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    Give Buddy morning medication
                  </p>
                  <p className="text-sm text-gray-600">Due at 8:00 AM</p>
                </div>
                <span className="text-3xl">💊</span>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border-2 border-green-200 hover:border-green-300 transition-colors">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Feed Whiskers</p>
                  <p className="text-sm text-gray-600">Due at 12:00 PM</p>
                </div>
                <span className="text-3xl">🍖</span>
              </div>

              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-colors">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    Buddy's vet appointment
                  </p>
                  <p className="text-sm text-gray-600">Tomorrow at 3:00 PM</p>
                </div>
                <span className="text-3xl">🏥</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Alerts */}
      {pets.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <span>⚠️</span>
              Health Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <span className="text-2xl">💊</span>
                <div>
                  <p className="text-yellow-900 font-medium">
                    <strong>Buddy:</strong> Medication refill needed in 3 days
                  </p>
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-1">
                    Order refill →
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <span className="text-2xl">🏥</span>
                <div>
                  <p className="text-yellow-900 font-medium">
                    <strong>Whiskers:</strong> Annual checkup due next month
                  </p>
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-1">
                    Schedule appointment →
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
