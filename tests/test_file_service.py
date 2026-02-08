"""
Tests for file management service.
"""

import pytest
import tempfile
import os
from pathlib import Path
from unittest.mock import Mock, AsyncMock
from fastapi import UploadFile
from io import BytesIO

from app.services.file_service import FileService, FileValidationService, FileStorageService
from app.services.document_processing_service import DocumentProcessingService, MedicalNLPService
from app.schemas.files import FileUploadRequest, FileValidationResponse


class TestFileValidationService:
    """Test file validation functionality."""
    
    def test_validate_file_type_allowed(self):
        """Test validation of allowed file types."""
        validation = FileValidationService.validate_file_type("test.pdf", "application/pdf")
        assert validation.valid is True
        assert len(validation.errors) == 0
    
    def test_validate_file_type_not_allowed(self):
        """Test validation of disallowed file types."""
        validation = FileValidationService.validate_file_type("test.exe", "application/octet-stream")
        assert validation.valid is False
        assert len(validation.errors) > 0
        assert "not allowed" in validation.errors[0].message
    
    def test_validate_file_size_valid(self):
        """Test validation of valid file size."""
        validation = FileValidationService.validate_file_size(1024)  # 1KB
        assert validation.valid is True
        assert len(validation.errors) == 0
    
    def test_validate_file_size_too_large(self):
        """Test validation of oversized files."""
        validation = FileValidationService.validate_file_size(20 * 1024 * 1024)  # 20MB
        assert validation.valid is False
        assert len(validation.errors) > 0
        assert "exceeds maximum" in validation.errors[0].message
    
    def test_validate_file_size_empty(self):
        """Test validation of empty files."""
        validation = FileValidationService.validate_file_size(0)
        assert validation.valid is False
        assert len(validation.errors) > 0
        assert "empty" in validation.errors[0].message.lower()
    
    def test_validate_filename_safe(self):
        """Test validation of safe filenames."""
        validation = FileValidationService.validate_filename("test_document.pdf")
        assert validation.valid is True
        assert len(validation.errors) == 0
    
    def test_validate_filename_dangerous(self):
        """Test validation of dangerous filenames."""
        validation = FileValidationService.validate_filename("../../../etc/passwd")
        assert validation.valid is False
        assert len(validation.errors) > 0
        assert "dangerous character" in validation.errors[0].message


class TestMedicalNLPService:
    """Test medical NLP extraction functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.nlp_service = MedicalNLPService()
    
    def test_extract_dates(self):
        """Test date extraction from text."""
        text = "Vaccination date: 2023-06-15 and next visit on 12/25/2023"
        dates = self.nlp_service._extract_dates(text)
        assert len(dates) >= 2
        assert "2023-06-15" in dates or "06-15" in str(dates)
    
    def test_extract_medications(self):
        """Test medication extraction from text."""
        text = """
        MEDICATIONS:
        - Heartgard Plus: Monthly, 25mg
        - Nexgard: Monthly, 25mg
        """
        medications = self.nlp_service._extract_medications(text)
        assert len(medications) >= 2
        assert any("Heartgard" in med['name'] for med in medications)
        assert any("Nexgard" in med['name'] for med in medications)
    
    def test_extract_vaccinations(self):
        """Test vaccination extraction from text."""
        text = """
        VACCINATION RECORD:
        - Rabies: 2023-06-15
        - DHPP: 2023-06-15
        """
        vaccinations = self.nlp_service._extract_vaccinations(text)
        assert len(vaccinations) >= 2
        assert any("Rabies" in vacc['vaccine'] for vacc in vaccinations)
        assert any("DHPP" in vacc['vaccine'] for vacc in vaccinations)
    
    def test_extract_allergies(self):
        """Test allergy extraction from text."""
        text = """
        ALLERGIES:
        - Chicken protein
        - Grass pollen
        """
        allergies = self.nlp_service._extract_allergies(text)
        assert len(allergies) >= 2
        assert "Chicken protein" in allergies
        assert "Grass pollen" in allergies
    
    def test_extract_veterinarian_info(self):
        """Test veterinarian information extraction."""
        text = """
        Veterinarian: Dr. Sarah Johnson
        Clinic: Happy Paws Veterinary Clinic
        Phone: (555) 123-4567
        """
        info = self.nlp_service._extract_veterinarian_info(text)
        assert "veterinarian" in info
        assert "Dr. Sarah Johnson" in info["veterinarian"]
        assert "clinic" in info
        assert "Happy Paws" in info["clinic"]
        assert "phone" in info
        assert "(555) 123-4567" in info["phone"]
    
    @pytest.mark.asyncio
    async def test_extract_medical_information(self):
        """Test complete medical information extraction."""
        text = """
        VETERINARY MEDICAL RECORD
        
        Pet Name: Buddy
        Species: Dog
        
        VACCINATION RECORD:
        - Rabies: 2023-06-15
        - DHPP: 2023-06-15
        
        MEDICATIONS:
        - Heartgard Plus: Monthly, 25mg
        
        ALLERGIES:
        - Chicken protein
        
        Veterinarian: Dr. Sarah Johnson
        """
        
        result = await self.nlp_service.extract_medical_information(text, "medical_record")
        
        assert result.success is True
        assert "vaccinations" in result.extracted_data
        assert "medications" in result.extracted_data
        assert "allergies" in result.extracted_data
        assert "veterinarian_info" in result.extracted_data
        assert len(result.confidence_scores) > 0


class TestDocumentProcessingService:
    """Test document processing functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.processing_service = DocumentProcessingService()
    
    @pytest.mark.asyncio
    async def test_process_document_success(self):
        """Test successful document processing."""
        # Mock database session
        mock_db = AsyncMock()
        
        # Sample PDF content (simplified)
        file_content = b"Sample medical document content"
        
        result = await self.processing_service.process_document(
            db=mock_db,
            file_id="test-file-id",
            file_content=file_content,
            file_type="pdf",
            document_type="medical_record"
        )
        
        # Should succeed with simulated OCR
        assert result.success is True
        assert result.extracted_data is not None
        assert result.processing_method in ["pdf_extraction", "ocr", "text_extraction", "nlp_rules"]


if __name__ == "__main__":
    pytest.main([__file__])