# PawPal Voice Pet Care Assistant - API Documentation

## Overview

PawPal is an AI-native web application for comprehensive pet care management. This document provides detailed API documentation for all endpoints.

## Base URL

```
Production: https://api.pawpal.com/api/v1
Development: http://localhost:8000/api/v1
```

## Authentication

All protected endpoints require JWT authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Expiration
- Access tokens expire after 30 minutes
- Refresh tokens expire after 7 days
- Use the `/auth/refresh` endpoint to obtain new tokens

## API Endpoints

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "555-1234",
  "emergency_contact": "Jane Doe - 555-5678",
  "preferred_vet_clinic": "City Vet Clinic"
}
```

**Response:** `201 Created`
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Requirements:** 1.1, 1.2

---

#### POST /auth/login
Authenticate user and obtain access tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Requirements:** 1.2, 1.5, 11.3

---

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Requirements:** 11.3, 1.5

---

#### GET /auth/profile
Get current user's profile information.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "555-1234",
  "emergency_contact": "Jane Doe - 555-5678",
  "preferred_vet_clinic": "City Vet Clinic",
  "is_active": true,
  "email_verified": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Requirements:** 1.1, 1.5

---

### Pet Management Endpoints

#### POST /pets/
Create a new pet profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Buddy",
  "species": "dog",
  "breed": "Golden Retriever",
  "birth_date": "2020-01-15",
  "weight": 65.0,
  "gender": "male",
  "medical_conditions": "Hip dysplasia",
  "allergies": "Chicken",
  "behavioral_notes": "Friendly with children"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Buddy",
  "species": "dog",
  "breed": "Golden Retriever",
  "birth_date": "2020-01-15",
  "age_years": 4,
  "age_months": 2,
  "weight": 65.0,
  "gender": "male",
  "medical_conditions": "Hip dysplasia",
  "allergies": "Chicken",
  "behavioral_notes": "Friendly with children",
  "is_active": true,
  "created_at": "2024-03-15T10:30:00Z",
  "updated_at": "2024-03-15T10:30:00Z"
}
```

**Requirements:** 2.1, 2.4

---

#### GET /pets/
Get all pets for authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `include_inactive` (boolean, optional): Include inactive/deleted pets

**Response:** `200 OK`
```json
{
  "pets": [
    {
      "id": "uuid",
      "name": "Buddy",
      "species": "dog",
      "breed": "Golden Retriever",
      "age_years": 4,
      "age_months": 2
    }
  ],
  "total": 1
}
```

**Requirements:** 2.1

---

#### GET /pets/{pet_id}
Get specific pet profile.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Buddy",
  "species": "dog",
  "breed": "Golden Retriever",
  "birth_date": "2020-01-15",
  "age_years": 4,
  "age_months": 2,
  "weight": 65.0,
  "gender": "male",
  "medical_conditions": "Hip dysplasia",
  "allergies": "Chicken",
  "behavioral_notes": "Friendly with children",
  "is_active": true,
  "created_at": "2024-03-15T10:30:00Z",
  "updated_at": "2024-03-15T10:30:00Z"
}
```

**Requirements:** 2.1

---

### AI Processing Endpoints

#### POST /ai/analyze-symptoms
Analyze pet symptoms and provide triage assessment.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "symptom_input": "My dog has been vomiting and won't eat",
  "pet_id": "uuid",
  "input_type": "text"
}
```

**Response:** `200 OK`
```json
{
  "analysis_result": {
    "symptoms": "vomiting, lethargy, not eating",
    "triage_level": "Red",
    "confidence": 0.92,
    "model_used": "gpt-4-turbo"
  },
  "triage_response": {
    "level": "Red",
    "urgency": "Emergency - Immediate veterinary care required",
    "recommendations": [
      "Seek emergency veterinary care immediately",
      "Do not wait for regular clinic hours",
      "Monitor for worsening symptoms"
    ],
    "emergency_vets_needed": true
  },
  "success": true
}
```

**Requirements:** 3.1, 3.2, 3.3, 3.4, 3.5

---

