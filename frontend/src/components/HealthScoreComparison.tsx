/**
 * Health Score Comparison Component
 * Side-by-side comparison of health scores with color-coded visualizations
 * Feature: additional-amazing-features
 * Task: 9.3 Create HealthScoreComparison component
 * Requirements: 6.1, 6.2
 */

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { comparisonService, Pet } from '@/services/ComparisonService';
import { HealthScore, healthScoreCalculator } from '@/services/HealthScoreCalculator';
import { PetComparison } from '@/types/features';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface HealthScoreComparisonProps {
  pets: Pet[];
  healthScores: Map<string, HealthScore>;
}

export const HealthScoreComparison: React.FC<HealthScoreComparisonProps> = ({
  pets,
  healthScores,
}) => {
  const comparisons = useMemo(() => {
    return comparisonService.compareHealthScores(pets, healthScores);
  }, [pets, healthScores]);

  const getColorClass = (score: number): string => {
    const color = healthScoreCalculator.getScoreColor(score);
    switch (color) {
      case 'red':
        return 'bg-red-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'green':
        return 'bg-green-500';
      default:
        return 'bg-sage-500';
    }
  };

  const getTextColorClass = (score: number): string => {
    const color = healthScoreCalculator.getScoreColor(score);
    switch (color) {
      case 'red':
        return 'text-red-700';
      case 'yellow':
        return 'text-yellow-700';
      case 'green':
        return 'text-green-700';
      default:
        return 'text-sage-700';
    }
  };

  const getBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    const color = healthScoreCalculator.getScoreColor(score);
    switch (color) {
      case 'red':
        return 'destructive';
      case 'yellow':
        return 'secondary';
      case 'green':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (comparisons.length === 0) {
    return (
      <div className="text-center py-8 text-sage-600">
        <p>No health score data available for comparison.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {comparisons.map((comparison: PetComparison) => {
          const healthScore = healthScores.get(comparison.petId);
          
          return (
            <Card
              key={comparison.petId}
              className="bg-white border-sage-200 hover:shadow-lg transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Pet Name and Overall Score */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-anton text-lg text-forest-800">
                      {comparison.petName}
                    </h3>
                    <Badge variant={getBadgeVariant(comparison.healthScore)}>
                      {comparison.healthScore}
                    </Badge>
                  </div>

                  {/* Overall Score Gauge */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-sage-600">Overall Health</span>
                      <span className={`font-semibold ${getTextColorClass(comparison.healthScore)}`}>
                        {comparison.healthScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-sage-100 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${getColorClass(comparison.healthScore)}`}
                        style={{ width: `${comparison.healthScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  {healthScore && (
                    <div className="space-y-3 pt-2 border-t border-sage-100">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-sage-600">Nutrition</span>
                          <span className={getTextColorClass(healthScore.nutrition)}>
                            {healthScore.nutrition}
                          </span>
                        </div>
                        <Progress
                          value={healthScore.nutrition}
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-sage-600">Exercise</span>
                          <span className={getTextColorClass(healthScore.exercise)}>
                            {healthScore.exercise}
                          </span>
                        </div>
                        <Progress
                          value={healthScore.exercise}
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-sage-600">Medical</span>
                          <span className={getTextColorClass(healthScore.medical)}>
                            {healthScore.medical}
                          </span>
                        </div>
                        <Progress
                          value={healthScore.medical}
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-sage-600">Grooming</span>
                          <span className={getTextColorClass(healthScore.grooming)}>
                            {healthScore.grooming}
                          </span>
                        </div>
                        <Progress
                          value={healthScore.grooming}
                          className="h-2"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <Card className="bg-sage-50 border-sage-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-anton text-forest-800">
                {comparisons.length}
              </div>
              <div className="text-sm text-sage-600">Pets Compared</div>
            </div>
            <div>
              <div className="text-2xl font-anton text-forest-800">
                {Math.round(
                  comparisons.reduce((sum, c) => sum + c.healthScore, 0) / comparisons.length
                )}
              </div>
              <div className="text-sm text-sage-600">Average Score</div>
            </div>
            <div>
              <div className="text-2xl font-anton text-forest-800">
                {Math.max(...comparisons.map((c) => c.healthScore))}
              </div>
              <div className="text-sm text-sage-600">Highest Score</div>
            </div>
            <div>
              <div className="text-2xl font-anton text-forest-800">
                {Math.min(...comparisons.map((c) => c.healthScore))}
              </div>
              <div className="text-sm text-sage-600">Lowest Score</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
