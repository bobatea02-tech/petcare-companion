"""
File management API endpoints for PawPal Voice Pet Care Assistant.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import io

from app.core.dependencies import get_db_session, get_current_user
from app.database.models import User
from app.services.file_service import FileService
from app.services.document_processing_service import DocumentProcessingService
from app.schemas.files import (
    FileUploadRequest, FileUploadResponse, FileInfo, 
    FileListResponse, FileUpdateRequest, FileValidationResponse,
    ExtractedMedicalData
)


router = APIRouter(prefix="/files", tags=["files"])
file_service = FileService()
document_processing_service = DocumentProcessingService()


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    pet_id: str = Form(...),
    document_type: str = Form(...),
    category: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # JSON string of tags
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a file for a pet.
    
    - **file**: The file to upload
    - **pet_id**: ID of the pet this file belongs to
    - **document_type**: Type of document (medical_record, vaccination, photo, etc.)
    - **category**: Additional categorization (optional)
    - **description**: File description (optional)
    - **tags**: JSON string of tags for organization (optional)
    """
    
    # Parse tags if provided
    parsed_tags = None
    if tags:
        try:
            import json
            parsed_tags = json.loads(tags)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid tags format. Must be valid JSON array.")
    
    # Create upload request
    upload_request = FileUploadRequest(
        pet_id=UUID(pet_id),
        document_type=document_type,
        category=category,
        description=description,
        tags=parsed_tags
    )
    
    # Upload file
    return await file_service.upload_file(
        db=db,
        file=file,
        upload_request=upload_request,
        user_id=str(current_user.id)
    )


@router.get("/validate", response_model=FileValidationResponse)
async def validate_file_upload(
    filename: str,
    content_type: str,
    file_size: int,
    current_user: User = Depends(get_current_user)
):
    """
    Validate file upload parameters before actual upload.
    
    - **filename**: Name of the file to validate
    - **content_type**: MIME type of the file
    - **file_size**: Size of the file in bytes
    """
    
    validation_service = file_service.validation_service
    
    # Validate filename
    filename_validation = validation_service.validate_filename(filename)
    
    # Validate file type
    file_type_validation = validation_service.validate_file_type(filename, content_type)
    
    # Validate file size
    size_validation = validation_service.validate_file_size(file_size)
    
    # Combine all validations
    all_errors = []
    all_warnings = []
    
    all_errors.extend(filename_validation.errors)
    all_warnings.extend(filename_validation.warnings)
    
    all_errors.extend(file_type_validation.errors)
    all_warnings.extend(file_type_validation.warnings)
    
    all_errors.extend(size_validation.errors)
    all_warnings.extend(size_validation.warnings)
    
    return FileValidationResponse(
        valid=len(all_errors) == 0,
        errors=all_errors,
        warnings=all_warnings
    )


