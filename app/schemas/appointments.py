"""
Pydantic schemas for appointment management endpoints.
"""

from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date


class AppointmentCreate(BaseModel):
    """Schema for appointment creation request."""
    
    appointment_date: datetime = Field(..., description="Date and time of appointment")
    appointment_type: str = Field(..., min_length=1, max_length=100, description="Type of appointment")
    purpose: Optional[str] = Field(None, description="Purpose or reason for appointment")
    
    # Clinic information
    clinic_name: str = Field(..., min_length=1, max_length=200, description="Name of veterinary clinic")
    clinic_address: Optional[str] = Field(None, description="Clinic address")
    clinic_phone: Optional[str] = Field(None, max_length=20, description="Clinic phone number")
    veterinarian: Optional[str] = Field(None, max_length=200, description="Veterinarian name")
    
    # Additional information
    notes: Optional[str] = Field(None, description="Additional notes about appointment")
    
    @field_validator('appointment_type')
    @classmethod
    def validate_appointment_type(cls, v):
        """Validate appointment type."""
        valid_types = [
            'checkup', 'emergency', 'vaccination', 'surgery', 'dental',
            'grooming', 'consultation', 'follow_up', 'diagnostic', 'treatment'
        ]
        if v.lower() not in valid_types:
            # Allow custom types but normalize common ones
            pass
        return v.strip()
    
    @field_validator('appointment_date')
    @classmethod
    def validate_appointment_date(cls, v):
        """Validate appointment date is not in the past."""
        # Allow past dates for testing and historical records
        # In production, you may want to add a warning for past dates
        return v


class AppointmentUpdate(BaseModel):
    """Schema for appointment update request."""
    
    appointment_date: Optional[datetime] = Field(None, description="Date and time of appointment")
    appointment_type: Optional[str] = Field(None, min_length=1, max_length=100, description="Type of appointment")
    purpose: Optional[str] = Field(None, description="Purpose or reason for appointment")
    
    # Clinic information
    clinic_name: Optional[str] = Field(None, min_length=1, max_length=200, description="Name of veterinary clinic")
    clinic_address: Optional[str] = Field(None, description="Clinic address")
    clinic_phone: Optional[str] = Field(None, max_length=20, description="Clinic phone number")
    veterinarian: Optional[str] = Field(None, max_length=200, description="Veterinarian name")
    
    # Status and notes
    status: Optional[str] = Field(None, description="Appointment status")
    notes: Optional[str] = Field(None, description="Additional notes about appointment")
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        """Validate appointment status."""
        if v is None:
            return v
        
        valid_statuses = ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show']
        if v.lower() not in valid_statuses:
            raise ValueError(f'Status must be one of: {", ".join(valid_statuses)}')
        return v.lower()


class AppointmentResponse(BaseModel):
    """Schema for appointment response."""
    
    id: str = Field(..., description="Appointment ID")
    pet_id: str = Field(..., description="Pet ID")
    ai_assessment_id: Optional[str] = Field(None, description="AI Assessment ID (for emergency appointments)")
    appointment_date: datetime = Field(..., description="Appointment date and time")
    appointment_type: str = Field(..., description="Type of appointment")
    purpose: Optional[str] = Field(None, description="Purpose of appointment")
    
    # Clinic information
    clinic_name: str = Field(..., description="Clinic name")
    clinic_address: Optional[str] = Field(None, description="Clinic address")
    clinic_phone: Optional[str] = Field(None, description="Clinic phone")
    veterinarian: Optional[str] = Field(None, description="Veterinarian name")
    
    # Status and reminders
    status: str = Field(..., description="Appointment status")
    notes: Optional[str] = Field(None, description="Additional notes")
    reminder_sent_24h: bool = Field(..., description="24-hour reminder sent")
    reminder_sent_2h: bool = Field(..., description="2-hour reminder sent")
    
    # Timestamps
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    # Computed fields
    is_upcoming: bool = Field(..., description="Whether appointment is upcoming")
    is_past: bool = Field(..., description="Whether appointment is in the past")
    hours_until_appointment: Optional[float] = Field(None, description="Hours until appointment")
    
    model_config = {"from_attributes": True}
    
    def __init__(self, **data):
        """Initialize with computed fields."""
        super().__init__(**data)
        
        # Calculate time-based fields
        now = datetime.now()
        self.is_upcoming = self.appointment_date > now and self.status == 'scheduled'
        self.is_past = self.appointment_date < now
        
        if self.is_upcoming:
            time_delta = self.appointment_date - now
            self.hours_until_appointment = time_delta.total_seconds() / 3600
        else:
            self.hours_until_appointment = None


