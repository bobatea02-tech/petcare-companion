"""
Pydantic schemas for pet profile management endpoints.
"""

from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
import re


class PetCreate(BaseModel):
    """Schema for pet profile creation request."""
    
    # Required fields (Requirements 2.1)
    name: str = Field(..., min_length=1, max_length=100, description="Pet name")
    species: str = Field(..., min_length=1, max_length=50, description="Pet species (dog, cat, bird, etc.)")
    birth_date: date = Field(..., description="Pet birth date")
    
    # Optional fields
    breed: Optional[str] = Field(None, max_length=100, description="Pet breed")
    weight: Optional[float] = Field(None, gt=0, description="Pet weight in pounds or kg")
    gender: Optional[str] = Field(None, description="Pet gender (male, female, unknown)")
    
    # Medical information (Requirements 2.2)
    medical_conditions: Optional[str] = Field(None, description="Known medical conditions")
    allergies: Optional[str] = Field(None, description="Known allergies")
    behavioral_notes: Optional[str] = Field(None, description="Behavioral notes and observations")
    
    @field_validator('species')
    @classmethod
    def validate_species(cls, v):
        """Validate species is a common pet type."""
        if v is None:
            return v
        
        # Convert to lowercase for validation
        species_lower = v.lower().strip()
        
        # List of common pet species
        valid_species = [
            'dog', 'cat', 'bird', 'rabbit', 'hamster', 'guinea pig', 
            'ferret', 'fish', 'reptile', 'turtle', 'snake', 'lizard',
            'horse', 'goat', 'sheep', 'pig', 'chicken', 'duck'
        ]
        
        if species_lower not in valid_species:
            # Allow any species but warn about uncommon ones
            pass
        
        return v.strip()
    
    @field_validator('gender')
    @classmethod
    def validate_gender(cls, v):
        """Validate gender is one of the accepted values."""
        if v is None:
            return v
        
        valid_genders = ['male', 'female', 'unknown']
        if v.lower() not in valid_genders:
            raise ValueError(f'Gender must be one of: {", ".join(valid_genders)}')
        
        return v.lower()
    
    @field_validator('birth_date')
    @classmethod
    def validate_birth_date(cls, v):
        """Validate birth date is not in the future."""
        if v > date.today():
            raise ValueError('Birth date cannot be in the future')
        
        return v


class PetUpdate(BaseModel):
    """Schema for pet profile update request."""
    
    # All fields are optional for updates
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Pet name")
    species: Optional[str] = Field(None, min_length=1, max_length=50, description="Pet species")
    birth_date: Optional[date] = Field(None, description="Pet birth date")
    breed: Optional[str] = Field(None, max_length=100, description="Pet breed")
    weight: Optional[float] = Field(None, gt=0, description="Pet weight in pounds or kg")
    gender: Optional[str] = Field(None, description="Pet gender (male, female, unknown)")
    medical_conditions: Optional[str] = Field(None, description="Known medical conditions")
    allergies: Optional[str] = Field(None, description="Known allergies")
    behavioral_notes: Optional[str] = Field(None, description="Behavioral notes and observations")
    is_active: Optional[bool] = Field(None, description="Pet active status")
    
    @field_validator('species')
    @classmethod
    def validate_species(cls, v):
        """Validate species is a common pet type."""
        if v is None:
            return v
        return v.strip()
    
    @field_validator('gender')
    @classmethod
    def validate_gender(cls, v):
        """Validate gender is one of the accepted values."""
        if v is None:
            return v
        
        valid_genders = ['male', 'female', 'unknown']
        if v.lower() not in valid_genders:
            raise ValueError(f'Gender must be one of: {", ".join(valid_genders)}')
        
        return v.lower()
    
    @field_validator('birth_date')
    @classmethod
    def validate_birth_date(cls, v):
        """Validate birth date is not in the future."""
        if v is None:
            return v
        
        if v > date.today():
            raise ValueError('Birth date cannot be in the future')
        
        return v


