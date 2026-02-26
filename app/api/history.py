"""
API endpoints for pet health history.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime

from app.database.connection import get_db_session
from app.services.history_service import HistoryService
from app.schemas.history import (
    AppointmentHistoryResponse,
    MedicationHistoryResponse,
    HealthLogResponse,
    HealthSummaryResponse
)
from app.core.dependencies import get_current_active_user
from app.database.models import User

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/appointments/{pet_id}", response_model=List[AppointmentHistoryResponse])
async def get_appointment_history(
    pet_id: int,
    status: Optional[str] = Query(None, description="Filter by status: scheduled, completed, cancelled"),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get appointment history for a specific pet.
    
    - **pet_id**: ID of the pet
    - **status**: Optional filter by appointment status
    - **limit**: Maximum number of appointments to return (default: 50)
    """
    appointments = HistoryService.get_appointment_history(
        db=db,
        pet_id=pet_id,
        status=status,
        limit=limit
    )
    return appointments


@router.get("/medications/{pet_id}", response_model=List[MedicationHistoryResponse])
async def get_medication_history(
    pet_id: int,
    active_only: bool = Query(False, description="Show only active medications"),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get medication history for a specific pet.
    
    - **pet_id**: ID of the pet
    - **active_only**: If true, only return currently active medications
    """
    medications = HistoryService.get_medication_history(
        db=db,
        pet_id=pet_id,
        active_only=active_only
    )
    
    # Add is_active flag to response
    today = datetime.now().date()
    for med in medications:
        med.is_active = (
            med.start_date <= today and
            (med.end_date is None or med.end_date >= today)
        )
    
    return medications


@router.get("/health-logs/{pet_id}", response_model=List[HealthLogResponse])
async def get_health_logs(
    pet_id: int,
    log_type: Optional[str] = Query(None, description="Filter by log type"),
    start_date: Optional[datetime] = Query(None, description="Filter logs after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter logs before this date"),
    search: Optional[str] = Query(None, description="Search in notes"),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get health logs for a specific pet with filtering options.
    
    - **pet_id**: ID of the pet
    - **log_type**: Optional filter by type (checkup, emergency, surgery, vaccination, etc.)
    - **start_date**: Optional start date for filtering
    - **end_date**: Optional end date for filtering
    - **search**: Optional search query for notes
    - **limit**: Maximum number of logs to return (default: 100)
    """
    logs = HistoryService.get_health_logs(
        db=db,
        pet_id=pet_id,
        log_type=log_type,
        start_date=start_date,
        end_date=end_date,
        search_query=search,
        limit=limit
    )
    return logs


@router.get("/summary/{pet_id}", response_model=HealthSummaryResponse)
async def get_health_summary(
    pet_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a comprehensive health summary for a specific pet.
    
    - **pet_id**: ID of the pet
    
    Returns statistics including:
    - Total and completed appointments
    - Active medications count
    - Total health logs
    - Upcoming appointments
    - Next scheduled appointment
    """
    summary = HistoryService.get_pet_health_summary(db=db, pet_id=pet_id)
    return summary


@router.get("/upcoming/{pet_id}", response_model=List[AppointmentHistoryResponse])
async def get_upcoming_appointments(
    pet_id: int,
    days_ahead: int = Query(30, ge=1, le=365, description="Number of days to look ahead"),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get upcoming appointments for a specific pet.
    
    - **pet_id**: ID of the pet
    - **days_ahead**: Number of days to look ahead (default: 30)
    """
    appointments = HistoryService.get_upcoming_appointments(
        db=db,
        pet_id=pet_id,
        days_ahead=days_ahead
    )
    return appointments
