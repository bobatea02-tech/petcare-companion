"""
File management service for PawPal Voice Pet Care Assistant.
"""

import os
import uuid
import hashlib
import mimetypes
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from pathlib import Path
from cryptography.fernet import Fernet
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload

from app.database.models import PetFile, FileProcessingLog, Pet
from app.schemas.files import (
    FileUploadRequest, FileUploadResponse, FileInfo, 
    FileValidationError, FileValidationResponse,
    ExtractedMedicalData
)
from app.core.config import settings


class FileEncryptionService:
    """Service for file encryption and decryption."""
    
    def __init__(self):
        self.encryption_key = self._get_or_create_encryption_key()
        self.cipher = Fernet(self.encryption_key)
    
    def _get_or_create_encryption_key(self) -> bytes:
        """Get or create encryption key for file security."""
        key_file = Path("file_encryption.key")
        
        if key_file.exists():
            with open(key_file, "rb") as f:
                return f.read()
        else:
            key = Fernet.generate_key()
            with open(key_file, "wb") as f:
                f.write(key)
            return key
    
    def encrypt_file(self, file_content: bytes) -> bytes:
        """Encrypt file content."""
        return self.cipher.encrypt(file_content)
    
    def decrypt_file(self, encrypted_content: bytes) -> bytes:
        """Decrypt file content."""
        return self.cipher.decrypt(encrypted_content)