class PetResponse(BaseModel):
    """Schema for pet profile response."""
    
    id: str = Field(..., description="Pet ID")
    user_id: str = Field(..., description="Owner user ID")
    name: str = Field(..., description="Pet name")
    species: str = Field(..., description="Pet species")
    birth_date: date = Field(..., description="Pet birth date")
    breed: Optional[str] = Field(None, description="Pet breed")
    weight: Optional[float] = Field(None, description="Pet weight")
    gender: Optional[str] = Field(None, description="Pet gender")
    medical_conditions: Optional[str] = Field(None, description="Known medical conditions")
    allergies: Optional[str] = Field(None, description="Known allergies")
    behavioral_notes: Optional[str] = Field(None, description="Behavioral notes")
    is_active: bool = Field(..., description="Pet active status")
    created_at: datetime = Field(..., description="Profile creation timestamp")
    updated_at: datetime = Field(..., description="Profile last update timestamp")
    
    # Computed field for age
    age_years: Optional[int] = Field(None, description="Pet age in years")
    age_months: Optional[int] = Field(None, description="Pet age in months")
    
    model_config = {"from_attributes": True}
    
    def __init__(self, **data):
        """Initialize with computed age fields."""
        super().__init__(**data)
        
        # Calculate age from birth_date
        if self.birth_date:
            today = date.today()
            age_delta = today - self.birth_date
            
            # Calculate years and months
            years = age_delta.days // 365
            remaining_days = age_delta.days % 365
            months = remaining_days // 30
            
            self.age_years = years
            self.age_months = months


class PetListResponse(BaseModel):
    """Schema for pet list response."""
    
    pets: List[PetResponse] = Field(..., description="List of user's pets")
    total_count: int = Field(..., description="Total number of pets")
    active_count: int = Field(..., description="Number of active pets")


class PetHistoryEntry(BaseModel):
    """Schema for pet profile history entry."""
    
    id: str = Field(..., description="History entry ID")
    pet_id: str = Field(..., description="Pet ID")
    changed_at: datetime = Field(..., description="Change timestamp")
    changed_by: str = Field(..., description="User who made the change")
    change_type: str = Field(..., description="Type of change (created, updated, deleted)")
    changes: dict = Field(..., description="Dictionary of field changes")
    previous_values: Optional[dict] = Field(None, description="Previous field values")


class PetHistoryResponse(BaseModel):
    """Schema for pet profile history response."""
    
    pet_id: str = Field(..., description="Pet ID")
    history: List[PetHistoryEntry] = Field(..., description="List of profile changes")
    total_changes: int = Field(..., description="Total number of changes")


class ErrorResponse(BaseModel):
    """Schema for error responses."""
    
    detail: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Error code for client handling")


# Medical Information Management Schemas

class MedicalConditionCreate(BaseModel):
    """Schema for adding medical conditions to a pet."""
    
    condition_name: str = Field(..., min_length=1, max_length=200, description="Medical condition name")
    diagnosis_date: Optional[date] = Field(None, description="Date when condition was diagnosed")
    severity: Optional[str] = Field(None, description="Condition severity (mild, moderate, severe)")
    treatment_status: Optional[str] = Field(None, description="Treatment status (active, resolved, ongoing)")
    notes: Optional[str] = Field(None, description="Additional notes about the condition")
    
    @field_validator('severity')
    @classmethod
    def validate_severity(cls, v):
        """Validate severity level."""
        if v is None:
            return v
        
        valid_severities = ['mild', 'moderate', 'severe']
        if v.lower() not in valid_severities:
            raise ValueError(f'Severity must be one of: {", ".join(valid_severities)}')
        
        return v.lower()
    
    @field_validator('treatment_status')
    @classmethod
    def validate_treatment_status(cls, v):
        """Validate treatment status."""
        if v is None:
            return v
        
        valid_statuses = ['active', 'resolved', 'ongoing', 'monitoring']
        if v.lower() not in valid_statuses:
            raise ValueError(f'Treatment status must be one of: {", ".join(valid_statuses)}')
        
        return v.lower()


