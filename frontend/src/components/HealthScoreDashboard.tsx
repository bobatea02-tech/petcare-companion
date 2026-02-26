/**
 * Health Score Dashboard Component
 * Main dashboard displaying health score, category breakdown, trend chart, and recommendations
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HealthScoreGauge } from '@/components/HealthScoreGauge';
import { healthScoreCalculator, HealthScore, HealthDataInput } from '@/services/HealthScoreCalculator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Heart, Scissors, Utensils } from 'lucide-react';
import { getHealthScoreAriaLabel, getCategoryScoreAriaLabel, chartA11y, focusManagement } from '@/lib/accessibility';
import { HealthScoreDashboardSkeleton, ErrorState } from '@/components/LoadingStates';

interface HealthScoreDashboardProps {
  petId: string;
}

interface HealthTrendDataPoint {
  date: string;
  score: number;
}

export const HealthScoreDashboard: React.FC<HealthScoreDashboardProps> = ({ petId }) => {
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [trendData, setTrendData] = useState<HealthTrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch health data and calculate score
  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // TODO: Replace with actual API calls to fetch health data
        // For now, using mock data
        const mockHealthData: HealthDataInput = {
          petId,
          nutritionLogs: generateMockLogs(15),
          exerciseLogs: generateMockLogs(12),
          medicalRecords: generateMockLogs(5),
          groomingLogs: generateMockLogs(8),
        };

        const score = healthScoreCalculator.calculateOverallScore(mockHealthData);
        setHealthScore(score);

        // Generate trend data for the past 30 days
        const trend = generateTrendData(30);
        setTrendData(trend);
        
        // Announce to screen readers
        focusManagement.announce(`Health score loaded: ${score.overall} out of 100`);
      } catch (error) {
        console.error('Error fetching health data:', error);
        setError('Failed to load health score. Please try again.');
        focusManagement.announce('Error loading health score', 'assertive');
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
  }, [petId]);

  // Category breakdown data
  const categoryData = useMemo(() => {
    if (!healthScore) return [];

    return [
      {
        name: 'Nutrition',
        score: healthScore.nutrition,
        icon: Utensils,
        color: healthScoreCalculator.getScoreColor(healthScore.nutrition),
      },
      {
        name: 'Exercise',
        score: healthScore.exercise,
        icon: Activity,
        color: healthScoreCalculator.getScoreColor(healthScore.exercise),
      },
      {
        name: 'Medical',
        score: healthScore.medical,
        icon: Heart,
        color: healthScoreCalculator.getScoreColor(healthScore.medical),
      },
      {
        name: 'Grooming',
        score: healthScore.grooming,
        icon: Scissors,
        color: healthScoreCalculator.getScoreColor(healthScore.grooming),
      },
    ];
  }, [healthScore]);

  if (loading) {
    return <HealthScoreDashboardSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Health Score"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!healthScore) {
    return (
      <div className="flex items-center justify-center p-8" role="alert">
        <div className="text-sage-600">Unable to load health score</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-full" role="region" aria-label="Pet Health Score Dashboard">
      {/* Overall Score Card */}
      <Card className="bg-cream-50 border-sage-200 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-anton text-forest-800">Pet Health Score</CardTitle>
          <CardDescription className="font-inter text-sage-600">
            Overall wellness assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div aria-label={getHealthScoreAriaLabel(healthScore.overall)}>
            <HealthScoreGauge score={healthScore.overall} size="large" />
          </div>
          <p className="text-sm text-sage-600 font-inter">
            Last updated: {healthScore.lastCalculated.toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      {/* Category Breakdown and Trend Chart - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-none">
        {/* Category Breakdown */}
        <Card className="bg-cream-50 border-sage-200">
          <CardHeader className="pb-3">
            <CardTitle className="font-anton text-forest-800 text-xl">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6" role="list" aria-label="Health category scores">
              {categoryData.map((category) => {
                const Icon = category.icon;
                const colorClass = {
                  red: 'text-red-500',
                  yellow: 'text-yellow-500',
                  green: 'text-green-500',
                }[category.color];

                return (
                  <div
                    key={category.name}
                    role="listitem"
                    aria-label={getCategoryScoreAriaLabel(category.name, category.score)}
                    className="flex items-center space-x-4 p-4 rounded-lg bg-white border border-sage-100"
                    tabIndex={0}
                  >
                    <Icon className={`w-8 h-8 ${colorClass}`} aria-hidden="true" />
                    <div className="flex-1">
                      <p className="text-base font-inter font-medium text-forest-800">
                        {category.name}
                      </p>
                      <p className={`text-2xl font-bold ${colorClass}`}>
                        {category.score}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Trend Chart */}
        {trendData.length > 0 && (
          <Card className="bg-cream-50 border-sage-200">
            <CardHeader className="pb-3">
              <CardTitle className="font-anton text-forest-800 text-xl">30-Day Trend</CardTitle>
              <CardDescription className="font-inter text-sage-600">
                Health score history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div {...chartA11y.chartContainerProps(
                chartA11y.getChartDescription('Line', trendData.length, 'stable')
              )}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      style={{ fontSize: '0.875rem' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#6b7280"
                      style={{ fontSize: '0.875rem' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fffbf5',
                        border: '1px solid #a8b5a0',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#2d5016"
                      strokeWidth={3}
                      dot={{ fill: '#2d5016', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      {healthScore.recommendations.length > 0 && (
        <Card className="bg-cream-50 border-sage-200">
          <CardHeader>
            <CardTitle className="font-anton text-forest-800">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2" role="list" aria-label="Health recommendations">
              {healthScore.recommendations.map((recommendation, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-2 text-sm font-inter text-forest-700"
                  role="listitem"
                >
                  <span className="text-sage-500 mt-1" aria-hidden="true">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper function to generate mock logs for testing
function generateMockLogs(count: number): any[] {
  const logs = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 60); // Random date within last 60 days
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    
    logs.push({
      date,
      // Add other mock properties as needed
    });
  }
  
  return logs;
}

// Helper function to generate trend data
function generateTrendData(days: number): HealthTrendDataPoint[] {
  const data: HealthTrendDataPoint[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate a somewhat realistic trend (random walk around 75)
    const baseScore = 75;
    const variation = Math.random() * 20 - 10; // -10 to +10
    const score = Math.max(0, Math.min(100, Math.round(baseScore + variation)));
    
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      score,
    });
  }
  
  return data;
}
