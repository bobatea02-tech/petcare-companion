import type { Meta, StoryObj } from '@storybook/react';
import { ProfileSettings } from './ProfileSettings';

const meta: Meta<typeof ProfileSettings> = {
  title: 'Settings/ProfileSettings',
  component: ProfileSettings,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProfileSettings>;

export const Default: Story = {
  args: {
    profile: {
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '+1 (555) 123-4567',
      avatar: '',
      vetName: 'Dr. Emily Smith',
      vetPhone: '+1 (555) 987-6543',
      vetEmail: 'dr.smith@vetclinic.com',
    },
    onUpdate: (profile) => console.log('Profile updated:', profile),
    onSave: () => console.log('Profile saved'),
  },
};

export const WithAvatar: Story = {
  args: {
    profile: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 999-8888',
      avatar: 'https://i.pravatar.cc/150?img=12',
      vetName: 'Dr. Michael Brown',
      vetPhone: '+1 (555) 111-2222',
      vetEmail: 'dr.brown@petcare.com',
    },
    onUpdate: (profile) => console.log('Profile updated:', profile),
    onSave: () => console.log('Profile saved'),
  },
};

export const MinimalInfo: Story = {
  args: {
    profile: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '',
      avatar: '',
    },
    onUpdate: (profile) => console.log('Profile updated:', profile),
    onSave: () => console.log('Profile saved'),
  },
};
