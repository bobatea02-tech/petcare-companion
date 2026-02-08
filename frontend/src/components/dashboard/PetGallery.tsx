'use client'

import React, { useState } from 'react'
import { Pet } from '@/types/pets'
import { PetCard } from '@/components/pets'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface PetGalleryProps {
  pets: Pet[]
  onPetClick: (petId: string) => void
  onAddPet: () => void
}

export const PetGallery: React.FC<PetGalleryProps> = ({
  pets,
  onPetClick,
  onAddPet,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleNext = () => {
    if (isAnimating || currentIndex >= pets.length - 1) return
    setIsAnimating(true)
    setCurrentIndex((prev) => prev + 1)
    setTimeout(() => setIsAnimating(false), 300)
  }

  const handlePrevious = () => {
    if (isAnimating || currentIndex <= 0) return
    setIsAnimating(true)
    setCurrentIndex((prev) => prev - 1)
    setTimeout(() => setIsAnimating(false), 300)
  }

  const handleDotClick = (index: number) => {
    if (isAnimating || index === currentIndex) return
    setIsAnimating(true)
    setCurrentIndex(index)
    setTimeout(() => setIsAnimating(false), 300)
  }

  if (pets.length === 0) {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-12 text-center border-2 border-dashed border-primary-200">
        <div className="max-w-md mx-auto">
          <div className="text-8xl mb-6 animate-bounce">🐾</div>
          <h3 className="text-2xl font-display font-bold text-gray-900 mb-3">
            Welcome to PawPal!
          </h3>
          <p className="text-gray-600 mb-6 text-lg">
            Start your pet care journey by adding your first furry, feathered, or scaly friend
          </p>
          <Button
            size="lg"
            onClick={onAddPet}
            className="shadow-lg hover:shadow-xl transition-shadow"
          >
            <span className="text-xl mr-2">➕</span>
            Add Your First Pet
          </Button>
        </div>
      </div>
    )
  }

  // Show grid view for 1-3 pets
  if (pets.length <= 3) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-semibold text-gray-900">
            My Pets ({pets.length})
          </h2>
          <Button variant="outline" onClick={onAddPet}>
            <span className="mr-2">➕</span>
            Add Pet
          </Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onClick={() => onPetClick(pet.id)}
            />
          ))}
        </div>
      </div>
    )
  }

  // Show carousel for 4+ pets
  const visiblePets = pets.slice(currentIndex, currentIndex + 3)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-semibold text-gray-900">
          My Pets ({pets.length})
        </h2>
        <Button variant="outline" onClick={onAddPet}>
          <span className="mr-2">➕</span>
          Add Pet
        </Button>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Navigation Buttons */}
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10',
            'w-12 h-12 rounded-full bg-white shadow-lg',
            'flex items-center justify-center',
            'transition-all hover:scale-110',
            currentIndex === 0 && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Previous pets"
        >
          <span className="text-2xl">←</span>
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex >= pets.length - 3}
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10',
            'w-12 h-12 rounded-full bg-white shadow-lg',
            'flex items-center justify-center',
            'transition-all hover:scale-110',
            currentIndex >= pets.length - 3 && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Next pets"
        >
          <span className="text-2xl">→</span>
        </button>

        {/* Pet Cards */}
        <div className="overflow-hidden px-2">
          <div
            className={cn(
              'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
              'transition-all duration-300 ease-in-out',
              isAnimating && 'opacity-50'
            )}
          >
            {visiblePets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onClick={() => onPetClick(pet.id)}
              />
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.ceil(pets.length / 3) }).map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index * 3)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                Math.floor(currentIndex / 3) === index
                  ? 'bg-primary-500 w-8'
                  : 'bg-gray-300 hover:bg-gray-400'
              )}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
