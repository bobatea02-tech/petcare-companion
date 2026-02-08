# Voice Pet Care Assistant - Kiro Implementation Guide

## 🎯 Project Overview

Build a complete Voice Pet Care Assistant using Kiro's AI-native platform. Users access via web for comprehensive pet health management with voice interaction, symptom checking, medication tracking, and AI-powered health insights.

---

## 🚀 Why Kiro is Perfect for This Project

**Kiro's Strengths:**

- ✅ AI-native platform (built-in LLM integration)
- ✅ Voice interface capabilities
- ✅ No-code visual builder
- ✅ Real-time data handling
- ✅ Custom workflows with AI
- ✅ Multi-modal interactions (text + voice + visual)
- ✅ Built-in database
- ✅ API integrations
- ✅ Authentication & user management

---

## 📋 IMPLEMENTATION ROADMAP

### Phase 1: Kiro Project Setup (Day 1-2)

#### Step 1: Create New Kiro Project

```
Project Name: PawPal Pet Care Assistant
Project Type: Web Application
Template: Start from scratch (for full customization)
Enable Features:
  ✓ AI Chat & Voice
  ✓ Database
  ✓ User Authentication
  ✓ File Upload
  ✓ Workflows
  ✓ API Connector
```

#### Step 2: Configure AI Settings in Kiro

```
AI Model Selection:
Primary: GPT-4 Turbo (for complex medical reasoning)
Fallback: GPT-3.5 Turbo (for simple queries, cost optimization)

Voice Settings:
Speech-to-Text: Kiro's built-in STT
Text-to-Speech: Enable with these settings:
  - Voice: Nova (warm, friendly female voice)
  - Speed: 0.95 (slightly slower for clarity)
  - Pitch: Normal
  - Language: English (US)

AI Behavior Configuration:
Temperature: 0.7 (balanced creativity and accuracy)
Max Tokens: 2000
Top P: 0.9
Frequency Penalty: 0.3
Presence Penalty: 0.2
```

---

### Phase 2: Database Design in Kiro (Day 3-4)

#### Kiro Database Tables to Create

**Table 1: users**

```
Table: users (built-in, extend with custom fields)
Custom Fields to Add:
- full_name (text)
- phone_number (text)
- location (text)
- preferred_vet_clinic (text)
- vet_clinic_phone (text)
- subscription_tier (select: Free, Premium)
- onboarding_completed (boolean, default: false)
- created_at (datetime, auto)
- last_login (datetime)
- notification_preferences (JSON: {email: true, push: true, sms: false})
```

**Table 2: pets**

```
Table: pets
Fields:
- id (auto-generated UUID)
- owner_id (relationship → users)
- name (text, required)
- species (select: Dog, Cat, Bird, Rabbit, Guinea Pig, Hamster, Fish, Reptile)
- breed (text)
- date_of_birth (date)
- age_years (formula: YEAR(NOW()) - YEAR(date_of_birth))
- gender (select: Male, Female, Neutered Male, Spayed Female)
- weight_current (number, decimal)
- weight_unit (select: lbs, kg)
- weight_ideal (number, decimal)
- profile_photo (file upload, image only)
- microchip_id (text)
- insurance_provider (text)
- insurance_policy_number (text)
- special_conditions (multi-select: Hip Dysplasia, Allergies, Diabetes, Heart Disease, Kidney Disease, Arthritis, Other)
- allergies_detail (long text)
- is_active (boolean, default: true)
- created_at (datetime, auto)
- updated_at (datetime, auto)

Validations:
- name: min 1 char, max 50 chars
- weight_current: min 0.1, max 500
```

**Table 3: medications**

```
Table: medications
Fields:
- id (UUID)
- pet_id (relationship → pets)
- medication_name (text, required)
- dosage_amount (text, e.g., "75mg", "1 tablet")
- frequency (select: Once daily, Twice daily, Three times daily, Every 8 hours, Every 12 hours, As needed, Weekly)
- time_slot_1 (time, e.g., 08:00)
- time_slot_2 (time, optional)
- time_slot_3 (time, optional)
- with_food (boolean)
- reason_for_medication (text)
- prescribing_vet (text)
- start_date (date)
- end_date (date, optional)
- is_ongoing (boolean, default: true)
- total_quantity (number, e.g., 90 pills)
- quantity_remaining (number)
- refill_threshold (number, default: 7)
- needs_refill (formula: quantity_remaining <= refill_threshold)
- instructions (long text)
- is_active (boolean, default: true)
- created_at (datetime, auto)

Validations:
- medication_name: required
- dosage_amount: required
- at least one time_slot must be filled if frequency is not "As needed"
```

**Table 4: medication_logs**

```
Table: medication_logs
Fields:
- id (UUID)
- medication_id (relationship → medications)
- pet_id (relationship → pets)
- scheduled_datetime (datetime)
- actual_datetime (datetime, optional)
- status (select: Pending, Given, Missed, Skipped)
- given_by (text, user name)
- notes (text)
- auto_created (boolean, default: true)
- created_at (datetime, auto)

Indexes:
- Index on: pet_id, scheduled_datetime (for fast queries)
- Index on: status (for filtering)
```

**Table 5: health_records**

```
Table: health_records
Fields:
- id (UUID)
- pet_id (relationship → pets)
- record_date (datetime)
- record_type (select: Symptom, Weight, Vet Visit, Vaccination, Lab Result, General Note, Emergency)
- title (text, e.g., "Vomiting episode")
- description (long text)
- symptom_category (select: Digestive, Respiratory, Skin, Eyes/Ears, Urinary, Mobility, Behavioral, Other)
- severity (select: Mild, Moderate, Severe)
- triage_level (select: Green, Yellow, Red)
- ai_assessment (long text, AI-generated)
- weight_value (number, decimal, optional)
- temperature_value (number, decimal, optional)
- vet_diagnosis (long text)
- treatment_prescribed (long text)
- follow_up_needed (boolean)
- follow_up_date (date, optional)
- attachments (file upload, multiple)
- created_by_user_id (relationship → users)
- created_at (datetime, auto)
- updated_at (datetime, auto)
```

**Table 6: feeding_schedules**

```
Table: feeding_schedules
Fields:
- id (UUID)
- pet_id (relationship → pets)
- meal_name (text, e.g., "Breakfast")
- scheduled_time (time)
- portion_size (text, e.g., "2 cups", "1/4 can")
- food_brand (text)
- food_type (select: Dry Kibble, Wet Food, Raw, Homemade, Mixed)
- special_instructions (text)
- is_active (boolean, default: true)
- created_at (datetime, auto)
```

**Table 7: feeding_logs**

```
Table: feeding_logs
Fields:
- id (UUID)
- feeding_schedule_id (relationship → feeding_schedules)
- pet_id (relationship → pets)
- scheduled_datetime (datetime)
- actual_datetime (datetime, optional)
- status (select: Fed, Missed)
- portion_given (text)
- notes (text)
- created_at (datetime, auto)
```

**Table 8: grooming_tasks**

```
Table: grooming_tasks
Fields:
- id (UUID)
- pet_id (relationship → pets)
- task_type (select: Brushing, Bathing, Nail Trim, Ear Cleaning, Teeth Brushing, Anal Glands, Professional Grooming)
- frequency_days (number, e.g., 7 for weekly)
- last_completed_date (date)
- next_due_date (formula: last_completed_date + frequency_days)
- is_overdue (formula: next_due_date < TODAY())
- notes (text)
- is_active (boolean, default: true)
- created_at (datetime, auto)
```

**Table 9: vet_appointments**

```
Table: vet_appointments
Fields:
- id (UUID)
- pet_id (relationship → pets)
- appointment_datetime (datetime)
- clinic_name (text)
- veterinarian_name (text)
- clinic_phone (text)
- clinic_address (text)
- reason (text)
- appointment_type (select: Checkup, Vaccination, Sick Visit, Follow-up, Surgery, Dental, Emergency)
- reminder_24h_sent (boolean, default: false)
- reminder_2h_sent (boolean, default: false)
- status (select: Scheduled, Completed, Cancelled, No-show)
- visit_notes (long text, filled after appointment)
- next_appointment_needed (boolean)
- created_at (datetime, auto)
- updated_at (datetime, auto)
```

**Table 10: ai_conversations**

