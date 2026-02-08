'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { PetProfileForm } from '@/components/pets'

export default function NewPetPage() {
  const router = useRouter()

  const handleCreatePet = async (data: any, photo?: File) => {
    // TODO: Implement API call
    console.log('Creating pet:', data, photo)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Redirect to dashboard
    router.push('/dashboard')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Add a New Pet
          </h1>
          <p className="text-gray-600">
            Create a profile for your furry, feathered, or scaly friend
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="gap-2"
        >
          ← Cancel
        </Button>
      </div>

      {/* Onboarding Tips */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="text-5xl">💡</div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-gray-900 mb-2">
                Getting Started Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Add a clear photo to help identify your pet quickly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Include medical conditions and allergies for AI-powered care recommendations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Behavioral notes help us provide personalized advice</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>You can always edit this information later</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Pet Information</CardTitle>
        </CardHeader>
        <CardContent>
          <PetProfileForm
            onSubmit={handleCreatePet}
            onCancel={() => router.push('/dashboard')}
            isEditing={false}
          />
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="text-4xl">🔒</div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-gray-900 mb-2">
                Your Pet's Privacy
              </h3>
              <p className="text-sm text-gray-700">
                All pet information is encrypted and stored securely. We never share your pet's data with third parties. 
                You have full control over your data and can export or delete it at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
