"""
Compliance service for data protection, export, and secure deletion.
Implements GDPR-compliant data management features.
"""

import json
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from fastapi import HTTPException, status
import logging

from app.database.models import (
    User, Pet, Medication, HealthRecord, Appointment,
    FeedingLog, PetFile, AIAssessment, NotificationPreference
)


logger = logging.getLogger(__name__)


class ComplianceService:
    """Service for data protection and compliance operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def export_user_data(self, user_id: str) -> Dict[str, Any]:
        """
        Export all user data in a structured format.
        
        Implements GDPR right to data portability.
        
        Args:
            user_id: User ID to export data for
            
        Returns:
            Dictionary containing all user data
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        # Get user profile
        result = await self.db.execute(select(User).where(User.id == user_uuid))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Build export data structure
        export_data = {
            "export_date": datetime.utcnow().isoformat(),
            "user_id": str(user.id),
            "user_profile": {
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone_number": user.phone_number,
                "emergency_contact": user.emergency_contact,
                "preferred_vet_clinic": user.preferred_vet_clinic,
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat()
            },
            "pets": [],
            "notification_preferences": {}
        }
        
        # Get notification preferences
        prefs_result = await self.db.execute(
            select(NotificationPreference).where(NotificationPreference.user_id == user_uuid)
        )
        prefs = prefs_result.scalar_one_or_none()
        
        if prefs:
            export_data["notification_preferences"] = {
                "medication_reminders": prefs.medication_reminders,
                "feeding_reminders": prefs.feeding_reminders,
                "appointment_reminders": prefs.appointment_reminders,
                "emergency_alerts": prefs.emergency_alerts,
                "weekly_reports": prefs.weekly_reports,
                "email_notifications": prefs.email_notifications,
                "sms_notifications": prefs.sms_notifications,
                "push_notifications": prefs.push_notifications,
                "reminder_advance_minutes": prefs.reminder_advance_minutes
            }
        
        # Get all pets
        pets_result = await self.db.execute(
            select(Pet).where(Pet.user_id == user_uuid)
        )
        pets = pets_result.scalars().all()
        
        for pet in pets:
            pet_data = {
                "pet_id": str(pet.id),
                "name": pet.name,
                "species": pet.species,
                "breed": pet.breed,
                "birth_date": pet.birth_date.isoformat() if pet.birth_date else None,
                "weight": pet.weight,
                "gender": pet.gender,
                "medical_conditions": pet.medical_conditions,
                "allergies": pet.allergies,
                "behavioral_notes": pet.behavioral_notes,
                "created_at": pet.created_at.isoformat(),
                "medications": [],
                "health_records": [],
                "appointments": [],
                "feeding_logs": [],
                "files": [],
                "ai_assessments": []
            }
            
            # Get medications
            meds_result = await self.db.execute(
                select(Medication).where(Medication.pet_id == pet.id)
            )
            medications = meds_result.scalars().all()
            
            for med in medications:
                pet_data["medications"].append({
                    "medication_name": med.medication_name,
                    "dosage": med.dosage,
                    "frequency": med.frequency,
                    "start_date": med.start_date.isoformat() if med.start_date else None,
                    "end_date": med.end_date.isoformat() if med.end_date else None,
                    "active": med.active
                })
            
            # Get health records
            health_result = await self.db.execute(
                select(HealthRecord).where(HealthRecord.pet_id == pet.id)
            )
            health_records = health_result.scalars().all()
            
            for record in health_records:
                pet_data["health_records"].append({
                    "record_date": record.record_date.isoformat() if record.record_date else None,
                    "record_type": record.record_type,
                    "description": record.description,
                    "veterinarian": record.veterinarian,
                    "clinic_name": record.clinic_name,
                    "diagnosis": record.diagnosis,
                    "treatment_plan": record.treatment_plan
                })
            
            # Get appointments
            appt_result = await self.db.execute(
                select(Appointment).where(Appointment.pet_id == pet.id)
            )
            appointments = appt_result.scalars().all()
            
            for appt in appointments:
                pet_data["appointments"].append({
                    "appointment_date": appt.appointment_date.isoformat() if appt.appointment_date else None,
                    "appointment_type": appt.appointment_type,
                    "purpose": appt.purpose,
                    "clinic_name": appt.clinic_name,
                    "clinic_address": appt.clinic_address,
                    "veterinarian": appt.veterinarian,
                    "status": appt.status
                })
            
            # Get feeding logs
            feeding_result = await self.db.execute(
                select(FeedingLog).where(FeedingLog.pet_id == pet.id)
            )
            feeding_logs = feeding_result.scalars().all()
            
            for log in feeding_logs:
                pet_data["feeding_logs"].append({
                    "feeding_time": log.feeding_time.isoformat() if log.feeding_time else None,
                    "food_type": log.food_type,
                    "amount": log.amount,
                    "completed": log.completed
                })
            
            # Get AI assessments
            ai_result = await self.db.execute(
                select(AIAssessment).where(AIAssessment.pet_id == pet.id)
            )
            ai_assessments = ai_result.scalars().all()
            
            for assessment in ai_assessments:
                pet_data["ai_assessments"].append({
                    "symptoms_reported": assessment.symptoms_reported,
                    "triage_level": assessment.triage_level,
                    "ai_analysis": assessment.ai_analysis,
                    "recommendations": assessment.recommendations,
                    "model_used": assessment.model_used,
                    "confidence_score": assessment.confidence_score,
                    "created_at": assessment.created_at.isoformat()
                })
            
            # Get files metadata (not actual file content for security)
            files_result = await self.db.execute(
                select(PetFile).where(PetFile.pet_id == pet.id)
            )
            files = files_result.scalars().all()
            
            for file in files:
                pet_data["files"].append({
                    "filename": file.original_filename,
                    "file_type": file.file_type,
                    "document_type": file.document_type,
                    "file_size": file.file_size,
                    "uploaded_at": file.created_at.isoformat()
                })
            
            export_data["pets"].append(pet_data)
        
        logger.info(f"Data export completed for user {user_id}")
        return export_data
    
    async def delete_user_data(self, user_id: str, permanent: bool = False) -> Dict[str, str]:
        """
        Delete user data securely.
        
        Implements GDPR right to erasure (right to be forgotten).
        
        Args:
            user_id: User ID to delete data for
            permanent: If True, permanently delete. If False, soft delete (deactivate)
            
        Returns:
            Status message
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        # Get user
        result = await self.db.execute(select(User).where(User.id == user_uuid))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if permanent:
            # Permanent deletion - cascade will handle related records
            await self.db.delete(user)
            await self.db.commit()
            
            logger.warning(f"Permanent deletion completed for user {user_id}")
            return {
                "status": "deleted",
                "message": "User data permanently deleted",
                "user_id": user_id
            }
        else:
            # Soft delete - deactivate account
            user.is_active = False
            user.email = f"deleted_{user_id}@deleted.local"  # Anonymize email
            await self.db.commit()
            
            logger.info(f"Soft deletion (deactivation) completed for user {user_id}")
            return {
                "status": "deactivated",
                "message": "User account deactivated",
                "user_id": user_id
            }
    
    async def anonymize_user_data(self, user_id: str) -> Dict[str, str]:
        """
        Anonymize user data while preserving statistical information.
        
        Args:
            user_id: User ID to anonymize data for
            
        Returns:
            Status message
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        # Get user
        result = await self.db.execute(select(User).where(User.id == user_uuid))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Anonymize personal information
        user.email = f"anonymous_{user_id}@anonymized.local"
        user.first_name = "Anonymous"
        user.last_name = "User"
        user.phone_number = None
        user.emergency_contact = None
        user.is_active = False
        
        await self.db.commit()
        
        logger.info(f"Data anonymization completed for user {user_id}")
        return {
            "status": "anonymized",
            "message": "User data anonymized",
            "user_id": user_id
        }
