"""
Tests for health record service functionality.
"""

import pytest
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.health_record_service import HealthRecordService
from app.schemas.health_records import (
    HealthRecordCreate, SymptomLogCreate, VaccinationCreate, 
    AIAssessmentCreate, RecordTypeEnum, SeverityEnum, TriageLevelEnum
)
from app.database.models import User, Pet


class TestHealthRecordService:
    """Test health record service functionality."""
    
    @pytest.mark.asyncio
    async def test_create_health_record(self, db_session: AsyncSession):
        """Test creating a health record through the service."""
        # Create user and pet first
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            first_name="Test",
            last_name="User"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="Buddy",
            species="dog",
            birth_date=date(2020, 1, 1)
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        # Create health record through service
        service = HealthRecordService(db_session)
        
        health_record_data = HealthRecordCreate(
            pet_id=str(pet.id),
            record_date=date.today(),
            record_type=RecordTypeEnum.CHECKUP,
            description="Annual wellness exam",
            veterinarian="Dr. Smith",
            clinic_name="Pet Care Clinic"
        )
        
        result = await service.create_health_record(str(user.id), health_record_data)
        
        assert result.id is not None
        assert result.pet_id == str(pet.id)
        assert result.record_type == "checkup"
        assert result.description == "Annual wellness exam"
        assert result.veterinarian == "Dr. Smith"
        assert result.clinic_name == "Pet Care Clinic"
    
    @pytest.mark.asyncio
    async def test_get_pet_health_records(self, db_session: AsyncSession):
        """Test retrieving health records for a pet."""
        # Create user and pet first
        user = User(
            email="test2@example.com",
            password_hash="hashed_password",
            first_name="Test",
            last_name="User"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="Max",
            species="dog",
            birth_date=date(2019, 6, 15)
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        # Create health records through service
        service = HealthRecordService(db_session)
        
        # Create first record
        record1_data = HealthRecordCreate(
            pet_id=str(pet.id),
            record_date=date.today(),
            record_type=RecordTypeEnum.CHECKUP,
            description="Routine checkup"
        )
        await service.create_health_record(str(user.id), record1_data)
        
        # Create second record
        record2_data = HealthRecordCreate(
            pet_id=str(pet.id),
            record_date=date.today(),
            record_type=RecordTypeEnum.SYMPTOM_LOG,
            description="Coughing symptoms"
        )
        await service.create_health_record(str(user.id), record2_data)
        
        # Retrieve records
        result = await service.get_pet_health_records(str(user.id), str(pet.id))
        
        assert result.total_count == 2
        assert len(result.records) == 2
        assert result.has_more == False
    
    @pytest.mark.asyncio
    async def test_add_symptom_log(self, db_session: AsyncSession):
        """Test adding a symptom log to a health record."""
        # Create user and pet first
        user = User(
            email="test3@example.com",
            password_hash="hashed_password",
            first_name="Test",
            last_name="User"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="Luna",
            species="cat",
            birth_date=date(2021, 3, 10)
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        # Create health record
        service = HealthRecordService(db_session)
        
        health_record_data = HealthRecordCreate(
            pet_id=str(pet.id),
            record_date=date.today(),
            record_type=RecordTypeEnum.SYMPTOM_LOG,
            description="Symptom observation"
        )
        
        health_record = await service.create_health_record(str(user.id), health_record_data)
        
        # Add symptom log
        symptom_data = SymptomLogCreate(
            symptom_description="Excessive scratching and hair loss",
            severity=SeverityEnum.MODERATE,
            duration="3 days",
            observed_at=datetime.now()
        )
        
        symptom_result = await service.add_symptom_log(str(user.id), health_record.id, symptom_data)
        
        assert symptom_result.id is not None
        assert symptom_result.health_record_id == health_record.id
        assert symptom_result.symptom_description == "Excessive scratching and hair loss"
        assert symptom_result.severity == "moderate"
        assert symptom_result.duration == "3 days"
    
    @pytest.mark.asyncio
    async def test_generate_health_summary(self, db_session: AsyncSession):
        """Test generating a health summary."""
        # Create user and pet first
        user = User(
            email="test4@example.com",
            password_hash="hashed_password",
            first_name="Test",
            last_name="User"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="Charlie",
            species="dog",
            birth_date=date(2018, 8, 20)
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        # Create health record
        service = HealthRecordService(db_session)
        
        health_record_data = HealthRecordCreate(
            pet_id=str(pet.id),
            record_date=date.today(),
            record_type=RecordTypeEnum.CHECKUP,
            description="Health summary test record"
        )
        
        await service.create_health_record(str(user.id), health_record_data)
        
        # Generate health summary
        summary = await service.generate_health_summary(
            str(user.id), str(pet.id), include_ai_insights=False, date_range_days=30
        )
        
        assert summary.pet_id == str(pet.id)
        assert summary.pet_name == "Charlie"
        assert summary.summary_period_days == 30
        assert summary.stats.total_records == 1
        assert len(summary.recent_records) == 1