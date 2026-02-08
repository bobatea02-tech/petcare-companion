"""
Tests for AI Assistant Functions Service.
"""

import pytest
from datetime import datetime, date, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, patch
import uuid

from app.services.assistant_functions import (
    AssistantFunctions, 
    AssistantFunctionResult
)
from app.database.models import User, Pet, Medication, FeedingLog


class TestAssistantFunctions:
    """Test cases for assistant functions functionality."""
    
    @pytest.mark.asyncio
    async def test_check_medication_status_no_pet(self, db_session: AsyncSession):
        """Test medication status check with non-existent pet."""
        assistant_functions = AssistantFunctions(db_session)
        
        result = await assistant_functions.check_medication_status(
            pet_id=str(uuid.uuid4()),
            user_id=str(uuid.uuid4())
        )
        
        assert result.success is False
        assert result.function_name == "check_medication_status"
        assert "Pet not found" in result.message
    
    @pytest.mark.asyncio
    async def test_log_feeding_success(self, db_session: AsyncSession):
        """Test successful feeding log creation."""
        # Create user and pet
        user = User(
            email="test@example.com",
            password_hash="hashed",
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
            birth_date=date(2020, 1, 1),
            is_active=True
        )
        db_session.add(pet)
        await db_session.commit()
        await db_session.refresh(pet)
        
        assistant_functions = AssistantFunctions(db_session)
        
        result = await assistant_functions.log_feeding(
            pet_id=str(pet.id),
            user_id=str(user.id),
            food_type="kibble",
            amount="1 cup"
        )
        
        assert result.success is True
        assert result.function_name == "log_feeding"
        assert "Buddy" in result.message
        assert "kibble" in result.message
    
    def test_get_toxicity_information_chocolate(self):
        """Test toxicity information retrieval for chocolate."""
        assistant_functions = AssistantFunctions(None)  # No DB needed for this test
        
        info = assistant_functions._get_toxicity_information("chocolate", "dog")
        
        assert info["severity"] == "HIGH"
        assert "dog" in info["toxic_to"]
        assert "vomiting" in info["symptoms"]
    
    def test_get_toxicity_information_unknown(self):
        """Test toxicity information for unknown substance."""
        assistant_functions = AssistantFunctions(None)
        
        info = assistant_functions._get_toxicity_information("unknown_substance", "dog")
        
        assert info["severity"] == "UNKNOWN"
        assert "unknown" in info["toxic_to"]
    
    def test_assess_toxicity_urgency_high_severity(self):
        """Test toxicity urgency assessment for high severity substances."""
        assistant_functions = AssistantFunctions(None)
        
        toxicity_info = {
            "toxic_to": ["dog"],
            "severity": "HIGH",
            "symptoms": ["vomiting"]
        }
        
        urgency = assistant_functions._assess_toxicity_urgency(
            "chocolate", "dog", "1 bar", 20.0, toxicity_info
        )
        
        assert urgency == "EMERGENCY"
    
    def test_assess_toxicity_urgency_not_toxic_to_species(self):
        """Test toxicity urgency when substance is not toxic to the species."""
        assistant_functions = AssistantFunctions(None)
        
        toxicity_info = {
            "toxic_to": ["cat"],  # Not toxic to dogs
            "severity": "HIGH",
            "symptoms": ["vomiting"]
        }
        
        urgency = assistant_functions._assess_toxicity_urgency(
            "substance", "dog", "some", 20.0, toxicity_info
        )
        
        assert urgency == "LOW"
    
    def test_combine_vet_results_deduplication(self):
        """Test vet results combination and deduplication."""
        assistant_functions = AssistantFunctions(None)
        
        local_vets = [
            {"name": "Emergency Vet Clinic", "address": "123 Main St"},
            {"name": "Pet Hospital", "address": "456 Oak Ave"}
        ]
        
        google_vets = [
            {"name": "Emergency Vet Clinic", "address": "123 Main St"},  # Duplicate
            {"name": "Animal Emergency Center", "address": "789 Pine St"}
        ]
        
        combined = assistant_functions._combine_vet_results(local_vets, google_vets)
        
        assert len(combined) == 3  # Should deduplicate the first one
        clinic_names = [vet["name"] for vet in combined]
        assert "Emergency Vet Clinic" in clinic_names
        assert "Pet Hospital" in clinic_names
        assert "Animal Emergency Center" in clinic_names
    
    @pytest.mark.asyncio
    async def test_check_toxic_substance_emergency_level(self, db_session: AsyncSession):
        """Test toxic substance check returning emergency level."""
        assistant_functions = AssistantFunctions(db_session)
        
        result = await assistant_functions.check_toxic_substance(
            substance_name="chocolate",
            pet_species="dog"
        )
        
        assert result.success is True
        assert result.function_name == "check_toxic_substance"
        assert "EMERGENCY" in result.message
        assert "chocolate" in result.result_data["substance_name"]
        assert result.result_data["urgency_level"] == "EMERGENCY"