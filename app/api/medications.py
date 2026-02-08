"""
Medication tracking and care management API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from app.database.connection import get_db_session
from app.services.medication_service import MedicationService
from app.schemas.medications import (
    MedicationCreate, MedicationUpdate, MedicationResponse, MedicationWithLogsResponse,
    MedicationListResponse, MedicationStatusResponse, MedicationLogCreate, MedicationLogUpdate,
    MedicationLogResponse, FeedingScheduleCreate, FeedingScheduleUpdate, FeedingScheduleResponse,
    FeedingLogCreate, FeedingLogUpdate, FeedingLogResponse, FeedingHistoryResponse,
    CareTrackingDashboardResponse, ErrorResponse
)
from app.core.dependencies import get_current_active_user
from app.core.middleware import limiter, GENERAL_RATE_LIMIT
from app.database.models import User


# Create router for medication and care tracking endpoints
router = APIRouter(prefix="/medications", tags=["Medication & Care Tracking"])


# Medication Management Endpoints

@router.post(
    "/{pet_id}",
    response_model=MedicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create medication prescription",
    description="Create a new medication prescription for a pet with dosage and frequency",
    responses={
        201: {"description": "Medication created successfully", "model": MedicationResponse},
        400: {"description": "Validation error in medication data", "model": ErrorResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def create_medication(
    request: Request,
    pet_id: str,
    medication_data: MedicationCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> MedicationResponse:
    """
    Create a new medication prescription for a pet.
    
    Creates medication with dosage, frequency, and refill tracking.
    Automatically monitors refill thresholds for alert generation.
    
    **Requirements validated:**
    - 5.1: Medication prescription storage with dosage and frequency
    - 5.4: Refill threshold monitoring setup
    """
    medication_service = MedicationService(db)
    return await medication_service.create_medication(str(current_user.id), pet_id, medication_data)


@router.get(
    "/{pet_id}",
    response_model=MedicationListResponse,
    summary="Get pet medications",
    description="Retrieve all medications for a pet with status information",
    responses={
        200: {"description": "Medications retrieved successfully", "model": MedicationListResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_pet_medications(
    request: Request,
    pet_id: str,
    include_inactive: bool = Query(False, description="Include inactive medications"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> MedicationListResponse:
    """
    Get all medications for a pet with status information.
    
    Returns medications with refill alerts and administration status.
    
    **Requirements validated:**
    - 5.1: Medication prescription retrieval
    - 5.4: Refill threshold monitoring
    """
    medication_service = MedicationService(db)
    return await medication_service.get_pet_medications(str(current_user.id), pet_id, include_inactive)


@router.put(
    "/{pet_id}/{medication_id}",
    response_model=MedicationResponse,
    summary="Update medication",
    description="Update an existing medication prescription",
    responses={
        200: {"description": "Medication updated successfully", "model": MedicationResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Medication not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def update_medication(
    request: Request,
    pet_id: str,
    medication_id: str,
    medication_data: MedicationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> MedicationResponse:
    """
    Update an existing medication prescription.
    
    **Requirements validated:**
    - 5.1: Medication prescription updates
    """
    medication_service = MedicationService(db)
    return await medication_service.update_medication(str(current_user.id), pet_id, medication_id, medication_data)


@router.delete(
    "/{pet_id}/{medication_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete medication",
    description="Delete (deactivate) a medication prescription",
    responses={
        204: {"description": "Medication deleted successfully"},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Medication not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def delete_medication(
    request: Request,
    pet_id: str,
    medication_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Delete (deactivate) a medication prescription.
    
    **Requirements validated:**
    - 5.1: Medication prescription management
    """
    medication_service = MedicationService(db)
    await medication_service.delete_medication(str(current_user.id), pet_id, medication_id)