```
Table: ai_conversations
Fields:
- id (UUID)
- user_id (relationship → users)
- pet_id (relationship → pets, optional)
- conversation_type (select: Symptom Check, Medication Query, General Question, Emergency, Feeding, Grooming)
- user_message (long text)
- ai_response (long text)
- intent_detected (text)
- satisfaction_rating (number 1-5, optional)
- was_helpful (boolean, optional)
- created_at (datetime, auto)

Purpose: Track conversations for improvement and analytics
```

---

### Phase 3: UI Design in Kiro (Day 5-7)

#### Kiro Design System Setup

**Global Styles Configuration:**

```css
/* In Kiro's Theme Editor */

Colors:
Primary:
  - primary-500: #6BCB77 (main green)
  - primary-400: #7DD687
  - primary-600: #5AB968

Secondary:
  - secondary-500: #4D96FF (main blue)
  - secondary-400: #6AA8FF
  - secondary-600: #3D7FE6

Accent:
  - accent-500: #FFB347 (warm orange)
  - accent-400: #FFC670
  - accent-600: #FFA030

Semantic:
  - success: #95E1D3
  - warning: #FFD93D
  - error: #FF6B6B
  - info: #B19CD9

Neutrals:
  - gray-50: #F9FAFB
  - gray-100: #F3F4F6
  - gray-200: #E5E7EB
  - gray-300: #D1D5DB
  - gray-400: #9CA3AF
  - gray-500: #6B7280
  - gray-600: #4B5563
  - gray-700: #374151
  - gray-800: #1F2937
  - gray-900: #111827

Background:
  - bg-primary: #FFFFFF
  - bg-secondary: #FFF8E7 (cream)

Typography:
Font Family:
  - heading: 'Poppins', sans-serif
  - body: 'Nunito', sans-serif

Font Sizes:
  - xs: 12px
  - sm: 14px
  - base: 16px
  - lg: 18px
  - xl: 20px
  - 2xl: 24px
  - 3xl: 30px
  - 4xl: 36px

Spacing Scale: (4px base)
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  5: 20px
  6: 24px
  8: 32px
  10: 40px
  12: 48px

Border Radius:
  - sm: 6px
  - md: 8px
  - lg: 12px
  - xl: 16px
  - 2xl: 24px
  - full: 9999px

Shadows:
  - sm: 0 1px 3px rgba(0,0,0,0.1)
  - md: 0 4px 6px rgba(0,0,0,0.1)
  - lg: 0 10px 15px rgba(0,0,0,0.1)
  - xl: 0 20px 25px rgba(0,0,0,0.1)
```

#### Kiro Pages to Build

**PAGE 1: Landing Page (/)**

```
Layout: Full-width
Background: Gradient (cream to light blue)

Components:

[Header Component]
- Logo (upload paw print icon + "PawPal" text)
- Nav Menu: Home | Features | Pricing | Login | Sign Up
- Sticky on scroll

[Hero Section]
- Heading (H1): "Your Pet's Health, Simplified"
  Font: Poppins, 48px, bold, color: gray-900
- Subheading: "AI-powered care assistant trusted by pet parents worldwide"
  Font: Nunito, 20px, regular, color: gray-600
- CTA Button: "Get Started Free"
  Style: primary-500 background, white text, rounded-xl, shadow-lg
  Action: Navigate to /signup
- Hero Image: Illustration of happy pets
  Position: Right side (desktop) or below (mobile)

[Features Grid - 3 columns]
Each feature card:
- Icon (64x64px, color: primary-500)
- Title (text-xl, font: Poppins semibold)
- Description (text-base, font: Nunito)
- Hover effect: Lift up 4px, shadow-xl

Features:
1. 🩺 Symptom Checker
   "Get instant health assessments powered by veterinary AI"
2. 💊 Never Miss a Dose
   "Smart medication reminders that actually work"
3. 📊 Health Dashboard
   "Track your pet's wellness journey with beautiful insights"
4. 🗣️ Voice Assistant
   "Just ask - hands-free pet care guidance"
5. 🚨 Emergency Help
   "24/7 urgent care triage and vet locator"
6. 📱 Multi-Pet Management
   "Manage all your furry family in one place"

[How It Works - 4 Steps]
Timeline layout with connecting line:
Step 1: Add Your Pet
Step 2: Track Daily Care
Step 3: Get AI Insights
Step 4: Keep Them Thriving

[Testimonials Carousel]
- Auto-rotate every 5 seconds
- Show 3 testimonials at a time (desktop)
- Each card: Photo (circular), Quote, Name, Pet name

[Pricing Section]
Two cards side-by-side:
Card 1: Free Forever
- All basic features
- Up to 2 pets
- Community support
- Button: "Start Free"

Card 2: Premium ($9.99/mo)
- Everything in Free
- Unlimited pets
- Priority AI responses
- Vet telehealth (2/month)
- Advanced analytics
- Badge: "Most Popular"
- Button: "Start 14-Day Trial"

[Footer]
- Links: About, Privacy, Terms, Contact
- Social icons
- Newsletter signup
```

**PAGE 2: Signup (/signup)**

```
Layout: Centered form, max-width 450px
Background: bg-secondary (cream)

[Signup Form]
Fields:
1. Email (input, type: email, required)
2. Password (input, type: password, min 8 chars, required)
3. Confirm Password (must match password)
4. Checkbox: "I agree to Terms & Privacy Policy"

Button: "Create Account"
- Primary-500 background
- Disabled until form valid
- On click → Kiro Workflow: Create User

Link: "Already have an account? Log in"

Social Login (optional):
- "Continue with Google" button
- Uses Kiro's OAuth integration
```

**Kiro Workflow: Create User**

```
Trigger: Signup button clicked

Steps:
1. Validate form inputs
2. Check if email already exists (database query)
3. If exists → Show error: "Email already registered"
4. If new → Create user record in users table
5. Send welcome email (Kiro email action)
6. Auto-login user
7. Navigate to: /onboarding
```

**PAGE 3: Onboarding (/onboarding)**

```
Layout: Multi-step form (3 steps)
Progress bar at top

Step 1: Add Your First Pet
Form fields:
- Pet name (text input)
- Upload photo (file upload, optional)
- Species (dropdown: Dog, Cat, Bird, etc.)
- Breed (text input with autocomplete)
- Birthday (date picker)
- Gender (radio buttons)
- Current weight (number + unit select)

Button: "Next" → Step 2

Step 2: Health Information
Form fields:
- Any special conditions? (multi-select checkboxes)
- Allergies (text area)
- Current medications? (yes/no toggle)
  If yes → Mini form: Med name, dosage, frequency
- Preferred vet clinic (text input)
- Vet phone number (text input)

Button: "Next" → Step 3

Step 3: Notification Preferences
Checkboxes:
- ☑ Email notifications
- ☑ Medication reminders
- ☑ Health insights
- ☐ Marketing updates

Button: "Complete Setup" → Navigate to /dashboard

Kiro Workflow on Complete:
1. Create pet record
2. If medications added → Create medication records
3. Set onboarding_completed = true
4. Create welcome health_record entry
5. Navigate to dashboard
```

**PAGE 4: Dashboard (/dashboard)**

