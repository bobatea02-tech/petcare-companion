# Testing Guide

## Overview

This guide covers testing practices for the PawPal frontend application. We use Jest and React Testing Library for unit and integration tests, with additional tools for accessibility and performance testing.

## Table of Contents

1. [Testing Stack](#testing-stack)
2. [Running Tests](#running-tests)
3. [Writing Unit Tests](#writing-unit-tests)
4. [Integration Tests](#integration-tests)
5. [Accessibility Tests](#accessibility-tests)
6. [Performance Tests](#performance-tests)
7. [Best Practices](#best-practices)

## Testing Stack

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **jest-axe**: Accessibility testing
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Custom Jest matchers

## Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:ci

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- LoginForm.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="renders correctly"
```

## Writing Unit Tests

### Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Testing User Interactions

```typescript
import userEvent from '@testing-library/user-event'

it('validates form input', async () => {
  const user = userEvent.setup()
  render(<LoginForm />)
  
  await user.type(screen.getByLabelText(/email/i), 'test@example.com')
  await user.type(screen.getByLabelText(/password/i), 'password123')
  await user.click(screen.getByRole('button', { name: /sign in/i }))
  
  // Assert expected behavior
})
```

### Mocking API Calls

```typescript
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}))

it('submits form data', async () => {
  const { apiClient } = require('@/lib/api-client')
  apiClient.post.mockResolvedValue({ data: { success: true } })
  
  // Test component that uses API
})
```

## Integration Tests

### Testing API Integration

```typescript
import { apiClient } from '@/lib/api-client'

describe('API Client', () => {
  it('includes auth token in requests', async () => {
    localStorage.setItem('auth_token', 'test-token')
    
    await apiClient.get('/protected')
    
    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    )
  })
})
```

### Testing State Management

```typescript
import { useAuthStore } from '@/lib/stores/auth-store'

describe('Auth Store', () => {
  it('updates user state on login', () => {
    const { login } = useAuthStore.getState()
    
    login({ id: '1', email: 'test@example.com' })
    
    expect(useAuthStore.getState().user).toEqual({
      id: '1',
      email: 'test@example.com',
    })
  })
})
```

## Accessibility Tests

### Using jest-axe

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

it('should have no accessibility violations', async () => {
  const { container } = render(<LoginForm />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### Testing Keyboard Navigation

```typescript
it('supports keyboard navigation', () => {
  render(<Button>Keyboard Test</Button>)
  const button = screen.getByRole('button')
  
  button.focus()
  expect(button).toHaveFocus()
  
  fireEvent.keyDown(button, { key: 'Enter' })
  // Assert expected behavior
})
```

### Testing ARIA Attributes

```typescript
it('has proper ARIA attributes', () => {
  render(<Button loading>Loading</Button>)
  const button = screen.getByRole('button')
  
  expect(button).toHaveAttribute('aria-busy', 'true')
  expect(button).toHaveAttribute('aria-label')
})
```

## Performance Tests

### Measuring Render Time

```typescript
it('renders within acceptable time', () => {
  const startTime = performance.now()
  
  render(<ComplexComponent />)
  
  const endTime = performance.now()
  const renderTime = endTime - startTime
  
  expect(renderTime).toBeLessThan(100) // 100ms threshold
})
```

### Testing List Performance

```typescript
it('renders large lists efficiently', () => {
  const items = Array.from({ length: 100 }, (_, i) => ({ id: i }))
  
  const startTime = performance.now()
  render(<List items={items} />)
  const renderTime = performance.now() - startTime
  
  expect(renderTime).toBeLessThan(1000)
})
```

## Best Practices

### 1. Test User Behavior, Not Implementation

❌ **Bad**: Testing internal state
```typescript
expect(component.state.isOpen).toBe(true)
```

✅ **Good**: Testing visible behavior
```typescript
expect(screen.getByRole('dialog')).toBeVisible()
```

### 2. Use Semantic Queries

Prefer queries in this order:
1. `getByRole` - Most accessible
2. `getByLabelText` - Form elements
3. `getByPlaceholderText` - Inputs
4. `getByText` - Non-interactive elements
5. `getByTestId` - Last resort

### 3. Avoid Testing Implementation Details

❌ **Bad**: Testing class names
```typescript
expect(container.querySelector('.btn-primary')).toBeInTheDocument()
```

✅ **Good**: Testing behavior
```typescript
expect(screen.getByRole('button')).toHaveClass('btn-primary')
```

### 4. Clean Up After Tests

```typescript
afterEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
})
```

### 5. Use Descriptive Test Names

❌ **Bad**: `it('works', () => {})`

✅ **Good**: `it('displays error message when email is invalid', () => {})`

### 6. Test Edge Cases

- Empty states
- Loading states
- Error states
- Boundary values
- Disabled states

### 7. Keep Tests Isolated

Each test should be independent and not rely on other tests.

```typescript
beforeEach(() => {
  // Reset state before each test
})
```

### 8. Mock External Dependencies

```typescript
jest.mock('@/lib/api-client')
jest.mock('next/router')
```

### 9. Test Accessibility

Always include accessibility tests for interactive components.

### 10. Maintain Test Coverage

Aim for:
- 80%+ line coverage
- 100% coverage for critical paths
- All user-facing features tested

## Common Patterns

### Testing Forms

```typescript
it('validates and submits form', async () => {
  const user = userEvent.setup()
  const onSubmit = jest.fn()
  
  render(<Form onSubmit={onSubmit} />)
  
  await user.type(screen.getByLabelText(/email/i), 'test@example.com')
  await user.click(screen.getByRole('button', { name: /submit/i }))
  
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
    })
  })
})
```

### Testing Async Operations

```typescript
it('loads data on mount', async () => {
  render(<DataComponent />)
  
  expect(screen.getByText(/loading/i)).toBeInTheDocument()
  
  await waitFor(() => {
    expect(screen.getByText(/data loaded/i)).toBeInTheDocument()
  })
})
```

### Testing Error Boundaries

```typescript
it('catches and displays errors', () => {
  const ThrowError = () => {
    throw new Error('Test error')
  }
  
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  )
  
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
})
```

## Debugging Tests

### View Rendered Output

```typescript
import { screen } from '@testing-library/react'

screen.debug() // Prints entire DOM
screen.debug(screen.getByRole('button')) // Prints specific element
```

### Use Testing Playground

```typescript
import { screen } from '@testing-library/react'

screen.logTestingPlaygroundURL()
```

### Check Available Queries

```typescript
screen.getByRole('') // Shows available roles in error message
```

## Resources

- [React Testing Library Docs](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
