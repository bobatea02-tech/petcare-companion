"""
Appointment management API endpoints for scheduling and tracking veterinary appointments.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from app.database.connection import get_db_session
from app.services.appointment_service import AppointmentService, VetClinicService
from app.schemas.appointments import (
    AppointmentCreate, AppointmentUpdate, AppointmentResponse,
    AppointmentListResponse, AppointmentHistoryResponse,
    VetClinicCreate, VetClinicUpdate, VetClinicResponse,
    VetClinicListResponse, EmergencyVetSearchRequest, EmergencyVetSearchResponse,
    ErrorResponse
)
from app.core.dependencies import get_current_active_user
from app.core.middleware import limiter, GENERAL_RATE_LIMIT
from app.database.models import User


# Create router for appointment management endpoints
router = APIRouter(prefix="/appointments", tags=["Appointment Management"])


# Appointment CRUD Endpoints

@router.post(
    "/{pet_id}",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create appointment",
    description="Schedule a new veterinary appointment for a pet",
    responses={
        201: {"description": "Appointment created successfully", "model": AppointmentResponse},
        400: {"description": "Validation error in appointment data", "model": ErrorResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def create_appointment(
    request: Request,
    pet_id: str,
    appointment_data: AppointmentCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> AppointmentResponse:
    """
    Create a new veterinary appointment for a pet.
    
    Schedules an appointment with clinic details, appointment time, and purpose.
    Automatically sets up reminder notifications for 24 hours and 2 hours before.
    
    **Requirements validated:**
    - 7.1: Appointment scheduling with clinic details and appointment times
    """
    appointment_service = AppointmentService(db)
    return await appointment_service.create_appointment(str(current_user.id), pet_id, appointment_data)


@router.get(
    "/{pet_id}",
    response_model=AppointmentListResponse,
    summary="Get pet appointments",
    description="Retrieve all appointments for a pet with filtering options",
    responses={
        200: {"description": "Appointments retrieved successfully", "model": AppointmentListResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_pet_appointments(
    request: Request,
    pet_id: str,
    include_past: bool = Query(True, description="Include past appointments"),
    include_cancelled: bool = Query(False, description="Include cancelled appointments"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> AppointmentListResponse:
    """
    Get all appointments for a pet with filtering options.
    
    Returns appointments with status information and filtering capabilities
    for past and cancelled appointments.
    
    **Requirements validated:**
    - 7.4: Appointment history display with filtering
    """
    appointment_service = AppointmentService(db)
    return await appointment_service.get_pet_appointments(
        str(current_user.id), pet_id, include_past, include_cancelled
    )


@router.get(
    "/{pet_id}/{appointment_id}",
    response_model=AppointmentResponse,
    summary="Get appointment details",
    description="Retrieve details for a specific appointment",
    responses={
        200: {"description": "Appointment retrieved successfully", "model": AppointmentResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Appointment not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_appointment(
    request: Request,
    pet_id: str,
    appointment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> AppointmentResponse:
    """
    Get details for a specific appointment.
    
    **Requirements validated:**
    - 7.4: Appointment details retrieval
    """
    appointment_service = AppointmentService(db)
    return await appointment_service.get_appointment(str(current_user.id), pet_id, appointment_id)


@router.put(
    "/{pet_id}/{appointment_id}",
    response_model=AppointmentResponse,
    summary="Update appointment",
    description="Update an existing appointment",
    responses={
        200: {"description": "Appointment updated successfully", "model": AppointmentResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Appointment not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def update_appointment(
    request: Request,
    pet_id: str,
    appointment_id: str,
    appointment_data: AppointmentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> AppointmentResponse:
    """
    Update an existing appointment.
    
    Allows updating appointment details including date, time, clinic information,
    and status. Reminder flags are reset if appointment date changes.
    
    **Requirements validated:**
    - 7.1: Appointment management with updates
    """
    appointment_service = AppointmentService(db)
    return await appointment_service.update_appointment(
        str(current_user.id), pet_id, appointment_id, appointment_data
    )


@router.delete(
    "/{pet_id}/{appointment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel appointment",
    description="Cancel an appointment (marks as cancelled)",
    responses={
        204: {"description": "Appointment cancelled successfully"},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Appointment not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def delete_appointment(
    request: Request,
    pet_id: str,
    appointment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Cancel an appointment.
    
    Marks the appointment as cancelled rather than deleting it,
    preserving appointment history.
    
    **Requirements validated:**
    - 7.1: Appointment management with cancellation
    """
    appointment_service = AppointmentService(db)
    await appointment_service.delete_appointment(str(current_user.id), pet_id, appointment_id)


