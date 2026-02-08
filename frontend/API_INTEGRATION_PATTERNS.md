# API Integration Patterns

## Overview

This document describes patterns and best practices for integrating with the PawPal backend API.

## Table of Contents

1. [API Client Setup](#api-client-setup)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Request Patterns](#request-patterns)
5. [State Management](#state-management)
6. [Caching Strategies](#caching-strategies)
7. [Optimistic Updates](#optimistic-updates)
8. [Real-time Updates](#real-time-updates)

---

## API Client Setup

### Base Configuration

```typescript
// lib/api-client.ts
import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export { apiClient }
```

### Request Interceptor

```typescript
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)
```

### Response Interceptor

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const { data } = await apiClient.post('/auth/refresh')
        localStorage.setItem('auth_token', data.token)
        originalRequest.headers.Authorization = `Bearer ${data.token}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)
```

---

## Authentication

### Login

```typescript
// lib/api.ts
export const authAPI = {
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', {
      email,
      password,
    })
    
    localStorage.setItem('auth_token', data.token)
    return data.user
  },

  register: async (userData: RegisterData) => {
    const { data } = await apiClient.post('/auth/register', userData)
    localStorage.setItem('auth_token', data.token)
    return data.user
  },

  logout: async () => {
    await apiClient.post('/auth/logout')
    localStorage.removeItem('auth_token')
  },

  refreshToken: async () => {
    const { data } = await apiClient.post('/auth/refresh')
    localStorage.setItem('auth_token', data.token)
    return data.token
  },
}
```

### Usage in Components

```typescript
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/stores/auth-store'

function LoginForm() {
  const setUser = useAuthStore((state) => state.setUser)

  const handleLogin = async (email: string, password: string) => {
    try {
      const user = await authAPI.login(email, password)
      setUser(user)
      router.push('/dashboard')
    } catch (error) {
      toast.error('Login failed')
    }
  }

  return <form onSubmit={handleLogin}>...</form>
}
```

---

## Error Handling

### Error Types

```typescript
interface APIError {
  message: string
  code: string
  field?: string
  details?: Record<string, any>
}

class APIErrorHandler {
  static handle(error: any): APIError {
    if (error.response) {
      // Server responded with error
      return {
        message: error.response.data.message || 'An error occurred',
        code: error.response.data.code || 'UNKNOWN_ERROR',
        field: error.response.data.field,
        details: error.response.data.details,
      }
    } else if (error.request) {
      // Request made but no response
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      }
    } else {
      // Something else happened
      return {
        message: error.message || 'An unexpected error occurred',
        code: 'CLIENT_ERROR',
      }
    }
  }
}
```

### Error Handling Pattern

```typescript
async function fetchData() {
  try {
    const { data } = await apiClient.get('/endpoint')
    return data
  } catch (error) {
    const apiError = APIErrorHandler.handle(error)
    
    // Log error for monitoring
    console.error('API Error:', apiError)
    
    // Show user-friendly message
    toast.error(apiError.message)
    
    // Rethrow for component-level handling
    throw apiError
  }
}
```

---

## Request Patterns

### GET Requests

```typescript
export const petAPI = {
  // Get all pets for user
  getPets: async (): Promise<Pet[]> => {
    const { data } = await apiClient.get('/pets')
    return data
  },

  // Get single pet
  getPet: async (petId: string): Promise<Pet> => {
    const { data } = await apiClient.get(`/pets/${petId}`)
    return data
  },

  // Get with query parameters
  searchPets: async (query: string): Promise<Pet[]> => {
    const { data } = await apiClient.get('/pets/search', {
      params: { q: query },
    })
    return data
  },
}
```

### POST Requests

```typescript
export const petAPI = {
  // Create new pet
  createPet: async (petData: CreatePetData): Promise<Pet> => {
    const { data } = await apiClient.post('/pets', petData)
    return data
  },

  // Upload pet photo
  uploadPhoto: async (petId: string, file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const { data } = await apiClient.post(
      `/pets/${petId}/photo`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    return data.photo_url
  },
}
```

### PUT/PATCH Requests

```typescript
export const petAPI = {
  // Update pet (full update)
  updatePet: async (petId: string, petData: UpdatePetData): Promise<Pet> => {
    const { data } = await apiClient.put(`/pets/${petId}`, petData)
    return data
  },

  // Partial update
  patchPet: async (petId: string, updates: Partial<Pet>): Promise<Pet> => {
    const { data } = await apiClient.patch(`/pets/${petId}`, updates)
    return data
  },
}
```

### DELETE Requests

```typescript
export const petAPI = {
  // Delete pet
  deletePet: async (petId: string): Promise<void> => {
    await apiClient.delete(`/pets/${petId}`)
  },
}
```

---

## State Management

### Using Zustand Stores

```typescript
// lib/stores/pet-store.ts
import { create } from 'zustand'
import { petAPI } from '@/lib/api'

interface PetStore {
  pets: Pet[]
  selectedPet: Pet | null
  loading: boolean
  error: string | null
  
  fetchPets: () => Promise<void>
  selectPet: (pet: Pet) => void
  addPet: (pet: Pet) => void
  updatePet: (petId: string, updates: Partial<Pet>) => void
  deletePet: (petId: string) => void
}

export const usePetStore = create<PetStore>((set, get) => ({
  pets: [],
  selectedPet: null,
  loading: false,
  error: null,

  fetchPets: async () => {
    set({ loading: true, error: null })
    try {
      const pets = await petAPI.getPets()
      set({ pets, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  selectPet: (pet) => set({ selectedPet: pet }),

  addPet: (pet) => set((state) => ({
    pets: [...state.pets, pet],
  })),

  updatePet: (petId, updates) => set((state) => ({
    pets: state.pets.map((p) =>
      p.id === petId ? { ...p, ...updates } : p
    ),
  })),

  deletePet: (petId) => set((state) => ({
    pets: state.pets.filter((p) => p.id !== petId),
  })),
}))
```

### Using in Components

```typescript
function PetList() {
  const { pets, loading, fetchPets } = usePetStore()

  useEffect(() => {
    fetchPets()
  }, [fetchPets])

  if (loading) return <LoadingSpinner />

  return (
    <div>
      {pets.map((pet) => (
        <PetCard key={pet.id} pet={pet} />
      ))}
    </div>
  )
}
```

---

## Caching Strategies

### Simple In-Memory Cache

```typescript
class APICache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private ttl = 5 * 60 * 1000 // 5 minutes

  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > this.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  clear(): void {
    this.cache.clear()
  }
}

const apiCache = new APICache()
```

### Using Cache with Requests

```typescript
export const petAPI = {
  getPets: async (useCache = true): Promise<Pet[]> => {
    const cacheKey = 'pets'
    
    if (useCache) {
      const cached = apiCache.get(cacheKey)
      if (cached) return cached
    }

    const { data } = await apiClient.get('/pets')
    apiCache.set(cacheKey, data)
    return data
  },
}
```

### Cache Invalidation

```typescript
export const petAPI = {
  createPet: async (petData: CreatePetData): Promise<Pet> => {
    const { data } = await apiClient.post('/pets', petData)
    
    // Invalidate pets cache
    apiCache.clear()
    
    return data
  },
}
```

---

## Optimistic Updates

### Pattern Implementation

```typescript
export const usePetStore = create<PetStore>((set, get) => ({
  // ... other methods

  updatePetOptimistic: async (petId: string, updates: Partial<Pet>) => {
    // Store original state for rollback
    const originalPets = get().pets

    // Optimistically update UI
    set((state) => ({
      pets: state.pets.map((p) =>
        p.id === petId ? { ...p, ...updates } : p
      ),
    }))

    try {
      // Make API call
      const updatedPet = await petAPI.updatePet(petId, updates)
      
      // Update with server response
      set((state) => ({
        pets: state.pets.map((p) =>
          p.id === petId ? updatedPet : p
        ),
      }))
    } catch (error) {
      // Rollback on error
      set({ pets: originalPets })
      toast.error('Failed to update pet')
      throw error
    }
  },
}))
```

### Usage

```typescript
function PetCard({ pet }: { pet: Pet }) {
  const updatePetOptimistic = usePetStore((state) => state.updatePetOptimistic)

  const handleToggleFavorite = async () => {
    await updatePetOptimistic(pet.id, {
      is_favorite: !pet.is_favorite,
    })
  }

  return (
    <Card>
      <button onClick={handleToggleFavorite}>
        {pet.is_favorite ? '★' : '☆'}
      </button>
    </Card>
  )
}
```

---

## Real-time Updates

### WebSocket Connection

```typescript
// lib/websocket.ts
class WebSocketClient {
  private ws: WebSocket | null = null
  private listeners = new Map<string, Set<Function>>()

  connect(token: string) {
    this.ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}?token=${token}`
    )

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      this.emit(message.type, message.data)
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    this.ws.onclose = () => {
      // Reconnect after delay
      setTimeout(() => this.connect(token), 5000)
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback)
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((callback) => callback(data))
  }

  send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }))
    }
  }

  disconnect() {
    this.ws?.close()
  }
}

