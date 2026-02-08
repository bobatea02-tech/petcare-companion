"""
Tests for notification service functionality.
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch

from app.services.notification_service import notification_service


class TestNotificationService:
    """Test cases for notification service."""
    
    @pytest.mark.asyncio
    async def test_schedule_medication_reminders_success(self):
        """Test successful scheduling of medication reminders."""
        with patch('app.services.notification_service.get_db_session') as mock_session:
            mock_session_instance = AsyncMock()
            mock_session.return_value.__aenter__.return_value = mock_session_instance
            
            # Mock medication logs query
            mock_session_instance.execute.return_value.scalars.return_value.all.return_value = []
            
            result = await notification_service.schedule_medication_reminders()
            
            assert "timestamp" in result
            assert result["reminders_scheduled"] == 0
            assert result["notifications_sent"] == 0
            assert isinstance(result["errors"], list)
    
    @pytest.mark.asyncio
    async def test_schedule_feeding_reminders_success(self):
        """Test successful scheduling of feeding reminders."""
        with patch('app.services.notification_service.get_db_session') as mock_session:
            mock_session_instance = AsyncMock()
            mock_session.return_value.__aenter__.return_value = mock_session_instance
            
            # Mock feeding logs query
            mock_session_instance.execute.return_value.scalars.return_value.all.return_value = []
            
            result = await notification_service.schedule_feeding_reminders()
            
            assert "timestamp" in result
            assert result["reminders_scheduled"] == 0
            assert result["notifications_sent"] == 0
            assert isinstance(result["errors"], list)
    
    @pytest.mark.asyncio
    async def test_schedule_appointment_reminders_success(self):
        """Test successful scheduling of appointment reminders."""
        with patch('app.services.notification_service.get_db_session') as mock_session:
            mock_session_instance = AsyncMock()
            mock_session.return_value.__aenter__.return_value = mock_session_instance
            
            # Mock appointment queries (both 24h and 2h)
            mock_session_instance.execute.return_value.scalars.return_value.all.return_value = []
            
            result = await notification_service.schedule_appointment_reminders()
            
            assert "timestamp" in result
            assert result["reminders_24h"] == 0
            assert result["reminders_2h"] == 0
            assert result["notifications_sent"] == 0
            assert isinstance(result["errors"], list)
    
    @pytest.mark.asyncio
    async def test_generate_weekly_health_reports_success(self):
        """Test successful generation of weekly health reports."""
        with patch('app.services.notification_service.get_db_session') as mock_session:
            mock_session_instance = AsyncMock()
            mock_session.return_value.__aenter__.return_value = mock_session_instance
            
            # Mock users query
            mock_session_instance.execute.return_value.scalars.return_value.all.return_value = []
            
            result = await notification_service.generate_weekly_health_reports()
            
            assert "timestamp" in result
            assert result["reports_generated"] == 0
            assert result["reports_sent"] == 0
            assert isinstance(result["errors"], list)
    
    @pytest.mark.asyncio
    async def test_create_medication_reminder(self):
        """Test creation of medication reminder notification."""
        # Mock medication log with related objects
        mock_medication_log = AsyncMock()
        mock_medication_log.medication.pet.name = "Buddy"
        mock_medication_log.medication.pet.owner.email = "test@example.com"
        mock_medication_log.medication.pet.owner.phone_number = "+1234567890"
        mock_medication_log.medication.medication_name = "Antibiotics"
        mock_medication_log.dosage_given = "10mg"
        mock_medication_log.administered_at = datetime.utcnow()
        
        prefs = {"medication_reminders": True}
        
        notification = await notification_service._create_medication_reminder(
            mock_medication_log, prefs
        )
        
        assert notification["type"] == "medication_reminder"
        assert "Buddy" in notification["title"]
        assert "Antibiotics" in notification["message"]
        assert notification["dosage"] == "10mg"
        assert notification["user_email"] == "test@example.com"
    
    @pytest.mark.asyncio
    async def test_create_feeding_reminder(self):
        """Test creation of feeding reminder notification."""
        # Mock feeding log with related objects
        mock_feeding_log = AsyncMock()
        mock_feeding_log.pet.name = "Buddy"
        mock_feeding_log.pet.owner.email = "test@example.com"
        mock_feeding_log.pet.owner.phone_number = "+1234567890"
        mock_feeding_log.food_type = "Dry Food"
        mock_feeding_log.amount = "1 cup"
        mock_feeding_log.feeding_time = datetime.utcnow()
        
        prefs = {"feeding_reminders": True}
        
        notification = await notification_service._create_feeding_reminder(
            mock_feeding_log, prefs
        )
        
        assert notification["type"] == "feeding_reminder"
        assert "Buddy" in notification["title"]
        assert "Dry Food" in notification["message"]
        assert notification["amount"] == "1 cup"
        assert notification["user_email"] == "test@example.com"
    
    @pytest.mark.asyncio
    async def test_create_appointment_reminder(self):
        """Test creation of appointment reminder notification."""
        # Mock appointment with related objects
        mock_appointment = AsyncMock()
        mock_appointment.pet.name = "Buddy"
        mock_appointment.pet.owner.email = "test@example.com"
        mock_appointment.pet.owner.phone_number = "+1234567890"
        mock_appointment.appointment_type = "checkup"
        mock_appointment.clinic_name = "Pet Clinic"
        mock_appointment.appointment_date = datetime.utcnow()
        
        prefs = {"appointment_reminders": True}
        
        notification = await notification_service._create_appointment_reminder(
            mock_appointment, "24_hours", prefs
        )
        
        assert notification["type"] == "appointment_reminder"
        assert notification["reminder_type"] == "24_hours"
        assert "Buddy" in notification["title"]
        assert "24 hours" in notification["message"]
        assert notification["clinic_name"] == "Pet Clinic"
        assert notification["user_email"] == "test@example.com"