# API Integration and State Management

This document describes the API integration and state management implementation for PawPal frontend.

## Overview

The frontend uses a comprehensive API integration system with the following features:

- **Enhanced API Client** with retry logic, caching, and request deduplication
- **Authentication Token Management** with automatic refresh
- **Global State Management** using Zustand
- **Optimistic UI Updates** for better perceived performance
- **Error Boundary Components** for graceful error handling
- **Loading States and Skeleton Screens** for async operations
- **Request Caching and Deduplication** to reduce network calls
- **Offline Support** with service workers (PWA)
- **Retry Logic** for failed API requests

## API Client

### Basic Usage

```typescript
import { apiRequest } from '@/lib/api-client'

// Simple GET request with caching
const data = await apiRequest({
  method: 'GET',
  url: '/care/pets',
})

// POST request without caching
const newPet = await apiRequest(
  {
    method: 'POST',
    url: '/care/pets',
    data: petData,
  },
  { cache: false }
)

// Request with custom retry settings
const data = await apiRequest(
  {
    method: 'GET',
    url: '/api/data',
  },
  { retry: true, maxRetries: 5 }
)
```

### Features

#### Automatic Token Refresh

The API client automatically handles token refresh when receiving 401 responses:

```typescript
// Token refresh happens automatically
// No manual intervention needed
const response = await apiRequest({
  method: 'GET',
  url: '/protected-endpoint',
})
```

#### Request Caching

GET requests are automatically cached for 5 minutes:

```typescript
// First call - hits the API
const data1 = await apiRequest({ method: 'GET', url: '/care/pets' })

// Second call within 5 minutes - returns cached data
const data2 = await apiRequest({ method: 'GET', url: '/care/pets' })

// Clear cache manually
import { clearCache } from '@/lib/api-client'
clearCache('/care/pets') // Clear specific pattern
clearCache() // Clear all cache
```

#### Request Deduplication

Multiple identical requests are automatically deduplicated:

```typescript
// Both calls will share the same request
const [data1, data2] = await Promise.all([
  apiRequest({ method: 'GET', url: '/care/pets' }),
  apiRequest({ method: 'GET', url: '/care/pets' }),
])
```

#### Retry Logic

Failed requests are automatically retried with exponential backoff:

```typescript
import { retryRequest } from '@/lib/api-client'

const data = await retryRequest(
  () => apiRequest({ method: 'GET', url: '/api/data' }),
  3, // max retries
  1000 // base delay in ms
)
```

## State Management

### Authentication Store

```typescript
import { useAuthStore } from '@/lib/stores/auth-store'

function LoginComponent() {
  const { login, isLoading, error, user } = useAuthStore()

  const handleLogin = async () => {
    try {
      await login(email, password)
      // User is now authenticated
    } catch (error) {
      // Handle error
    }
  }

  return (
    <div>
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {user && <p>Welcome, {user.first_name}!</p>}
    </div>
  )
}
```

### Pet Store

```typescript
import { usePetStore } from '@/lib/stores/pet-store'

function PetList() {
  const { pets, fetchPets, createPet, isLoading } = usePetStore()

  useEffect(() => {
    fetchPets()
  }, [])

  const handleCreatePet = async (data) => {
    try {
      const newPet = await createPet(data)
      // Pet list is automatically updated
    } catch (error) {
      // Handle error
    }
  }

  return (
    <div>
      {isLoading ? (
        <ListSkeleton count={3} />
      ) : (
        pets.map((pet) => <PetCard key={pet.id} pet={pet} />)
      )}
    </div>
  )
}
```

### UI Store

```typescript
import { useUIStore } from '@/lib/stores/ui-store'

function App() {
  const { isOnline, addToast, setLoading } = useUIStore()

  const handleAction = async () => {
    setLoading('action', true)
    try {
      await performAction()
      addToast({
        type: 'success',
        message: 'Action completed successfully',
      })
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Action failed',
      })
    } finally {
      setLoading('action', false)
    }
  }

  return (
    <div>
      {!isOnline && <OfflineBanner />}
      {/* Rest of app */}
    </div>
  )
}
```

## Custom Hooks

### useApi Hook

```typescript
import { useApi } from '@/lib/hooks/use-api'

function DataComponent() {
  const { data, isLoading, error, execute } = useApi({
    onSuccess: (data) => console.log('Success:', data),
    showSuccessToast: true,
    successMessage: 'Data loaded successfully',
  })

  const loadData = () => {
    execute({
      method: 'GET',
      url: '/api/data',
    })
  }

  return (
    <div>
      <button onClick={loadData}>Load Data</button>
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {data && <DataDisplay data={data} />}
    </div>
  )
}
```

### useMutation Hook

```typescript
import { useMutation } from '@/lib/hooks/use-api'

function CreatePetForm() {
  const { execute, isLoading } = useMutation({
    showSuccessToast: true,
    successMessage: 'Pet created successfully',
  })

  const handleSubmit = async (data) => {
    try {
      await execute({
        method: 'POST',
        url: '/care/pets',
        data,
      })
      // Success handling
    } catch (error) {
      // Error handling
    }
  }

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>
}
```

