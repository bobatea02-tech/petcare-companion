"""
Pet profile management API endpoints for CRUD operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from app.database.connection import get_db_session
from app.services.pet_service import PetService
from app.services.medical_service import MedicalService
from app.schemas.pets import (
    PetCreate, 
    PetUpdate, 
    PetResponse, 
    PetListResponse, 
    PetHistoryResponse,
    MedicalConditionCreate,
    AllergyCreate,
    VaccinationRecordCreate,
    MedicalHistoryEntryCreate,
    MedicalConditionResponse,
    AllergyResponse,
    VaccinationRecordResponse,
    MedicalHistoryEntryResponse,
    PetMedicalSummaryResponse,
    ErrorResponse
)
from app.core.dependencies import get_current_active_user
from app.core.middleware import limiter, GENERAL_RATE_LIMIT
from app.database.models import User


# Create router for pet management endpoints
router = APIRouter(prefix="/pets", tags=["Pet Management"])


@router.post(
    "/",
    response_model=PetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create pet profile",
    description="Create a new pet profile with required fields and optional medical information",
    responses={
        201: {"description": "Pet profile created successfully", "model": PetResponse},
        400: {"description": "Validation error in pet data", "model": ErrorResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def create_pet_profile(
    request: Request,
    pet_data: PetCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> PetResponse:
    """
    Create a new pet profile for the authenticated user.
    
    Creates a pet profile with required fields (name, species, birth_date) and
    optional medical information. Automatically tracks profile creation in history.
    
    **Requirements validated:**
    - 2.1: Pet profile creation with required fields (species, name, age)
    - 2.4: Version history tracking for profile changes
    """
    pet_service = PetService(db)
    return await pet_service.create_pet_profile(str(current_user.id), pet_data)


@router.get(
    "/",
    response_model=PetListResponse,
    summary="Get user's pets",
    description="Retrieve all pets belonging to the authenticated user",
    responses={
        200: {"description": "Pets retrieved successfully", "model": PetListResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_user_pets(
    request: Request,
    include_inactive: bool = Query(False, description="Include inactive/deleted pets"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> PetListResponse:
    """
    Get all pets for the authenticated user.
    
    Returns a list of all pets belonging to the user, with option to include
    inactive/soft-deleted pets.
    
    **Requirements validated:**
    - 2.1: Pet profile listing for user
    """
    pet_service = PetService(db)
    return await pet_service.get_user_pets(str(current_user.id), include_inactive)


@router.get(
    "/{pet_id}",
    response_model=PetResponse,
    summary="Get pet profile",
    description="Retrieve a specific pet profile by ID",
    responses={
        200: {"description": "Pet profile retrieved successfully", "model": PetResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_pet_profile(
    request: Request,
    pet_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> PetResponse:
    """
    Get a specific pet profile by ID.
    
    Returns detailed information about a pet including medical conditions,
    allergies, and computed age fields.
    
    **Requirements validated:**
    - 2.1: Pet profile retrieval with all stored information
    """
    pet_service = PetService(db)
    return await pet_service.get_pet_profile(str(current_user.id), pet_id)


@router.put(
    "/{pet_id}",
    response_model=PetResponse,
    summary="Update pet profile",
    description="Update an existing pet profile with new information",
    responses={
        200: {"description": "Pet profile updated successfully", "model": PetResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def update_pet_profile(
    request: Request,
    pet_id: str,
    pet_data: PetUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> PetResponse:
    """
    Update an existing pet profile.
    
    Updates pet information with provided fields. Only specified fields will be
    updated. Automatically tracks changes in profile history.
    
    **Requirements validated:**
    - 2.4: Pet profile updates with validation
    - 2.5: Version history tracking for profile changes
    """
    pet_service = PetService(db)
    return await pet_service.update_pet_profile(str(current_user.id), pet_id, pet_data)


@router.delete(
    "/{pet_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete pet profile",
    description="Delete a pet profile (soft delete by default)",
    responses={
        204: {"description": "Pet profile deleted successfully"},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def delete_pet_profile(
    request: Request,
    pet_id: str,
    hard_delete: bool = Query(False, description="Perform hard delete instead of soft delete"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Delete a pet profile.
    
    By default performs soft delete (marks as inactive). Use hard_delete=true
    to permanently remove the pet from the database.
    
    **Requirements validated:**
    - 2.5: Pet profile deletion with history tracking
    """
    pet_service = PetService(db)
    await pet_service.delete_pet_profile(str(current_user.id), pet_id, not hard_delete)


