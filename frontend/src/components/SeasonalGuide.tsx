/**
 * Seasonal Guide Component
 * Displays seasonal pet care guides for monsoon, summer, and winter
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ContentService, { Article } from '@/services/ContentService';
import { CloudRain, Sun, Snowflake, AlertCircle } from 'lucide-react';

interface SeasonalGuideProps {
  petType: string;
  season?: 'monsoon' | 'summer' | 'winter';
}

export const SeasonalGuide: React.FC<SeasonalGuideProps> = ({ petType, season }) => {
  const [guide, setGuide] = useState<Article | null>(null);
  const [currentSeason, setCurrentSeason] = useState<'monsoon' | 'summer' | 'winter'>('summer');

  useEffect(() => {
    // Determine current season based on month if not provided
    const determineSeason = (): 'monsoon' | 'summer' | 'winter' => {
      if (season) return season;
      
      const month = new Date().getMonth();
      if (month >= 5 && month <= 8) return 'monsoon'; // June to September
      if (month >= 2 && month <= 5) return 'summer'; // March to June
      return 'winter'; // October to February
    };

    const activeSeason = determineSeason();
    setCurrentSeason(activeSeason);

    const seasonalGuide = ContentService.getSeasonalGuide(activeSeason, petType);
    setGuide(seasonalGuide);
  }, [petType, season]);

  const getSeasonIcon = () => {
    switch (currentSeason) {
      case 'monsoon':
        return <CloudRain className="w-6 h-6 text-blue-500" />;
      case 'summer':
        return <Sun className="w-6 h-6 text-orange-500" />;
      case 'winter':
        return <Snowflake className="w-6 h-6 text-cyan-500" />;
    }
  };

  const getSeasonColor = () => {
    switch (currentSeason) {
      case 'monsoon':
        return 'from-blue-50 to-cyan-50';
      case 'summer':
        return 'from-orange-50 to-yellow-50';
      case 'winter':
        return 'from-cyan-50 to-blue-50';
    }
  };

  const getSeasonBorderColor = () => {
    switch (currentSeason) {
      case 'monsoon':
        return 'border-blue-200';
      case 'summer':
        return 'border-orange-200';
      case 'winter':
        return 'border-cyan-200';
    }
  };

  if (!guide) {
    return (
      <Card className="bg-cream-50 border-sage-200">
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-12 h-12 text-sage-400 mx-auto mb-3" />
          <p className="font-inter text-sage-600">
            No seasonal guide available for {petType}s during {currentSeason}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br ${getSeasonColor()} ${getSeasonBorderColor()} shadow-sm`}>
      <CardHeader>
        <div className="flex items-center space-x-3">
          {getSeasonIcon()}
          <div>
            <CardTitle className="font-anton text-forest-800 text-lg">
              {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} Care Guide
            </CardTitle>
            <CardDescription className="font-inter text-sage-600">
              Essential tips for {petType}s this season
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-sage-100">
          <h3 className="font-inter font-semibold text-forest-800 text-base mb-2">
            {guide.title}
          </h3>
          <p className="font-inter text-sage-700 text-sm mb-3">
            {guide.summary}
          </p>
          <div className="prose prose-sm max-w-none">
            <div
              className="font-inter text-forest-700 text-sm leading-relaxed whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: guide.content }}
            />
          </div>
        </div>

        {/* Season-specific tips */}
        <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-sage-100">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-forest-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-inter font-medium text-forest-800 text-sm mb-1">
                Quick Tips for {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}
              </p>
              <ul className="space-y-1 text-xs font-inter text-sage-700">
                {currentSeason === 'monsoon' && (
                  <>
                    <li>• Keep your pet dry after outdoor activities</li>
                    <li>• Watch for fungal infections on paws</li>
                    <li>• Ensure indoor exercise opportunities</li>
                  </>
                )}
                {currentSeason === 'summer' && (
                  <>
                    <li>• Provide plenty of fresh water</li>
                    <li>• Avoid midday walks on hot pavement</li>
                    <li>• Watch for signs of heat stress</li>
                  </>
                )}
                {currentSeason === 'winter' && (
                  <>
                    <li>• Provide warm bedding and shelter</li>
                    <li>• Consider sweaters for short-haired breeds</li>
                    <li>• Maintain regular exercise routines</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Tags */}
        {guide.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {guide.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 rounded-full text-xs font-inter bg-white bg-opacity-60 text-sage-700 border border-sage-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