```
Layout: Sidebar + Main Content

[Left Sidebar - Desktop / Bottom Nav - Mobile]
Navigation items:
- 🏠 Dashboard (current page)
- 🐾 My Pets
- 💊 Medications
- 📊 Health Log
- 📅 Appointments
- ✂️ Grooming
- ⚙️ Settings

Each item: Icon + Label, active state highlighted

[Top Bar]
- PawPal logo (left)
- Pet switcher dropdown (center)
  Shows: Current pet avatar + name
  Dropdown: List all user's pets + "Add new pet"
- User profile icon (right) → Dropdown: Profile, Settings, Logout
- Notification bell (badge count if unread)

[Main Content Area]

Welcome Section:
- Greeting: "Good [morning/afternoon], [User Name]!"
  Dynamic based on time of day
- Current pet large avatar (animated, subtle tail wag)
- Pet name below avatar

Today's Schedule Card:
Title: "Today for [Pet Name]"
List groups:
1. Medications (Repeating Group from medication_logs)
   Filter: pet_id = current pet, scheduled_date = TODAY, status = Pending
   Each row:
   - Time badge (e.g., "8:00 AM")
   - Medication name + dosage
   - Checkbox: "Mark as Given"
     On check → Workflow: Update status to Given, set actual_datetime to NOW
   - If given → Green checkmark icon

2. Feeding Schedule
   Filter: feeding_schedules where pet_id = current
   Each meal:
   - Time + meal name
   - Portion size
   - Checkbox to log

3. Grooming Tasks Due
   Filter: grooming_tasks where is_overdue = true OR next_due_date = TODAY
   Each task:
   - Task type icon
   - "Due today" or "Overdue by X days"
   - "Mark Complete" button

Quick Action Cards (3-column grid):

Card 1: Symptom Checker
- Icon: 🩺 large, color: primary-500
- Title: "Check Symptoms"
- Description: "Assess [Pet Name]'s health"
- Button: "Start Check" → Navigate to /symptom-checker
- Background: white, border-left: 4px solid primary-500

Card 2: Log Health Event
- Icon: 📝
- Title: "Add Health Note"
- Description: "Record weight, note, etc."
- Button: "Quick Log" → Open popup modal
- Background: white, border-left: 4px solid secondary-500

Card 3: Emergency Help
- Icon: 🚨
- Title: "Need Help Now?"
- Description: "Urgent care guidance"
- Button: "Emergency" → Navigate to /emergency
- Background: white, border-left: 4px solid error (red)

Health Summary Widget:
- Current weight: [72 lbs] (change indicator: ↑ 2% this month)
- Weight trend mini chart (last 6 data points, line graph)
  Use Kiro's Chart component
- Recent symptoms: "None logged" or count
- Next checkup: "Rabies vaccine due in 45 days"

Floating Action Button (bottom-right):
- Large circular button
- Icon: Microphone
- Color: primary-500
- Shadow: large
- Pulsing animation
- On click → Activate Voice Assistant (Kiro AI Chat)
```

**Kiro Workflow: Mark Medication as Given**

```
Trigger: Checkbox checked in Today's Medications

Steps:
1. Get medication_log id (from clicked row)
2. Update medication_log:
   - status = "Given"
   - actual_datetime = NOW()
3. Decrement medication.quantity_remaining by 1
4. Show toast notification: "✓ [Med name] logged for [Pet name]"
5. Refresh repeating group
6. Check if quantity_remaining <= refill_threshold
   If yes → Show refill reminder notification
```

**PAGE 5: My Pets (/pets)**

```
Layout: Grid of pet cards

[Page Header]
- Title: "My Pets"
- Button: "+ Add New Pet" → Navigate to /pets/new

[Pet Cards Grid - Responsive]
Desktop: 3 columns
Tablet: 2 columns
Mobile: 1 column

Each Pet Card:
- Large pet avatar (circular, 120px)
- Pet name (text-2xl, bold)
- Species badge (e.g., "Dog 🐕")
- Age: "4 years old"
- Quick stats row:
  - Weight: 72 lbs
  - Health status icon (🟢/🟡/🔴 based on recent issues)
  - Last checkup: "2 months ago"
- Action buttons row:
  - "View Profile" → Navigate to /pets/[pet_id]
  - "Quick Log" → Open log modal
  - "..." menu → Edit, Delete

Card styling:
- White background
- Rounded-xl
- Shadow-md
- Hover: shadow-lg, scale 1.02
- Border: 1px gray-200
- Padding: space-6

Empty State (if no pets):
- Illustration of pet placeholder
- Text: "No pets yet! Let's add your first furry friend."
- Large CTA button: "Add Your First Pet"
```

**PAGE 6: Pet Profile (/pets/[id])**

```
Layout: Two-column (left: info, right: timeline)

[Header Section]
- Large pet avatar (editable on click)
- Pet name (editable inline)
- Edit button (pencil icon) → Enable edit mode
- Species + Breed subtitle
- Age badge

[Left Column - Info Cards]

Card: Basic Information
- Birthday: Jan 15, 2020
- Age: 4 years, 2 months (auto-calculated)
- Gender: Male (Neutered)
- Weight: 72 lbs (as of Feb 1)
  - "Log new weight" link → Quick modal
- Microchip: 123456789012345 (copy icon)
- Edit button for card

Card: Medical Information
- Vet Clinic: Oakwood Animal Hospital
  Phone: (555) 123-4567 (clickable tel: link)
- Insurance: PetPlan #PL789456
- Special Conditions:
  • Hip dysplasia (mild)
  • Seasonal allergies
- Allergies: Chicken, grass pollen
- Edit button

Card: Current Medications
Repeating group from medications table
Filter: pet_id = current, is_active = true
Each medication:
- Name + dosage
- Frequency
- "View details" link → Expand to show full info
- "Edit" | "Discontinue" buttons

Button: "+ Add Medication"

Card: Weight History
- Line chart (Kiro Chart component)
- X-axis: Dates (last 6 months)
- Y-axis: Weight
- Markers for each data point
- Ideal weight range (shaded area)
- Download as PDF button

[Right Column - Health Timeline]

Title: "Health History"
Filter buttons: All | Symptoms | Vet Visits | Vaccines | Weights

Repeating group: health_records
Filter: pet_id = current, sorted by record_date DESC

Each timeline entry:
- Date (relative: "2 days ago" or absolute)
- Icon based on record_type
  - Symptom: 🩺
  - Vet Visit: 🏥
  - Vaccination: 💉
  - Weight: ⚖️
  - General: 📝
- Title
- Description (truncated, "Read more" expands)
- Triage level badge (if symptom)
- Attachments (if any) - thumbnail preview
- Actions: Edit | Delete

Empty state: "No health records yet. Start tracking [Pet name]'s health!"

Floating buttons at bottom:
- "Log Health Event"
- "Schedule Vet Visit"
- "Delete Pet" (with confirmation modal)
```

**PAGE 7: Symptom Checker (/symptom-checker)**

```
Layout: Centered, max-width 700px
Background: Gradient light

[Progress Indicator]
- Steps 1-5 as dots
- Current step highlighted
- Line connecting dots
- Text: "Step 2 of 5"

[Step Content Card]
White card, rounded-xl, shadow-lg, padding-8

Step 1: Main Concern
- Large heading: "What's worrying you about [Pet Name]?"
- Pet avatar (for context)
- Button grid (3x3, responsive):
  Each button: Icon + Label
  Options:
  - 🤮 Vomiting
  - 💩 Diarrhea
  - 😴 Lethargy
  - 🦵 Limping
  - 😷 Coughing
  - 🍽️ Loss of Appetite
  - 🔴 Skin Issue
  - 🤔 Behavior Change
  - ➕ Other...

On click → Store selection, go to Step 2

Step 2: Duration
- Question: "How long has this been happening?"
- Radio buttons (large, card-style):
  ○ Less than 24 hours
  ○ 1-3 days
  ○ 4-7 days
  ○ More than a week
- Navigation: Back | Next

Step 3: Severity
- Question: "How severe would you rate this?"
- Slider: 1 (Mild) ←→ 10 (Severe)
- Dynamic text below slider updates as user moves it:
  1-3: "Mild - Noticeable but not limiting activity"
  4-6: "Moderate - Affecting daily routine"
  7-8: "Severe - Significant distress"
  9-10: "Critical - Extreme concern"
- Navigation: Back | Next

Step 4: Additional Symptoms
- Question: "Are there any other symptoms?"
- Checklist (multiple selections allowed):
  □ Reduced water intake
  □ Restlessness or anxiety
  □ Unusual sounds (whining, crying)
  □ Changes in bathroom habits
  □ Fever (feels warm)
  □ Shaking or trembling
  □ None of the above
- Navigation: Back | Next

Step 5: Recent Changes
- Question: "Any recent changes or exposures?"
- Text area (optional, 500 char limit)
- Placeholder: "New food, environment changes, ingested anything unusual, etc."
- Navigation: Back | Assess Now (submit)

Loading State (after submit):
- Animation: Pulsing pet icon
- Text: "Assessing [Pet Name]'s symptoms..."
- Subtext: "Our AI is analyzing based on veterinary guidelines"
```

**Kiro Workflow: Symptom Assessment**

