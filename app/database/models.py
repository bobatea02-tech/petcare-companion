"""
SQLAlchemy database models for PawPal Voice Pet Care Assistant.
"""

from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import Column, DateTime, String, Text, Boolean, Integer, Float, Date, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
import uuid


# Base class for all database models
Base = declarative_base()


class BaseModel(Base):
    """Base model with common fields for all tables."""
    
    __abstract__ = True
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )


class User(BaseModel):
    """User model with authentication fields and vet contact info."""
    
    __tablename__ = "users"
    __table_args__ = (
        # Composite index for active user lookups
        {"extend_existing": True}
    )
    
    # Authentication fields
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Personal information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=True, index=True)  # Added index for SMS lookups
    
    # Vet contact information
    emergency_contact = Column(String(255), nullable=True)
    preferred_vet_clinic = Column(String(255), nullable=True)
    
    # Account status
    is_active = Column(Boolean, default=True, nullable=False, index=True)  # Added index for active user queries
    email_verified = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    pets = relationship("Pet", back_populates="owner", cascade="all, delete-orphan")
    notification_preferences = relationship("NotificationPreference", back_populates="user", cascade="all, delete-orphan")


class Pet(BaseModel):
    """Pet model with species, breed, medical history, and allergies."""
    
    __tablename__ = "pets"
    __table_args__ = (
        # Composite indexes for common query patterns
        {"extend_existing": True}
    )
    
    # Owner relationship
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Basic information (required fields)
    name = Column(String(100), nullable=False, index=True)  # Added index for name searches
    species = Column(String(50), nullable=False, index=True)  # Added index for species filtering
    birth_date = Column(Date, nullable=False)
    
    # Additional information
    breed = Column(String(100), nullable=True)
    weight = Column(Float, nullable=True)  # in pounds or kg
    gender = Column(String(10), nullable=True)  # male, female, unknown
    
    # Medical information
    medical_conditions = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    behavioral_notes = Column(Text, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)  # Added index for active pet queries
    
    # Relationships
    owner = relationship("User", back_populates="pets")
    medications = relationship("Medication", back_populates="pet", cascade="all, delete-orphan")
    health_records = relationship("HealthRecord", back_populates="pet", cascade="all, delete-orphan")
    feeding_logs = relationship("FeedingLog", back_populates="pet", cascade="all, delete-orphan")
    feeding_schedules = relationship("FeedingSchedule", back_populates="pet", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="pet", cascade="all, delete-orphan")
    files = relationship("PetFile", back_populates="pet", cascade="all, delete-orphan")


class NotificationPreference(BaseModel):
    """User notification preferences for different types of alerts."""
    
    __tablename__ = "notification_preferences"
    
    # User relationship
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Notification types
    medication_reminders = Column(Boolean, default=True, nullable=False)
    feeding_reminders = Column(Boolean, default=True, nullable=False)
    appointment_reminders = Column(Boolean, default=True, nullable=False)
    emergency_alerts = Column(Boolean, default=True, nullable=False)
    weekly_reports = Column(Boolean, default=True, nullable=False)
    
    # Notification methods
    email_notifications = Column(Boolean, default=True, nullable=False)
    sms_notifications = Column(Boolean, default=False, nullable=False)
    push_notifications = Column(Boolean, default=True, nullable=False)
    
    # Timing preferences
    reminder_advance_minutes = Column(Integer, default=15, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="notification_preferences")


class Medication(BaseModel):
    """Medication model with dosage, frequency, and refill tracking."""
    
    __tablename__ = "medications"
    __table_args__ = (
        # Composite index for active medication queries
        {"extend_existing": True}
    )
    
    # Pet relationship
    pet_id = Column(UUID(as_uuid=True), ForeignKey("pets.id"), nullable=False, index=True)
    
    # Medication details
    medication_name = Column(String(200), nullable=False, index=True)  # Added index for medication searches
    dosage = Column(String(100), nullable=False)  # e.g., "10mg", "1 tablet"
    frequency = Column(String(100), nullable=False)  # e.g., "twice daily", "every 8 hours"
    
    # Schedule information
    start_date = Column(Date, nullable=False, index=True)  # Added index for date range queries
    end_date = Column(Date, nullable=True, index=True)  # Added index for active medication queries
    
    # Refill tracking
    refill_threshold = Column(Integer, default=5, nullable=False)  # alert when this many doses remain
    current_quantity = Column(Integer, nullable=False)  # current number of doses available
    
    # Administration instructions
    administration_instructions = Column(Text, nullable=True)
    
    # Status
    active = Column(Boolean, default=True, nullable=False, index=True)  # Added index for active medication filtering
    
    # Relationships
    pet = relationship("Pet", back_populates="medications")
    medication_logs = relationship("MedicationLog", back_populates="medication", cascade="all, delete-orphan")


