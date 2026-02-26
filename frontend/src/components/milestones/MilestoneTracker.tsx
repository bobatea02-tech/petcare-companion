/**
 * Milestone Tracker Component
 * Feature: additional-amazing-features
 * Task: 5.3 Create MilestoneTracker, MilestoneCard, and MilestoneTimeline components
 * 
 * Main component for displaying and managing pet milestones
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Calendar, Sparkles } from 'lucide-react';
import { MilestoneCard } from './MilestoneCard';
import { MilestoneTimeline } from './MilestoneTimeline';
import { milestoneDetector } from '@/services/MilestoneDetector';
import { MilestoneTrackerSkeleton, EmptyState, ErrorState } from '@/components/LoadingStates';
import type { Milestone } from '@/types/features';

interface MilestoneTrackerProps {
  petId: string;
  petName: string;
  petPhoto?: string;
}

export const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({
  petId,
  petName,
  petPhoto,
}) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('cards');

  // Fetch milestones on mount
  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedMilestones = await milestoneDetector.getMilestonesSorted(petId);
        setMilestones(fetchedMilestones);
      } catch (error) {
        console.error('Error fetching milestones:', error);
        setError('Failed to load milestones. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
  }, [petId]);

  // Check for new milestones
  const checkForNewMilestones = async () => {
    try {
      setLoading(true);

      // TODO: Fetch actual pet data, health logs, and medical records
      // For now, using mock data
      const mockPet = {
        id: petId,
        name: petName,
        species: 'dog',
        dateOfBirth: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        photo: petPhoto,
      };

      const mockHealthLogs = Array.from({ length: 15 }, (_, i) => ({
        id: `log_${i}`,
        petId,
        date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
        type: 'health_check',
      }));

      const mockMedicalRecords = [
        {
          id: 'med_1',
          petId,
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          type: 'vet_visit',
          description: 'Annual checkup',
        },
      ];

      // Detect new milestones
      const newMilestones = await milestoneDetector.detectMilestones(
        petId,
        mockPet,
        mockHealthLogs,
        mockMedicalRecords
      );

      // Refresh milestone list
      const updatedMilestones = await milestoneDetector.getMilestonesSorted(petId);
      setMilestones(updatedMilestones);

      if (newMilestones.length > 0) {
        // Milestones detected successfully
      }
    } catch (error) {
      console.error('Error checking for milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get milestone statistics
  const stats = {
    total: milestones.length,
    shared: milestones.filter(m => m.shared).length,
    recent: milestones.filter(m => {
      const daysSince = (Date.now() - new Date(m.achievedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    }).length,
  };

  if (loading && milestones.length === 0) {
    return <MilestoneTrackerSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Milestones"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (milestones.length === 0 && !loading) {
    return (
      <EmptyState
        icon={<Trophy className="w-12 h-12" />}
        title="No Milestones Yet"
        description="Start logging health data and activities to unlock milestones for your pet!"
        action={{
          label: "Check for Milestones",
          onClick: checkForNewMilestones
        }}
      />
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header Card with Stats */}
      <Card className="bg-gradient-to-br from-sage-50 to-cream-50 border-sage-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-anton text-forest-800 flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-sage-600" />
                {petName}'s Milestones
              </CardTitle>
              <CardDescription className="font-inter text-sage-600 mt-1">
                Track and celebrate achievements
              </CardDescription>
            </div>
            <Button
              onClick={checkForNewMilestones}
              disabled={loading}
              size="sm"
              className="bg-forest-700 hover:bg-forest-800 text-cream-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Check New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border border-sage-100">
              <div className="text-2xl font-anton text-forest-800">{stats.total}</div>
              <div className="text-xs font-inter text-sage-600">Total</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-sage-100">
              <div className="text-2xl font-anton text-forest-800">{stats.recent}</div>
              <div className="text-xs font-inter text-sage-600">This Month</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-sage-100">
              <div className="text-2xl font-anton text-forest-800">{stats.shared}</div>
              <div className="text-xs font-inter text-sage-600">Shared</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-sage-100">
          <TabsTrigger
            value="cards"
            className="data-[state=active]:bg-white data-[state=active]:text-forest-800 font-inter"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Cards
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="data-[state=active]:bg-white data-[state=active]:text-forest-800 font-inter"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="mt-6">
          {milestones.length === 0 ? (
            <Card className="bg-cream-50 border-sage-200">
              <CardContent className="py-12">
                <div className="text-center">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-sage-300" />
                  <h3 className="font-anton text-lg text-forest-800 mb-2">
                    No Milestones Yet
                  </h3>
                  <p className="text-sm font-inter text-sage-600 mb-4">
                    Keep tracking {petName}'s health to unlock achievements!
                  </p>
                  <Button
                    onClick={checkForNewMilestones}
                    disabled={loading}
                    className="bg-forest-700 hover:bg-forest-800 text-cream-50"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Check for Milestones
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {milestones.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  petName={petName}
                  petPhoto={petPhoto}
                  onShare={(platform) => {
                    // Refresh milestones to update shared status
                    milestoneDetector.getMilestonesSorted(petId).then(setMilestones);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <MilestoneTimeline milestones={milestones} petName={petName} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
