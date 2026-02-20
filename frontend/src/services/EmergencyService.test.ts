/**
 * Property-Based Tests for EmergencyService
 * 
 * Tests universal correctness properties using fast-check library
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { emergencyService, type EmergencyContact, type VetClinic, type MedicalSummary } from './EmergencyService';

// Helper to safely convert date to ISO string
const safeToISOString = (d: Date): string => {
  try {
    return d.toISOString();
  } catch {
    return new Date('2020-01-01').toISOString();
  }
};

describe('EmergencyService Property Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Property 19: Emergency Medical Summary Generation
   * For any pet, summary should contain allergies, medications, visits, vaccinations
   * **Validates: Requirements 4.2**
   */
  it('Property 19: Emergency Medical Summary Generation - summary contains all required fields', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary pet data
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          species: fc.constantFrom('dog', 'cat', 'bird', 'fish'),
          breed: fc.string({ minLength: 1, maxLength: 50 }),
          dateOfBirth: fc.date({ min: new Date('2000-01-01'), max: new Date() }).map(safeToISOString),
          allergies: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 5 }),
          emergencyNotes: fc.string({ maxLength: 200 })
        }),
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            dosage: fc.string({ minLength: 1, maxLength: 30 }),
            frequency: fc.string({ minLength: 1, maxLength: 30 }),
            active: fc.boolean()
          }),
          { maxLength: 10 }
        ),
        fc.array(
          fc.record({
            date: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(safeToISOString),
            reason: fc.string({ minLength: 1, maxLength: 100 }),
            diagnosis: fc.option(fc.string({ maxLength: 200 }), { nil: undefined })
          }),
          { maxLength: 20 }
        ),
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            date: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(safeToISOString),
            nextDue: fc.option(fc.date({ min: new Date(), max: new Date('2030-01-01') }).map(safeToISOString), { nil: undefined })
          }),
          { maxLength: 15 }
        ),
        (pet, medications, medicalHistory, vaccinations) => {
          // Setup localStorage with pet data
          localStorage.setItem('pets', JSON.stringify([pet]));
          localStorage.setItem(`medications_${pet.id}`, JSON.stringify(medications));
          localStorage.setItem(`medicalHistory_${pet.id}`, JSON.stringify(medicalHistory));
          localStorage.setItem(`vaccinations_${pet.id}`, JSON.stringify(vaccinations));

          // Generate medical summary
          const summary = emergencyService.generateMedicalSummary(pet.id);

          // Verify all required fields are present
          expect(summary).toHaveProperty('petName');
          expect(summary).toHaveProperty('species');
          expect(summary).toHaveProperty('breed');
          expect(summary).toHaveProperty('age');
          expect(summary).toHaveProperty('allergies');
          expect(summary).toHaveProperty('currentMedications');
          expect(summary).toHaveProperty('recentVetVisits');
          expect(summary).toHaveProperty('vaccinations');
          expect(summary).toHaveProperty('emergencyNotes');

          // Verify allergies array is present
          expect(Array.isArray(summary.allergies)).toBe(true);
          
          // Verify medications array is present
          expect(Array.isArray(summary.currentMedications)).toBe(true);
          
          // Verify vet visits array is present
          expect(Array.isArray(summary.recentVetVisits)).toBe(true);
          
          // Verify vaccinations array is present
          expect(Array.isArray(summary.vaccinations)).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 20: Emergency Vet Search Filtering
   * For any location, results should be within 10km and 24-hour only
   * **Validates: Requirements 4.3**
   */
  it('Property 20: Emergency Vet Search Filtering - results are within 10km and 24-hour only', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary location coordinates
        fc.record({
          latitude: fc.double({ min: -90, max: 90 }),
          longitude: fc.double({ min: -180, max: 180 }),
          accuracy: fc.double({ min: 0, max: 100 }),
          altitude: fc.constant(null),
          altitudeAccuracy: fc.constant(null),
          heading: fc.constant(null),
          speed: fc.constant(null)
        }),
        async (location) => {
          // Find nearby vets
          const vets = await emergencyService.findNearbyVets(location as GeolocationCoordinates);

          // Verify all results are 24-hour clinics
          for (const vet of vets) {
            expect(vet.is24Hour).toBe(true);
          }

          // Verify all results are within 10km
          for (const vet of vets) {
            expect(vet.distance).toBeLessThanOrEqual(10);
          }

          return true;
        }
      ),
      { numRuns: 20 } // Reduced runs for async tests to avoid timeout
    );
  }, 30000); // 30 second timeout for async property tests

  /**
   * Property 21: Emergency Checklist Generation
   * For any pet species, checklist should have at least one item
   * **Validates: Requirements 4.4**
   */
  it('Property 21: Emergency Checklist Generation - checklist has at least one item for any species', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'guinea pig', 'other'),
        (species) => {
          // Get emergency checklist
          const checklist = emergencyService.getEmergencyChecklist(species);

          // Verify checklist has at least one item
          expect(checklist.length).toBeGreaterThan(0);

          // Verify all items have required properties
          for (const item of checklist) {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('text');
            expect(item).toHaveProperty('completed');
            expect(item).toHaveProperty('priority');
            expect(typeof item.id).toBe('string');
            expect(typeof item.text).toBe('string');
            expect(typeof item.completed).toBe('boolean');
            expect(['high', 'medium', 'low']).toContain(item.priority);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 22: Emergency Contact Storage Capacity
   * For any user, system should store at least 3 contacts
   * **Validates: Requirements 4.5**
   */
  it('Property 22: Emergency Contact Storage Capacity - system stores at least 3 contacts', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // userId
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            relationship: fc.constantFrom('family', 'friend', 'vet'),
            phone: fc.string({ minLength: 10, maxLength: 15 }),
            email: fc.option(fc.emailAddress(), { nil: undefined })
          }),
          { minLength: 3, maxLength: 10 }
        ),
        (userId, contacts) => {
          // Store all contacts
          const storedContacts: EmergencyContact[] = [];
          for (const contact of contacts) {
            const stored = emergencyService.storeEmergencyContact(userId, contact);
            storedContacts.push(stored);
          }

          // Retrieve contacts
          const retrieved = emergencyService.getEmergencyContacts(userId);

          // Verify at least 3 contacts are stored
          expect(retrieved.length).toBeGreaterThanOrEqual(3);

          // Verify all stored contacts can be retrieved
          expect(retrieved.length).toBe(storedContacts.length);

          // Verify each contact has an ID
          for (const contact of retrieved) {
            expect(contact).toHaveProperty('id');
            expect(typeof contact.id).toBe('string');
            expect(contact.id.length).toBeGreaterThan(0);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property tests for robustness

  it('Property: Emergency session activation creates valid session', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          species: fc.constantFrom('dog', 'cat', 'bird', 'fish'),
          breed: fc.string({ minLength: 1, maxLength: 50 }),
          dateOfBirth: fc.date({ min: new Date('2000-01-01'), max: new Date() }).map(safeToISOString),
          allergies: fc.array(fc.string({ minLength: 1, maxLength: 30 })),
          emergencyNotes: fc.string({ maxLength: 200 })
        }),
        (pet) => {
          // Setup localStorage
          localStorage.setItem('pets', JSON.stringify([pet]));
          localStorage.setItem(`medications_${pet.id}`, JSON.stringify([]));
          localStorage.setItem(`medicalHistory_${pet.id}`, JSON.stringify([]));
          localStorage.setItem(`vaccinations_${pet.id}`, JSON.stringify([]));

          // Activate emergency
          const session = emergencyService.activateEmergency(pet.id);

          // Verify session structure
          expect(session).toHaveProperty('sessionId');
          expect(session).toHaveProperty('petId');
          expect(session).toHaveProperty('startedAt');
          expect(session).toHaveProperty('medicalSummary');
          expect(session).toHaveProperty('nearbyVets');
          expect(session).toHaveProperty('checklist');

          expect(session.petId).toBe(pet.id);
          expect(session.startedAt).toBeInstanceOf(Date);
          expect(Array.isArray(session.nearbyVets)).toBe(true);
          expect(Array.isArray(session.checklist)).toBe(true);
          expect(session.checklist.length).toBeGreaterThan(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Emergency contact deletion removes correct contact', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // userId
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            relationship: fc.constantFrom('family', 'friend', 'vet'),
            phone: fc.string({ minLength: 10, maxLength: 15 }),
            email: fc.option(fc.emailAddress(), { nil: undefined })
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (userId, contacts) => {
          // Store all contacts
          const storedContacts: EmergencyContact[] = [];
          for (const contact of contacts) {
            const stored = emergencyService.storeEmergencyContact(userId, contact);
            storedContacts.push(stored);
          }

          // Delete first contact
          const contactToDelete = storedContacts[0];
          emergencyService.deleteEmergencyContact(userId, contactToDelete.id);

          // Retrieve remaining contacts
          const remaining = emergencyService.getEmergencyContacts(userId);

          // Verify deleted contact is not in remaining
          const deletedStillExists = remaining.some(c => c.id === contactToDelete.id);
          expect(deletedStillExists).toBe(false);

          // Verify count is reduced by 1
          expect(remaining.length).toBe(storedContacts.length - 1);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