class MedicationLog(BaseModel):
    """Log of medication administration events."""
    
    __tablename__ = "medication_logs"
    __table_args__ = (
        # Composite index for date-based queries
        {"extend_existing": True}
    )
    
    # Medication relationship
    medication_id = Column(UUID(as_uuid=True), ForeignKey("medications.id"), nullable=False, index=True)
    
    # Administration details
    administered_at = Column(DateTime(timezone=True), nullable=False, index=True)  # Added index for time-based queries
    dosage_given = Column(String(100), nullable=False)
    administered_by = Column(String(100), nullable=True)  # who gave the medication
    
    # Status and notes
    completed = Column(Boolean, default=True, nullable=False, index=True)  # Added index for completion status queries
    notes = Column(Text, nullable=True)
    
    # Relationships
    medication = relationship("Medication", back_populates="medication_logs")


class HealthRecord(BaseModel):
    """Health record model with symptom logs and AI assessments."""
    
    __tablename__ = "health_records"
    __table_args__ = (
        # Composite index for date and type queries
        {"extend_existing": True}
    )
    
    # Pet relationship
    pet_id = Column(UUID(as_uuid=True), ForeignKey("pets.id"), nullable=False, index=True)
    
    # Record details
    record_date = Column(Date, nullable=False, index=True)  # Added index for date-based queries
    record_type = Column(String(50), nullable=False, index=True)  # Added index for type filtering
    description = Column(Text, nullable=False)
    
    # Veterinary information
    veterinarian = Column(String(200), nullable=True)
    clinic_name = Column(String(200), nullable=True)
    
    # Medical details
    diagnosis = Column(Text, nullable=True)
    treatment_plan = Column(Text, nullable=True)
    
    # Relationships
    pet = relationship("Pet", back_populates="health_records")
    symptom_logs = relationship("SymptomLog", back_populates="health_record", cascade="all, delete-orphan")
    vaccinations = relationship("Vaccination", back_populates="health_record", cascade="all, delete-orphan")
    ai_assessments = relationship("AIAssessment", back_populates="health_record", cascade="all, delete-orphan")


class SymptomLog(BaseModel):
    """Individual symptom entries within health records."""
    
    __tablename__ = "symptom_logs"
    
    # Health record relationship
    health_record_id = Column(UUID(as_uuid=True), ForeignKey("health_records.id"), nullable=False, index=True)
    
    # Symptom details
    symptom_description = Column(Text, nullable=False)
    severity = Column(String(20), nullable=True)  # mild, moderate, severe
    duration = Column(String(100), nullable=True)  # how long symptom has been present
    
    # Timing
    observed_at = Column(DateTime(timezone=True), nullable=False)
    
    # Relationships
    health_record = relationship("HealthRecord", back_populates="symptom_logs")


class Vaccination(BaseModel):
    """Vaccination records within health records."""
    
    __tablename__ = "vaccinations"
    
    # Health record relationship
    health_record_id = Column(UUID(as_uuid=True), ForeignKey("health_records.id"), nullable=False, index=True)
    
    # Vaccination details
    vaccine_name = Column(String(200), nullable=False)
    vaccine_type = Column(String(100), nullable=False)  # rabies, DHPP, etc.
    administered_date = Column(Date, nullable=False)
    expiration_date = Column(Date, nullable=True)
    
    # Administration details
    veterinarian = Column(String(200), nullable=True)
    clinic_name = Column(String(200), nullable=True)
    batch_number = Column(String(100), nullable=True)
    
    # Relationships
    health_record = relationship("HealthRecord", back_populates="vaccinations")


class AIAssessment(BaseModel):
    """AI-powered assessments linked to health records."""
    
    __tablename__ = "ai_assessments"
    __table_args__ = (
        # Composite index for triage level queries
        {"extend_existing": True}
    )
    
    # Pet and health record relationships
    pet_id = Column(UUID(as_uuid=True), ForeignKey("pets.id"), nullable=False, index=True)
    health_record_id = Column(UUID(as_uuid=True), ForeignKey("health_records.id"), nullable=True, index=True)
    
    # Input and analysis
    symptoms_reported = Column(Text, nullable=False)
    triage_level = Column(String(10), nullable=False, index=True)  # Added index for triage level filtering
    ai_analysis = Column(Text, nullable=False)
    recommendations = Column(Text, nullable=False)
    
    # AI model information
    model_used = Column(String(50), nullable=False)  # gpt-4-turbo, gpt-3.5-turbo
    confidence_score = Column(Float, nullable=True)  # 0.0 to 1.0
    
    # Relationships
    pet = relationship("Pet")
    health_record = relationship("HealthRecord", back_populates="ai_assessments")


