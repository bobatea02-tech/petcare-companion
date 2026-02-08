import type { Meta, StoryObj } from '@storybook/react';
import { NotificationCenter, type Notification } from './NotificationCenter';

const meta: Meta<typeof NotificationCenter> = {
  title: 'Notifications/NotificationCenter',
  component: NotificationCenter,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof NotificationCenter>;

const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'medication',
    title: 'Medication Reminder',
    message: "It's time to give Max his arthritis medication (2 tablets)",
    timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
    read: false,
    urgent: false,
    petName: 'Max',
    petId: '1',
  },
  {
    id: '2',
    type: 'alert',
    title: 'Urgent: Medication Refill Needed',
    message: 'Max has only 2 doses of medication remaining. Please refill soon.',
    timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
    read: false,
    urgent: true,
    petName: 'Max',
    petId: '1',
  },
  {
    id: '3',
    type: 'feeding',
    title: 'Feeding Time',
    message: 'Bella is due for her evening meal',
    timestamp: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    read: true,
    urgent: false,
    petName: 'Bella',
    petId: '2',
  },
  {
    id: '4',
    type: 'appointment',
    title: 'Upcoming Appointment',
    message: 'Vet checkup tomorrow at 2:00 PM at Happy Paws Clinic',
    timestamp: new Date(Date.now() - 24 * 3600000), // 1 day ago
    read: false,
    urgent: false,
    petName: 'Max',
    petId: '1',
  },
  {
    id: '5',
    type: 'health',
    title: 'Health Record Updated',
    message: 'New vaccination record added for Bella',
    timestamp: new Date(Date.now() - 3 * 24 * 3600000), // 3 days ago
    read: true,
    urgent: false,
    petName: 'Bella',
    petId: '2',
  },
];

export const Default: Story = {
  args: {
    notifications: sampleNotifications,
    onMarkAsRead: (id) => console.log('Mark as read:', id),
    onMarkAllAsRead: () => console.log('Mark all as read'),
    onDelete: (id) => console.log('Delete:', id),
    onClearAll: () => console.log('Clear all'),
    onNotificationClick: (notification) => console.log('Clicked:', notification),
  },
};

export const Empty: Story = {
  args: {
    notifications: [],
    onMarkAsRead: (id) => console.log('Mark as read:', id),
    onMarkAllAsRead: () => console.log('Mark all as read'),
    onDelete: (id) => console.log('Delete:', id),
    onClearAll: () => console.log('Clear all'),
    onNotificationClick: (notification) => console.log('Clicked:', notification),
  },
};

export const OnlyUrgent: Story = {
  args: {
    notifications: sampleNotifications.filter((n) => n.urgent),
    onMarkAsRead: (id) => console.log('Mark as read:', id),
    onMarkAllAsRead: () => console.log('Mark all as read'),
    onDelete: (id) => console.log('Delete:', id),
    onClearAll: () => console.log('Clear all'),
    onNotificationClick: (notification) => console.log('Clicked:', notification),
  },
};

export const AllRead: Story = {
  args: {
    notifications: sampleNotifications.map((n) => ({ ...n, read: true })),
    onMarkAsRead: (id) => console.log('Mark as read:', id),
    onMarkAllAsRead: () => console.log('Mark all as read'),
    onDelete: (id) => console.log('Delete:', id),
    onClearAll: () => console.log('Clear all'),
    onNotificationClick: (notification) => console.log('Clicked:', notification),
  },
};
