import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Phone, Mail, Globe, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';

interface VetClinic {
  id: string;
  name: string;
  address: string;
  phone_number: string;
  email?: string;
  website?: string;
  is_emergency: boolean;
  is_24_hour: boolean;
  services_offered?: string[];
  operating_hours?: Record<string, string>;
  distance_miles?: number;
}

interface TimeSlot {
  time: string;
  datetime: string;
  available: boolean;
}

interface MumbaiRealtimeBookingProps {
  petId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MumbaiRealtimeBooking({
  petId,
  onSuccess,
  onCancel,
}: MumbaiRealtimeBookingProps) {
  const [step, setStep] = useState<'search' | 'clinic' | 'datetime' | 'details' | 'confirm'>('search');
  const [searchType, setSearchType] = useState<'area' | 'nearest'>('area');
  
  // Search state
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [areas, setAreas] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  
  // Clinic state
  const [clinics, setClinics] = useState<VetClinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<VetClinic | null>(null);
  
  // Date/Time state
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [weekAvailability, setWeekAvailability] = useState<Record<string, TimeSlot[]>>({});
  
  // Appointment details
  const [appointmentType, setAppointmentType] = useState('checkup');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    console.log('Initializing Mumbai appointments data...');
    try {
      // Initialize Mumbai clinics
      if (!initialized) {
        try {
          console.log('Initializing Mumbai clinics...');
          await api.initializeMumbaiClinics();
          setInitialized(true);
          console.log('Clinics initialized successfully');
        } catch (error) {
          console.error('Failed to initialize clinics:', error);
          // Continue even if initialization fails (clinics might already exist)
        }
      }
      
      // Load areas and services
      try {
        console.log('Loading Mumbai areas...');
        const areasRes = await api.getMumbaiAreas();
        console.log('Areas response:', areasRes);
        if (areasRes.data) {
          console.log('Setting areas:', areasRes.data);
          setAreas(areasRes.data);
        } else {
          console.log('No areas data, using fallback');
          // Fallback to hardcoded areas if API fails
          setAreas([
            'Parel',
            'Bandra West',
            'Andheri West',
            'Powai',
            'Juhu',
            'Goregaon East',
            'Malad West',
            'Borivali West',
            'Thane West',
          ]);
        }
      } catch (error) {
        console.error('Failed to load areas:', error);
        // Fallback to hardcoded areas
        setAreas([
          'Parel',
          'Bandra West',
          'Andheri West',
          'Powai',
          'Juhu',
          'Goregaon East',
          'Malad West',
          'Borivali West',
          'Thane West',
        ]);
      }
      
      try {
        console.log('Loading service types...');
        const servicesRes = await api.getServiceTypes();
        console.log('Services response:', servicesRes);
        if (servicesRes.data) {
          console.log('Setting services:', servicesRes.data);
          setServices(servicesRes.data);
        } else {
          console.log('No services data, using fallback');
          // Fallback to hardcoded services if API fails
          setServices([
            'Emergency Care',
            'Surgery',
            'Vaccination',
            'General Checkup',
            'Dental Care',
            'Grooming',
            'Laboratory Tests',
            'X-Ray',
            'Ultrasound',
            'Sterilization',
            'Consultation',
            'Boarding',
          ]);
        }
      } catch (error) {
        console.error('Failed to load services:', error);
        // Fallback to hardcoded services
        setServices([
          'Emergency Care',
          'Surgery',
          'Vaccination',
          'General Checkup',
          'Dental Care',
          'Grooming',
          'Laboratory Tests',
          'X-Ray',
          'Ultrasound',
          'Sterilization',
          'Consultation',
          'Boarding',
        ]);
      }
      
      console.log('Final areas:', areas);
      console.log('Final services:', services);
    } catch (error) {
      console.error('Failed to initialize:', error);
      setError('Failed to load data. Please refresh the page.');
    }
  };

