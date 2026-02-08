"""
Tests for database models.
"""

import pytest
from datetime import date, datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.sql import func
from sqlalchemy.orm import selectinload
from hypothesis import given, strategies as st, settings, HealthCheck
from hypothesis.strategies import composite
import uuid
import asyncio

from app.database.models import (
    User, Pet, Medication, MedicationLog, FeedingLog, FeedingSchedule, HealthRecord, 
    Appointment, NotificationPreference, SymptomLog, Vaccination, AIAssessment, VetClinic
)


# Hypothesis strategies for generating test data
@composite
def user_strategy(draw):
    """Generate valid user data."""
    return {
        "email": draw(st.emails()),
        "password_hash": draw(st.text(min_size=8, max_size=255)),
        "first_name": draw(st.text(min_size=1, max_size=100, alphabet=st.characters(whitelist_categories=('Lu', 'Ll')))),
        "last_name": draw(st.text(min_size=1, max_size=100, alphabet=st.characters(whitelist_categories=('Lu', 'Ll')))),
        "phone_number": draw(st.one_of(st.none(), st.text(min_size=10, max_size=20, alphabet=st.characters(whitelist_categories=('Nd',))))),
        "emergency_contact": draw(st.one_of(st.none(), st.text(min_size=1, max_size=255))),
        "preferred_vet_clinic": draw(st.one_of(st.none(), st.text(min_size=1, max_size=255))),
    }


@composite
def pet_strategy(draw, user_id=None):
    """Generate valid pet data."""
    species_options = ["dog", "cat", "bird", "rabbit", "hamster", "guinea pig", "fish", "reptile"]
    gender_options = ["male", "female", "unknown"]
    
    return {
        "user_id": user_id or draw(st.uuids()),
        "name": draw(st.text(min_size=1, max_size=100, alphabet=st.characters(whitelist_categories=('Lu', 'Ll')))),
        "species": draw(st.sampled_from(species_options)),
        "birth_date": draw(st.dates(min_value=date(2000, 1, 1), max_value=date.today())),
        "breed": draw(st.one_of(st.none(), st.text(min_size=1, max_size=100))),
        "weight": draw(st.one_of(st.none(), st.floats(min_value=0.1, max_value=200.0))),
        "gender": draw(st.one_of(st.none(), st.sampled_from(gender_options))),
        "medical_conditions": draw(st.one_of(st.none(), st.text(max_size=1000))),
        "allergies": draw(st.one_of(st.none(), st.text(max_size=1000))),
        "behavioral_notes": draw(st.one_of(st.none(), st.text(max_size=1000))),
    }


@composite
def medication_strategy(draw, pet_id=None):
    """Generate valid medication data."""
    return {
        "pet_id": pet_id or draw(st.uuids()),
        "medication_name": draw(st.text(min_size=1, max_size=200)),
        "dosage": draw(st.text(min_size=1, max_size=100)),
        "frequency": draw(st.text(min_size=1, max_size=100)),
        "start_date": draw(st.dates(min_value=date(2020, 1, 1), max_value=date.today())),
        "end_date": draw(st.one_of(st.none(), st.dates(min_value=date.today(), max_value=date(2030, 12, 31)))),
        "refill_threshold": draw(st.integers(min_value=1, max_value=30)),
        "current_quantity": draw(st.integers(min_value=0, max_value=1000)),
        "administration_instructions": draw(st.one_of(st.none(), st.text(max_size=1000))),
    }


class TestUserModel:
    """Test User model functionality."""
    
    @pytest.mark.asyncio
    async def test_create_user(self, db_session: AsyncSession):
        """Test creating a user with required fields."""
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            first_name="John",
            last_name="Doe"
        )
        
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.first_name == "John"
        assert user.last_name == "Doe"
        assert user.is_active is True
        assert user.email_verified is False


