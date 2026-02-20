/**
 * ProfileSharing Component
 * Main interface for creating and managing shareable pet profiles
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { profileSharingService, ShareableProfile, ProfileSection } from '@/services/ProfileSharingService';
import { ProfileCard } from '@/components/ProfileCard';
import { PrivacyControls } from '@/components/PrivacyControls';
import { LoadingSpinner, EmptyState } from '@/components/LoadingStates';
import { useToast } from '@/hooks/use-toast';
import { Share2, Plus, QrCode, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ProfileSharingProps {
  petId: string;
  userId: string;
  petName: string;
}

export const ProfileSharing: React.FC<ProfileSharingProps> = ({ petId, userId, petName }) => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ShareableProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedSections, setSelectedSections] = useState<ProfileSection[]>([
    'basic_info',
    'emergency_contacts',
  ]);

  useEffect(() => {
    loadProfiles();
  }, [petId]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const profileList = await profileSharingService.getProfilesForPet(petId);
      setProfiles(profileList);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load shareable profiles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    try {
      if (selectedSections.length === 0) {
        toast({
          title: 'Error',
          description: 'Please select at least one section to share',
          variant: 'destructive',
        });
        return;
      }

      const newProfile = await profileSharingService.generateShareableProfile(
        petId,
        userId,
        selectedSections
      );

      setProfiles([newProfile, ...profiles]);
      setCreateDialogOpen(false);
      
      toast({
        title: 'Success',
        description: 'Shareable profile created successfully',
      });
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create profile',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeProfile = async (profileId: string) => {
    try {
      await profileSharingService.revokeProfile(profileId);
      await loadProfiles();
      
      toast({
        title: 'Success',
        description: 'Profile access revoked',
      });
    } catch (error) {
      console.error('Error revoking profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke profile',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePrivacy = async (profileId: string, sections: ProfileSection[]) => {
    try {
      await profileSharingService.updatePrivacySettings(profileId, sections);
      await loadProfiles();
      
      toast({
        title: 'Success',
        description: 'Privacy settings updated',
      });
    } catch (error) {
      console.error('Error updating privacy:', error);
      toast({
        title: 'Error',
        description: 'Failed to update privacy settings',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Pet Profile Sharing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingSpinner message="Loading profiles..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="region" aria-label="Pet Profile Sharing">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Pet Profile Sharing
              </CardTitle>
              <CardDescription>
                Share {petName}'s profile with pet sitters, vets, and groomers
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Shareable Profile</DialogTitle>
                  <DialogDescription>
                    Select which information to include in the shareable profile
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <PrivacyControls
                    selectedSections={selectedSections}
                    onChange={setSelectedSections}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateProfile}>
                      Create Profile
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Profiles List */}
      {profiles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <QrCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Shareable Profiles</h3>
            <p className="text-muted-foreground mb-4">
              Create a shareable profile to generate a QR code and link
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              petName={petName}
              onRevoke={handleRevokeProfile}
              onUpdatePrivacy={handleUpdatePrivacy}
            />
          ))}
        </div>
      )}
    </div>
  );
};
