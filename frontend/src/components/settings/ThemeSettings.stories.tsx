import type { Meta, StoryObj } from '@storybook/react';
import { ThemeSettings } from './ThemeSettings';

const meta: Meta<typeof ThemeSettings> = {
  title: 'Settings/ThemeSettings',
  component: ThemeSettings,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ThemeSettings>;

export const LightTheme: Story = {
  args: {
    theme: 'light',
    language: 'en',
    onThemeChange: (theme) => console.log('Theme changed to:', theme),
    onLanguageChange: (language) => console.log('Language changed to:', language),
  },
};

export const DarkTheme: Story = {
  args: {
    theme: 'dark',
    language: 'en',
    onThemeChange: (theme) => console.log('Theme changed to:', theme),
    onLanguageChange: (language) => console.log('Language changed to:', language),
  },
};

export const SystemTheme: Story = {
  args: {
    theme: 'system',
    language: 'en',
    onThemeChange: (theme) => console.log('Theme changed to:', theme),
    onLanguageChange: (language) => console.log('Language changed to:', language),
  },
};

export const SpanishLanguage: Story = {
  args: {
    theme: 'light',
    language: 'es',
    onThemeChange: (theme) => console.log('Theme changed to:', theme),
    onLanguageChange: (language) => console.log('Language changed to:', language),
  },
};
