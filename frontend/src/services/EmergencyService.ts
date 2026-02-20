/**
 * EmergencyService
 * 
 * Handles emergency SOS functionality including:
 * - Emergency session activation with medical summary generation
 * - Google Maps Places API integration for nearby vet search (24-hour, within 10km)
 * - Emergency checklist generation by pet species
 * - Emergency contact management
 * - API quota handling with cached fallback
 * - Geolocation integration with permission handling
 */

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: 'family' | 'friend' | 'vet';
  phone: string;
  email?: string;
}

export interface VetClinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance: number; // kilometers
  is24Hour: boolean;
  location: { lat: number; lng: number };
}

export interface MedicalSummary {
  petName: string;
  species: string;
  breed: string;
  age: string;
  allergies: string[];
  currentMedications: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  recentVetVisits: Array<{
    date: string;
    reason: string;
    diagnosis?: string;
  }>;
  vaccinations: Array<{
    name: string;
    date: string;
    nextDue?: string;
  }>;
  emergencyNotes: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface EmergencySession {
  sessionId: string;
  petId: string;
  startedAt: Date;
  medicalSummary: MedicalSummary;
  nearbyVets: VetClinic[];
  checklist: ChecklistItem[];
}

// Cache for vet search results (24 hour cache)
interface VetCache {
  location: { lat: number; lng: number };
  results: VetClinic[];
  timestamp: number;
}

let vetCache: VetCache | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Fallback vet list for major Indian cities
const FALLBACK_VETS: VetClinic[] = [
  {
    id: 'fallback-1',
    name: 'Emergency Veterinary Hospital',
    address: 'Contact your local emergency vet',
    phone: '1800-XXX-XXXX',
    distance: 0,
    is24Hour: true,
    location: { lat: 0, lng: 0 }
  }
];

class EmergencyService {
  /**
   * Activate emergency session for a pet
   */
  activateEmergency(petId: string): EmergencySession {
    const sessionId = `emergency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const medicalSummary = this.generateMedicalSummary(petId);
    const checklist = this.getEmergencyChecklist(medicalSummary.species);
    
    return {
      sessionId,
      petId,
      startedAt: new Date(),
      medicalSummary,
      nearbyVets: [], // Will be populated by findNearbyVets
      checklist
    };
  }

  /**
   * Generate medical summary for a pet
   */
  generateMedicalSummary(petId: string): MedicalSummary {
    // Get pet data from localStorage
    const petsData = localStorage.getItem('pets');
    const pets = petsData ? JSON.parse(petsData) : [];
    const pet = pets.find((p: any) => p.id === petId);

    if (!pet) {
      throw new Error('Pet not found');
    }

    // Get medical history
    const medicalHistoryData = localStorage.getItem(`medicalHistory_${petId}`);
    const medicalHistory = medicalHistoryData ? JSON.parse(medicalHistoryData) : [];

    // Get vaccinations
    const vaccinationsData = localStorage.getItem(`vaccinations_${petId}`);
    const vaccinations = vaccinationsData ? JSON.parse(vaccinationsData) : [];

    // Get medications
    const medicationsData = localStorage.getItem(`medications_${petId}`);
    const medications = medicationsData ? JSON.parse(medicationsData) : [];

    // Calculate age
    const birthDate = new Date(pet.dateOfBirth);
    const today = new Date();
    const ageYears = today.getFullYear() - birthDate.getFullYear();
    const ageMonths = today.getMonth() - birthDate.getMonth();
    const age = ageYears > 0 ? `${ageYears} years` : `${ageMonths} months`;

    // Get recent vet visits (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentVisits = medicalHistory
      .filter((visit: any) => new Date(visit.date) >= sixMonthsAgo)
      .map((visit: any) => ({
        date: visit.date,
        reason: visit.reason || visit.type,
        diagnosis: visit.diagnosis || visit.notes
      }));

    return {
      petName: pet.name,
      species: pet.species,
      breed: pet.breed || 'Mixed',
      age,
      allergies: pet.allergies || [],
      currentMedications: medications
        .filter((med: any) => med.active !== false)
        .map((med: any) => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency
        })),
      recentVetVisits: recentVisits,
      vaccinations: vaccinations.map((vac: any) => ({
        name: vac.name,
        date: vac.date,
        nextDue: vac.nextDue
      })),
      emergencyNotes: pet.emergencyNotes || ''
    };
  }

  /**
   * Find nearby 24-hour veterinary clinics within 10km
   */
  async findNearbyVets(
    location: GeolocationCoordinates,
    radius: number = 10000 // 10km in meters
  ): Promise<VetClinic[]> {
    try {
      // Check cache first
      if (vetCache && this.isCacheValid(vetCache, location)) {
        return vetCache.results;
      }

      // Try Google Maps Places API
      const vets = await this.searchVetsWithGoogleMaps(location, radius);
      
      // Cache the results
      vetCache = {
        location: { lat: location.latitude, lng: location.longitude },
        results: vets,
        timestamp: Date.now()
      };

      return vets;
    } catch (error) {
      console.error('Error finding nearby vets:', error);
      // Return cached results if available, otherwise fallback
      return vetCache?.results || FALLBACK_VETS;
    }
  }

  /**
   * Search for vets using Google Maps Places API
   */
  private async searchVetsWithGoogleMaps(
    location: GeolocationCoordinates,
    radius: number
  ): Promise<VetClinic[]> {
    // Note: In production, this would call the Google Maps Places API
    // For now, return mock data that matches the requirements
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock data - in production this would come from Google Maps API
    const mockVets: VetClinic[] = [
      {
        id: 'vet-1',
        name: '24/7 Pet Emergency Center',
        address: '123 Main Street, Mumbai',
        phone: '+91-22-1234-5678',
        distance: 2.5,
        is24Hour: true,
        location: { lat: location.latitude + 0.01, lng: location.longitude + 0.01 }
      },
      {
        id: 'vet-2',
        name: 'Emergency Veterinary Hospital',
        address: '456 Park Road, Mumbai',
        phone: '+91-22-8765-4321',
        distance: 5.8,
        is24Hour: true,
        location: { lat: location.latitude + 0.02, lng: location.longitude - 0.01 }
      }
    ];

    // Filter: only 24-hour clinics within radius
    return mockVets.filter(vet => vet.is24Hour && vet.distance <= radius / 1000);
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(cache: VetCache, location: GeolocationCoordinates): boolean {
    // Check if cache is expired
    if (Date.now() - cache.timestamp > CACHE_DURATION) {
      return false;
    }

    // Check if location is similar (within ~1km)
    const latDiff = Math.abs(cache.location.lat - location.latitude);
    const lngDiff = Math.abs(cache.location.lng - location.longitude);
    const isNearby = latDiff < 0.01 && lngDiff < 0.01; // Roughly 1km

    return isNearby;
  }

  /**
   * Get emergency checklist based on pet species
   */
  getEmergencyChecklist(species: string): ChecklistItem[] {
    const commonItems: ChecklistItem[] = [
      {
        id: 'check-1',
        text: 'Bring pet medical records and vaccination history',
        completed: false,
        priority: 'high'
      },
      {
        id: 'check-2',
        text: 'Bring current medications',
        completed: false,
        priority: 'high'
      },
      {
        id: 'check-3',
        text: 'Note time symptoms started',
        completed: false,
        priority: 'high'
      },
      {
        id: 'check-4',
        text: 'Bring pet carrier or leash',
        completed: false,
        priority: 'medium'
      },
      {
        id: 'check-5',
        text: 'Bring emergency contact numbers',
        completed: false,
        priority: 'medium'
      }
    ];

    // Species-specific items
    const speciesItems: Record<string, ChecklistItem[]> = {
      dog: [
        {
          id: 'dog-1',
          text: 'Muzzle if dog is in pain (to prevent biting)',
          completed: false,
          priority: 'high'
        },
        {
          id: 'dog-2',
          text: 'Bring favorite toy for comfort',
          completed: false,
          priority: 'low'
        }
      ],
      cat: [
        {
          id: 'cat-1',
          text: 'Secure cat in carrier to prevent escape',
          completed: false,
          priority: 'high'
        },
        {
          id: 'cat-2',
          text: 'Cover carrier with blanket to reduce stress',
          completed: false,
          priority: 'medium'
        }
      ],
      bird: [
        {
          id: 'bird-1',
          text: 'Keep bird warm during transport',
          completed: false,
          priority: 'high'
        },
        {
          id: 'bird-2',
          text: 'Bring bird in secure, ventilated carrier',
          completed: false,
          priority: 'high'
        }
      ],
      fish: [
        {
          id: 'fish-1',
          text: 'Bring water sample from tank',
          completed: false,
          priority: 'high'
        },
        {
          id: 'fish-2',
          text: 'Transport in sealed container with tank water',
          completed: false,
          priority: 'high'
        }
      ]
    };

    const speciesLower = species.toLowerCase();
    const specificItems = speciesItems[speciesLower] || [];

    return [...commonItems, ...specificItems];
  }

  /**
   * Get user's current location
   */
  async getUserLocation(): Promise<GeolocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Store emergency contact
   */
  storeEmergencyContact(userId: string, contact: Omit<EmergencyContact, 'id'>): EmergencyContact {
    const contacts = this.getEmergencyContacts(userId);
    
    const newContact: EmergencyContact = {
      ...contact,
      id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    contacts.push(newContact);
    localStorage.setItem(`emergencyContacts_${userId}`, JSON.stringify(contacts));

    return newContact;
  }

  /**
   * Get all emergency contacts for a user
   */
  getEmergencyContacts(userId: string): EmergencyContact[] {
    const data = localStorage.getItem(`emergencyContacts_${userId}`);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Delete emergency contact
   */
  deleteEmergencyContact(userId: string, contactId: string): void {
    const contacts = this.getEmergencyContacts(userId);
    const filtered = contacts.filter(c => c.id !== contactId);
    localStorage.setItem(`emergencyContacts_${userId}`, JSON.stringify(filtered));
  }

  /**
   * Initiate call to emergency contact
   */
  callEmergencyContact(contact: EmergencyContact): void {
    // Open phone dialer with contact number
    window.location.href = `tel:${contact.phone}`;
  }
}

// Export singleton instance
export const emergencyService = new EmergencyService();
export default emergencyService;
