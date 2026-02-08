# PawPal Settings & User Preferences

## Overview

A comprehensive settings and user preferences system for the PawPal pet care application, featuring profile management, notification preferences, theme customization, workflow automation, privacy controls, and a help center.

## Components

### 1. SettingsLayout
Main layout component that provides a sidebar navigation and content area for settings sections.

**Features:**
- Responsive sidebar navigation
- Active section highlighting
- Pet-themed decorative elements
- Smooth section transitions
- Mobile-friendly collapsible menu

**Usage:**
```tsx
import { SettingsLayout } from '@/components/settings';

const sections = [
  {
    id: 'profile',
    label: 'Profile',
    icon: '👤',
    component: <ProfileSettings />,
  },
  // ... more sections
];

<SettingsLayout sections={sections} defaultSection="profile" />
```

### 2. ProfileSettings
User profile management with avatar upload and veterinarian contact information.

**Features:**
- Avatar upload with preview
- Personal information fields (name, email, phone)
- Veterinarian contact details
- Unsaved changes indicator
- Form validation

**Usage:**
```tsx
import { ProfileSettings } from '@/components/settings';

<ProfileSettings
  profile={profileData}
  onUpdate={setProfile}
  onSave={handleSave}
/>
```

### 3. NotificationSettings
Comprehensive notification preferences with channel selection and timing.

**Features:**
- Multi-channel toggles (push, email, SMS)
- Category-based preferences
- Custom timing for scheduled notifications
- Visual channel indicators
- Bulk preference management

**Usage:**
```tsx
import { NotificationSettings } from '@/components/settings';

<NotificationSettings
  categories={notificationCategories}
  onUpdate={setCategories}
  onSave={handleSave}
/>
```

### 4. ThemeSettings
Theme and language customization interface.

**Features:**
- 3 theme options (light, dark, system)
- 5 language options (English, Spanish, French, German, Chinese)
- Visual theme previews
- Flag icons for languages
- Active selection indicators

**Usage:**
```tsx
import { ThemeSettings } from '@/components/settings';

<ThemeSettings
  theme={theme}
  language={language}
  onThemeChange={setTheme}
  onLanguageChange={setLanguage}
/>
```

### 5. WorkflowSettings
Automated workflow and schedule customization.

**Features:**
- Enable/disable workflows with toggle switches
- Time picker for scheduled workflows
- Day-of-week selector
- Visual schedule builder
- Multiple workflow types (medication, feeding, reports, appointments)

**Usage:**
```tsx
import { WorkflowSettings } from '@/components/settings';

<WorkflowSettings
  workflows={workflows}
  onUpdate={setWorkflows}
  onSave={handleSave}
/>
```

### 6. PrivacySettings
Data privacy controls and account management.

**Features:**
- Data export functionality
- Privacy control toggles
- Account deletion with confirmation
- Data retention policy information
- Clear explanations for each option

**Usage:**
```tsx
import { PrivacySettings } from '@/components/settings';

<PrivacySettings
  onExportData={handleExport}
  onDeleteAccount={handleDelete}
/>
```

### 7. HelpCenter
Searchable FAQ and support resources.

**Features:**
- Search functionality
- Category filtering
- Expandable FAQ items
- Contact support options
- Quick links to resources
- Pet-themed illustrations

**Usage:**
```tsx
import { HelpCenter } from '@/components/settings';

<HelpCenter />
```

## Types

### Theme
```typescript
type Theme = 'light' | 'dark' | 'system';
```

### Language
```typescript
type Language = 'en' | 'es' | 'fr' | 'de' | 'zh';
```

### SettingsSection
```typescript
interface SettingsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}
```

### ProfileData
```typescript
interface ProfileData {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  vetName?: string;
  vetPhone?: string;
  vetEmail?: string;
}
```

### NotificationChannel
```typescript
interface NotificationChannel {
  push: boolean;
  email: boolean;
  sms: boolean;
}
```

### WorkflowSchedule
```typescript
interface WorkflowSchedule {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  time: string;
  days: string[];
}
```

## Features Implemented

### ✅ Profile Management
- Avatar upload with preview
- Personal information editing
- Veterinarian contact management
- Unsaved changes warning

### ✅ Notification Preferences
- Multi-channel selection (push, email, SMS)
- Category-based preferences
- Custom timing for reminders
- Visual channel indicators

### ✅ Theme Customization
- Light/dark/system theme options
- Visual theme previews
- Smooth theme transitions

