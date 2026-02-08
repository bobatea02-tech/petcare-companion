// Export all notification components and utilities
export { NotificationCenter } from './NotificationCenter';
export type { Notification } from './NotificationCenter';

export { Toast, ToastContainer } from './Toast';
export type { ToastProps } from './Toast';

export { NotificationPreferences } from './NotificationPreferences';
export type { NotificationPreference } from './NotificationPreferences';

export { UrgentAlertModal } from './UrgentAlertModal';
export type { UrgentAlert } from './UrgentAlertModal';

export {
  NotificationBadge,
  IconWithBadge,
  InlineBadge,
  DotIndicator,
} from './NotificationBadge';

export { WeeklyHealthReportPreview, generateWeeklyHealthReportHTML } from './EmailTemplates';
export type { WeeklyHealthReportData } from './EmailTemplates';

export { NotificationHistory } from './NotificationHistory';

export {
  useNotifications,
  useNotificationPermission,
  useNotificationSound,
} from './useNotifications';
