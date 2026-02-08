import { useState, useCallback, useEffect } from 'react';
import { Notification } from './NotificationCenter';
import { ToastProps } from './Toast';

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  // Add a new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setNotifications((prev) => [newNotification, ...prev]);
    return newNotification.id;
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  }, []);

  // Delete a notification
  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Add a toast notification
  const addToast = useCallback(
    (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
      const newToast: ToastProps = {
        ...toast,
        id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        onClose: (id: string) => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        },
      };
      setToasts((prev) => [...prev, newToast]);
      return newToast.id;
    },
    []
  );

  // Convenience methods for different toast types
  const showSuccess = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast({ type: 'success', title, message, duration });
    },
    [addToast]
  );

  const showError = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast({ type: 'error', title, message, duration });
    },
    [addToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast({ type: 'warning', title, message, duration });
    },
    [addToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast({ type: 'info', title, message, duration });
    },
    [addToast]
  );

  // Get unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Get urgent count
  const urgentCount = notifications.filter((n) => n.urgent && !n.read).length;

  return {
    notifications,
    toasts,
    unreadCount,
    urgentCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    addToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

// Hook for notification permissions
export const useNotificationPermission = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }, [isSupported]);

  const showBrowserNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== 'granted') {
        return null;
      }

      try {
        return new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
      } catch (error) {
        console.error('Error showing browser notification:', error);
        return null;
      }
    },
    [isSupported, permission]
  );

  return {
    permission,
    isSupported,
    isGranted: permission === 'granted',
    requestPermission,
    showBrowserNotification,
  };
};

// Hook for notification sounds
export const useNotificationSound = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState('default');

  const playSound = useCallback(
    (soundId?: string) => {
      if (!soundEnabled) return;

      const sound = soundId || selectedSound;
      const audio = new Audio(`/sounds/notifications/${sound}.mp3`);
      audio.volume = 0.5;
      audio.play().catch((error) => {
        console.error('Error playing notification sound:', error);
      });
    },
    [soundEnabled, selectedSound]
  );

  return {
    soundEnabled,
    setSoundEnabled,
    selectedSound,
    setSelectedSound,
    playSound,
  };
};
