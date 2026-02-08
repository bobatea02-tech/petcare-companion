'use client'

import React, { useState, useEffect } from 'react'
import { Pet, PetSpecies } from '@/types/pets'
import { cn } from '@/lib/utils'

interface PetSwitcherProps {
  pets: Pet[]
  selectedPetId: string
  onPetChange: (petId: string) => void
  className?: string
}

const speciesIcons: Record<PetSpecies, string> = {
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

export const PetSwitcher: React.FC<PetSwitcherProps> = ({
  pets,
  selectedPetId,
  onPetChange,
  className,
}) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const selectedIndex = pets.findIndex(p => p.id === selectedPetId)

  const handlePetClick = (petId: string) => {
    if (petId === selectedPetId || isAnimating) return
    
    setIsAnimating(true)
    onPetChange(petId)
    
    setTimeout(() => setIsAnimating(false), 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent, petId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handlePetClick(petId)
    }
  }

  if (pets.length === 0) {
    return null
  }

  if (pets.length === 1) {
    const pet = pets[0]
    return (
      <div className={cn('flex items-center gap-3 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl border-2 border-primary-200', className)}>
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-md">
          {pet.photo_url ? (
            <img src={pet.photo_url} alt={pet.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            speciesIcons[pet.species]
          )}
        </div>
        <div>
          <h3 className="font-display font-bold text-gray-900">{pet.name}</h3>
          <p className="text-sm text-gray-600 capitalize">{pet.species}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-gray-600">Switch Pet:</span>
        <span className="text-xs text-gray-500">({pets.length} total)</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {pets.map((pet, index) => {
          const isSelected = pet.id === selectedPetId
          const icon = speciesIcons[pet.species]

          return (
            <button
              key={pet.id}
              onClick={() => handlePetClick(pet.id)}
              onKeyDown={(e) => handleKeyDown(e, pet.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 min-w-[100px]',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                isSelected
                  ? 'bg-gradient-to-br from-primary-100 to-accent-100 border-2 border-primary-400 shadow-md scale-105'
                  : 'bg-gray-50 border-2 border-gray-200 hover:border-primary-300 hover:bg-gray-100 hover:scale-102',
                isAnimating && 'pointer-events-none'
              )}
              aria-label={`Switch to ${pet.name}`}
              aria-pressed={isSelected}
            >
              <div
                className={cn(
                  'w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all',
                  isSelected
                    ? 'bg-white shadow-lg ring-4 ring-primary-200'
                    : 'bg-white shadow-sm'
                )}
              >
                {pet.photo_url ? (
                  <img
                    src={pet.photo_url}
                    alt={pet.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  icon
                )}
              </div>
              <div className="text-center">
                <p
                  className={cn(
                    'font-medium text-sm truncate max-w-[80px]',
                    isSelected ? 'text-primary-700' : 'text-gray-700'
                  )}
                >
                  {pet.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">{pet.species}</p>
              </div>
              {isSelected && (
                <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </button>
          )
        })}
      </div>

      {/* Navigation hint for many pets */}
      {pets.length > 4 && (
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">← Scroll to see more pets →</p>
        </div>
      )}
    </div>
  )
}
