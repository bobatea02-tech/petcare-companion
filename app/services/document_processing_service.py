"""
Document processing service for medical document parsing and extraction.
"""

import re
import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, date
from pathlib import Path
import asyncio
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException

from app.database.models import PetFile, FileProcessingLog
from app.schemas.files import ExtractedMedicalData
from app.services.ai_service import AIService


@dataclass
class ExtractionResult:
    """Result of document extraction process."""
    success: bool
    extracted_data: Dict[str, Any]
    confidence_scores: Dict[str, float]
    raw_text: Optional[str]
    processing_method: str
    error_message: Optional[str] = None


class OCRService:
    """Service for Optical Character Recognition."""
    
    def __init__(self):
        self.supported_formats = ['pdf', 'jpg', 'jpeg', 'png']
    
    async def extract_text_from_image(self, file_content: bytes, file_type: str) -> str:
        """Extract text from image using OCR."""
        # This is a simplified implementation
        # In production, you would use libraries like:
        # - pytesseract for basic OCR
        # - Google Cloud Vision API for advanced OCR
        # - AWS Textract for document analysis
        
        if file_type.lower() not in self.supported_formats:
            raise ValueError(f"Unsupported file type for OCR: {file_type}")
        
        # Simulate OCR processing
        # In real implementation, this would process the actual image
        simulated_text = """
        VETERINARY MEDICAL RECORD
        
        Pet Name: Buddy
        Species: Dog
        Breed: Golden Retriever
        Date of Birth: 2020-03-15
        
        VACCINATION RECORD:
        - Rabies: 2023-06-15 (Expires: 2024-06-15)
        - DHPP: 2023-06-15 (Expires: 2024-06-15)
        - Bordetella: 2023-06-15 (Expires: 2024-06-15)
        
        MEDICATIONS:
        - Heartgard Plus: Monthly, 25mg
        - Nexgard: Monthly, 25mg
        
        ALLERGIES:
        - Chicken protein
        - Grass pollen
        
        MEDICAL CONDITIONS:
        - Hip dysplasia (mild)
        - Seasonal allergies
        
        Last Visit: 2023-06-15
        Next Visit: 2024-06-15
        Veterinarian: Dr. Sarah Johnson
        Clinic: Happy Paws Veterinary Clinic
        """
        
        return simulated_text.strip()
    
    async def extract_text_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF document."""
        # This would use libraries like PyPDF2, pdfplumber, or pymupdf
        # For now, return simulated text
        
        simulated_text = """
        VACCINATION CERTIFICATE
        
        This certifies that the animal described below has been vaccinated:
        
        Animal Name: Whiskers
        Species: Cat
        Breed: Domestic Shorthair
        Age: 3 years
        Color: Orange Tabby
        
        Vaccinations Administered:
        Date: 2023-07-20
        Vaccine: FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)
        Lot Number: ABC123
        Expiration: 2024-07-20
        
        Date: 2023-07-20
        Vaccine: Rabies
        Lot Number: DEF456
        Expiration: 2026-07-20
        
        Veterinarian: Dr. Michael Chen
        License Number: VET12345
        Clinic: City Animal Hospital
        Address: 123 Main St, Anytown, ST 12345
        Phone: (555) 123-4567
        """
        
        return simulated_text.strip()


class MedicalNLPService:
    """Service for Natural Language Processing of medical documents."""
    
    def __init__(self):
        self.ai_service = AIService()
        
        # Patterns for extracting specific information
        self.date_patterns = [
            r'\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b',
            r'\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b',
            r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b'
        ]
        
        self.medication_patterns = [
            r'(?i)(medication|drug|prescription|rx):\s*([^\n]+)',
            r'(?i)([a-z]+(?:\s+[a-z]+)*)\s*:\s*(\d+(?:\.\d+)?\s*mg|daily|weekly|monthly)',
        ]
        
        self.vaccination_patterns = [
            r'(?i)(rabies|dhpp|bordetella|fvrcp|leukemia).*?(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
            r'(?i)vaccine:\s*([^\n]+)',
        ]
        
        self.allergy_patterns = [
            r'(?i)allerg(?:y|ies):\s*([^\n]+)',
            r'(?i)allergic\s+to:\s*([^\n]+)',
        ]
    
    def _extract_dates(self, text: str) -> List[str]:
        """Extract dates from text."""
        dates = []
        for pattern in self.date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            dates.extend(matches)
        return dates
    
    def _extract_medications(self, text: str) -> List[Dict[str, str]]:
        """Extract medication information from text."""
        medications = []
        
        # Look for medication sections
        med_sections = re.findall(r'(?i)medication[s]?:?\s*\n(.*?)(?=\n[A-Z]|\n\n|$)', text, re.DOTALL)
        
        for section in med_sections:
            lines = section.strip().split('\n')
            for line in lines:
                line = line.strip('- •').strip()
                if line and len(line) > 3:
                    # Try to parse medication name and dosage
                    parts = line.split(':')
                    if len(parts) >= 2:
                        medications.append({
                            'name': parts[0].strip(),
                            'dosage': parts[1].strip(),
                            'raw_text': line
                        })
                    else:
                        medications.append({
                            'name': line,
                            'dosage': '',
                            'raw_text': line
                        })
        
        return medications
    
    def _extract_vaccinations(self, text: str) -> List[Dict[str, str]]:
        """Extract vaccination information from text."""
        vaccinations = []
        
        # Look for vaccination sections
        vacc_sections = re.findall(r'(?i)vaccination[s]?.*?:?\s*\n(.*?)(?=\n[A-Z]|\n\n|$)', text, re.DOTALL)
        
        for section in vacc_sections:
            lines = section.strip().split('\n')
            for line in lines:
                line = line.strip('- •').strip()
                if line and len(line) > 3:
                    # Extract vaccine name and date
                    dates = self._extract_dates(line)
                    vaccine_name = re.sub(r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}', '', line).strip(':- ')
                    
                    vaccinations.append({
                        'vaccine': vaccine_name,
                        'date': dates[0] if dates else '',
                        'raw_text': line
                    })
        
        return vaccinations
    
    def _extract_allergies(self, text: str) -> List[str]:
        """Extract allergy information from text."""
        allergies = []
        
        # Look for allergy sections
        allergy_sections = re.findall(r'(?i)allerg(?:y|ies):?\s*\n(.*?)(?=\n[A-Z]|\n\n|$)', text, re.DOTALL)
        
        for section in allergy_sections:
            lines = section.strip().split('\n')
            for line in lines:
                line = line.strip('- •').strip()
                if line and len(line) > 2:
                    allergies.append(line)
        
        # Also look for inline allergy mentions
        inline_matches = re.findall(r'(?i)allerg(?:y|ies):\s*([^\n]+)', text)
        for match in inline_matches:
            items = [item.strip() for item in match.split(',')]
            allergies.extend(items)
        
        return list(set(allergies))  # Remove duplicates
    
    def _extract_medical_conditions(self, text: str) -> List[str]:
        """Extract medical conditions from text."""
        conditions = []
        
        # Look for medical condition sections
        condition_sections = re.findall(r'(?i)(?:medical\s+)?condition[s]?:?\s*\n(.*?)(?=\n[A-Z]|\n\n|$)', text, re.DOTALL)
        
        for section in condition_sections:
            lines = section.strip().split('\n')
            for line in lines:
                line = line.strip('- •').strip()
                if line and len(line) > 3:
                    conditions.append(line)
        
        return conditions
    
    def _extract_veterinarian_info(self, text: str) -> Dict[str, str]:
        """Extract veterinarian and clinic information."""
        info = {}
        
        # Extract veterinarian name
        vet_matches = re.findall(r'(?i)(?:veterinarian|vet|dr\.?)\s*:?\s*([^\n]+)', text)
        if vet_matches:
            info['veterinarian'] = vet_matches[0].strip()
        
        # Extract clinic name
        clinic_matches = re.findall(r'(?i)clinic\s*:?\s*([^\n]+)', text)
        if clinic_matches:
            info['clinic'] = clinic_matches[0].strip()
        
        # Extract phone number
        phone_matches = re.findall(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        if phone_matches:
            info['phone'] = phone_matches[0]
        
        return info
    
    async def extract_medical_information(self, text: str, document_type: str) -> ExtractionResult:
        """Extract structured medical information from text."""
        
        try:
            extracted_data = {
                'document_type': document_type,
                'raw_text': text,
                'extraction_timestamp': datetime.now().isoformat()
            }
            
            confidence_scores = {}
            
            # Extract different types of information based on document type
            if document_type in ['medical_record', 'vaccination', 'lab_result']:
                
                # Extract medications
                medications = self._extract_medications(text)
                if medications:
                    extracted_data['medications'] = medications
                    confidence_scores['medications'] = 0.8
                
                # Extract vaccinations
                vaccinations = self._extract_vaccinations(text)
                if vaccinations:
                    extracted_data['vaccinations'] = vaccinations
                    confidence_scores['vaccinations'] = 0.85
                
                # Extract allergies
                allergies = self._extract_allergies(text)
                if allergies:
                    extracted_data['allergies'] = allergies
                    confidence_scores['allergies'] = 0.75
                
                # Extract medical conditions
                conditions = self._extract_medical_conditions(text)
                if conditions:
                    extracted_data['medical_conditions'] = conditions
                    confidence_scores['medical_conditions'] = 0.7
                
                # Extract veterinarian info
                vet_info = self._extract_veterinarian_info(text)
                if vet_info:
                    extracted_data['veterinarian_info'] = vet_info
                    confidence_scores['veterinarian_info'] = 0.9
                
                # Extract dates
                dates = self._extract_dates(text)
                if dates:
                    extracted_data['dates'] = dates
                    confidence_scores['dates'] = 0.95
            
            # Use AI for additional extraction if available
            if hasattr(self.ai_service, 'extract_medical_data'):
                try:
                    ai_extraction = await self.ai_service.extract_medical_data(text, document_type)
                    if ai_extraction:
                        extracted_data['ai_extracted'] = ai_extraction
                        confidence_scores['ai_extraction'] = 0.85
                except Exception as e:
                    # AI extraction failed, continue with rule-based extraction
                    pass
            
            return ExtractionResult(
                success=True,
                extracted_data=extracted_data,
                confidence_scores=confidence_scores,
                raw_text=text,
                processing_method='nlp_rules'
            )
            
        except Exception as e:
            return ExtractionResult(
                success=False,
                extracted_data={},
                confidence_scores={},
                raw_text=text,
                processing_method='nlp_rules',
                error_message=str(e)
            )


class DocumentProcessingService:
    """Main service for document processing and extraction."""
    
    def __init__(self):
        self.ocr_service = OCRService()
        self.nlp_service = MedicalNLPService()
    
    async def process_document(
        self, 
        db: AsyncSession, 
        file_id: str, 
        file_content: bytes, 
        file_type: str,
        document_type: str
    ) -> ExtractionResult:
        """Process a document and extract medical information."""
        
        start_time = datetime.now()
        
        try:
            # Update processing status
            await self._update_processing_status(db, file_id, "processing")
            
            # Extract text based on file type
            if file_type.lower() == 'pdf':
                raw_text = await self.ocr_service.extract_text_from_pdf(file_content)
                processing_method = 'pdf_extraction'
            elif file_type.lower() in ['jpg', 'jpeg', 'png']:
                raw_text = await self.ocr_service.extract_text_from_image(file_content, file_type)
                processing_method = 'ocr'
            else:
                # For text-based documents, assume content is already text
                raw_text = file_content.decode('utf-8', errors='ignore')
                processing_method = 'text_extraction'
            
            # Extract medical information using NLP
            extraction_result = await self.nlp_service.extract_medical_information(
                raw_text, document_type
            )
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            
            # Update database with results
            if extraction_result.success:
                await self._save_extraction_results(
                    db, file_id, extraction_result.extracted_data, "completed"
                )
            else:
                await self._update_processing_status(db, file_id, "failed")
            
            # Log processing
            await self._log_processing(
                db, file_id, "document_extraction", 
                "completed" if extraction_result.success else "failed",
                extraction_result.extracted_data if extraction_result.success else None,
                extraction_result.error_message,
                int(processing_time)
            )
            
            return extraction_result
            
        except Exception as e:
            # Update status to failed
            await self._update_processing_status(db, file_id, "failed")
            
            # Log error
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            await self._log_processing(
                db, file_id, "document_extraction", "failed",
                None, str(e), int(processing_time)
            )
            
            return ExtractionResult(
                success=False,
                extracted_data={},
                confidence_scores={},
                raw_text="",
                processing_method="error",
                error_message=str(e)
            )
    
    async def _update_processing_status(
        self, 
        db: AsyncSession, 
        file_id: str, 
        status: str
    ):
        """Update file processing status."""
        query = update(PetFile).where(PetFile.id == file_id).values(
            processing_status=status
        )
        await db.execute(query)
        await db.commit()
    
    async def _save_extraction_results(
        self, 
        db: AsyncSession, 
        file_id: str, 
        extracted_data: Dict[str, Any],
        status: str
    ):
        """Save extraction results to database."""
        query = update(PetFile).where(PetFile.id == file_id).values(
            processing_status=status,
            extracted_data=json.dumps(extracted_data)
        )
        await db.execute(query)
        await db.commit()
    
    async def _log_processing(
        self, 
        db: AsyncSession, 
        file_id: str, 
        operation_type: str,
        status: str,
        result_data: Optional[Dict[str, Any]],
        error_message: Optional[str],
        processing_time_ms: int
    ):
        """Log processing operation."""
        processing_log = FileProcessingLog(
            file_id=file_id,
            operation_type=operation_type,
            status=status,
            result_data=json.dumps(result_data) if result_data else None,
            error_message=error_message,
            processing_time_ms=processing_time_ms
        )
        
        db.add(processing_log)
        await db.commit()
    
    async def create_new_version(
        self, 
        db: AsyncSession, 
        original_file_id: str, 
        new_file_content: bytes,
        new_filename: str,
        user_id: str
    ) -> str:
        """Create a new version of an existing file."""
        
        # Get original file
        query = select(PetFile).where(PetFile.id == original_file_id)
        result = await db.execute(query)
        original_file = result.scalar_one_or_none()
        
        if not original_file:
            raise HTTPException(status_code=404, detail="Original file not found")
        
        # Mark original as not current version
        original_file.is_current_version = False
        
        # Create new file version
        from app.services.file_service import FileStorageService
        storage_service = FileStorageService()
        
        file_path, secure_filename = await storage_service.store_file(
            file_content=new_file_content,
            original_filename=new_filename,
            pet_id=str(original_file.pet_id),
            document_type=original_file.document_type,
            encrypt=True
        )
        
        new_version = PetFile(
            pet_id=original_file.pet_id,
            filename=secure_filename,
            original_filename=new_filename,
            file_type=original_file.file_type,
            file_size=len(new_file_content),
            mime_type=original_file.mime_type,
            document_type=original_file.document_type,
            category=original_file.category,
            description=original_file.description,
            tags=original_file.tags,
            file_path=file_path,
            storage_backend="local",
            encrypted=True,
            version=original_file.version + 1,
            parent_file_id=original_file.id,
            is_current_version=True,
            processing_status="pending"
        )
        
        db.add(new_version)
        await db.commit()
        await db.refresh(new_version)
        
        return str(new_version.id)
    
    async def get_file_versions(
        self, 
        db: AsyncSession, 
        file_id: str
    ) -> List[Dict[str, Any]]:
        """Get all versions of a file."""
        
        # Get the file to find the root
        query = select(PetFile).where(PetFile.id == file_id)
        result = await db.execute(query)
        current_file = result.scalar_one_or_none()
        
        if not current_file:
            return []
        
        # Find root file (original version)
        root_file_id = current_file.parent_file_id or current_file.id
        
        # Get all versions
        query = select(PetFile).where(
            (PetFile.id == root_file_id) | (PetFile.parent_file_id == root_file_id)
        ).order_by(PetFile.version)
        
        result = await db.execute(query)
        versions = result.scalars().all()
        
        return [
            {
                'id': str(v.id),
                'version': v.version,
                'filename': v.original_filename,
                'created_at': v.created_at.isoformat(),
                'is_current': v.is_current_version,
                'processing_status': v.processing_status
            }
            for v in versions
        ]