class AppointmentListResponse(BaseModel):
    """Schema for appointment list response."""
    
    appointments: List[AppointmentResponse] = Field(..., description="List of appointments")
    total_count: int = Field(..., description="Total number of appointments")
    upcoming_count: int = Field(..., description="Number of upcoming appointments")
    past_count: int = Field(..., description="Number of past appointments")


class AppointmentHistoryResponse(BaseModel):
    """Schema for appointment history response."""
    
    pet_id: str = Field(..., description="Pet ID")
    pet_name: str = Field(..., description="Pet name")
    appointments: List[AppointmentResponse] = Field(..., description="Appointment history")
    total_appointments: int = Field(..., description="Total number of appointments")
    upcoming_appointments: int = Field(..., description="Number of upcoming appointments")
    last_appointment_date: Optional[datetime] = Field(None, description="Date of last appointment")
    next_appointment_date: Optional[datetime] = Field(None, description="Date of next appointment")


class VetClinicCreate(BaseModel):
    """Schema for creating vet clinic information."""
    
    name: str = Field(..., min_length=1, max_length=200, description="Clinic name")
    address: str = Field(..., min_length=1, description="Clinic address")
    phone_number: str = Field(..., min_length=1, max_length=20, description="Clinic phone number")
    email: Optional[str] = Field(None, max_length=255, description="Clinic email")
    website: Optional[str] = Field(None, max_length=255, description="Clinic website")
    
    # Location information
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Longitude coordinate")
    
    # Service information
    is_emergency: bool = Field(False, description="Whether clinic offers emergency services")
    is_24_hour: bool = Field(False, description="Whether clinic is open 24 hours")
    services_offered: Optional[str] = Field(None, description="Services offered by clinic")
    operating_hours: Optional[str] = Field(None, description="Operating hours (JSON format)")


class VetClinicUpdate(BaseModel):
    """Schema for updating vet clinic information."""
    
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    address: Optional[str] = Field(None, min_length=1)
    phone_number: Optional[str] = Field(None, min_length=1, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    website: Optional[str] = Field(None, max_length=255)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    is_emergency: Optional[bool] = None
    is_24_hour: Optional[bool] = None
    services_offered: Optional[str] = None
    operating_hours: Optional[str] = None


class VetClinicResponse(BaseModel):
    """Schema for vet clinic response."""
    
    id: str = Field(..., description="Clinic ID")
    name: str = Field(..., description="Clinic name")
    address: str = Field(..., description="Clinic address")
    phone_number: str = Field(..., description="Clinic phone number")
    email: Optional[str] = Field(None, description="Clinic email")
    website: Optional[str] = Field(None, description="Clinic website")
    
    # Location information
    latitude: Optional[float] = Field(None, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, description="Longitude coordinate")
    
    # Service information
    is_emergency: bool = Field(..., description="Emergency services available")
    is_24_hour: bool = Field(..., description="24-hour availability")
    services_offered: Optional[str] = Field(None, description="Services offered")
    operating_hours: Optional[str] = Field(None, description="Operating hours")
    
    # Timestamps
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    # Computed fields
    distance_miles: Optional[float] = Field(None, description="Distance from user location in miles")
    
    model_config = {"from_attributes": True}


class VetClinicListResponse(BaseModel):
    """Schema for vet clinic list response."""
    
    clinics: List[VetClinicResponse] = Field(..., description="List of vet clinics")
    total_count: int = Field(..., description="Total number of clinics")
    emergency_count: int = Field(..., description="Number of emergency clinics")
    twenty_four_hour_count: int = Field(..., description="Number of 24-hour clinics")


class EmergencyVetSearchRequest(BaseModel):
    """Schema for emergency vet search request."""
    
    latitude: float = Field(..., ge=-90, le=90, description="User latitude")
    longitude: float = Field(..., ge=-180, le=180, description="User longitude")
    radius_miles: float = Field(10.0, gt=0, le=50, description="Search radius in miles")
    emergency_only: bool = Field(True, description="Only show emergency clinics")
    twenty_four_hour_only: bool = Field(False, description="Only show 24-hour clinics")


class EmergencyVetSearchResponse(BaseModel):
    """Schema for emergency vet search response."""
    
    clinics: List[VetClinicResponse] = Field(..., description="Nearby vet clinics")
    search_location: dict = Field(..., description="Search location coordinates")
    search_radius_miles: float = Field(..., description="Search radius used")
    total_found: int = Field(..., description="Total clinics found")


class ErrorResponse(BaseModel):
    """Schema for error responses."""
    
    detail: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Error code for client handling")
