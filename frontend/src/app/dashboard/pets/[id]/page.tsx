'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { PetProfileForm, PetTimeline } from '@/components/pets'
import { Pet, TimelineEvent } from '@/types/pets'
import { cn } from '@/lib/utils'

// Mock data
const mockPet: Pet = {
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
  medical_conditions: 'Mild arthritis in left hip',
  allergies: 'None known',
  behavioral_notes: 'Very friendly, loves treats, anxious during thunderstorms',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockEvents: TimelineEvent[] = [
  {
    id: '1',
    pet_id: '1',
    type: 'medication',
    title: 'Morning medication',
    description: 'Arthritis medication - 50mg',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    pet_id: '1',
    type: 'feeding',
    title: 'Breakfast',
    description: '2 cups of dry food',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
]

export default function PetDetailPage() {
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string

  const [pet, setPet] = useState<Pet | null>(mockPet)
  const [isEditing, setIsEditing] = useState(false)
  const [events, setEvents] = useState<TimelineEvent[]>(mockEvents)
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'medical'>('overview')

  if (!pet) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">🐾</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pet not found</h2>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const handleUpdatePet = async (data: any, photo?: File) => {
    // TODO: Implement API call
    console.log('Updating pet:', data, photo)
    setIsEditing(false)
  }

  const speciesIcons: Record<string, string> = {
    dog: '🐕',
    cat: '🐈',
    bird: '🦜',
    rabbit: '🐰',
    hamster: '🐹',
    'guinea pig': '🐹',
    ferret: '🦦',
    fish: '🐠',
    reptile: '🦎',
    other: '🐾',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="gap-2"
        >
          ← Back to Dashboard
        </Button>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <span>✏️</span>
            Edit Profile
          </Button>
        )}
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit {pet.name}'s Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <PetProfileForm
              initialData={{
                name: pet.name,
                species: pet.species,
                breed: pet.breed,
                birth_date: pet.birth_date,
                weight: pet.weight,
                gender: pet.gender,
                medical_conditions: pet.medical_conditions,
                allergies: pet.allergies,
                behavioral_notes: pet.behavioral_notes,
              }}
              currentPhotoUrl={pet.photo_url}
              onSubmit={handleUpdatePet}
              onCancel={() => setIsEditing(false)}
              isEditing={true}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pet Profile Card */}
          <Card className="bg-gradient-to-br from-primary-50 to-accent-50 border-2 border-primary-200">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Photo */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full bg-white shadow-lg ring-4 ring-white flex items-center justify-center text-6xl">
                    {pet.photo_url ? (
                      <img
                        src={pet.photo_url}
                        alt={pet.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      speciesIcons[pet.species]
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
                        {pet.name}
                      </h1>
                      <p className="text-lg text-gray-600 capitalize">
                        {pet.breed || pet.species} • {pet.age_years} {pet.age_years === 1 ? 'year' : 'years'} old
                      </p>
                    </div>
                    {pet.health_status && (
                      <span className={cn(
                        'px-4 py-2 rounded-full text-white font-medium shadow-md',
                        pet.health_status === 'excellent' && 'bg-green-500',
                        pet.health_status === 'good' && 'bg-blue-500',
                        pet.health_status === 'fair' && 'bg-yellow-500',
                        pet.health_status === 'needs-attention' && 'bg-red-500'
                      )}>
                        {pet.health_status === 'excellent' && '✨ Excellent'}
                        {pet.health_status === 'good' && '👍 Good'}
                        {pet.health_status === 'fair' && '⚠️ Fair'}
                        {pet.health_status === 'needs-attention' && '🚨 Needs Attention'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {pet.weight && (
                      <div className="bg-white/60 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">Weight</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {pet.weight} lbs
                        </p>
                      </div>
                    )}
                    {pet.gender && (
                      <div className="bg-white/60 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">Gender</p>
                        <p className="text-lg font-semibold text-gray-900 capitalize">
                          {pet.gender}
                        </p>
                      </div>
                    )}
                    {pet.last_checkup && (
                      <div className="bg-white/60 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">Last Checkup</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {pet.last_checkup}
                        </p>
                      </div>
                    )}
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">Birth Date</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(pet.birth_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex gap-2 border-b-2 border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                'px-6 py-3 font-medium transition-all',
                activeTab === 'overview'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              📋 Overview
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={cn(
                'px-6 py-3 font-medium transition-all',
                activeTab === 'timeline'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              📅 Timeline
            </button>
            <button
              onClick={() => setActiveTab('medical')}
              className={cn(
                'px-6 py-3 font-medium transition-all',
                activeTab === 'medical'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              ⚕️ Medical Info
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-700">Medications</span>
                      <span className="font-semibold text-blue-600">2 active</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-gray-700">Appointments</span>
                      <span className="font-semibold text-green-600">1 upcoming</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-gray-700">Activities Logged</span>
                      <span className="font-semibold text-purple-600">24 this week</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Behavioral Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {pet.behavioral_notes || 'No behavioral notes recorded'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'timeline' && (
            <Card>
              <CardContent className="p-6">
                <PetTimeline events={events} showFilters={true} />
              </CardContent>
            </Card>
          )}

          {activeTab === 'medical' && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>⚕️</span>
                    Medical Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {pet.medical_conditions || 'No medical conditions recorded'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>⚠️</span>
                    Allergies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {pet.allergies || 'No allergies recorded'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
