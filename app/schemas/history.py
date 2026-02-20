"""
Schemas for health history endpoints.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date


class AppointmentHistoryResponse(BaseModel):
    """Response model for appointment history."""
    id: int
    pet_id: int
    appointment_date: date
    appointment_time: Optional[str] = None
    vet_name: str
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    reason: str
    status: str
    notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class MedicationHistoryResponse(BaseModel):
    """Response model for medication history."""
    id: int
    pet_id: int
    name: str
    dosage: str
    frequency: str
    start_date: date
    end_date: Optional[date] = None
    notes: Optional[str] = None
    is_active: bool = Field(default=True)
    
    class Config:
        from_attributes = True


class HealthLogResponse(BaseModel):
    """Response model for health logs."""
    id: int
    pet_id: int
    log_date: datetime
    log_type: str
    title: str
    notes: Optional[str] = None
    vet_name: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class HealthSummaryResponse(BaseModel):
    """Response model for pet health summary."""
    total_appointments: int
    completed_appointments: int
    active_medications_count: int
    total_health_logs: int
    upcoming_appointments_count: int
    next_appointment: Optional[AppointmentHistoryResponse] = None


class HistoryFilterRequest(BaseModel):
    """Request model for filtering history."""
    status: Optional[str] = None
    log_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    search_query: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=200)
