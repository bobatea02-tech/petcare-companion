/**
 * Milestone Card Component
 * Feature: additional-amazing-features
 * Task: 5.3 Create MilestoneTracker, MilestoneCard, and MilestoneTimeline components
 * 
 * Displays a single milestone with shareable card functionality
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Facebook } from 'lucide-react';
import type { Milestone } from '@/types/features';
import { milestoneDetector } from '@/services/MilestoneDetector';
import { toast } from '@/hooks/use-toast';

interface MilestoneCardProps {
  milestone: Milestone;
  petName: string;
  petPhoto?: string;
  onShare?: (platform: 'whatsapp' | 'facebook') => void;
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  petName,
  petPhoto,
  onShare,
}) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async (platform: 'whatsapp' | 'facebook') => {
    try {
      setIsSharing(true);

      // Generate shareable card
      const shareableCard = await milestoneDetector.generateShareableCard(milestone, {
        id: milestone.petId,
        name: petName,
        species: 'pet',
        photo: petPhoto,
      });

      // Mark as shared
      await milestoneDetector.markAsShared(milestone.id, platform);

      // Create share URL
      const shareText = encodeURIComponent(shareableCard.text);
      const shareUrl = petPhoto ? encodeURIComponent(petPhoto) : '';

      let url = '';
      if (platform === 'whatsapp') {
        url = `https://wa.me/?text=${shareText}`;
      } else if (platform === 'facebook') {
        url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`;
      }

      // Open share dialog
      window.open(url, '_blank', 'width=600,height=400');

      // Call callback if provided
      if (onShare) {
        onShare(platform);
      }

      toast({
        title: 'Milestone Shared!',
        description: `Successfully shared on ${platform === 'whatsapp' ? 'WhatsApp' : 'Facebook'}`,
      });
    } catch (error) {
      console.error('Error sharing milestone:', error);
      toast({
        title: 'Share Failed',
        description: 'Unable to share milestone. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className="bg-white border-sage-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Badge Icon */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sage-100 to-cream-100 flex items-center justify-center text-4xl">
              {milestone.badge}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-anton text-lg text-forest-800 mb-1">
              {milestone.title}
            </h3>
            <p className="text-sm font-inter text-sage-600 mb-2">
              {milestone.description}
            </p>
            <p className="text-xs font-inter text-sage-500">
              {formatDate(milestone.achievedAt)}
            </p>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-sage-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('whatsapp')}
            disabled={isSharing}
            className="flex-1 border-sage-200 text-forest-700 hover:bg-sage-50"
          >
            <Share2 className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('facebook')}
            disabled={isSharing}
            className="flex-1 border-sage-200 text-forest-700 hover:bg-sage-50"
          >
            <Facebook className="w-4 h-4 mr-2" />
            Facebook
          </Button>
        </div>

        {milestone.shared && (
          <div className="mt-2 text-xs font-inter text-sage-500 text-center">
            ✓ Shared
          </div>
        )}
      </CardContent>
    </Card>
  );
};