@router.get(
    "/{pet_id}/history",
    response_model=AppointmentHistoryResponse,
    summary="Get appointment history",
    description="Retrieve comprehensive appointment history for a pet",
    responses={
        200: {"description": "Appointment history retrieved successfully", "model": AppointmentHistoryResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_appointment_history(
    request: Request,
    pet_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> AppointmentHistoryResponse:
    """
    Get comprehensive appointment history for a pet.
    
    Returns all appointments with statistics including last and next
    appointment dates, total count, and upcoming appointments.
    
    **Requirements validated:**
    - 7.4: Appointment history display with relevant details
    """
    appointment_service = AppointmentService(db)
    return await appointment_service.get_appointment_history(str(current_user.id), pet_id)


@router.get(
    "/user/upcoming",
    response_model=List[AppointmentResponse],
    summary="Get user's upcoming appointments",
    description="Retrieve all upcoming appointments across all user's pets",
    responses={
        200: {"description": "Upcoming appointments retrieved successfully", "model": List[AppointmentResponse]},
        401: {"description": "Authentication required", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_user_upcoming_appointments(
    request: Request,
    days_ahead: int = Query(7, ge=1, le=90, description="Number of days to look ahead"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> List[AppointmentResponse]:
    """
    Get all upcoming appointments for the user across all pets.
    
    Useful for dashboard views showing all upcoming veterinary visits.
    
    **Requirements validated:**
    - 7.4: Appointment display across multiple pets
    """
    appointment_service = AppointmentService(db)
    return await appointment_service.get_upcoming_appointments(str(current_user.id), days_ahead)


# Vet Clinic Management Endpoints

@router.post(
    "/clinics",
    response_model=VetClinicResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create vet clinic",
    description="Add a new veterinary clinic to the database",
    responses={
        201: {"description": "Vet clinic created successfully", "model": VetClinicResponse},
        400: {"description": "Validation error in clinic data", "model": ErrorResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def create_vet_clinic(
    request: Request,
    clinic_data: VetClinicCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> VetClinicResponse:
    """
    Add a new veterinary clinic to the database.
    
    **Requirements validated:**
    - 7.3: Emergency vet clinic database
    """
    vet_clinic_service = VetClinicService(db)
    return await vet_clinic_service.create_vet_clinic(clinic_data)


@router.get(
    "/clinics",
    response_model=VetClinicListResponse,
    summary="Get vet clinics",
    description="Retrieve all veterinary clinics with optional filtering",
    responses={
        200: {"description": "Vet clinics retrieved successfully", "model": VetClinicListResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_vet_clinics(
    request: Request,
    emergency_only: bool = Query(False, description="Only show emergency clinics"),
    twenty_four_hour_only: bool = Query(False, description="Only show 24-hour clinics"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> VetClinicListResponse:
    """
    Get all veterinary clinics with optional filtering.
    
    **Requirements validated:**
    - 7.3: Emergency vet clinic database access
    """
    vet_clinic_service = VetClinicService(db)
    return await vet_clinic_service.get_all_vet_clinics(emergency_only, twenty_four_hour_only)


@router.get(
    "/clinics/{clinic_id}",
    response_model=VetClinicResponse,
    summary="Get vet clinic details",
    description="Retrieve details for a specific veterinary clinic",
    responses={
        200: {"description": "Vet clinic retrieved successfully", "model": VetClinicResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Vet clinic not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_vet_clinic(
    request: Request,
    clinic_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> VetClinicResponse:
    """Get details for a specific veterinary clinic."""
    vet_clinic_service = VetClinicService(db)
    return await vet_clinic_service.get_vet_clinic(clinic_id)


@router.post(
    "/clinics/search-emergency",
    response_model=EmergencyVetSearchResponse,
    summary="Search emergency vets",
    description="Search for emergency veterinary clinics near a location",
    responses={
        200: {"description": "Emergency vets found successfully", "model": EmergencyVetSearchResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def search_emergency_vets(
    request: Request,
    search_request: EmergencyVetSearchRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> EmergencyVetSearchResponse:
    """
    Search for emergency veterinary clinics near a location.
    
    Uses geolocation to find nearby emergency clinics within the specified
    radius. Results are sorted by distance from the search location.
    
    **Requirements validated:**
    - 7.3: Emergency vet clinic database and search
    """
    vet_clinic_service = VetClinicService(db)
    return await vet_clinic_service.search_emergency_vets(
        search_request.latitude,
        search_request.longitude,
        search_request.radius_miles,
        search_request.emergency_only,
        search_request.twenty_four_hour_only
    )


@router.put(
    "/clinics/{clinic_id}",
    response_model=VetClinicResponse,
    summary="Update vet clinic",
    description="Update veterinary clinic information",
    responses={
        200: {"description": "Vet clinic updated successfully", "model": VetClinicResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Vet clinic not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def update_vet_clinic(
    request: Request,
    clinic_id: str,
    clinic_data: VetClinicUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> VetClinicResponse:
    """Update veterinary clinic information."""
    vet_clinic_service = VetClinicService(db)
    return await vet_clinic_service.update_vet_clinic(clinic_id, clinic_data)


# Emergency Appointment Integration Endpoints

@router.post(
    "/{pet_id}/emergency",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create emergency appointment from triage",
    description="Create an emergency appointment directly from triage assessment results",
    responses={
        201: {"description": "Emergency appointment created successfully", "model": AppointmentResponse},
        400: {"description": "Validation error", "model": ErrorResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet or clinic not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def create_emergency_appointment(
    request: Request,
    pet_id: str,
    clinic_id: str = Query(..., description="ID of the emergency vet clinic"),
    triage_assessment_id: Optional[str] = Query(None, description="ID of the triage assessment"),
    notes: Optional[str] = Query(None, description="Additional notes for the appointment"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> AppointmentResponse:
    """
    Create an emergency appointment directly from triage results.
    
    This endpoint is designed to be called when a Red triage level is assigned,
    allowing immediate scheduling at an emergency vet clinic.
    
    **Requirements validated:**
    - 7.3: Direct scheduling links for emergency triage results
    """
    appointment_service = AppointmentService(db)
    return await appointment_service.create_emergency_appointment_from_triage(
        str(current_user.id),
        pet_id,
        clinic_id,
        triage_assessment_id,
        notes
    )


@router.get(
    "/reminders/pending",
    response_model=List[AppointmentResponse],
    summary="Get appointments needing reminders",
    description="Retrieve appointments that need reminder notifications sent",
    responses={
        200: {"description": "Appointments retrieved successfully", "model": List[AppointmentResponse]},
        401: {"description": "Authentication required", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_appointments_needing_reminders(
    request: Request,
    reminder_type: str = Query("24h", description="Type of reminder (24h or 2h)"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> List[AppointmentResponse]:
    """
    Get appointments that need reminder notifications.
    
    Used by the notification service to identify which appointments
    need reminders sent.
    
    **Requirements validated:**
    - 7.2: Appointment reminder system integration
    """
    appointment_service = AppointmentService(db)
    return await appointment_service.get_appointments_needing_reminders(reminder_type)


@router.post(
    "/{appointment_id}/reminder-sent",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Mark reminder as sent",
    description="Mark that a reminder notification has been sent for an appointment",
    responses={
        204: {"description": "Reminder marked as sent successfully"},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Appointment not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def mark_reminder_sent(
    request: Request,
    appointment_id: str,
    reminder_type: str = Query("24h", description="Type of reminder (24h or 2h)"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Mark that a reminder has been sent for an appointment.
    
    Called by the notification service after successfully sending
    a reminder notification.
    
    **Requirements validated:**
    - 7.2: Appointment reminder tracking
    """
    appointment_service = AppointmentService(db)
    await appointment_service.mark_reminder_sent(appointment_id, reminder_type)
