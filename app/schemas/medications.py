"""
Pydantic schemas for medication tracking and management.
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID


class MedicationBase(BaseModel):
    """Base schema for medication data."""
    medication_name: str = Field(..., min_length=1, max_length=200, description="Name of the medication")
    dosage: str = Field(..., min_length=1, max_length=100, description="Dosage amount (e.g., '10mg', '1 tablet')")
    frequency: str = Field(..., min_length=1, max_length=100, description="Frequency of administration (e.g., 'twice daily', 'every 8 hours')")
    administration_instructions: Optional[str] = Field(None, max_length=1000, description="Special instructions for giving medication")


class MedicationCreate(MedicationBase):
    """Schema for creating a new medication."""
    start_date: date = Field(..., description="Date to start medication")
    end_date: Optional[date] = Field(None, description="Date to end medication (null for ongoing)")
    refill_threshold: int = Field(5, ge=1, le=100, description="Alert when this many doses remain")
    current_quantity: int = Field(..., ge=0, description="Current number of doses available")
    
    @field_validator('end_date')
    @classmethod
    def validate_end_date(cls, v, info):
        if v and 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('End date must be after start date')
        return v


class MedicationUpdate(BaseModel):
    """Schema for updating medication information."""
    medication_name: Optional[str] = Field(None, min_length=1, max_length=200)
    dosage: Optional[str] = Field(None, min_length=1, max_length=100)
    frequency: Optional[str] = Field(None, min_length=1, max_length=100)
    end_date: Optional[date] = None
    refill_threshold: Optional[int] = Field(None, ge=1, le=100)
    current_quantity: Optional[int] = Field(None, ge=0)
    administration_instructions: Optional[str] = Field(None, max_length=1000)
    active: Optional[bool] = None


class MedicationResponse(MedicationBase):
    """Schema for medication response data."""
    id: str
    pet_id: str
    start_date: date
    end_date: Optional[date]
    refill_threshold: int
    current_quantity: int
    active: bool
    needs_refill: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class MedicationLogBase(BaseModel):
    """Base schema for medication log entries."""
    dosage_given: str = Field(..., min_length=1, max_length=100, description="Actual dosage administered")
    administered_by: Optional[str] = Field(None, max_length=100, description="Who administered the medication")
    notes: Optional[str] = Field(None, max_length=1000, description="Notes about administration")


class MedicationLogCreate(MedicationLogBase):
    """Schema for creating a medication log entry."""
    administered_at: Optional[datetime] = Field(None, description="When medication was given (defaults to now)")
    completed: bool = Field(True, description="Whether the dose was successfully given")


class MedicationLogUpdate(BaseModel):
    """Schema for updating medication log entries."""
    dosage_given: Optional[str] = Field(None, min_length=1, max_length=100)
    administered_by: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=1000)
    completed: Optional[bool] = None


class MedicationLogResponse(MedicationLogBase):
    """Schema for medication log response data."""
    id: str
    medication_id: str
    administered_at: datetime
    completed: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class MedicationWithLogsResponse(MedicationResponse):
    """Schema for medication with recent log entries."""
    recent_logs: List[MedicationLogResponse] = Field(default_factory=list)
    last_administered: Optional[datetime] = None
    next_dose_due: Optional[datetime] = None
    overdue: bool = False


class MedicationListResponse(BaseModel):
    """Schema for medication list response."""
    medications: List[MedicationWithLogsResponse]
    total_count: int
    active_count: int
    medications_needing_refill: int
    overdue_medications: int


class MedicationStatusResponse(BaseModel):
    """Schema for comprehensive medication status."""
    pet_id: str
    pet_name: str
    medications: List[MedicationWithLogsResponse]
    upcoming_doses: List[dict]
    refill_alerts: List[dict]
    summary: dict


class FeedingScheduleBase(BaseModel):
    """Base schema for feeding schedule data."""
    food_type: str = Field(..., min_length=1, max_length=200, description="Type of food")
    amount: str = Field(..., min_length=1, max_length=100, description="Amount to feed (e.g., '1 cup', '200g')")
    feeding_time: datetime = Field(..., description="Scheduled feeding time")


class FeedingScheduleCreate(FeedingScheduleBase):
    """Schema for creating a feeding schedule entry."""
    recurring: bool = Field(True, description="Whether this is a recurring schedule")
    frequency: Optional[str] = Field("daily", max_length=50, description="Frequency if recurring (daily, weekly, etc.)")
    notes: Optional[str] = Field(None, max_length=1000, description="Notes about feeding")


class FeedingScheduleUpdate(BaseModel):
    """Schema for updating feeding schedule."""
    food_type: Optional[str] = Field(None, min_length=1, max_length=200)
    amount: Optional[str] = Field(None, min_length=1, max_length=100)
    feeding_time: Optional[datetime] = None
    recurring: Optional[bool] = None
    frequency: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = Field(None, max_length=1000)
    active: Optional[bool] = None


class FeedingLogBase(BaseModel):
    """Base schema for feeding log entries."""
    food_type: str = Field(..., min_length=1, max_length=200)
    amount: str = Field(..., min_length=1, max_length=100)
    notes: Optional[str] = Field(None, max_length=1000)


class FeedingLogCreate(FeedingLogBase):
    """Schema for creating a feeding log entry."""
    feeding_time: Optional[datetime] = Field(None, description="When feeding occurred (defaults to now)")
    completed: bool = Field(True, description="Whether feeding was completed")


class FeedingLogUpdate(BaseModel):
    """Schema for updating feeding log entries."""
    food_type: Optional[str] = Field(None, min_length=1, max_length=200)
    amount: Optional[str] = Field(None, min_length=1, max_length=100)
    feeding_time: Optional[datetime] = None
    completed: Optional[bool] = None
    notes: Optional[str] = Field(None, max_length=1000)


class FeedingLogResponse(FeedingLogBase):
    """Schema for feeding log response data."""
    id: str
    pet_id: str
    feeding_time: datetime
    completed: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class FeedingScheduleResponse(FeedingScheduleBase):
    """Schema for feeding schedule response data."""
    id: str
    pet_id: str
    recurring: bool
    frequency: Optional[str]
    notes: Optional[str]
    active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class FeedingHistoryResponse(BaseModel):
    """Schema for feeding history analysis."""
    pet_id: str
    pet_name: str
    feeding_logs: List[FeedingLogResponse]
    feeding_patterns: dict
    total_feedings: int
    average_daily_feedings: float
    most_common_food_type: Optional[str]
    feeding_consistency_score: float


class CareTrackingDashboardResponse(BaseModel):
    """Schema for comprehensive care tracking dashboard."""
    pet_id: str
    pet_name: str
    medication_status: MedicationStatusResponse
    feeding_history: FeedingHistoryResponse
    upcoming_tasks: List[dict]
    alerts: List[dict]
    care_score: float


class ErrorResponse(BaseModel):
    """Schema for error responses."""
    detail: str
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)