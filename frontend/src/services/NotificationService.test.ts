import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import {
  NotificationService,
  Notification,
  Medication,
  Vaccination,
  GroomingTask,
  Pet,
  HealthScoreTrend,
  MedicationLog,
  ExerciseLog,
  WeightLog,
} from "./NotificationService";

// Feature: additional-amazing-features
// Property-based tests for NotificationService

describe("NotificationService Property Tests", () => {
  let service: NotificationService;

  beforeEach(() => {
    // Mock IndexedDB properly
    const mockDB = {
      objectStoreNames: {
        contains: vi.fn(() => false),
      },
      createObjectStore: vi.fn(() => ({
        createIndex: vi.fn(),
      })),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          add: vi.fn(() => ({
            onsuccess: null,
            onerror: null,
          })),
          get: vi.fn(() => ({
            onsuccess: null,
            onerror: null,
          })),
          put: vi.fn(() => ({
            onsuccess: null,
            onerror: null,
          })),
          delete: vi.fn(() => ({
            onsuccess: null,
            onerror: null,
          })),
          getAll: vi.fn(() => ({
            onsuccess: null,
            onerror: null,
            result: [],
          })),
          index: vi.fn(() => ({
            getAll: vi.fn(() => ({
              onsuccess: null,
              onerror: null,
              result: [],
            })),
          })),
        })),
      })),
    };

    const mockRequest = {
      result: mockDB,
      onsuccess: null as any,
      onerror: null as any,
      onupgradeneeded: null as any,
    };

    vi.stubGlobal('indexedDB', {
      open: vi.fn(() => {
        // Simulate successful DB open
        setTimeout(() => {
          if (mockRequest.onupgradeneeded) {
            mockRequest.onupgradeneeded({ target: mockRequest } as any);
          }
          if (mockRequest.onsuccess) {
            mockRequest.onsuccess();
          }
        }, 0);
        return mockRequest;
      }),
    });

    // Create a fresh instance for each test
    service = new NotificationService();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Arbitrary generators for test data
  const dateArbitrary = fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) });
  const futureDateArbitrary = fc.date({ 
    min: new Date(Date.now() + 1000), // At least 1 second in future
    max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
  });
  const pastDateArbitrary = fc.date({ min: new Date(2020, 0, 1), max: new Date() });

  const petArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 20 }),
    birthday: fc.option(dateArbitrary, { nil: undefined }),
  });

  const medicationArbitrary = fc.record({
    id: fc.uuid(),
    petId: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    quantity: fc.integer({ min: 0, max: 100 }),
    dailyDosage: fc.integer({ min: 1, max: 10 }),
    dueDate: fc.option(futureDateArbitrary, { nil: undefined }),
  });

  const vaccinationArbitrary = fc.record({
    id: fc.uuid(),
    petId: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    dueDate: futureDateArbitrary,
  });

  const groomingTaskArbitrary = fc.record({
    id: fc.uuid(),
    petId: fc.uuid(),
    type: fc.constantFrom("bath", "brush", "nail-trim", "haircut"),
    scheduledTime: futureDateArbitrary,
  });

  const healthScoreTrendArbitrary = fc.array(
    fc.record({
      date: pastDateArbitrary,
      score: fc.integer({ min: 0, max: 100 }),
    }),
    { minLength: 0, maxLength: 30 }
  );

  const medicationLogArbitrary = fc.array(
    fc.record({
      date: pastDateArbitrary,
      taken: fc.boolean(),
    }),
    { minLength: 0, maxLength: 30 }
  );

  const exerciseLogArbitrary = fc.array(
    fc.record({
      date: pastDateArbitrary,
      duration: fc.integer({ min: 0, max: 300 }),
    }),
    { minLength: 0, maxLength: 30 }
  );

  const weightLogArbitrary = fc.array(
    fc.record({
      date: pastDateArbitrary,
      weight: fc.float({ min: 0.5, max: 100, noNaN: true }),
    }),
    { minLength: 0, maxLength: 30 }
  );

  // **Property 7: Predictive Alert Generation**
  // For any pattern meeting criteria, alert should be generated with reason
  // **Validates: Requirements 2.1**
  describe("Property 7: Predictive Alert Generation", () => {
    it("should generate alerts with non-empty reason for declining health scores", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.array(
            fc.record({
              date: pastDateArbitrary,
              score: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 7, maxLength: 30 }
          ),
          (petId, petName, scoreTrend) => {
            // Create a declining trend
            const decliningTrend = scoreTrend.map((point, index) => ({
              ...point,
              score: 80 - index * 2, // Declining by 2 points each day
            }));

            const alerts = service.analyzePatternsForAlerts(petId, petName, {
              healthScoreTrend: decliningTrend,
            });

            // Should generate at least one alert for declining score
            expect(alerts.length).toBeGreaterThan(0);

            // All alerts should have non-empty reason
            alerts.forEach((alert) => {
              expect(alert.reason).toBeDefined();
              expect(typeof alert.reason).toBe("string");
              expect(alert.reason.length).toBeGreaterThan(0);
              expect(alert.petId).toBe(petId);
              expect(alert.confidence).toBeGreaterThan(0);
              expect(alert.confidence).toBeLessThanOrEqual(1);
              expect(alert.suggestedAction).toBeDefined();
              expect(alert.suggestedAction.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should generate alerts with reason for missed medications", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 2, max: 7 }),
          (petId, petName, missedCount) => {
            // Create medication logs with specified missed doses
            const medLogs: MedicationLog[] = Array.from({ length: 7 }, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
              taken: i >= missedCount, // First missedCount are not taken
            }));

            const alerts = service.analyzePatternsForAlerts(petId, petName, {
              medicationLogs: medLogs,
            });

            // Should generate alert for missed medications
            expect(alerts.length).toBeGreaterThan(0);

            alerts.forEach((alert) => {
              expect(alert.reason).toBeDefined();
              expect(alert.reason.length).toBeGreaterThan(0);
              expect(alert.reason.toLowerCase()).toContain("missed");
              expect(alert.petId).toBe(petId);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should generate alerts with reason for reduced exercise activity", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 20 }),
          (petId, petName) => {
            // Create exercise logs with 50%+ reduction
            const previousLogs: ExerciseLog[] = Array.from({ length: 5 }, (_, i) => ({
              date: new Date(Date.now() - (i + 5) * 24 * 60 * 60 * 1000),
              duration: 60, // 60 minutes average
            }));

            const recentLogs: ExerciseLog[] = Array.from({ length: 5 }, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
              duration: 20, // 20 minutes average (66% reduction)
            }));

            const alerts = service.analyzePatternsForAlerts(petId, petName, {
              exerciseLogs: [...previousLogs, ...recentLogs],
            });

            // Should generate alert for reduced activity
            expect(alerts.length).toBeGreaterThan(0);

            alerts.forEach((alert) => {
              expect(alert.reason).toBeDefined();
              expect(alert.reason.length).toBeGreaterThan(0);
              expect(alert.reason.toLowerCase()).toMatch(/exercise|activity|reduced/);
              expect(alert.petId).toBe(petId);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should generate alerts with reason for significant weight changes", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.float({ min: 5, max: 50, noNaN: true }),
          (petId, petName, baseWeight) => {
            // Create weight logs with 10%+ change
            const oldWeight = baseWeight;
            const newWeight = baseWeight * 1.15; // 15% increase

            const weightLogs: WeightLog[] = [
              { date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), weight: oldWeight },
              { date: new Date(), weight: newWeight },
            ];

            const alerts = service.analyzePatternsForAlerts(petId, petName, {
              weightLogs,
            });

            // Should generate alert for weight change
            expect(alerts.length).toBeGreaterThan(0);

            alerts.forEach((alert) => {
              expect(alert.reason).toBeDefined();
              expect(alert.reason.length).toBeGreaterThan(0);
              expect(alert.reason.toLowerCase()).toContain("weight");
              expect(alert.petId).toBe(petId);
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // **Property 8: Medication Refill Reminders**
  // For any medication below 7-day supply, reminder should be created
  // **Validates: Requirements 2.2**
  describe("Property 8: Medication Refill Reminders", () => {
    it("should create reminder for any medication with less than 7-day supply", () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            petId: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            quantity: fc.integer({ min: 1, max: 20 }), // Low quantity
            dailyDosage: fc.integer({ min: 1, max: 5 }),
          }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (medication, petName) => {
            // Ensure supply is less than 7 days
            const daysSupply = medication.quantity / medication.dailyDosage;
            fc.pre(daysSupply < 7);

            // Mock sendNotification to capture the notification
            let capturedNotification: Notification | null = null;
            service.sendNotification = vi.fn(async (notification: Notification) => {
              capturedNotification = notification;
            });

            service.scheduleMedicationReminder(medication, petName);

            // Should have called sendNotification
            expect(service.sendNotification).toHaveBeenCalled();
            expect(capturedNotification).not.toBeNull();

            if (capturedNotification) {
              expect(capturedNotification.type).toBe("medication");
              expect(capturedNotification.petId).toBe(medication.petId);
              expect(capturedNotification.petName).toBe(petName);
              expect(capturedNotification.title).toBeDefined();
              expect(capturedNotification.message).toBeDefined();
              expect(capturedNotification.actionRequired).toBeDefined();
              expect(capturedNotification.actionRequired.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should not create reminder for medication with 7+ day supply", () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            petId: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            quantity: fc.integer({ min: 50, max: 100 }), // High quantity
            dailyDosage: fc.integer({ min: 1, max: 5 }),
          }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (medication, petName) => {
            // Ensure supply is 7 days or more
            const daysSupply = medication.quantity / medication.dailyDosage;
            fc.pre(daysSupply >= 7);

            // Mock sendNotification
            service.sendNotification = vi.fn();

            service.scheduleMedicationReminder(medication, petName);

            // Should NOT have called sendNotification
            expect(service.sendNotification).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Property 9: Vaccination Alert Timing**
  // For any vaccination within 14 days, alert should be created
  // **Validates: Requirements 2.3**
  describe("Property 9: Vaccination Alert Timing", () => {
    it("should create alert for vaccination due within 14 days", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 14 }), // Days until due (1-14, not 0 to avoid timing issues)
          fc.string({ minLength: 1, maxLength: 20 }),
          (id, petId, vaccineName, daysUntilDue, petName) => {
            // Use a fixed "now" time to avoid timing issues
            const fixedNow = new Date('2026-02-20T00:00:00.000Z');
            vi.useFakeTimers();
            vi.setSystemTime(fixedNow);

            const vaccination: Vaccination = {
              id,
              petId,
              name: vaccineName,
              dueDate: new Date(fixedNow.getTime() + daysUntilDue * 24 * 60 * 60 * 1000),
            };

            // Mock sendNotification
            let capturedNotification: Notification | null = null;
            service.sendNotification = vi.fn(async (notification: Notification) => {
              capturedNotification = notification;
            });

            service.scheduleVaccinationReminder(vaccination, petName);

            // Should have called sendNotification
            expect(service.sendNotification).toHaveBeenCalled();
            expect(capturedNotification).not.toBeNull();

            if (capturedNotification) {
              expect(capturedNotification.type).toBe("vaccination");
              expect(capturedNotification.petId).toBe(vaccination.petId);
              expect(capturedNotification.petName).toBe(petName);
              expect(capturedNotification.scheduledFor).toBeDefined();
              expect(capturedNotification.actionRequired).toBeDefined();
              expect(capturedNotification.actionRequired.length).toBeGreaterThan(0);
            }

            vi.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should not create alert for vaccination due after 14 days", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 15, max: 365 }), // Days until due (more than 14)
          fc.string({ minLength: 1, maxLength: 20 }),
          (id, petId, vaccineName, daysUntilDue, petName) => {
            // Use a fixed "now" time to avoid timing issues
            const fixedNow = new Date('2026-02-20T00:00:00.000Z');
            vi.useFakeTimers();
            vi.setSystemTime(fixedNow);

            const vaccination: Vaccination = {
              id,
              petId,
              name: vaccineName,
              dueDate: new Date(fixedNow.getTime() + daysUntilDue * 24 * 60 * 60 * 1000),
            };

            // Mock sendNotification
            service.sendNotification = vi.fn();

            service.scheduleVaccinationReminder(vaccination, petName);

            // Should NOT have called sendNotification
            expect(service.sendNotification).not.toHaveBeenCalled();

            vi.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Property 10: Grooming Reminder Scheduling**
  // For any grooming task, reminder should be 24 hours before
  // **Validates: Requirements 2.4**
  describe("Property 10: Grooming Reminder Scheduling", () => {
    it("should create reminder for grooming task within 24 hours", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.constantFrom("bath", "brush", "nail-trim", "haircut"),
          fc.integer({ min: 1, max: 24 }), // Hours until grooming
          fc.string({ minLength: 1, maxLength: 20 }),
          (id, petId, type, hoursUntil, petName) => {
            const grooming: GroomingTask = {
              id,
              petId,
              type,
              scheduledTime: new Date(Date.now() + hoursUntil * 60 * 60 * 1000),
            };

            // Mock sendNotification
            let capturedNotification: Notification | null = null;
            service.sendNotification = vi.fn(async (notification: Notification) => {
              capturedNotification = notification;
            });

            service.scheduleGroomingReminder(grooming, petName);

            // Should have called sendNotification
            expect(service.sendNotification).toHaveBeenCalled();
            expect(capturedNotification).not.toBeNull();

            if (capturedNotification) {
              expect(capturedNotification.type).toBe("grooming");
              expect(capturedNotification.petId).toBe(grooming.petId);
              expect(capturedNotification.petName).toBe(petName);
              expect(capturedNotification.scheduledFor).toBeDefined();
              expect(capturedNotification.actionRequired).toBeDefined();
              expect(capturedNotification.actionRequired.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should not create reminder for grooming task more than 24 hours away", () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            petId: fc.uuid(),
            type: fc.constantFrom("bath", "brush", "nail-trim", "haircut"),
            scheduledTime: fc.date({
              min: new Date(Date.now() + 25 * 60 * 60 * 1000), // 25 hours from now
              max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            }),
          }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (grooming, petName) => {
            // Mock sendNotification
            service.sendNotification = vi.fn();

            service.scheduleGroomingReminder(grooming, petName);

            // Should NOT have called sendNotification
            expect(service.sendNotification).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Property 11: Birthday Notification Creation**
  // For any pet birthday, notification should be created
  // **Validates: Requirements 2.5**
  describe("Property 11: Birthday Notification Creation", () => {
    it("should create notification for pet birthday on the correct date", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 1, max: 15 }), // Age in years
          (petId, petName, age) => {
            // Create a pet with birthday today
            const today = new Date();
            const birthday = new Date(
              today.getFullYear() - age,
              today.getMonth(),
              today.getDate()
            );

            const pet: Pet = {
              id: petId,
              name: petName,
              birthday,
            };

            // Mock sendNotification
            let capturedNotification: Notification | null = null;
            service.sendNotification = vi.fn(async (notification: Notification) => {
              capturedNotification = notification;
            });

            service.scheduleBirthdayReminder(pet);

            // Should have called sendNotification
            expect(service.sendNotification).toHaveBeenCalled();
            expect(capturedNotification).not.toBeNull();

            if (capturedNotification) {
              expect(capturedNotification.type).toBe("birthday");
              expect(capturedNotification.petId).toBe(petId);
              expect(capturedNotification.petName).toBe(petName);
              expect(capturedNotification.title).toContain(petName);
              expect(capturedNotification.message).toContain(age.toString());
              expect(capturedNotification.actionRequired).toBeDefined();
              expect(capturedNotification.actionRequired.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should not create notification for pet without birthday", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 20 }),
          (petId, petName) => {
            const pet: Pet = {
              id: petId,
              name: petName,
              birthday: undefined,
            };

            // Mock sendNotification
            service.sendNotification = vi.fn();

            service.scheduleBirthdayReminder(pet);

            // Should NOT have called sendNotification
            expect(service.sendNotification).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Property 13: Notification Content Completeness**
  // For any notification, pet name and action should be included
  // **Validates: Requirements 2.8**
  describe("Property 13: Notification Content Completeness", () => {
    it("should include pet name and action required in medication reminders", () => {
      fc.assert(
        fc.property(
          medicationArbitrary,
          fc.string({ minLength: 1, maxLength: 20 }),
          (medication, petName) => {
            // Ensure low supply
            const lowSupplyMed = {
              ...medication,
              quantity: 5,
              dailyDosage: 1,
            };

            let capturedNotification: Notification | null = null;
            service.sendNotification = vi.fn(async (notification: Notification) => {
              capturedNotification = notification;
            });

            service.scheduleMedicationReminder(lowSupplyMed, petName);

            expect(capturedNotification).not.toBeNull();
            if (capturedNotification) {
              expect(capturedNotification.petName).toBe(petName);
              expect(capturedNotification.actionRequired).toBeDefined();
              expect(capturedNotification.actionRequired.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should include pet name and action required in vaccination alerts", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (id, petId, vaccineName, petName) => {
            const vaccination: Vaccination = {
              id,
              petId,
              name: vaccineName,
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            };

            let capturedNotification: Notification | null = null;
            service.sendNotification = vi.fn(async (notification: Notification) => {
              capturedNotification = notification;
            });

            service.scheduleVaccinationReminder(vaccination, petName);

            expect(capturedNotification).not.toBeNull();
            if (capturedNotification) {
              expect(capturedNotification.petName).toBe(petName);
              expect(capturedNotification.actionRequired).toBeDefined();
              expect(capturedNotification.actionRequired.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should include pet name and action required in grooming reminders", () => {
      fc.assert(
        fc.property(
          groomingTaskArbitrary,
          fc.string({ minLength: 1, maxLength: 20 }),
          (grooming, petName) => {
            // Ensure within 24 hours
            const soonGrooming = {
              ...grooming,
              scheduledTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
            };

            let capturedNotification: Notification | null = null;
            service.sendNotification = vi.fn(async (notification: Notification) => {
              capturedNotification = notification;
            });

            service.scheduleGroomingReminder(soonGrooming, petName);

            expect(capturedNotification).not.toBeNull();
            if (capturedNotification) {
              expect(capturedNotification.petName).toBe(petName);
              expect(capturedNotification.actionRequired).toBeDefined();
              expect(capturedNotification.actionRequired.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should include pet name and action required in birthday notifications", () => {
      fc.assert(
        fc.property(
          petArbitrary,
          (pet) => {
            // Set birthday to today
            const today = new Date();
            const birthdayPet = {
              ...pet,
              birthday: new Date(
                today.getFullYear() - 5,
                today.getMonth(),
                today.getDate()
              ),
            };

            let capturedNotification: Notification | null = null;
            service.sendNotification = vi.fn(async (notification: Notification) => {
              capturedNotification = notification;
            });

            service.scheduleBirthdayReminder(birthdayPet);

            expect(capturedNotification).not.toBeNull();
            if (capturedNotification) {
              expect(capturedNotification.petName).toBe(pet.name);
              expect(capturedNotification.actionRequired).toBeDefined();
              expect(capturedNotification.actionRequired.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should include pet name and action required in predictive alerts", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 20 }),
          (petId, petName) => {
            // Create declining health score trend
            const decliningTrend: HealthScoreTrend[] = Array.from({ length: 7 }, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
              score: 80 - i * 3,
            }));

            // Mock sendNotification to capture all notifications
            const capturedNotifications: Notification[] = [];
            service.sendNotification = vi.fn(async (notification: Notification) => {
              capturedNotifications.push(notification);
            });

            service.analyzePatternsForAlerts(petId, petName, {
              healthScoreTrend: decliningTrend,
            });

            // Should have generated at least one notification
            expect(capturedNotifications.length).toBeGreaterThan(0);

            capturedNotifications.forEach((notification) => {
              expect(notification.petName).toBe(petName);
              expect(notification.actionRequired).toBeDefined();
              expect(notification.actionRequired.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
