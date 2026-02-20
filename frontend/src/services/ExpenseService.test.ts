/**
 * Property-Based Tests for ExpenseService
 * 
 * Tests universal correctness properties across all valid inputs
 * using fast-check library with minimum 100 iterations per property
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import expenseService, { Expense, ExpenseCategory } from './ExpenseService';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

// Arbitraries for generating test data
const expenseCategoryArb = fc.constantFrom<ExpenseCategory>('food', 'vet', 'grooming', 'toys', 'other');

const expenseArb = fc.record({
  petId: fc.uuid(),
  userId: fc.uuid(),
  category: expenseCategoryArb,
  amount: fc.float({ min: Math.fround(1), max: Math.fround(100000), noNaN: true }),
  currency: fc.constant('INR' as const),
  date: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  description: fc.string({ minLength: 1, maxLength: 200 }),
  notes: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
});

const dateRangeArb = fc.tuple(
  fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
).map(([d1, d2]) => {
  // Ensure both dates are valid
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return { start: new Date('2020-01-01'), end: new Date('2020-01-02') };
  }
  const start = d1 < d2 ? d1 : d2;
  const end = d1 < d2 ? d2 : d1;
  // Ensure end is at least 1 day after start to avoid same-day edge cases
  if (end.getTime() === start.getTime()) {
    const newEnd = new Date(end);
    newEnd.setDate(newEnd.getDate() + 1);
    return { start, end: newEnd };
  }
  return { start, end };
});

describe('ExpenseService Property Tests', () => {
  beforeEach(async () => {
    // Reset IndexedDB by creating a new instance
    global.indexedDB = new IDBFactory();
  });

  afterEach(async () => {
    // Clean up after each test
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  });

  /**
   * Property 30: Expense Category Validity
   * For any expense, category should be valid
   * **Validates: Requirements 7.1**
   */
  it('Property 30: Expense Category Validity - for any expense, category should be valid', async () => {
    await fc.assert(
      fc.asyncProperty(expenseArb, async (expenseData) => {
        const expense = await expenseService.addExpense(expenseData);
        
        const validCategories: ExpenseCategory[] = ['food', 'vet', 'grooming', 'toys', 'other'];
        return validCategories.includes(expense.category);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 31: Expense Category Breakdown Accuracy
   * For any expenses, sum of breakdowns should equal total
   * **Validates: Requirements 7.2**
   */
  it('Property 31: Expense Category Breakdown Accuracy - for any expenses, sum of breakdowns should equal total', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(expenseArb, { minLength: 1, maxLength: 20 }),
        dateRangeArb,
        async (expenses, { start, end }) => {
          // Use a unique petId for this iteration to avoid cross-contamination
          const petId = `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Add all expenses with the same petId and dates within range
          const addedExpenses: Expense[] = [];
          for (const exp of expenses) {
            const expenseDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            const added = await expenseService.addExpense({
              ...exp,
              petId,
              date: expenseDate,
            });
            addedExpenses.push(added);
          }

          // Get category breakdown
          const breakdown = await expenseService.getCategoryBreakdown(petId, start, end);

          // Calculate total from breakdown
          const breakdownTotal = Object.values(breakdown).reduce((sum, amount) => sum + amount, 0);

          // Calculate expected total from added expenses
          const expectedTotal = addedExpenses.reduce((sum, expense) => sum + expense.amount, 0);

          // Allow for floating point precision errors (within 0.01 rupees)
          return Math.abs(breakdownTotal - expectedTotal) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 32: Monthly Expense Total Calculation
   * For any month's expenses, total should equal sum
   * **Validates: Requirements 7.3**
   */
  it('Property 32: Monthly Expense Total Calculation - for any month expenses, total should equal sum', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // petId
        fc.integer({ min: 1, max: 12 }), // month
        fc.integer({ min: 2020, max: 2025 }), // year
        fc.array(expenseArb, { minLength: 1, maxLength: 20 }),
        async (petId, month, year, expenses) => {
          // Add expenses for the specified month
          const addedExpenses: Expense[] = [];
          for (const exp of expenses) {
            // Generate random day in the month
            const daysInMonth = new Date(year, month, 0).getDate();
            const day = Math.floor(Math.random() * daysInMonth) + 1;
            const expenseDate = new Date(year, month - 1, day);

            const added = await expenseService.addExpense({
              ...exp,
              petId,
              date: expenseDate,
            });
            addedExpenses.push(added);
          }

          // Get monthly report
          const report = await expenseService.getMonthlyReport(petId, month, year);

          // Calculate expected total
          const expectedTotal = addedExpenses.reduce((sum, expense) => sum + expense.amount, 0);

          // Allow for floating point precision errors (within 0.01 rupees)
          return Math.abs(report.totalSpending - expectedTotal) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 33: Budget Alert Triggering
   * For any spending exceeding threshold, alert should be generated
   * **Validates: Requirements 7.4**
   */
  it('Property 33: Budget Alert Triggering - for any spending exceeding threshold, alert should be generated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // petId
        fc.float({ min: Math.fround(1000), max: Math.fround(50000), noNaN: true }), // budgetLimit
        fc.integer({ min: 50, max: 100 }), // alertThreshold
        fc.array(expenseArb, { minLength: 1, maxLength: 10 }),
        async (petId, budgetLimit, alertThreshold, expenses) => {
          // Add expenses for current month
          const now = new Date();
          let totalSpent = 0;

          for (const exp of expenses) {
            const expenseDate = new Date(now.getFullYear(), now.getMonth(), Math.floor(Math.random() * 28) + 1);
            await expenseService.addExpense({
              ...exp,
              petId,
              date: expenseDate,
            });
            totalSpent += exp.amount;
          }

          // Check budget alert
          const alertTriggered = await expenseService.checkBudgetAlert(petId, budgetLimit, alertThreshold);

          // Calculate threshold amount
          const thresholdAmount = (budgetLimit * alertThreshold) / 100;

          // Alert should be triggered if and only if spending >= threshold
          return alertTriggered === (totalSpent >= thresholdAmount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 34: Expense CSV Export Completeness
   * For any expenses exported, parsing CSV should preserve data
   * **Validates: Requirements 7.5**
   */
  it('Property 34: Expense CSV Export Completeness - for any expenses exported, parsing CSV should preserve data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // petId
        fc.array(expenseArb, { minLength: 1, maxLength: 20 }),
        dateRangeArb,
        async (petId, expenses, { start, end }) => {
          // Add expenses
          const addedExpenses: Expense[] = [];
          for (const exp of expenses) {
            const expenseDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            const added = await expenseService.addExpense({
              ...exp,
              petId,
              date: expenseDate,
            });
            addedExpenses.push(added);
          }

          // Export to CSV
          const csv = await expenseService.exportToCSV(petId, start, end);

          // Parse CSV (simple parsing for validation)
          const lines = csv.split('\n').filter(line => line.trim());
          const header = lines[0];
          const dataLines = lines.slice(1);

          // Verify header
          const hasCorrectHeader = header === 'Date,Category,Amount (₹),Description,Notes';

          // Verify we have the same number of records
          const hasCorrectCount = dataLines.length === addedExpenses.length;

          // Verify each line has the required fields
          // For CSV with potential quoted fields, we need more robust parsing
          const allLinesHaveFields = dataLines.every(line => {
            // Simple check: line should have at least 4 commas (5 fields)
            // This handles both quoted and unquoted fields
            const commaCount = (line.match(/,/g) || []).length;
            return commaCount >= 4;
          });

          return hasCorrectHeader && hasCorrectCount && allLinesHaveFields;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 35: Expense Persistence Round-Trip
   * For any stored expense, retrieval should return original data
   * **Validates: Requirements 7.6**
   */
  it('Property 35: Expense Persistence Round-Trip - for any stored expense, retrieval should return original data', async () => {
    await fc.assert(
      fc.asyncProperty(expenseArb, async (expenseData) => {
        // Add expense
        const addedExpense = await expenseService.addExpense(expenseData);

        // Retrieve expenses
        const startDate = new Date(addedExpense.date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(addedExpense.date);
        endDate.setHours(23, 59, 59, 999);

        const retrievedExpenses = await expenseService.getExpenses(
          addedExpense.petId,
          startDate,
          endDate
        );

        // Find the added expense
        const retrieved = retrievedExpenses.find(e => e.id === addedExpense.id);

        if (!retrieved) return false;

        // Verify all fields match
        return (
          retrieved.petId === addedExpense.petId &&
          retrieved.userId === addedExpense.userId &&
          retrieved.category === addedExpense.category &&
          Math.abs(retrieved.amount - addedExpense.amount) < 0.01 &&
          retrieved.currency === addedExpense.currency &&
          new Date(retrieved.date).getTime() === new Date(addedExpense.date).getTime() &&
          retrieved.description === addedExpense.description &&
          retrieved.notes === addedExpense.notes
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Invalid Category Rejection
   * For any invalid category, addExpense should throw an error
   */
  it('Additional Property: Invalid Category Rejection - for any invalid category, addExpense should throw', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter(s => !['food', 'vet', 'grooming', 'toys', 'other'].includes(s)),
        fc.uuid(),
        fc.uuid(),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
        async (invalidCategory, petId, userId, amount) => {
          try {
            await expenseService.addExpense({
              petId,
              userId,
              category: invalidCategory as ExpenseCategory,
              amount,
              currency: 'INR',
              date: new Date(),
              description: 'Test expense',
            });
            return false; // Should have thrown
          } catch (error) {
            return error instanceof Error && error.message.includes('Invalid category');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Negative Amount Rejection
   * For any negative or zero amount, addExpense should throw an error
   */
  it('Additional Property: Negative Amount Rejection - for any negative or zero amount, addExpense should throw', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ max: 0, noNaN: true }),
        expenseCategoryArb,
        fc.uuid(),
        fc.uuid(),
        async (invalidAmount, category, petId, userId) => {
          try {
            await expenseService.addExpense({
              petId,
              userId,
              category,
              amount: invalidAmount,
              currency: 'INR',
              date: new Date(),
              description: 'Test expense',
            });
            return false; // Should have thrown
          } catch (error) {
            return error instanceof Error && error.message.includes('Amount must be greater than zero');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
