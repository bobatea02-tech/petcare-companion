import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader, CardTitle, CardContent } from './Card'
import { PawIcon } from '../icons'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: () => (
    <Card>
      <p>This is a simple card component</p>
    </Card>
  ),
}

export const WithHeaderAndContent: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Pet Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          This card contains information about your pet's profile and health records.
        </p>
      </CardContent>
    </Card>
  ),
}

export const WithIcon: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PawIcon className="text-primary-500" />
          <CardTitle>Medication Tracker</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Track your pet's medications and dosages.</p>
      </CardContent>
    </Card>
  ),
}

export const PetThemed: Story = {
  render: () => (
    <Card className="border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white">
      <CardHeader>
        <CardTitle className="text-primary-600">🐾 Daily Care Checklist</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>Morning feeding</span>
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>Medication</span>
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>Evening walk</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  ),
}
