/**
 * ExpenseService - Manages pet expense tracking and reporting
 * 
 * Features:
 * - Add expenses with category validation
 * - Get expenses with date range filtering
 * - Generate monthly reports with category breakdown
 * - Calculate category-wise spending
 * - Export expenses to CSV format
 * - Check budget alerts with threshold monitoring
 * - Persistent storage using IndexedDB
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Valid expense categories as per requirements
export type ExpenseCategory = 'food' | 'vet' | 'grooming' | 'toys' | 'other';

export interface Expense {
  id: string;
  petId: string;
  userId: string;
  category: ExpenseCategory;
  amount: number; // in rupees
  currency: 'INR';
  date: Date;
  description: string;
  notes?: string;
  createdAt: Date;
}

export interface MonthlyReport {
  totalSpending: number;
  byCategory: Record<ExpenseCategory, number>;
  comparisonToPreviousMonth: number; // percentage change
  topExpenses: Expense[];
}

export interface BudgetSetting {
  id: string;
  petId: string;
  userId: string;
  monthlyLimit: number;
  alertThreshold: number; // percentage (e.g., 80 for 80%)
  enabled: boolean;
}

interface ExpenseDB extends DBSchema {
  expenses: {
    key: string;
    value: Expense;
    indexes: { 'petId': string; 'date': Date; 'category': ExpenseCategory };
  };
  budgetSettings: {
    key: string;
    value: BudgetSetting;
    indexes: { 'petId': string; 'userId': string };
  };
}

class ExpenseService {
  private dbName = 'PetCareDB';
  private dbVersion = 2;
  private db: IDBPDatabase<ExpenseDB> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  private async initDB(): Promise<IDBPDatabase<ExpenseDB>> {
    if (this.db) return this.db;

    this.db = await openDB<ExpenseDB>(this.dbName, this.dbVersion, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Create expenses object store if it doesn't exist
        if (!db.objectStoreNames.contains('expenses')) {
          const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
          expenseStore.createIndex('petId', 'petId', { unique: false });
          expenseStore.createIndex('date', 'date', { unique: false });
          expenseStore.createIndex('category', 'category', { unique: false });
        }

        // Create budgetSettings object store if it doesn't exist
        if (!db.objectStoreNames.contains('budgetSettings')) {
          const budgetStore = db.createObjectStore('budgetSettings', { keyPath: 'id' });
          budgetStore.createIndex('petId', 'petId', { unique: false });
          budgetStore.createIndex('userId', 'userId', { unique: false });
        }
      },
    });

    return this.db;
  }

  /**
   * Validate expense category
   */
  private isValidCategory(category: string): category is ExpenseCategory {
    const validCategories: ExpenseCategory[] = ['food', 'vet', 'grooming', 'toys', 'other'];
    return validCategories.includes(category as ExpenseCategory);
  }

  /**
   * Add a new expense with category validation
   * Requirements: 7.1, 7.6
   */
  async addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    // Validate category
    if (!this.isValidCategory(expense.category)) {
      throw new Error(`Invalid category: ${expense.category}. Must be one of: food, vet, grooming, toys, other`);
    }

    // Validate amount
    if (expense.amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    // Validate currency
    if (expense.currency !== 'INR') {
      throw new Error('Currency must be INR');
    }

    const db = await this.initDB();
    const newExpense: Expense = {
      ...expense,
      id: `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    await db.add('expenses', newExpense);
    return newExpense;
  }

  /**
   * Get expenses with date range filtering
   * Requirements: 7.6, 7.7
   */
  async getExpenses(petId: string, startDate: Date, endDate: Date): Promise<Expense[]> {
    const db = await this.initDB();
    const allExpenses = await db.getAllFromIndex('expenses', 'petId', petId);

    // Filter by date range
    return allExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Get monthly report with category breakdown
   * Requirements: 7.2, 7.3
   */
  async getMonthlyReport(petId: string, month: number, year: number): Promise<MonthlyReport> {
    // Get current month expenses
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const expenses = await this.getExpenses(petId, startDate, endDate);

    // Calculate total spending
    const totalSpending = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate category breakdown
    const byCategory = this.getCategoryBreakdownFromExpenses(expenses);

    // Get previous month for comparison
    const prevStartDate = new Date(year, month - 2, 1);
    const prevEndDate = new Date(year, month - 1, 0, 23, 59, 59, 999);
    const prevExpenses = await this.getExpenses(petId, prevStartDate, prevEndDate);
    const prevTotal = prevExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate percentage change
    const comparisonToPreviousMonth = prevTotal > 0
      ? ((totalSpending - prevTotal) / prevTotal) * 100
      : 0;

    // Get top 5 expenses
    const topExpenses = [...expenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalSpending,
      byCategory,
      comparisonToPreviousMonth,
      topExpenses,
    };
  }

  /**
   * Calculate category breakdown
   * Requirements: 7.2
   */
  getCategoryBreakdown(petId: string, startDate: Date, endDate: Date): Promise<Record<ExpenseCategory, number>> {
    return this.getExpenses(petId, startDate, endDate).then(expenses => {
      return this.getCategoryBreakdownFromExpenses(expenses);
    });
  }

  /**
   * Helper to calculate category breakdown from expenses array
   */
  private getCategoryBreakdownFromExpenses(expenses: Expense[]): Record<ExpenseCategory, number> {
    const breakdown: Record<ExpenseCategory, number> = {
      food: 0,
      vet: 0,
      grooming: 0,
      toys: 0,
      other: 0,
    };

    expenses.forEach(expense => {
      breakdown[expense.category] += expense.amount;
    });

    return breakdown;
  }

  /**
   * Export expenses to CSV format
   * Requirements: 7.5
   */
  async exportToCSV(petId: string, startDate: Date, endDate: Date): Promise<string> {
    const expenses = await this.getExpenses(petId, startDate, endDate);

    // CSV header
    const header = 'Date,Category,Amount (₹),Description,Notes\n';

    // CSV rows
    const rows = expenses.map(expense => {
      const date = new Date(expense.date).toLocaleDateString('en-IN');
      const category = this.capitalizeCategory(expense.category);
      const amount = expense.amount.toFixed(2);
      const description = this.escapeCSV(expense.description);
      const notes = expense.notes ? this.escapeCSV(expense.notes) : '';

      return `${date},${category},${amount},${description},${notes}`;
    }).join('\n');

    return header + rows;
  }

  /**
   * Helper to capitalize category names for CSV
   */
  private capitalizeCategory(category: ExpenseCategory): string {
    const categoryMap: Record<ExpenseCategory, string> = {
      food: 'Food',
      vet: 'Vet',
      grooming: 'Grooming',
      toys: 'Toys',
      other: 'Other',
    };
    return categoryMap[category];
  }

  /**
   * Helper to escape CSV values
   */
  private escapeCSV(value: string): string {
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Check if budget alert should be triggered
   * Requirements: 7.4
   */
  async checkBudgetAlert(petId: string, budgetLimit: number, alertThreshold: number = 80): Promise<boolean> {
    // Get current month expenses
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const expenses = await this.getExpenses(petId, startDate, endDate);
    const totalSpending = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate threshold amount
    const thresholdAmount = (budgetLimit * alertThreshold) / 100;

    // Return true if spending exceeds threshold
    return totalSpending >= thresholdAmount;
  }

  /**
   * Get budget setting for a pet
   */
  async getBudgetSetting(petId: string): Promise<BudgetSetting | null> {
    const db = await this.initDB();
    const settings = await db.getAllFromIndex('budgetSettings', 'petId', petId);
    return settings.length > 0 ? settings[0] : null;
  }

  /**
   * Save or update budget setting
   */
  async saveBudgetSetting(setting: Omit<BudgetSetting, 'id'> | BudgetSetting): Promise<BudgetSetting> {
    const db = await this.initDB();
    
    const budgetSetting: BudgetSetting = 'id' in setting ? setting : {
      ...setting,
      id: `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    await db.put('budgetSettings', budgetSetting);
    return budgetSetting;
  }

  /**
   * Delete an expense
   */
  async deleteExpense(expenseId: string): Promise<void> {
    const db = await this.initDB();
    await db.delete('expenses', expenseId);
  }

  /**
   * Update an expense
   */
  async updateExpense(expense: Expense): Promise<Expense> {
    // Validate category
    if (!this.isValidCategory(expense.category)) {
      throw new Error(`Invalid category: ${expense.category}. Must be one of: food, vet, grooming, toys, other`);
    }

    // Validate amount
    if (expense.amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    const db = await this.initDB();
    await db.put('expenses', expense);
    return expense;
  }

  /**
   * Get expenses for the last 12 months (default view)
   * Requirements: 7.7
   */
  async getExpensesLast12Months(petId: string): Promise<Expense[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);

    return this.getExpenses(petId, startDate, endDate);
  }
}

// Export singleton instance
export const expenseService = new ExpenseService();
export default expenseService;
