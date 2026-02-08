/**
 * Example Component Demonstrating API Integration and State Management
 * 
 * This file shows how to use the new API client, state management, and UI features
 */
'use client'

import React, { useEffect } from 'react'
import { usePetStore } from '@/lib/stores/pet-store'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useUIStore } from '@/lib/stores/ui-store'
import { useApi, useMutation } from '@/lib/hooks/use-api'
import { useOptimistic } from '@/lib/hooks/use-optimistic'
import { useToast } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CardSkeleton, ListSkeleton } from '@/components/ui/skeleton'

/**
 * Example 1: Using Zustand Store
 */
export function PetListExample() {
  const { pets, fetchPets, isLoading, error } = usePetStore()
  const toast = useToast()

  useEffect(() => {
    fetchPets().catch(() => {
      toast.error('Failed to load pets')
    })
  }, [])

  if (isLoading) {
    return <ListSkeleton count={3} />
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>
  }

  return (
    <div className="space-y-4">
      {pets.map((pet) => (
        <div key={pet.id} className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-bold">{pet.name}</h3>
          <p className="text-gray-600">{pet.species}</p>
        </div>
      ))}
    </div>
  )
}

/**
 * Example 2: Using useApi Hook
 */
export function DataFetchExample() {
  const { data, isLoading, error, execute } = useApi({
    showSuccessToast: true,
    successMessage: 'Data loaded successfully',
  })

  const handleLoad = () => {
    execute({
      method: 'GET',
      url: '/care/pets',
    })
  }

  return (
    <div>
      <button
        onClick={handleLoad}
        disabled={isLoading}
        className="px-4 py-2 bg-orange-500 text-white rounded-lg"
      >
        {isLoading ? <LoadingSpinner size="sm" /> : 'Load Data'}
      </button>

      {error && <div className="mt-2 text-red-600">{error}</div>}
      {data && <pre className="mt-2">{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}

/**
 * Example 3: Using useMutation Hook
 */
export function CreatePetExample() {
  const { execute, isLoading } = useMutation({
    showSuccessToast: true,
    successMessage: 'Pet created successfully',
  })
  const { fetchPets } = usePetStore()

  const handleCreate = async () => {
    try {
      await execute({
        method: 'POST',
        url: '/care/pets',
        data: {
          name: 'Fluffy',
          species: 'cat',
          breed: 'Persian',
          birth_date: '2020-01-01',
          weight: 4.5,
          gender: 'female',
        },
      })
      // Refresh pet list
      await fetchPets()
    } catch (error) {
      console.error('Failed to create pet:', error)
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={isLoading}
      className="px-4 py-2 bg-green-500 text-white rounded-lg"
    >
      {isLoading ? 'Creating...' : 'Create Pet'}
    </button>
  )
}

/**
 * Example 4: Using Optimistic Updates
 */
export function OptimisticUpdateExample() {
  const { pets, fetchPets } = usePetStore()
  const { data, addOptimistic, updateOptimistic, deleteOptimistic } = useOptimistic(pets, {
    rollbackOnError: true,
  })

  const handleAdd = async () => {
    const newPet = {
      id: 'temp-' + Date.now(),
      name: 'New Pet',
      species: 'dog',
      breed: 'Labrador',
      birth_date: '2023-01-01',
      weight: 10,
      gender: 'male',
      user_id: 'user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await addOptimistic(newPet, async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return { ...newPet, id: 'real-' + Date.now() }
    })
  }

  return (
    <div>
      <button
        onClick={handleAdd}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg"
      >
        Add Pet (Optimistic)
      </button>

      <div className="mt-4 space-y-2">
        {data.map((pet) => (
          <div key={pet.id} className="p-2 bg-gray-100 rounded">
            {pet.name}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Example 5: Using Toast Notifications
 */
export function ToastExample() {
  const toast = useToast()

  return (
    <div className="space-x-2">
      <button
        onClick={() => toast.success('Success message')}
        className="px-4 py-2 bg-green-500 text-white rounded-lg"
      >
        Success Toast
      </button>
      <button
        onClick={() => toast.error('Error message')}
        className="px-4 py-2 bg-red-500 text-white rounded-lg"
      >
        Error Toast
      </button>
      <button
        onClick={() => toast.warning('Warning message')}
        className="px-4 py-2 bg-yellow-500 text-white rounded-lg"
      >
        Warning Toast
      </button>
      <button
        onClick={() => toast.info('Info message')}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg"
      >
        Info Toast
      </button>
    </div>
  )
}

/**
 * Example 6: Checking Online Status
 */
export function OnlineStatusExample() {
  const isOnline = useUIStore((state) => state.isOnline)

  return (
    <div
      className={`p-4 rounded-lg ${
        isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {isOnline ? '✓ Online' : '✗ Offline'}
    </div>
  )
}

/**
 * Example 7: Authentication
 */
export function AuthExample() {
  const { user, login, logout, isLoading, error } = useAuthStore()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  if (user) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p>Welcome, {user.first_name}!</p>
        <button
          onClick={logout}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full px-4 py-2 border rounded-lg"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full px-4 py-2 border rounded-lg"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      {error && <div className="text-red-600">{error}</div>}
    </form>
  )
}
