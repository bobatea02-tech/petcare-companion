/**
 * ExpenseReport Component
 * Displays monthly expense reports with category breakdown charts
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { expenseService, MonthlyReport, ExpenseCategory } from '@/services/ExpenseService';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';

interface ExpenseReportProps {
  petId: string;
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: '#2d5016',      // Forest
  vet: '#a8b5a0',       // Sage
  grooming: '#8fa888',  // Moss
  toys: '#f5e6d3',      // Cream
  other: '#d4d9c8',     // Olive
};

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: 'Food',
  vet: 'Vet Visits',
  grooming: 'Grooming',
  toys: 'Toys',
  other: 'Other',
};

export const ExpenseReport: React.FC<ExpenseReportProps> = ({ petId }) => {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    loadReport();
  }, [petId, selectedMonth]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const [year, month] = selectedMonth.split('-').map(Number);
      const monthlyReport = await expenseService.getMonthlyReport(petId, month, year);
      setReport(monthlyReport);
    } catch (error) {
      console.error('Error loading expense report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const value = `${year}-${String(month).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    return { value, label };
  });

  // Prepare chart data
  const chartData = report
    ? Object.entries(report.byCategory)
        .filter(([_, amount]) => amount > 0)
        .map(([category, amount]) => ({
          name: CATEGORY_LABELS[category as ExpenseCategory],
          value: amount,
          color: CATEGORY_COLORS[category as ExpenseCategory],
        }))
    : [];

  if (loading) {
    return (
      <Card className="bg-cream-50 border-sage-200">
        <CardContent className="p-6">
          <div className="text-sage-600 font-inter">Loading report...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-cream-50 border-sage-200">
      <CardHeader>
        <CardTitle className="font-anton text-forest-800 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Monthly Report
        </CardTitle>
        <CardDescription className="font-inter text-sage-600">
          Category-wise spending breakdown
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Month Selector */}
        <div className="space-y-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="bg-white border-sage-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {report && (
          <>
            {/* Total Spending */}
            <div className="bg-white rounded-lg p-4 border border-sage-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-sage-600 font-inter">Total Spending</p>
                  <p className="text-3xl font-bold text-forest-800 font-anton">
                    ₹{report.totalSpending.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-sage-400" />
              </div>

              {/* Comparison to Previous Month */}
              {report.comparisonToPreviousMonth !== 0 && (
                <div className="mt-3 flex items-center gap-2">
                  {report.comparisonToPreviousMonth > 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600 font-inter">
                        {report.comparisonToPreviousMonth.toFixed(1)}% more than last month
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 font-inter">
                        {Math.abs(report.comparisonToPreviousMonth).toFixed(1)}% less than last month
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Category Breakdown Chart */}
            {chartData.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-anton text-forest-800">Category Breakdown</h3>
                <div className="bg-white rounded-lg p-4 border border-sage-200">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => `₹${value.toFixed(2)}`}
                        contentStyle={{
                          backgroundColor: '#fffbf5',
                          border: '1px solid #a8b5a0',
                          borderRadius: '0.5rem',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category List */}
                <div className="space-y-2">
                  {Object.entries(report.byCategory)
                    .filter(([_, amount]) => amount > 0)
                    .sort(([_, a], [__, b]) => b - a)
                    .map(([category, amount]) => {
                      const percentage = (amount / report.totalSpending) * 100;
                      return (
                        <div
                          key={category}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-sage-100"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: CATEGORY_COLORS[category as ExpenseCategory] }}
                            />
                            <span className="font-inter text-forest-800">
                              {CATEGORY_LABELS[category as ExpenseCategory]}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-forest-800 font-inter">
                              ₹{amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-sage-600 font-inter">
                              {percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sage-600 font-inter">
                No expenses recorded for this month
              </div>
            )}

            {/* Top Expenses */}
            {report.topExpenses.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-anton text-forest-800">Top Expenses</h3>
                <div className="space-y-2">
                  {report.topExpenses.map((expense, index) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-sage-100"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-forest-800 font-inter">
                          {expense.description}
                        </p>
                        <p className="text-xs text-sage-600 font-inter">
                          {CATEGORY_LABELS[expense.category]} • {new Date(expense.date).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <p className="font-bold text-forest-800 font-inter">
                        ₹{expense.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