class Appointment(BaseModel):
    """Appointment model with clinic details and scheduling."""
    
    __tablename__ = "appointments"
    __table_args__ = (
        # Composite index for date and status queries
        {"extend_existing": True}
    )
    
    # Pet relationship
    pet_id = Column(UUID(as_uuid=True), ForeignKey("pets.id"), nullable=False, index=True)
    
    # AI Assessment relationship (for emergency appointments from triage)
    ai_assessment_id = Column(UUID(as_uuid=True), ForeignKey("ai_assessments.id"), nullable=True, index=True)
    
    # Appointment details
    appointment_date = Column(DateTime(timezone=True), nullable=False, index=True)  # Added index for date queries
    appointment_type = Column(String(100), nullable=False, index=True)  # Added index for type filtering
    purpose = Column(Text, nullable=True)
    
    # Clinic information
    clinic_name = Column(String(200), nullable=False)
    clinic_address = Column(Text, nullable=True)
    clinic_phone = Column(String(20), nullable=True)
    veterinarian = Column(String(200), nullable=True)
    
    # Status and notes
    status = Column(String(20), default="scheduled", nullable=False, index=True)  # Added index for status filtering
    notes = Column(Text, nullable=True)
    
    # Reminder settings
    reminder_sent_24h = Column(Boolean, default=False, nullable=False, index=True)  # Added index for reminder queries
    reminder_sent_2h = Column(Boolean, default=False, nullable=False, index=True)  # Added index for reminder queries
    
    # Relationships
    pet = relationship("Pet", back_populates="appointments")
    ai_assessment = relationship("AIAssessment")


class VetClinic(BaseModel):
    """Veterinary clinic information for appointments and emergencies."""
    
    __tablename__ = "vet_clinics"
    
    # Clinic details
    name = Column(String(200), nullable=False)
    address = Column(Text, nullable=False)
    phone_number = Column(String(20), nullable=False)
    email = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    
    # Location information
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Service information
    is_emergency = Column(Boolean, default=False, nullable=False)
    is_24_hour = Column(Boolean, default=False, nullable=False)
    services_offered = Column(Text, nullable=True)
    
    # Operating hours (stored as JSON string)
    operating_hours = Column(Text, nullable=True)


class FeedingSchedule(BaseModel):
    """Feeding schedule management for recurring feeding times."""
    
    __tablename__ = "feeding_schedules"
    
    # Pet relationship
    pet_id = Column(UUID(as_uuid=True), ForeignKey("pets.id"), nullable=False, index=True)
    
    # Schedule details
    food_type = Column(String(200), nullable=False)
    amount = Column(String(100), nullable=False)  # e.g., "1 cup", "200g"
    feeding_time = Column(DateTime(timezone=True), nullable=False)
    
    # Recurrence settings
    recurring = Column(Boolean, default=True, nullable=False)
    frequency = Column(String(50), default="daily", nullable=True)  # daily, weekly, etc.
    
    # Status and notes
    active = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)
    
    # Relationships
    pet = relationship("Pet", back_populates="feeding_schedules")


class FeedingLog(BaseModel):
    """Feeding schedule and log management."""
    
    __tablename__ = "feeding_logs"
    
    # Pet relationship
    pet_id = Column(UUID(as_uuid=True), ForeignKey("pets.id"), nullable=False, index=True)
    
    # Feeding details
    feeding_time = Column(DateTime(timezone=True), nullable=False)
    food_type = Column(String(200), nullable=False)
    amount = Column(String(100), nullable=False)  # e.g., "1 cup", "200g"
    
    # Status
    completed = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)
    
    # Relationships
    pet = relationship("Pet", back_populates="feeding_logs")


class PetProfileHistory(BaseModel):
    """Pet profile change history for version tracking."""
    
    __tablename__ = "pet_profile_history"
    
    # Pet relationship
    pet_id = Column(UUID(as_uuid=True), ForeignKey("pets.id"), nullable=False, index=True)
    
    # Change tracking
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    changed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    change_type = Column(String(50), nullable=False)  # created, updated, deleted, soft_deleted, hard_deleted
    
    # Change details (stored as JSON)
    changes = Column(Text, nullable=True)  # JSON string of field changes
    previous_values = Column(Text, nullable=True)  # JSON string of previous values
    
    # Relationships
    pet = relationship("Pet")
    changed_by_user = relationship("User")


