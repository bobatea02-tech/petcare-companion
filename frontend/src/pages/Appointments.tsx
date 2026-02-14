import { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { AppointmentCalendar, AppointmentBooking } from '@/components/appointments';

export default function Appointments() {
  const [showBooking, setShowBooking] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | undefined>();

  const handleBookingSuccess = () => {
    setShowBooking(false);
    // Refresh appointments list
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Appointments
              </h1>
              <p className="text-gray-600">
                Manage your pet's veterinary appointments
              </p>
            </div>
            {!showBooking && (
              <button
                onClick={() => setShowBooking(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Book Appointment
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {showBooking ? (
            <AppointmentBooking
              petId={selectedPetId || 'default-pet-id'} // You'll need to handle pet selection
              onSuccess={handleBookingSuccess}
              onCancel={() => setShowBooking(false)}
            />
          ) : (
            <AppointmentCalendar petId={selectedPetId} />
          )}
        </div>

        {/* Features Info */}
        {!showBooking && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Calendar Integration
              </h3>
              <p className="text-gray-600 text-sm">
                Download appointments to your calendar app with automatic reminders
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Conflict Detection
              </h3>
              <p className="text-gray-600 text-sm">
                Automatically detects scheduling conflicts to prevent double-booking
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Smart Reminders
              </h3>
              <p className="text-gray-600 text-sm">
                Get notified 24 hours and 2 hours before your appointments
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
