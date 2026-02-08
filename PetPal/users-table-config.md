# Users Table Configuration for PawPal

## Table Setup in Kiro

**Table Name:** `users` (extends Kiro's built-in users table)

## Custom Fields to Add

### 1. Basic Information Fields

**Field: full_name**
- Type: Text
- Required: Yes
- Max Length: 100 characters
- Validation: Minimum 2 characters
- Display Name: "Full Name"

**Field: phone_number**
- Type: Text
- Required: No
- Format: Phone number validation
- Placeholder: "(555) 123-4567"
- Display Name: "Phone Number"

**Field: location**
- Type: Text
- Required: No
- Max Length: 200 characters
- Placeholder: "City, State"
- Display Name: "Location"

### 2. Veterinary Information

**Field: preferred_vet_clinic**
- Type: Text
- Required: No
- Max Length: 150 characters
- Placeholder: "Oakwood Animal Hospital"
- Display Name: "Preferred Vet Clinic"

**Field: vet_clinic_phone**
- Type: Text
- Required: No
- Format: Phone number validation
- Placeholder: "(555) 123-4567"
- Display Name: "Vet Clinic Phone"

### 3. Subscription & Status

**Field: subscription_tier**
- Type: Select (Dropdown)
- Options: 
  - "Free" (default)
  - "Premium"
- Required: Yes
- Default Value: "Free"
- Display Name: "Subscription Tier"

**Field: onboarding_completed**
- Type: Boolean (Yes/No)
- Default Value: false
- Required: Yes
- Display Name: "Onboarding Completed"

### 4. Timestamps

**Field: created_at**
- Type: DateTime
- Auto-populate: Yes (on creation)
- Required: Yes
- Display Name: "Account Created"

**Field: last_login**
- Type: DateTime
- Auto-populate: No (updated via workflow)
- Required: No
- Display Name: "Last Login"

### 5. Preferences

**Field: notification_preferences**
- Type: JSON
- Default Value: 
```json
{
  "email": true,
  "push": true,
  "sms": false
}
```
- Required: Yes
- Display Name: "Notification Preferences"

## Field Relationships

- This table extends Kiro's built-in `users` table
- Primary relationship: One user → Many pets (pets.owner_id)
- Secondary relationships:
  - One user → Many health_records (health_records.created_by_user_id)
  - One user → Many ai_conversations (ai_conversations.user_id)

## Indexes to Create

1. **Index on subscription_tier** - for filtering premium users
2. **Index on onboarding_completed** - for onboarding workflows
3. **Index on location** - for location-based features (vet finder)

## Privacy & Security Notes

- Phone numbers should be encrypted at rest
- Location data should be anonymized for analytics
- Notification preferences must respect user consent
- GDPR compliance: Allow users to export/delete their data

## Validation Rules

1. **full_name**: Must contain at least 2 characters, no special characters except spaces, hyphens, apostrophes
2. **phone_number**: Must match phone format (XXX) XXX-XXXX or international format
3. **location**: Optional but if provided, should be valid city/state format
4. **vet_clinic_phone**: Same validation as phone_number
5. **notification_preferences**: Must be valid JSON with required keys

## Default Values on User Creation

```json
{
  "subscription_tier": "Free",
  "onboarding_completed": false,
  "created_at": "AUTO_TIMESTAMP",
  "notification_preferences": {
    "email": true,
    "push": true,
    "sms": false
  }
}
```

## Kiro Workflow Triggers

1. **On User Registration**: Set default values, send welcome email
2. **On Onboarding Complete**: Update onboarding_completed to true
3. **On Login**: Update last_login timestamp
4. **On Subscription Change**: Update subscription_tier, trigger billing workflow

## Usage in PawPal Application

- **Dashboard**: Display full_name in greeting
- **Settings**: Allow editing of all custom fields
- **Onboarding**: Collect full_name, phone_number, location, vet info
- **Notifications**: Use notification_preferences to control messaging
- **Premium Features**: Check subscription_tier for feature access