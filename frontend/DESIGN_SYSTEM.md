# PawPal Design System

## Overview

The PawPal design system is built around a pet-friendly, warm, and accessible aesthetic. It combines playful elements with professional functionality to create an engaging yet trustworthy experience for pet owners.

## Design Principles

1. **Warm & Welcoming**: Use warm colors (oranges, soft blues) to create a friendly atmosphere
2. **Playful Yet Professional**: Balance fun pet-themed elements with serious health management
3. **Accessible First**: Ensure all components meet WCAG 2.1 AA standards
4. **Mobile-First**: Design for mobile devices first, then scale up
5. **Consistent**: Maintain visual consistency across all components

## Color System

### Primary Colors

**Warm Orange** - Main brand color
- 50: `#fff7ed` - Lightest tint
- 500: `#f97316` - Primary
- 900: `#7c2d12` - Darkest shade

Usage: Primary buttons, links, important UI elements

### Secondary Colors

**Playful Blue** - Supporting color
- 50: `#eff6ff` - Lightest tint
- 500: `#3b82f6` - Secondary
- 900: `#1e3a8a` - Darkest shade

Usage: Secondary buttons, informational elements

### Accent Colors

**Soft Green** - Success and positive feedback
- 50: `#f0fdf4` - Lightest tint
- 500: `#22c55e` - Accent
- 900: `#14532d` - Darkest shade

Usage: Success messages, positive indicators

### Triage Colors

Special colors for health urgency levels:
- **Green** (`#22c55e`): Low urgency, monitoring recommended
- **Yellow** (`#eab308`): Medium urgency, schedule appointment
- **Red** (`#ef4444`): High urgency, emergency care needed

## Typography

### Font Families

- **Sans Serif (Inter)**: Body text, UI elements, forms
- **Display (Poppins)**: Headings, emphasis, hero text

### Font Sizes

- xs: `0.75rem` (12px)
- sm: `0.875rem` (14px)
- base: `1rem` (16px)
- lg: `1.125rem` (18px)
- xl: `1.25rem` (20px)
- 2xl: `1.5rem` (24px)
- 3xl: `1.875rem` (30px)
- 4xl: `2.25rem` (36px)
- 5xl: `3rem` (48px)

### Font Weights

- Normal: 400
- Medium: 500
- Semibold: 600
- Bold: 700

## Spacing

Consistent spacing scale based on 0.25rem (4px) increments:

- xs: `0.25rem` (4px)
- sm: `0.5rem` (8px)
- md: `1rem` (16px)
- lg: `1.5rem` (24px)
- xl: `2rem` (32px)
- 2xl: `3rem` (48px)
- 3xl: `4rem` (64px)

## Border Radius

- sm: `0.375rem` (6px)
- md: `0.5rem` (8px)
- lg: `0.75rem` (12px)
- xl: `1rem` (16px)
- 2xl: `1.5rem` (24px)
- full: `9999px` (pill shape)

## Shadows

- sm: Subtle shadow for slight elevation
- md: Standard shadow for cards
- lg: Prominent shadow for modals
- xl: Maximum shadow for floating elements

## Animations

### Duration

- Fast: `150ms` - Micro-interactions
- Normal: `300ms` - Standard transitions
- Slow: `500ms` - Complex animations

### Easing

- Ease In: `cubic-bezier(0.4, 0, 1, 1)`
- Ease Out: `cubic-bezier(0, 0, 0.2, 1)`
- Ease In Out: `cubic-bezier(0.4, 0, 0.2, 1)`

### Custom Animations

**Paw Bounce**
```css
@keyframes paw-bounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}
```

**Tail Wag**
```css
@keyframes tail-wag {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}
```

**Float**
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
```

## Component Patterns

### Buttons

- Use `pet-button` class for consistent styling
- Include hover scale effect (1.05x)
- Include active scale effect (0.95x)
- Support loading states with spinner
- Support disabled states with reduced opacity

### Inputs

- Use `pet-input` class for consistent styling
- Include focus ring with primary color
- Support error states with red border
- Include helper text below input
- Support disabled states

### Cards

- Use `pet-card` class for consistent styling
- Include hover shadow effect
- Use rounded corners (2xl)
- Include padding (6 units)

## Icons

### Custom Pet Icons

- **PawIcon**: Paw print for general pet-related actions
- **BoneIcon**: Bone for treats, rewards, achievements

### Icon Sizes

- Small: 16px
- Medium: 24px (default)
- Large: 32px
- XLarge: 48px

### Icon Usage

- Use consistent sizing within components
- Apply color through `currentColor` for flexibility
- Add hover effects for interactive icons
- Ensure sufficient contrast for accessibility

## Accessibility Guidelines

### Color Contrast

- Text on background: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- UI components: Minimum 3:1 ratio

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Visible focus indicators required
- Logical tab order maintained
- Skip links for main content

### Screen Readers

- Semantic HTML structure
- ARIA labels for icon-only buttons
- ARIA live regions for dynamic content
- Alt text for all images

### Motion

- Respect `prefers-reduced-motion` setting
- Provide alternatives to motion-based feedback
- Keep animations subtle and purposeful

## Responsive Design

### Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile-First Approach

1. Design for mobile screens first
2. Add complexity for larger screens
3. Use responsive utilities (sm:, md:, lg:)
4. Test on real devices

## Usage Examples

### Button Variants

```tsx
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="outline">Outline Button</Button>
<Button variant="ghost">Ghost Button</Button>
```

### Triage Indicators

```tsx
<div className="triage-green">Low Urgency</div>
<div className="triage-yellow">Medium Urgency</div>
<div className="triage-red">Emergency</div>
```

### Pet-Themed Cards

```tsx
<Card className="border-2 border-primary-200">
  <CardHeader>
    <PawIcon className="text-primary-500" />
    <CardTitle>Pet Profile</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

## Best Practices

1. **Consistency**: Use design tokens instead of hardcoded values
2. **Accessibility**: Test with keyboard and screen readers
3. **Performance**: Optimize images and animations
4. **Documentation**: Document component usage in Storybook
5. **Testing**: Write tests for component behavior
6. **Responsiveness**: Test on multiple screen sizes
7. **Pet Theme**: Maintain playful yet professional balance
