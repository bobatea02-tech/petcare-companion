import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NoiseOverlay } from "@/components/NoiseOverlay";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, MapPin, Loader2, Calendar, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { searchVetsByCity, searchNearbyVets, SERVICE_TYPES, type StaticVetClinic } from "@/lib/staticVetData";

interface VetClinic extends StaticVetClinic {
  distance?: number;
}

const VetSearch = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [clinics, setClinics] = useState<VetClinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<VetClinic | null>(null);
  const [serviceType, setServiceType] = useState<string>('all');
  const [emergencyOnly, setEmergencyOnly] = useState<boolean>(false);
  const [bookingData, setBookingData] = useState({
    appointment_date: '',
    appointment_time: '',
    appointment_type: 'checkup',
    purpose: '',
    notes: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter a location",
        description: "Please enter a city name or area to search",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use static data with filters
      const results = searchVetsByCity(searchQuery, serviceType, emergencyOnly);
      
      setClinics(results);
      if (results.length === 0) {
        toast({
          title: "No results",
          description: "Try different filters or search for 'Mumbai', 'Bandra', 'Andheri', etc.",
        });
      } else {
        toast({
          title: "Search complete",
          description: `Found ${results.length} vet clinic(s)`,
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: "Failed to search for vet clinics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNearbySearch = async () => {
    if (!userLocation) {
      toast({
        title: "Location not available",
        description: "Please enable location access or search by area name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use static data with distance calculation and filters
      const results = searchNearbyVets(userLocation.lat, userLocation.lng, 5, serviceType, emergencyOnly);

      setClinics(results);
      if (results.length === 0) {
        toast({
          title: "No results",
          description: "No vet clinics found nearby. Try different filters or search by area name.",
        });
      } else {
        toast({
          title: "Search complete",
          description: `Found ${results.length} nearby clinic(s)`,
        });
      }
    } catch (error) {
      console.error("Nearby search error:", error);
      toast({
        title: "Error",
        description: "Failed to search for nearby vet clinics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinic) return;

    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Login required",
        description: "Please login to book appointments",
        variant: "destructive",
      });
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    setBookingLoading(true);
    try {
      const dateTime = `${bookingData.appointment_date}T${bookingData.appointment_time}:00`;
      const appointmentData = {
        id: 'apt_' + Date.now(),
        appointment_date: new Date(dateTime).toISOString(),
        appointment_type: bookingData.appointment_type,
        purpose: bookingData.purpose,
        clinic_name: selectedClinic.name,
        clinic_address: selectedClinic.address,
        clinic_phone: selectedClinic.phone,
        notes: bookingData.notes || undefined,
        status: 'scheduled',
      };

      // Store in localStorage (mock database)
      const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      existingAppointments.push(appointmentData);
      localStorage.setItem('appointments', JSON.stringify(existingAppointments));

      toast({
        title: "Appointment booked!",
        description: `Your appointment at ${selectedClinic.name} has been scheduled.`,
      });
      
      setSelectedClinic(null);
      setBookingData({
        appointment_date: '',
        appointment_time: '',
        appointment_type: 'checkup',
        purpose: '',
        notes: '',
      });
      
      // Redirect to dashboard to see the appointment
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Error",
        description: "Failed to book appointment",
        variant: "destructive",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NoiseOverlay />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-primary text-primary-foreground"
      >
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-xl">Find Vet Clinics</h1>
            <p className="text-label text-[9px] opacity-60">Search nearby veterinary clinics</p>
          </div>
        </div>
      </motion.header>

      {/* Search Section */}
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-card rounded-card p-6 shadow-forest"
        >
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Service Type
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-pill bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {SERVICE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emergencyOnly}
                    onChange={(e) => setEmergencyOnly(e.target.checked)}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-foreground flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    Emergency/24-Hour Only
                  </span>
                </label>
              </div>
            </div>

            {/* Search Input */}
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Search by area (e.g., Bandra, Andheri, Powai...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 rounded-pill"
              />
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="rounded-pill px-6"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              onClick={handleNearbySearch}
              disabled={loading || !userLocation}
              variant="outline"
              className="w-full rounded-pill"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Search Nearby (5km)
            </Button>

            {!userLocation && (
              <p className="text-xs text-muted-foreground text-center">
                Enable location access to search nearby clinics
              </p>
            )}
          </div>
        </motion.div>

        {/* Results */}
        <div className="mt-6 space-y-4">
          <AnimatePresence>
            {clinics.map((clinic, index) => (
              <motion.div
                key={clinic.place_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card rounded-card shadow-forest overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-display text-xl text-foreground">
                          {clinic.name}
                        </h3>
                        {clinic.isEmergency && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-pill">
                            <AlertCircle className="w-3 h-3" />
                            Emergency
                          </span>
                        )}
                        {clinic.is24Hours && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-pill">
                            24 Hours
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 flex items-start gap-1">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{clinic.address}</span>
                      </p>
                      {clinic.phone && (
                        <p className="text-sm text-muted-foreground mt-2">
                          📞 {clinic.phone}
                        </p>
                      )}
                      {clinic.distance && (
                        <p className="text-xs text-muted-foreground mt-2">
                          📍 {clinic.distance.toFixed(1)} km away
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {clinic.services.slice(0, 4).map((service) => (
                          <span
                            key={service}
                            className="inline-block px-2 py-1 text-xs bg-muted text-muted-foreground rounded-pill"
                          >
                            {service}
                          </span>
                        ))}
                        {clinic.services.length > 4 && (
                          <span className="inline-block px-2 py-1 text-xs bg-muted text-muted-foreground rounded-pill">
                            +{clinic.services.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        const token = localStorage.getItem('token');
                        if (!token) {
                          toast({
                            title: "Login required",
                            description: "Please login to book appointments",
                            variant: "destructive",
                          });
                          setTimeout(() => navigate("/login"), 1500);
                          return;
                        }
                        setSelectedClinic(clinic);
                      }}
                      className="rounded-pill"
                    >
                      Book
                    </Button>
                  </div>
                </div>

                {/* Booking Form - Shows when clinic is selected */}
                {selectedClinic?.place_id === clinic.place_id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border bg-muted/30"
                  >
                    <form onSubmit={handleBookAppointment} className="p-6 space-y-4">
                      <h4 className="font-display text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Book Appointment
                      </h4>

                      {/* Appointment Type */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Appointment Type
                        </label>
                        <select
                          value={bookingData.appointment_type}
                          onChange={(e) => setBookingData({ ...bookingData, appointment_type: e.target.value })}
                          required
                          className="w-full px-4 py-2 border border-border rounded-pill bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
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

                      {/* Date and Time */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Date
                          </label>
                          <input
                            type="date"
                            value={bookingData.appointment_date}
                            onChange={(e) => setBookingData({ ...bookingData, appointment_date: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            required
                            className="w-full px-4 py-2 border border-border rounded-pill bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Time
                          </label>
                          <input
                            type="time"
                            value={bookingData.appointment_time}
                            onChange={(e) => setBookingData({ ...bookingData, appointment_time: e.target.value })}
                            required
                            className="w-full px-4 py-2 border border-border rounded-pill bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Purpose */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Purpose
                        </label>
                        <Input
                          type="text"
                          value={bookingData.purpose}
                          onChange={(e) => setBookingData({ ...bookingData, purpose: e.target.value })}
                          placeholder="e.g., Annual checkup, vaccination"
                          required
                          className="rounded-pill"
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Additional Notes (Optional)
                        </label>
                        <textarea
                          value={bookingData.notes}
                          onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                          rows={2}
                          placeholder="Any special instructions"
                          className="w-full px-4 py-2 border border-border rounded-card bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          type="submit"
                          disabled={bookingLoading}
                          className="flex-1 rounded-pill"
                        >
                          {bookingLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Booking...
                            </>
                          ) : (
                            'Confirm Booking'
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSelectedClinic(null)}
                          className="rounded-pill"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {!loading && clinics.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground">
                Search for vet clinics by location or use nearby search
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VetSearch;
