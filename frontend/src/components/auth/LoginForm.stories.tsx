import type { Meta, StoryObj } from '@storybook/react'
import { LoginForm } from './LoginForm'

const meta: Meta<typeof LoginForm> = {
  title: 'Auth/LoginForm',
  component: LoginForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof LoginForm>

export const Default: Story = {
  args: {
    onSubmit: async (data) => {
      console.log('Login:', data)
      await new Promise(resolve => setTimeout(resolve, 1000))
    },
  },
}

export const WithSwitchToRegister: Story = {
  args: {
    onSubmit: async (data) => {
      console.log('Login:', data)
      await new Promise(resolve => setTimeout(resolve, 1000))
    },
    onSwitchToRegister: () => console.log('Switch to register'),
  },
}