```
Trigger: "Assess Now" button clicked

Steps:
1. Collect all form data:
   - symptom_selected
   - duration
   - severity_score
   - additional_symptoms (array)
   - recent_changes_text

2. Get pet details from database:
   - species
   - age
   - breed
   - existing_conditions

3. Call Kiro AI Action: "Veterinary Symptom Assessment"
   
   AI Prompt:
   """
   You are a veterinary triage assistant. Assess the following symptoms and provide guidance.
   
   Pet Information:
   - Species: {species}
   - Age: {age} years
   - Breed: {breed}
   - Existing conditions: {conditions}
   
   Current Symptoms:
   - Main concern: {symptom_selected}
   - Duration: {duration}
   - Severity (1-10): {severity_score}
   - Additional symptoms: {additional_symptoms}
   - Recent changes: {recent_changes_text}
   
   Please provide:
   1. Triage Level: GREEN (monitor at home), YELLOW (schedule vet appointment), or RED (seek emergency care)
   2. Brief explanation (2-3 sentences) of why this triage level
   3. Specific recommendations (3-5 bullet points)
   4. Red flag symptoms to watch for
   5. Estimated timeframe for action (if YELLOW: "within 24-48 hours", if RED: "immediately")
   
   Respond in JSON format:
   {
     "triage_level": "GREEN|YELLOW|RED",
     "explanation": "...",
     "recommendations": ["...", "...", "..."],
     "red_flags": ["...", "..."],
     "action_timeframe": "...",
     "confidence": "high|medium|low"
   }
   
   CRITICAL: Always err on the side of caution. When in doubt, recommend veterinary consultation.
   """

6. Parse AI response (JSON)

7. Create health_record:
   - pet_id = current pet
   - record_type = "Symptom"
   - title = symptom_selected
   - description = User's input summary
   - symptom_category = Extracted from symptom_selected
   - severity = Based on severity_score
   - triage_level = AI's triage_level
   - ai_assessment = AI's explanation
   - created_by_user_id = current user

6. Navigate to Results Page with assessment data
```

**Results Page (/symptom-checker/results)**

```
Layout: Centered, max-width 800px

[Triage Level Banner]
Full-width, color-coded:
- GREEN: bg-success, text-gray-800
- YELLOW: bg-warning, text-gray-800
- RED: bg-error, text-white

Banner content:
- Large icon (🟢/🟡/🔴)
- Triage level text: "MONITOR AT HOME" / "SCHEDULE APPOINTMENT" / "SEEK EMERGENCY CARE"
- Action timeframe: "within 24-48 hours" or "immediately"

[Assessment Summary Card]

Section: What We Found
- AI's explanation (from AI response)
- Based on: List the symptoms analyzed

Section: Our Recommendations
Numbered list (from AI recommendations array)
Each recommendation as a card with icon:
1. ✓ Withhold food for 12 hours
2. ✓ Provide small amounts of water frequently
3. ✓ Monitor for worsening symptoms
etc.

Section: When to Seek Immediate Care
- Warning header: "⚠️ Call your vet immediately if:"
- Bulleted list of red flag symptoms (from AI response)
- Each with warning icon

Section: What to Do Next
Conditional based on triage_level:

If GREEN:
- "Continue monitoring [Pet Name] closely"
- "Record any changes in our Health Log"
- Buttons:
  - "Save to Health Log" (primary)
  - "Start New Check"
  - "Talk to PawPal" (voice)

If YELLOW:
- "We recommend scheduling a vet appointment soon"
- Buttons:
  - "Find Nearby Vets" → Map view
  - "Call My Vet" (if saved) → Tel link
  - "Schedule Appointment" → Calendar
  - "Save to Health Log"

If RED:
- "This requires urgent attention"
- Large emergency buttons:
  - "📍 Nearest Emergency Vet" → Map with directions
  - "📞 Call Emergency Vet" → Auto-dial
  - "🚗 Get Directions" → Google Maps
- Show nearest 24/7 vet clinic info card:
  - Name, address, phone (from database or API)
  - Distance: "1.2 miles away"
  - ETA: "5 min drive"

[Footer Actions]
- "Print Assessment" button
- "Email to Myself" button
- "Share with Vet" button (generates PDF)

Kiro Workflow on "Save to Health Log":
1. Already created in previous workflow
2. Just show confirmation toast
3. Navigate back to dashboard
```

**PAGE 8: Medications (/medications)**

```
Layout: Single column, max-width 900px

[Page Header]
- Title: "💊 Medications for [Pet Name]"
- Pet switcher (if multiple pets)
- "+ Add Medication" button (primary, large)

[Today's Medications Section]
Title: "Today's Schedule"

Repeating group: medication_logs
Filter: pet_id = current, DATE(scheduled_datetime) = TODAY
Sort: scheduled_datetime ASC

Each medication row (card design):
- Left side:
  - Large time badge: "8:00 AM" (gray-600, bold)
  - Medication name: "Carprofen 75mg"
  - Subtext: "For: Hip pain" (gray-500)
  - Icon if with_food: "🍽️ Give with food"
- Right side:
  - Status badge:
    - Pending: Yellow "Due"
    - Given: Green "✓ Given at [actual_time]"
    - Missed: Red "Missed"
  - Action button (if Pending):
    - "Mark as Given" → Workflow update
    - "Snooze 30 min" → Reschedule
    - "Skip this dose" → Mark skipped

Empty state: "No medications scheduled for today. Great!"

[Upcoming Doses - Next 7 Days]
Title: "This Week"
Calendar mini-view or list grouped by date
Shows all scheduled doses
Click to expand day

[Refill Alerts]
Conditional: Show only if ANY medication.needs_refill = true

Alert banner (warning yellow):
- Icon: 🔔
- Text: "[Med name] running low - [X] doses remaining"
- Action button: "Order Refill"
  - Opens modal with:
    - Vet clinic phone (clickable)
    - Option to email vet
    - Mark as "Refill ordered" (adds note)

[All Medications List]
Title: "All Medications for [Pet Name]"
Toggle: Show Active | Show All (including discontinued)

Repeating group: medications
Filter: pet_id = current, is_active = true (or all)
Sort: created_at DESC

Each medication card (expandable):
Collapsed view:
- Medication name (large, bold)
- Dosage + frequency
- Pill count: "28 doses remaining"
- Status badge: "Active" (green) or "Discontinued" (gray)
- Actions: Edit | Discontinue | Delete

Expanded view (click to expand):
- All details:
  - Reason for medication
  - Prescribing vet
  - Start date → End date
  - Schedule times
  - With food requirement
  - Instructions
  - Refill threshold
- Adherence chart (last 30 days)
  - Show % of doses taken on time
  - Mini calendar heatmap (green = given, red = missed)
- Button: "View History" → See all logs for this med

Empty state: "No medications yet. Add one to get started!"

[Add Medication Modal]
Triggered by: "+ Add Medication" button

Form fields:
1. Medication Name (text input, required)
   - Autocomplete from common pet meds database
2. Dosage (text input, e.g., "75mg" or "1 tablet")
3. What's it for? (text input, e.g., "Arthritis")
4. How often? (dropdown)
   - Once daily
   - Twice daily
   - Three times daily
   - Every 8 hours
   - Every 12 hours
   - As needed
   - Weekly
5. Schedule times (time pickers, conditional on frequency)
6. Give with food? (toggle switch)
7. Start date (date picker, default: today)
8. Duration (dropdown):
   - Ongoing (no end date)
   - 7 days
   - 14 days
   - 30 days
   - Custom (shows end date picker)
9. Total quantity (number input, e.g., "90 pills")
10. Alert me when down to ___ doses (number, default: 7)
11. Prescribing vet (text input, optional)
12. Special instructions (textarea, optional)

Buttons:
- "Cancel" (close modal)
- "Add Medication" (primary, creates record + schedules logs)

Kiro Workflow on Add:
1. Create medication record
2. Calculate and create medication_log entries for next 30 days
3. Set up Kiro Scheduled Workflow for daily log creation
4. Show success toast: "✓ [Med name] added for [Pet name]"
5. Close modal, refresh page
```

**Kiro Scheduled Workflow: Daily Medication Log Creator**

```
Schedule: Every day at 12:01 AM

Steps:
1. Get all active medications (is_active = true, end_date = null OR end_date >= TODAY)
2. For each medication:
   - Calculate today's scheduled times based on frequency and time_slots
   - Create medication_log records:
     - scheduled_datetime = TODAY + time_slot
     - status = "Pending"
3. Schedule reminder notifications:
   - Send notification 15 minutes before each scheduled_datetime
   - Notification content: "💊 Time for [Pet name]'s [med name]"
```

**PAGE 9: Voice Assistant (Kiro AI Chat Integration)**

