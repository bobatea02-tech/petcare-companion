import { useState } from 'react';
import { MapPin, Calendar, Clock, Shield, ArrowLeft } from 'lucide-react';
import { MumbaiRealtimeBooking } from '@/components/appointments';
import { useNavigate } from 'react-router-dom';

export default function MumbaiAppointments() {
  const navigate = useNavigate();
  const [showBooking, setShowBooking] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string>('default-pet-id'); // Replace with actual pet selection

  const handleBookingSuccess = () => {
    setShowBooking(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Mumbai Veterinary Appointments
              </h1>
              <p className="text-gray-600">
                Real-time booking for Mumbai, Maharashtra
              </p>
            </div>
          </div>
          
          {/* Location Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
            <MapPin className="w-4 h-4" />
            <span>Mumbai, Maharashtra, India</span>
          </div>
        </div>

        {/* Features Banner */}
        {!showBooking && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-blue-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Real-Time Availability</h3>
              </div>
              <p className="text-sm text-gray-600">
                See actual available slots updated in real-time based on clinic schedules
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-green-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">10+ Mumbai Clinics</h3>
              </div>
              <p className="text-sm text-gray-600">
                Access to verified veterinary clinics across Bandra, Andheri, Powai, and more
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-purple-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">24/7 Emergency Care</h3>
              </div>
              <p className="text-sm text-gray-600">
                Find emergency clinics with 24-hour availability for urgent pet care
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {!showBooking ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Book Your Pet's Appointment
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Choose from 10+ verified veterinary clinics across Mumbai. See real-time
                availability and book instantly with automatic reminders.
              </p>
              <button
                onClick={() => setShowBooking(true)}
                className="px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-lg"
              >
                Start Booking
              </button>
            </div>
          ) : (
            <MumbaiRealtimeBooking
              petId={selectedPetId}
              onSuccess={handleBookingSuccess}
              onCancel={() => setShowBooking(false)}
            />
          )}
        </div>

        {/* Clinic Areas */}
        {!showBooking && (
          <div className="mt-8 bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Available in These Mumbai Areas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                'Parel',
                'Bandra West',
                'Andheri West',
                'Powai',
                'Juhu',
                'Goregaon East',
                'Malad West',
                'Borivali West',
                'Thane West',
              ].map((area) => (
                <div
                  key={area}
                  className="px-4 py-2 bg-gray-50 rounded-lg text-center text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {area}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        {!showBooking && (
          <div className="mt-8 bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Available Services
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                'Emergency Care',
                'Surgery',
                'Vaccination',
                'General Checkup',
                'Dental Care',
                'Grooming',
                'Laboratory Tests',
                'X-Ray & Ultrasound',
              ].map((service) => (
                <div
                  key={service}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg text-sm text-blue-700"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  {service}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Footer */}
        {!showBooking && (
          <div className="mt-8 bg-gradient-to-r from-orange-50 to-green-50 rounded-lg p-6 border border-orange-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  How Real-Time Booking Works
                </h3>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-orange-600">1.</span>
                    <span>Search for clinics by area or find nearest ones using your location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-orange-600">2.</span>
                    <span>View real-time available slots based on clinic operating hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-orange-600">3.</span>
                    <span>Select your preferred date and time from available slots</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-orange-600">4.</span>
                    <span>Confirm booking and receive automatic reminders 24h and 2h before</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
