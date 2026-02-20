/**
 * Feeding Comparison Component
 * Comparison charts showing feeding patterns across all pets
 * Feature: additional-amazing-features
 * Task: 9.3 Create FeedingComparison component
 * Requirements: 6.3
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { comparisonService, Pet, FeedingLog } from '@/services/ComparisonService';
import { FeedingData } from '@/types/features';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FeedingComparisonProps {
  pets: Pet[];
}

export const FeedingComparison: React.FC<FeedingComparisonProps> = ({ pets }) => {
  const [dateRange, setDateRange] = useState<number>(30);

  // Mock feeding logs - in production, this would come from API
  const feedingLogs = useMemo((): FeedingLog[] => {
    const logs: FeedingLog[] = [];
    const now = new Date();

    pets.forEach((pet) => {
      // Generate 1-3 feeding logs per day for the date range
      for (let i = 0; i < dateRange; i++) {
        const feedingsPerDay = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < feedingsPerDay; j++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          logs.push({
            petId: pet.id,
            date,
            amount: Math.floor(Math.random() * 200) + 100, // 100-300g
          });
        }
      }
    });

    return logs;
  }, [pets, dateRange]);

  const feedingData = useMemo(() => {
    return comparisonService.compareFeedingPatterns(pets, feedingLogs, dateRange);
  }, [pets, feedingLogs, dateRange]);

  // Prepare chart data - aggregate by week for better visualization
  const chartData = useMemo(() => {
    if (feedingData.length === 0) return [];

    // Get all unique dates across all pets
    const allDates = new Set<string>();
    feedingData.forEach((data) => {
      data.dailyFeedings.forEach((feeding) => {
        allDates.add(feeding.date.toISOString().split('T')[0]);
      });
    });

    // Sort dates
    const sortedDates = Array.from(allDates).sort();

    // Group by week
    const weeklyData: { [key: string]: any } = {};

    sortedDates.forEach((dateStr) => {
      const date = new Date(dateStr);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { week: weekKey };
      }

      feedingData.forEach((petData) => {
        const feeding = petData.dailyFeedings.find(
          (f) => f.date.toISOString().split('T')[0] === dateStr
        );

        if (feeding) {
          if (!weeklyData[weekKey][petData.petName]) {
            weeklyData[weekKey][petData.petName] = 0;
          }
          weeklyData[weekKey][petData.petName] += feeding.count;
        }
      });
    });

    return Object.values(weeklyData).slice(-8); // Last 8 weeks
  }, [feedingData]);

  // Generate colors for each pet
  const petColors = useMemo(() => {
    const colors = ['#2D5016', '#4A7C2C', '#6B9F4A', '#8FBC6F', '#B3D99B'];
    const colorMap: { [key: string]: string } = {};
    pets.forEach((pet, index) => {
      colorMap[pet.name] = colors[index % colors.length];
    });
    return colorMap;
  }, [pets]);

  if (feedingData.length === 0) {
    return (
      <div className="text-center py-8 text-sage-600">
        <p>No feeding data available for comparison.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="font-anton text-lg text-forest-800">Feeding Patterns</h3>
        <Select
          value={dateRange.toString()}
          onValueChange={(value) => setDateRange(parseInt(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feeding Frequency Chart */}
      <Card className="bg-white border-sage-200">
        <CardContent className="pt-6">
          <h4 className="text-sm font-semibold text-sage-700 mb-4">
            Weekly Feeding Frequency
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFEF9',
                  border: '1px solid #8B9F7F',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              {pets.slice(0, 10).map((pet) => (
                <Bar
                  key={pet.id}
                  dataKey={pet.name}
                  fill={petColors[pet.name]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {feedingData.map((data) => {
          const totalFeedings = data.dailyFeedings.reduce((sum, f) => sum + f.count, 0);
          const totalAmount = data.dailyFeedings.reduce((sum, f) => sum + f.totalAmount, 0);
          const avgPerDay = data.dailyFeedings.length > 0 ? totalFeedings / data.dailyFeedings.length : 0;

          return (
            <Card key={data.petId} className="bg-sage-50 border-sage-200">
              <CardContent className="pt-6">
                <h4 className="font-anton text-forest-800 mb-4">{data.petName}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-sage-600">Total Feedings:</span>
                    <span className="font-semibold text-forest-800">{totalFeedings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sage-600">Avg per Day:</span>
                    <span className="font-semibold text-forest-800">
                      {avgPerDay.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sage-600">Total Amount:</span>
                    <span className="font-semibold text-forest-800">{totalAmount}g</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