```
Component: Kiro AI Chat Widget
Position: Floating bottom-right OR full-screen modal

Activation methods:
1. Click floating microphone button
2. Keyboard shortcut: Cmd/Ctrl + K
3. Say wake word: "Hey PawPal" (if browser supports)

[Chat Interface Design]

Header:
- "🐾 PawPal Assistant"
- Pet selector dropdown (to set context)
- Close button (X)

Chat area:
- Messages (scrollable)
- User messages: Right-aligned, blue background
- AI messages: Left-aligned, white background with pet avatar

Message types:
- Text
- Voice (with play button if voice input)
- Quick action buttons (e.g., "Log this symptom" after discussing)
- Cards (e.g., medication info card)

Input area:
- Text input field: "Ask about [Pet Name]..."
- Microphone button (hold to speak, release to send)
- Send button
- Voice indicator (when listening): Animated waveform

Quick prompts (suggested questions):
- "Did I give Max his medicine today?"
- "Check symptoms: vomiting"
- "When should I feed Bella?"
- "Is chocolate toxic to dogs?"
- "Find emergency vet"
```

**Kiro AI Assistant Configuration:**

```
AI Model: GPT-4 Turbo
Context Window: Last 10 messages + Pet data

System Prompt:
"""
You are PawPal, a caring and knowledgeable AI veterinary assistant. Your role is to help pet owners care for their animals with warmth, accuracy, and appropriate medical caution.

Current Context:
- User: {user_name}
- Current Pet: {pet_name}, {species}, {age} years old, {breed}
- Existing conditions: {special_conditions}
- Current medications: {medication_list}

Your Personality:
- Warm, friendly, and reassuring (like a caring vet nurse)
- Professional but approachable
- Never alarmist, but always appropriately cautious
- Use the pet's name frequently to personalize responses
- Keep responses concise (under 100 words unless explaining medical info)

Your Capabilities:
1. Answer questions about pet health, nutrition, behavior, grooming
2. Check medication schedules and log doses
3. Assess symptoms (but always recommend vet for serious concerns)
4. Provide feeding guidance
5. Find emergency vets
6. Log health information

Safety Protocols:
- NEVER diagnose serious medical conditions
- ALWAYS recommend vet consultation for concerning symptoms
- For emergencies (breathing difficulty, seizures, severe bleeding, poisoning, collapse), immediately recommend emergency vet
- Clearly distinguish: "monitor at home" vs "call vet" vs "emergency"
- Never recommend specific medications without vet approval
- Acknowledge limitations: "I'm an AI assistant to support you, but your vet knows {pet_name} best"

Triage Levels (use color-coded indicators):
🟢 GREEN: Minor issues, monitor at home
🟡 YELLOW: Schedule vet appointment soon
🔴 RED: Seek emergency care immediately

Tone Examples:
- Question about food: "Great question! For a {age}-year-old {breed}, I'd recommend..."
- Symptom concern: "I understand you're worried about {pet_name}. Let me help assess this..."
- Emergency: "This sounds urgent. {Pet_name} needs to see a vet right away. I'm finding the nearest emergency clinic now..."

When responding:
1. Address the pet by name
2. Be specific and actionable
3. If data is available in the system, reference it ("According to {pet_name}'s records...")
4. Offer to perform actions ("Should I log this for you?" "Would you like me to find a vet?")
5. End with helpful follow-up question if appropriate

Remember: You're here to help, support, and guide - not to replace veterinary care.
"""

Function Calling (Kiro Actions):
Enable these function calls for the AI to trigger:

1. check_medication_status(pet_id, date)
   Returns: Today's medication schedule and completion status

2. log_medication(medication_log_id, actual_time)
   Action: Updates medication log as "Given"

3. create_health_record(pet_id, title, description, record_type)
   Action: Creates a new health record entry

4. find_emergency_vet(user_location)
   Action: Queries Google Maps API for nearest 24/7 vet
   Returns: Name, address, phone, distance

5. assess_symptoms(symptoms_object)
   Action: Calls symptom assessment AI (same as symptom checker)
   Returns: Triage level and recommendations

6. get_feeding_schedule(pet_id)
   Returns: Today's feeding schedule

7. check_toxic_substance(substance_name, species)
   Action: Queries toxicity database
   Returns: Toxicity info and emergency actions
```

**Voice Interaction Examples:**

```
Example 1: Medication Query
User: "Did I give Max his medicine this morning?"
AI calls: check_medication_status(pet_id: max_id, date: today)
AI: "Let me check Max's records... Yes! You logged his Carprofen 75mg at 8:15 AM this morning. His next dose is scheduled for 8:00 PM tonight. I'll remind you! 💊"

Example 2: Symptom Assessment
User: "Max has been coughing a lot today"
AI: "I'm sorry to hear Max isn't feeling well. Let me ask a few quick questions to assess:
1. How long has the coughing been happening?
2. Is it a dry cough or does it sound wet/productive?
3. Any other symptoms like lethargy or loss of appetite?"

[User provides answers]

AI calls: assess_symptoms({symptom: "coughing", duration: "1 day", type: "dry", additional: "none"})
AI: "Based on what you've shared, this seems like a 🟡 YELLOW situation. Max should see a vet within the next couple of days to check for respiratory issues. 

In the meantime:
• Keep him calm and avoid strenuous activity
• Ensure he's drinking water
• Monitor for worsening symptoms

Should I help you schedule an appointment with Oakwood Animal Hospital? I can also save this to Max's health log."

Example 3: Emergency
User: "Max ate chocolate! What do I do?!"
AI: "🚨 This is urgent. How much chocolate did Max eat, and what type?"
User: "A whole Hershey bar, maybe 3 ounces"
AI calls: check_toxic_substance(substance: "milk chocolate", species: "dog")
AI calls: find_emergency_vet(user_location)

AI: "🔴 EMERGENCY - Max needs to see a vet immediately. Chocolate toxicity can be serious.

**What to do NOW:**
1. Call your vet or go to the emergency clinic
2. Bring the chocolate wrapper
3. Do NOT try to make him vomit without vet guidance

**Nearest Emergency Vet:**
🏥 BluePearl Emergency Pet Hospital
📍 1.2 miles away (5 min drive)
📞 (555) 123-4567

I can call them for you or give you directions. Which would help?"

Example 4: Quick Log
User: "Log that I fed Max at 7:30"
AI calls: get_feeding_schedule(pet_id: max_id)
AI calls: create_feeding_log(schedule_id, actual_time: "7:30 AM")
AI: "✓ Got it! I've logged Max's breakfast at 7:30 AM. His next meal (dinner) is scheduled for 6:00 PM. 🍖"
```

---

### Phase 4: Additional Pages & Features

**PAGE 10: Health Dashboard (/health)**

```
[Dashboard Header]
- Title: "📊 Health Dashboard - [Pet Name]"
- Date range selector:
  - Buttons: 7 Days | 30 Days | 90 Days | 1 Year | Custom
  - Default: 30 Days
- Export button: "Download Report" (PDF)

[Key Metrics - 4 Cards Row]

Card 1: Current Weight
- Large number: 72 lbs
- Change indicator: ↑ 2.1 lbs (+3%)
- Subtext: "since last month"
- Mini sparkline chart
- Status: "Above ideal range" (yellow) or "Healthy" (green)

Card 2: Health Status
- Icon: 🟢 or 🟡 or 🔴
- Text: "All Good" or "Needs Attention"
- Based on: Recent symptoms, overdue tasks
- Last checkup: "2 months ago"

Card 3: Medication Adherence
- Percentage: 94%
- Subtext: "23 of 24 doses on time"
- Progress ring visualization
- Color: Green if >90%, yellow if 70-90%, red if <70%

Card 4: Next Care Event
- Icon based on type (💉 vaccine, 🩺 checkup, etc.)
- Event: "Rabies vaccine"
- Days until: "in 45 days"
- Action: "Schedule Now" button

[Weight Trend Chart]
- Title: "Weight Over Time"
- Line chart (Kiro Chart Component)
- Data source: health_records where record_type = "Weight"
- X-axis: Dates
- Y-axis: Weight (with unit)
- Ideal weight range (shaded horizontal band)
- Data points (dots on line, hoverable for exact value)
- Goal weight line (dashed, if set by user)

[Activity & Symptoms Timeline]
- Title: "Recent Activity"
- Horizontal timeline (last 30 days)
- Each day is a column
- Markers for:
  - Symptoms logged (red dot, size = severity)
  - Vet visits (blue square)
  - Weight logs (green triangle)
  - Medications missed (yellow x)
- Click any marker → Opens detail popup

[Symptom Breakdown]
- Title: "Symptoms This Period"
- Pie chart or bar chart
- Categories: Digestive, Respiratory, Skin, Behavioral, etc.
- Count or percentage for each
- Click segment → Filter timeline to that category

[Medication Calendar Heatmap]
- Title: "Medication Adherence"
- Calendar grid (like GitHub contributions)
- Each day is a square
- Color intensity = % of meds given on time
  - Dark green: 100%
  - Light green: 75-99%
  - Yellow: 50-74%
  - Red: <50%
  - Gray: No meds scheduled
- Hover shows exact stats for that day

[Health Milestones]
- Title: "Vaccination & Preventive Care"
- Table format
- Columns: Type | Last Done | Next Due | Status
- Rows:
  - Rabies vaccine
  - DHPP vaccine
  - Bordetella
  - Heartworm prevention
  - Flea/tick prevention
  - Dental cleaning
- Status badges:
  - "Up to date" (green)
  - "Due soon" (yellow)
  - "Overdue" (red)
- Action button per row: "Schedule" or "Log Completed"

[AI Insights Panel]
- Title: "Health Insights for [Pet Name]"
- Generated weekly via Kiro Scheduled Workflow
- Card with icon: 💡
- Content: AI-generated insights based on data
  Example: "Max's weight has increased 3% this month. Consider reducing portion sizes slightly or increasing exercise. His medication adherence is excellent at 94%!"
- "Refresh Insights" button → Triggers AI analysis
- Date generated: "Last updated: 2 days ago"

[Recent Health Log Entries]
- Title: "Recent Health Records"
- List view (last 10 entries)
- Each entry: Date | Type | Title
- Click to expand details
- "View All" button → Navigate to full health log
```

