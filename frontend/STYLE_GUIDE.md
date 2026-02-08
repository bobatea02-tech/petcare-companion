# PawPal Style Guide

## Overview

This style guide defines the visual design system, coding standards, and best practices for the PawPal frontend application.

## Table of Contents

1. [Design Tokens](#design-tokens)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing](#spacing)
5. [Components](#components)
6. [Icons](#icons)
7. [Animations](#animations)
8. [Responsive Design](#responsive-design)
9. [Accessibility](#accessibility)
10. [Code Style](#code-style)

---

## Design Tokens

Design tokens are the visual design atoms of the design system.

```typescript
// lib/design-tokens.ts
export const tokens = {
  colors: {
    primary: {
      50: '#FFF5F0',
      100: '#FFE8DB',
      500: '#FF8C42', // Main orange
      600: '#FF7A2E',
      700: '#E66A26',
    },
    secondary: {
      50: '#F0F7FF',
      100: '#DBE9FF',
      500: '#4A90E2', // Playful blue
      600: '#3A7BC8',
      700: '#2A5F9E',
    },
    success: {
      50: '#F0FDF4',
      500: '#10B981', // Soft green
      600: '#059669',
    },
    warning: {
      50: '#FFFBEB',
      500: '#F59E0B',
      600: '#D97706',
    },
    error: {
      50: '#FEF2F2',
      500: '#EF4444',
      600: '#DC2626',
    },
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },
  
  fonts: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    display: ['Poppins', 'Inter', 'sans-serif'],
    mono: ['Fira Code', 'monospace'],
  },
  
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
}
```

---

## Color Palette

### Primary Colors

**Orange (#FF8C42)** - Main brand color
- Use for primary actions, highlights, and brand elements
- Represents warmth and friendliness

**Blue (#4A90E2)** - Secondary color
- Use for informational elements and secondary actions
- Represents trust and reliability

**Green (#10B981)** - Success color
- Use for positive feedback and success states
- Represents health and wellness

### Usage Guidelines

```tsx
// Primary button
<Button className="bg-primary-500 hover:bg-primary-600">
  Save Changes
</Button>

// Secondary button
<Button className="bg-secondary-500 hover:bg-secondary-600">
  Learn More
</Button>

// Success message
<div className="bg-success-50 text-success-600 border-success-500">
  Pet profile saved successfully!
</div>

// Error message
<div className="bg-error-50 text-error-600 border-error-500">
  Please fill in all required fields
</div>
```

### Pet-Themed Accents

- **Dog theme**: Warm oranges and browns
- **Cat theme**: Soft grays and blues
- **Bird theme**: Bright yellows and greens
- **Other pets**: Neutral tones with colorful accents

---

## Typography

### Font Families

**Inter** - Body text
- Clean, readable, modern
- Use for all body text and UI elements

**Poppins** - Headings
- Friendly, rounded, playful
- Use for headings and display text

### Font Scales

```tsx
// Headings
<h1 className="text-4xl font-bold font-display">Main Heading</h1>
<h2 className="text-3xl font-semibold font-display">Section Heading</h2>
<h3 className="text-2xl font-semibold font-display">Subsection</h3>
<h4 className="text-xl font-medium font-display">Card Title</h4>

// Body text
<p className="text-base">Regular paragraph text</p>
<p className="text-sm text-neutral-600">Secondary text</p>
<p className="text-xs text-neutral-500">Caption text</p>

// Special text
<span className="text-lg font-semibold">Emphasized text</span>
<code className="font-mono text-sm">Code snippet</code>
```

### Line Heights

```css
.text-tight { line-height: 1.25; }    /* Headings */
.text-normal { line-height: 1.5; }    /* Body text */
.text-relaxed { line-height: 1.75; }  /* Long-form content */
```

---

## Spacing

### Spacing Scale

Use consistent spacing throughout the application:

```tsx
// Padding
<div className="p-4">Standard padding (16px)</div>
<div className="p-6">Large padding (24px)</div>
<div className="px-4 py-2">Horizontal and vertical</div>

// Margin
<div className="mb-4">Bottom margin (16px)</div>
<div className="mt-6">Top margin (24px)</div>
<div className="mx-auto">Centered horizontally</div>

// Gap (for flex/grid)
<div className="flex gap-4">Items with 16px gap</div>
<div className="grid gap-6">Grid with 24px gap</div>
```

### Component Spacing

- **Cards**: `p-6` (24px padding)
- **Buttons**: `px-4 py-2` (16px horizontal, 8px vertical)
- **Form inputs**: `p-3` (12px padding)
- **Sections**: `mb-8` or `mb-12` (32px or 48px margin)

---

## Components

### Buttons

```tsx
// Primary button
<Button
  variant="primary"
  size="medium"
  className="bg-primary-500 hover:bg-primary-600 text-white"
>
  Primary Action
</Button>

// Secondary button
<Button
  variant="secondary"
  size="medium"
  className="bg-secondary-500 hover:bg-secondary-600 text-white"
>
  Secondary Action
</Button>

// Outline button
<Button
  variant="outline"
  size="medium"
  className="border-2 border-primary-500 text-primary-500 hover:bg-primary-50"
>
  Outline Button
</Button>

// Ghost button
<Button
  variant="ghost"
  size="medium"
  className="text-neutral-600 hover:bg-neutral-100"
>
  Ghost Button
</Button>
```

### Cards

```tsx
<Card className="bg-white rounded-xl shadow-md p-6">
  <h3 className="text-xl font-semibold mb-2">Card Title</h3>
  <p className="text-neutral-600">Card content goes here</p>
</Card>

// Pet-themed card
<Card className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-6">
  <PawIcon className="text-primary-500 mb-2" />
  <h3 className="text-xl font-semibold">Pet Card</h3>
</Card>
```

### Forms

```tsx
<form className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-neutral-700 mb-1">
      Email Address
    </label>
    <Input
      type="email"
      placeholder="you@example.com"
      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
    />
  </div>
  
  <Button type="submit" variant="primary" className="w-full">
    Submit
  </Button>
</form>
```

---

## Icons

### Icon Library

Use Lucide React for consistent icons:

```tsx
import { Heart, Pill, Calendar, Bell } from 'lucide-react'

<Heart className="w-5 h-5 text-error-500" />
<Pill className="w-5 h-5 text-primary-500" />
<Calendar className="w-5 h-5 text-secondary-500" />
<Bell className="w-5 h-5 text-warning-500" />
```

### Custom Pet Icons

```tsx
import { PawIcon, BoneIcon, FoodBowlIcon } from '@/components/icons'

<PawIcon className="w-6 h-6 text-primary-500" />
<BoneIcon className="w-6 h-6 text-secondary-500" />
<FoodBowlIcon className="w-6 h-6 text-success-500" />
```

### Icon Sizes

- **Small**: `w-4 h-4` (16px)
- **Medium**: `w-5 h-5` (20px)
- **Large**: `w-6 h-6` (24px)
- **Extra Large**: `w-8 h-8` (32px)

---

## Animations

### Transitions

```tsx
// Hover transitions
<button className="transition-colors duration-200 hover:bg-primary-600">
  Hover me
</button>

// Transform transitions
<div className="transition-transform duration-300 hover:scale-105">
  Scale on hover
</div>

// Opacity transitions
<div className="transition-opacity duration-200 hover:opacity-80">
  Fade on hover
</div>
```

### Framer Motion

```tsx
import { motion } from 'framer-motion'

// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// Slide in
<motion.div
  initial={{ x: -20, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// Scale in
<motion.div
  initial={{ scale: 0.9, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.2 }}
>
  Content
</motion.div>
```

### Loading States

```tsx
// Spinner
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />

// Pulse
<div className="animate-pulse bg-neutral-200 rounded h-4 w-full" />

// Bounce
<div className="animate-bounce">
  <PawIcon className="w-6 h-6" />
</div>
```

---

## Responsive Design

### Breakpoints

```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
}
```

### Responsive Classes

```tsx
// Mobile-first approach
<div className="
  w-full          // Mobile: full width
  md:w-1/2        // Tablet: half width
  lg:w-1/3        // Desktop: third width
">
  Responsive content
</div>

// Responsive text
<h1 className="
  text-2xl        // Mobile: 24px
  md:text-3xl     // Tablet: 30px
  lg:text-4xl     // Desktop: 36px
">
  Responsive heading
</h1>

// Responsive padding
<div className="
  p-4             // Mobile: 16px
  md:p-6          // Tablet: 24px
  lg:p-8          // Desktop: 32px
">
  Responsive padding
</div>
```

### Grid Layouts

```tsx
// Responsive grid
<div className="
  grid
  grid-cols-1      // Mobile: 1 column
  md:grid-cols-2   // Tablet: 2 columns
  lg:grid-cols-3   // Desktop: 3 columns
  gap-4
">
  {items.map(item => <Card key={item.id} />)}
</div>
```

---

## Accessibility

### Color Contrast

Ensure WCAG AA compliance:
- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio
- UI components: 3:1 contrast ratio

### Focus States

```tsx
// Visible focus indicators
<button className="
  focus:outline-none
  focus:ring-2
  focus:ring-primary-500
  focus:ring-offset-2
">
  Accessible button
</button>
```

### ARIA Labels

```tsx
// Button with icon
<button aria-label="Close dialog">
  <X className="w-5 h-5" />
</button>

// Loading state
<button aria-busy="true" aria-label="Loading...">
  <Spinner />
</button>

// Disabled state
<button disabled aria-disabled="true">
  Disabled
</button>
```

### Semantic HTML

```tsx
// Use semantic elements
<nav>Navigation</nav>
<main>Main content</main>
<aside>Sidebar</aside>
<footer>Footer</footer>

// Use headings hierarchically
<h1>Page title</h1>
<h2>Section title</h2>
<h3>Subsection title</h3>
```

---

## Code Style

### Component Structure

```tsx
// Component template
import React from 'react'
import { ComponentProps } from '@/types'

interface MyComponentProps {
  title: string
  description?: string
  onAction?: () => void
}

export function MyComponent({
  title,
  description,
  onAction,
}: MyComponentProps) {
  return (
    <div className="component-wrapper">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {onAction && (
        <button onClick={onAction}>
          Action
        </button>
      )}
    </div>
  )
}
```

### Naming Conventions

- **Components**: PascalCase (`PetCard`, `MedicationCard`)
- **Files**: PascalCase for components (`PetCard.tsx`)
- **Functions**: camelCase (`handleSubmit`, `fetchPets`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`, `MAX_FILE_SIZE`)
- **CSS classes**: kebab-case (`pet-card`, `medication-list`)

### Import Order

```tsx
// 1. React and Next.js
import React from 'react'
import { useRouter } from 'next/router'

// 2. External libraries
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

// 3. Internal components
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// 4. Hooks and utilities
import { usePetStore } from '@/lib/stores/pet-store'
import { cn } from '@/lib/utils'

// 5. Types
import { Pet } from '@/types/pets'

// 6. Styles (if any)
import styles from './Component.module.css'
```

### TypeScript Best Practices

```typescript
// Use interfaces for props
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  onClick?: () => void
}

// Use type for unions
type Status = 'idle' | 'loading' | 'success' | 'error'

// Use generics for reusable components
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
}
```

---

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Design System](./DESIGN_SYSTEM.md)