@router.get("/{file_id}", response_model=FileInfo)
async def get_file_info(
    file_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get information about a specific file.
    
    - **file_id**: ID of the file to retrieve information for
    """
    
    file_info = await file_service.get_file_info(
        db=db,
        file_id=file_id,
        user_id=str(current_user.id)
    )
    
    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")
    
    return file_info


@router.get("/pet/{pet_id}", response_model=FileListResponse)
async def list_pet_files(
    pet_id: str,
    document_type: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    List files for a specific pet.
    
    - **pet_id**: ID of the pet to list files for
    - **document_type**: Filter by document type (optional)
    - **page**: Page number for pagination (default: 1)
    - **page_size**: Number of files per page (default: 20, max: 100)
    """
    
    # Limit page size
    page_size = min(page_size, 100)
    
    files = await file_service.list_files(
        db=db,
        pet_id=pet_id,
        user_id=str(current_user.id),
        document_type=document_type,
        page=page,
        page_size=page_size
    )
    
    return FileListResponse(
        files=files,
        total_count=len(files),  # This is simplified - in production, you'd want a separate count query
        page=page,
        page_size=page_size
    )


@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Download a file.
    
    - **file_id**: ID of the file to download
    """
    
    file_content, filename, mime_type = await file_service.download_file(
        db=db,
        file_id=file_id,
        user_id=str(current_user.id)
    )
    
    # Create streaming response
    file_stream = io.BytesIO(file_content)
    
    return StreamingResponse(
        io.BytesIO(file_content),
        media_type=mime_type,
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Length": str(len(file_content))
        }
    )


@router.put("/{file_id}", response_model=FileInfo)
async def update_file_metadata(
    file_id: str,
    update_request: FileUpdateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Update file metadata.
    
    - **file_id**: ID of the file to update
    - **update_request**: Updated metadata
    """
    
    # Get current file info
    file_info = await file_service.get_file_info(
        db=db,
        file_id=file_id,
        user_id=str(current_user.id)
    )
    
    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Update file metadata in database
    from sqlalchemy import select
    from app.database.models import PetFile
    
    query = select(PetFile).where(PetFile.id == file_id)
    result = await db.execute(query)
    pet_file = result.scalar_one_or_none()
    
    if update_request.description is not None:
        pet_file.description = update_request.description
    
    if update_request.tags is not None:
        pet_file.tags = str(update_request.tags)
    
    if update_request.category is not None:
        pet_file.category = update_request.category
    
    await db.commit()
    await db.refresh(pet_file)
    
    # Return updated file info
    return await file_service.get_file_info(
        db=db,
        file_id=file_id,
        user_id=str(current_user.id)
    )


@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a file.
    
    - **file_id**: ID of the file to delete
    """
    
    success = await file_service.delete_file(
        db=db,
        file_id=file_id,
        user_id=str(current_user.id)
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {"message": "File deleted successfully"}


@router.get("/types/allowed")
async def get_allowed_file_types(
    current_user: User = Depends(get_current_user)
):
    """
    Get list of allowed file types and maximum file size.
    """
    
    from app.core.config import settings
    
    return {
        "allowed_file_types": settings.ALLOWED_FILE_TYPES,
        "max_file_size": settings.MAX_FILE_SIZE,
        "max_file_size_mb": settings.MAX_FILE_SIZE / (1024 * 1024)
    }


@router.get("/document-types/available")
async def get_available_document_types(
    current_user: User = Depends(get_current_user)
):
    """
    Get list of available document types for organization.
    """
    
    return {
        "document_types": [
            "medical_record",
            "vaccination",
            "photo",
            "lab_result",
            "prescription",
            "insurance",
            "other"
        ]
    }


@router.post("/{file_id}/process")
async def process_document(
    file_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Process a document to extract medical information.
    
    - **file_id**: ID of the file to process
    """
    
    # Get file info and validate ownership
    file_info = await file_service.get_file_info(
        db=db,
        file_id=file_id,
        user_id=str(current_user.id)
    )
    
    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Get file content
    file_content, _, _ = await file_service.download_file(
        db=db,
        file_id=file_id,
        user_id=str(current_user.id)
    )
    
    # Process document
    result = await document_processing_service.process_document(
        db=db,
        file_id=file_id,
        file_content=file_content,
        file_type=file_info.file_type,
        document_type=file_info.document_type
    )
    
    if result.success:
        return {
            "message": "Document processed successfully",
            "extracted_data": result.extracted_data,
            "confidence_scores": result.confidence_scores,
            "processing_method": result.processing_method
        }
    else:
        raise HTTPException(
            status_code=500, 
            detail=f"Document processing failed: {result.error_message}"
        )


@router.get("/{file_id}/extracted-data", response_model=ExtractedMedicalData)
async def get_extracted_data(
    file_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get extracted medical data from a processed document.
    
    - **file_id**: ID of the file to get extracted data for
    """
    
    file_info = await file_service.get_file_info(
        db=db,
        file_id=file_id,
        user_id=str(current_user.id)
    )
    
    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")
    
    if not file_info.extracted_data:
        raise HTTPException(
            status_code=404, 
            detail="No extracted data available. Process the document first."
        )
    
    return ExtractedMedicalData(
        document_type=file_info.document_type,
        extracted_fields=file_info.extracted_data,
        confidence_scores={},  # Would be stored separately in production
        raw_text=file_info.extracted_data.get('raw_text'),
        processing_method=file_info.extracted_data.get('processing_method', 'unknown')
    )


@router.post("/{file_id}/replace")
async def replace_file_version(
    file_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Replace a file with a new version.
    
    - **file_id**: ID of the original file to replace
    - **file**: New file content
    """
    
    # Validate file ownership
    file_info = await file_service.get_file_info(
        db=db,
        file_id=file_id,
        user_id=str(current_user.id)
    )
    
    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Read new file content
    new_file_content = await file.read()
    
    # Create new version
    new_version_id = await document_processing_service.create_new_version(
        db=db,
        original_file_id=file_id,
        new_file_content=new_file_content,
        new_filename=file.filename,
        user_id=str(current_user.id)
    )
    
    # Process new version if it's a medical document
    if file_info.document_type in ['medical_record', 'vaccination', 'lab_result']:
        await document_processing_service.process_document(
            db=db,
            file_id=new_version_id,
            file_content=new_file_content,
            file_type=file_info.file_type,
            document_type=file_info.document_type
        )
    
    return {
        "message": "File version created successfully",
        "new_version_id": new_version_id,
        "original_file_id": file_id
    }


@router.get("/{file_id}/versions")
async def get_file_versions(
    file_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get all versions of a file.
    
    - **file_id**: ID of the file to get versions for
    """
    
    # Validate file ownership
    file_info = await file_service.get_file_info(
        db=db,
        file_id=file_id,
        user_id=str(current_user.id)
    )
    
    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")
    
    versions = await document_processing_service.get_file_versions(
        db=db,
        file_id=file_id
    )
    
    return {
        "file_id": file_id,
        "versions": versions,
        "total_versions": len(versions)
    }


@router.get("/{file_id}/processing-status")
async def get_processing_status(
    file_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get processing status and logs for a file.
    
    - **file_id**: ID of the file to get processing status for
    """
    
    # Validate file ownership
    file_info = await file_service.get_file_info(
        db=db,
        file_id=file_id,
        user_id=str(current_user.id)
    )
    
    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Get processing logs
    from sqlalchemy import select
    from app.database.models import FileProcessingLog
    
    query = select(FileProcessingLog).where(
        FileProcessingLog.file_id == file_id
    ).order_by(FileProcessingLog.created_at.desc())
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return {
        "file_id": file_id,
        "current_status": file_info.processing_status,
        "processing_logs": [
            {
                "operation_type": log.operation_type,
                "status": log.status,
                "created_at": log.created_at.isoformat(),
                "processing_time_ms": log.processing_time_ms,
                "error_message": log.error_message
            }
            for log in logs
        ]
    }
