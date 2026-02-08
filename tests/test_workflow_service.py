"""
Tests for workflow service functionality.
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch, Mock

from app.services.workflow_service import workflow_service
from app.database.models import User, Pet, Medication, MedicationLog, FeedingSchedule, FeedingLog


class TestWorkflowService:
    """Test cases for workflow service."""
    
    @pytest.mark.asyncio
    async def test_execute_daily_automation_success(self):
        """Test successful execution of daily automation workflow."""
        # Mock the database session and methods
        with patch('app.services.workflow_service.get_db_session') as mock_session:
            mock_session_instance = AsyncMock()
            mock_session.return_value.__aenter__.return_value = mock_session_instance
            
            # Mock the private methods
            with patch.object(workflow_service, '_create_daily_medication_logs') as mock_med_logs, \
                 patch.object(workflow_service, '_create_daily_feeding_logs') as mock_feed_logs:
                
                mock_med_logs.return_value = {"created": 2, "errors": []}
                mock_feed_logs.return_value = {"created": 3, "errors": []}
                
                result = await workflow_service.execute_daily_automation()
                
                assert result["medication_logs_created"] == 2
                assert result["feeding_logs_created"] == 3
                assert len(result["errors"]) == 0
                assert "timestamp" in result
    
    @pytest.mark.asyncio
    async def test_execute_with_retry_success_first_attempt(self):
        """Test retry mechanism succeeds on first attempt."""
        async def mock_workflow():
            return {"success": True, "data": "test"}
        
        result = await workflow_service.execute_with_retry(mock_workflow)
        
        assert result["success"] is True
        assert result["data"] == "test"
    
    @pytest.mark.asyncio
    async def test_execute_with_retry_fails_all_attempts(self):
        """Test retry mechanism fails after all attempts."""
        async def mock_failing_workflow():
            raise Exception("Test error")
        
        result = await workflow_service.execute_with_retry(mock_failing_workflow)
        
        assert result["success"] is False
        assert "Test error" in result["error"]
        assert result["medication_logs_created"] == 0
        assert result["feeding_logs_created"] == 0
    
    @pytest.mark.asyncio
    async def test_get_user_workflow_preferences_default(self):
        """Test getting default workflow preferences when none exist."""
        with patch('app.services.workflow_service.get_db_session') as mock_session:
            mock_session_instance = AsyncMock()
            mock_session.return_value.__aenter__.return_value = mock_session_instance
            
            # Mock no existing preferences
            mock_session_instance.execute.return_value.scalar_one_or_none.return_value = None
            
            result = await workflow_service.get_user_workflow_preferences("test-user-id")
            
            assert result["medication_reminders"] is True
            assert result["feeding_reminders"] is True
            assert result["appointment_reminders"] is True
            assert result["weekly_reports"] is True
            assert result["reminder_advance_minutes"] == 15
    
    @pytest.mark.asyncio
    async def test_update_user_workflow_preferences_success(self):
        """Test successful update of user workflow preferences."""
        with patch('app.services.workflow_service.get_db_session') as mock_session:
            # Create proper async context manager mock
            mock_session_instance = AsyncMock()
            mock_session.return_value.__aenter__.return_value = mock_session_instance
            mock_session.return_value.__aexit__.return_value = None
            
            # Mock existing preferences
            mock_prefs = Mock()
            mock_prefs.medication_reminders = True
            mock_prefs.reminder_advance_minutes = 15
            
            # Mock the execute and scalar_one_or_none chain
            mock_result = Mock()
            mock_result.scalar_one_or_none.return_value = mock_prefs
            mock_session_instance.execute.return_value = mock_result
            
            # Mock commit
            mock_session_instance.commit = AsyncMock()
            mock_session_instance.add = Mock()
            
            preferences = {
                "medication_reminders": False,
                "reminder_advance_minutes": 30
            }
            
            result = await workflow_service.update_user_workflow_preferences(
                "test-user-id", preferences
            )
            
            assert result["success"] is True
            assert result["message"] == "Workflow preferences updated successfully"
            assert result["preferences"] == preferences