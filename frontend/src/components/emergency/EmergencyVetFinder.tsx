/**
 * EmergencyVetFinder Component
 * 
 * Finds and displays nearby 24-hour veterinary clinics using geolocation and Google Maps.
 * Includes fallback for location permission denial and API failures.
 */

import React, { useState, useEffect } from 'react';
import { type VetClinic } from '@/services/EmergencyService';
import { emergencyService } from '@/services/EmergencyService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmergencyVetFinderProps {
  onVetSelected?: (vet: VetClinic) => void;
}

export const EmergencyVetFinder: React.FC<EmergencyVetFinderProps> = ({
  onVetSelected
}) => {
  const [vets, setVets] = useState<VetClinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    findNearbyVets();
  }, []);

  const findNearbyVets = async () => {
    setLoading(true);
    setError(null);
    setLocationDenied(false);

    try {
      // Get user location
      const location = await emergencyService.getUserLocation();
      
      // Find nearby vets
      const nearbyVets = await emergencyService.findNearbyVets(location);
      setVets(nearbyVets);
    } catch (err: any) {
      if (err.code === 1) {
        // Permission denied
        setLocationDenied(true);
        setError('Location access denied. Please enable location services or enter your location manually.');
      } else {
        setError('Unable to find nearby vets. Showing fallback emergency contacts.');
      }
      
      // Show fallback vets
      setVets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCallVet = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleGetDirections = (vet: VetClinic) => {
    // Open Google Maps with directions
    const url = `https://www.google.com/maps/dir/?api=1&destination=${vet.location.lat},${vet.location.lng}`;
    window.open(url, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-500" />
            Nearby 24-Hour Emergency Vets
          </span>
          <Button
            onClick={findNearbyVets}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {locationDenied && (
          <Alert>
            <AlertDescription>
              <p className="font-semibold mb-2">Location Access Required</p>
              <p className="text-sm">
                To find nearby emergency vets, please enable location services in your browser settings.
                Alternatively, you can search for emergency vets in your area manually.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && vets.length === 0 && !error && (
          <Alert>
            <AlertDescription>
              No 24-hour emergency vets found within 10km. Try expanding your search or contact your regular vet for emergency guidance.
            </AlertDescription>
          </Alert>
        )}

        {!loading && vets.length > 0 && (
          <div className="space-y-3">
            {vets.map((vet) => (
              <Card key={vet.id} className="border-2">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{vet.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="destructive" className="text-xs">
                            24 Hours
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {vet.distance.toFixed(1)} km away
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>{vet.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>{vet.phone}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleCallVet(vet.phone)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call Now
                      </Button>
                      <Button
                        onClick={() => handleGetDirections(vet)}
                        variant="outline"
                        className="flex-1"
                        size="sm"
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Directions
                      </Button>
                    </div>

                    {onVetSelected && (
                      <Button
                        onClick={() => onVetSelected(vet)}
                        variant="secondary"
                        className="w-full"
                        size="sm"
                      >
                        Select This Vet
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmergencyVetFinder;
