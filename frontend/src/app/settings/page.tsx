'use client';

import React, { useState } from 'react';
import {
  SettingsLayout,
  ProfileSettings,
  NotificationSettings,
  ThemeSettings,
  PrivacySettings,
  WorkflowSettings,
  HelpCenter,
  type Theme,
  type Language,
} from '@/components/settings';

export default function SettingsPage() {
  // Profile state
  const [profile, setProfile] = useState({
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+1 (555) 123-4567',
    avatar: '',
    vetName: 'Dr. Emily Smith',
    vetPhone: '+1 (555) 987-6543',
    vetEmail: 'dr.smith@vetclinic.com',
  });

  // Notification state
  const [notificationCategories, setNotificationCategories] = useState([
    {
      id: 'medication',
      label: 'Medication Reminders',
      icon: '💊',
      description: 'Get notified before medication times',
      channels: { push: true, email: true, sms: false },
      time: '08:00',
    },
    {
      id: 'feeding',
      label: 'Feeding Schedule',
      icon: '🍖',
      description: 'Reminders for feeding times',
      channels: { push: true, email: false, sms: false },
      time: '07:00',
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: '📅',
      description: 'Upcoming vet appointments',
      channels: { push: true, email: true, sms: true },
    },
    {
      id: 'health',
      label: 'Health Updates',
      icon: '❤️',
      description: 'Weekly health reports and insights',
      channels: { push: false, email: true, sms: false },
    },
    {
      id: 'alerts',
      label: 'Urgent Alerts',
      icon: '🚨',
      description: 'Critical health alerts',
      channels: { push: true, email: true, sms: true },
    },
  ]);

  // Theme state
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('en');

  // Workflow state
  const [workflows, setWorkflows] = useState([
    {
      id: 'daily-medication',
      name: 'Daily Medication Check',
      icon: '💊',
      enabled: true,
      time: '08:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    {
      id: 'feeding-reminder',
      name: 'Feeding Reminders',
      icon: '🍖',
      enabled: true,
      time: '07:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    {
      id: 'weekly-report',
      name: 'Weekly Health Report',
      icon: '📊',
      enabled: true,
      time: '09:00',
      days: ['Mon'],
    },
    {
      id: 'appointment-check',
      name: 'Appointment Reminders',
      icon: '📅',
      enabled: true,
      time: '10:00',
      days: ['Mon', 'Wed', 'Fri'],
    },
  ]);

  // Handlers
  const handleProfileSave = () => {
    console.log('Saving profile:', profile);
    alert('Profile saved successfully! 🎉');
  };

  const handleNotificationSave = () => {
    console.log('Saving notification preferences:', notificationCategories);
    alert('Notification preferences saved! 🔔');
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    console.log('Theme changed to:', newTheme);
    // In a real app, this would update the global theme
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    console.log('Language changed to:', newLanguage);
    // In a real app, this would update the i18n settings
  };

  const handleExportData = () => {
    console.log('Exporting user data...');
    alert('Your data export has been initiated. You will receive an email with the download link shortly. 📦');
  };

  const handleDeleteAccount = () => {
    console.log('Deleting account...');
    alert('Account deletion initiated. We\'re sorry to see you go! 😢');
  };

  const handleWorkflowSave = () => {
    console.log('Saving workflows:', workflows);
    alert('Workflow settings saved! ⚙️');
  };

  // Settings sections
  const sections = [
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      component: (
        <ProfileSettings profile={profile} onUpdate={setProfile} onSave={handleProfileSave} />
      ),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: '🔔',
      component: (
        <NotificationSettings
          categories={notificationCategories}
          onUpdate={setNotificationCategories}
          onSave={handleNotificationSave}
        />
      ),
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: '🎨',
      component: (
        <ThemeSettings
          theme={theme}
          language={language}
          onThemeChange={handleThemeChange}
          onLanguageChange={handleLanguageChange}
        />
      ),
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: '⚙️',
      component: (
        <WorkflowSettings
          workflows={workflows}
          onUpdate={setWorkflows}
          onSave={handleWorkflowSave}
        />
      ),
    },
    {
      id: 'privacy',
      label: 'Privacy & Data',
      icon: '🔒',
      component: (
        <PrivacySettings onExportData={handleExportData} onDeleteAccount={handleDeleteAccount} />
      ),
    },
    {
      id: 'help',
      label: 'Help Center',
      icon: '❓',
      component: <HelpCenter />,
    },
  ];

  return <SettingsLayout sections={sections} defaultSection="profile" />;
}
