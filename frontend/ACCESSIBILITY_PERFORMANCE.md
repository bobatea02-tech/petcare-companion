# Accessibility and Performance Guide

## Overview

This document outlines the accessibility and performance optimizations implemented in the PawPal frontend application to ensure WCAG 2.1 AA compliance and optimal user experience.

## Accessibility Features

### WCAG 2.1 AA Compliance

#### Keyboard Navigation
- **Focus Indicators**: All interactive elements have visible focus indicators with 2px ring offset
- **Skip Links**: Skip to main content link for bypassing navigation
- **Focus Trap**: Modal and dialog components trap focus within their boundaries
- **Keyboard Shortcuts**: Arrow keys, Enter, Escape, and Tab navigation support

#### Screen Reader Support
- **ARIA Attributes**: Proper use of `aria-label`, `aria-describedby`, `aria-live`, `aria-modal`
- **Semantic HTML**: Use of `<main>`, `<nav>`, `<header>`, `<footer>`, `<article>`, `<section>`
- **Screen Reader Only Content**: `.sr-only` class for visually hidden but accessible content
- **Live Regions**: Dynamic content updates announced to screen readers

#### Form Accessibility
- **Labels**: All form inputs have associated labels with `htmlFor` attribute
- **Error Messages**: Error messages linked with `aria-describedby` and `role="alert"`
- **Required Fields**: Visual and programmatic indication of required fields
- **Helper Text**: Descriptive helper text linked to inputs

#### Color and Contrast
- **Contrast Ratios**: All text meets WCAG AA contrast requirements (4.5:1 for normal text)
- **Color Independence**: Information not conveyed by color alone
- **High Contrast Mode**: Support for `prefers-contrast: high` media query

#### Motion and Animation
- **Reduced Motion**: Respects `prefers-reduced-motion` media query
- **Animation Duration**: Animations disabled or reduced for users who prefer reduced motion
- **useReducedMotion Hook**: Custom hook for detecting motion preferences

### Accessibility Utilities

#### `accessibility.ts`
- `generateId()`: Generate unique IDs for ARIA attributes
- `announceToScreenReader()`: Announce messages to screen readers
- `trapFocus()`: Trap focus within a container
- `getAccessibleLabel()`: Get accessible label attributes
- `formatDateForScreenReader()`: Format dates for screen readers
- `getContrastRatio()`: Check color contrast ratios

### Accessible Components

#### Button
- Loading states with `aria-busy` and `aria-live`
- Disabled state properly communicated
- Loading text for screen readers

#### Input
- Automatic ID generation
- Error messages with `role="alert"`
- Helper text linked with `aria-describedby`
- Required field indication

#### Modal
- Focus trap implementation
- Escape key to close
- Overlay click to close
- Proper ARIA attributes (`role="dialog"`, `aria-modal`, `aria-labelledby`)

#### Tooltip
- Uses `aria-describedby` for screen reader support
- Keyboard accessible (shows on focus)
- Configurable delay

#### Skeleton
- Loading states with `role="status"`
- Screen reader announcements

## Performance Optimizations

### Image Optimization

#### Next.js Image Component
- Automatic format selection (AVIF, WebP)
- Responsive images with `srcset`
- Lazy loading by default
- Blur placeholder support

#### OptimizedImage Component
- Network-aware quality adjustment
- Fallback images
- Loading skeletons
- Error handling

#### Image Configuration
```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60,
}
```

### Code Splitting and Lazy Loading

#### Dynamic Imports
- Route-based code splitting with Next.js
- Component lazy loading with `React.lazy()`
- Dynamic imports for heavy libraries

#### Package Optimization
```javascript
experimental: {
  optimizePackageImports: ['lucide-react', 'date-fns', 'framer-motion'],
}
```

### Bundle Optimization

#### Compiler Optimizations
- Remove console logs in production (except errors and warnings)
- Tree shaking for unused code
- Minification and compression

#### Caching Strategy
- Static assets cached for 1 year
- Image caching with CDN
- Service worker for offline support

### Performance Monitoring

#### Web Vitals
- **CLS** (Cumulative Layout Shift): < 0.1
- **FID** (First Input Delay): < 100ms
- **FCP** (First Contentful Paint): < 1.8s
- **LCP** (Largest Contentful Paint): < 2.5s
- **TTFB** (Time to First Byte): < 600ms
- **INP** (Interaction to Next Paint): < 200ms

#### Performance Utilities

##### `performance.ts`
- `reportWebVitals()`: Report metrics to analytics
- `lazyLoadImage()`: Lazy load images with Intersection Observer
- `debounce()`: Debounce function calls
- `throttle()`: Throttle function calls
- `measureRenderTime()`: Measure component render time
- `preloadResource()`: Preload critical resources
- `prefetchPage()`: Prefetch next page resources
- `prefersReducedMotion()`: Check motion preferences
- `getDeviceMemory()`: Get device memory
- `getNetworkInfo()`: Get network information
- `getOptimalImageQuality()`: Optimize image quality based on network

#### PerformanceMonitor Component
- Tracks Web Vitals automatically
- Reports to analytics in production
- Logs to console in development
- Monitors long tasks (> 50ms)

### Loading States

#### Skeleton Components
- `Skeleton`: Base skeleton component
- `PetCardSkeleton`: Pet card loading state
- `MedicationCardSkeleton`: Medication card loading state
- `AppointmentCardSkeleton`: Appointment card loading state
- `ListSkeleton`: List loading state

#### Progressive Enhancement
- Content loads progressively
- Skeleton screens for perceived performance
- Optimistic UI updates

### Network Optimization

#### Headers
- DNS prefetch control
- Security headers (X-Frame-Options, X-Content-Type-Options)
- Referrer policy
- Cache control for static assets

#### Resource Hints
- Preload critical resources
- Prefetch next page resources
- DNS prefetch for external domains

## Best Practices

### Accessibility Checklist
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and meet contrast requirements
- [ ] All images have descriptive alt text
- [ ] Form inputs have associated labels
- [ ] Error messages are announced to screen readers
- [ ] Color is not the only means of conveying information
- [ ] Text meets minimum contrast ratios (4.5:1)
- [ ] Animations respect reduced motion preferences
- [ ] Semantic HTML is used throughout
- [ ] ARIA attributes are used correctly

### Performance Checklist
- [ ] Images are optimized and lazy loaded
- [ ] Code is split by route
- [ ] Heavy libraries are dynamically imported
- [ ] Bundle size is monitored and optimized
- [ ] Web Vitals are tracked and meet targets
- [ ] Caching strategies are implemented
- [ ] Loading states are shown for async operations
- [ ] Network conditions are considered for resource loading
- [ ] Service worker is configured for offline support
- [ ] Performance budgets are defined and enforced

## Testing

### Accessibility Testing
- **Automated**: Use axe-core or similar tools
- **Manual**: Test with keyboard navigation
- **Screen Readers**: Test with NVDA, JAWS, VoiceOver
- **Browser Extensions**: Use Lighthouse, WAVE, axe DevTools

### Performance Testing
- **Lighthouse**: Run Lighthouse audits regularly
- **WebPageTest**: Test on real devices and networks
- **Chrome DevTools**: Use Performance and Network panels
- **Real User Monitoring**: Track Web Vitals in production

## Resources

### Accessibility
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/)

### Performance
- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
