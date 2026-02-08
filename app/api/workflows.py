"""
API endpoints for automated workflows and scheduling.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
import logging

from app.core.dependencies import get_current_user
from app.database.models import User
from app.services.workflow_service import workflow_service
from app.services.notification_service import notification_service


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.post("/daily-automation", response_model=Dict[str, Any])
async def execute_daily_automation(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Execute daily automation workflow manually.
    Normally this runs automatically at 12:01 AM via Kiro Scheduled Workflows.
    """
    try:
        result = await workflow_service.execute_with_retry(
            workflow_service.execute_daily_automation
        )
        return result
    except Exception as e:
        logger.error(f"Failed to execute daily automation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute daily automation: {str(e)}"
        )


@router.get("/preferences", response_model=Dict[str, Any])
async def get_workflow_preferences(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get user-specific workflow preferences and customization settings.
    """
    try:
        preferences = await workflow_service.get_user_workflow_preferences(
            str(current_user.id)
        )
        return {
            "success": True,
            "preferences": preferences
        }
    except Exception as e:
        logger.error(f"Failed to get workflow preferences: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get workflow preferences: {str(e)}"
        )


@router.put("/preferences", response_model=Dict[str, Any])
async def update_workflow_preferences(
    preferences: Dict[str, Any],
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Update user-specific workflow preferences and customization settings.
    """
    try:
        result = await workflow_service.update_user_workflow_preferences(
            str(current_user.id),
            preferences
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to update preferences")
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update workflow preferences: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update workflow preferences: {str(e)}"
        )


@router.get("/status", response_model=Dict[str, Any])
async def get_workflow_status(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get the status of automated workflows and recent execution results.
    """
    try:
        # This would typically check the status of scheduled workflows
        # For now, return basic status information
        return {
            "success": True,
            "status": "active",
            "last_execution": None,  # Would be populated from workflow logs
            "next_execution": "12:01 AM daily",
            "workflows": {
                "daily_automation": {
                    "enabled": True,
                    "schedule": "0 1 12 * * *",  # Cron expression for 12:01 AM daily
                    "description": "Creates daily medication and feeding log entries"
                }
            }
        }
    except Exception as e:
        logger.error(f"Failed to get workflow status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get workflow status: {str(e)}"
        )


@router.post("/notifications/medication-reminders", response_model=Dict[str, Any])
async def schedule_medication_reminders(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Schedule 15-minute advance reminders for upcoming medications.
    """
    try:
        result = await notification_service.schedule_medication_reminders()
        return result
    except Exception as e:
        logger.error(f"Failed to schedule medication reminders: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule medication reminders: {str(e)}"
        )


@router.post("/notifications/feeding-reminders", response_model=Dict[str, Any])
async def schedule_feeding_reminders(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Schedule 15-minute advance reminders for upcoming feeding times.
    """
    try:
        result = await notification_service.schedule_feeding_reminders()
        return result
    except Exception as e:
        logger.error(f"Failed to schedule feeding reminders: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule feeding reminders: {str(e)}"
        )


@router.post("/notifications/appointment-reminders", response_model=Dict[str, Any])
async def schedule_appointment_reminders(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Schedule appointment reminders (24 hours and 2 hours before).
    """
    try:
        result = await notification_service.schedule_appointment_reminders()
        return result
    except Exception as e:
        logger.error(f"Failed to schedule appointment reminders: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule appointment reminders: {str(e)}"
        )


@router.post("/notifications/weekly-reports", response_model=Dict[str, Any])
async def generate_weekly_health_reports(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Generate and send weekly health reports with AI insights.
    """
    try:
        result = await notification_service.generate_weekly_health_reports()
        return result
    except Exception as e:
        logger.error(f"Failed to generate weekly health reports: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate weekly health reports: {str(e)}"
        )