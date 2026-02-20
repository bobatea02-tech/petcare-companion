/**
 * Notification Permission Prompt Component
 * Requests Web Push notification permissions from users
 */

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { notificationService } from '@/services/NotificationService';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';

interface NotificationPermissionPromptProps {
  onPermissionGranted?: (subscription: PushSubscription) => void;
  onPermissionDenied?: () => void;
}

export function NotificationPermissionPrompt({
  onPermissionGranted,
  onPermissionDenied,
}: NotificationPermissionPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    const checkPermissionStatus = () => {
      if (!('Notification' in window)) {
        return; // Browser doesn't support notifications
      }

      const permission = Notification.permission;
      const hasAsked = localStorage.getItem('notification_permission_asked');

      // Show prompt if permission is default and we haven't asked before
      if (permission === 'default' && !hasAsked) {
        // Delay showing prompt to avoid overwhelming user on first load
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    checkPermissionStatus();
  }, []);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      const permission = await notificationService.requestPermission();
      localStorage.setItem('notification_permission_asked', 'true');

      if (permission === 'granted') {
        const subscription = await notificationService.subscribe();
        if (subscription && onPermissionGranted) {
          onPermissionGranted(subscription);
        }
        setShowPrompt(false);
      } else {
        if (onPermissionDenied) {
          onPermissionDenied();
        }
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification_permission_asked', 'true');
    setShowPrompt(false);
    if (onPermissionDenied) {
      onPermissionDenied();
    }
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="border-2 border-[#8B9D83] shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#F5F1E8] rounded-full">
                <Bell className="h-5 w-5 text-[#2D5016]" />
              </div>
              <CardTitle className="font-['Anton'] text-lg text-[#2D5016]">
                Enable Notifications
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-2"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <CardDescription className="font-['Inter'] text-sm">
            Get timely reminders for:
          </CardDescription>
          <ul className="mt-2 space-y-1 text-sm text-gray-700 font-['Inter']">
            <li className="flex items-center gap-2">
              <span className="text-[#8B9D83]">•</span>
              Medication refills
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#8B9D83]">•</span>
              Vaccination appointments
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#8B9D83]">•</span>
              Grooming schedules
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#8B9D83]">•</span>
              Health alerts
            </li>
          </ul>
        </CardContent>
        <CardFooter className="flex gap-2 pt-3">
          <Button
            variant="outline"
            className="flex-1 font-['Inter']"
            onClick={handleDismiss}
            disabled={isRequesting}
          >
            Not Now
          </Button>
          <Button
            className="flex-1 bg-[#2D5016] hover:bg-[#2D5016]/90 font-['Inter']"
            onClick={handleEnableNotifications}
            disabled={isRequesting}
          >
            {isRequesting ? 'Enabling...' : 'Enable'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
