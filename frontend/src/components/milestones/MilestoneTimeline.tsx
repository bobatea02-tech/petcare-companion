/**
 * Milestone Timeline Component
 * Feature: additional-amazing-features
 * Task: 5.3 Create MilestoneTracker, MilestoneCard, and MilestoneTimeline components
 * 
 * Displays milestones in chronological order with timeline visualization
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Milestone } from '@/types/features';

interface MilestoneTimelineProps {
  milestones: Milestone[];
  petName: string;
}

export const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({
  milestones,
  petName,
}) => {
  // Sort milestones by date (most recent first)
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const milestoneDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - milestoneDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  };

  if (sortedMilestones.length === 0) {
    return (
      <Card className="bg-cream-50 border-sage-200">
        <CardHeader>
          <CardTitle className="font-anton text-forest-800">Milestone Timeline</CardTitle>
          <CardDescription className="font-inter text-sage-600">
            {petName}'s journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sage-600 font-inter">
              No milestones yet. Keep tracking {petName}'s health to unlock achievements!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-cream-50 border-sage-200">
      <CardHeader>
        <CardTitle className="font-anton text-forest-800">Milestone Timeline</CardTitle>
        <CardDescription className="font-inter text-sage-600">
          {petName}'s journey - {sortedMilestones.length} milestone{sortedMilestones.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-sage-200" />

          {/* Timeline items */}
          <div className="space-y-6">
            {sortedMilestones.map((milestone, index) => (
              <div key={milestone.id} className="relative flex items-start space-x-4">
                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sage-100 to-cream-100 border-4 border-cream-50 flex items-center justify-center text-3xl shadow-sm">
                    {milestone.badge}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-2">
                  <div className="bg-white rounded-lg p-4 border border-sage-100 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-anton text-base text-forest-800">
                        {milestone.title}
                      </h3>
                      {milestone.shared && (
                        <span className="flex-shrink-0 ml-2 text-xs bg-sage-100 text-sage-700 px-2 py-1 rounded-full font-inter">
                          Shared
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-inter text-sage-600 mb-2">
                      {milestone.description}
                    </p>
                    <div className="flex items-center space-x-2 text-xs font-inter text-sage-500">
                      <span>{formatDate(milestone.achievedAt)}</span>
                      <span>•</span>
                      <span>{formatTime(milestone.achievedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