### useOptimistic Hook

```typescript
import { useOptimistic } from '@/lib/hooks/use-optimistic'

function TodoList() {
  const { data, addOptimistic, updateOptimistic, deleteOptimistic } = useOptimistic(
    initialTodos,
    {
      onSuccess: (data) => console.log('Updated:', data),
      rollbackOnError: true,
    }
  )

  const handleAdd = async (todo) => {
    await addOptimistic(todo, () => apiRequest({ method: 'POST', url: '/todos', data: todo }))
  }

  const handleUpdate = async (id, updates) => {
    await updateOptimistic(
      (todo) => todo.id === id,
      updates,
      () => apiRequest({ method: 'PUT', url: `/todos/${id}`, data: updates })
    )
  }

  const handleDelete = async (id) => {
    await deleteOptimistic(
      (todo) => todo.id === id,
      () => apiRequest({ method: 'DELETE', url: `/todos/${id}` })
    )
  }

  return <div>{/* Render todos */}</div>
}
```

## Error Handling

### Error Boundary

Wrap components with ErrorBoundary to catch and handle errors gracefully:

```typescript
import { ErrorBoundary } from '@/components/error-boundary'

function App() {
  return (
    <ErrorBoundary
      fallback={<CustomErrorUI />}
      onError={(error, errorInfo) => {
        // Log to error monitoring service
        console.error('Error:', error, errorInfo)
      }}
    >
      <YourComponent />
    </ErrorBoundary>
  )
}
```

### useErrorHandler Hook

```typescript
import { useErrorHandler } from '@/components/error-boundary'

function Component() {
  const handleError = useErrorHandler()

  const doSomething = async () => {
    try {
      await riskyOperation()
    } catch (error) {
      handleError(error) // Triggers error boundary
    }
  }

  return <button onClick={doSomething}>Do Something</button>
}
```

## Loading States

### Skeleton Screens

```typescript
import { Skeleton, CardSkeleton, ListSkeleton, PetSkeleton } from '@/components/ui/skeleton'

function Component() {
  if (isLoading) {
    return (
      <div>
        <Skeleton width="100%" height={40} />
        <CardSkeleton />
        <ListSkeleton count={5} />
        <PetSkeleton className="w-32 h-32" />
      </div>
    )
  }

  return <div>{/* Actual content */}</div>
}
```

### Loading Spinners

```typescript
import { LoadingSpinner, LoadingOverlay, InlineLoading } from '@/components/ui/loading-spinner'

function Component() {
  return (
    <div>
      <LoadingSpinner size="lg" variant="paw" />
      <LoadingOverlay message="Loading your pets..." />
      <InlineLoading message="Saving..." />
    </div>
  )
}
```

## Toast Notifications

```typescript
import { useToast } from '@/components/ui/toast'

function Component() {
  const toast = useToast()

  const handleAction = () => {
    toast.success('Action completed successfully')
    toast.error('Something went wrong')
    toast.warning('Please review this')
    toast.info('New feature available')
  }

  return <button onClick={handleAction}>Show Toast</button>
}
```

## PWA and Offline Support

### Service Worker Registration

Service worker is automatically registered in production. It provides:

- Offline page fallback
- API response caching
- Background sync
- Push notifications

### PWA Features

```typescript
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPushNotifications,
  isPWA,
  promptPWAInstall,
} from '@/lib/pwa'

// Check if running as PWA
if (isPWA()) {
  console.log('Running as installed PWA')
}

// Request notification permission
const granted = await requestNotificationPermission()

// Subscribe to push notifications
const subscription = await subscribeToPushNotifications()

// Prompt PWA installation
const installer = promptPWAInstall()
if (installer.canInstall()) {
  const accepted = await installer.install()
}
```

### Offline Detection

```typescript
import { useUIStore } from '@/lib/stores/ui-store'

function Component() {
  const isOnline = useUIStore((state) => state.isOnline)

  return (
    <div>
      {!isOnline && (
        <div className="bg-yellow-100 p-4">
          You are offline. Some features may be unavailable.
        </div>
      )}
    </div>
  )
}
```

## Best Practices

1. **Use Zustand stores** for global state that needs to be shared across components
2. **Use optimistic updates** for better perceived performance
3. **Implement proper error handling** with error boundaries
4. **Show loading states** with skeletons or spinners
5. **Cache GET requests** to reduce network calls
6. **Handle offline scenarios** gracefully
7. **Use toast notifications** for user feedback
8. **Implement retry logic** for failed requests
9. **Clear cache** when data is mutated
10. **Test offline functionality** thoroughly

## Environment Variables

Add these to your `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
```

## Testing

Test API integration and state management:

```typescript
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/lib/stores/auth-store'

describe('Auth Store', () => {
  it('should login successfully', async () => {
    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toBeDefined()
  })
})
```
