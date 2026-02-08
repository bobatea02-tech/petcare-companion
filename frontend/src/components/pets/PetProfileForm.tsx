'use client'

import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input } from '@/components/ui'
import { PetPhotoUpload } from './PetPhotoUpload'
import { PetSpecies, Gender } from '@/types/pets'
import { cn } from '@/lib/utils'

const petProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'guinea pig', 'ferret', 'fish', 'reptile', 'other'] as const),
  breed: z.string().max(100, 'Breed name is too long').optional(),
  birth_date: z.string().min(1, 'Birth date is required'),
  weight: z.number().min(0, 'Weight must be positive').max(1000, 'Weight seems too high').optional(),
  gender: z.enum(['male', 'female', 'unknown'] as const).optional(),
  medical_conditions: z.string().max(1000, 'Text is too long').optional(),
  allergies: z.string().max(1000, 'Text is too long').optional(),
  behavioral_notes: z.string().max(1000, 'Text is too long').optional(),
})

type PetProfileFormData = z.infer<typeof petProfileSchema>

interface PetProfileFormProps {
  initialData?: Partial<PetProfileFormData>
  currentPhotoUrl?: string
  onSubmit: (data: PetProfileFormData, photo?: File) => Promise<void>
  onCancel?: () => void
  isEditing?: boolean
}

const speciesOptions: { value: PetSpecies; label: string; icon: string }[] = [
  { value: 'dog', label: 'Dog', icon: '🐕' },
  { value: 'cat', label: 'Cat', icon: '🐈' },
  { value: 'bird', label: 'Bird', icon: '🦜' },
  { value: 'rabbit', label: 'Rabbit', icon: '🐰' },
  { value: 'hamster', label: 'Hamster', icon: '🐹' },
  { value: 'guinea pig', label: 'Guinea Pig', icon: '🐹' },
  { value: 'ferret', label: 'Ferret', icon: '🦦' },
  { value: 'fish', label: 'Fish', icon: '🐠' },
  { value: 'reptile', label: 'Reptile', icon: '🦎' },
  { value: 'other', label: 'Other', icon: '🐾' },
]

export const PetProfileForm: React.FC<PetProfileFormProps> = ({
  initialData,
  currentPhotoUrl,
  onSubmit,
  onCancel,
  isEditing = false,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | undefined>()

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isDirty, isValid },
  } = useForm<PetProfileFormData>({
    resolver: zodResolver(petProfileSchema),
    defaultValues: initialData,
    mode: 'onChange', // Enable inline validation
  })

  const watchedName = watch('name')

  const handleFormSubmit = async (data: PetProfileFormData) => {
    setIsLoading(true)
    try {
      await onSubmit(data, photoFile)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Pet Photo
        </label>
        <PetPhotoUpload
          onUpload={setPhotoFile}
          currentPhotoUrl={currentPhotoUrl}
          petName={watchedName}
        />
      </div>

      {/* Basic Info Section */}
      <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6 border-2 border-primary-100">
        <h3 className="text-lg font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>📝</span>
          Basic Information
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Pet Name *"
            placeholder="Buddy"
            error={errors.name?.message}
            {...register('name')}
            className={cn(
              'transition-all',
              errors.name && 'ring-2 ring-red-500',
              !errors.name && watchedName && 'ring-2 ring-green-500'
            )}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Species *
            </label>
            <Controller
              name="species"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={cn(
                    'pet-input w-full',
                    errors.species && 'ring-2 ring-red-500'
                  )}
                >
                  <option value="">Select species...</option>
                  {speciesOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.species && (
              <p className="mt-1 text-sm text-red-600">{errors.species.message}</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <Input
            label="Breed"
            placeholder="Golden Retriever"
            error={errors.breed?.message}
            {...register('breed')}
          />

          <Input
            label="Birth Date *"
            type="date"
            error={errors.birth_date?.message}
            {...register('birth_date')}
            max={new Date().toISOString().split('T')[0]}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <select {...field} className="pet-input w-full">
                  <option value="">Select...</option>
                  <option value="male">♂️ Male</option>
                  <option value="female">♀️ Female</option>
                  <option value="unknown">⚧ Unknown</option>
                </select>
              )}
            />
          </div>
        </div>

        <div className="mt-4">
          <Input
            label="Weight (lbs)"
            type="number"
            step="0.1"
            placeholder="45.5"
            error={errors.weight?.message}
            {...register('weight', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Medical Info Section */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-100">
        <h3 className="text-lg font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>⚕️</span>
          Medical Information
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical Conditions
            </label>
            <textarea
              className={cn(
                'pet-input w-full min-h-[100px] resize-y',
                errors.medical_conditions && 'ring-2 ring-red-500'
              )}
              placeholder="List any medical conditions (e.g., arthritis, diabetes)..."
              {...register('medical_conditions')}
            />
            {errors.medical_conditions && (
              <p className="mt-1 text-sm text-red-600">
                {errors.medical_conditions.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Allergies
            </label>
            <textarea
              className={cn(
                'pet-input w-full min-h-[100px] resize-y',
                errors.allergies && 'ring-2 ring-red-500'
              )}
              placeholder="List any allergies (e.g., chicken, pollen, medications)..."
              {...register('allergies')}
            />
            {errors.allergies && (
              <p className="mt-1 text-sm text-red-600">{errors.allergies.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Behavioral Notes
            </label>
            <textarea
              className={cn(
                'pet-input w-full min-h-[100px] resize-y',
                errors.behavioral_notes && 'ring-2 ring-red-500'
              )}
              placeholder="Any behavioral notes (e.g., anxious around strangers, loves treats)..."
              {...register('behavioral_notes')}
            />
            {errors.behavioral_notes && (
              <p className="mt-1 text-sm text-red-600">
                {errors.behavioral_notes.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-end items-center pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!isDirty || !isValid}
          className="min-w-[150px]"
        >
          {isLoading ? (
            <span>Saving...</span>
          ) : (
            <span>
              {isEditing ? '💾 Update Profile' : '✨ Create Profile'}
            </span>
          )}
        </Button>
      </div>

      {/* Form Status */}
      {!isValid && Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700 font-medium">
            ⚠️ Please fix the errors above before submitting
          </p>
        </div>
      )}
    </form>
  )
}
