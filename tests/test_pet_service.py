"""
Tests for pet profile management service.
"""

import pytest
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
import uuid

from app.services.pet_service import PetService
from app.services.medical_service import MedicalService
from app.database.models import User, Pet
from app.schemas.pets import (
    PetCreate, PetUpdate, MedicalConditionCreate, AllergyCreate,
    VaccinationRecordCreate, MedicalHistoryEntryCreate
)


class TestPetService:
    """Test PetService functionality."""
    
    @pytest.mark.asyncio
    async def test_create_pet_profile(self, db_session: AsyncSession):
        """Test creating a pet profile with required fields."""
        # Create user first
        user = User(
            email="petowner@example.com",
            password_hash="hashed_password",
            first_name="Pet",
            last_name="Owner"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        # Create pet profile
        pet_service = PetService(db_session)
        pet_data = PetCreate(
            name="Buddy",
            species="dog",
            birth_date=date(2020, 5, 15),
            breed="Golden Retriever",
            weight=65.5,
            gender="male",
            medical_conditions="Hip dysplasia",
            allergies="Chicken",
            behavioral_notes="Friendly and energetic"
        )
        
        result = await pet_service.create_pet_profile(str(user.id), pet_data)
        
        assert result.name == "Buddy"
        assert result.species == "dog"
        assert result.birth_date == date(2020, 5, 15)
        assert result.breed == "Golden Retriever"
        assert result.weight == 65.5
        assert result.gender == "male"
        assert result.medical_conditions == "Hip dysplasia"
        assert result.allergies == "Chicken"
        assert result.behavioral_notes == "Friendly and energetic"
        assert result.is_active is True
        assert result.user_id == str(user.id)
        assert result.id is not None
    
    @pytest.mark.asyncio
    async def test_get_pet_profile(self, db_session: AsyncSession):
        """Test retrieving a pet profile by ID."""
        # Create user and pet
        user = User(
            email="owner2@example.com",
            password_hash="hashed_password",
            first_name="Jane",
            last_name="Smith"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="Max",
            species="cat",
            birth_date=date(2019, 3, 10),
            breed="Persian"
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        # Retrieve pet profile
        pet_service = PetService(db_session)
        result = await pet_service.get_pet_profile(str(user.id), str(pet.id))
        
        assert result.id == str(pet.id)
        assert result.name == "Max"
        assert result.species == "cat"
        assert result.breed == "Persian"
        assert result.user_id == str(user.id)
    
    @pytest.mark.asyncio
    async def test_get_user_pets(self, db_session: AsyncSession):
        """Test retrieving all pets for a user."""
        # Create user
        user = User(
            email="multiowner@example.com",
            password_hash="hashed_password",
            first_name="Multi",
            last_name="Owner"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        # Create multiple pets
        pets = [
            Pet(
                user_id=user.id,
                name="Dog1",
                species="dog",
                birth_date=date(2020, 1, 1)
            ),
            Pet(
                user_id=user.id,
                name="Cat1",
                species="cat",
                birth_date=date(2019, 6, 15)
            ),
            Pet(
                user_id=user.id,
                name="Bird1",
                species="bird",
                birth_date=date(2021, 8, 20),
                is_active=False  # Inactive pet
            )
        ]
        
        for pet in pets:
            db_session.add(pet)
        await db_session.commit()
        
        # Get active pets only
        pet_service = PetService(db_session)
        result = await pet_service.get_user_pets(str(user.id), include_inactive=False)
        
        assert result.total_count == 2
        assert result.active_count == 2
        assert len(result.pets) == 2
        
        # Get all pets including inactive
        result_all = await pet_service.get_user_pets(str(user.id), include_inactive=True)
        
        assert result_all.total_count == 3
        assert result_all.active_count == 2
        assert len(result_all.pets) == 3
    
    @pytest.mark.asyncio
    async def test_update_pet_profile(self, db_session: AsyncSession):
        """Test updating a pet profile."""
        # Create user and pet
        user = User(
            email="updateowner@example.com",
            password_hash="hashed_password",
            first_name="Update",
            last_name="Owner"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="OldName",
            species="dog",
            birth_date=date(2020, 1, 1),
            weight=50.0
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        # Update pet profile
        pet_service = PetService(db_session)
        update_data = PetUpdate(
            name="NewName",
            weight=55.0,
            medical_conditions="Updated conditions"
        )
        
        result = await pet_service.update_pet_profile(str(user.id), str(pet.id), update_data)
        
        assert result.name == "NewName"
        assert result.weight == 55.0
        assert result.medical_conditions == "Updated conditions"
        assert result.species == "dog"  # Unchanged field
        assert result.birth_date == date(2020, 1, 1)  # Unchanged field
    
    @pytest.mark.asyncio
    async def test_delete_pet_profile_soft(self, db_session: AsyncSession):
        """Test soft deleting a pet profile."""
        # Create user and pet
        user = User(
            email="deleteowner@example.com",
            password_hash="hashed_password",
            first_name="Delete",
            last_name="Owner"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="ToDelete",
            species="cat",
            birth_date=date(2020, 1, 1)
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        # Soft delete pet
        pet_service = PetService(db_session)
        result = await pet_service.delete_pet_profile(str(user.id), str(pet.id), soft_delete=True)
        
        assert result is True
        
        # Verify pet is marked as inactive
        await db_session.refresh(pet)
        assert pet.is_active is False
    
    @pytest.mark.asyncio
    async def test_pet_not_found_error(self, db_session: AsyncSession):
        """Test error handling when pet is not found."""
        # Create user
        user = User(
            email="errorowner@example.com",
            password_hash="hashed_password",
            first_name="Error",
            last_name="Owner"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet_service = PetService(db_session)
        fake_pet_id = str(uuid.uuid4())
        
        # Test get_pet_profile with non-existent pet
        with pytest.raises(HTTPException) as exc_info:
            await pet_service.get_pet_profile(str(user.id), fake_pet_id)
        
        assert exc_info.value.status_code == 404
        assert "Pet not found" in str(exc_info.value.detail)


class TestMedicalService:
    """Test MedicalService functionality."""
    
    @pytest.mark.asyncio
    async def test_add_medical_condition(self, db_session: AsyncSession):
        """Test adding a medical condition to a pet."""
        # Create user and pet
        user = User(
            email="medowner@example.com",
            password_hash="hashed_password",
            first_name="Med",
            last_name="Owner"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="SickPet",
            species="dog",
            birth_date=date(2020, 1, 1)
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        # Add medical condition
        medical_service = MedicalService(db_session)
        condition_data = MedicalConditionCreate(
            condition_name="Arthritis",
            diagnosis_date=date(2023, 6, 15),
            severity="moderate",
            treatment_status="ongoing",
            notes="Requires daily medication"
        )
        
        result = await medical_service.add_medical_condition(str(user.id), str(pet.id), condition_data)
        
        assert result.condition_name == "Arthritis"
        assert result.diagnosis_date == date(2023, 6, 15)
        assert result.severity == "moderate"
        assert result.treatment_status == "ongoing"
        assert result.notes == "Requires daily medication"
        assert result.pet_id == str(pet.id)
    
    @pytest.mark.asyncio
    async def test_add_allergy(self, db_session: AsyncSession):
        """Test adding an allergy to a pet."""
        # Create user and pet
        user = User(
            email="allergyowner@example.com",
            password_hash="hashed_password",
            first_name="Allergy",
            last_name="Owner"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="AllergyPet",
            species="cat",
            birth_date=date(2019, 5, 10)
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        # Add allergy
        medical_service = MedicalService(db_session)
        allergy_data = AllergyCreate(
            allergen="Pollen",
            reaction_type="Respiratory",
            severity="mild",
            discovered_date=date(2023, 4, 20),
            notes="Seasonal allergy, worse in spring"
        )
        
        result = await medical_service.add_allergy(str(user.id), str(pet.id), allergy_data)
        
        assert result.allergen == "Pollen"
        assert result.reaction_type == "Respiratory"
        assert result.severity == "mild"
        assert result.discovered_date == date(2023, 4, 20)
        assert result.notes == "Seasonal allergy, worse in spring"
        assert result.pet_id == str(pet.id)
    
    @pytest.mark.asyncio
    async def test_add_vaccination_record(self, db_session: AsyncSession):
        """Test adding a vaccination record to a pet."""
        # Create user and pet
        user = User(
            email="vacowner@example.com",
            password_hash="hashed_password",
            first_name="Vac",
            last_name="Owner"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="VacPet",
            species="dog",
            birth_date=date(2020, 3, 15)
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        # Add vaccination record
        medical_service = MedicalService(db_session)
        vaccination_data = VaccinationRecordCreate(
            vaccine_name="Rabies",
            vaccine_type="rabies",
            administered_date=date(2023, 8, 10),
            expiration_date=date(2024, 8, 10),
            veterinarian="Dr. Johnson",
            clinic_name="Pet Health Clinic",
            batch_number="RAB123456",
            notes="Annual rabies vaccination"
        )
        
        result = await medical_service.add_vaccination_record(str(user.id), str(pet.id), vaccination_data)
        
        assert result.vaccine_name == "Rabies"
        assert result.vaccine_type == "rabies"
        assert result.administered_date == date(2023, 8, 10)
        assert result.expiration_date == date(2024, 8, 10)
        assert result.veterinarian == "Dr. Johnson"
        assert result.clinic_name == "Pet Health Clinic"
        assert result.batch_number == "RAB123456"
        assert result.notes == "Annual rabies vaccination"
        assert result.pet_id == str(pet.id)
    
    @pytest.mark.asyncio
    async def test_add_medical_history_entry(self, db_session: AsyncSession):
        """Test adding a medical history entry to a pet."""
        # Create user and pet
        user = User(
            email="historyowner@example.com",
            password_hash="hashed_password",
            first_name="History",
            last_name="Owner"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="HistoryPet",
            species="cat",
            birth_date=date(2018, 12, 5)
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        # Add medical history entry
        medical_service = MedicalService(db_session)
        history_data = MedicalHistoryEntryCreate(
            entry_date=date(2023, 9, 15),
            entry_type="checkup",
            description="Annual wellness examination",
            veterinarian="Dr. Smith",
            clinic_name="Animal Hospital",
            diagnosis="Healthy",
            treatment_plan="Continue current diet and exercise",
            follow_up_required=True,
            follow_up_date=date(2024, 9, 15)
        )
        
        result = await medical_service.add_medical_history_entry(str(user.id), str(pet.id), history_data)
        
        assert result.entry_date == date(2023, 9, 15)
        assert result.entry_type == "checkup"
        assert result.description == "Annual wellness examination"
        assert result.veterinarian == "Dr. Smith"
        assert result.clinic_name == "Animal Hospital"
        assert result.diagnosis == "Healthy"
        assert result.treatment_plan == "Continue current diet and exercise"
        assert result.follow_up_required is True
        assert result.follow_up_date == date(2024, 9, 15)
        assert result.pet_id == str(pet.id)
    
    @pytest.mark.asyncio
    async def test_get_pet_medical_summary(self, db_session: AsyncSession):
        """Test getting comprehensive medical summary for a pet."""
        # Create user and pet
        user = User(
            email="summaryowner@example.com",
            password_hash="hashed_password",
            first_name="Summary",
            last_name="Owner"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        pet = Pet(
            user_id=user.id,
            name="SummaryPet",
            species="dog",
            birth_date=date(2019, 7, 20)
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        medical_service = MedicalService(db_session)
        
        # Add medical condition
        condition_data = MedicalConditionCreate(
            condition_name="Hip Dysplasia",
            severity="moderate",
            treatment_status="ongoing"
        )
        await medical_service.add_medical_condition(str(user.id), str(pet.id), condition_data)
        
        # Add allergy
        allergy_data = AllergyCreate(
            allergen="Beef",
            severity="mild"
        )
        await medical_service.add_allergy(str(user.id), str(pet.id), allergy_data)
        
        # Add vaccination
        vaccination_data = VaccinationRecordCreate(
            vaccine_name="DHPP",
            vaccine_type="distemper",
            administered_date=date(2025, 5, 1),
            expiration_date=date(2026, 5, 1)  # Future expiration date
        )
        await medical_service.add_vaccination_record(str(user.id), str(pet.id), vaccination_data)
        
        # Add medical history
        history_data = MedicalHistoryEntryCreate(
            entry_date=date(2023, 6, 1),
            entry_type="checkup",
            description="Regular checkup"
        )
        await medical_service.add_medical_history_entry(str(user.id), str(pet.id), history_data)
        
        # Get medical summary
        result = await medical_service.get_pet_medical_summary(str(user.id), str(pet.id))
        
        assert result.pet_id == str(pet.id)
        assert result.pet_name == "SummaryPet"
        assert result.total_conditions == 1
        assert result.active_conditions == 1  # ongoing condition
        assert result.total_allergies == 1
        assert result.total_vaccinations == 1
        assert result.expired_vaccinations == 0  # vaccination is still valid
        assert len(result.medical_conditions) == 1
        assert len(result.allergies) == 1
        assert len(result.vaccinations) == 1
        assert len(result.medical_history) == 1