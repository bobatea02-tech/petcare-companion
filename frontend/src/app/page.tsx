import Link from 'next/link'
import { Button } from '@/components/ui'
import { PawIcon, BoneIcon } from '@/components/icons'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <PawIcon size={80} className="text-primary-500 animate-paw-bounce" />
          </div>
          
          <h1 className="text-6xl font-display font-bold text-gray-900 mb-6">
            Welcome to <span className="text-primary-500">PawPal</span>
          </h1>
          
          <p className="text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your AI-powered pet care assistant for comprehensive health management,
            medication tracking, and emergency support.
          </p>
          
          <div className="flex gap-4 justify-center mb-16">
            <Link href="/auth/register">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-20">
          <div className="pet-card p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🏥</span>
              </div>
            </div>
            <h3 className="text-xl font-display font-semibold mb-3">
              AI Health Assessment
            </h3>
            <p className="text-gray-600">
              Get instant triage recommendations for your pet's symptoms with
              AI-powered analysis
            </p>
          </div>

          <div className="pet-card p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">💊</span>
              </div>
            </div>
            <h3 className="text-xl font-display font-semibold mb-3">
              Medication Tracking
            </h3>
            <p className="text-gray-600">
              Never miss a dose with automated reminders and refill alerts for
              your pet's medications
            </p>
          </div>

          <div className="pet-card p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🎤</span>
              </div>
            </div>
            <h3 className="text-xl font-display font-semibold mb-3">
              Voice Assistant
            </h3>
            <p className="text-gray-600">
              Interact naturally with voice commands to log care activities and
              get instant answers
            </p>
          </div>

          <div className="pet-card p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">📍</span>
              </div>
            </div>
            <h3 className="text-xl font-display font-semibold mb-3">
              Emergency Locator
            </h3>
            <p className="text-gray-600">
              Find nearby 24/7 emergency veterinary clinics instantly when you
              need them most
            </p>
          </div>

          <div className="pet-card p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">📊</span>
              </div>
            </div>
            <h3 className="text-xl font-display font-semibold mb-3">
              Health Records
            </h3>
            <p className="text-gray-600">
              Maintain comprehensive medical history with AI-powered insights
              and exportable summaries
            </p>
          </div>

          <div className="pet-card p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🔔</span>
              </div>
            </div>
            <h3 className="text-xl font-display font-semibold mb-3">
              Smart Notifications
            </h3>
            <p className="text-gray-600">
              Receive timely reminders for medications, appointments, and
              feeding schedules
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20 py-16 px-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl text-white">
          <BoneIcon size={48} className="mx-auto mb-6 animate-float" />
          <h2 className="text-4xl font-display font-bold mb-4">
            Ready to give your pet the best care?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of pet owners using PawPal for smarter pet care
          </p>
          <Link href="/auth/register">
            <Button
              size="lg"
              className="bg-white text-primary-500 hover:bg-gray-100"
            >
              Start Free Today
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2026 PawPal. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="hover:text-primary-500">Privacy Policy</a>
            <a href="#" className="hover:text-primary-500">Terms of Service</a>
            <a href="#" className="hover:text-primary-500">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