**Kiro Workflow: Generate Weekly Health Insights**

```
Trigger: Scheduled - Every Sunday at 8:00 AM

For each active pet:

1. Query health data (last 7 days):
   - Weight logs
   - Symptoms logged
   - Medication adherence rate
   - Feeding logs
   - Any vet visits

2. Call Kiro AI Action: "Health Insights Generator"

   Prompt:
   """
   Analyze this pet's weekly health data and generate insights:
   
   Pet: {pet_name}, {species}, {breed}, {age} years old
   Ideal weight: {ideal_weight} lbs
   
   This Week's Data:
   - Weight: {current_weight} lbs (change: {weight_change} from last week)
   - Symptoms logged: {symptom_count} ({symptom_types})
   - Medication adherence: {adherence_percentage}%
   - Meals logged: {feeding_count} of {expected_feeding_count}
   - Vet visits: {vet_visit_count}
   
   Previous 4 Weeks for Comparison:
   - Average weight: {avg_weight_4weeks}
   - Average adherence: {avg_adherence_4weeks}%
   
   Provide:
   1. Overall health summary (1-2 sentences, positive and encouraging)
   2. 2-3 specific observations (things going well)
   3. 1-2 areas of concern (if any)
   4. 1 actionable recommendation
   
   Tone: Encouraging, specific, actionable, caring
   Format: Natural prose, 100-150 words total
   
   Example output:
   "Max is doing great this week! His medication adherence remains excellent at 94%, and he's staying active. I noticed his weight has increased slightly to 72 lbs - 2 lbs above his ideal range. This isn't urgent, but consider reducing his portions by about 10% or adding an extra walk. His energy levels seem normal based on your logs. Keep up the great work tracking his health! 🐾"
   """

3. Store AI response in health_records:
   - record_type = "General Note"
   - title = "Weekly Health Insights"
   - description = AI response
   - created_by = system

4. Send notification to user:
   - Push notification: "📊 [Pet name]'s weekly health report is ready!"
   - Email (if enabled): Include insights + link to dashboard

5. Repeat for next pet
```

**PAGE 11: Appointments (/appointments)**

```
[Page Header]
- Title: "📅 Vet Appointments"
- "+ Schedule Appointment" button

[Calendar View - Default]
- Month view calendar (Kiro Calendar Component)
- Days with appointments highlighted
- Color coding:
  - Blue: Regular checkup
  - Green: Vaccination
  - Yellow: Follow-up
  - Red: Urgent/Surgery
- Click any day → Shows appointments for that day

[Switch to List View Button]

[Upcoming Appointments List]
Repeating group: vet_appointments
Filter: appointment_datetime >= TODAY
Sort: appointment_datetime ASC

Each appointment card:
- Date & Time (large, bold)
- Days until: "in 3 days" (badge)
- Pet name (with small avatar)
- Clinic name + icon
- Reason/Type
- Reminder status: "✓ Reminders set" or "Set reminder"
- Actions:
  - "View Details" (expand)
  - "Reschedule"
  - "Cancel"
  - "Get Directions" (Google Maps)
  - "Call Clinic" (tel: link)

Expanded details:
- Full address
- Veterinarian name
- Preparation checklist (auto-generated based on type):
  Example for checkup:
  □ Bring vaccine records
  □ List of current medications
  □ Recent symptoms or concerns
  □ Fecal sample (if requested)
- Notes field (editable)

[Past Appointments]
- Collapsible section: "View Past Appointments"
- Filter: appointment_datetime < TODAY, status = "Completed"
- Each card shows:
  - Date
  - Clinic
  - Reason
  - Visit notes (if logged)
  - "View Details" → See full notes, diagnosis, treatment

[Schedule Appointment Modal]
Form:
1. Pet (dropdown, if multiple)
2. Date & Time (datetime picker)
3. Clinic name (text, with autocomplete from previous)
4. Veterinarian (text, optional)
5. Clinic phone (text)
6. Clinic address (text)
7. Appointment type (dropdown)
8. Reason (textarea)
9. Reminders:
   - □ 24 hours before
   - □ 2 hours before
   - □ Email reminder
   - □ Push notification

Buttons: Cancel | Schedule

Kiro Workflow on Schedule:
1. Create vet_appointment record
2. Create Kiro Scheduled Workflows for reminders:
   - 24h before: Send notification "🩺 Reminder: [Pet] has vet appointment tomorrow at [time]"
   - 2h before: Send notification "🩺 [Pet]'s vet appointment is in 2 hours"
3. Add to user's calendar (if calendar integration enabled)
4. Show success: "✓ Appointment scheduled for [Pet]"
```

**PAGE 12: Grooming (/grooming)**

```
[Page Header]
- Title: "✂️ Grooming Schedule - [Pet Name]"
- Pet switcher
- "+ Add Grooming Task" button

[Overdue Tasks Alert]
Conditional: Show if any task is_overdue = true
- Red banner: "⚠️ You have {count} overdue grooming tasks"
- List overdue tasks
- "Mark all as done" bulk action

[Grooming Calendar]
- Current month view
- Each day shows tasks due (icons)
- Color-coded dots:
  - Purple: Brushing
  - Blue: Bathing
  - Orange: Nail trim
  - Green: Ear cleaning
  - Pink: Teeth brushing

[Grooming Tasks List]
Repeating group: grooming_tasks
Filter: pet_id = current, is_active = true
Sort: next_due_date ASC

Each task card:
- Icon (based on task_type)
- Task name (large)
- Frequency: "Every 7 days"
- Last done: "3 days ago"
- Next due: "in 4 days" or "Overdue by 2 days" (red)
- Progress bar (visual indicator of time since last done)
- Action buttons:
  - "Mark Complete" → Updates last_completed_date to TODAY
  - "Reschedule"
  - "Edit" | "Delete"

[Breed-Specific Grooming Guide]
- Conditional section based on pet breed
- Title: "Grooming Guide for {breed}"
- Auto-populated content (from database or AI-generated)
- Sections:
  - Coat type
  - Recommended brushing frequency
  - Bathing tips
  - Special considerations
  - Video tutorial (embedded, if available)

[Add Grooming Task Modal]
Form:
1. Task type (dropdown with icons)
2. Frequency (number + unit):
   - Every ___ days/weeks/months
3. Last completed (date picker, default: today)
4. Notes (textarea, optional)

Buttons: Cancel | Add Task

Kiro Workflow:
1. Create grooming_task record
2. Calculate next_due_date
3. Create reminder notification (scheduled 1 day before due)
```

**PAGE 13: Emergency (/emergency)**

