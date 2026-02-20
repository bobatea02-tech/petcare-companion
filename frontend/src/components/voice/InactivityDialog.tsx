/**
 * InactivityDialog Component
 * 
 * Dialog shown when user is inactive for 30 minutes in hands-free mode.
 * Asks if the user wants to continue hands-free mode.
 * 
 * Requirements: 13.4
 * Feature: jojo-voice-assistant-enhanced
 */

import React, { useState, useEffect } from 'react';
import { Clock, Mic } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface InactivityDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when user wants to continue */
  onContinue: () => void;
  /** Callback when user wants to disable */
  onDisable: () => void;
  /** Auto-disable timeout in seconds (default: 60) */
  autoDisableTimeout?: number;
}

/**
 * InactivityDialog Component
 * 
 * Shows a dialog asking if the user wants to continue hands-free mode
 * after 30 minutes of inactivity. Auto-disables if no response.
 */
export const InactivityDialog: React.FC<InactivityDialogProps> = ({
  isOpen,
  onContinue,
  onDisable,
  autoDisableTimeout = 60
}) => {
  const [countdown, setCountdown] = useState(autoDisableTimeout);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) {
      setCountdown(autoDisableTimeout);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-disable when countdown reaches 0
          onDisable();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, autoDisableTimeout, onDisable]);

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <AlertDialogTitle>Still there?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              You've been inactive for 30 minutes. Would you like to continue
              using hands-free mode?
            </p>
            <p className="text-sm text-muted-foreground">
              Hands-free mode will be disabled automatically in{' '}
              <span className="font-semibold text-foreground">{countdown}</span>{' '}
              seconds if you don't respond.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDisable}>
            Disable Hands-free
          </AlertDialogCancel>
          <AlertDialogAction onClick={onContinue}>
            <Mic className="w-4 h-4 mr-2" />
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default InactivityDialog;