#### GET /ai/health
Check AI service health status.

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "models_available": true,
  "primary_model": "gpt-4-turbo",
  "fallback_model": "gpt-3.5-turbo"
}
```

**Requirements:** 3.6

---

### Medication Management Endpoints

#### POST /medications/
Create medication prescription.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "pet_id": "uuid",
  "medication_name": "Carprofen",
  "dosage": "75mg",
  "frequency": "twice daily",
  "start_date": "2024-03-15",
  "end_date": "2024-04-15",
  "refill_threshold": 7,
  "current_quantity": 60,
  "administration_instructions": "Give with food"
}
```

**Response:** `201 Created`

**Requirements:** 5.1, 5.4

---

### Appointment Management Endpoints

#### POST /appointments/
Schedule veterinary appointment.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "pet_id": "uuid",
  "appointment_date": "2024-03-20T14:00:00Z",
  "clinic_name": "City Vet Clinic",
  "clinic_address": "123 Main St",
  "clinic_phone": "555-8888",
  "reason": "Annual checkup",
  "notes": "Vaccination due"
}
```

**Response:** `201 Created`

**Requirements:** 7.1, 7.4

---

### External Service Endpoints

#### GET /maps/emergency-vets
Find nearby emergency veterinary clinics.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `latitude` (float, required): User latitude
- `longitude` (float, required): User longitude
- `radius` (integer, optional): Search radius in meters (default: 5000)

**Response:** `200 OK`
```json
{
  "clinics": [
    {
      "name": "Emergency Vet Clinic",
      "address": "123 Main St",
      "phone": "555-9999",
      "distance": 1.2,
      "rating": 4.5,
      "open_now": true,
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  ],
  "total": 1
}
```

**Requirements:** 8.1, 8.4

---

#### POST /sms/send-urgent
Send urgent SMS notification.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "phone_number": "+15551234567",
  "message": "Urgent: Your pet's medication refill is due"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "sid": "SM123456789",
  "status": "sent"
}
```

**Requirements:** 8.2

---

#### POST /email/send-health-report
Send health report via email.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "pet_id": "uuid",
  "recipient_email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message_id": "abc123"
}
```

**Requirements:** 8.3

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Validation error message",
  "error_code": "VALIDATION_ERROR"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid or expired token",
  "error_code": "UNAUTHORIZED"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found",
  "error_code": "NOT_FOUND"
}
```

### 429 Too Many Requests
```json
{
  "detail": "Rate limit exceeded",
  "error_code": "RATE_LIMIT_EXCEEDED"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error",
  "error_code": "INTERNAL_ERROR"
}
```

### 503 Service Unavailable
```json
{
  "detail": "Service temporarily unavailable",
  "error_code": "SERVICE_UNAVAILABLE"
}
```

## Rate Limiting

- General endpoints: 100 requests per minute
- Login endpoint: 5 requests per minute
- Registration endpoint: 3 requests per hour

## Interactive API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## SDK Examples

### Python
```python
import requests

# Login
response = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={"email": "user@example.com", "password": "password"}
)
tokens = response.json()

# Use access token
headers = {"Authorization": f"Bearer {tokens['access_token']}"}
pets = requests.get(
    "http://localhost:8000/api/v1/pets/",
    headers=headers
)
```

### JavaScript
```javascript
// Login
const loginResponse = await fetch('http://localhost:8000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});
const tokens = await loginResponse.json();

// Use access token
const petsResponse = await fetch('http://localhost:8000/api/v1/pets/', {
  headers: { 'Authorization': `Bearer ${tokens.access_token}` }
});
const pets = await petsResponse.json();
```

## Webhooks

### Appointment Reminders
PawPal can send webhook notifications for appointment reminders:

```json
{
  "event": "appointment.reminder",
  "pet_id": "uuid",
  "appointment_id": "uuid",
  "appointment_date": "2024-03-20T14:00:00Z",
  "reminder_type": "24_hours"
}
```

### Medication Refill Alerts
```json
{
  "event": "medication.refill_needed",
  "pet_id": "uuid",
  "medication_id": "uuid",
  "medication_name": "Carprofen",
  "current_quantity": 5,
  "refill_threshold": 7
}
```

## Support

For API support, contact: api-support@pawpal.com
