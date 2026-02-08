'use client';

import React, { useState } from 'react';
import {
  NotificationCenter,
  ToastContainer,
  NotificationPreferences,
  UrgentAlertModal,
  IconWithBadge,
  NotificationHistory,
  useNotifications,
  useNotificationPermission,
  useNotificationSound,
  type Notification,
  type NotificationPreference,
  type UrgentAlert,
} from '@/components/notifications';
import { BellIcon } from '@/components/icons';

export default function NotificationsPage() {
  const {
    notifications,
    toasts,
    unreadCount,
    urgentCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  } = useNotifications();

  const { permission, isSupported, requestPermission, showBrowserNotification } =
    useNotificationPermission();

  const { soundEnabled, setSoundEnabled, selectedSound, setSelectedSound, playSound } =
    useNotificationSound();

  const [activeTab, setActiveTab] = useState<'center' | 'preferences' | 'history'>('center');
  const [urgentAlert, setUrgentAlert] = useState<UrgentAlert | null>(null);

  // Sample notification preferences
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'med-reminder',
      category: 'medication',
      label: 'Medication Reminders',
      description: 'Get notified 15 minutes before medication time',
      channels: { push: true, email: true, sms: false },
      timing: { enabled: true, time: '09:00' },
    },
    {
      id: 'feed-reminder',
      category: 'feeding',
      label: 'Feeding Reminders',
      description: 'Daily feeding schedule reminders',
      channels: { push: true, email: false, sms: false },
      timing: { enabled: true, time: '08:00' },
    },
    {
      id: 'apt-reminder',
      category: 'appointments',
      label: 'Appointment Reminders',
      description: 'Get notified 24 hours and 2 hours before appointments',
      channels: { push: true, email: true, sms: true },
    },
    {
      id: 'health-update',
      category: 'health',
      label: 'Health Updates',
      description: 'Important health status changes',
      channels: { push: true, email: true, sms: false },
    },
    {
      id: 'urgent-alert',
      category: 'alerts',
      label: 'Urgent Alerts',
      description: 'Critical alerts requiring immediate attention',
      channels: { push: true, email: true, sms: true },
    },
    {
      id: 'weekly-report',
      category: 'reports',
      label: 'Weekly Health Reports',
      description: 'Comprehensive weekly health summaries',
      channels: { push: false, email: true, sms: false },
    },
  ]);

  // Demo functions
  const handleAddSampleNotification = () => {
    const samples: Array<Omit<Notification, 'id'>> = [
      {
        type: 'medication',
        title: 'Medication Reminder',
        message: "It's time to give Max his arthritis medication",
        timestamp: new Date(),
        read: false,
        urgent: false,
        petName: 'Max',
        petId: '1',
      },
      {
        type: 'feeding',
        title: 'Feeding Time',
        message: 'Bella is due for her evening meal',
        timestamp: new Date(),
        read: false,
        urgent: false,
        petName: 'Bella',
        petId: '2',
      },
      {
        type: 'appointment',
        title: 'Upcoming Appointment',
        message: 'Vet checkup tomorrow at 2:00 PM',
        timestamp: new Date(),
        read: false,
        urgent: false,
        petName: 'Max',
        petId: '1',
      },
      {
        type: 'alert',
        title: 'Urgent: Medication Refill Needed',
        message: 'Max has only 2 doses of medication remaining',
        timestamp: new Date(),
        read: false,
        urgent: true,
        petName: 'Max',
        petId: '1',
      },
    ];

    const sample = samples[Math.floor(Math.random() * samples.length)];
    addNotification(sample);
    playSound();
  };

  const handleShowUrgentAlert = () => {
    const alert: UrgentAlert = {
      id: 'urgent-1',
      title: 'Emergency: Possible Toxic Ingestion',
      message:
        'Max may have ingested chocolate. Immediate veterinary attention is recommended.',
      severity: 'critical',
      petName: 'Max',
      petId: '1',
      timestamp: new Date(),
      actions: {
        primary: {
          label: 'Find Emergency Vet',
          onClick: () => {
            showSuccess('Opening emergency vet locator...');
          },
        },
        secondary: {
          label: 'Call Poison Control',
          onClick: () => {
            showInfo('Calling Pet Poison Helpline...');
          },
        },
      },
      details: [
        { label: 'Substance', value: 'Dark Chocolate' },
        { label: 'Estimated Amount', value: '50g' },
        { label: 'Time', value: '15 minutes ago' },
      ],
    };
    setUrgentAlert(alert);
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    showInfo('Notification opened', notification.title);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🔔 Notifications & Alerts
              </h1>
              <p className="text-gray-600">
                Manage your pet care notifications and preferences
              </p>
            </div>
            <IconWithBadge
              icon={<BellIcon className="w-10 h-10 text-primary-500" />}
              count={unreadCount}
              pulse={urgentCount > 0}
              variant={urgentCount > 0 ? 'danger' : 'primary'}
              className="hover:scale-110 transition-transform"
            />
          </div>

          {/* Demo Controls */}
          <div className="bg-white rounded-xl p-4 shadow-md mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Demo Controls</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleAddSampleNotification}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium transition-colors"
              >
                Add Sample Notification
              </button>
              <button
                onClick={handleShowUrgentAlert}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
              >
                Show Urgent Alert
              </button>
              <button
                onClick={() => showSuccess('Success!', 'Operation completed successfully')}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
              >
                Success Toast
              </button>
              <button
                onClick={() => showError('Error!', 'Something went wrong')}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
              >
                Error Toast
              </button>
              <button
                onClick={() => showWarning('Warning!', 'Please review this')}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium transition-colors"
              >
                Warning Toast
              </button>
              <button
                onClick={() => showInfo('Info', 'Here is some information')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
              >
                Info Toast
              </button>
              {isSupported && permission !== 'granted' && (
                <button
                  onClick={requestPermission}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium transition-colors"
                >
                  Enable Browser Notifications
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('center')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'center'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Notification Center
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'preferences'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Preferences
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'history'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex justify-center">
          {activeTab === 'center' && (
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onDelete={deleteNotification}
              onClearAll={clearAll}
              onNotificationClick={handleNotificationClick}
            />
          )}

          {activeTab === 'preferences' && (
            <NotificationPreferences
              preferences={preferences}
              onUpdate={setPreferences}
              onSave={() => {
                showSuccess('Preferences saved!', 'Your notification settings have been updated');
              }}
            />
          )}

          {activeTab === 'history' && (
            <NotificationHistory
              notifications={notifications}
              onDelete={deleteNotification}
              onClearHistory={() => {
                clearAll();
                showInfo('History cleared', 'All notifications have been removed');
              }}
            />
          )}
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} position="top-right" />

      {/* Urgent Alert Modal */}
      <UrgentAlertModal
        alert={urgentAlert}
        isOpen={urgentAlert !== null}
        onClose={() => setUrgentAlert(null)}
      />
    </div>
  );
}
