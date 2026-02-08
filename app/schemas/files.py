"""
Pydantic schemas for file management operations.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator
from uuid import UUID


class FileUploadRequest(BaseModel):
    """Request schema for file upload."""
    
    pet_id: UUID = Field(..., description="ID of the pet this file belongs to")
    document_type: str = Field(..., description="Type of document (medical_record, vaccination, photo, etc.)")
    category: Optional[str] = Field(None, description="Additional categorization")
    description: Optional[str] = Field(None, description="File description")
    tags: Optional[List[str]] = Field(None, description="File tags for organization")
    
    @validator('document_type')
    def validate_document_type(cls, v):
        allowed_types = [
            'medical_record', 'vaccination', 'photo', 'lab_result', 
            'prescription', 'insurance', 'other'
        ]
        if v not in allowed_types:
            raise ValueError(f'Document type must be one of: {", ".join(allowed_types)}')
        return v


class FileUploadResponse(BaseModel):
    """Response schema for successful file upload."""
    
    file_id: UUID
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    document_type: str
    category: Optional[str]
    description: Optional[str]
    tags: Optional[List[str]]
    version: int
    processing_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class FileInfo(BaseModel):
    """Schema for file information."""
    
    id: UUID
    pet_id: UUID
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    mime_type: str
    document_type: str
    category: Optional[str]
    description: Optional[str]
    tags: Optional[List[str]]
    version: int
    is_current_version: bool
    processing_status: str
    extracted_data: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FileListResponse(BaseModel):
    """Response schema for file listing."""
    
    files: List[FileInfo]
    total_count: int
    page: int
    page_size: int


class FileUpdateRequest(BaseModel):
    """Request schema for updating file metadata."""
    
    description: Optional[str] = Field(None, description="Updated file description")
    tags: Optional[List[str]] = Field(None, description="Updated file tags")
    category: Optional[str] = Field(None, description="Updated category")


class FileProcessingStatus(BaseModel):
    """Schema for file processing status."""
    
    file_id: UUID
    processing_status: str
    extracted_data: Optional[Dict[str, Any]]
    error_message: Optional[str]
    processing_time_ms: Optional[int]
    
    class Config:
        from_attributes = True


class FileValidationError(BaseModel):
    """Schema for file validation errors."""
    
    field: str
    message: str
    code: str


class FileValidationResponse(BaseModel):
    """Response schema for file validation."""
    
    valid: bool
    errors: List[FileValidationError]
    warnings: List[str]


class ExtractedMedicalData(BaseModel):
    """Schema for extracted medical data from documents."""
    
    document_type: str
    extracted_fields: Dict[str, Any]
    confidence_scores: Dict[str, float]
    raw_text: Optional[str]
    processing_method: str  # ocr, nlp, manual
    
    class Config:
        from_attributes = True