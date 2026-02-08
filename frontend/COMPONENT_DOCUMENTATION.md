# Component Documentation

## Overview

This document provides comprehensive documentation for all components in the PawPal frontend application, including usage examples, props, and best practices.

## Table of Contents

1. [UI Components](#ui-components)
2. [Authentication Components](#authentication-components)
3. [Pet Management Components](#pet-management-components)
4. [Care Tracking Components](#care-tracking-components)
5. [Chat & Voice Components](#chat--voice-components)
6. [Health Records Components](#health-records-components)
7. [Notification Components](#notification-components)
8. [Settings Components](#settings-components)

---

## UI Components

### Button

A versatile button component with multiple variants and states.

**Props:**
```typescript
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
}
```

**Usage:**
```tsx
import { Button } from '@/components/ui/Button'

// Primary button
<Button variant="primary" onClick={handleClick}>
  Save Changes
</Button>

// Loading state
<Button loading>
  Submitting...
</Button>

// Disabled state
<Button disabled>
  Unavailable
</Button>
```

**Accessibility:**
- Keyboard navigable (Tab, Enter, Space)
- ARIA attributes for loading and disabled states
- Visible focus indicators
- Screen reader friendly

---

### Card

A container component for grouping related content.

**Props:**
```typescript
interface CardProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  footer?: React.ReactNode
  className?: string
  onClick?: () => void
}
```

**Usage:**
```tsx
import { Card } from '@/components/ui/Card'

<Card
  title="Pet Profile"
  subtitle="Max - Golden Retriever"
  footer={<Button>Edit Profile</Button>}
>
  <p>Pet details go here</p>
</Card>
```

---

### Input

Form input component with validation support.

**Props:**
```typescript
interface InputProps {
  id: string
  label: string
  type?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  required?: boolean
  disabled?: boolean
}
```

**Usage:**
```tsx
import { Input } from '@/components/ui/Input'

<Input
  id="email"
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  value={email}
  onChange={setEmail}
  error={emailError}
  required
/>
```

---

### Modal

Accessible modal dialog component.

**Props:**
```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'small' | 'medium' | 'large'
}
```

**Usage:**
```tsx
import { Modal } from '@/components/ui/Modal'

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  footer={
    <>
      <Button variant="outline" onClick={handleClose}>Cancel</Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </>
  }
>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

---

## Authentication Components

### LoginForm

User login form with validation.

**Props:**
```typescript
interface LoginFormProps {
  onSuccess?: (user: User) => void
  onError?: (error: string) => void
}
```

**Usage:**
```tsx
import { LoginForm } from '@/components/auth/LoginForm'

<LoginForm
  onSuccess={(user) => router.push('/dashboard')}
  onError={(error) => toast.error(error)}
/>
```

**Features:**
- Email validation
- Password visibility toggle
- Remember me option
- Error handling
- Loading states

---

### RegisterForm

User registration form with validation.

**Props:**
```typescript
interface RegisterFormProps {
  onSuccess?: (user: User) => void
  onError?: (error: string) => void
}
```

**Usage:**
```tsx
import { RegisterForm } from '@/components/auth/RegisterForm'

<RegisterForm
  onSuccess={(user) => router.push('/onboarding')}
  onError={(error) => toast.error(error)}
/>
```

**Features:**
- Email validation
- Password strength indicator
- Password confirmation
- Terms acceptance
- Error handling

---

## Pet Management Components

### PetCard

Display card for pet information.

**Props:**
```typescript
interface PetCardProps {
  pet: Pet
  onSelect?: (pet: Pet) => void
  onEdit?: (pet: Pet) => void
  selected?: boolean
}
```

**Usage:**
```tsx
import { PetCard } from '@/components/pets/PetCard'

<PetCard
  pet={pet}
  onSelect={handleSelectPet}
  onEdit={handleEditPet}
  selected={selectedPetId === pet.id}
/>
```

**Features:**
- Species-specific themes
- Health status indicator
- Photo display
- Quick actions
- Responsive design

---

### PetProfileForm

Form for creating/editing pet profiles.

**Props:**
```typescript
interface PetProfileFormProps {
  pet?: Pet
  onSubmit: (data: PetFormData) => void
  onCancel?: () => void
}
```

**Usage:**
```tsx
import { PetProfileForm } from '@/components/pets/PetProfileForm'

<PetProfileForm
  pet={existingPet}
  onSubmit={handleSavePet}
  onCancel={handleCancel}
/>
```

**Features:**
- Species and breed selection
- Date picker for birth date
- Medical history input
- Allergy tracking
- Photo upload

---

### PetPhotoUpload

Photo upload component with cropping.

**Props:**
```typescript
interface PetPhotoUploadProps {
  currentPhoto?: string
  onUpload: (file: File) => void
  onRemove?: () => void
}
```

**Usage:**
```tsx
import { PetPhotoUpload } from '@/components/pets/PetPhotoUpload'

<PetPhotoUpload
  currentPhoto={pet.photo_url}
  onUpload={handlePhotoUpload}
  onRemove={handlePhotoRemove}
/>
```

**Features:**
- Drag and drop
- Image cropping
- Preview
- File validation
- Compression

---

## Care Tracking Components

### MedicationCard

Display card for medication information.

**Props:**
```typescript
interface MedicationCardProps {
  medication: Medication
  onLog: (medicationId: string) => void
  onViewDetails: (medication: Medication) => void
}
```

**Usage:**
```tsx
import { MedicationCard } from '@/components/care/MedicationCard'

<MedicationCard
  medication={medication}
  onLog={handleLogDose}
  onViewDetails={handleViewDetails}
/>
```

**Features:**
- Dosage display
- Quantity tracking
- Refill alerts
- Progress bar
- Quick log button

---

### FeedingScheduleCard

Display and manage feeding schedules.

**Props:**
```typescript
interface FeedingScheduleCardProps {
  schedule: FeedingSchedule
  onLog: (scheduleId: string) => void
  onEdit: (schedule: FeedingSchedule) => void
}
```

**Usage:**
```tsx
import { FeedingScheduleCard } from '@/components/care/FeedingScheduleCard'

<FeedingScheduleCard
  schedule={feedingSchedule}
  onLog={handleLogFeeding}
  onEdit={handleEditSchedule}
/>
```

---

### DailyCareChecklist

Interactive checklist for daily care tasks.

**Props:**
```typescript
interface DailyCareChecklistProps {
  petId: string
  date: Date
  onComplete: (taskId: string) => void
}
```

**Usage:**
```tsx
import { DailyCareChecklist } from '@/components/care/DailyCareChecklist'

<DailyCareChecklist
  petId={selectedPet.id}
  date={new Date()}
  onComplete={handleTaskComplete}
/>
```

---

## Chat & Voice Components

### VoiceRecorder

Voice recording interface with waveform visualization.

**Props:**
```typescript
interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void
  onError?: (error: string) => void
  maxDuration?: number
}
```

**Usage:**
```tsx
import { VoiceRecorder } from '@/components/chat/VoiceRecorder'

<VoiceRecorder
  onRecordingComplete={handleAudioSubmit}
  onError={handleRecordingError}
  maxDuration={60000} // 60 seconds
/>
```

**Features:**
- Microphone permission handling
- Real-time waveform
- Recording timer
- Audio preview
- Cancel/retry options

---

### ChatInterface

Complete chat interface with AI assistant.

**Props:**
```typescript
interface ChatInterfaceProps {
  petId: string
  onEmergency?: (assessment: TriageAssessment) => void
}
```

**Usage:**
```tsx
import { ChatInterface } from '@/components/chat/ChatInterface'

<ChatInterface
  petId={selectedPet.id}
  onEmergency={handleEmergencyTriage}
/>
```

**Features:**
- Text and voice input
- Message history
- Typing indicators
- Triage results
- Emergency alerts

---

### TriageResultCard

Display AI triage assessment results.

**Props:**
```typescript
interface TriageResultCardProps {
  assessment: TriageAssessment
  onScheduleAppointment?: () => void
  onFindVet?: () => void
}
```

**Usage:**
```tsx
import { TriageResultCard } from '@/components/chat/TriageResultCard'

<TriageResultCard
  assessment={triageResult}
  onScheduleAppointment={handleSchedule}
  onFindVet={handleFindVet}
/>
```

---

## Health Records Components

### HealthRecordTimeline

Chronological display of health records.

**Props:**
```typescript
interface HealthRecordTimelineProps {
  petId: string
  records: HealthRecord[]
  onRecordClick?: (record: HealthRecord) => void
}
```

**Usage:**
```tsx
import { HealthRecordTimeline } from '@/components/health/HealthRecordTimeline'

<HealthRecordTimeline
  petId={pet.id}
  records={healthRecords}
  onRecordClick={handleViewRecord}
/>
```

---

### DocumentUpload

Document upload with drag-and-drop.

**Props:**
```typescript
interface DocumentUploadProps {
  petId: string
  onUpload: (file: File) => void
  acceptedFormats?: string[]
  maxSize?: number
}
```

**Usage:**
```tsx
import { DocumentUpload } from '@/components/health/DocumentUpload'

<DocumentUpload
  petId={pet.id}
  onUpload={handleDocumentUpload}
  acceptedFormats={['pdf', 'jpg', 'png']}
  maxSize={10485760} // 10MB
/>
```

---

### VaccinationCard

Display vaccination information.

**Props:**
```typescript
interface VaccinationCardProps {
  vaccination: Vaccination
  onUpdate?: (vaccination: Vaccination) => void
}
```

**Usage:**
```tsx
import { VaccinationCard } from '@/components/health/VaccinationCard'

<VaccinationCard
  vaccination={vaccination}
  onUpdate={handleUpdateVaccination}
/>
```

---

## Notification Components

### Toast

Toast notification component.

**Props:**
```typescript
interface ToastProps {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: () => void
  icon?: 'paw' | 'bell' | 'alert'
}
```

**Usage:**
```tsx
import { Toast } from '@/components/notifications/Toast'

<Toast
  message="Medication logged successfully!"
  type="success"
  duration={3000}
  onClose={handleClose}
  icon="paw"
/>
```

---

### NotificationCenter

Centralized notification management.

**Props:**
```typescript
interface NotificationCenterProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onClearAll: () => void
}
```

**Usage:**
```tsx
import { NotificationCenter } from '@/components/notifications/NotificationCenter'

<NotificationCenter
  notifications={notifications}
  onMarkAsRead={handleMarkAsRead}
  onClearAll={handleClearAll}
/>
```

---

## Settings Components

### ProfileSettings

User profile management.

**Props:**
```typescript
interface ProfileSettingsProps {
  user: User
  onUpdate: (data: UserUpdateData) => void
}
```

**Usage:**
```tsx
import { ProfileSettings } from '@/components/settings/ProfileSettings'

<ProfileSettings
  user={currentUser}
  onUpdate={handleUpdateProfile}
/>
```

---

### NotificationSettings

Notification preference management.

**Props:**
```typescript
interface NotificationSettingsProps {
  preferences: NotificationPreferences
  onUpdate: (preferences: NotificationPreferences) => void
}
```

**Usage:**
```tsx
import { NotificationSettings } from '@/components/settings/NotificationSettings'

<NotificationSettings
  preferences={notificationPrefs}
  onUpdate={handleUpdatePreferences}
/>
```

---

## Best Practices

### 1. Component Composition

Build complex UIs by composing simple components:

```tsx
<Card>
  <PetCard pet={pet} />
  <MedicationCard medication={medication} />
</Card>
```

### 2. Props Validation

Always define TypeScript interfaces for props:

```typescript
interface MyComponentProps {
  required: string
  optional?: number
}
```

### 3. Error Boundaries

Wrap components in error boundaries:

```tsx
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

### 4. Loading States

Always handle loading states:

```tsx
{loading ? <LoadingSpinner /> : <Content />}
```

### 5. Accessibility

- Use semantic HTML
- Include ARIA attributes
- Support keyboard navigation
- Provide alt text for images

### 6. Performance

- Use React.memo for expensive components
- Implement lazy loading for routes
- Optimize images
- Use code splitting

### 7. Styling

- Use Tailwind CSS utility classes
- Follow the design system
- Maintain consistent spacing
- Use pet-themed colors

## Resources

- [Storybook Documentation](http://localhost:6006)
- [Design System](./DESIGN_SYSTEM.md)
- [API Integration](./API_INTEGRATION.md)
- [Accessibility Guide](./ACCESSIBILITY_PERFORMANCE.md)
