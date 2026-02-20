/**
 * BudgetAlert Component
 * Displays budget alerts and allows threshold configuration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { expenseService, BudgetSetting } from '@/services/ExpenseService';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Settings, TrendingUp } from 'lucide-react';

interface BudgetAlertProps {
  petId: string;
  userId: string;
  currentSpending: number;
}

export const BudgetAlert: React.FC<BudgetAlertProps> = ({ petId, userId, currentSpending }) => {
  const { toast } = useToast();
  const [budgetSetting, setBudgetSetting] = useState<BudgetSetting | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    monthlyLimit: '',
    alertThreshold: '80',
  });

  useEffect(() => {
    loadBudgetSetting();
  }, [petId]);

  const loadBudgetSetting = async () => {
    try {
      setLoading(true);
      const setting = await expenseService.getBudgetSetting(petId);
      if (setting) {
        setBudgetSetting(setting);
        setFormData({
          monthlyLimit: setting.monthlyLimit.toString(),
          alertThreshold: setting.alertThreshold.toString(),
        });
      } else {
        setIsEditing(true); // Show form if no budget set
      }
    } catch (error) {
      console.error('Error loading budget setting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const monthlyLimit = parseFloat(formData.monthlyLimit);
    const alertThreshold = parseFloat(formData.alertThreshold);

    if (isNaN(monthlyLimit) || monthlyLimit <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Monthly limit must be greater than zero',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(alertThreshold) || alertThreshold < 0 || alertThreshold > 100) {
      toast({
        title: 'Validation Error',
        description: 'Alert threshold must be between 0 and 100',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newSetting = await expenseService.saveBudgetSetting({
        ...(budgetSetting || {}),
        petId,
        userId,
        monthlyLimit,
        alertThreshold,
        enabled: true,
      } as BudgetSetting);

      setBudgetSetting(newSetting);
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Budget settings saved',
      });
    } catch (error) {
      console.error('Error saving budget setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to save budget settings',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-cream-50 border-sage-200">
        <CardContent className="p-6">
          <div className="text-sage-600 font-inter">Loading budget settings...</div>
        </CardContent>
      </Card>
    );
  }

  // Calculate budget status
  const budgetLimit = budgetSetting?.monthlyLimit || 0;
  const threshold = budgetSetting?.alertThreshold || 80;
  const thresholdAmount = (budgetLimit * threshold) / 100;
  const percentageUsed = budgetLimit > 0 ? (currentSpending / budgetLimit) * 100 : 0;
  const isOverThreshold = currentSpending >= thresholdAmount;
  const isOverBudget = currentSpending > budgetLimit;

  return (
    <Card className="bg-cream-50 border-sage-200">
      <CardHeader>
        <CardTitle className="font-anton text-forest-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Budget Tracker
          </span>
          {!isEditing && budgetSetting && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-sage-600 hover:text-forest-800"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </CardTitle>
        <CardDescription className="font-inter text-sage-600">
          Monitor your monthly pet care budget
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          // Budget Configuration Form
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyLimit" className="font-inter text-forest-800">
                Monthly Budget Limit (₹)
              </Label>
              <Input
                id="monthlyLimit"
                type="number"
                step="100"
                min="0"
                placeholder="5000"
                value={formData.monthlyLimit}
                onChange={(e) => setFormData({ ...formData, monthlyLimit: e.target.value })}
                className="bg-white border-sage-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alertThreshold" className="font-inter text-forest-800">
                Alert Threshold (%)
              </Label>
              <Input
                id="alertThreshold"
                type="number"
                min="0"
                max="100"
                placeholder="80"
                value={formData.alertThreshold}
                onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                className="bg-white border-sage-200"
              />
              <p className="text-xs text-sage-600 font-inter">
                Get notified when spending reaches this percentage of your budget
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                className="flex-1 bg-forest-800 hover:bg-forest-700 text-cream-50 font-inter"
              >
                Save Budget
              </Button>
              {budgetSetting && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      monthlyLimit: budgetSetting.monthlyLimit.toString(),
                      alertThreshold: budgetSetting.alertThreshold.toString(),
                    });
                  }}
                  className="border-sage-200 text-forest-800 font-inter"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        ) : budgetSetting ? (
          // Budget Status Display
          <div className="space-y-4">
            {/* Alert Messages */}
            {isOverBudget && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-anton">Budget Exceeded!</AlertTitle>
                <AlertDescription className="font-inter">
                  You've spent ₹{currentSpending.toFixed(2)} of your ₹{budgetLimit.toFixed(2)} monthly budget.
                </AlertDescription>
              </Alert>
            )}

            {!isOverBudget && isOverThreshold && (
              <Alert className="border-yellow-500 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="font-anton text-yellow-800">Budget Alert</AlertTitle>
                <AlertDescription className="font-inter text-yellow-700">
                  You've reached {percentageUsed.toFixed(0)}% of your monthly budget.
                </AlertDescription>
              </Alert>
            )}

            {/* Budget Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-inter">
                <span className="text-forest-800">
                  ₹{currentSpending.toFixed(2)} spent
                </span>
                <span className="text-sage-600">
                  ₹{budgetLimit.toFixed(2)} limit
                </span>
              </div>
              <Progress
                value={Math.min(percentageUsed, 100)}
                className="h-3"
              />
              <div className="flex justify-between text-xs font-inter text-sage-600">
                <span>{percentageUsed.toFixed(1)}% used</span>
                <span>₹{Math.max(0, budgetLimit - currentSpending).toFixed(2)} remaining</span>
              </div>
            </div>

            {/* Budget Details */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <p className="text-xs text-sage-600 font-inter">Monthly Limit</p>
                <p className="text-lg font-bold text-forest-800 font-inter">
                  ₹{budgetLimit.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-sage-600 font-inter">Alert at {threshold}%</p>
                <p className="text-lg font-bold text-forest-800 font-inter">
                  ₹{thresholdAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // No Budget Set
          <div className="text-center py-4">
            <p className="text-sage-600 font-inter mb-4">
              Set a monthly budget to track your spending
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
