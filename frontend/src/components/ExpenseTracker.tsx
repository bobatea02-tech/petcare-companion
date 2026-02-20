/**
 * ExpenseTracker Component
 * Main expense tracking interface with add/view/filter functionality and CSV export
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { expenseService, Expense, ExpenseCategory } from '@/services/ExpenseService';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseReport } from '@/components/ExpenseReport';
import { BudgetAlert } from '@/components/BudgetAlert';
import { ExpenseTrackerSkeleton, EmptyState, ErrorState } from '@/components/LoadingStates';
import { useToast } from '@/hooks/use-toast';
import { Download, Filter, Receipt, Trash2, Edit } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ExpenseTrackerProps {
  petId: string;
  userId: string;
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: 'Food',
  vet: 'Vet Visits',
  grooming: 'Grooming',
  toys: 'Toys',
  other: 'Other',
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: 'bg-green-100 text-green-800',
  vet: 'bg-blue-100 text-blue-800',
  grooming: 'bg-purple-100 text-purple-800',
  toys: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800',
};

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ petId, userId }) => {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [currentMonthSpending, setCurrentMonthSpending] = useState(0);

  useEffect(() => {
    loadExpenses();
  }, [petId]);

  useEffect(() => {
    applyFilters();
  }, [expenses, filterCategory, searchQuery]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      // Load last 12 months of expenses
      const expenseList = await expenseService.getExpensesLast12Months(petId);
      setExpenses(expenseList);

      // Calculate current month spending
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const currentMonthExpenses = await expenseService.getExpenses(petId, startOfMonth, endOfMonth);
      const total = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      setCurrentMonthSpending(total);
    } catch (error) {
      console.error('Error loading expenses:', error);
      setError('Failed to load expenses. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load expenses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...expenses];

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter((exp) => exp.category === filterCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (exp) =>
          exp.description.toLowerCase().includes(query) ||
          (exp.notes && exp.notes.toLowerCase().includes(query))
      );
    }

    setFilteredExpenses(filtered);
  };

  const handleExportCSV = async () => {
    try {
      const now = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);

      const csv = await expenseService.exportToCSV(petId, startDate, now);

      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pet-expenses-${now.toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Success',
        description: 'Expenses exported to CSV',
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: 'Error',
        description: 'Failed to export expenses',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      await expenseService.deleteExpense(expenseToDelete);
      toast({
        title: 'Success',
        description: 'Expense deleted',
      });
      loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete expense',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  const confirmDelete = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setDeleteDialogOpen(true);
  };

  // Show loading skeleton
  if (loading) {
    return <ExpenseTrackerSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <ErrorState
        title="Failed to Load Expenses"
        message={error}
        onRetry={loadExpenses}
      />
    );
  }

  return (
    <div className="space-y-6 p-4" role="region" aria-label="Expense Tracker">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-anton text-forest-800">Expense Tracker</h1>
          <p className="text-sage-600 font-inter">Manage your pet care expenses</p>
        </div>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="border-sage-200 text-forest-800 font-inter"
          aria-label="Export expenses to CSV"
        >
          <Download className="w-4 h-4 mr-2" aria-hidden="true" />
          Export CSV
        </Button>
      </div>

      {/* Budget Alert */}
      <BudgetAlert petId={petId} userId={userId} currentSpending={currentMonthSpending} />

      {/* Tabs */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-sage-100">
          <TabsTrigger value="expenses" className="font-inter">
            Expenses
          </TabsTrigger>
          <TabsTrigger value="add" className="font-inter">
            Add New
          </TabsTrigger>
          <TabsTrigger value="report" className="font-inter">
            Report
          </TabsTrigger>
        </TabsList>

        {/* Expenses List Tab */}
        <TabsContent value="expenses" className="space-y-4">
          {/* Filters */}
          <Card className="bg-cream-50 border-sage-200">
            <CardHeader>
              <CardTitle className="font-anton text-forest-800 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-inter text-forest-800">Category</label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="bg-white border-sage-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="vet">Vet Visits</SelectItem>
                      <SelectItem value="grooming">Grooming</SelectItem>
                      <SelectItem value="toys">Toys</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-inter text-forest-800">Search</label>
                  <Input
                    type="text"
                    placeholder="Search description or notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white border-sage-200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses List */}
          <Card className="bg-cream-50 border-sage-200">
            <CardHeader>
              <CardTitle className="font-anton text-forest-800 flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Expense History
              </CardTitle>
              <CardDescription className="font-inter text-sage-600">
                {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-sage-600 font-inter">
                  Loading expenses...
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-8 text-sage-600 font-inter">
                  No expenses found. Add your first expense to get started!
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-start justify-between p-4 bg-white rounded-lg border border-sage-100 hover:border-sage-300 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={CATEGORY_COLORS[expense.category]}>
                            {CATEGORY_LABELS[expense.category]}
                          </Badge>
                          <span className="text-xs text-sage-600 font-inter">
                            {new Date(expense.date).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <p className="font-medium text-forest-800 font-inter">
                          {expense.description}
                        </p>
                        {expense.notes && (
                          <p className="text-sm text-sage-600 font-inter">{expense.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-bold text-forest-800 font-inter">
                          ₹{expense.amount.toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(expense.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Expense Tab */}
        <TabsContent value="add">
          <ExpenseForm petId={petId} userId={userId} onExpenseAdded={loadExpenses} />
        </TabsContent>

        {/* Report Tab */}
        <TabsContent value="report">
          <ExpenseReport petId={petId} />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-anton">Delete Expense</AlertDialogTitle>
            <AlertDialogDescription className="font-inter">
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-inter">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExpense}
              className="bg-red-600 hover:bg-red-700 font-inter"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
