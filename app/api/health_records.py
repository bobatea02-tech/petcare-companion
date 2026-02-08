"""
Health Records API endpoints for comprehensive health record management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from datetime import date, datetime
import json

from app.database.connection import get_db_session
from app.services.health_record_service import HealthRecordService
from app.services.export_service import HealthSummaryExporter
from app.schemas.health_records import (
    HealthRecordCreate,
    HealthRecordUpdate,
    HealthRecordResponse,
    SymptomLogCreate,
    SymptomLogResponse,
    VaccinationCreate,
    VaccinationResponse,
    AIAssessmentCreate,
    AIAssessmentResponse,
    HealthRecordListResponse,
    HealthSummaryResponse,
    ErrorResponse
)
from app.core.dependencies import get_current_active_user
from app.core.middleware import limiter, GENERAL_RATE_LIMIT
from app.database.models import User


# Create router for health records management endpoints
router = APIRouter(prefix="/health-records", tags=["Health Records"])


@router.post(
    "/",
    response_model=HealthRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create health record",
    description="Create a new health record with timestamped symptom logs and AI assessments",
    responses={
        201: {"description": "Health record created successfully", "model": HealthRecordResponse},
        400: {"description": "Validation error in health record data", "model": ErrorResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def create_health_record(
    request: Request,
    health_record_data: HealthRecordCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> HealthRecordResponse:
    """
    Create a new health record for a pet.
    
    Creates timestamped health record entries with symptom logs and AI assessments.
    Supports various record types including symptom logs, vaccinations, checkups, and emergencies.
    
    **Requirements validated:**
    - 6.1: Timestamped symptom log entries with AI assessments
    - 6.2: Vaccination record storage with dates and expiration tracking
    """
    health_service = HealthRecordService(db)
    return await health_service.create_health_record(str(current_user.id), health_record_data)


@router.get(
    "/pet/{pet_id}",
    response_model=HealthRecordListResponse,
    summary="Get pet health records",
    description="Retrieve chronological health history with filtering capabilities",
    responses={
        200: {"description": "Health records retrieved successfully", "model": HealthRecordListResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_pet_health_records(
    request: Request,
    pet_id: str,
    record_type: Optional[str] = Query(None, description="Filter by record type (symptom_log, vaccination, checkup, emergency)"),
    start_date: Optional[date] = Query(None, description="Filter records from this date"),
    end_date: Optional[date] = Query(None, description="Filter records until this date"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> HealthRecordListResponse:
    """
    Get chronological health history for a pet with filtering capabilities.
    
    Returns health records in reverse chronological order with optional filtering
    by record type, date range, and pagination support.
    
    **Requirements validated:**
    - 6.4: Chronological health history with filtering capabilities
    """
    health_service = HealthRecordService(db)
    return await health_service.get_pet_health_records(
        str(current_user.id), pet_id, record_type, start_date, end_date, limit, offset
    )


@router.get(
    "/{record_id}",
    response_model=HealthRecordResponse,
    summary="Get health record details",
    description="Retrieve detailed information about a specific health record",
    responses={
        200: {"description": "Health record retrieved successfully", "model": HealthRecordResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Health record not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_health_record(
    request: Request,
    record_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> HealthRecordResponse:
    """
    Get detailed information about a specific health record.
    
    Returns complete health record information including symptom logs,
    vaccinations, and AI assessments.
    
    **Requirements validated:**
    - 6.1: Health record retrieval with all associated data
    """
    health_service = HealthRecordService(db)
    return await health_service.get_health_record(str(current_user.id), record_id)


@router.put(
    "/{record_id}",
    response_model=HealthRecordResponse,
    summary="Update health record",
    description="Update an existing health record with new information",
    responses={
        200: {"description": "Health record updated successfully", "model": HealthRecordResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Health record not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def update_health_record(
    request: Request,
    record_id: str,
    health_record_data: HealthRecordUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> HealthRecordResponse:
    """
    Update an existing health record.
    
    Updates health record information with provided fields. Only specified
    fields will be updated while maintaining timestamp integrity.
    
    **Requirements validated:**
    - 6.1: Health record updates with timestamp tracking
    """
    health_service = HealthRecordService(db)
    return await health_service.update_health_record(str(current_user.id), record_id, health_record_data)


@router.post(
    "/{record_id}/symptom-logs",
    response_model=SymptomLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add symptom log",
    description="Add a symptom log entry to an existing health record",
    responses={
        201: {"description": "Symptom log added successfully", "model": SymptomLogResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Health record not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def add_symptom_log(
    request: Request,
    record_id: str,
    symptom_data: SymptomLogCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> SymptomLogResponse:
    """
    Add a symptom log entry to an existing health record.
    
    Creates timestamped symptom entries with severity and duration tracking.
    
    **Requirements validated:**
    - 6.1: Timestamped symptom log entries
    """
    health_service = HealthRecordService(db)
    return await health_service.add_symptom_log(str(current_user.id), record_id, symptom_data)


@router.post(
    "/{record_id}/vaccinations",
    response_model=VaccinationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add vaccination record",
    description="Add a vaccination record to an existing health record",
    responses={
        201: {"description": "Vaccination record added successfully", "model": VaccinationResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Health record not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def add_vaccination_record(
    request: Request,
    record_id: str,
    vaccination_data: VaccinationCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> VaccinationResponse:
    """
    Add a vaccination record to an existing health record.
    
    Creates vaccination entries with dates and expiration tracking.
    
    **Requirements validated:**
    - 6.2: Vaccination record storage with dates and expiration tracking
    """
    health_service = HealthRecordService(db)
    return await health_service.add_vaccination_record(str(current_user.id), record_id, vaccination_data)


@router.post(
    "/{record_id}/ai-assessments",
    response_model=AIAssessmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add AI assessment",
    description="Add an AI assessment to an existing health record",
    responses={
        201: {"description": "AI assessment added successfully", "model": AIAssessmentResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Health record not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def add_ai_assessment(
    request: Request,
    record_id: str,
    assessment_data: AIAssessmentCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> AIAssessmentResponse:
    """
    Add an AI assessment to an existing health record.
    
    Creates AI assessment entries linked to health records with triage levels
    and recommendations.
    
    **Requirements validated:**
    - 6.1: AI assessments linked to health records
    - 6.3: AI assessment results storage
    """
    health_service = HealthRecordService(db)
    return await health_service.add_ai_assessment(str(current_user.id), record_id, assessment_data)


@router.get(
    "/pet/{pet_id}/summary",
    response_model=HealthSummaryResponse,
    summary="Get exportable health summary",
    description="Generate comprehensive health summary for veterinary visits",
    responses={
        200: {"description": "Health summary generated successfully", "model": HealthSummaryResponse},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_health_summary(
    request: Request,
    pet_id: str,
    include_ai_insights: bool = Query(True, description="Include AI-powered insights and recommendations"),
    date_range_days: int = Query(90, ge=1, le=365, description="Number of days to include in summary"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> HealthSummaryResponse:
    """
    Generate comprehensive health summary for veterinary visits.
    
    Creates exportable health summaries with AI-powered insights and
    recommendations based on recent health records.
    
    **Requirements validated:**
    - 6.5: Exportable health summary generation for vet visits
    """
    health_service = HealthRecordService(db)
    return await health_service.generate_health_summary(
        str(current_user.id), pet_id, include_ai_insights, date_range_days
    )


@router.get(
    "/pet/{pet_id}/export/{format_type}",
    summary="Export health summary",
    description="Export comprehensive health summary in specified format (JSON or PDF)",
    responses={
        200: {"description": "Health summary exported successfully"},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "Pet not found", "model": ErrorResponse},
        422: {"description": "Invalid export format", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def export_health_summary(
    request: Request,
    pet_id: str,
    format_type: str,
    include_ai_insights: bool = Query(True, description="Include AI-powered insights and recommendations"),
    date_range_days: int = Query(90, ge=1, le=365, description="Number of days to include in summary"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Export comprehensive health summary in specified format.
    
    Generates exportable health summaries with AI-powered insights and
    recommendations in JSON or PDF format for veterinary visits.
    
    **Requirements validated:**
    - 6.5: Export functionality in multiple formats (PDF, JSON)
    """
    # Validate format type
    if format_type.lower() not in ["json", "pdf"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid export format. Supported formats: json, pdf"
        )
    
    try:
        health_service = HealthRecordService(db)
        export_service = HealthSummaryExporter()
        
        # Generate health summary
        health_summary = await health_service.generate_health_summary(
            str(current_user.id), pet_id, include_ai_insights, date_range_days
        )
        
        # Export in requested format
        export_result = await export_service.export_health_summary(
            health_summary, format_type
        )
        
        # Return appropriate response based on format
        if format_type.lower() == "json":
            return Response(
                content=json.dumps(export_result["data"], indent=2),
                media_type=export_result["content_type"],
                headers={
                    "Content-Disposition": f"attachment; filename={export_result['filename']}"
                }
            )
        else:  # PDF
            return Response(
                content=export_result["data"],
                media_type=export_result["content_type"],
                headers={
                    "Content-Disposition": f"attachment; filename={export_result['filename']}"
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export health summary: {str(e)}"
        )