class PetMedicalCondition(BaseModel):
    """Medical conditions for pets."""
    
    __tablename__ = "pet_medical_conditions"
    
    # Pet relationship
    pet_id = Column(UUID(as_uuid=True), ForeignKey("pets.id"), nullable=False, index=True)
    
    # Condition details
    condition_name = Column(String(200), nullable=False)
    diagnosis_date = Column(Date, nullable=True)
    severity = Column(String(20), nullable=True)  # mild, moderate, severe
    treatment_status = Column(String(20), nullable=True)  # active, resolved, ongoing, monitoring
    notes = Column(Text, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    pet = relationship("Pet")


class PetAllergy(BaseModel):
    """Allergies for pets."""
    
    __tablename__ = "pet_allergies"
    
    # Pet relationship
    pet_id = Column(UUID(as_uuid=True), ForeignKey("pets.id"), nullable=False, index=True)
    
    # Allergy details
    allergen = Column(String(200), nullable=False)
    reaction_type = Column(String(100), nullable=True)
    severity = Column(String(20), nullable=True)  # mild, moderate, severe
    discovered_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    pet = relationship("Pet")


class PetVaccinationRecord(BaseModel):
    """Vaccination records for pets."""
    
    __tablename__ = "pet_vaccination_records"
    
    # Pet relationship
    pet_id = Column(UUID(as_uuid=True), ForeignKey("pets.id"), nullable=False, index=True)
    
    # Vaccination details
    vaccine_name = Column(String(200), nullable=False)
    vaccine_type = Column(String(100), nullable=False)  # rabies, DHPP, etc.
    administered_date = Column(Date, nullable=False)
    expiration_date = Column(Date, nullable=True)
    
    # Administration details
    veterinarian = Column(String(200), nullable=True)
    clinic_name = Column(String(200), nullable=True)
    batch_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    pet = relationship("Pet")


class PetMedicalHistoryEntry(BaseModel):
    """Medical history entries for pets."""
    
    __tablename__ = "pet_medical_history"
    
    # Pet relationship
    pet_id = Column(UUID(as_uuid=True), ForeignKey("pets.id"), nullable=False, index=True)
    
    # Entry details
    entry_date = Column(Date, nullable=False)
    entry_type = Column(String(50), nullable=False)  # checkup, emergency, surgery, etc.
    description = Column(Text, nullable=False)
    
    # Medical details
    veterinarian = Column(String(200), nullable=True)
    clinic_name = Column(String(200), nullable=True)
    diagnosis = Column(Text, nullable=True)
    treatment_plan = Column(Text, nullable=True)
    
    # Follow-up information
    follow_up_required = Column(Boolean, default=False, nullable=False)
    follow_up_date = Column(Date, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    pet = relationship("Pet")


class PetFile(BaseModel):
    """File storage for pet-related documents and photos."""
    
    __tablename__ = "pet_files"
    
    # Pet relationship
    pet_id = Column(UUID(as_uuid=True), ForeignKey("pets.id"), nullable=False, index=True)
    
    # File details
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, jpg, png, doc, etc.
    file_size = Column(Integer, nullable=False)  # in bytes
    mime_type = Column(String(100), nullable=False)
    
    # File organization
    document_type = Column(String(50), nullable=False)  # medical_record, vaccination, photo, etc.
    category = Column(String(50), nullable=True)  # additional categorization
    
    # Storage information
    file_path = Column(String(500), nullable=False)  # encrypted file path
    storage_backend = Column(String(50), default="local", nullable=False)  # local, s3, etc.
    
    # Security
    encrypted = Column(Boolean, default=True, nullable=False)
    encryption_key_id = Column(String(100), nullable=True)  # reference to encryption key
    
    # Metadata
    description = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)  # JSON array of tags
    
    # Version control
    version = Column(Integer, default=1, nullable=False)
    parent_file_id = Column(UUID(as_uuid=True), ForeignKey("pet_files.id"), nullable=True, index=True)
    is_current_version = Column(Boolean, default=True, nullable=False)
    
    # Processing status
    processing_status = Column(String(20), default="pending", nullable=False)  # pending, processing, completed, failed
    extracted_data = Column(Text, nullable=True)  # JSON of extracted medical data
    
    # Access control
    is_active = Column(Boolean, default=True, nullable=False)
    access_level = Column(String(20), default="private", nullable=False)  # private, shared, public
    
    # Relationships
    pet = relationship("Pet")
    parent_file = relationship("PetFile", remote_side="PetFile.id")
    child_versions = relationship("PetFile", back_populates="parent_file")


class FileProcessingLog(BaseModel):
    """Log of file processing operations."""
    
    __tablename__ = "file_processing_logs"
    
    # File relationship
    file_id = Column(UUID(as_uuid=True), ForeignKey("pet_files.id"), nullable=False, index=True)
    
    # Processing details
    operation_type = Column(String(50), nullable=False)  # upload, ocr, nlp_extraction, encryption
    status = Column(String(20), nullable=False)  # started, completed, failed
    
    # Results
    result_data = Column(Text, nullable=True)  # JSON of processing results
    error_message = Column(Text, nullable=True)
    
    # Performance metrics
    processing_time_ms = Column(Integer, nullable=True)
    
    # Relationships
    file = relationship("PetFile")