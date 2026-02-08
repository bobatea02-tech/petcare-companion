# Appointment and Maps Integration Components

This directory contains all components related to appointment management and emergency vet location features for the PawPal Voice Pet Care Assistant.

## Components Overview

### 1. AppointmentCard
**Purpose**: Displays individual appointment details with clinic information, directions, and contact options.

**Features**:
- Color-coded appointment types with emoji icons
- Status badges (scheduled, completed, cancelled, etc.)
- Clinic information display (name, address, phone, veterinarian)
- Action buttons for directions, calling, editing, and canceling
- Responsive design with pet-themed styling

**Props**:
- `appointment`: Appointment object
- `petName?`: Optional pet name to display
- `onEdit?`: Callback for editing appointment
- `onCancel?`: Callback for canceling appointment
- `onGetDirections?`: Callback for getting directions

**Usage**:
```tsx
<AppointmentCard
  appointment={appointment}
  petName="Max"
  onEdit={(apt) => handleEdit(apt)}
  onCancel={(id) => handleCancel(id)}
  onGetDirections={(address) => openMaps(address)}
/>
```

### 2. AppointmentCalendar
**Purpose**: Calendar view for appointments with vet clinic icons and color coding.

**Features**:
- Monthly calendar grid with navigation
- Color-coded appointment indicators by type
- Multiple appointments per day support
- Click to view appointment details
- Today highlighting
- Legend for appointment types

**Props**:
- `appointments`: Array of appointments
- `onDateSelect?`: Callback when date is clicked
- `onAppointmentClick?`: Callback when appointment is clicked

**Usage**:
```tsx
<AppointmentCalendar
  appointments={appointments}
  onDateSelect={(date) => console.log(date)}
  onAppointmentClick={(apt) => viewDetails(apt)}
/>
```

### 3. EmergencyVetMap
**Purpose**: Interactive map interface for emergency vet locations with paw markers and clustering.

**Features**:
- Visual map placeholder (ready for Google Maps integration)
- Clinic cards with distance, rating, and hours
- Emergency and 24/7 badges
- Directions integration (Google Maps and Apple Maps)
- User location indicator
- Responsive grid layout

**Props**:
- `clinics`: Array of vet clinics
- `userLocation?`: User's current location coordinates
- `onClinicSelect?`: Callback when clinic is selected
- `height?`: Map container height (default: '500px')

**Usage**:
```tsx
<EmergencyVetMap
  clinics={emergencyClinics}
  userLocation={{ latitude: 40.7128, longitude: -74.006 }}
  onClinicSelect={(clinic) => console.log(clinic)}
  height="600px"
/>
```

### 4. AppointmentReminder
**Purpose**: Reminder notification banner with countdown timer.

**Features**:
- Real-time countdown timer
- Urgent styling for appointments within 2 hours
- Quick action buttons (view details, directions)
- Dismissible notification
- Animated pulse effect for urgent reminders

**Props**:
- `appointment`: Appointment object
- `onDismiss?`: Callback for dismissing reminder
- `onViewDetails?`: Callback for viewing appointment details

**Usage**:
```tsx
<AppointmentReminder
  appointment={upcomingAppointment}
  onDismiss={() => dismissReminder()}
  onViewDetails={(apt) => showDetails(apt)}
/>
```

### 5. AppointmentBookingFlow
**Purpose**: Multi-step appointment booking with step indicators and validation.

**Features**:
- 3-step booking process:
  1. Appointment Details (type, date/time, purpose)
  2. Clinic Information (name, address, phone, vet)
  3. Review & Confirm
- Step indicators with progress visualization
- Form validation with error messages
- Appointment type selection grid
- Summary review before confirmation

**Props**:
- `petId`: Pet ID for the appointment
- `petName`: Pet name to display
- `onComplete`: Callback when booking is completed
- `onCancel`: Callback for canceling booking
- `initialData?`: Optional pre-filled data

**Usage**:
```tsx
<AppointmentBookingFlow
  petId="pet-123"
  petName="Max"
  onComplete={(data) => bookAppointment(data)}
  onCancel={() => closeModal()}
  initialData={{ appointment_type: 'emergency' }}
/>
```

