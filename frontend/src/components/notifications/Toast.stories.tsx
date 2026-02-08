import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from './Toast';

const meta: Meta<typeof Toast> = {
  title: 'Notifications/Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Success: Story = {
  args: {
    id: '1',
    type: 'success',
    title: 'Medication logged successfully',
    message: 'Max received his arthritis medication at 9:00 AM',
    duration: 0, // Don't auto-dismiss in Storybook
    onClose: (id) => console.log('Close toast:', id),
  },
};

export const Error: Story = {
  args: {
    id: '2',
    type: 'error',
    title: 'Failed to save',
    message: 'Unable to update pet profile. Please try again.',
    duration: 0,
    onClose: (id) => console.log('Close toast:', id),
  },
};

export const Warning: Story = {
  args: {
    id: '3',
    type: 'warning',
    title: 'Medication running low',
    message: 'Only 3 doses remaining. Consider refilling soon.',
    duration: 0,
    onClose: (id) => console.log('Close toast:', id),
  },
};

export const Info: Story = {
  args: {
    id: '4',
    type: 'info',
    title: 'Appointment reminder',
    message: 'Vet checkup scheduled for tomorrow at 2:00 PM',
    duration: 0,
    onClose: (id) => console.log('Close toast:', id),
  },
};

export const WithAction: Story = {
  args: {
    id: '5',
    type: 'success',
    title: 'Health report ready',
    message: 'Your weekly health report is available',
    duration: 0,
    onClose: (id) => console.log('Close toast:', id),
    action: {
      label: 'View Report',
      onClick: () => console.log('View report clicked'),
    },
  },
};

export const ShortMessage: Story = {
  args: {
    id: '6',
    type: 'success',
    title: 'Saved!',
    duration: 0,
    onClose: (id) => console.log('Close toast:', id),
  },
};
