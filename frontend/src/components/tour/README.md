# Guided Tour System

This directory contains the guided tour components for the Outstanding Landing Page Experience.

## Components

### GuidedTour
Main component that manages the tour flow and displays tooltips for three key features:
1. Voice Assistant (JoJo)
2. Health Tracker
3. Vet Booking

### TooltipOverlay
Displays a semi-transparent backdrop with spotlight effect and tooltip for each tour step.

## Usage

### Basic Integration

```tsx
import { GuidedTour } from "@/components/tour";

function Dashboard() {
  const [isTourActive, setIsTourActive] = useState(false);

  const handleTourComplete = () => {
    setIsTourActive(false);
    localStorage.setItem("tour_completed", "true");
  };

  const handleTourSkip = () => {
    setIsTourActive(false);
    localStorage.setItem("tour_completed", "true");
  };

  return (
    <div>
      {/* Your dashboard content */}
      
      <GuidedTour
        isActive={isTourActive}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
      />
    </div>
  );
}
```

### Marking Elements for Tour

Add `data-tour` attributes to elements you want to highlight:

```tsx
// Voice Assistant Button
<button data-tour="voice-assistant">
  Talk to JoJo
</button>

// Health Tracker Section
<div data-tour="health-tracker">
  {/* Health tracker content */}
</div>

// Vet Booking Section
<div data-tour="vet-booking">
  {/* Vet booking content */}
</div>
```

### Starting the Tour from Onboarding

The tour can be triggered from the onboarding flow:

```tsx
// In OnboardingFlow component
const handleStartTour = () => {
  localStorage.setItem("start_tour", "true");
  onComplete({ /* ... */ });
};

// In Dashboard component
useEffect(() => {
  const startTour = localStorage.getItem("start_tour");
  if (startTour === "true") {
    setTimeout(() => setIsTourActive(true), 1000);
    localStorage.removeItem("start_tour");
  }
}, []);
```

## Sample Data

The tour automatically generates and stores sample data for demonstration:

```tsx
import { generateSampleDashboardData } from "@/lib/sampleData";

// Sample data includes:
// - Pet named "Buddy" (Golden Retriever)
// - 3 health records (vaccination, checkup, medication)
// - 1 upcoming vet appointment
```

## Analytics

The tour tracks the following events:
- `tour_started` - When tour begins
- `tour_step_completed` - When each step is completed
- `tour_completed` - When tour finishes
- `tour_skipped` - When user skips the tour

Events are stored in localStorage under `analytics_events`.

## Styling

The tour uses the Lovable UI design system:
- Colors: Forest, Sage, Olive, Cream, Moss
- Fonts: Anton (headings), Inter (body)
- Border radius: 2.5rem for tooltips
- Animations: Framer Motion

## Requirements Validated

- **Requirement 7.1**: Tour automatically begins after onboarding
- **Requirement 7.2**: Showcases exactly three features
- **Requirement 7.3**: Displays example voice command
- **Requirement 7.4**: Uses tooltip overlays with spotlight effect
- **Requirement 7.5**: Pre-populates sample data
- **Requirement 7.6**: Provides "Skip Tour" option at all steps
- **Requirement 7.7**: Uses Framer Motion for animations
