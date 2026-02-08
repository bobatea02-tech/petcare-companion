'use client'

import React from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui'
import { cn } from '@/lib/utils'
import { Pet, HealthStatus, PetSpecies } from '@/types/pets'

interface PetCardProps {
  pet: Pet
  onClick?: () => void
  showHealthStatus?: boolean
}

const speciesThemes: Record<PetSpecies, { gradient: string; icon: string; color: string; border: string }> = {
  dog: {
    gradient: 'from-amber-100 to-orange-100',
    icon: '🐕',
    color: 'text-amber-700',
    border: 'border-amber-300',
  },
  cat: {
    gradient: 'from-purple-100 to-pink-100',
    icon: '🐈',
    color: 'text-purple-700',
    border: 'border-purple-300',
  },
  bird: {
    gradient: 'from-sky-100 to-blue-100',
    icon: '🦜',
    color: 'text-sky-700',
    border: 'border-sky-300',
  },
  rabbit: {
    gradient: 'from-green-100 to-emerald-100',
    icon: '🐰',
    color: 'text-green-700',
    border: 'border-green-300',
  },
  hamster: {
    gradient: 'from-yellow-100 to-amber-100',
    icon: '🐹',
    color: 'text-yellow-700',
    border: 'border-yellow-300',
  },
  'guinea pig': {
    gradient: 'from-orange-100 to-red-100',
    icon: '🐹',
    color: 'text-orange-700',
    border: 'border-orange-300',
  },
  ferret: {
    gradient: 'from-slate-100 to-gray-100',
    icon: '🦦',
    color: 'text-slate-700',
    border: 'border-slate-300',
  },
  fish: {
    gradient: 'from-cyan-100 to-teal-100',
    icon: '🐠',
    color: 'text-cyan-700',
    border: 'border-cyan-300',
  },
  reptile: {
    gradient: 'from-lime-100 to-green-100',
    icon: '🦎',
    color: 'text-lime-700',
    border: 'border-lime-300',
  },
  other: {
    gradient: 'from-gray-100 to-slate-100',
    icon: '🐾',
    color: 'text-gray-700',
    border: 'border-gray-300',
  },
}

const healthStatusConfig: Record<HealthStatus, { color: string; label: string; icon: string; pulse?: boolean }> = {
  excellent: { color: 'bg-green-500', label: 'Excellent', icon: '✨' },
  good: { color: 'bg-blue-500', label: 'Good', icon: '👍' },
  fair: { color: 'bg-yellow-500', label: 'Fair', icon: '⚠️' },
  'needs-attention': { color: 'bg-red-500', label: 'Needs Attention', icon: '🚨', pulse: true },
}

export const PetCard: React.FC<PetCardProps> = ({ pet, onClick, showHealthStatus = true }) => {
  const theme = speciesThemes[pet.species] || speciesThemes.other
  const healthStatus = pet.health_status ? healthStatusConfig[pet.health_status] : null

  const age = pet.age_years !== undefined ? pet.age_years : 0
  const ageDisplay = age === 1 ? '1 year' : `${age} years`

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg border-2',
        `bg-gradient-to-br ${theme.gradient} ${theme.border}`,
        'group'
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Pet Photo */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-white flex-shrink-0 ring-4 ring-white shadow-md group-hover:ring-primary-200 transition-all">
            {pet.photo_url ? (
              <Image
                src={pet.photo_url}
                alt={pet.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl">
                {theme.icon}
              </div>
            )}
          </div>

          {/* Pet Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className={cn('text-xl font-display font-bold truncate', theme.color)}>
                  {pet.name}
                </h3>
                <p className="text-sm text-gray-600 capitalize">
                  {pet.breed || pet.species} • {ageDisplay}
                </p>
              </div>
              {showHealthStatus && healthStatus && (
                <div
                  className={cn(
                    'flex items-center gap-1 px-3 py-1 rounded-full text-white text-xs font-medium shadow-sm',
                    healthStatus.color,
                    healthStatus.pulse && 'animate-pulse'
                  )}
                >
                  <span>{healthStatus.icon}</span>
                  <span className="hidden sm:inline">{healthStatus.label}</span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-3">
              {pet.weight && (
                <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded-lg">
                  <span>⚖️</span>
                  <span>{pet.weight} lbs</span>
                </div>
              )}
              {pet.last_checkup && (
                <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded-lg">
                  <span>🏥</span>
                  <span className="hidden sm:inline">Last: </span>
                  <span>{pet.last_checkup}</span>
                </div>
              )}
              {pet.gender && (
                <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded-lg capitalize">
                  <span>{pet.gender === 'male' ? '♂️' : pet.gender === 'female' ? '♀️' : '⚧'}</span>
                  <span className="hidden sm:inline">{pet.gender}</span>
                </div>
              )}
            </div>

            {/* Medical Alerts */}
            {(pet.medical_conditions || pet.allergies) && (
              <div className="mt-3 flex gap-2">
                {pet.medical_conditions && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    ⚕️ Conditions
                  </span>
                )}
                {pet.allergies && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    ⚠️ Allergies
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export type { Pet }