@router.get(
    "/{pet_id}/history",
    response_model=PetHistoryResponse,
    summary="Get pet profile history",
    description="Retrieve version history for a pet profile",
    responses={
        200: {"description": "Pet history retrieved successfully", "model": PetHistoryResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_pet_history(
    request: Request,
    pet_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> PetHistoryResponse:
    """
    Get version history for a pet profile.
    
    Returns chronological list of all changes made to the pet profile,
    including creation, updates, and deletion events.
    
    **Requirements validated:**
    - 2.5: Version history tracking retrieval
    """
    pet_service = PetService(db)
    return await pet_service.get_pet_history(str(current_user.id), pet_id)


# Medical Information Management Endpoints

@router.post(
    "/{pet_id}/medical-conditions",
    response_model=MedicalConditionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add medical condition",
    description="Add a medical condition to a pet's health record",
    responses={
        201: {"description": "Medical condition added successfully", "model": MedicalConditionResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def add_medical_condition(
    request: Request,
    pet_id: str,
    condition_data: MedicalConditionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> MedicalConditionResponse:
    """
    Add a medical condition to a pet's health record.
    
    **Requirements validated:**
    - 2.2: Medical conditions storage and retrieval
    """
    medical_service = MedicalService(db)
    return await medical_service.add_medical_condition(str(current_user.id), pet_id, condition_data)


@router.get(
    "/{pet_id}/medical-conditions",
    response_model=List[MedicalConditionResponse],
    summary="Get pet medical conditions",
    description="Retrieve all medical conditions for a pet",
    responses={
        200: {"description": "Medical conditions retrieved successfully", "model": List[MedicalConditionResponse]},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_pet_medical_conditions(
    request: Request,
    pet_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> List[MedicalConditionResponse]:
    """
    Get all medical conditions for a pet.
    
    **Requirements validated:**
    - 2.2: Medical conditions retrieval
    """
    medical_service = MedicalService(db)
    return await medical_service.get_pet_medical_conditions(str(current_user.id), pet_id)


@router.post(
    "/{pet_id}/allergies",
    response_model=AllergyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add allergy",
    description="Add an allergy to a pet's health record",
    responses={
        201: {"description": "Allergy added successfully", "model": AllergyResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def add_allergy(
    request: Request,
    pet_id: str,
    allergy_data: AllergyCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> AllergyResponse:
    """
    Add an allergy to a pet's health record.
    
    **Requirements validated:**
    - 2.2: Allergies storage and retrieval
    """
    medical_service = MedicalService(db)
    return await medical_service.add_allergy(str(current_user.id), pet_id, allergy_data)


@router.get(
    "/{pet_id}/allergies",
    response_model=List[AllergyResponse],
    summary="Get pet allergies",
    description="Retrieve all allergies for a pet",
    responses={
        200: {"description": "Allergies retrieved successfully", "model": List[AllergyResponse]},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_pet_allergies(
    request: Request,
    pet_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> List[AllergyResponse]:
    """
    Get all allergies for a pet.
    
    **Requirements validated:**
    - 2.2: Allergies retrieval
    """
    medical_service = MedicalService(db)
    return await medical_service.get_pet_allergies(str(current_user.id), pet_id)


@router.post(
    "/{pet_id}/vaccinations",
    response_model=VaccinationRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add vaccination record",
    description="Add a vaccination record to a pet's health record",
    responses={
        201: {"description": "Vaccination record added successfully", "model": VaccinationRecordResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def add_vaccination_record(
    request: Request,
    pet_id: str,
    vaccination_data: VaccinationRecordCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> VaccinationRecordResponse:
    """
    Add a vaccination record to a pet's health record.
    
    **Requirements validated:**
    - 2.3: Vaccination record storage and retrieval
    """
    medical_service = MedicalService(db)
    return await medical_service.add_vaccination_record(str(current_user.id), pet_id, vaccination_data)


@router.get(
    "/{pet_id}/vaccinations",
    response_model=List[VaccinationRecordResponse],
    summary="Get pet vaccinations",
    description="Retrieve all vaccination records for a pet",
    responses={
        200: {"description": "Vaccination records retrieved successfully", "model": List[VaccinationRecordResponse]},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_pet_vaccinations(
    request: Request,
    pet_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> List[VaccinationRecordResponse]:
    """
    Get all vaccination records for a pet.
    
    **Requirements validated:**
    - 2.3: Vaccination record retrieval
    """
    medical_service = MedicalService(db)
    return await medical_service.get_pet_vaccinations(str(current_user.id), pet_id)


@router.post(
    "/{pet_id}/medical-history",
    response_model=MedicalHistoryEntryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add medical history entry",
    description="Add a medical history entry to a pet's health record",
    responses={
        201: {"description": "Medical history entry added successfully", "model": MedicalHistoryEntryResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def add_medical_history_entry(
    request: Request,
    pet_id: str,
    history_data: MedicalHistoryEntryCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> MedicalHistoryEntryResponse:
    """
    Add a medical history entry to a pet's health record.
    
    **Requirements validated:**
    - 2.3: Medical history tracking with timestamps
    """
    medical_service = MedicalService(db)
    return await medical_service.add_medical_history_entry(str(current_user.id), pet_id, history_data)


@router.get(
    "/{pet_id}/medical-history",
    response_model=List[MedicalHistoryEntryResponse],
    summary="Get pet medical history",
    description="Retrieve all medical history entries for a pet",
    responses={
        200: {"description": "Medical history retrieved successfully", "model": List[MedicalHistoryEntryResponse]},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_pet_medical_history(
    request: Request,
    pet_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> List[MedicalHistoryEntryResponse]:
    """
    Get all medical history entries for a pet.
    
    **Requirements validated:**
    - 2.3: Medical history retrieval with timestamps
    """
    medical_service = MedicalService(db)
    return await medical_service.get_pet_medical_history(str(current_user.id), pet_id)


@router.get(
    "/{pet_id}/medical-summary",
    response_model=PetMedicalSummaryResponse,
    summary="Get comprehensive medical summary",
    description="Retrieve complete medical summary for a pet including conditions, allergies, vaccinations, and history",
    responses={
        200: {"description": "Medical summary retrieved successfully", "model": PetMedicalSummaryResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_pet_medical_summary(
    request: Request,
    pet_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> PetMedicalSummaryResponse:
    """
    Get comprehensive medical summary for a pet.
    
    Returns complete medical information including conditions, allergies,
    vaccinations, and medical history with summary statistics.
    
    **Requirements validated:**
    - 2.2: Complete medical information retrieval
    - 2.3: Medical history with timestamps
    """
    medical_service = MedicalService(db)
    return await medical_service.get_pet_medical_summary(str(current_user.id), pet_id)