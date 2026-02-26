/**
 * Voice Privacy Consent Dialog
 * 
 * Displays privacy consent dialog on first voice use.
 * Ensures users understand how their voice data is handled.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Shield, Mic, Lock, Eye } from 'lucide-react';

interface VoicePrivacyConsentProps {
  onConsent: (accepted: boolean) => void;
}

const CONSENT_KEY = 'voice_privacy_consent_accepted';

export const VoicePrivacyConsent: React.FC<VoicePrivacyConsentProps> = ({
  onConsent
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [understood, setUnderstood] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem(CONSENT_KEY);
    if (!hasConsented) {
      setIsOpen(true);
    } else {
      onConsent(true);
    }
  }, [onConsent]);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setIsOpen(false);
    onConsent(true);
  };

  const handleDecline = () => {
    setIsOpen(false);
    onConsent(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-6 h-6 text-primary" />
            Voice Privacy Notice
          </DialogTitle>
          <DialogDescription>
            Before using voice features, please review how we handle your voice data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Data Collection */}
          <div className="flex gap-3 p-3 bg-muted rounded-lg">
            <Mic className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">What We Collect</h4>
              <p className="text-sm text-muted-foreground">
                We collect voice recordings when you use voice commands. Audio is processed
                to understand your pet care requests and provide assistance.
              </p>
            </div>
          </div>

          {/* Data Usage */}
          <div className="flex gap-3 p-3 bg-muted rounded-lg">
            <Eye className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">How We Use It</h4>
              <p className="text-sm text-muted-foreground">
                Voice data is used to process your commands, improve accuracy, and provide
                personalized pet care assistance. We may use third-party services (Google
                Speech API, OpenAI) for processing.
              </p>
            </div>
          </div>

          {/* Data Security */}
          <div className="flex gap-3 p-3 bg-muted rounded-lg">
            <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">Data Security & Retention</h4>
              <p className="text-sm text-muted-foreground">
                Voice recordings are encrypted in transit and at rest. We retain audio for
                7-30 days for quality improvement, then permanently delete it. You can
                request deletion at any time.
              </p>
            </div>
          </div>

          {/* Your Rights */}
          <div className="p-3 border border-primary/20 rounded-lg bg-primary/5">
            <h4 className="font-semibold mb-2">Your Rights</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Access your voice data</li>
              <li>Request deletion of recordings</li>
              <li>Opt-out of voice features anytime</li>
              <li>Use text input instead of voice</li>
            </ul>
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start gap-3 p-4 border border-border rounded-lg">
            <Checkbox
              id="consent-checkbox"
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(checked as boolean)}
            />
            <Label
              htmlFor="consent-checkbox"
              className="text-sm leading-relaxed cursor-pointer"
            >
              I understand how my voice data will be collected, used, and stored. I have
              read the{' '}
              <a
                href="/VOICE_PRIVACY_POLICY.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
                onClick={(e) => e.stopPropagation()}
              >
                full privacy policy
              </a>{' '}
              and consent to voice data processing.
            </Label>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDecline}
          >
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!understood}
          >
            Accept & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Hook to check if user has consented to voice privacy
 */
export const useVoicePrivacyConsent = (): boolean => {
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    setHasConsented(consent === 'true');
  }, []);

  return hasConsented;
};

/**
 * Reset consent (for testing or user request)
 */
export const resetVoicePrivacyConsent = (): void => {
  localStorage.removeItem(CONSENT_KEY);
};

export default VoicePrivacyConsent;