class FileValidationService:
    """Service for validating uploaded files."""
    
    @staticmethod
    def validate_file_type(filename: str, content_type: str) -> FileValidationResponse:
        """Validate file type and extension."""
        errors = []
        warnings = []
        
        # Extract file extension
        file_extension = Path(filename).suffix.lower().lstrip('.')
        
        # Check if file type is allowed
        if file_extension not in settings.ALLOWED_FILE_TYPES:
            errors.append(FileValidationError(
                field="file_type",
                message=f"File type '{file_extension}' is not allowed. Allowed types: {', '.join(settings.ALLOWED_FILE_TYPES)}",
                code="INVALID_FILE_TYPE"
            ))
        
        # Validate MIME type matches extension
        expected_mime = mimetypes.guess_type(filename)[0]
        if expected_mime and content_type != expected_mime:
            warnings.append(f"MIME type '{content_type}' doesn't match expected type '{expected_mime}' for file extension '{file_extension}'")
        
        return FileValidationResponse(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    @staticmethod
    def validate_file_size(file_size: int) -> FileValidationResponse:
        """Validate file size."""
        errors = []
        warnings = []
        
        if file_size > settings.MAX_FILE_SIZE:
            errors.append(FileValidationError(
                field="file_size",
                message=f"File size {file_size} bytes exceeds maximum allowed size of {settings.MAX_FILE_SIZE} bytes",
                code="FILE_TOO_LARGE"
            ))
        
        if file_size == 0:
            errors.append(FileValidationError(
                field="file_size",
                message="File is empty",
                code="EMPTY_FILE"
            ))
        
        return FileValidationResponse(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    @staticmethod
    def validate_filename(filename: str) -> FileValidationResponse:
        """Validate filename for security and compatibility."""
        errors = []
        warnings = []
        
        # Check for dangerous characters
        dangerous_chars = ['..', '/', '\\', ':', '*', '?', '"', '<', '>', '|']
        for char in dangerous_chars:
            if char in filename:
                errors.append(FileValidationError(
                    field="filename",
                    message=f"Filename contains dangerous character: '{char}'",
                    code="UNSAFE_FILENAME"
                ))
        
        # Check filename length
        if len(filename) > 255:
            errors.append(FileValidationError(
                field="filename",
                message="Filename is too long (maximum 255 characters)",
                code="FILENAME_TOO_LONG"
            ))
        
        if len(filename) == 0:
            errors.append(FileValidationError(
                field="filename",
                message="Filename cannot be empty",
                code="EMPTY_FILENAME"
            ))
        
        return FileValidationResponse(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )


class FileStorageService:
    """Service for file storage operations."""
    
    def __init__(self):
        self.storage_root = Path("file_storage")
        self.storage_root.mkdir(exist_ok=True)
        self.encryption_service = FileEncryptionService()
    
    def _generate_secure_filename(self, original_filename: str, pet_id: str) -> str:
        """Generate a secure filename for storage."""
        file_extension = Path(original_filename).suffix.lower()
        unique_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{pet_id}_{timestamp}_{unique_id}{file_extension}"
    
    def _get_storage_path(self, pet_id: str, document_type: str) -> Path:
        """Get storage path organized by pet and document type."""
        return self.storage_root / pet_id / document_type
    
    async def store_file(
        self, 
        file_content: bytes, 
        original_filename: str, 
        pet_id: str, 
        document_type: str,
        encrypt: bool = True
    ) -> Tuple[str, str]:
        """Store file content and return storage path and filename."""
        
        # Generate secure filename
        secure_filename = self._generate_secure_filename(original_filename, pet_id)
        
        # Create storage directory
        storage_path = self._get_storage_path(pet_id, document_type)
        storage_path.mkdir(parents=True, exist_ok=True)
        
        # Full file path
        file_path = storage_path / secure_filename
        
        # Encrypt file content if requested
        if encrypt:
            file_content = self.encryption_service.encrypt_file(file_content)
        
        # Write file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        return str(file_path), secure_filename
    
    async def retrieve_file(self, file_path: str, encrypted: bool = True) -> bytes:
        """Retrieve and decrypt file content."""
        if not Path(file_path).exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        with open(file_path, "rb") as f:
            file_content = f.read()
        
        if encrypted:
            file_content = self.encryption_service.decrypt_file(file_content)
        
        return file_content
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete file from storage."""
        try:
            if Path(file_path).exists():
                os.remove(file_path)
                return True
            return False
        except Exception:
            return False


class FileService:
    """Main file management service."""
    
    def __init__(self):
        self.validation_service = FileValidationService()
        self.storage_service = FileStorageService()
    
    async def validate_file_upload(
        self, 
        file: UploadFile, 
        upload_request: FileUploadRequest
    ) -> FileValidationResponse:
        """Validate file upload request."""
        all_errors = []
        all_warnings = []
        
        # Validate filename
        filename_validation = self.validation_service.validate_filename(file.filename)
        all_errors.extend(filename_validation.errors)
        all_warnings.extend(filename_validation.warnings)
        
        # Validate file type
        file_type_validation = self.validation_service.validate_file_type(
            file.filename, file.content_type
        )
        all_errors.extend(file_type_validation.errors)
        all_warnings.extend(file_type_validation.warnings)
        
        # Validate file size
        file_size = 0
        if hasattr(file, 'size') and file.size:
            file_size = file.size
        else:
            # Read file to get size
            content = await file.read()
            file_size = len(content)
            await file.seek(0)  # Reset file pointer
        
        size_validation = self.validation_service.validate_file_size(file_size)
        all_errors.extend(size_validation.errors)
        all_warnings.extend(size_validation.warnings)
        
        return FileValidationResponse(
            valid=len(all_errors) == 0,
            errors=all_errors,
            warnings=all_warnings
        )
    
    async def upload_file(
        self, 
        db: AsyncSession, 
        file: UploadFile, 
        upload_request: FileUploadRequest,
        user_id: str
    ) -> FileUploadResponse:
        """Upload and store a file."""
        
        # Validate pet ownership
        pet_query = select(Pet).where(
            and_(Pet.id == upload_request.pet_id, Pet.user_id == user_id)
        )
        pet_result = await db.execute(pet_query)
        pet = pet_result.scalar_one_or_none()
        
        if not pet:
            raise HTTPException(
                status_code=404, 
                detail="Pet not found or access denied"
            )
        
        # Validate file upload
        validation_result = await self.validate_file_upload(file, upload_request)
        if not validation_result.valid:
            raise HTTPException(
                status_code=400, 
                detail=f"File validation failed: {', '.join([e.message for e in validation_result.errors])}"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Store file
        file_path, secure_filename = await self.storage_service.store_file(
            file_content=file_content,
            original_filename=file.filename,
            pet_id=str(upload_request.pet_id),
            document_type=upload_request.document_type,
            encrypt=True
        )
        
        # Create database record
        file_extension = Path(file.filename).suffix.lower().lstrip('.')
        
        pet_file = PetFile(
            pet_id=upload_request.pet_id,
            filename=secure_filename,
            original_filename=file.filename,
            file_type=file_extension,
            file_size=len(file_content),
            mime_type=file.content_type,
            document_type=upload_request.document_type,
            category=upload_request.category,
            description=upload_request.description,
            tags=str(upload_request.tags) if upload_request.tags else None,
            file_path=file_path,
            storage_backend="local",
            encrypted=True,
            version=1,
            is_current_version=True,
            processing_status="completed"
        )
        
        db.add(pet_file)
        await db.commit()
        await db.refresh(pet_file)
        
        # Log processing
        processing_log = FileProcessingLog(
            file_id=pet_file.id,
            operation_type="upload",
            status="completed",
            result_data='{"message": "File uploaded successfully"}',
            processing_time_ms=0
        )
        db.add(processing_log)
        await db.commit()
        
        return FileUploadResponse(
            file_id=pet_file.id,
            filename=pet_file.filename,
            original_filename=pet_file.original_filename,
            file_type=pet_file.file_type,
            file_size=pet_file.file_size,
            document_type=pet_file.document_type,
            category=pet_file.category,
            description=pet_file.description,
            tags=eval(pet_file.tags) if pet_file.tags else None,
            version=pet_file.version,
            processing_status=pet_file.processing_status,
            created_at=pet_file.created_at
        )
    
    async def get_file_info(
        self, 
        db: AsyncSession, 
        file_id: str, 
        user_id: str
    ) -> Optional[FileInfo]:
        """Get file information."""
        
        query = select(PetFile).options(
            selectinload(PetFile.pet)
        ).where(PetFile.id == file_id)
        
        result = await db.execute(query)
        pet_file = result.scalar_one_or_none()
        
        if not pet_file or pet_file.pet.user_id != user_id:
            return None
        
        return FileInfo(
            id=pet_file.id,
            pet_id=pet_file.pet_id,
            filename=pet_file.filename,
            original_filename=pet_file.original_filename,
            file_type=pet_file.file_type,
            file_size=pet_file.file_size,
            mime_type=pet_file.mime_type,
            document_type=pet_file.document_type,
            category=pet_file.category,
            description=pet_file.description,
            tags=eval(pet_file.tags) if pet_file.tags else None,
            version=pet_file.version,
            is_current_version=pet_file.is_current_version,
            processing_status=pet_file.processing_status,
            extracted_data=eval(pet_file.extracted_data) if pet_file.extracted_data else None,
            created_at=pet_file.created_at,
            updated_at=pet_file.updated_at
        )
    
    async def list_files(
        self, 
        db: AsyncSession, 
        pet_id: str, 
        user_id: str,
        document_type: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> List[FileInfo]:
        """List files for a pet."""
        
        # Validate pet ownership
        pet_query = select(Pet).where(
            and_(Pet.id == pet_id, Pet.user_id == user_id)
        )
        pet_result = await db.execute(pet_query)
        pet = pet_result.scalar_one_or_none()
        
        if not pet:
            raise HTTPException(
                status_code=404, 
                detail="Pet not found or access denied"
            )
        
        # Build query
        query = select(PetFile).where(
            and_(
                PetFile.pet_id == pet_id,
                PetFile.is_active == True,
                PetFile.is_current_version == True
            )
        )
        
        if document_type:
            query = query.where(PetFile.document_type == document_type)
        
        query = query.order_by(desc(PetFile.created_at))
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        result = await db.execute(query)
        pet_files = result.scalars().all()
        
        return [
            FileInfo(
                id=pf.id,
                pet_id=pf.pet_id,
                filename=pf.filename,
                original_filename=pf.original_filename,
                file_type=pf.file_type,
                file_size=pf.file_size,
                mime_type=pf.mime_type,
                document_type=pf.document_type,
                category=pf.category,
                description=pf.description,
                tags=eval(pf.tags) if pf.tags else None,
                version=pf.version,
                is_current_version=pf.is_current_version,
                processing_status=pf.processing_status,
                extracted_data=eval(pf.extracted_data) if pf.extracted_data else None,
                created_at=pf.created_at,
                updated_at=pf.updated_at
            )
            for pf in pet_files
        ]
    
    async def download_file(
        self, 
        db: AsyncSession, 
        file_id: str, 
        user_id: str
    ) -> Tuple[bytes, str, str]:
        """Download file content."""
        
        # Get file info
        file_info = await self.get_file_info(db, file_id, user_id)
        if not file_info:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get file record for path
        query = select(PetFile).where(PetFile.id == file_id)
        result = await db.execute(query)
        pet_file = result.scalar_one_or_none()
        
        # Retrieve file content
        file_content = await self.storage_service.retrieve_file(
            pet_file.file_path, 
            encrypted=pet_file.encrypted
        )
        
        return file_content, pet_file.original_filename, pet_file.mime_type
    
    async def delete_file(
        self, 
        db: AsyncSession, 
        file_id: str, 
        user_id: str
    ) -> bool:
        """Delete a file."""
        
        # Get file info
        file_info = await self.get_file_info(db, file_id, user_id)
        if not file_info:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get file record
        query = select(PetFile).where(PetFile.id == file_id)
        result = await db.execute(query)
        pet_file = result.scalar_one_or_none()
        
        # Soft delete in database
        pet_file.is_active = False
        await db.commit()
        
        # Delete physical file
        await self.storage_service.delete_file(pet_file.file_path)
        
        return True