/**
 * SOSFloatingButton Component
 * 
 * A floating action button accessible from all pages that triggers emergency mode.
 * Requires confirmation before activating to prevent accidental activation.
 */

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface SOSFloatingButtonProps {
  position?: 'bottom-right' | 'bottom-left';
  onActivate: () => void;
}

export const SOSFloatingButton: React.FC<SOSFloatingButtonProps> = ({
  position = 'bottom-right',
  onActivate
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handlePress = () => {
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    setShowConfirmation(false);
    onActivate();
  };

  const positionClasses = position === 'bottom-right' 
    ? 'right-4 bottom-20' 
    : 'left-4 bottom-20';

  return (
    <>
      <Button
        onClick={handlePress}
        className={`fixed ${positionClasses} z-50 h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 shadow-lg transition-all duration-200 hover:scale-110`}
        aria-label="Emergency SOS"
      >
        <AlertCircle className="h-8 w-8 text-white" />
      </Button>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Activate Emergency SOS?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will activate emergency mode and help you find nearby 24-hour veterinary clinics.
              Your pet's medical history will be prepared for sharing with emergency vets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Activate Emergency Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SOSFloatingButton;
