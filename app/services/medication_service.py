"""
Medication tracking and management service for PawPal Voice Pet Care Assistant.
"""

from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, desc, func, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from datetime import datetime, date, timedelta, timezone
import uuid
import re

from app.database.models import Pet, User, Medication, MedicationLog, FeedingLog, FeedingSchedule
from app.schemas.medications import (
    MedicationCreate, MedicationUpdate, MedicationResponse, MedicationWithLogsResponse,
    MedicationListResponse, MedicationStatusResponse, MedicationLogCreate, MedicationLogUpdate,
    MedicationLogResponse, FeedingScheduleCreate, FeedingScheduleUpdate, FeedingScheduleResponse,
    FeedingLogCreate, FeedingLogUpdate, FeedingLogResponse, FeedingHistoryResponse,
    CareTrackingDashboardResponse
)


class MedicationService:
    """Service class for medication tracking and management operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # Medication Management Methods
    
    async def create_medication(self, user_id: str, pet_id: str, medication_data: MedicationCreate) -> MedicationResponse:
        """
        Create a new medication prescription for a pet.
        
        Requirements validated:
        - 5.1: Medication prescription storage with dosage and frequency
        """
        try:
            # Verify pet belongs to user
            pet = await self._verify_pet_ownership(user_id, pet_id)
            
            # Create new medication
            new_medication = Medication(
                pet_id=uuid.UUID(pet_id),
                medication_name=medication_data.medication_name,
                dosage=medication_data.dosage,
                frequency=medication_data.frequency,
                start_date=medication_data.start_date,
                end_date=medication_data.end_date,
                refill_threshold=medication_data.refill_threshold,
                current_quantity=medication_data.current_quantity,
                administration_instructions=medication_data.administration_instructions,
                active=True
            )
            
            self.db.add(new_medication)
            await self.db.commit()
            await self.db.refresh(new_medication)
            
            return await self._medication_to_response(new_medication)
            
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create medication: {str(e)}"
            )
    
    async def get_pet_medications(self, user_id: str, pet_id: str, include_inactive: bool = False) -> MedicationListResponse:
        """
        Get all medications for a pet with status information.
        
        Requirements validated:
        - 5.1: Medication prescription storage retrieval
        - 5.4: Refill threshold monitoring
        """
        try:
            # Verify pet belongs to user
            pet = await self._verify_pet_ownership(user_id, pet_id)
            
            # Build query for medications
            query = select(Medication).where(Medication.pet_id == uuid.UUID(pet_id))
            
            if not include_inactive:
                query = query.where(Medication.active == True)
            
            query = query.options(selectinload(Medication.medication_logs)).order_by(desc(Medication.created_at))
            
            result = await self.db.execute(query)
            medications = result.scalars().all()
            
            # Convert to response format with additional status info
            medication_responses = []
            medications_needing_refill = 0
            overdue_medications = 0
            
            for med in medications:
                med_response = await self._medication_to_response_with_logs(med)
                medication_responses.append(med_response)
                
                if med_response.needs_refill:
                    medications_needing_refill += 1
                if med_response.overdue:
                    overdue_medications += 1
            
            active_count = sum(1 for med in medications if med.active)
            
            return MedicationListResponse(
                medications=medication_responses,
                total_count=len(medications),
                active_count=active_count,
                medications_needing_refill=medications_needing_refill,
                overdue_medications=overdue_medications
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve medications: {str(e)}"
            )
    
    async def update_medication(self, user_id: str, pet_id: str, medication_id: str, medication_data: MedicationUpdate) -> MedicationResponse:
        """
        Update an existing medication prescription.
        
        Requirements validated:
        - 5.1: Medication prescription updates
        """
        try:
            # Verify pet belongs to user
            await self._verify_pet_ownership(user_id, pet_id)
            
            # Get medication
            result = await self.db.execute(
                select(Medication).where(
                    and_(
                        Medication.id == uuid.UUID(medication_id),
                        Medication.pet_id == uuid.UUID(pet_id)
                    )
                )
            )
            medication = result.scalar_one_or_none()
            
            if not medication:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Medication not found"
                )
            
            # Update only provided fields
            update_data = medication_data.model_dump(exclude_unset=True)
            
            for field, value in update_data.items():
                if hasattr(medication, field):
                    setattr(medication, field, value)
            
            medication.updated_at = datetime.now(timezone.utc)
            
            await self.db.commit()
            await self.db.refresh(medication)
            
            return await self._medication_to_response(medication)
            
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update medication: {str(e)}"
            )
    
    async def delete_medication(self, user_id: str, pet_id: str, medication_id: str) -> bool:
        """
        Delete (deactivate) a medication prescription.
        
        Requirements validated:
        - 5.1: Medication prescription management
        """
        try:
            # Verify pet belongs to user
            await self._verify_pet_ownership(user_id, pet_id)
            
            # Get medication
            result = await self.db.execute(
                select(Medication).where(
                    and_(
                        Medication.id == uuid.UUID(medication_id),
                        Medication.pet_id == uuid.UUID(pet_id)
                    )
                )
            )
            medication = result.scalar_one_or_none()
            
            if not medication:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Medication not found"
                )
            
            # Soft delete - mark as inactive
            medication.active = False
            medication.updated_at = datetime.now(timezone.utc)
            
            await self.db.commit()
            return True
            
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete medication: {str(e)}"
            )
    
    # Medication Logging Methods
    
    async def log_medication_administration(
        self, 
        user_id: str, 
        pet_id: str, 
        medication_id: str, 
        log_data: MedicationLogCreate
    ) -> MedicationLogResponse:
        """
        Log medication administration and update quantity.
        
        Requirements validated:
        - 5.6: Medication administration logging
        """
        try:
            # Verify pet belongs to user
            await self._verify_pet_ownership(user_id, pet_id)
            
            # Get medication
            result = await self.db.execute(
                select(Medication).where(
                    and_(
                        Medication.id == uuid.UUID(medication_id),
                        Medication.pet_id == uuid.UUID(pet_id),
                        Medication.active == True
                    )
                )
            )
            medication = result.scalar_one_or_none()
            
            if not medication:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Active medication not found"
                )
            
            # Create medication log entry
            administered_at = log_data.administered_at or datetime.now(timezone.utc)
            
            new_log = MedicationLog(
                medication_id=uuid.UUID(medication_id),
                administered_at=administered_at,
                dosage_given=log_data.dosage_given,
                administered_by=log_data.administered_by,
                completed=log_data.completed,
                notes=log_data.notes
            )
            
            self.db.add(new_log)
            
            # Update medication quantity if dose was completed
            if log_data.completed and medication.current_quantity > 0:
                medication.current_quantity -= 1
                medication.updated_at = datetime.now(timezone.utc)
            
            await self.db.commit()
            await self.db.refresh(new_log)
            
            return self._medication_log_to_response(new_log)
            
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to log medication administration: {str(e)}"
            )
    
    async def get_medication_logs(
        self, 
        user_id: str, 
        pet_id: str, 
        medication_id: str,
        days_back: int = 30
    ) -> List[MedicationLogResponse]:
        """
        Get medication administration logs for a specific medication.
        
        Requirements validated:
        - 5.6: Medication administration logging retrieval
        """
        try:
            # Verify pet belongs to user
            await self._verify_pet_ownership(user_id, pet_id)
            
            # Verify medication belongs to pet
            med_result = await self.db.execute(
                select(Medication).where(
                    and_(
                        Medication.id == uuid.UUID(medication_id),
                        Medication.pet_id == uuid.UUID(pet_id)
                    )
                )
            )
            medication = med_result.scalar_one_or_none()
            
            if not medication:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Medication not found"
                )
            
            # Get logs from specified time period
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_back)
            
            result = await self.db.execute(
                select(MedicationLog)
                .where(
                    and_(
                        MedicationLog.medication_id == uuid.UUID(medication_id),
                        MedicationLog.administered_at >= cutoff_date
                    )
                )
                .order_by(desc(MedicationLog.administered_at))
            )
            logs = result.scalars().all()
            
            return [self._medication_log_to_response(log) for log in logs]
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve medication logs: {str(e)}"
            )
    
    async def get_medication_status(self, user_id: str, pet_id: str) -> MedicationStatusResponse:
        """
        Get comprehensive medication status for a pet.
        
        Requirements validated:
        - 5.1: Medication prescription storage retrieval
        - 5.4: Refill threshold monitoring and alert generation
        """
        try:
            # Verify pet belongs to user
            pet = await self._verify_pet_ownership(user_id, pet_id)
            
            # Get medications with logs
            medications_response = await self.get_pet_medications(user_id, pet_id)
            
            # Analyze upcoming doses and refill alerts
            upcoming_doses = []
            refill_alerts = []
            
            for med in medications_response.medications:
                # Check for refill needs
                if med.needs_refill:
                    refill_alerts.append({
                        "medication_id": med.id,
                        "medication_name": med.medication_name,
                        "current_quantity": med.current_quantity,
                        "threshold": med.refill_threshold,
                        "urgency": "high" if med.current_quantity == 0 else "medium"
                    })
                
                # Check for upcoming/overdue doses
                if med.next_dose_due:
                    upcoming_doses.append({
                        "medication_id": med.id,
                        "medication_name": med.medication_name,
                        "dosage": med.dosage,
                        "next_dose": med.next_dose_due,
                        "overdue": med.overdue,
                        "urgency": "high" if med.overdue else "normal"
                    })
            
            # Create summary statistics
            summary = {
                "total_medications": medications_response.total_count,
                "active_medications": medications_response.active_count,
                "medications_needing_refill": medications_response.medications_needing_refill,
                "overdue_medications": medications_response.overdue_medications,
                "upcoming_doses_24h": len([d for d in upcoming_doses if not d["overdue"]]),
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
            
            return MedicationStatusResponse(
                pet_id=pet_id,
                pet_name=pet.name,
                medications=medications_response.medications,
                upcoming_doses=upcoming_doses,
                refill_alerts=refill_alerts,
                summary=summary
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get medication status: {str(e)}"
            )
    
    # Feeding Schedule Management Methods
    
    async def create_feeding_schedule(self, user_id: str, pet_id: str, schedule_data: FeedingScheduleCreate) -> FeedingScheduleResponse:
        """
        Create a recurring feeding schedule for a pet.
        
        Requirements validated:
        - 5.5: Recurring feeding schedule creation and tracking
        """
        try:
            # Verify pet belongs to user
            await self._verify_pet_ownership(user_id, pet_id)
            
            # Create new feeding schedule
            new_schedule = FeedingSchedule(
                pet_id=uuid.UUID(pet_id),
                food_type=schedule_data.food_type,
                amount=schedule_data.amount,
                feeding_time=schedule_data.feeding_time,
                recurring=schedule_data.recurring,
                frequency=schedule_data.frequency,
                notes=schedule_data.notes,
                active=True
            )
            
            self.db.add(new_schedule)
            await self.db.commit()
            await self.db.refresh(new_schedule)
            
            return self._feeding_schedule_to_response(new_schedule)
            
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create feeding schedule: {str(e)}"
            )
    
    async def get_pet_feeding_schedules(self, user_id: str, pet_id: str) -> List[FeedingScheduleResponse]:
        """
        Get all feeding schedules for a pet.
        
        Requirements validated:
        - 5.5: Feeding schedule retrieval
        """
        try:
            # Verify pet belongs to user
            await self._verify_pet_ownership(user_id, pet_id)
            
            result = await self.db.execute(
                select(FeedingSchedule)
                .where(
                    and_(
                        FeedingSchedule.pet_id == uuid.UUID(pet_id),
                        FeedingSchedule.active == True
                    )
                )
                .order_by(FeedingSchedule.feeding_time)
            )
            schedules = result.scalars().all()
            
            return [self._feeding_schedule_to_response(schedule) for schedule in schedules]
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve feeding schedules: {str(e)}"
            )
    
    async def log_feeding(self, user_id: str, pet_id: str, feeding_data: FeedingLogCreate) -> FeedingLogResponse:
        """
        Log a feeding event for a pet.
        
        Requirements validated:
        - 5.5: Feeding log entries with completion status
        - 5.6: Historical feeding pattern tracking
        """
        try:
            # Verify pet belongs to user
            await self._verify_pet_ownership(user_id, pet_id)
            
            # Create feeding log entry
            feeding_time = feeding_data.feeding_time or datetime.now(timezone.utc)
            
            new_log = FeedingLog(
                pet_id=uuid.UUID(pet_id),
                feeding_time=feeding_time,
                food_type=feeding_data.food_type,
                amount=feeding_data.amount,
                completed=feeding_data.completed,
                notes=feeding_data.notes
            )
            
            self.db.add(new_log)
            await self.db.commit()
            await self.db.refresh(new_log)
            
            return self._feeding_log_to_response(new_log)
            
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to log feeding: {str(e)}"
            )
    
    async def get_feeding_history(self, user_id: str, pet_id: str, days_back: int = 30) -> FeedingHistoryResponse:
        """
        Get feeding history with pattern analysis.
        
        Requirements validated:
        - 5.5: Historical feeding pattern analysis
        - 5.6: Feeding log retrieval
        """
        try:
            # Verify pet belongs to user
            pet = await self._verify_pet_ownership(user_id, pet_id)
            
            # Get feeding logs from specified time period
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_back)
            
            result = await self.db.execute(
                select(FeedingLog)
                .where(
                    and_(
                        FeedingLog.pet_id == uuid.UUID(pet_id),
                        FeedingLog.feeding_time >= cutoff_date
                    )
                )
                .order_by(desc(FeedingLog.feeding_time))
            )
            feeding_logs = result.scalars().all()
            
            # Analyze feeding patterns
            feeding_patterns = self._analyze_feeding_patterns(feeding_logs, days_back)
            
            # Calculate statistics
            total_feedings = len(feeding_logs)
            average_daily_feedings = total_feedings / days_back if days_back > 0 else 0
            
            # Find most common food type
            food_type_counts = {}
            for log in feeding_logs:
                food_type_counts[log.food_type] = food_type_counts.get(log.food_type, 0) + 1
            
            most_common_food_type = max(food_type_counts.keys(), key=food_type_counts.get) if food_type_counts else None
            
            # Calculate feeding consistency score (0-1)
            feeding_consistency_score = self._calculate_feeding_consistency(feeding_logs, days_back)
            
            return FeedingHistoryResponse(
                pet_id=pet_id,
                pet_name=pet.name,
                feeding_logs=[self._feeding_log_to_response(log) for log in feeding_logs],
                feeding_patterns=feeding_patterns,
                total_feedings=total_feedings,
                average_daily_feedings=round(average_daily_feedings, 2),
                most_common_food_type=most_common_food_type,
                feeding_consistency_score=round(feeding_consistency_score, 2)
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get feeding history: {str(e)}"
            )
    
    # Helper Methods
    
    async def _verify_pet_ownership(self, user_id: str, pet_id: str) -> Pet:
        """Verify that the pet belongs to the user."""
        result = await self.db.execute(
            select(Pet).where(
                and_(
                    Pet.id == uuid.UUID(pet_id),
                    Pet.user_id == uuid.UUID(user_id),
                    Pet.is_active == True
                )
            )
        )
        pet = result.scalar_one_or_none()
        
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found or access denied"
            )
        
        return pet
    
    async def _medication_to_response(self, medication: Medication) -> MedicationResponse:
        """Convert Medication model to MedicationResponse schema."""
        needs_refill = medication.current_quantity <= medication.refill_threshold
        
        return MedicationResponse(
            id=str(medication.id),
            pet_id=str(medication.pet_id),
            medication_name=medication.medication_name,
            dosage=medication.dosage,
            frequency=medication.frequency,
            start_date=medication.start_date,
            end_date=medication.end_date,
            refill_threshold=medication.refill_threshold,
            current_quantity=medication.current_quantity,
            administration_instructions=medication.administration_instructions,
            active=medication.active,
            needs_refill=needs_refill,
            created_at=medication.created_at,
            updated_at=medication.updated_at
        )
    
    async def _medication_to_response_with_logs(self, medication: Medication) -> MedicationWithLogsResponse:
        """Convert Medication model to MedicationWithLogsResponse with log analysis."""
        base_response = await self._medication_to_response(medication)
        
        # Get recent logs (last 10)
        recent_logs = sorted(medication.medication_logs, key=lambda x: x.administered_at, reverse=True)[:10]
        recent_log_responses = [self._medication_log_to_response(log) for log in recent_logs]
        
        # Calculate last administered and next dose
        last_administered = None
        next_dose_due = None
        overdue = False
        
        if recent_logs:
            last_administered = recent_logs[0].administered_at
            # Simple calculation - assume daily frequency for now
            next_dose_due = last_administered + timedelta(days=1)
            overdue = next_dose_due < datetime.now(timezone.utc)
        
        return MedicationWithLogsResponse(
            **base_response.model_dump(),
            recent_logs=recent_log_responses,
            last_administered=last_administered,
            next_dose_due=next_dose_due,
            overdue=overdue
        )
    
    def _medication_log_to_response(self, log: MedicationLog) -> MedicationLogResponse:
        """Convert MedicationLog model to MedicationLogResponse schema."""
        return MedicationLogResponse(
            id=str(log.id),
            medication_id=str(log.medication_id),
            administered_at=log.administered_at,
            dosage_given=log.dosage_given,
            administered_by=log.administered_by,
            completed=log.completed,
            notes=log.notes,
            created_at=log.created_at,
            updated_at=log.updated_at
        )
    
    def _feeding_schedule_to_response(self, schedule: FeedingSchedule) -> FeedingScheduleResponse:
        """Convert FeedingSchedule model to FeedingScheduleResponse schema."""
        return FeedingScheduleResponse(
            id=str(schedule.id),
            pet_id=str(schedule.pet_id),
            food_type=schedule.food_type,
            amount=schedule.amount,
            feeding_time=schedule.feeding_time,
            recurring=schedule.recurring,
            frequency=schedule.frequency,
            notes=schedule.notes,
            active=schedule.active,
            created_at=schedule.created_at,
            updated_at=schedule.updated_at
        )
    
    def _feeding_log_to_response(self, log: FeedingLog) -> FeedingLogResponse:
        """Convert FeedingLog model to FeedingLogResponse schema."""
        return FeedingLogResponse(
            id=str(log.id),
            pet_id=str(log.pet_id),
            feeding_time=log.feeding_time,
            food_type=log.food_type,
            amount=log.amount,
            completed=log.completed,
            notes=log.notes,
            created_at=log.created_at,
            updated_at=log.updated_at
        )
    
    def _analyze_feeding_patterns(self, feeding_logs: List[FeedingLog], days_back: int) -> Dict[str, Any]:
        """Analyze feeding patterns from logs."""
        if not feeding_logs:
            return {"pattern_analysis": "No feeding data available"}
        
        # Group feedings by day
        daily_feedings = {}
        for log in feeding_logs:
            day_key = log.feeding_time.date()
            if day_key not in daily_feedings:
                daily_feedings[day_key] = []
            daily_feedings[day_key].append(log)
        
        # Calculate pattern metrics
        feeding_times = [log.feeding_time.hour for log in feeding_logs]
        most_common_hour = max(set(feeding_times), key=feeding_times.count) if feeding_times else None
        
        return {
            "days_with_feedings": len(daily_feedings),
            "total_days_analyzed": days_back,
            "feeding_frequency_percentage": round((len(daily_feedings) / days_back) * 100, 1),
            "most_common_feeding_hour": most_common_hour,
            "average_feedings_per_day": round(len(feeding_logs) / days_back, 2)
        }
    
    def _calculate_feeding_consistency(self, feeding_logs: List[FeedingLog], days_back: int) -> float:
        """Calculate feeding consistency score (0-1)."""
        if not feeding_logs or days_back == 0:
            return 0.0
        
        # Simple consistency metric based on regular feeding
        days_with_feedings = len(set(log.feeding_time.date() for log in feeding_logs))
        consistency_score = days_with_feedings / days_back
        
        return min(consistency_score, 1.0)


# Helper function to create service instance
def create_medication_service(db: AsyncSession) -> MedicationService:
    """Create MedicationService instance."""
    return MedicationService(db)