```
Layout: Full-screen, urgent design
Background: Subtle red tint

[Warning Header]
- Large icon: 🚨
- Title: "EMERGENCY GUIDANCE"
- Subtext: "Stay calm. We're here to help {Pet Name}."

[Quick Assessment]
- Large question: "What's happening?"
- Button grid (large, urgent style):
  - 🫁 Difficulty Breathing
  - 🩸 Severe Bleeding
  - 💊 Poisoning / Ate Something Toxic
  - 🤕 Seizure or Collapse
  - 🔥 Heatstroke / Overheating
  - ⚡ Hit by Car / Trauma
  - 🤮 Severe Vomiting/Diarrhea (with blood)
  - 💔 Other Emergency

On selection → Triggers specific emergency protocol

[Nearest Emergency Vet - Always Visible]
Card (prominent, green border):
- Title: "🏥 Nearest 24/7 Emergency Vet"
- Clinic name
- Distance: "1.2 miles"
- ETA: "5 min drive"
- Phone: Large, clickable
- Large action buttons:
  - "📞 Call Now" (tel: link, largest button)
  - "🗺️ Get Directions" (Google Maps)
  - "ℹ️ View Details"

Details (expandable):
- Full address
- Hours: "Open 24/7"
- Services: "Full emergency services, surgery"
- Rating: 4.8 ⭐ (if available)

[Emergency Contact Hotlines]
Card with quick-dial list:
- ASPCA Poison Control: (888) 426-4435
  "$95 consultation fee, 24/7"
- Pet Poison Helpline: (855) 764-7661
  "$75 per incident, 24/7"
- Your Vet: [Saved number] or "Add vet number"

[First Aid Guidance - Conditional]
Based on emergency type selected:

Example for "Difficulty Breathing":
- Urgent banner: "🔴 CALL VET IMMEDIATELY while following these steps"
- Numbered steps (large, clear):
  1. Keep {Pet Name} calm and quiet
  2. Loosen collar if wearing one
  3. Ensure airways are clear
  4. Note breathing rate and color of gums
  5. Do NOT attempt CPR unless trained
  6. Get to emergency vet NOW
- Warning: "Do NOT delay getting to the vet"

Example for "Poisoning":
- Input field: "What did {Pet Name} ingest?"
- After input → Shows specific toxicity info and actions
- "Bring the packaging/substance with you to the vet"

[Prepare for Vet Visit Checklist]
Auto-shown after emergency type selected:
- □ Bring ID and insurance info
- □ Bring any substance ingested (if poisoning)
- □ Have someone drive you (if possible)
- □ Call ahead to let them know you're coming
- □ Stay calm - {Pet Name} can sense your stress

[Voice-Guided First Aid]
- Button: "🎙️ Voice-Guided Instructions"
- Activates Kiro AI voice assistant in emergency mode
- Walks user through first aid step-by-step
- Firm, clear, calm voice tone
- Includes timing (e.g., "Check breathing every 30 seconds")

[Log This Emergency]
- After immediate crisis:
- Button: "Save Emergency Report"
- Auto-creates detailed health_record with:
  - Timestamp
  - Emergency type
  - Actions taken
  - Vet visited
  - Outcome (to be filled in later)
```

**Kiro Emergency AI Assistant Mode:**

```
Trigger: Emergency page activated

AI Mode: Emergency Override
Voice: Firm, clear, measured pace
Interrupt: User can interrupt anytime with "stop" or "help"

System Prompt:
"""
You are now in EMERGENCY MODE for {pet_name}.

Your role:
1. Provide immediate, life-saving guidance
2. Keep the pet owner calm but focused
3. Give clear, step-by-step instructions
4. Emphasize getting to vet ASAP

Emergency type: {emergency_type}

Guidelines:
- Speak clearly and firmly
- Keep instructions simple and actionable
- Repeat critical info twice
- Ask for confirmation: "Do you understand? Say yes or no."
- Check in frequently: "How is {pet_name} doing now?"
- Never downplay urgency
- Always end with: "You're doing great. Keep going. {Pet_name} needs you to get to the vet now."

Example for Difficulty Breathing:
"I'm here to help. Listen carefully.

First, is {pet_name} conscious right now? Say yes or no.

[User: Yes]

Good. Here's what to do:

Step 1: Keep {pet_name} calm. Speak softly and don't panic.

Step 2: Remove any collar or tight clothing around the neck.

Step 3: Look at {pet_name}'s gums. Are they pink, blue, or white?

[User responds]

You're doing great. Now, count {pet_name}'s breaths for 15 seconds. How many?

[User responds]

Okay, that's [X breaths per minute]. This is urgent. 

Step 4: Call the emergency vet NOW. I'll show you the number. Tell them you're on your way with a dog having breathing difficulty.

Step 5: Get {pet_name} to the vet immediately. Can someone drive you?

You're handling this well. Keep {pet_name} calm on the way. The vet will take care of everything. Go now."
"""

Features:
- Timer function: "I'll check back in 30 seconds"
- Coaching breathing: "Take a deep breath with me. In... out..."
- Location sharing: "Do you want me to share your location with the vet?"
```

---

### Phase 5: Advanced Features & Integrations

**Integration 1: Google Maps API (for Vet Locator)**

```
Kiro API Connector Setup:

API Name: Google Maps Places
Base URL: https://maps.googleapis.com/maps/api/place

Action 1: Find Nearby Emergency Vets
Endpoint: /nearbysearch/json
Method: GET
Parameters:
- location: {user_lat},{user_long}
- radius: 40000 (25 miles in meters)
- type: veterinary_care
- keyword: emergency OR 24 hour
- key: {GOOGLE_MAPS_API_KEY}

Response mapping:
- results[].name → clinic_name
- results[].vicinity → address
- results[].geometry.location → lat/long
- results[].rating → rating
- results[].opening_hours.open_now → is_open

Action 2: Get Place Details
Endpoint: /details/json
Method: GET
Parameters:
- place_id: {place_id}
- fields: formatted_phone_number,opening_hours,website,reviews
- key: {GOOGLE_MAPS_API_KEY}

Use in Emergency page workflow:
1. Get user location (browser geolocation API)
2. Call "Find Nearby Emergency Vets"
3. Sort by distance
4. Display top 3 results
5. For selected clinic, call "Get Place Details"
```

**Integration 2: Twilio (for SMS Reminders)**

```
Kiro API Connector Setup:

API Name: Twilio
Base URL: https://api.twilio.com/2010-04-01/Accounts/{ACCOUNT_SID}

Action: Send SMS
Endpoint: /Messages.json
Method: POST
Authentication: Basic Auth (Account SID + Auth Token)
Body:
- To: {user_phone_number}
- From: {TWILIO_PHONE_NUMBER}
- Body: {message_text}

Use cases:
1. Medication reminder SMS
2. Appointment reminder SMS
3. Emergency: "Pet emergency logged for {pet_name} at {time}. Contact info saved."

Kiro Workflow Example: SMS Medication Reminder
Trigger: Scheduled (30 min before medication time)
Steps:
1. Get medication details
2. Get user phone number
3. Call Twilio API:
   Body: "💊 Reminder: It's almost time for {pet_name}'s {medication_name}. Due at {time}."
4. Log reminder sent
```

**Integration 3: SendGrid (for Email Reports)**

```
Kiro API Connector Setup:

API Name: SendGrid
Base URL: https://api.sendgrid.com/v3

Action: Send Email
Endpoint: /mail/send
Method: POST
Headers:
- Authorization: Bearer {SENDGRID_API_KEY}
- Content-Type: application/json

Body:
{
  "personalizations": [{
    "to": [{"email": "{user_email}"}],
    "subject": "{subject}"
  }],
  "from": {"email": "noreply@pawpal.com", "name": "PawPal"},
  "content": [{
    "type": "text/html",
    "value": "{html_body}"
  }]
}

Email Templates to Create:

1. Welcome Email
Subject: "Welcome to PawPal! 🐾"
Body: Friendly welcome, quick start guide, links to features

2. Weekly Health Report
Subject: "{Pet_name}'s Weekly Health Summary 📊"
Body: Include:
- Weight trend chart (image)
- Medication adherence
- AI insights
- Upcoming care
- CTA: "View Full Dashboard"

3. Appointment Reminder
Subject: "Reminder: {Pet_name}'s vet appointment tomorrow"
Body:
- Date/time/location
- Preparation checklist
- Clinic phone number
- CTA: "View Appointment Details"

4. Medication Refill Alert
Subject: "{Med_name} running low for {Pet_name}"
Body:
- Days remaining
- Vet contact info
- CTA: "Order Refill"

Kiro Workflow: Send Weekly Report
Trigger: Scheduled (every Sunday)
Steps:
1. For each user with email notifications enabled:
2. For each of their pets:
3. Query health data (last 7 days)
4. Generate AI insights
5. Create chart images (weight trend, adherence)
6. Populate email template
7. Call SendGrid API
8. Log email sent
```

