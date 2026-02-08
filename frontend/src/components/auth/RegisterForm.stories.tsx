import type { Meta, StoryObj } from '@storybook/react'
import { RegisterForm } from './RegisterForm'

const meta: Meta<typeof RegisterForm> = {
  title: 'Auth/RegisterForm',
  component: RegisterForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof RegisterForm>

export const Default: Story = {
  args: {
    onSubmit: async (data) => {
      console.log('Register:', data)
      await new Promise(resolve => setTimeout(resolve, 1000))
    },
  },
}

export const WithSwitchToLogin: Story = {
  args: {
    onSubmit: async (data) => {
      console.log('Register:', data)
      await new Promise(resolve => setTimeout(resolve, 1000))
    },
    onSwitchToLogin: () => console.log('Switch to login'),
  },
}