  const handleSearchClinics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (searchType === 'area') {
        if (!selectedArea) {
          setError('Please select an area');
          setLoading(false);
          return;
        }
        
        console.log('Searching by area:', selectedArea);
        response = await api.searchClinicsByArea(
          selectedArea,
          selectedService || undefined,
          emergencyOnly
        );
      } else {
        // Get user location
        if ('geolocation' in navigator) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          
          console.log('Searching by location:', position.coords);
          response = await api.findNearestClinics(
            position.coords.latitude,
            position.coords.longitude,
            10
          );
        } else {
          setError('Geolocation is not supported by your browser');
          setLoading(false);
          return;
        }
      }
      
      console.log('Search response:', response);
      
      if (response.data && response.data.length > 0) {
        setClinics(response.data);
        setStep('clinic');
      } else if (response.error) {
        setError(response.error);
        
        // If no clinics found, try to initialize them
        if (response.error.includes('not found') || response.error.includes('No clinics')) {
          console.log('No clinics found, attempting to initialize...');
          try {
            await api.initializeMumbaiClinics();
            setError('Clinics initialized! Please search again.');
          } catch (initError) {
            console.error('Failed to initialize clinics:', initError);
            setError('No clinics found. Please contact support.');
          }
        }
      } else {
        setError('No clinics found in this area');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search clinics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClinic = async (clinic: VetClinic) => {
    setSelectedClinic(clinic);
    setLoading(true);
    
    try {
      // Load week availability
      const response = await api.getWeekAvailability(clinic.id);
      if (response.data) {
        setWeekAvailability(response.data);
      }
      setStep('datetime');
    } catch (error) {
      setError('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    
    if (weekAvailability[date]) {
      setAvailableSlots(weekAvailability[date]);
    } else if (selectedClinic) {
      setLoading(true);
      try {
        const response = await api.checkAvailability(selectedClinic.id, date);
        if (response.data) {
          setAvailableSlots(response.data);
        }
      } catch (error) {
        setError('Failed to load slots');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedClinic || !selectedSlot) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const appointmentData = {
        appointment_date: selectedSlot.datetime,
        appointment_type: appointmentType,
        purpose: purpose,
        clinic_name: selectedClinic.name,
        clinic_address: selectedClinic.address,
        clinic_phone: selectedClinic.phone_number,
        notes: notes || undefined,
      };
      
      const response = await api.bookRealtimeAppointment(petId, appointmentData);
      
      if (response.error) {
        setError(response.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      }
    } catch (error) {
      setError('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Appointment Booked Successfully!
        </h2>
        <p className="text-gray-600 mb-4">
          Your appointment at {selectedClinic?.name} has been confirmed.
        </p>
        <p className="text-sm text-gray-500">
          You will receive reminders 24 hours and 2 hours before your appointment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display at Top */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {['Search', 'Clinic', 'Date & Time', 'Details', 'Confirm'].map((label, index) => {
          const stepNames = ['search', 'clinic', 'datetime', 'details', 'confirm'];
          const currentIndex = stepNames.indexOf(step);
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          
          return (
            <div key={label} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              {index < 4 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Search */}
      {step === 'search' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Find a Veterinary Clinic</h2>
          
          {/* Debug Info */}
          <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
            <p>Areas loaded: {areas.length}</p>
            <p>Services loaded: {services.length}</p>
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const result = await api.initializeMumbaiClinics();
                  console.log('Initialize result:', result);
                  alert('Clinics initialized! Please search again.');
                } catch (error) {
                  console.error('Init error:', error);
                  alert('Failed to initialize clinics');
                } finally {
                  setLoading(false);
                }
              }}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Initialize Mumbai Clinics
            </button>
          </div>
          
          {/* Search Type */}
          <div className="flex gap-4">
            <button
              onClick={() => setSearchType('area')}
              className={`flex-1 p-4 rounded-lg border-2 ${
                searchType === 'area'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200'
              }`}
            >
              <MapPin className="w-6 h-6 mx-auto mb-2" />
              <p className="font-medium">Search by Area</p>
            </button>
            <button
              onClick={() => setSearchType('nearest')}
              className={`flex-1 p-4 rounded-lg border-2 ${
                searchType === 'nearest'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200'
              }`}
            >
              <MapPin className="w-6 h-6 mx-auto mb-2" />
              <p className="font-medium">Find Nearest</p>
            </button>
          </div>

          {searchType === 'area' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mumbai Area
                </label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select area...</option>
                  {areas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type (Optional)
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                >
                  <option value="">All services</option>
                  {services.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={emergencyOnly}
                  onChange={(e) => setEmergencyOnly(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Emergency clinics only</span>
              </label>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleSearchClinics}
            disabled={loading || (searchType === 'area' && !selectedArea)}
            className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium"
          >
            {loading ? 'Searching...' : 'Search Clinics'}
          </button>
        </div>
      )}

      {/* Step 2: Select Clinic */}
      {step === 'clinic' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setStep('search')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Search</span>
            </button>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900">Select a Clinic</h2>
          
          {clinics.map((clinic) => (
            <div
              key={clinic.id}
              onClick={() => handleSelectClinic(clinic)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{clinic.name}</h3>
                <div className="flex gap-2">
                  {clinic.is_emergency && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                      Emergency
                    </span>
                  )}
                  {clinic.is_24_hour && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      24/7
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{clinic.address}</span>
                  {clinic.distance_miles && (
                    <span className="text-xs">({clinic.distance_miles} miles)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{clinic.phone_number}</span>
                </div>
                {clinic.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{clinic.email}</span>
                  </div>
                )}
                {clinic.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a
                      href={clinic.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
              
              {clinic.services_offered && clinic.services_offered.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {clinic.services_offered.slice(0, 5).map((service) => (
                    <span
                      key={service}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {service}
                    </span>
                  ))}
                  {clinic.services_offered.length > 5 && (
                    <span className="px-2 py-1 text-gray-500 text-xs">
                      +{clinic.services_offered.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step 3: Select Date & Time */}
      {step === 'datetime' && selectedClinic && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setStep('clinic')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Clinics</span>
            </button>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900">Select Date & Time</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>

          {selectedDate && availableSlots.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Time Slots
              </label>
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.datetime}
                    onClick={() => setSelectedSlot(slot)}
                    disabled={!slot.available}
                    className={`px-4 py-2 rounded-lg border-2 ${
                      selectedSlot?.datetime === slot.datetime
                        ? 'border-primary bg-primary text-white'
                        : slot.available
                        ? 'border-gray-200 hover:border-primary'
                        : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedDate && availableSlots.length === 0 && !loading && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
              No available slots for this date. Please select another date.
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setStep('datetime')}
              disabled={!selectedSlot}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Appointment Details */}
      {step === 'details' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setStep('datetime')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Date & Time</span>
            </button>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Type
            </label>
            <select
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="checkup">Regular Checkup</option>
              <option value="vaccination">Vaccination</option>
              <option value="surgery">Surgery</option>
              <option value="dental">Dental</option>
              <option value="grooming">Grooming</option>
              <option value="emergency">Emergency</option>
              <option value="follow-up">Follow-up</option>
              <option value="consultation">Consultation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purpose
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Annual checkup, vaccination"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any special instructions or notes"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('confirm')}
              disabled={!purpose}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium"
            >
              Review Booking
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Confirm */}
      {step === 'confirm' && selectedClinic && selectedSlot && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setStep('details')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Details</span>
            </button>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900">Confirm Appointment</h2>
          
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-600">Clinic</p>
              <p className="font-semibold">{selectedClinic.name}</p>
              <p className="text-sm text-gray-600">{selectedClinic.address}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Date & Time</p>
              <p className="font-semibold">
                {new Date(selectedSlot.datetime).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="font-semibold">{selectedSlot.time}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Appointment Type</p>
              <p className="font-semibold capitalize">{appointmentType}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Purpose</p>
              <p className="font-semibold">{purpose}</p>
            </div>
            
            {notes && (
              <div>
                <p className="text-sm text-gray-600">Notes</p>
                <p className="text-sm">{notes}</p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">Booking Failed</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleBookAppointment}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium"
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
