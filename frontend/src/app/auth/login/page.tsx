'use client'

import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/auth'

export default function LoginPage() {
  const router = useRouter()

  const handleLogin = async (data: { email: string; password: string }) => {
    // TODO: Implement actual login logic with API
    console.log('Login data:', data)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Redirect to dashboard on success
    router.push('/dashboard')
  }

  const handleSwitchToRegister = () => {
    router.push('/auth/register')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <LoginForm onSubmit={handleLogin} onSwitchToRegister={handleSwitchToRegister} />
    </div>
  )
}
