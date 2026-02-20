/**
 * ExpenseForm Component
 * Form for adding new pet expenses with category selection and validation
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { expenseService, ExpenseCategory } from '@/services/ExpenseService';
import { useToast } from '@/hooks/use-toast';
import { DollarSign } from 'lucide-react';

interface ExpenseFormProps {
  petId: string;
  userId: string;
  onExpenseAdded?: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ petId, userId, onExpenseAdded }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '' as ExpenseCategory | '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    notes: '',
  });

  const categories: { value: ExpenseCategory; label: string }[] = [
    { value: 'food', label: 'Food' },
    { value: 'vet', label: 'Vet Visits' },
    { value: 'grooming', label: 'Grooming' },
    { value: 'toys', label: 'Toys' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.category) {
      toast({
        title: 'Validation Error',
        description: 'Please select a category',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Amount must be greater than zero',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a description',
        variant: 'destructive',
      });
      return;
    }

    // Check if date is in future
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      const proceed = window.confirm('Date is in the future. Is this correct?');
      if (!proceed) return;
    }

    try {
      setLoading(true);
      await expenseService.addExpense({
        petId,
        userId,
        category: formData.category,
        amount,
        currency: 'INR',
        date: new Date(formData.date),
        description: formData.description.trim(),
        notes: formData.notes.trim() || undefined,
      });

      toast({
        title: 'Success',
        description: 'Expense added successfully',
      });

      // Reset form
      setFormData({
        category: '' as ExpenseCategory | '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        notes: '',
      });

      if (onExpenseAdded) {
        onExpenseAdded();
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add expense',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-cream-50 border-sage-200">
      <CardHeader>
        <CardTitle className="font-anton text-forest-800 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Add Expense
        </CardTitle>
        <CardDescription className="font-inter text-sage-600">
          Track your pet care spending
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category" className="font-inter text-forest-800">
              Category *
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as ExpenseCategory })}
            >
              <SelectTrigger id="category" className="bg-white border-sage-200">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="font-inter text-forest-800">
              Amount (₹) *
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="bg-white border-sage-200"
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="font-inter text-forest-800">
              Date *
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-white border-sage-200"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="font-inter text-forest-800">
              Description *
            </Label>
            <Input
              id="description"
              type="text"
              placeholder="e.g., Premium dog food"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-white border-sage-200"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="font-inter text-forest-800">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-white border-sage-200 min-h-[80px]"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-forest-800 hover:bg-forest-700 text-cream-50 font-inter"
          >
            {loading ? 'Adding...' : 'Add Expense'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
