"""
Kiro Scheduled Workflows integration service for automated pet care tasks.
"""

import asyncio
import logging
from datetime import datetime, time, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.database.connection import get_db_session
from app.database.models import (
    User, Pet, Medication, MedicationLog, FeedingSchedule, 
    FeedingLog, NotificationPreference, Appointment
)
from app.core.config import settings


logger = logging.getLogger(__name__)


class WorkflowService:
    """Service for managing automated workflows and scheduled tasks."""
    
    def __init__(self):
        self.retry_attempts = 3
        self.retry_delay = 5  # seconds
        
    async def execute_daily_automation(self) -> Dict[str, Any]:
        """
        Execute daily automation tasks at 12:01 AM.
        Creates medication and feeding log entries for the day.
        """
        logger.info("Starting daily automation workflow")
        results = {
            "timestamp": datetime.utcnow().isoformat(),
            "medication_logs_created": 0,
            "feeding_logs_created": 0,
            "errors": []
        }
        
        try:
            async with get_db_session() as session:
                # Create medication logs for active medications
                medication_result = await self._create_daily_medication_logs(session)
                results["medication_logs_created"] = medication_result["created"]
                results["errors"].extend(medication_result["errors"])
                
                # Create feeding logs for active feeding schedules
                feeding_result = await self._create_daily_feeding_logs(session)
                results["feeding_logs_created"] = feeding_result["created"]
                results["errors"].extend(feeding_result["errors"])
                
                await session.commit()
                
        except Exception as e:
            logger.error(f"Daily automation workflow failed: {str(e)}")
            results["errors"].append(f"Workflow execution failed: {str(e)}")
            
        logger.info(f"Daily automation completed: {results}")
        return results
    
    async def _create_daily_medication_logs(self, session: AsyncSession) -> Dict[str, Any]:
        """Create medication log entries for all active medications."""
        result = {"created": 0, "errors": []}
        
        try:
            # Get all active medications
            stmt = select(Medication).where(
                and_(
                    Medication.active == True,
                    Medication.start_date <= datetime.utcnow().date()
                )
            ).options(selectinload(Medication.pet))
            
            medications = await session.execute(stmt)
            medications = medications.scalars().all()
            
            today = datetime.utcnow().date()
            
            for medication in medications:
                try:
                    # Check if medication is still valid (not expired)
                    if medication.end_date and medication.end_date < today:
                        continue
                    
                    # Check if log already exists for today
                    existing_log_stmt = select(MedicationLog).where(
                        and_(
                            MedicationLog.medication_id == medication.id,
                            MedicationLog.administered_at >= datetime.combine(today, time.min),
                            MedicationLog.administered_at < datetime.combine(today + timedelta(days=1), time.min)
                        )
                    )
                    existing_log = await session.execute(existing_log_stmt)
                    if existing_log.scalar_one_or_none():
                        continue  # Log already exists for today
                    
                    # Create new medication log entry
                    medication_log = MedicationLog(
                        medication_id=medication.id,
                        administered_at=datetime.combine(today, time(12, 1)),  # 12:01 AM
                        dosage_given=medication.dosage,
                        completed=False,  # User needs to mark as completed
                        notes="Auto-generated daily log entry"
                    )
                    
                    session.add(medication_log)
                    result["created"] += 1
                    
                except Exception as e:
                    error_msg = f"Failed to create medication log for {medication.medication_name}: {str(e)}"
                    logger.error(error_msg)
                    result["errors"].append(error_msg)
                    
        except Exception as e:
            error_msg = f"Failed to retrieve medications: {str(e)}"
            logger.error(error_msg)
            result["errors"].append(error_msg)
            
        return result
    
    async def _create_daily_feeding_logs(self, session: AsyncSession) -> Dict[str, Any]:
        """Create feeding log entries for all active feeding schedules."""
        result = {"created": 0, "errors": []}
        
        try:
            # Get all active feeding schedules
            stmt = select(FeedingSchedule).where(
                and_(
                    FeedingSchedule.active == True,
                    FeedingSchedule.recurring == True
                )
            ).options(selectinload(FeedingSchedule.pet))
            
            schedules = await session.execute(stmt)
            schedules = schedules.scalars().all()
            
            today = datetime.utcnow().date()
            
            for schedule in schedules:
                try:
                    # Check if log already exists for today
                    existing_log_stmt = select(FeedingLog).where(
                        and_(
                            FeedingLog.pet_id == schedule.pet_id,
                            FeedingLog.feeding_time >= datetime.combine(today, time.min),
                            FeedingLog.feeding_time < datetime.combine(today + timedelta(days=1), time.min),
                            FeedingLog.food_type == schedule.food_type
                        )
                    )
                    existing_log = await session.execute(existing_log_stmt)
                    if existing_log.scalar_one_or_none():
                        continue  # Log already exists for today
                    
                    # Create new feeding log entry
                    feeding_log = FeedingLog(
                        pet_id=schedule.pet_id,
                        feeding_time=datetime.combine(today, schedule.feeding_time.time()),
                        food_type=schedule.food_type,
                        amount=schedule.amount,
                        completed=False,  # User needs to mark as completed
                        notes="Auto-generated from feeding schedule"
                    )
                    
                    session.add(feeding_log)
                    result["created"] += 1
                    
                except Exception as e:
                    error_msg = f"Failed to create feeding log for pet {schedule.pet.name}: {str(e)}"
                    logger.error(error_msg)
                    result["errors"].append(error_msg)
                    
        except Exception as e:
            error_msg = f"Failed to retrieve feeding schedules: {str(e)}"
            logger.error(error_msg)
            result["errors"].append(error_msg)
            
        return result
    
    async def execute_with_retry(self, workflow_func, *args, **kwargs) -> Dict[str, Any]:
        """
        Execute a workflow function with retry logic and exponential backoff.
        """
        last_exception = None
        
        for attempt in range(self.retry_attempts):
            try:
                return await workflow_func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                if attempt < self.retry_attempts - 1:
                    delay = self.retry_delay * (2 ** attempt)  # Exponential backoff
                    logger.warning(f"Workflow attempt {attempt + 1} failed: {str(e)}. Retrying in {delay} seconds...")
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"Workflow failed after {self.retry_attempts} attempts: {str(e)}")
        
        # If all retries failed, return error result
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "success": False,
            "error": f"Workflow failed after {self.retry_attempts} attempts: {str(last_exception)}",
            "medication_logs_created": 0,
            "feeding_logs_created": 0,
            "errors": [str(last_exception)]
        }
    
    async def get_user_workflow_preferences(self, user_id: str) -> Dict[str, Any]:
        """
        Get user-specific workflow preferences and customization settings.
        """
        try:
            async with get_db_session() as session:
                # Get user notification preferences
                stmt = select(NotificationPreference).where(
                    NotificationPreference.user_id == user_id
                )
                prefs = await session.execute(stmt)
                prefs = prefs.scalar_one_or_none()
                
                if not prefs:
                    # Return default preferences
                    return {
                        "medication_reminders": True,
                        "feeding_reminders": True,
                        "appointment_reminders": True,
                        "weekly_reports": True,
                        "reminder_advance_minutes": 15,
                        "email_notifications": True,
                        "sms_notifications": False,
                        "push_notifications": True
                    }
                
                return {
                    "medication_reminders": prefs.medication_reminders,
                    "feeding_reminders": prefs.feeding_reminders,
                    "appointment_reminders": prefs.appointment_reminders,
                    "weekly_reports": prefs.weekly_reports,
                    "reminder_advance_minutes": prefs.reminder_advance_minutes,
                    "email_notifications": prefs.email_notifications,
                    "sms_notifications": prefs.sms_notifications,
                    "push_notifications": prefs.push_notifications
                }
                
        except Exception as e:
            logger.error(f"Failed to get user workflow preferences: {str(e)}")
            # Return default preferences on error
            return {
                "medication_reminders": True,
                "feeding_reminders": True,
                "appointment_reminders": True,
                "weekly_reports": True,
                "reminder_advance_minutes": 15,
                "email_notifications": True,
                "sms_notifications": False,
                "push_notifications": True
            }
    
    async def update_user_workflow_preferences(
        self, 
        user_id: str, 
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update user-specific workflow preferences and customization settings.
        """
        try:
            async with get_db_session() as session:
                # Get or create notification preferences
                stmt = select(NotificationPreference).where(
                    NotificationPreference.user_id == user_id
                )
                prefs = await session.execute(stmt)
                prefs = prefs.scalar_one_or_none()
                
                if not prefs:
                    prefs = NotificationPreference(user_id=user_id)
                    session.add(prefs)
                
                # Update preferences
                if "medication_reminders" in preferences:
                    prefs.medication_reminders = preferences["medication_reminders"]
                if "feeding_reminders" in preferences:
                    prefs.feeding_reminders = preferences["feeding_reminders"]
                if "appointment_reminders" in preferences:
                    prefs.appointment_reminders = preferences["appointment_reminders"]
                if "weekly_reports" in preferences:
                    prefs.weekly_reports = preferences["weekly_reports"]
                if "reminder_advance_minutes" in preferences:
                    prefs.reminder_advance_minutes = preferences["reminder_advance_minutes"]
                if "email_notifications" in preferences:
                    prefs.email_notifications = preferences["email_notifications"]
                if "sms_notifications" in preferences:
                    prefs.sms_notifications = preferences["sms_notifications"]
                if "push_notifications" in preferences:
                    prefs.push_notifications = preferences["push_notifications"]
                
                await session.commit()
                
                return {
                    "success": True,
                    "message": "Workflow preferences updated successfully",
                    "preferences": preferences
                }
                
        except Exception as e:
            logger.error(f"Failed to update user workflow preferences: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to update preferences: {str(e)}"
            }


# Global workflow service instance
workflow_service = WorkflowService()