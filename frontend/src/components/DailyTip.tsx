/**
 * Daily Tip Component
 * Displays a daily pet care tip based on pet type and breed
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ContentService, { Tip } from '@/services/ContentService';
import { Lightbulb, Sparkles } from 'lucide-react';
import { LoadingSpinner, ErrorState } from '@/components/LoadingStates';

interface DailyTipProps {
  petType: string;
  breed?: string;
}

export const DailyTip: React.FC<DailyTipProps> = ({ petType, breed }) => {
  const [tip, setTip] = useState<Tip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTip();
  }, [petType, breed]);

  const loadTip = async () => {
    try {
      setLoading(true);
      setError(null);
      const dailyTip = ContentService.getDailyTip(petType, breed);
      setTip(dailyTip);
    } catch (err) {
      console.error('Error loading daily tip:', err);
      setError('Failed to load daily tip');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-cream-50 to-sage-50 border-sage-200">
        <CardContent className="py-8">
          <LoadingSpinner size="sm" message="Loading tip..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-cream-50 to-sage-50 border-sage-200">
        <CardContent className="py-4">
          <ErrorState
            title="Tip Unavailable"
            message={error}
            onRetry={loadTip}
          />
        </CardContent>
      </Card>
    );
  }

  if (!tip) {
    return null;
  }

  const getCategoryIcon = () => {
    switch (tip.category) {
      case 'health':
        return '🏥';
      case 'nutrition':
        return '🍽️';
      case 'training':
        return '🎓';
      case 'grooming':
        return '✂️';
      default:
        return '💡';
    }
  };

  const getSeasonalBadge = () => {
    if (!tip.seasonal) return null;
    
    const seasonEmoji = {
      monsoon: '🌧️',
      summer: '☀️',
      winter: '❄️',
    }[tip.seasonal];

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-inter bg-sage-100 text-sage-700">
        {seasonEmoji} {tip.seasonal.charAt(0).toUpperCase() + tip.seasonal.slice(1)}
      </span>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-cream-50 to-sage-50 border-sage-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-forest-600" />
            <CardTitle className="font-anton text-forest-800 text-lg">
              Tip of the Day
            </CardTitle>
          </div>
          {tip.indiaSpecific && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-inter bg-forest-100 text-forest-700">
              🇮🇳 India
            </span>
          )}
        </div>
        <CardDescription className="font-inter text-sage-600 flex items-center space-x-2">
          <span>{getCategoryIcon()}</span>
          <span className="capitalize">{tip.category}</span>
          {getSeasonalBadge()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <h3 className="font-inter font-semibold text-forest-800 text-base">
          {tip.title}
        </h3>
        <p className="font-inter text-sage-700 text-sm leading-relaxed">
          {tip.content}
        </p>
        {tip.breeds && tip.breeds.length > 0 && (
          <div className="flex items-center space-x-2 pt-2 border-t border-sage-100">
            <Sparkles className="w-4 h-4 text-sage-500" />
            <span className="text-xs font-inter text-sage-600">
              Especially for: {tip.breeds.join(', ')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
