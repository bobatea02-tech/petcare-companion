'use client'

import { useRouter } from 'next/navigation'
import { RegisterForm } from '@/components/auth'

export default function RegisterPage() {
  const router = useRouter()

  const handleRegister = async (data: {
    firstName: string
    lastName: string
    email: string
    password: string
    phoneNumber?: string
  }) => {
    // TODO: Implement actual registration logic with API
    console.log('Register data:', data)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Redirect to dashboard on success
    router.push('/dashboard')
  }

  const handleSwitchToLogin = () => {
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <RegisterForm onSubmit={handleRegister} onSwitchToLogin={handleSwitchToLogin} />
    </div>
  )
}