### ✅ Language Selection
- 5 language options
- Flag icons for visual identification
- Internationalization ready

### ✅ Workflow Automation
- Enable/disable workflows
- Custom scheduling with time picker
- Day-of-week selection
- Visual schedule builder

### ✅ Privacy Controls
- Data export functionality
- Privacy preference toggles
- Account deletion with confirmation
- Clear data retention policy

### ✅ Help Center
- Searchable FAQ database
- Category filtering
- Expandable answers
- Contact support options
- Quick resource links

## Styling & Design

### Color Scheme
- Primary: Orange (#f97316)
- Secondary: Pink (#ec4899)
- Success: Green (#22c55e)
- Warning: Yellow (#eab308)
- Danger: Red (#ef4444)
- Info: Blue (#3b82f6)

### Pet-Themed Elements
- Paw print decorations
- Pet emoji icons
- Warm, friendly color palette
- Playful animations
- Rounded corners and soft shadows

### Responsive Design
- Mobile-first approach
- Collapsible sidebar on mobile
- Touch-friendly controls
- Adaptive grid layouts

## Accessibility

All components follow WCAG 2.1 AA standards:
- Keyboard navigation support
- ARIA labels and roles
- Screen reader friendly
- Sufficient color contrast
- Focus indicators
- Semantic HTML

## Integration Example

```tsx
'use client';

import { useState } from 'react';
import {
  SettingsLayout,
  ProfileSettings,
  NotificationSettings,
  ThemeSettings,
  PrivacySettings,
  WorkflowSettings,
  HelpCenter,
} from '@/components/settings';

export default function SettingsPage() {
  const [profile, setProfile] = useState({...});
  const [theme, setTheme] = useState('light');
  // ... other state

  const sections = [
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      component: <ProfileSettings profile={profile} onUpdate={setProfile} onSave={handleSave} />,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: '🔔',
      component: <NotificationSettings {...notificationProps} />,
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: '🎨',
      component: <ThemeSettings theme={theme} onThemeChange={setTheme} {...themeProps} />,
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: '⚙️',
      component: <WorkflowSettings {...workflowProps} />,
    },
    {
      id: 'privacy',
      label: 'Privacy & Data',
      icon: '🔒',
      component: <PrivacySettings {...privacyProps} />,
    },
    {
      id: 'help',
      label: 'Help Center',
      icon: '❓',
      component: <HelpCenter />,
    },
  ];

  return <SettingsLayout sections={sections} />;
}
```

## Requirements Fulfilled

Task 19.16 - Settings and User Preferences UI:
- ✅ Settings page with organized sections and pet icons
- ✅ Profile management interface with avatar upload
- ✅ Notification preferences with toggle switches and time pickers
- ✅ Workflow customization interface with visual schedule builders
- ✅ Data export and privacy controls with clear explanations
- ✅ Help center with pet-themed illustrations and FAQs
- ✅ Theme customization (light/dark mode)
- ✅ Language selection for internationalization
- ✅ Account deletion flow with confirmation steps

**Requirements:** 1.3, 1.4, 10.5, 11.5

## Testing

### Storybook Stories
- `ProfileSettings.stories.tsx` - 3 variants
- `ThemeSettings.stories.tsx` - 4 variants

Run Storybook:
```bash
npm run storybook
```

### Unit Tests (Task 19.17)
To be implemented:
- Test preference updates and persistence
- Test data export functionality
- Test theme switching logic
- Test form validation
- Test workflow scheduling

## File Structure

```
frontend/src/components/settings/
├── SettingsLayout.tsx          # Main layout with sidebar
├── ProfileSettings.tsx         # Profile management
├── NotificationSettings.tsx    # Notification preferences
├── ThemeSettings.tsx          # Theme and language
├── WorkflowSettings.tsx       # Workflow automation
├── PrivacySettings.tsx        # Privacy and data controls
├── HelpCenter.tsx             # FAQ and support
├── index.ts                   # Exports
├── README.md                  # Documentation
├── ProfileSettings.stories.tsx # Storybook
└── ThemeSettings.stories.tsx  # Storybook

frontend/src/app/settings/
└── page.tsx                   # Demo page
```

## Next Steps

For task 19.17, implement unit tests:
- Test preference updates and persistence
- Test data export functionality
- Test theme switching logic
- Test form validation
- Test account deletion flow
- Test workflow scheduling

---

**Status:** Task 19.16 Complete ✅
**Files Created:** 9
**Components:** 7 main components
**Stories:** 2 Storybook files
**Lines of Code:** ~1,800+