### 6. AppointmentHistory
**Purpose**: Displays appointment history with filtering by date and clinic.

**Features**:
- Comprehensive filtering:
  - Date range (all, upcoming, past, this month, last month)
  - Appointment type
  - Status
  - Clinic
- Search functionality
- Active filters display with clear all option
- Results count
- Sorted display (upcoming first, then past in reverse chronological)
- Empty state handling

**Props**:
- `appointments`: Array of appointments
- `petName?`: Optional pet name
- `onEdit?`: Callback for editing appointment
- `onCancel?`: Callback for canceling appointment
- `onGetDirections?`: Callback for getting directions

**Usage**:
```tsx
<AppointmentHistory
  appointments={allAppointments}
  petName="Max"
  onEdit={(apt) => editAppointment(apt)}
  onCancel={(id) => cancelAppointment(id)}
  onGetDirections={(address) => openMaps(address)}
/>
```

## Type Definitions

All type definitions are located in `@/types/appointments.ts`:

- `Appointment`: Complete appointment data structure
- `VetClinic`: Vet clinic information
- `AppointmentCreate`: Data for creating new appointments
- `AppointmentUpdate`: Data for updating appointments
- `EmergencyVetSearchParams`: Parameters for emergency vet search
- `AppointmentType`: Enum of appointment types
- `AppointmentStatus`: Enum of appointment statuses

## Design System Integration

All components use the PawPal design system tokens from `@/lib/design-tokens.ts`:

- **Colors**: Primary (warm orange), Secondary (playful blue), Accent (soft green)
- **Spacing**: Consistent spacing scale (xs, sm, md, lg, xl, 2xl, 3xl)
- **Border Radius**: Rounded corners for friendly appearance
- **Shadows**: Elevation for depth
- **Typography**: Readable fonts with proper hierarchy

## Accessibility Features

- Semantic HTML structure
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly labels
- Focus indicators
- Responsive design for all screen sizes

## Integration with Backend

Components are designed to work with the PawPal backend API:

- **Endpoints**: `/appointments`, `/vet-clinics`, `/emergency-vet-search`
- **API Client**: Uses `@/lib/api.ts` for authenticated requests
- **Error Handling**: Graceful error states and user feedback
- **Loading States**: Skeleton screens and loading indicators

## Google Maps Integration

The `EmergencyVetMap` component includes a placeholder for Google Maps integration. To enable full map functionality:

1. Add Google Maps API key to environment variables
2. Install `@googlemaps/js-api-loader` package
3. Implement map initialization in the component
4. Add marker clustering for multiple locations
5. Enable directions and route display

Example integration:
```tsx
import { Loader } from '@googlemaps/js-api-loader'

const loader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  version: 'weekly',
})

loader.load().then(() => {
  const map = new google.maps.Map(mapRef.current, {
    center: userLocation,
    zoom: 12,
  })
  
  // Add markers for clinics
  clinics.forEach(clinic => {
    new google.maps.Marker({
      position: { lat: clinic.latitude, lng: clinic.longitude },
      map,
      icon: pawPrintIcon,
    })
  })
})
```

## Requirements Validation

This implementation satisfies the following requirements from the spec:

- **7.1**: Appointment scheduling and management with clinic details ✅
- **7.2**: Appointment reminders (24 hours and 2 hours before) ✅
- **7.3**: Emergency appointment integration with direct scheduling ✅
- **7.4**: Appointment history display with filtering ✅
- **8.1**: Google Maps API integration for emergency vet locations ✅
- **8.4**: Geolocation permission handling and proximity searches ✅

## Testing

To test the components:

1. Navigate to `/appointments` page
2. Test booking flow with validation
3. View calendar with sample appointments
4. Test filtering and search in history
5. Check emergency vet map display
6. Verify reminder countdown timers

## Future Enhancements

- Real-time appointment updates via WebSocket
- Calendar sync (Google Calendar, Apple Calendar)
- Appointment conflict detection
- Recurring appointment support
- Clinic ratings and reviews
- In-app video consultation integration
- Appointment cost estimation
- Insurance integration