@router.get(
    "/{pet_id}/status",
    response_model=MedicationStatusResponse,
    summary="Get medication status",
    description="Get comprehensive medication status including alerts and upcoming doses",
    responses={
        200: {"description": "Medication status retrieved successfully", "model": MedicationStatusResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_medication_status(
    request: Request,
    pet_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> MedicationStatusResponse:
    """
    Get comprehensive medication status for a pet.
    
    Returns medication status with refill alerts and upcoming doses.
    
    **Requirements validated:**
    - 5.1: Medication prescription status
    - 5.4: Refill threshold monitoring and alert generation
    """
    medication_service = MedicationService(db)
    return await medication_service.get_medication_status(str(current_user.id), pet_id)


# Medication Logging Endpoints

@router.post(
    "/{pet_id}/{medication_id}/logs",
    response_model=MedicationLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log medication administration",
    description="Log when medication was administered to a pet",
    responses={
        201: {"description": "Medication administration logged successfully", "model": MedicationLogResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Medication not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def log_medication_administration(
    request: Request,
    pet_id: str,
    medication_id: str,
    log_data: MedicationLogCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> MedicationLogResponse:
    """
    Log medication administration and update quantity.
    
    Records when medication was given and automatically decrements
    available quantity if dose was completed.
    
    **Requirements validated:**
    - 5.6: Medication administration logging
    """
    medication_service = MedicationService(db)
    return await medication_service.log_medication_administration(
        str(current_user.id), pet_id, medication_id, log_data
    )


@router.get(
    "/{pet_id}/{medication_id}/logs",
    response_model=List[MedicationLogResponse],
    summary="Get medication logs",
    description="Retrieve administration logs for a specific medication",
    responses={
        200: {"description": "Medication logs retrieved successfully", "model": List[MedicationLogResponse]},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Medication not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_medication_logs(
    request: Request,
    pet_id: str,
    medication_id: str,
    days_back: int = Query(30, ge=1, le=365, description="Number of days to retrieve logs for"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> List[MedicationLogResponse]:
    """
    Get medication administration logs for a specific medication.
    
    **Requirements validated:**
    - 5.6: Medication administration logging retrieval
    """
    medication_service = MedicationService(db)
    return await medication_service.get_medication_logs(str(current_user.id), pet_id, medication_id, days_back)


# Feeding Schedule Management Endpoints

@router.post(
    "/{pet_id}/feeding-schedules",
    response_model=FeedingScheduleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create feeding schedule",
    description="Create a recurring feeding schedule for a pet",
    responses={
        201: {"description": "Feeding schedule created successfully", "model": FeedingScheduleResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def create_feeding_schedule(
    request: Request,
    pet_id: str,
    schedule_data: FeedingScheduleCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> FeedingScheduleResponse:
    """
    Create a recurring feeding schedule for a pet.
    
    **Requirements validated:**
    - 5.5: Recurring feeding schedule creation and tracking
    """
    medication_service = MedicationService(db)
    return await medication_service.create_feeding_schedule(str(current_user.id), pet_id, schedule_data)


@router.get(
    "/{pet_id}/feeding-schedules",
    response_model=List[FeedingScheduleResponse],
    summary="Get feeding schedules",
    description="Retrieve all feeding schedules for a pet",
    responses={
        200: {"description": "Feeding schedules retrieved successfully", "model": List[FeedingScheduleResponse]},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_pet_feeding_schedules(
    request: Request,
    pet_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> List[FeedingScheduleResponse]:
    """
    Get all feeding schedules for a pet.
    
    **Requirements validated:**
    - 5.5: Feeding schedule retrieval
    """
    medication_service = MedicationService(db)
    return await medication_service.get_pet_feeding_schedules(str(current_user.id), pet_id)


# Feeding Logging Endpoints

@router.post(
    "/{pet_id}/feeding-logs",
    response_model=FeedingLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log feeding",
    description="Log a feeding event for a pet",
    responses={
        201: {"description": "Feeding logged successfully", "model": FeedingLogResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def log_feeding(
    request: Request,
    pet_id: str,
    feeding_data: FeedingLogCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> FeedingLogResponse:
    """
    Log a feeding event for a pet.
    
    **Requirements validated:**
    - 5.5: Feeding log entries with completion status
    - 5.6: Historical feeding activity tracking
    """
    medication_service = MedicationService(db)
    return await medication_service.log_feeding(str(current_user.id), pet_id, feeding_data)


@router.get(
    "/{pet_id}/feeding-history",
    response_model=FeedingHistoryResponse,
    summary="Get feeding history",
    description="Retrieve feeding history with pattern analysis",
    responses={
        200: {"description": "Feeding history retrieved successfully", "model": FeedingHistoryResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_feeding_history(
    request: Request,
    pet_id: str,
    days_back: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> FeedingHistoryResponse:
    """
    Get feeding history with pattern analysis.
    
    Returns feeding logs with analysis of feeding patterns,
    consistency scores, and behavioral insights.
    
    **Requirements validated:**
    - 5.5: Historical feeding pattern analysis
    - 5.6: Feeding log retrieval and analysis
    """
    medication_service = MedicationService(db)
    return await medication_service.get_feeding_history(str(current_user.id), pet_id, days_back)