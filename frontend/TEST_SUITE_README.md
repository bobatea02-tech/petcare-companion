# Test Suite Documentation

## Overview

This document describes the comprehensive test suite for the PawPal frontend application, including unit tests, integration tests, accessibility tests, and performance tests.

## Test Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── __tests__/
│   │   │   │   ├── LoginForm.test.tsx
│   │   │   │   └── RegisterForm.test.tsx
│   │   ├── care/
│   │   │   └── __tests__/
│   │   │       └── MedicationCard.test.tsx
│   │   ├── chat/
│   │   │   └── __tests__/
│   │   │       └── VoiceRecorder.test.tsx
│   │   ├── notifications/
│   │   │   └── __tests__/
│   │   │       └── Toast.test.tsx
│   │   ├── pets/
│   │   │   └── __tests__/
│   │   │       └── PetCard.test.tsx
│   │   └── ui/
│   │       └── __tests__/
│   │           └── Button.test.tsx
│   ├── lib/
│   │   └── __tests__/
│   │       └── api-client.test.ts
│   └── __tests__/
│       ├── accessibility.test.tsx
│       └── performance.test.tsx
├── jest.config.js
├── jest.setup.js
└── TESTING_GUIDE.md
```

## Test Categories

### 1. Unit Tests

**Location**: `src/components/**/__tests__/*.test.tsx`

**Purpose**: Test individual components in isolation

**Coverage**:
- Authentication components (LoginForm, RegisterForm)
- UI components (Button, Card, Input, Modal)
- Pet management components (PetCard, PetProfileForm)
- Care tracking components (MedicationCard, FeedingScheduleCard)
- Chat components (VoiceRecorder, ChatInterface)
- Notification components (Toast, NotificationCenter)

**Example**:
```typescript
// src/components/ui/__tests__/Button.test.tsx
describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### 2. Integration Tests

**Location**: `src/lib/__tests__/api-client.test.ts`

**Purpose**: Test API integration and state management

**Coverage**:
- API client configuration
- Authentication flow
- Token refresh mechanism
- Error handling
- Request caching
- Request deduplication
- Retry logic

**Example**:
```typescript
// src/lib/__tests__/api-client.test.ts
describe('API Client', () => {
  it('includes auth token in requests', async () => {
    localStorage.setItem('auth_token', 'test-token')
    await apiClient.get('/test')
    expect(headers.Authorization).toBe('Bearer test-token')
  })
})
```

### 3. Accessibility Tests

**Location**: `src/__tests__/accessibility.test.tsx`

**Purpose**: Ensure WCAG 2.1 AA compliance

**Coverage**:
- No accessibility violations (using jest-axe)
- Keyboard navigation support
- ARIA attributes
- Color contrast
- Screen reader support
- Focus management

**Example**:
```typescript
// src/__tests__/accessibility.test.tsx
it('should have no accessibility violations', async () => {
  const { container } = render(<LoginForm />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### 4. Performance Tests

**Location**: `src/__tests__/performance.test.tsx`

**Purpose**: Validate rendering performance

**Coverage**:
- Component render time
- List rendering performance
- Memory usage
- Bundle size optimization

**Example**:
```typescript
// src/__tests__/performance.test.tsx
it('renders within acceptable time', () => {
  const startTime = performance.now()
  render(<PetCard pet={mockPet} />)
  const renderTime = performance.now() - startTime
  expect(renderTime).toBeLessThan(100)
})
```

## Running Tests

### All Tests

```bash
# Run all tests in watch mode
npm test

# Run all tests once (CI mode)
npm run test:ci

# Run with coverage report
npm test -- --coverage
```

### Specific Test Suites

```bash
# Run unit tests only
npm test -- --testPathPattern="components"

# Run integration tests only
npm test -- --testPathPattern="lib"

# Run accessibility tests only
npm test -- --testPathPattern="accessibility"

# Run performance tests only
npm test -- --testPathPattern="performance"
```

### Specific Test Files

```bash
# Run specific test file
npm test -- LoginForm.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="renders correctly"
```

### Watch Mode Options

```bash
# Run tests related to changed files
npm test -- --watch

# Run all tests on every change
npm test -- --watchAll

# Run tests for specific file
npm test -- --watch LoginForm.test.tsx
```

## Test Coverage

### Current Coverage

Run coverage report:
```bash
npm test -- --coverage
```

### Coverage Targets

- **Line Coverage**: 80%+
- **Branch Coverage**: 75%+
- **Function Coverage**: 80%+
- **Statement Coverage**: 80%+

### Coverage Reports

Coverage reports are generated in:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format
- `coverage/coverage-final.json` - JSON format

View HTML report:
```bash
open coverage/lcov-report/index.html
```

## Test Configuration

### Jest Configuration

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

### Jest Setup

```javascript
// jest.setup.js
import '@testing-library/jest-dom'
```

## Mocking Strategies

### API Mocking

```typescript
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))
```

### Router Mocking

```typescript
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
  }),
}))
```

### LocalStorage Mocking

```typescript
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

global.localStorage = localStorageMock as any
```

### MediaRecorder Mocking

```typescript
global.MediaRecorder = jest.fn().mockImplementation(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  state: 'inactive',
})) as any
```

## Best Practices

### 1. Test Naming

Use descriptive test names:
```typescript
// ❌ Bad
it('works', () => {})

// ✅ Good
it('displays error message when email is invalid', () => {})
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('updates pet name', () => {
  // Arrange
  const pet = { id: '1', name: 'Max' }
  
  // Act
  render(<PetCard pet={pet} />)
  
  // Assert
  expect(screen.getByText('Max')).toBeInTheDocument()
})
```

### 3. Test User Behavior

```typescript
// ❌ Bad - Testing implementation
expect(component.state.isOpen).toBe(true)

// ✅ Good - Testing behavior
expect(screen.getByRole('dialog')).toBeVisible()
```

### 4. Use Semantic Queries

```typescript
// Preferred order:
screen.getByRole('button')
screen.getByLabelText('Email')
screen.getByPlaceholderText('Enter email')
screen.getByText('Submit')
screen.getByTestId('submit-button') // Last resort
```

### 5. Clean Up

```typescript
afterEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
})
```

### 6. Async Testing

```typescript
it('loads data', async () => {
  render(<DataComponent />)
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  })
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
screen.logTestingPlaygroundURL()
```

### Run Single Test

```bash
npm test -- --testNamePattern="specific test name"
```

### Verbose Output

```bash
npm test -- --verbose
```

## Continuous Integration

### GitHub Actions

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Manual workflow dispatch

### Coverage Reports

Coverage reports are:
- Generated on every CI run
- Uploaded to Codecov
- Displayed in pull requests

### Quality Gates

Pull requests must:
- Pass all tests
- Maintain 80%+ coverage
- Have no accessibility violations
- Pass linting checks

## Troubleshooting

### Common Issues

#### Tests Timing Out

```typescript
// Increase timeout for specific test
it('slow test', async () => {
  // test code
}, 10000) // 10 second timeout
```

#### Mock Not Working

```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})
```

#### Async Issues

```typescript
// Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

#### Memory Leaks

```typescript
// Clean up after tests
afterEach(() => {
  cleanup()
})
```

## Resources

- [Testing Guide](./TESTING_GUIDE.md)
- [Component Documentation](./COMPONENT_DOCUMENTATION.md)
- [React Testing Library Docs](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [jest-axe Documentation](https://github.com/nickcolley/jest-axe)

## Maintenance

### Adding New Tests

1. Create test file in `__tests__` directory
2. Follow naming convention: `ComponentName.test.tsx`
3. Import necessary testing utilities
4. Write descriptive test cases
5. Run tests to verify
6. Update coverage report

### Updating Tests

1. Identify failing tests
2. Update test expectations
3. Verify component behavior
4. Run full test suite
5. Update documentation if needed

### Removing Tests

1. Verify test is no longer needed
2. Remove test file
3. Update coverage targets
4. Run full test suite
5. Update documentation

## Contact

For questions or issues with the test suite:
- Create an issue in the repository
- Contact the development team
- Refer to the testing guide
