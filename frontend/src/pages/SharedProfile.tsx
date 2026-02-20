/**
 * SharedProfile Page
 * Public page for viewing shared pet profiles (no authentication required)
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { profileSharingService, ShareableProfile, ProfileSection } from '@/services/ProfileSharingService';
import { 
  User, 
  Heart, 
  AlertTriangle, 
  Phone, 
  Utensils, 
  Pill,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SECTION_ICONS: Record<ProfileSection, React.ReactNode> = {
  basic_info: <User className="h-5 w-5" />,
  medical_history: <Heart className="h-5 w-5" />,
  allergies: <AlertTriangle className="h-5 w-5" />,
  emergency_contacts: <Phone className="h-5 w-5" />,
  feeding_schedule: <Utensils className="h-5 w-5" />,
  medications: <Pill className="h-5 w-5" />,
};

const SECTION_LABELS: Record<ProfileSection, string> = {
  basic_info: 'Basic Information',
  medical_history: 'Medical History',
  allergies: 'Allergies',
  emergency_contacts: 'Emergency Contacts',
  feeding_schedule: 'Feeding Schedule',
  medications: 'Medications',
};

export const SharedProfile: React.FC = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const [profile, setProfile] = useState<ShareableProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [profileId]);

  const loadProfile = async () => {
    if (!profileId) {
      setError('Invalid profile link');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profileData = await profileSharingService.getProfileById(profileId);
      
      if (!profileData) {
        setError('Profile not found or has been revoked');
      } else {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-2xl font-bold mb-2">Profile Not Available</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'This profile could not be found or has been revoked.'}
            </p>
            <Button onClick={() => window.location.href = '/'} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Pet Profile</CardTitle>
                <CardDescription>
                  Shared on {new Date(profile.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </CardDescription>
              </div>
              <Badge variant="secondary">Shared Profile</Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Shared Information</AlertTitle>
          <AlertDescription>
            This profile contains selected information shared by the pet owner.
            Only the sections below are visible.
          </AlertDescription>
        </Alert>

        {/* Profile Sections */}
        <div className="grid gap-6">
          {profile.includedSections.map((section) => (
            <Card key={section}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {SECTION_ICONS[section]}
                  {SECTION_LABELS[section]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground">
                  {/* Placeholder content - in a real app, this would fetch actual pet data */}
                  <p>
                    This section contains {SECTION_LABELS[section].toLowerCase()} information.
                    The actual pet data would be displayed here based on the pet ID associated with this profile.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            <p>
              This is a shared pet profile. If you have concerns about the information displayed,
              please contact the pet owner directly.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