---

### Phase 6: Pet-Friendly UI Components Library

**Custom Kiro Components to Build:**

**Component 1: Pet Avatar Selector**

```
Purpose: Animated pet avatar with species selection

Design:
- Circular avatar (120px diameter)
- Upload photo option OR choose illustration
- If illustration: Grid of pre-made pet illustrations
  - Dogs: 10 breed illustrations
  - Cats: 8 breed illustrations
  - Birds: 5 species
  - Rabbits, hamsters, etc.
- Selected avatar shows with subtle animation:
  - Dogs: Tail wag (rotate transform, 2s ease)
  - Cats: Ear twitch
  - Birds: Wing flutter
- Edit mode: Click to change
```

**Component 2: Health Status Badge**

```
Purpose: Visual health indicator

Variants:
- 🟢 Excellent: All metrics good, no concerns
- 🟡 Monitor: Some mild issues or upcoming care
- 🔴 Attention: Symptoms logged, overdue tasks, or urgent

Design:
- Pill shape (border-radius: full)
- Icon + Text
- Pulsing animation for Red
- Glow effect on hover
- Tooltip on hover: "Based on: [reasons]"
```

**Component 3: Medication Pill Counter**

```
Purpose: Visual display of remaining doses

Design:
- Container: Pill bottle illustration
- Pills inside (little circles/capsules)
- Visual depletion: Pills decrease as doses logged
- Color:
  - Green: >14 doses
  - Yellow: 7-14 doses
  - Red: <7 doses
- Shake animation when critically low
- Number display: "28 remaining"
```

**Component 4: Timeline Entry**

```
Purpose: Consistent health history display

Design:
- Vertical line on left (colored by type)
- Dot at time point
- Card extending right
- Card contains:
  - Icon (top-left)
  - Date (top-right, gray)
  - Title (bold)
  - Description (gray text, collapsible if long)
  - Tags (if applicable): severity, category
  - Attachments (thumbnail preview)
  - Actions: Edit | Delete
- Hover: Card lifts (shadow)
```

**Component 5: Progress Ring**

```
Purpose: Show percentage completion (e.g., adherence)

Design:
- Circular progress indicator
- Percentage in center (large)
- Ring fills clockwise
- Color based on percentage:
  - 90-100%: Green
  - 70-89%: Yellow
  - <70%: Red
- Animated fill (on page load)
- Label below: "Medication Adherence"
```

**Component 6: Quick Action Card**

```
Purpose: Feature entry point

Design:
- White card, rounded-xl
- Icon (64px, colored, top-left)
- Title (text-xl, bold)
- Description (text-sm, gray)
- Arrow icon (bottom-right)
- Colored left border (4px, accent color)
- Hover effects:
  - Lift (translateY: -4px)
  - Shadow increase
  - Icon subtle bounce
- Click: Navigate to feature
```

---

### Phase 7: Testing & Quality Assurance

**Kiro Testing Checklist:**

```
Database Tests:
□ All tables created correctly
□ Relationships working (pet → medications, etc.)
□ Formulas calculating properly (age, next_due_date)
□ Data validation enforced

Workflow Tests:
□ User signup creates record
□ Pet creation workflow completes
□ Medication log auto-creation works
□ Scheduled workflows run on time
□ AI API calls successful
□ Email/SMS sending works

Page Tests:
□ All pages load without errors
□ Navigation works
□ Forms validate inputs
□ Repeating groups display data
□ Conditional visibility works
□ Responsive on mobile/tablet/desktop

AI Assistant Tests:
□ Voice recognition accurate (>90%)
□ AI responses appropriate
□ Function calling works
□ Emergency mode triggers correctly
□ Context maintained in conversation

Integration Tests:
□ Google Maps returns results
□ SendGrid emails deliver
□ Twilio SMS sends
□ API keys secured in environment variables

User Flow Tests:
□ New user can complete onboarding
□ User can add medication and get reminders
□ Symptom checker gives accurate triage
□ Emergency page provides immediate help
□ Health dashboard shows correct data

Performance Tests:
□ Page load time <3 seconds
□ AI response time <2 seconds
□ Database queries optimized
□ Images compressed
□ Caching implemented

Accessibility Tests:
□ Keyboard navigation works
□ Screen reader compatible
□ Color contrast sufficient
□ Alt text on images
□ Focus indicators visible

Security Tests:
□ User data private (can't see other users' pets)
□ API keys not exposed in frontend
□ Input sanitization (prevent injection)
□ HTTPS enabled
□ Password hashing (Kiro default)
```

---

### Phase 8: Launch Preparation

**Kiro Deployment Settings:**

```
Environment Variables to Set:
- OPENAI_API_KEY: {your_key}
- GOOGLE_MAPS_API_KEY: {your_key}
- SENDGRID_API_KEY: {your_key}
- TWILIO_ACCOUNT_SID: {your_sid}
- TWILIO_AUTH_TOKEN: {your_token}
- TWILIO_PHONE_NUMBER: {your_number}

Domain Setup:
- Custom domain: www.pawpal.com
- SSL: Auto (Kiro provides)
- DNS: Point to Kiro servers

SEO Settings:
- Title: "PawPal - AI-Powered Pet Health Assistant"
- Description: "Track your pet's health, get instant AI symptom checks, never miss medications. Trusted by thousands of pet parents."
- OG Image: Hero image with happy pets
- Favicon: Paw print icon

Analytics:
- Enable Kiro Analytics
- Add Google Analytics 4
- Set up conversion goals

Terms & Privacy:
- Privacy Policy page
- Terms of Service page
- Cookie consent banner
- Medical disclaimer
```

**Launch Day Checklist:**

```
Pre-Launch (1 week before):
□ Beta testing complete
□ All bugs fixed
□ Content proofread
□ Legal pages published
□ Support email set up (support@pawpal.com)
□ Social media accounts created
□ Landing page live
□ Email sequences ready

Launch Day:
□ Final testing in production
□ Monitoring dashboard open
□ Support team ready
□ Launch announcement email sent
□ Social media posts scheduled
□ Press release (if applicable)
□ Product Hunt submission (optional)

Post-Launch (first week):
□ Monitor error logs daily
□ Respond to user feedback <24h
□ Track key metrics (signups, engagement)
□ Fix any critical bugs immediately
□ Collect testimonials
□ Iterate based on feedback
```

---

## 🎓 KIRO-SPECIFIC TIPS

**Best Practices:**

1. **Use Kiro's AI Native Features:**
    
    - Leverage built-in AI chat (don't rebuild from scratch)
    - Use Kiro's voice components
    - Take advantage of AI-powered form filling
2. **Database Optimization:**
    
    - Create indexes on frequently queried fields
    - Use formulas for calculated fields (age, next_due_date)
    - Limit repeating group results (paginate if needed)
3. **Workflow Efficiency:**
    
    - Batch database operations when possible
    - Use scheduled workflows for routine tasks
    - Cache AI responses for common questions
4. **UI/UX in Kiro:**
    
    - Build reusable components for consistency
    - Use Kiro's theme variables for colors
    - Test responsive breakpoints thoroughly
5. **Performance:**
    
    - Lazy load images
    - Optimize repeating group queries
    - Compress uploaded images
    - Use Kiro's CDN for static assets

---

## 💰 ESTIMATED COSTS (Monthly)

```
Kiro Platform:
- Professional Plan: $50/month
  (Includes: Custom domain, AI features, APIs, 10K AI messages)

AI Usage (for 1000 active users):
- OpenAI API (GPT-4): ~$150-200/month
- Voice (STT/TTS): Included in Kiro

External Services:
- Google Maps API: ~$30/month
- SendGrid (Email): $15/month (40K emails)
- Twilio (SMS): $20/month (if using SMS, optional)

Total: ~$265-315/month

Scales with usage. Optimize with caching and batch operations.
```

---

This complete Kiro implementation guide gives you everything needed to build PawPal from scratch in Kiro's platform. The pet-friendly UI, AI-powered features, and comprehensive health tracking create a powerful tool that pet owners will love! 🐾

Ready to build? Start with the database structure, then move to the landing page and onboarding flow. The AI assistant is the crown jewel - save that for when you're comfortable with Kiro's workflows.