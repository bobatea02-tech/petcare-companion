/**
 * Notification Center Component
 * Displays all notifications with read/dismiss functionality
 */

import { useEffect, useState } from 'react';
import { Bell, X, Check, AlertCircle, Pill, Syringe, Scissors, Cake } from 'lucide-react';
import { notificationService, Notification } from '@/services/NotificationService';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadNotifications();

    // Listen for in-app notifications
    const handleInAppNotification = (event: Event) => {
      const customEvent = event as CustomEvent<Notification>;
      setNotifications(prev => [customEvent.detail, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    window.addEventListener('inAppNotification', handleInAppNotification);

    return () => {
      window.removeEventListener('inAppNotification', handleInAppNotification);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const allNotifications = await notificationService.getNotifications();
      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDismiss = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'medication':
        return <Pill className="h-5 w-5 text-blue-500" />;
      case 'vaccination':
        return <Syringe className="h-5 w-5 text-purple-500" />;
      case 'grooming':
        return <Scissors className="h-5 w-5 text-pink-500" />;
      case 'birthday':
        return <Cake className="h-5 w-5 text-yellow-500" />;
      case 'predictive':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'medication':
        return 'bg-blue-50 border-blue-200';
      case 'vaccination':
        return 'bg-purple-50 border-purple-200';
      case 'grooming':
        return 'bg-pink-50 border-pink-200';
      case 'birthday':
        return 'bg-yellow-50 border-yellow-200';
      case 'predictive':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-['Anton'] text-2xl text-[#2D5016]">
            Notifications
          </SheetTitle>
          <SheetDescription className="font-['Inter']">
            Stay updated on your pet's care reminders and alerts
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-['Inter']">No notifications yet</p>
              <p className="text-sm text-gray-400 mt-2 font-['Inter']">
                We'll notify you about important pet care reminders
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    getNotificationColor(notification.type)
                  } ${notification.read ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-['Inter'] font-semibold text-sm text-gray-900">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1 font-['Inter']">
                            {notification.petName}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleMarkAsRead(notification.id)}
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDismiss(notification.id)}
                            title="Dismiss"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-2 font-['Inter']">
                        {notification.message}
                      </p>
                      <div className="mt-2 p-2 bg-white/50 rounded border border-gray-200">
                        <p className="text-xs font-medium text-gray-700 font-['Inter']">
                          Action: {notification.actionRequired}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 font-['Inter']">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
