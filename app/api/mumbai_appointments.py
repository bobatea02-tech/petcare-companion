"""
Mumbai Real-Time Appointment Booking API
Specialized endpoints for Mumbai, Maharashtra veterinary clinics
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict
from datetime import datetime

from app.database.connection import get_db_session
from app.services.mumbai_vet_service import MumbaiVetService
from app.services.appointment_service import AppointmentService
from app.schemas.appointments import (
    VetClinicResponse, AppointmentCreate, AppointmentResponse, ErrorResponse
)
from app.core.dependencies import get_current_active_user
from app.core.middleware import limiter, GENERAL_RATE_LIMIT
from app.database.models import User
from pydantic import BaseModel


router = APIRouter(prefix="/mumbai-appointments", tags=["Mumbai Real-Time Appointments"])


class AvailabilityRequest(BaseModel):
    """Request model for checking availability."""
    clinic_id: str
    date: str  # YYYY-MM-DD format
    duration_minutes: int = 30


class AreaSearchRequest(BaseModel):
    """Request model for area-based search."""
    area: str
    service_type: Optional[str] = None
    emergency_only: bool = False


class NearestClinicsRequest(BaseModel):
    """Request model for nearest clinics search."""
    latitude: float
    longitude: float
    limit: int = 5


@router.post(
    "/initialize-clinics",
    response_model=List[VetClinicResponse],
    summary="Initialize Mumbai veterinary clinics",
    description="Load real Mumbai veterinary clinics into the database",
    responses={
        200: {"description": "Clinics initialized successfully"},
        429: {"description": "Rate limit exceeded"}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def initialize_mumbai_clinics(
    request: Request,
    db: AsyncSession = Depends(get_db_session)
) -> List[VetClinicResponse]:
    """
    Initialize database with real Mumbai veterinary clinics.
    
    Includes 10+ actual clinics across Mumbai with:
    - Real addresses and contact information
    - Operating hours
    - Services offered
    - Emergency availability
    - GPS coordinates
    """
    mumbai_service = MumbaiVetService(db)
    return await mumbai_service.initialize_mumbai_clinics()


@router.post(
    "/check-availability",
    response_model=List[Dict[str, str]],
    summary="Check real-time availability",
    description="Get available appointment slots for a clinic on a specific date",
    responses={
        200: {"description": "Available slots retrieved"},
        401: {"description": "Authentication required"},
        404: {"description": "Clinic not found"},
        429: {"description": "Rate limit exceeded"}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def check_availability(
    request: Request,
    availability_request: AvailabilityRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> List[Dict[str, str]]:
    """
    Check real-time availability for a clinic.
    
    Returns available time slots based on:
    - Clinic operating hours
    - Existing appointments
    - Current time (no past slots)
    
    Each slot includes:
    - time: Display time (e.g., "10:00 AM")
    - datetime: ISO format datetime
    - available: Boolean availability status
    """
    mumbai_service = MumbaiVetService(db)
    
    try:
        date = datetime.fromisoformat(availability_request.date)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    slots = await mumbai_service.get_available_slots(
        availability_request.clinic_id,
        date,
        availability_request.duration_minutes
    )
    
    return slots


@router.get(
    "/clinic/{clinic_id}/availability-week",
    response_model=Dict[str, List[Dict[str, str]]],
    summary="Get week availability",
    description="Get available slots for the next 7 days",
    responses={
        200: {"description": "Week availability retrieved"},
        401: {"description": "Authentication required"},
        404: {"description": "Clinic not found"},
        429: {"description": "Rate limit exceeded"}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_week_availability(
    request: Request,
    clinic_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> Dict[str, List[Dict[str, str]]]:
    """
    Get availability for the next 7 days.
    
    Returns a dictionary with dates as keys and available slots as values.
    Useful for displaying a week view calendar.
    """
    mumbai_service = MumbaiVetService(db)
    return await mumbai_service.get_clinic_availability_week(clinic_id)


@router.post(
    "/search-by-area",
    response_model=List[VetClinicResponse],
    summary="Search clinics by Mumbai area",
    description="Find veterinary clinics in specific Mumbai localities",
    responses={
        200: {"description": "Clinics found"},
        429: {"description": "Rate limit exceeded"}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def search_by_area(
    request: Request,
    search_request: AreaSearchRequest,
    db: AsyncSession = Depends(get_db_session)
) -> List[VetClinicResponse]:
    """
    Search for clinics by Mumbai area/locality.
    
    Supported areas include:
    - Bandra, Andheri, Powai, Juhu
    - Goregaon, Malad, Borivali
    - Parel, Thane
    - And more...
    
    Can filter by:
    - Service type (e.g., "Surgery", "Vaccination")
    - Emergency availability
    """
    mumbai_service = MumbaiVetService(db)
    return await mumbai_service.search_clinics_by_area(
        search_request.area,
        search_request.service_type,
        search_request.emergency_only
    )


@router.post(
    "/nearest-clinics",
    response_model=List[VetClinicResponse],
    summary="Find nearest clinics",
    description="Get nearest veterinary clinics based on GPS location",
    responses={
        200: {"description": "Nearest clinics found"},
        429: {"description": "Rate limit exceeded"}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def find_nearest_clinics(
    request: Request,
    location_request: NearestClinicsRequest,
    db: AsyncSession = Depends(get_db_session)
) -> List[VetClinicResponse]:
    """
    Find nearest veterinary clinics to your location.
    
    Uses GPS coordinates to calculate distance and returns
    clinics sorted by proximity. Each result includes distance in miles.
    """
    mumbai_service = MumbaiVetService(db)
    return await mumbai_service.get_nearest_clinics(
        location_request.latitude,
        location_request.longitude,
        location_request.limit
    )


@router.post(
    "/book-realtime",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Book real-time appointment",
    description="Book an appointment with real-time slot validation",
    responses={
        201: {"description": "Appointment booked successfully"},
        400: {"description": "Slot not available or validation error"},
        401: {"description": "Authentication required"},
        404: {"description": "Pet or clinic not found"},
        429: {"description": "Rate limit exceeded"}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def book_realtime_appointment(
    request: Request,
    pet_id: str,
    appointment_data: AppointmentCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> AppointmentResponse:
    """
    Book an appointment with real-time validation.
    
    This endpoint:
    1. Validates the requested time slot is available
    2. Checks clinic operating hours
    3. Prevents double-booking
    4. Creates appointment if slot is available
    
    Returns error if slot is already taken.
    """
    mumbai_service = MumbaiVetService(db)
    appointment_service = AppointmentService(db)
    
    # Parse appointment date
    appointment_datetime = datetime.fromisoformat(
        appointment_data.appointment_date.replace('Z', '+00:00')
    )
    
    # Get clinic ID from clinic name (you'll need to look it up)
    from sqlalchemy import select
    from app.database.models import VetClinic
    
    result = await db.execute(
        select(VetClinic).where(VetClinic.name == appointment_data.clinic_name)
    )
    clinic = result.scalar_one_or_none()
    
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clinic '{appointment_data.clinic_name}' not found in Mumbai database"
        )
    
    # Check if slot is available
    slots = await mumbai_service.get_available_slots(
        str(clinic.id),
        appointment_datetime,
        30
    )
    
    # Check if requested time is in available slots
    requested_time = appointment_datetime.strftime("%I:%M %p")
    is_available = any(
        slot["time"] == requested_time and slot["available"]
        for slot in slots
    )
    
    if not is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Time slot {requested_time} is not available. Please choose another time."
        )
    
    # Book the appointment
    return await appointment_service.create_appointment(
        str(current_user.id),
        pet_id,
        appointment_data
    )


@router.get(
    "/mumbai-areas",
    response_model=List[str],
    summary="Get Mumbai areas",
    description="Get list of Mumbai areas with veterinary clinics",
    responses={
        200: {"description": "Areas list retrieved"},
        429: {"description": "Rate limit exceeded"}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_mumbai_areas(
    request: Request
) -> List[str]:
    """
    Get list of Mumbai areas/localities with veterinary clinics.
    
    Useful for populating area selection dropdowns.
    """
    return [
        "Parel",
        "Bandra West",
        "Andheri West",
        "Powai",
        "Juhu",
        "Goregaon East",
        "Malad West",
        "Borivali West",
        "Thane West"
    ]


@router.get(
    "/service-types",
    response_model=List[str],
    summary="Get service types",
    description="Get list of available veterinary services",
    responses={
        200: {"description": "Service types retrieved"},
        429: {"description": "Rate limit exceeded"}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_service_types(
    request: Request
) -> List[str]:
    """
    Get list of available veterinary services.
    
    Useful for filtering clinics by service type.
    """
    return [
        "Emergency Care",
        "Surgery",
        "Vaccination",
        "General Checkup",
        "Dental Care",
        "Grooming",
        "Laboratory Tests",
        "X-Ray",
        "Ultrasound",
        "Sterilization",
        "Consultation",
        "Boarding"
    ]
