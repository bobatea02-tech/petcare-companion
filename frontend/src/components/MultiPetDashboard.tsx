/**
 * Multi-Pet Dashboard Component
 * Main dashboard for comparing health metrics across multiple pets
 * Feature: additional-amazing-features
 * Task: 9.3 Create MultiPetDashboard component
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { comparisonService, Pet } from '@/services/ComparisonService';
import { HealthScore } from '@/services/HealthScoreCalculator';
import { HealthScoreComparison } from './HealthScoreComparison';
import { FeedingComparison } from './FeedingComparison';
import { MedicationCalendar } from './MedicationCalendar';
import { MultiPetDashboardSkeleton, EmptyState } from './LoadingStates';
import { PawPrint, Activity, Pill } from 'lucide-react';

interface MultiPetDashboardProps {
  userId: string;
  pets: Pet[];
}

export const MultiPetDashboard: React.FC<MultiPetDashboardProps> = ({ userId, pets }) => {
  const [loading, setLoading] = useState(true);
  const [healthScores, setHealthScores] = useState<Map<string, HealthScore>>(new Map());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // TODO: Fetch actual health scores from API
        // For now, using mock data
        const mockScores = new Map<string, HealthScore>();
        pets.forEach((pet) => {
          mockScores.set(pet.id, {
            overall: Math.floor(Math.random() * 40) + 60, // 60-100
            nutrition: Math.floor(Math.random() * 40) + 60,
            exercise: Math.floor(Math.random() * 40) + 60,
            medical: Math.floor(Math.random() * 40) + 60,
            grooming: Math.floor(Math.random() * 40) + 60,
            lastCalculated: new Date(),
            recommendations: [],
          });
        });

        setHealthScores(mockScores);
      } catch (error) {
        console.error('Error fetching multi-pet data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (pets.length > 0) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [pets]);

  if (loading) {
    return <MultiPetDashboardSkeleton />;
  }

  if (pets.length === 0) {
    return (
      <EmptyState
        icon={<PawPrint className="w-12 h-12" />}
        title="No Pets Found"
        description="Add pets to see comparison data and track their health metrics."
      />
    );
  }

  if (pets.length === 1) {
    return (
      <EmptyState
        icon={<PawPrint className="w-12 h-12" />}
        title="Add More Pets"
        description="Add more pets to enable comparison features and see side-by-side health metrics."
      />
    );
  }

  return (
    <div className="space-y-6" role="region" aria-label="Multi-Pet Comparison Dashboard">
      <Card className="bg-cream-50 border-sage-200">
        <CardHeader>
          <CardTitle className="font-anton text-forest-800">Multi-Pet Comparison</CardTitle>
          <CardDescription>
            Comparing {Math.min(pets.length, 10)} pet{pets.length > 1 ? 's' : ''}
            {pets.length > 10 && ' (showing first 10)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="health" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-sage-100" role="tablist">
              <TabsTrigger 
                value="health" 
                className="data-[state=active]:bg-forest-600 data-[state=active]:text-white"
                role="tab"
                aria-label="Health scores comparison"
              >
                <Activity className="w-4 h-4 mr-2" aria-hidden="true" />
                Health Scores
              </TabsTrigger>
              <TabsTrigger 
                value="feeding" 
                className="data-[state=active]:bg-forest-600 data-[state=active]:text-white"
                role="tab"
                aria-label="Feeding patterns comparison"
              >
                <PawPrint className="w-4 h-4 mr-2" aria-hidden="true" />
                Feeding
              </TabsTrigger>
              <TabsTrigger 
                value="medication" 
                className="data-[state=active]:bg-forest-600 data-[state=active]:text-white"
                role="tab"
                aria-label="Medication schedules comparison"
              >
                <Pill className="w-4 h-4 mr-2" aria-hidden="true" />
                Medications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="health" className="mt-6">
              <HealthScoreComparison pets={pets} healthScores={healthScores} />
            </TabsContent>

            <TabsContent value="feeding" className="mt-6">
              <FeedingComparison pets={pets} />
            </TabsContent>

            <TabsContent value="medication" className="mt-6">
              <MedicationCalendar pets={pets} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