export const wsClient = new WebSocketClient()
```

### Using WebSocket in Components

```typescript
function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const handleNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev])
      toast.info(notification.message)
    }

    wsClient.on('notification', handleNotification)

    return () => {
      wsClient.off('notification', handleNotification)
    }
  }, [])

  return (
    <div>
      {notifications.map((notification) => (
        <NotificationCard key={notification.id} notification={notification} />
      ))}
    </div>
  )
}
```

---

## Best Practices

### 1. Type Safety

Always define TypeScript types for API responses:

```typescript
interface APIResponse<T> {
  data: T
  message?: string
  meta?: {
    page: number
    total: number
  }
}
```

### 2. Error Boundaries

Wrap API calls in try-catch blocks:

```typescript
try {
  const data = await apiClient.get('/endpoint')
} catch (error) {
  handleError(error)
}
```

### 3. Loading States

Always show loading indicators:

```typescript
const [loading, setLoading] = useState(false)

const fetchData = async () => {
  setLoading(true)
  try {
    const data = await apiClient.get('/endpoint')
  } finally {
    setLoading(false)
  }
}
```

### 4. Request Cancellation

Cancel requests on component unmount:

```typescript
useEffect(() => {
  const controller = new AbortController()

  apiClient.get('/endpoint', {
    signal: controller.signal,
  })

  return () => controller.abort()
}, [])
```

### 5. Retry Logic

Implement retry for failed requests:

```typescript
async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await apiClient.get(url)
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

### 6. Request Deduplication

Prevent duplicate concurrent requests:

```typescript
const pendingRequests = new Map<string, Promise<any>>()

async function deduplicatedRequest(key: string, request: () => Promise<any>) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)
  }

  const promise = request().finally(() => {
    pendingRequests.delete(key)
  })

  pendingRequests.set(key, promise)
  return promise
}
```

### 7. Rate Limiting

Implement client-side rate limiting:

```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = []
  private running = 0
  private maxConcurrent = 5

  async add<T>(request: () => Promise<T>): Promise<T> {
    if (this.running >= this.maxConcurrent) {
      await new Promise((resolve) => this.queue.push(resolve as any))
    }

    this.running++
    try {
      return await request()
    } finally {
      this.running--
      const next = this.queue.shift()
      if (next) next()
    }
  }
}
```

## Resources

- [Axios Documentation](https://axios-http.com/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Query](https://tanstack.com/query/latest) (alternative)
- [SWR](https://swr.vercel.app/) (alternative)