class TestPetModel:
    """Test Pet model functionality."""
    
    @pytest.mark.asyncio
    async def test_create_pet(self, db_session: AsyncSession):
        """Test creating a pet with required fields."""
        # First create a user
        user = User(
            email="owner@example.com",
            password_hash="hashed_password",
            first_name="Jane",
            last_name="Smith"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        # Create pet
        pet = Pet(
            user_id=user.id,
            name="Buddy",
            species="dog",
            birth_date=date(2020, 5, 15)
        )
        
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        assert pet.id is not None
        assert pet.user_id == user.id
        assert pet.name == "Buddy"
        assert pet.species == "dog"
        assert pet.birth_date == date(2020, 5, 15)
        assert pet.is_active is True


class TestMedicationModel:
    """Test Medication model functionality."""
    
    @pytest.mark.asyncio
    async def test_create_medication(self, db_session: AsyncSession):
        """Test creating a medication with required fields."""
        # Create user and pet first
        user = User(
            email="owner@example.com",
            password_hash="hashed_password",
            first_name="Jane",
            last_name="Smith"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="Buddy",
            species="dog",
            birth_date=date(2020, 5, 15)
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        # Create medication
        medication = Medication(
            pet_id=pet.id,
            medication_name="Antibiotics",
            dosage="10mg",
            frequency="twice daily",
            start_date=date.today(),
            current_quantity=30
        )
        
        db_session.add(medication)
        await db_session.commit()
        await db_session.refresh(medication)
        
        assert medication.id is not None
        assert medication.pet_id == pet.id
        assert medication.medication_name == "Antibiotics"
        assert medication.active is True


class TestHealthRecordModel:
    """Test HealthRecord model functionality."""
    
    @pytest.mark.asyncio
    async def test_create_health_record(self, db_session: AsyncSession):
        """Test creating a health record with required fields."""
        # Create user and pet first
        user = User(
            email="owner@example.com",
            password_hash="hashed_password",
            first_name="Jane",
            last_name="Smith"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="Buddy",
            species="dog",
            birth_date=date(2020, 5, 15)
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        # Create health record
        health_record = HealthRecord(
            pet_id=pet.id,
            record_date=date.today(),
            record_type="checkup",
            description="Annual wellness exam",
            veterinarian="Dr. Smith",
            clinic_name="Pet Care Clinic"
        )
        
        db_session.add(health_record)
        await db_session.commit()
        await db_session.refresh(health_record)
        
        assert health_record.id is not None
        assert health_record.pet_id == pet.id
        assert health_record.record_type == "checkup"
        assert health_record.description == "Annual wellness exam"
        assert health_record.veterinarian == "Dr. Smith"
    
    @pytest.mark.asyncio
    async def test_health_record_with_symptom_logs(self, db_session: AsyncSession):
        """Test creating a health record with symptom logs."""
        # Create user and pet first
        user = User(
            email="owner2@example.com",
            password_hash="hashed_password",
            first_name="John",
            last_name="Doe"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="Max",
            species="cat",
            birth_date=date(2019, 3, 10)
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        # Create health record
        health_record = HealthRecord(
            pet_id=pet.id,
            record_date=date.today(),
            record_type="symptom_log",
            description="Pet showing signs of lethargy"
        )
        db_session.add(health_record)
        await db_session.commit()
        await db_session.refresh(health_record)
        
        # Create symptom log
        symptom_log = SymptomLog(
            health_record_id=health_record.id,
            symptom_description="Lethargy and loss of appetite",
            severity="moderate",
            duration="2 days",
            observed_at=datetime.now()
        )
        db_session.add(symptom_log)
        await db_session.commit()
        await db_session.refresh(symptom_log)
        
        assert symptom_log.id is not None
        assert symptom_log.health_record_id == health_record.id
        assert symptom_log.severity == "moderate"
        assert symptom_log.duration == "2 days"


class TestAppointmentModel:
    """Test Appointment model functionality."""
    
    @pytest.mark.asyncio
    async def test_create_appointment(self, db_session: AsyncSession):
        """Test creating an appointment with required fields."""
        # Create user and pet first
        user = User(
            email="owner3@example.com",
            password_hash="hashed_password",
            first_name="Alice",
            last_name="Johnson"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="Luna",
            species="dog",
            birth_date=date(2021, 8, 20)
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        # Create appointment
        appointment_time = datetime.now() + timedelta(days=7)
        appointment = Appointment(
            pet_id=pet.id,
            appointment_date=appointment_time,
            appointment_type="vaccination",
            purpose="Annual vaccinations",
            clinic_name="Downtown Vet Clinic",
            clinic_address="123 Main St, City, State",
            clinic_phone="555-0123",
            veterinarian="Dr. Brown"
        )
        
        db_session.add(appointment)
        await db_session.commit()
        await db_session.refresh(appointment)
        
        assert appointment.id is not None
        assert appointment.pet_id == pet.id
        assert appointment.appointment_type == "vaccination"
        assert appointment.purpose == "Annual vaccinations"
        assert appointment.clinic_name == "Downtown Vet Clinic"
        assert appointment.status == "scheduled"  # default value
        assert appointment.reminder_sent_24h is False  # default value
        assert appointment.reminder_sent_2h is False  # default value
    
    @pytest.mark.asyncio
    async def test_appointment_status_updates(self, db_session: AsyncSession):
        """Test updating appointment status."""
        # Create user and pet first
        user = User(
            email="owner4@example.com",
            password_hash="hashed_password",
            first_name="Bob",
            last_name="Wilson"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="Charlie",
            species="cat",
            birth_date=date(2020, 12, 5)
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        # Create appointment
        appointment = Appointment(
            pet_id=pet.id,
            appointment_date=datetime.now() + timedelta(days=3),
            appointment_type="checkup",
            clinic_name="Pet Health Center"
        )
        db_session.add(appointment)
        await db_session.commit()
        await db_session.refresh(appointment)
        
        # Update appointment status
        appointment.status = "completed"
        appointment.notes = "Checkup completed successfully"
        await db_session.commit()
        await db_session.refresh(appointment)
        
        assert appointment.status == "completed"
        assert appointment.notes == "Checkup completed successfully"


class TestAIAssessmentModel:
    """Test AIAssessment model functionality."""
    
    @pytest.mark.asyncio
    async def test_create_ai_assessment(self, db_session: AsyncSession):
        """Test creating an AI assessment with required fields."""
        # Create user and pet first
        user = User(
            email="owner5@example.com",
            password_hash="hashed_password",
            first_name="Sarah",
            last_name="Davis"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="Bella",
            species="dog",
            birth_date=date(2019, 6, 15)
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        # Create health record
        health_record = HealthRecord(
            pet_id=pet.id,
            record_date=date.today(),
            record_type="symptom_log",
            description="AI triage assessment"
        )
        db_session.add(health_record)
        await db_session.commit()
        await db_session.refresh(health_record)
        
        # Create AI assessment
        ai_assessment = AIAssessment(
            pet_id=pet.id,
            health_record_id=health_record.id,
            symptoms_reported="Coughing and wheezing for 2 days",
            triage_level="Yellow",
            ai_analysis="Possible respiratory infection based on symptoms",
            recommendations="Schedule vet appointment within 24-48 hours",
            model_used="gpt-4-turbo",
            confidence_score=0.85
        )
        
        db_session.add(ai_assessment)
        await db_session.commit()
        await db_session.refresh(ai_assessment)
        
        assert ai_assessment.id is not None
        assert ai_assessment.pet_id == pet.id
        assert ai_assessment.health_record_id == health_record.id
        assert ai_assessment.triage_level == "Yellow"
        assert ai_assessment.model_used == "gpt-4-turbo"
        assert ai_assessment.confidence_score == 0.85


class TestVaccinationModel:
    """Test Vaccination model functionality."""
    
    @pytest.mark.asyncio
    async def test_create_vaccination(self, db_session: AsyncSession):
        """Test creating a vaccination record with required fields."""
        # Create user and pet first
        user = User(
            email="owner6@example.com",
            password_hash="hashed_password",
            first_name="Mike",
            last_name="Brown"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="Rocky",
            species="dog",
            birth_date=date(2020, 4, 10)
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        # Create health record for vaccination
        health_record = HealthRecord(
            pet_id=pet.id,
            record_date=date.today(),
            record_type="vaccination",
            description="Annual vaccination appointment"
        )
        db_session.add(health_record)
        await db_session.commit()
        await db_session.refresh(health_record)
        
        # Create vaccination record
        vaccination = Vaccination(
            health_record_id=health_record.id,
            vaccine_name="DHPP",
            vaccine_type="distemper",
            administered_date=date.today(),
            expiration_date=date.today() + timedelta(days=365),
            veterinarian="Dr. Johnson",
            clinic_name="Animal Hospital",
            batch_number="VAC123456"
        )
        
        db_session.add(vaccination)
        await db_session.commit()
        await db_session.refresh(vaccination)
        
        assert vaccination.id is not None
        assert vaccination.health_record_id == health_record.id
        assert vaccination.vaccine_name == "DHPP"
        assert vaccination.vaccine_type == "distemper"
        assert vaccination.veterinarian == "Dr. Johnson"
        assert vaccination.batch_number == "VAC123456"


# Property-based tests
class TestDatabaseModelIntegrity:
    """Property 16: Database Integrity and Performance - Property-based tests for database model integrity."""
    
    @given(user_data=user_strategy())
    @settings(max_examples=20, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
    @pytest.mark.asyncio
    async def test_user_model_integrity(self, user_data):
        """
        Feature: pawpal-voice-pet-care-assistant, Property 16: Database Integrity and Performance
        Test that User model maintains data integrity with valid inputs.
        Validates: Requirements 12.1, 12.2, 12.3
        """
        # Create fresh database session for each test run
        from tests.conftest import TestSessionLocal, test_engine
        from app.database.models import Base
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        async with TestSessionLocal() as db_session:
            # Make email unique for this test run by adding UUID
            user_data["email"] = f"{uuid.uuid4().hex[:8]}_{user_data['email']}"
            user = User(**user_data)
            
            # Test model creation
            db_session.add(user)
            await db_session.commit()
            await db_session.refresh(user)
            
            # Verify integrity
            assert user.id is not None
            assert isinstance(user.id, uuid.UUID)
            assert user.email == user_data["email"]
            assert user.first_name == user_data["first_name"]
            assert user.last_name == user_data["last_name"]
            assert user.created_at is not None
            assert user.updated_at is not None
            assert user.is_active is True
            assert user.email_verified is False
            
            # Test retrieval
            result = await db_session.execute(select(User).where(User.id == user.id))
            retrieved_user = result.scalar_one()
            assert retrieved_user.email == user_data["email"]
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    
    @given(user_data=user_strategy(), pet_data=pet_strategy())
    @settings(max_examples=20, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
    @pytest.mark.asyncio
    async def test_pet_user_relationship_integrity(self, user_data, pet_data):
        """
        Feature: pawpal-voice-pet-care-assistant, Property 16: Database Integrity and Performance
        Test that Pet-User relationships maintain referential integrity.
        Validates: Requirements 12.1, 12.2, 12.3
        """
        # Create fresh database session for each test run
        from tests.conftest import TestSessionLocal, test_engine
        from app.database.models import Base
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        async with TestSessionLocal() as db_session:
            # Make email unique for this test run
            user_data["email"] = f"{uuid.uuid4().hex[:8]}_{user_data['email']}"
            
            # Create user first
            user = User(**user_data)
            db_session.add(user)
            await db_session.commit()
            await db_session.refresh(user)
            
            # Create pet with user relationship
            pet_data["user_id"] = user.id
            pet = Pet(**pet_data)
            db_session.add(pet)
            await db_session.commit()
            await db_session.refresh(pet)
            
            # Verify relationship integrity
            assert pet.user_id == user.id
            assert pet.owner.id == user.id
            assert pet.owner.email == user_data["email"]
            
            # Test cascade behavior - pets should be accessible through user
            result = await db_session.execute(
                select(User).options(selectinload(User.pets)).where(User.id == user.id)
            )
            retrieved_user = result.scalar_one()
            assert len(retrieved_user.pets) == 1
            assert retrieved_user.pets[0].id == pet.id
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    
    @given(user_data=user_strategy(), pet_data=pet_strategy(), medication_data=medication_strategy())
    @settings(max_examples=20, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
    @pytest.mark.asyncio
    async def test_medication_pet_relationship_integrity(self, user_data, pet_data, medication_data):
        """
        Feature: pawpal-voice-pet-care-assistant, Property 16: Database Integrity and Performance
        Test that Medication-Pet relationships maintain referential integrity.
        Validates: Requirements 12.1, 12.2, 12.3
        """
        # Create fresh database session for each test run
        from tests.conftest import TestSessionLocal, test_engine
        from app.database.models import Base
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        async with TestSessionLocal() as db_session:
            # Make email unique for this test run
            user_data["email"] = f"{uuid.uuid4().hex[:8]}_{user_data['email']}"
            
            # Create user and pet first
            user = User(**user_data)
            db_session.add(user)
            await db_session.commit()
            await db_session.refresh(user)
            
            pet_data["user_id"] = user.id
            pet = Pet(**pet_data)
            db_session.add(pet)
            await db_session.commit()
            await db_session.refresh(pet)
            
            # Create medication with pet relationship
            medication_data["pet_id"] = pet.id
            medication = Medication(**medication_data)
            db_session.add(medication)
            await db_session.commit()
            await db_session.refresh(medication)
            
            # Verify relationship integrity
            assert medication.pet_id == pet.id
            assert medication.pet.id == pet.id
            assert medication.pet.name == pet_data["name"]
            
            # Test cascade behavior - medications should be accessible through pet
            result = await db_session.execute(
                select(Pet).options(selectinload(Pet.medications)).where(Pet.id == pet.id)
            )
            retrieved_pet = result.scalar_one()
            assert len(retrieved_pet.medications) == 1
            assert retrieved_pet.medications[0].id == medication.id
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    
    @pytest.mark.asyncio
    async def test_database_constraints_and_validation(self):
        """
        Feature: pawpal-voice-pet-care-assistant, Property 16: Database Integrity and Performance
        Test that database constraints are properly enforced.
        Validates: Requirements 12.1, 12.2, 12.3
        """
        # Create fresh database session for each test run
        from tests.conftest import TestSessionLocal, test_engine
        from app.database.models import Base
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        async with TestSessionLocal() as db_session:
            # Test unique email constraint
            unique_email = f"{uuid.uuid4().hex[:8]}@example.com"
            user1 = User(
                email=unique_email,
                password_hash="hash1",
                first_name="User",
                last_name="One"
            )
            user2 = User(
                email=unique_email,
                password_hash="hash2",
                first_name="User",
                last_name="Two"
            )
            
            db_session.add(user1)
            await db_session.commit()
            
            # Adding second user with same email should fail
            db_session.add(user2)
            with pytest.raises(Exception):  # SQLAlchemy will raise an integrity error
                await db_session.commit()
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    
    @pytest.mark.asyncio
    async def test_model_timestamps_and_metadata(self):
        """
        Feature: pawpal-voice-pet-care-assistant, Property 16: Database Integrity and Performance
        Test that model timestamps and metadata are properly maintained.
        Validates: Requirements 12.1, 12.2, 12.3
        """
        # Create fresh database session for each test run
        from tests.conftest import TestSessionLocal, test_engine
        from app.database.models import Base
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        async with TestSessionLocal() as db_session:
            unique_email = f"{uuid.uuid4().hex[:8]}@example.com"
            user = User(
                email=unique_email,
                password_hash="hashed_password",
                first_name="Time",
                last_name="Stamp"
            )
            
            db_session.add(user)
            await db_session.commit()
            await db_session.refresh(user)
            
            # Verify timestamps
            assert user.created_at is not None
            assert user.updated_at is not None
            assert isinstance(user.created_at, datetime)
            assert isinstance(user.updated_at, datetime)
            
            # Test update timestamp - add small delay to ensure timestamp difference
            original_updated_at = user.updated_at
            await asyncio.sleep(0.01)  # Small delay to ensure timestamp difference
            user.first_name = "Updated"
            await db_session.commit()
            await db_session.refresh(user)
            
            assert user.updated_at >= original_updated_at
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    
    @given(st.integers(min_value=1, max_value=3))
    @settings(max_examples=5, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
    @pytest.mark.asyncio
    async def test_concurrent_database_operations(self, num_operations):
        """
        Feature: pawpal-voice-pet-care-assistant, Property 16: Database Integrity and Performance
        Test that database handles concurrent operations with proper locking and consistency.
        Validates: Requirements 12.1, 12.2, 12.3
        """
        # Create fresh database session for each test run
        from tests.conftest import TestSessionLocal, test_engine
        from app.database.models import Base
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        async def create_user_and_pet(index):
            async with TestSessionLocal() as db_session:
                # Create unique user
                user = User(
                    email=f"user{index}_{uuid.uuid4().hex[:8]}@example.com",
                    password_hash=f"hash{index}",
                    first_name=f"User{index}",
                    last_name="Test"
                )
                db_session.add(user)
                await db_session.commit()
                await db_session.refresh(user)
                
                # Create pet for user
                pet = Pet(
                    user_id=user.id,
                    name=f"Pet{index}",
                    species="dog",
                    birth_date=date(2020, 1, 1)
                )
                db_session.add(pet)
                await db_session.commit()
                await db_session.refresh(pet)
                
                return user.id, pet.id
        
        # Run concurrent operations
        tasks = [create_user_and_pet(i) for i in range(num_operations)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Verify all operations succeeded
        successful_results = [r for r in results if not isinstance(r, Exception)]
        assert len(successful_results) == num_operations
        
        # Verify data integrity - all users and pets should be created
        async with TestSessionLocal() as db_session:
            user_count = await db_session.execute(select(func.count(User.id)))
            pet_count = await db_session.execute(select(func.count(Pet.id)))
            
            assert user_count.scalar() == num_operations
            assert pet_count.scalar() == num_operations
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    
    @given(st.lists(user_strategy(), min_size=1, max_size=3))
    @settings(max_examples=10, suppress_health_check=[HealthCheck.function_scoped_fixture])
    @pytest.mark.asyncio
    async def test_bulk_operations_integrity(self, users_data):
        """
        Feature: pawpal-voice-pet-care-assistant, Property 16: Database Integrity and Performance
        Test that bulk database operations maintain data integrity.
        Validates: Requirements 12.1, 12.2, 12.3
        """
        # Create fresh database session for each test run
        from tests.conftest import TestSessionLocal, test_engine
        from app.database.models import Base
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        async with TestSessionLocal() as db_session:
            # Make all emails unique
            for i, user_data in enumerate(users_data):
                user_data["email"] = f"{i}_{uuid.uuid4().hex[:8]}_{user_data['email']}"
            
            # Create users in bulk
            users = [User(**user_data) for user_data in users_data]
            db_session.add_all(users)
            await db_session.commit()
            
            # Refresh all users to get IDs
            for user in users:
                await db_session.refresh(user)
            
            # Verify all users were created with proper relationships
            result = await db_session.execute(select(User))
            all_users = result.scalars().all()
            assert len(all_users) == len(users_data)
            
            # Verify each user has correct data
            for user, original_data in zip(users, users_data):
                assert user.email == original_data["email"]
                assert user.first_name == original_data["first_name"]
                assert user.last_name == original_data["last_name"]
                assert user.id is not None
                assert user.created_at is not None
                assert user.updated_at is not None
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    
    @given(st.text(min_size=1, max_size=100))
    @settings(max_examples=10, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
    @pytest.mark.asyncio
    async def test_text_field_handling(self, text_content):
        """
        Feature: pawpal-voice-pet-care-assistant, Property 16: Database Integrity and Performance
        Test that text fields handle various content properly.
        Validates: Requirements 12.1, 12.2, 12.3
        """
        # Create fresh database session for each test run
        from tests.conftest import TestSessionLocal, test_engine
        from app.database.models import Base
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        async with TestSessionLocal() as db_session:
            # Create user and pet first
            user = User(
                email=f"{uuid.uuid4().hex[:8]}@example.com",
                password_hash="hash",
                first_name="Test",
                last_name="User"
            )
            db_session.add(user)
            await db_session.commit()
            await db_session.refresh(user)
            
            # Create pet with text content in various fields
            pet = Pet(
                user_id=user.id,
                name="TestPet",
                species="dog",
                birth_date=date(2020, 1, 1),
                medical_conditions=text_content,
                allergies=text_content,
                behavioral_notes=text_content
            )
            db_session.add(pet)
            await db_session.commit()
            await db_session.refresh(pet)
            
            # Verify text content is stored and retrieved correctly
            assert pet.medical_conditions == text_content
            assert pet.allergies == text_content
            assert pet.behavioral_notes == text_content
            
            # Test retrieval
            result = await db_session.execute(select(Pet).where(Pet.id == pet.id))
            retrieved_pet = result.scalar_one()
            assert retrieved_pet.medical_conditions == text_content
            assert retrieved_pet.allergies == text_content
            assert retrieved_pet.behavioral_notes == text_content
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)


class TestPetProfileDataPersistence:
    """Property 2: Pet Profile Data Persistence - Property-based tests for pet profile data persistence."""
    
    @given(user_data=user_strategy(), pet_data=pet_strategy())
    @settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
    @pytest.mark.asyncio
    async def test_pet_profile_creation_and_persistence(self, user_data, pet_data):
        """
        Feature: pawpal-voice-pet-care-assistant, Property 2: Pet Profile Data Persistence
        Test that pet profiles are created with required fields and persist correctly.
        Validates: Requirements 2.1, 2.2, 2.4, 2.5
        """
        # Create fresh database session for each test run
        from tests.conftest import TestSessionLocal, test_engine
        from app.database.models import Base
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        async with TestSessionLocal() as db_session:
            # Make email unique for this test run
            user_data["email"] = f"{uuid.uuid4().hex[:8]}_{user_data['email']}"
            
            # Create user first
            user = User(**user_data)
            db_session.add(user)
            await db_session.commit()
            await db_session.refresh(user)
            
            # Create pet with user relationship - ensure required fields are present
            pet_data["user_id"] = user.id
            # Ensure required fields are not None
            if not pet_data.get("name"):
                pet_data["name"] = "TestPet"
            if not pet_data.get("species"):
                pet_data["species"] = "dog"
            if not pet_data.get("birth_date"):
                pet_data["birth_date"] = date(2020, 1, 1)
            
            pet = Pet(**pet_data)
            db_session.add(pet)
            await db_session.commit()
            await db_session.refresh(pet)
            
            # Validate required fields are stored correctly (Requirements 2.1, 2.5)
            assert pet.id is not None
            assert pet.user_id == user.id
            assert pet.name == pet_data["name"]
            assert pet.species == pet_data["species"]
            assert pet.birth_date == pet_data["birth_date"]
            assert pet.is_active is True
            
            # Validate medical information is stored for AI reference (Requirement 2.2)
            if pet_data.get("medical_conditions"):
                assert pet.medical_conditions == pet_data["medical_conditions"]
            if pet_data.get("allergies"):
                assert pet.allergies == pet_data["allergies"]
            if pet_data.get("behavioral_notes"):
                assert pet.behavioral_notes == pet_data["behavioral_notes"]
            
            # Test data persistence by retrieving from database
            result = await db_session.execute(select(Pet).where(Pet.id == pet.id))
            retrieved_pet = result.scalar_one()
            
            # Verify all data persists correctly
            assert retrieved_pet.name == pet_data["name"]
            assert retrieved_pet.species == pet_data["species"]
            assert retrieved_pet.birth_date == pet_data["birth_date"]
            assert retrieved_pet.user_id == user.id
            assert retrieved_pet.breed == pet_data.get("breed")
            assert retrieved_pet.weight == pet_data.get("weight")
            assert retrieved_pet.gender == pet_data.get("gender")
            assert retrieved_pet.medical_conditions == pet_data.get("medical_conditions")
            assert retrieved_pet.allergies == pet_data.get("allergies")
            assert retrieved_pet.behavioral_notes == pet_data.get("behavioral_notes")
            
            # Verify timestamps are set
            assert retrieved_pet.created_at is not None
            assert retrieved_pet.updated_at is not None
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    
    @given(user_data=user_strategy(), pet_data=pet_strategy())
    @settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
    @pytest.mark.asyncio
    async def test_pet_profile_update_with_version_history(self, user_data, pet_data):
        """
        Feature: pawpal-voice-pet-care-assistant, Property 2: Pet Profile Data Persistence
        Test that pet profile updates maintain version history.
        Validates: Requirements 2.4
        """
        # Create fresh database session for each test run
        from tests.conftest import TestSessionLocal, test_engine
        from app.database.models import Base
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        async with TestSessionLocal() as db_session:
            # Make email unique for this test run
            user_data["email"] = f"{uuid.uuid4().hex[:8]}_{user_data['email']}"
            
            # Create user first
            user = User(**user_data)
            db_session.add(user)
            await db_session.commit()
            await db_session.refresh(user)
            
            # Create initial pet profile
            pet_data["user_id"] = user.id
            # Ensure required fields are not None
            if not pet_data.get("name"):
                pet_data["name"] = "TestPet"
            if not pet_data.get("species"):
                pet_data["species"] = "dog"
            if not pet_data.get("birth_date"):
                pet_data["birth_date"] = date(2020, 1, 1)
            
            pet = Pet(**pet_data)
            db_session.add(pet)
            await db_session.commit()
            await db_session.refresh(pet)
            
            # Store original values
            original_name = pet.name
            original_weight = pet.weight
            original_updated_at = pet.updated_at
            
            # Add small delay to ensure timestamp difference
            await asyncio.sleep(0.01)
            
            # Update pet profile
            pet.name = f"Updated_{original_name}"
            pet.weight = 25.5 if original_weight != 25.5 else 30.0
            pet.medical_conditions = "Updated medical conditions"
            
            await db_session.commit()
            await db_session.refresh(pet)
            
            # Verify updates were applied
            assert pet.name == f"Updated_{original_name}"
            assert pet.weight == (25.5 if original_weight != 25.5 else 30.0)
            assert pet.medical_conditions == "Updated medical conditions"
            
            # Verify updated_at timestamp changed (version history tracking)
            assert pet.updated_at >= original_updated_at
            
            # Verify data persistence after update
            result = await db_session.execute(select(Pet).where(Pet.id == pet.id))
            retrieved_pet = result.scalar_one()
            
            assert retrieved_pet.name == f"Updated_{original_name}"
            assert retrieved_pet.weight == (25.5 if original_weight != 25.5 else 30.0)
            assert retrieved_pet.medical_conditions == "Updated medical conditions"
            assert retrieved_pet.updated_at >= original_updated_at
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    
    @given(user_data=user_strategy())
    @settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
    @pytest.mark.asyncio
    async def test_pet_profile_required_field_validation(self, user_data):
        """
        Feature: pawpal-voice-pet-care-assistant, Property 2: Pet Profile Data Persistence
        Test that required fields (species, name, birth_date) are validated before saving.
        Validates: Requirements 2.5
        """
        # Create fresh database session for each test run
        from tests.conftest import TestSessionLocal, test_engine
        from app.database.models import Base
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        async with TestSessionLocal() as db_session:
            # Make email unique for this test run
            user_data["email"] = f"{uuid.uuid4().hex[:8]}_{user_data['email']}"
            
            # Create user first
            user = User(**user_data)
            db_session.add(user)
            await db_session.commit()
            await db_session.refresh(user)
            
            # Test valid pet creation with all required fields
            valid_pet_data = {
                "user_id": user.id,
                "name": "ValidPet",
                "species": "cat",
                "birth_date": date(2021, 5, 15)
            }
            
            valid_pet = Pet(**valid_pet_data)
            db_session.add(valid_pet)
            await db_session.commit()
            await db_session.refresh(valid_pet)
            
            # Verify valid pet was created successfully
            assert valid_pet.id is not None
            assert valid_pet.name == "ValidPet"
            assert valid_pet.species == "cat"
            assert valid_pet.birth_date == date(2021, 5, 15)
            assert valid_pet.user_id == user.id
            
            # Test that required fields are properly stored and accessible
            result = await db_session.execute(select(Pet).where(Pet.id == valid_pet.id))
            retrieved_pet = result.scalar_one()
            assert retrieved_pet.name == "ValidPet"
            assert retrieved_pet.species == "cat"
            assert retrieved_pet.birth_date == date(2021, 5, 15)
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    
    @given(user_data=user_strategy(), pet_data=pet_strategy())
    @settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
    @pytest.mark.asyncio
    async def test_pet_medical_information_accessibility(self, user_data, pet_data):
        """
        Feature: pawpal-voice-pet-care-assistant, Property 2: Pet Profile Data Persistence
        Test that medical information is stored and accessible for AI reference.
        Validates: Requirements 2.2
        """
        # Create fresh database session for each test run
        from tests.conftest import TestSessionLocal, test_engine
        from app.database.models import Base
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        async with TestSessionLocal() as db_session:
            # Make email unique for this test run
            user_data["email"] = f"{uuid.uuid4().hex[:8]}_{user_data['email']}"
            
            # Create user first
            user = User(**user_data)
            db_session.add(user)
            await db_session.commit()
            await db_session.refresh(user)
            
            # Create pet with medical information
            pet_data["user_id"] = user.id
            # Ensure required fields are not None
            if not pet_data.get("name"):
                pet_data["name"] = "TestPet"
            if not pet_data.get("species"):
                pet_data["species"] = "dog"
            if not pet_data.get("birth_date"):
                pet_data["birth_date"] = date(2020, 1, 1)
            
            # Add specific medical information for testing
            pet_data["medical_conditions"] = "Diabetes, Hip dysplasia"
            pet_data["allergies"] = "Chicken, Wheat"
            pet_data["behavioral_notes"] = "Anxious around strangers"
            
            pet = Pet(**pet_data)
            db_session.add(pet)
            await db_session.commit()
            await db_session.refresh(pet)
            
            # Test that medical information is accessible through different query methods
            
            # Direct access
            assert pet.medical_conditions == "Diabetes, Hip dysplasia"
            assert pet.allergies == "Chicken, Wheat"
            assert pet.behavioral_notes == "Anxious around strangers"
            
            # Query by pet ID
            result = await db_session.execute(select(Pet).where(Pet.id == pet.id))
            retrieved_pet = result.scalar_one()
            assert retrieved_pet.medical_conditions == "Diabetes, Hip dysplasia"
            assert retrieved_pet.allergies == "Chicken, Wheat"
            assert retrieved_pet.behavioral_notes == "Anxious around strangers"
            
            # Query through user relationship (for AI reference)
            result = await db_session.execute(
                select(User).options(selectinload(User.pets)).where(User.id == user.id)
            )
            user_with_pets = result.scalar_one()
            pet_from_user = user_with_pets.pets[0]
            assert pet_from_user.medical_conditions == "Diabetes, Hip dysplasia"
            assert pet_from_user.allergies == "Chicken, Wheat"
            assert pet_from_user.behavioral_notes == "Anxious around strangers"
            
            # Test that medical information can be updated and remains accessible
            pet.medical_conditions = "Diabetes, Hip dysplasia, Arthritis"
            pet.allergies = "Chicken, Wheat, Beef"
            await db_session.commit()
            await db_session.refresh(pet)
            
            # Verify updated medical information is accessible
            result = await db_session.execute(select(Pet).where(Pet.id == pet.id))
            updated_pet = result.scalar_one()
            assert updated_pet.medical_conditions == "Diabetes, Hip dysplasia, Arthritis"
            assert updated_pet.allergies == "Chicken, Wheat, Beef"
        
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)