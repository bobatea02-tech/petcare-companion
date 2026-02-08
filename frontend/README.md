# PawPal Frontend

Pet-themed, accessible web application for comprehensive pet care management.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library with pet-themed design
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + React Testing Library
- **Documentation**: Storybook

## Design System

### Color Palette

- **Primary (Warm Orange)**: `#f97316` - Main brand color, used for primary actions
- **Secondary (Playful Blue)**: `#3b82f6` - Supporting color for secondary elements
- **Accent (Soft Green)**: `#22c55e` - Success states and positive feedback
- **Triage Colors**:
  - Green: `#22c55e` - Low urgency
  - Yellow: `#eab308` - Medium urgency
  - Red: `#ef4444` - High urgency/emergency

### Typography

- **Sans Serif**: Inter - Body text and UI elements
- **Display**: Poppins - Headings and emphasis

### Custom Animations

- `paw-bounce`: Playful bouncing animation for paw icons
- `tail-wag`: Wagging animation for interactive elements
- `float`: Gentle floating animation for mascots

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Storybook

View and develop components in isolation:

```bash
npm run storybook
```

Open [http://localhost:6006](http://localhost:6006) in your browser.

### Testing

```bash
# Run tests in watch mode
npm test

# Run tests once (CI)
npm run test:ci
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── ui/          # Base UI components (Button, Input, Card)
│   │   └── icons/       # Custom pet-themed icons
│   ├── lib/             # Utility functions and design tokens
│   ├── styles/          # Global styles and Tailwind config
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
└── .storybook/          # Storybook configuration
```

## Component Library

### Base Components

- **Button**: Pet-themed button with variants (primary, secondary, accent, outline, ghost)
- **Input**: Form input with label, error, and helper text support
- **Card**: Container component with header, title, and content sections

### Icons

- **PawIcon**: Custom paw print icon
- **BoneIcon**: Custom bone icon

All components are documented in Storybook with interactive examples.

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly labels
- Sufficient color contrast
- Focus indicators

## Performance

- Code splitting and lazy loading
- Optimized images (WebP, AVIF)
- Tree shaking for minimal bundle size
- Server-side rendering with Next.js

## Contributing

1. Create components in `src/components/`
2. Add Storybook stories for documentation
3. Write tests for component behavior
4. Follow the pet-themed design system
5. Ensure accessibility compliance
