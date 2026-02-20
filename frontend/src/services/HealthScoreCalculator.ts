/**
 * Health Score Calculator Service
 * Calculates pet wellness scores based on tracked health data
 */

export interface HealthDataInput {
  petId: string;
  nutritionLogs: NutritionLog[];
  exerciseLogs: ExerciseLog[];
  medicalRecords: MedicalRecord[];
  groomingLogs: GroomingLog[];
}

export interface NutritionLog {
  date: Date;
  [key: string]: any;
}

export interface ExerciseLog {
  date: Date;
  [key: string]: any;
}

export interface MedicalRecord {
  date: Date;
  [key: string]: any;
}

export interface GroomingLog {
  date: Date;
  [key: string]: any;
}

export interface HealthScore {
  overall: number; // 0-100
  nutrition: number;
  exercise: number;
  medical: number;
  grooming: number;
  lastCalculated: Date;
  recommendations: string[];
}

export type HealthCategory = 'nutrition' | 'exercise' | 'medical' | 'grooming';

export class HealthScoreCalculator {
  // Category weights for overall score calculation
  private readonly CATEGORY_WEIGHTS = {
    nutrition: 0.30,
    exercise: 0.25,
    medical: 0.30,
    grooming: 0.15,
  };

  // Recency weights for log scoring
  private readonly RECENCY_WEIGHTS = {
    recent: 2.0,      // Last 7 days
    medium: 1.0,      // 8-30 days
    old: 0.5,         // Older than 30 days
  };

  /**
   * Calculate overall health score with weighted category scoring
   */
  calculateOverallScore(input: HealthDataInput): HealthScore {
    try {
      // Validate input
      if (!input || !input.petId) {
        throw new Error('Invalid health data input: petId is required');
      }

      // Calculate individual category scores
      const nutritionScore = this.calculateCategoryScore('nutrition', input.nutritionLogs);
      const exerciseScore = this.calculateCategoryScore('exercise', input.exerciseLogs);
      const medicalScore = this.calculateCategoryScore('medical', input.medicalRecords);
      const groomingScore = this.calculateCategoryScore('grooming', input.groomingLogs);

      // Calculate weighted overall score
      const overall = Math.round(
        nutritionScore * this.CATEGORY_WEIGHTS.nutrition +
        exerciseScore * this.CATEGORY_WEIGHTS.exercise +
        medicalScore * this.CATEGORY_WEIGHTS.medical +
        groomingScore * this.CATEGORY_WEIGHTS.grooming
      );

      // Ensure score is within valid range
      const clampedOverall = Math.max(0, Math.min(100, overall));

      const healthScore: HealthScore = {
        overall: clampedOverall,
        nutrition: nutritionScore,
        exercise: exerciseScore,
        medical: medicalScore,
        grooming: groomingScore,
        lastCalculated: new Date(),
        recommendations: this.generateRecommendations({
          overall: clampedOverall,
          nutrition: nutritionScore,
          exercise: exerciseScore,
          medical: medicalScore,
          grooming: groomingScore,
          lastCalculated: new Date(),
          recommendations: [],
        }),
      };

      return healthScore;
    } catch (error) {
      // Error handling: return default score of 50 with error message
      console.error('Error calculating health score:', error);
      return {
        overall: 50,
        nutrition: 50,
        exercise: 50,
        medical: 50,
        grooming: 50,
        lastCalculated: new Date(),
        recommendations: ['Not enough data to calculate accurate score. Start logging to see your pet\'s health score.'],
      };
    }
  }

  /**
   * Calculate category score with recency weighting
   */
  calculateCategoryScore(category: HealthCategory, logs: any[]): number {
    try {
      // Handle insufficient data
      if (!logs || logs.length === 0) {
        return 50; // Default score for no data
      }

      const now = new Date();
      let weightedSum = 0;
      let totalWeight = 0;
      let validLogCount = 0;

      for (const log of logs) {
        // Skip invalid logs
        if (!log || !log.date) {
          continue;
        }

        const logDate = new Date(log.date);
        
        // Skip invalid dates
        if (isNaN(logDate.getTime())) {
          continue;
        }

        const daysDiff = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

        // Determine recency weight
        let weight: number;
        if (daysDiff <= 7) {
          weight = this.RECENCY_WEIGHTS.recent;
        } else if (daysDiff <= 30) {
          weight = this.RECENCY_WEIGHTS.medium;
        } else {
          weight = this.RECENCY_WEIGHTS.old;
        }

        // Base score for having a log entry (can be enhanced with actual log quality metrics)
        const baseScore = 100;
        
        weightedSum += baseScore * weight;
        totalWeight += weight;
        validLogCount++;
      }

      // If no valid logs, return default
      if (validLogCount === 0) {
        return 50;
      }

      // Calculate weighted average
      const score = weightedSum / totalWeight;

      // Apply completeness factor (reduce score if very few logs)
      const completenessFactor = Math.min(1, validLogCount / 5); // Assume 5 logs is "complete"
      const adjustedScore = score * (0.5 + 0.5 * completenessFactor);

      // Clamp to valid range
      return Math.max(0, Math.min(100, Math.round(adjustedScore)));
    } catch (error) {
      console.error(`Error calculating ${category} score:`, error);
      return 50; // Default score on error
    }
  }

  /**
   * Generate recommendations for scores below 70
   */
  generateRecommendations(score: HealthScore): string[] {
    const recommendations: string[] = [];

    if (score.overall < 70) {
      // Overall health recommendation
      recommendations.push('Your pet\'s overall health score needs attention. Review the categories below for specific improvements.');
    }

    // Category-specific recommendations
    if (score.nutrition < 70) {
      recommendations.push('Nutrition: Log regular feeding times and ensure balanced meals. Consider consulting your vet about diet.');
    }

    if (score.exercise < 70) {
      recommendations.push('Exercise: Increase daily activity. Aim for regular walks or play sessions appropriate for your pet\'s breed and age.');
    }

    if (score.medical < 70) {
      recommendations.push('Medical: Schedule a vet checkup and keep vaccination records up to date. Log any health concerns promptly.');
    }

    if (score.grooming < 70) {
      recommendations.push('Grooming: Maintain regular grooming schedule. Brush coat regularly and check for skin issues.');
    }

    // If no specific recommendations, provide encouragement
    if (recommendations.length === 0) {
      recommendations.push('Great job! Keep up the excellent care for your pet.');
    }

    return recommendations;
  }

  /**
   * Get color coding for score display
   */
  getScoreColor(score: number): 'red' | 'yellow' | 'green' {
    if (score >= 0 && score <= 40) {
      return 'red';
    } else if (score >= 41 && score <= 70) {
      return 'yellow';
    } else {
      return 'green';
    }
  }
}

// Export singleton instance
export const healthScoreCalculator = new HealthScoreCalculator();
