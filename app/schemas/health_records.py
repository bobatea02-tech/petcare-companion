"""
Pydantic schemas for health records API request/response models.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum


class RecordTypeEnum(str, Enum):
    """Enumeration of health record types."""
    SYMPTOM_LOG = "symptom_log"
    VACCINATION = "vaccination"
    CHECKUP = "checkup"
    EMERGENCY = "emergency"
    SURGERY = "surgery"
    DIAGNOSTIC = "diagnostic"


class SeverityEnum(str, Enum):
    """Enumeration of symptom severity levels."""
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"


class TriageLevelEnum(str, Enum):
    """Enumeration of AI triage levels."""
    GREEN = "Green"
    YELLOW = "Yellow"
    RED = "Red"


# Base schemas for common fields
class BaseHealthRecordSchema(BaseModel):
    """Base schema for health record fields."""
    
    record_date: date = Field(..., description="Date of the health record")
    record_type: RecordTypeEnum = Field(..., description="Type of health record")
    description: str = Field(..., min_length=1, max_length=2000, description="Description of the health record")
    veterinarian: Optional[str] = Field(None, max_length=200, description="Veterinarian name")
    clinic_name: Optional[str] = Field(None, max_length=200, description="Clinic name")
    diagnosis: Optional[str] = Field(None, max_length=2000, description="Medical diagnosis")
    treatment_plan: Optional[str] = Field(None, max_length=2000, description="Treatment plan")


# Health Record schemas
class HealthRecordCreate(BaseHealthRecordSchema):
    """Schema for creating a new health record."""
    
    pet_id: str = Field(..., description="ID of the pet this record belongs to")
    
    @validator('pet_id')
    def validate_pet_id(cls, v):
        """Validate pet ID format."""
        if not v or len(v.strip()) == 0:
            raise ValueError('Pet ID is required')
        return v.strip()


class HealthRecordUpdate(BaseModel):
    """Schema for updating an existing health record."""
    
    record_date: Optional[date] = Field(None, description="Date of the health record")
    record_type: Optional[RecordTypeEnum] = Field(None, description="Type of health record")
    description: Optional[str] = Field(None, min_length=1, max_length=2000, description="Description of the health record")
    veterinarian: Optional[str] = Field(None, max_length=200, description="Veterinarian name")
    clinic_name: Optional[str] = Field(None, max_length=200, description="Clinic name")
    diagnosis: Optional[str] = Field(None, max_length=2000, description="Medical diagnosis")
    treatment_plan: Optional[str] = Field(None, max_length=2000, description="Treatment plan")


class HealthRecordResponse(BaseHealthRecordSchema):
    """Schema for health record response."""
    
    id: str = Field(..., description="Unique identifier for the health record")
    pet_id: str = Field(..., description="ID of the pet this record belongs to")
    created_at: datetime = Field(..., description="Timestamp when record was created")
    updated_at: datetime = Field(..., description="Timestamp when record was last updated")
    
    # Related data
    symptom_logs: List['SymptomLogResponse'] = Field(default=[], description="Associated symptom logs")
    vaccinations: List['VaccinationResponse'] = Field(default=[], description="Associated vaccination records")
    ai_assessments: List['AIAssessmentResponse'] = Field(default=[], description="Associated AI assessments")
    
    class Config:
        from_attributes = True


# Symptom Log schemas
class SymptomLogCreate(BaseModel):
    """Schema for creating a symptom log entry."""
    
    symptom_description: str = Field(..., min_length=1, max_length=2000, description="Description of the symptom")
    severity: Optional[SeverityEnum] = Field(None, description="Severity of the symptom")
    duration: Optional[str] = Field(None, max_length=100, description="Duration of the symptom")
    observed_at: datetime = Field(..., description="When the symptom was observed")
    
    @validator('observed_at')
    def validate_observed_at(cls, v):
        """Validate that observed_at is not in the future."""
        if v > datetime.now():
            raise ValueError('Observed time cannot be in the future')
        return v


class SymptomLogResponse(SymptomLogCreate):
    """Schema for symptom log response."""
    
    id: str = Field(..., description="Unique identifier for the symptom log")
    health_record_id: str = Field(..., description="ID of the associated health record")
    created_at: datetime = Field(..., description="Timestamp when log was created")
    updated_at: datetime = Field(..., description="Timestamp when log was last updated")
    
    class Config:
        from_attributes = True


# Vaccination schemas
class VaccinationCreate(BaseModel):
    """Schema for creating a vaccination record."""
    
    vaccine_name: str = Field(..., min_length=1, max_length=200, description="Name of the vaccine")
    vaccine_type: str = Field(..., min_length=1, max_length=100, description="Type of vaccine (e.g., rabies, DHPP)")
    administered_date: date = Field(..., description="Date when vaccine was administered")
    expiration_date: Optional[date] = Field(None, description="Date when vaccine expires")
    veterinarian: Optional[str] = Field(None, max_length=200, description="Veterinarian who administered vaccine")
    clinic_name: Optional[str] = Field(None, max_length=200, description="Clinic where vaccine was administered")
    batch_number: Optional[str] = Field(None, max_length=100, description="Vaccine batch number")
    
    @validator('expiration_date')
    def validate_expiration_date(cls, v, values):
        """Validate that expiration date is after administered date."""
        if v and 'administered_date' in values and v <= values['administered_date']:
            raise ValueError('Expiration date must be after administered date')
        return v


class VaccinationResponse(VaccinationCreate):
    """Schema for vaccination response."""
    
    id: str = Field(..., description="Unique identifier for the vaccination record")
    health_record_id: str = Field(..., description="ID of the associated health record")
    is_expired: bool = Field(..., description="Whether the vaccination has expired")
    days_until_expiration: Optional[int] = Field(None, description="Days until expiration (null if no expiration date)")
    created_at: datetime = Field(..., description="Timestamp when record was created")
    updated_at: datetime = Field(..., description="Timestamp when record was last updated")
    
    class Config:
        from_attributes = True
    
    def __init__(self, **data):
        super().__init__(**data)
        # Calculate expiration status
        if self.expiration_date:
            today = date.today()
            self.is_expired = self.expiration_date < today
            if not self.is_expired:
                self.days_until_expiration = (self.expiration_date - today).days
        else:
            self.is_expired = False
            self.days_until_expiration = None


# AI Assessment schemas
class AIAssessmentCreate(BaseModel):
    """Schema for creating an AI assessment."""
    
    symptoms_reported: str = Field(..., min_length=1, max_length=2000, description="Symptoms reported for assessment")
    triage_level: TriageLevelEnum = Field(..., description="AI-assigned triage level")
    ai_analysis: str = Field(..., min_length=1, max_length=5000, description="AI analysis of symptoms")
    recommendations: str = Field(..., min_length=1, max_length=5000, description="AI recommendations")
    model_used: str = Field(..., min_length=1, max_length=50, description="AI model used for assessment")
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Confidence score of assessment")
    
    @validator('model_used')
    def validate_model_used(cls, v):
        """Validate AI model name."""
        allowed_models = ['gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4', 'claude-3']
        if v not in allowed_models:
            raise ValueError(f'Model must be one of: {", ".join(allowed_models)}')
        return v


class AIAssessmentResponse(AIAssessmentCreate):
    """Schema for AI assessment response."""
    
    id: str = Field(..., description="Unique identifier for the AI assessment")
    pet_id: str = Field(..., description="ID of the pet this assessment belongs to")
    health_record_id: Optional[str] = Field(None, description="ID of the associated health record")
    created_at: datetime = Field(..., description="Timestamp when assessment was created")
    updated_at: datetime = Field(..., description="Timestamp when assessment was last updated")
    
    class Config:
        from_attributes = True


# List and summary response schemas
class HealthRecordListResponse(BaseModel):
    """Schema for paginated health records list."""
    
    records: List[HealthRecordResponse] = Field(..., description="List of health records")
    total_count: int = Field(..., description="Total number of records available")
    page_size: int = Field(..., description="Number of records per page")
    page_offset: int = Field(..., description="Current page offset")
    has_more: bool = Field(..., description="Whether more records are available")
    
    class Config:
        from_attributes = True


class HealthSummaryStats(BaseModel):
    """Schema for health summary statistics."""
    
    total_records: int = Field(..., description="Total number of health records")
    symptom_logs_count: int = Field(..., description="Number of symptom log entries")
    vaccinations_count: int = Field(..., description="Number of vaccination records")
    ai_assessments_count: int = Field(..., description="Number of AI assessments")
    emergency_visits: int = Field(..., description="Number of emergency visits")
    checkups_count: int = Field(..., description="Number of routine checkups")
    last_checkup_date: Optional[date] = Field(None, description="Date of last checkup")
    upcoming_vaccinations: int = Field(..., description="Number of vaccinations expiring within 30 days")
    
    class Config:
        from_attributes = True


class AIInsight(BaseModel):
    """Schema for AI-generated health insights."""
    
    insight_type: str = Field(..., description="Type of insight (trend, recommendation, alert)")
    title: str = Field(..., description="Title of the insight")
    description: str = Field(..., description="Detailed description of the insight")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence level of the insight")
    priority: str = Field(..., description="Priority level (low, medium, high)")
    
    class Config:
        from_attributes = True


class HealthSummaryResponse(BaseModel):
    """Schema for comprehensive health summary response."""
    
    pet_id: str = Field(..., description="ID of the pet")
    pet_name: str = Field(..., description="Name of the pet")
    summary_period_days: int = Field(..., description="Number of days covered in summary")
    generated_at: datetime = Field(..., description="When the summary was generated")
    
    # Summary statistics
    stats: HealthSummaryStats = Field(..., description="Health summary statistics")
    
    # Recent records
    recent_records: List[HealthRecordResponse] = Field(..., description="Recent health records")
    
    # AI insights (optional)
    ai_insights: List[AIInsight] = Field(default=[], description="AI-powered health insights")
    
    # Export metadata
    export_formats: List[str] = Field(default=["json", "pdf"], description="Available export formats")
    
    class Config:
        from_attributes = True


class ErrorResponse(BaseModel):
    """Schema for error responses."""
    
    detail: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Specific error code")
    
    class Config:
        from_attributes = True


# Update forward references
HealthRecordResponse.model_rebuild()