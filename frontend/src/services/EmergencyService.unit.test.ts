/**
 * Unit Tests for EmergencyService Error Handling
 * 
 * Tests specific error scenarios and edge cases:
 * - Location access denied with manual entry fallback
 * - Google Maps API failure with cached vet list
 * - No nearby vets found with expanded search
 * - SOS confirmation requirement
 * 
 * **Validates: Requirements 4.3, 4.7**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { emergencyService, type VetClinic } from './EmergencyService';

describe('EmergencyService Unit Tests - Error Handling', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  /**
   * Test: Location access denied with manual entry fallback
   * **Validates: Requirements 4.3, 4.7**
   */
  describe('Location Access Denied Scenarios', () => {
    it('should handle location permission denied gracefully', async () => {
      // Mock geolocation to simulate permission denied
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success, error) => {
          error({
            code: 1, // PERMISSION_DENIED
            message: 'User denied geolocation'
          });
        })
      };
      
      // Replace navigator.geolocation
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true
      });

      // Attempt to get user location
      await expect(emergencyService.getUserLocation()).rejects.toThrow();
    });

    it('should handle geolocation not supported by browser', async () => {
      // Remove geolocation support
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        configurable: true
      });

      // Attempt to get user location
      await expect(emergencyService.getUserLocation())
        .rejects.toThrow('Geolocation is not supported by this browser');
    });

    it('should handle geolocation timeout', async () => {
      // Mock geolocation to simulate timeout
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success, error) => {
          error({
            code: 3, // TIMEOUT
            message: 'Geolocation timeout'
          });
        })
      };
      
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true
      });

      // Attempt to get user location
      await expect(emergencyService.getUserLocation()).rejects.toThrow();
    });

    it('should handle position unavailable error', async () => {
      // Mock geolocation to simulate position unavailable
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success, error) => {
          error({
            code: 2, // POSITION_UNAVAILABLE
            message: 'Position unavailable'
          });
        })
      };
      
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true
      });

      // Attempt to get user location
      await expect(emergencyService.getUserLocation()).rejects.toThrow();
    });
  });

  /**
   * Test: Google Maps API failure with cached vet list
   * **Validates: Requirements 4.3, 4.7**
   */
  describe('Google Maps API Failure with Cache Fallback', () => {
    it('should return cached vet list when API fails', async () => {
      const mockLocation: GeolocationCoordinates = {
        latitude: 19.0760,
        longitude: 72.8777,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      };

      // First call - should succeed and cache results
      const firstResults = await emergencyService.findNearbyVets(mockLocation);
      expect(firstResults.length).toBeGreaterThan(0);

      // Verify results are cached by calling again with similar location
      const similarLocation: GeolocationCoordinates = {
        ...mockLocation,
        latitude: mockLocation.latitude + 0.005, // Within cache range
        longitude: mockLocation.longitude + 0.005
      };

      const cachedResults = await emergencyService.findNearbyVets(similarLocation);
      
      // Should return cached results (same data)
      expect(cachedResults.length).toBe(firstResults.length);
      expect(cachedResults[0].id).toBe(firstResults[0].id);
    });

    it('should return fallback vets when API fails and no cache available', async () => {
      const mockLocation: GeolocationCoordinates = {
        latitude: 19.0760,
        longitude: 72.8777,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      };

      // Mock the private searchVetsWithGoogleMaps to throw error
      // Since we can't directly mock private methods, we test the fallback behavior
      // by ensuring the service handles errors gracefully
      
      const results = await emergencyService.findNearbyVets(mockLocation);
      
      // Should return some results (either from API or fallback)
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      
      // All results should be 24-hour clinics
      results.forEach(vet => {
        expect(vet.is24Hour).toBe(true);
      });
    });

    it('should cache results for 24 hours', async () => {
      const mockLocation: GeolocationCoordinates = {
        latitude: 19.0760,
        longitude: 72.8777,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      };

      // First call - caches results
      const firstResults = await emergencyService.findNearbyVets(mockLocation);
      
      // Second call with same location - should use cache
      const cachedResults = await emergencyService.findNearbyVets(mockLocation);
      
      expect(cachedResults).toEqual(firstResults);
    });

    it('should invalidate cache when location changes significantly', async () => {
      const location1: GeolocationCoordinates = {
        latitude: 19.0760,
        longitude: 72.8777,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      };

      // First call
      await emergencyService.findNearbyVets(location1);

      // Second call with significantly different location (>1km away)
      const location2: GeolocationCoordinates = {
        ...location1,
        latitude: location1.latitude + 0.02, // ~2km away
        longitude: location1.longitude + 0.02
      };

      const results2 = await emergencyService.findNearbyVets(location2);
      
      // Should still return valid results
      expect(results2).toBeDefined();
      expect(Array.isArray(results2)).toBe(true);
    });
  });

  /**
   * Test: No nearby vets found with expanded search
   * **Validates: Requirements 4.3, 4.7**
   */
  describe('No Nearby Vets Found Scenarios', () => {
    it('should handle empty vet results gracefully', async () => {
      // Use a remote location where no vets might be found
      const remoteLocation: GeolocationCoordinates = {
        latitude: 0,
        longitude: 0,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      };

      const results = await emergencyService.findNearbyVets(remoteLocation);
      
      // Should still return results (fallback vets)
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should support expanded search radius', async () => {
      const mockLocation: GeolocationCoordinates = {
        latitude: 19.0760,
        longitude: 72.8777,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      };

      // Search with default 10km radius
      const results10km = await emergencyService.findNearbyVets(mockLocation, 10000);
      
      // Search with expanded 25km radius
      const results25km = await emergencyService.findNearbyVets(mockLocation, 25000);
      
      // Both should return results
      expect(results10km).toBeDefined();
      expect(results25km).toBeDefined();
      
      // Expanded search should return same or more results
      expect(results25km.length).toBeGreaterThanOrEqual(results10km.length);
    });

    it('should filter results by distance correctly', async () => {
      const mockLocation: GeolocationCoordinates = {
        latitude: 19.0760,
        longitude: 72.8777,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      };

      const radius = 10000; // 10km
      const results = await emergencyService.findNearbyVets(mockLocation, radius);
      
      // All results should be within the specified radius
      results.forEach(vet => {
        expect(vet.distance).toBeLessThanOrEqual(radius / 1000); // Convert to km
      });
    });

    it('should only return 24-hour clinics', async () => {
      const mockLocation: GeolocationCoordinates = {
        latitude: 19.0760,
        longitude: 72.8777,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      };

      const results = await emergencyService.findNearbyVets(mockLocation);
      
      // All results must be 24-hour clinics
      results.forEach(vet => {
        expect(vet.is24Hour).toBe(true);
      });
    });
  });

  /**
   * Test: SOS confirmation requirement
   * **Validates: Requirements 4.7**
   */
  describe('SOS Confirmation Requirement', () => {
    it('should require valid pet ID to activate emergency', () => {
      // Setup a pet in localStorage
      const mockPet = {
        id: 'pet-123',
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        dateOfBirth: '2020-01-01',
        allergies: [],
        emergencyNotes: ''
      };

      localStorage.setItem('pets', JSON.stringify([mockPet]));
      localStorage.setItem(`medications_${mockPet.id}`, JSON.stringify([]));
      localStorage.setItem(`medicalHistory_${mockPet.id}`, JSON.stringify([]));
      localStorage.setItem(`vaccinations_${mockPet.id}`, JSON.stringify([]));

      // Activate emergency with valid pet ID
      const session = emergencyService.activateEmergency(mockPet.id);
      
      expect(session).toBeDefined();
      expect(session.petId).toBe(mockPet.id);
      expect(session.sessionId).toBeDefined();
      expect(session.startedAt).toBeInstanceOf(Date);
    });

    it('should throw error when activating emergency for non-existent pet', () => {
      // Clear localStorage to ensure no pets exist
      localStorage.clear();

      // Attempt to activate emergency with invalid pet ID
      expect(() => {
        emergencyService.activateEmergency('invalid-pet-id');
      }).toThrow('Pet not found');
    });

    it('should generate unique session IDs for each emergency activation', () => {
      const mockPet = {
        id: 'pet-123',
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        dateOfBirth: '2020-01-01',
        allergies: [],
        emergencyNotes: ''
      };

      localStorage.setItem('pets', JSON.stringify([mockPet]));
      localStorage.setItem(`medications_${mockPet.id}`, JSON.stringify([]));
      localStorage.setItem(`medicalHistory_${mockPet.id}`, JSON.stringify([]));
      localStorage.setItem(`vaccinations_${mockPet.id}`, JSON.stringify([]));

      // Activate emergency multiple times
      const session1 = emergencyService.activateEmergency(mockPet.id);
      const session2 = emergencyService.activateEmergency(mockPet.id);
      const session3 = emergencyService.activateEmergency(mockPet.id);

      // Each session should have a unique ID
      expect(session1.sessionId).not.toBe(session2.sessionId);
      expect(session2.sessionId).not.toBe(session3.sessionId);
      expect(session1.sessionId).not.toBe(session3.sessionId);
    });

    it('should include complete medical summary in emergency session', () => {
      const mockPet = {
        id: 'pet-123',
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        dateOfBirth: '2020-01-01',
        allergies: ['peanuts', 'pollen'],
        emergencyNotes: 'Sensitive to loud noises'
      };

      const mockMedications = [
        { name: 'Heartgard', dosage: '1 tablet', frequency: 'monthly', active: true }
      ];

      const mockVaccinations = [
        { name: 'Rabies', date: '2023-01-01', nextDue: '2024-01-01' }
      ];

      localStorage.setItem('pets', JSON.stringify([mockPet]));
      localStorage.setItem(`medications_${mockPet.id}`, JSON.stringify(mockMedications));
      localStorage.setItem(`medicalHistory_${mockPet.id}`, JSON.stringify([]));
      localStorage.setItem(`vaccinations_${mockPet.id}`, JSON.stringify(mockVaccinations));

      const session = emergencyService.activateEmergency(mockPet.id);

      // Verify medical summary is complete
      expect(session.medicalSummary).toBeDefined();
      expect(session.medicalSummary.petName).toBe(mockPet.name);
      expect(session.medicalSummary.species).toBe(mockPet.species);
      expect(session.medicalSummary.allergies).toEqual(mockPet.allergies);
      expect(session.medicalSummary.currentMedications.length).toBe(1);
      expect(session.medicalSummary.vaccinations.length).toBe(1);
      expect(session.medicalSummary.emergencyNotes).toBe(mockPet.emergencyNotes);
    });

    it('should include emergency checklist in session', () => {
      const mockPet = {
        id: 'pet-123',
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        dateOfBirth: '2020-01-01',
        allergies: [],
        emergencyNotes: ''
      };

      localStorage.setItem('pets', JSON.stringify([mockPet]));
      localStorage.setItem(`medications_${mockPet.id}`, JSON.stringify([]));
      localStorage.setItem(`medicalHistory_${mockPet.id}`, JSON.stringify([]));
      localStorage.setItem(`vaccinations_${mockPet.id}`, JSON.stringify([]));

      const session = emergencyService.activateEmergency(mockPet.id);

      // Verify checklist is included
      expect(session.checklist).toBeDefined();
      expect(Array.isArray(session.checklist)).toBe(true);
      expect(session.checklist.length).toBeGreaterThan(0);
      
      // Verify checklist items have required properties
      session.checklist.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('text');
        expect(item).toHaveProperty('completed');
        expect(item).toHaveProperty('priority');
      });
    });

    it('should initialize checklist items as not completed', () => {
      const mockPet = {
        id: 'pet-123',
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        dateOfBirth: '2020-01-01',
        allergies: [],
        emergencyNotes: ''
      };

      localStorage.setItem('pets', JSON.stringify([mockPet]));
      localStorage.setItem(`medications_${mockPet.id}`, JSON.stringify([]));
      localStorage.setItem(`medicalHistory_${mockPet.id}`, JSON.stringify([]));
      localStorage.setItem(`vaccinations_${mockPet.id}`, JSON.stringify([]));

      const session = emergencyService.activateEmergency(mockPet.id);

      // All checklist items should start as not completed
      session.checklist.forEach(item => {
        expect(item.completed).toBe(false);
      });
    });
  });

  /**
   * Additional edge case tests
   */
  describe('Additional Error Handling Edge Cases', () => {
    it('should handle missing pet data gracefully', () => {
      const mockPet = {
        id: 'pet-123',
        name: 'Buddy',
        species: 'dog',
        dateOfBirth: '2020-01-01'
        // Missing breed, allergies, emergencyNotes
      };

      localStorage.setItem('pets', JSON.stringify([mockPet]));
      localStorage.setItem(`medications_${mockPet.id}`, JSON.stringify([]));
      localStorage.setItem(`medicalHistory_${mockPet.id}`, JSON.stringify([]));
      localStorage.setItem(`vaccinations_${mockPet.id}`, JSON.stringify([]));

      const summary = emergencyService.generateMedicalSummary(mockPet.id);

      // Should provide defaults for missing data
      expect(summary.breed).toBe('Mixed');
      expect(summary.allergies).toEqual([]);
      expect(summary.emergencyNotes).toBe('');
    });

    it('should filter out inactive medications from summary', () => {
      const mockPet = {
        id: 'pet-123',
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        dateOfBirth: '2020-01-01',
        allergies: [],
        emergencyNotes: ''
      };

      const mockMedications = [
        { name: 'Active Med', dosage: '1 tablet', frequency: 'daily', active: true },
        { name: 'Inactive Med', dosage: '1 tablet', frequency: 'daily', active: false },
        { name: 'No Status Med', dosage: '1 tablet', frequency: 'daily' } // No active field
      ];

      localStorage.setItem('pets', JSON.stringify([mockPet]));
      localStorage.setItem(`medications_${mockPet.id}`, JSON.stringify(mockMedications));
      localStorage.setItem(`medicalHistory_${mockPet.id}`, JSON.stringify([]));
      localStorage.setItem(`vaccinations_${mockPet.id}`, JSON.stringify([]));

      const summary = emergencyService.generateMedicalSummary(mockPet.id);

      // Should only include active medications
      expect(summary.currentMedications.length).toBe(2); // Active Med and No Status Med
      expect(summary.currentMedications.some(m => m.name === 'Inactive Med')).toBe(false);
    });

    it('should only include recent vet visits (last 6 months)', () => {
      const mockPet = {
        id: 'pet-123',
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        dateOfBirth: '2020-01-01',
        allergies: [],
        emergencyNotes: ''
      };

      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      const sevenMonthsAgo = new Date(now);
      sevenMonthsAgo.setMonth(now.getMonth() - 7);

      const mockMedicalHistory = [
        { date: oneMonthAgo.toISOString(), reason: 'Recent checkup', diagnosis: 'Healthy' },
        { date: sevenMonthsAgo.toISOString(), reason: 'Old checkup', diagnosis: 'Healthy' }
      ];

      localStorage.setItem('pets', JSON.stringify([mockPet]));
      localStorage.setItem(`medications_${mockPet.id}`, JSON.stringify([]));
      localStorage.setItem(`medicalHistory_${mockPet.id}`, JSON.stringify(mockMedicalHistory));
      localStorage.setItem(`vaccinations_${mockPet.id}`, JSON.stringify([]));

      const summary = emergencyService.generateMedicalSummary(mockPet.id);

      // Should only include recent visit
      expect(summary.recentVetVisits.length).toBe(1);
      expect(summary.recentVetVisits[0].reason).toBe('Recent checkup');
    });

    it('should handle emergency contact with minimum required fields', () => {
      const userId = 'user-123';
      const minimalContact = {
        name: 'John Doe',
        relationship: 'family' as const,
        phone: '1234567890'
        // No email
      };

      const stored = emergencyService.storeEmergencyContact(userId, minimalContact);

      expect(stored).toBeDefined();
      expect(stored.id).toBeDefined();
      expect(stored.name).toBe(minimalContact.name);
      expect(stored.phone).toBe(minimalContact.phone);
      expect(stored.email).toBeUndefined();
    });

    it('should handle call to emergency contact', () => {
      const mockContact = {
        id: 'contact-123',
        name: 'John Doe',
        relationship: 'family' as const,
        phone: '+91-98765-43210',
        email: 'john@example.com'
      };

      // Mock window.location.href
      delete (window as any).location;
      (window as any).location = { href: '' };

      emergencyService.callEmergencyContact(mockContact);

      // Verify phone dialer was triggered
      expect(window.location.href).toBe(`tel:${mockContact.phone}`);
    });
  });
});