class AllergyCreate(BaseModel):
    """Schema for adding allergies to a pet."""
    
    allergen: str = Field(..., min_length=1, max_length=200, description="Allergen name")
    reaction_type: Optional[str] = Field(None, description="Type of allergic reaction")
    severity: Optional[str] = Field(None, description="Reaction severity (mild, moderate, severe)")
    discovered_date: Optional[date] = Field(None, description="Date when allergy was discovered")
    notes: Optional[str] = Field(None, description="Additional notes about the allergy")
    
    @field_validator('severity')
    @classmethod
    def validate_severity(cls, v):
        """Validate severity level."""
        if v is None:
            return v
        
        valid_severities = ['mild', 'moderate', 'severe']
        if v.lower() not in valid_severities:
            raise ValueError(f'Severity must be one of: {", ".join(valid_severities)}')
        
        return v.lower()


class VaccinationRecordCreate(BaseModel):
    """Schema for adding vaccination records to a pet."""
    
    vaccine_name: str = Field(..., min_length=1, max_length=200, description="Vaccine name")
    vaccine_type: str = Field(..., min_length=1, max_length=100, description="Vaccine type (rabies, DHPP, etc.)")
    administered_date: date = Field(..., description="Date vaccine was administered")
    expiration_date: Optional[date] = Field(None, description="Vaccine expiration date")
    veterinarian: Optional[str] = Field(None, max_length=200, description="Administering veterinarian")
    clinic_name: Optional[str] = Field(None, max_length=200, description="Clinic where vaccine was given")
    batch_number: Optional[str] = Field(None, max_length=100, description="Vaccine batch number")
    notes: Optional[str] = Field(None, description="Additional notes about the vaccination")
    
    @field_validator('administered_date')
    @classmethod
    def validate_administered_date(cls, v):
        """Validate administered date is not in the future."""
        if v > date.today():
            raise ValueError('Administered date cannot be in the future')
        
        return v
    
    @field_validator('expiration_date')
    @classmethod
    def validate_expiration_date(cls, v, info):
        """Validate expiration date is after administered date."""
        if v is None:
            return v
        
        administered_date = info.data.get('administered_date')
        if administered_date and v <= administered_date:
            raise ValueError('Expiration date must be after administered date')
        
        return v


class MedicalHistoryEntryCreate(BaseModel):
    """Schema for adding medical history entries."""
    
    entry_date: date = Field(..., description="Date of medical entry")
    entry_type: str = Field(..., description="Type of medical entry")
    description: str = Field(..., min_length=1, description="Description of medical event")
    veterinarian: Optional[str] = Field(None, max_length=200, description="Veterinarian involved")
    clinic_name: Optional[str] = Field(None, max_length=200, description="Clinic name")
    diagnosis: Optional[str] = Field(None, description="Diagnosis if applicable")
    treatment_plan: Optional[str] = Field(None, description="Treatment plan if applicable")
    follow_up_required: Optional[bool] = Field(None, description="Whether follow-up is required")
    follow_up_date: Optional[date] = Field(None, description="Scheduled follow-up date")
    
    @field_validator('entry_type')
    @classmethod
    def validate_entry_type(cls, v):
        """Validate entry type."""
        valid_types = [
            'checkup', 'emergency', 'surgery', 'vaccination', 'dental', 
            'diagnostic', 'treatment', 'follow_up', 'consultation'
        ]
        if v.lower() not in valid_types:
            raise ValueError(f'Entry type must be one of: {", ".join(valid_types)}')
        
        return v.lower()
    
    @field_validator('entry_date')
    @classmethod
    def validate_entry_date(cls, v):
        """Validate entry date is not in the future."""
        if v > date.today():
            raise ValueError('Entry date cannot be in the future')
        
        return v


# Response schemas for medical information

class MedicalConditionResponse(BaseModel):
    """Schema for medical condition response."""
    
    id: str = Field(..., description="Condition ID")
    pet_id: str = Field(..., description="Pet ID")
    condition_name: str = Field(..., description="Medical condition name")
    diagnosis_date: Optional[date] = Field(None, description="Diagnosis date")
    severity: Optional[str] = Field(None, description="Condition severity")
    treatment_status: Optional[str] = Field(None, description="Treatment status")
    notes: Optional[str] = Field(None, description="Additional notes")
    created_at: datetime = Field(..., description="Record creation timestamp")
    updated_at: datetime = Field(..., description="Record last update timestamp")
    
    model_config = {"from_attributes": True}


