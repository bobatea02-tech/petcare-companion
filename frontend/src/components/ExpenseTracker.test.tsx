/**
 * ExpenseTracker Component Tests
 * Basic rendering and integration tests for expense tracker components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseTracker } from './ExpenseTracker';
import { expenseService } from '@/services/ExpenseService';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('ExpenseTracker Component', () => {
  const mockPetId = 'test-pet-123';
  const mockUserId = 'test-user-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the expense tracker with all main sections', async () => {
    render(<ExpenseTracker petId={mockPetId} userId={mockUserId} />);

    // Check for main title
    expect(screen.getByText('Expense Tracker')).toBeInTheDocument();

    // Check for tabs
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /expenses/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /add new/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /report/i })).toBeInTheDocument();
    });

    // Check for export button
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
  });

  it('should render the budget alert component', async () => {
    render(<ExpenseTracker petId={mockPetId} userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Budget Tracker')).toBeInTheDocument();
    });
  });

  it('should switch between tabs', async () => {
    const user = userEvent.setup();
    render(<ExpenseTracker petId={mockPetId} userId={mockUserId} />);

    // Click on Add New tab
    const addTab = screen.getByRole('tab', { name: /add new/i });
    await user.click(addTab);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument();
    });

    // Click on Report tab
    const reportTab = screen.getByRole('tab', { name: /report/i });
    await user.click(reportTab);

    await waitFor(() => {
      expect(screen.getByText('Monthly Report')).toBeInTheDocument();
    });
  });

  it('should display filters in expenses tab', async () => {
    render(<ExpenseTracker petId={mockPetId} userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search description/i)).toBeInTheDocument();
    });
  });

  it('should show empty state when no expenses exist', async () => {
    // Mock empty expenses
    vi.spyOn(expenseService, 'getExpensesLast12Months').mockResolvedValue([]);
    vi.spyOn(expenseService, 'getExpenses').mockResolvedValue([]);

    render(<ExpenseTracker petId={mockPetId} userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText(/no expenses found/i)).toBeInTheDocument();
    });
  });
});

describe('ExpenseForm Component Integration', () => {
  const mockPetId = 'test-pet-123';
  const mockUserId = 'test-user-456';

  it('should render expense form with all required fields', async () => {
    render(<ExpenseTracker petId={mockPetId} userId={mockUserId} />);

    // Switch to Add New tab
    const addTab = screen.getByRole('tab', { name: /add new/i });
    await userEvent.setup().click(addTab);

    await waitFor(() => {
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument();
    });
  });
});

describe('ExpenseReport Component Integration', () => {
  const mockPetId = 'test-pet-123';

  it('should render expense report with month selector', async () => {
    render(<ExpenseTracker petId={mockPetId} userId="test-user" />);

    // Switch to Report tab
    const reportTab = screen.getByRole('tab', { name: /report/i });
    await userEvent.setup().click(reportTab);

    await waitFor(() => {
      expect(screen.getByText('Monthly Report')).toBeInTheDocument();
      expect(screen.getByText('Category-wise spending breakdown')).toBeInTheDocument();
    });
  });
});

describe('BudgetAlert Component Integration', () => {
  const mockPetId = 'test-pet-123';
  const mockUserId = 'test-user-456';

  it('should render budget tracker', async () => {
    render(<ExpenseTracker petId={mockPetId} userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Budget Tracker')).toBeInTheDocument();
      expect(screen.getByText('Monitor your monthly pet care budget')).toBeInTheDocument();
    });
  });
});
