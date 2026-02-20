/**
 * ProfileCard Component
 * Displays a shareable profile card with QR code and management options
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { ShareableProfile, ProfileSection } from '@/services/ProfileSharingService';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { PrivacyControls } from '@/components/PrivacyControls';
import { 
  Copy, 
  ExternalLink, 
  Settings, 
  Trash2, 
  Eye, 
  Calendar,
  Share2 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface ProfileCardProps {
  profile: ShareableProfile;
  petName: string;
  onRevoke: (profileId: string) => void;
  onUpdatePrivacy: (profileId: string, sections: ProfileSection[]) => void;
}

const SECTION_LABELS: Record<ProfileSection, string> = {
  basic_info: 'Basic Info',
  medical_history: 'Medical History',
  allergies: 'Allergies',
  emergency_contacts: 'Emergency Contacts',
  feeding_schedule: 'Feeding Schedule',
  medications: 'Medications',
};

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  petName,
  onRevoke,
  onUpdatePrivacy,
}) => {
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedSections, setSelectedSections] = useState<ProfileSection[]>(
    profile.includedSections
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profile.shareUrl);
      toast({
        title: 'Success',
        description: 'Profile link copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const handleOpenLink = () => {
    window.open(profile.shareUrl, '_blank');
  };

  const handleUpdatePrivacy = () => {
    onUpdatePrivacy(profile.id, selectedSections);
    setSettingsOpen(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className={profile.revoked ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{petName}'s Profile</CardTitle>
            <CardDescription className="mt-1">
              Created {formatDate(profile.createdAt)}
            </CardDescription>
          </div>
          {profile.revoked && (
            <Badge variant="destructive">Revoked</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">Access Count</div>
            <div className="text-2xl font-bold">{profile.accessCount}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Last Accessed</div>
            <div className="text-sm font-medium">
              {profile.lastAccessedAt 
                ? formatDate(profile.lastAccessedAt)
                : 'Never'}
            </div>
          </div>
        </div>

        {/* Included Sections */}
        <div>
          <div className="text-sm font-medium mb-2">Shared Information</div>
          <div className="flex flex-wrap gap-2">
            {profile.includedSections.map((section) => (
              <Badge key={section} variant="secondary">
                {SECTION_LABELS[section]}
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        {!profile.revoked && (
          <div className="flex flex-wrap gap-2">
            <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  View QR Code
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Profile</DialogTitle>
                  <DialogDescription>
                    Scan this QR code or share the link to access {petName}'s profile
                  </DialogDescription>
                </DialogHeader>
                <QRCodeGenerator
                  qrCodeData={profile.qrCodeData}
                  shareUrl={profile.shareUrl}
                  petName={petName}
                />
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>

            <Button variant="outline" size="sm" onClick={handleOpenLink} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Preview
            </Button>

            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Privacy
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Privacy Settings</DialogTitle>
                  <DialogDescription>
                    Choose which information to share in this profile
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <PrivacyControls
                    selectedSections={selectedSections}
                    onChange={setSelectedSections}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdatePrivacy}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Revoke
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Revoke Profile Access?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will prevent anyone from accessing this profile using the QR code or link.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onRevoke(profile.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Revoke Access
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {profile.revoked && (
          <div className="text-sm text-muted-foreground italic">
            This profile has been revoked and is no longer accessible
          </div>
        )}
      </CardContent>
    </Card>
  );
};