class AllergyResponse(BaseModel):
    """Schema for allergy response."""
    
    id: str = Field(..., description="Allergy ID")
    pet_id: str = Field(..., description="Pet ID")
    allergen: str = Field(..., description="Allergen name")
    reaction_type: Optional[str] = Field(None, description="Reaction type")
    severity: Optional[str] = Field(None, description="Reaction severity")
    discovered_date: Optional[date] = Field(None, description="Discovery date")
    notes: Optional[str] = Field(None, description="Additional notes")
    created_at: datetime = Field(..., description="Record creation timestamp")
    updated_at: datetime = Field(..., description="Record last update timestamp")
    
    model_config = {"from_attributes": True}


class VaccinationRecordResponse(BaseModel):
    """Schema for vaccination record response."""
    
    id: str = Field(..., description="Vaccination record ID")
    pet_id: str = Field(..., description="Pet ID")
    vaccine_name: str = Field(..., description="Vaccine name")
    vaccine_type: str = Field(..., description="Vaccine type")
    administered_date: date = Field(..., description="Administration date")
    expiration_date: Optional[date] = Field(None, description="Expiration date")
    veterinarian: Optional[str] = Field(None, description="Administering veterinarian")
    clinic_name: Optional[str] = Field(None, description="Clinic name")
    batch_number: Optional[str] = Field(None, description="Batch number")
    notes: Optional[str] = Field(None, description="Additional notes")
    is_expired: bool = Field(..., description="Whether vaccination is expired")
    days_until_expiration: Optional[int] = Field(None, description="Days until expiration")
    created_at: datetime = Field(..., description="Record creation timestamp")
    updated_at: datetime = Field(..., description="Record last update timestamp")
    
    model_config = {"from_attributes": True}
    
    def __init__(self, **data):
        """Initialize with computed expiration fields."""
        super().__init__(**data)
        
        # Calculate expiration status
        if self.expiration_date:
            today = date.today()
            self.is_expired = self.expiration_date < today
            
            if not self.is_expired:
                delta = self.expiration_date - today
                self.days_until_expiration = delta.days
            else:
                self.days_until_expiration = None
        else:
            self.is_expired = False
            self.days_until_expiration = None


class MedicalHistoryEntryResponse(BaseModel):
    """Schema for medical history entry response."""
    
    id: str = Field(..., description="History entry ID")
    pet_id: str = Field(..., description="Pet ID")
    entry_date: date = Field(..., description="Entry date")
    entry_type: str = Field(..., description="Entry type")
    description: str = Field(..., description="Description")
    veterinarian: Optional[str] = Field(None, description="Veterinarian")
    clinic_name: Optional[str] = Field(None, description="Clinic name")
    diagnosis: Optional[str] = Field(None, description="Diagnosis")
    treatment_plan: Optional[str] = Field(None, description="Treatment plan")
    follow_up_required: Optional[bool] = Field(None, description="Follow-up required")
    follow_up_date: Optional[date] = Field(None, description="Follow-up date")
    created_at: datetime = Field(..., description="Record creation timestamp")
    updated_at: datetime = Field(..., description="Record last update timestamp")
    
    model_config = {"from_attributes": True}


class PetMedicalSummaryResponse(BaseModel):
    """Schema for comprehensive pet medical summary."""
    
    pet_id: str = Field(..., description="Pet ID")
    pet_name: str = Field(..., description="Pet name")
    medical_conditions: List[MedicalConditionResponse] = Field(..., description="Medical conditions")
    allergies: List[AllergyResponse] = Field(..., description="Allergies")
    vaccinations: List[VaccinationRecordResponse] = Field(..., description="Vaccination records")
    medical_history: List[MedicalHistoryEntryResponse] = Field(..., description="Medical history entries")
    
    # Summary statistics
    total_conditions: int = Field(..., description="Total number of medical conditions")
    active_conditions: int = Field(..., description="Number of active conditions")
    total_allergies: int = Field(..., description="Total number of allergies")
    total_vaccinations: int = Field(..., description="Total number of vaccinations")
    expired_vaccinations: int = Field(..., description="Number of expired vaccinations")
    upcoming_expirations: int = Field(..., description="Vaccinations expiring within 30 days")
    last_checkup_date: Optional[date] = Field(None, description="Date of last checkup")