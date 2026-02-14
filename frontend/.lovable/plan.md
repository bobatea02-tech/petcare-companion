# PetPal Enhancement Plan

This is a significant upgrade covering 7 areas: button fixes, dark mode, social connectivity, pet image uploads, vaccinated toggle, real vet info via Google Maps, and overall UI polish.

---

## 1. Fix Button Text Color

The issue (visible in the screenshot): submit buttons like "ADD PET" have dark text on a dark green background, making them unreadable.

- Update the `Button` component's default variant to use `text-cream` (light text) on the forest-green primary background
- Apply the same fix across all submit buttons in AddPetDialog, EditPetDialog, HealthTracker, MedicationTracker, FeedingReminders, and VetBooking

---

## 2. Light/Dark Mode Toggle

- Add a theme provider using `next-themes` (already installed) wrapping the app
- Create a sun/moon toggle button in the Dashboard header
- The dark mode CSS variables are already defined in `index.css` -- just need the toggle mechanism to add/remove the `dark` class on `<html>`

---

## 3. Social Connectivity for Pet Parents

Since there is no backend yet, this will be a **UI-ready** implementation using localStorage for demo purposes, with clear notes that it needs Lovable Cloud for real multi-user functionality.

- **Community Feed Page** (`/community`): A feed where users can create posts with text, attach a pet, and see a timeline of updates. Posts stored in localStorage for demo.
- **Pet Parent Profile Page** (`/profile`): Shows the user's name, their pets, and a bio. Editable.
- **Chat/Messaging Page** (`/messages`): A simple messaging UI with demo bot responses. Real messaging requires a backend.
- Add a bottom navigation bar or header nav links to access these sections.

---

## 4. Pet Image Upload

- Add a camera/upload button to the pet avatar area in both AddPetDialog and EditPetDialog
- Use `FileReader` to convert the selected image to a base64 data URL and store it in the pet's `avatar` field
- Display the uploaded image in PetCard and PetDashboard header
- Note: Images will be stored as base64 in localStorage for now. For production, this should use a storage service.

---

## 5. Vaccinated Toggle in AddPetDialog

- Add a toggle switch (matching the style shown in the screenshot) to the AddPetDialog form
- The EditPetDialog already has this toggle -- just need to add it to the "add" form as well

---

## 6. Real Vet Info via Google Maps

This requires the Google Places API and an API key. The implementation plan:

- **Prerequisite**: Enable Lovable Cloud so we can securely store the Google Maps API key and create an edge function
- **Edge Function**: Create a `search-vets` edge function that calls the Google Places API (Nearby Search) filtered to "veterinary_care" based on the user's location/area text
- **VetBooking Enhancement**: When the user types a location in the vet booking form, trigger a search and display real vet clinics (name, address, rating, phone) as selectable options
  &nbsp;

---

## 7. UI Polish and Attractiveness

- **Gradient hero cards**: Add subtle gradient backgrounds to the pet header and stat cards
- **Glassmorphism**: Apply backdrop-blur and semi-transparent backgrounds to cards for a modern feel
- **Micro-interactions**: Add more spring-based hover effects, ripple animations on buttons, and staggered list animations
- **Better typography hierarchy**: Increase contrast between headings and body, add decorative dividers
- **Pet mood indicator**: Add an animated emoji mood badge next to the pet name based on health score
- **Bottom navigation**: Add a floating pill-shaped bottom nav for mobile with smooth transitions between sections
- **Loading skeleton**: Add skeleton loading states for a polished feel
- **Welcome banner**: A personalized greeting card at the top of the dashboard with time-of-day awareness

---

## Technical Details

### Files to create:

- `src/components/ThemeToggle.tsx` -- Dark/light mode toggle component
- `src/components/ThemeProvider.tsx` -- Theme context provider using next-themes
- `src/pages/Community.tsx` -- Social feed page
- `src/pages/Profile.tsx` -- Pet parent profile page
- `src/pages/Messages.tsx` -- Chat/messaging page
- `src/components/BottomNav.tsx` -- Mobile-friendly bottom navigation
- `src/components/ImageUpload.tsx` -- Reusable pet image upload component
- `src/components/WelcomeBanner.tsx` -- Time-aware greeting component

### Files to modify:

- `src/App.tsx` -- Add ThemeProvider wrapper and new routes
- `src/pages/Dashboard.tsx` -- Add ThemeToggle, WelcomeBanner, bottom nav
- `src/components/AddPetDialog.tsx` -- Add vaccinated toggle and image upload
- `src/components/EditPetDialog.tsx` -- Add image upload
- `src/components/PetCard.tsx` -- Better avatar display with uploaded images
- `src/components/PetDashboard.tsx` -- UI polish, gradient cards, mood indicator
- `src/components/ui/button.tsx` -- Fix text color for primary variant
- `src/components/VetBooking.tsx` -- Prepare for Google Maps integration (UI for now)
- `src/components/HealthTracker.tsx` -- UI polish
- `src/components/MedicationTracker.tsx` -- UI polish
- `src/components/FeedingReminders.tsx` -- UI polish
- `src/components/GroomingTips.tsx` -- UI polish
- `src/components/EmergencyTriage.tsx` -- UI polish
- `src/pages/Login.tsx` -- UI polish, dark mode support

### Important Note on Google Maps:

After approving this plan, we will need to:

1. Enable Lovable Cloud on this project
2. Add a Google Maps API key as a secret
3. Create the edge function for vet search

I will implement everything else first and prepare the vet booking UI, then guide you through the Google Maps setup.