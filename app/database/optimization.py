"""
Database query optimization utilities and helpers.
"""

from typing import Any, Dict, List, Optional
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload, contains_eager
from datetime import datetime, timedelta

from app.database.models import (
    User, Pet, Medication, MedicationLog, HealthRecord,
    Appointment, AIAssessment, FeedingLog, PetFile
)


class QueryOptimizer:
    """Utility class for optimized database queries."""
    
    @staticmethod
    async def get_user_with_pets(
        session: AsyncSession,
        user_id: str,
        include_inactive: bool = False
    ) -> Optional[User]:
        """
        Optimized query to get user with all pets using eager loading.
        
        Args:
            session: Database session
            user_id: User UUID
            include_inactive: Whether to include inactive pets
            
        Returns:
            User object with pets loaded, or None
        """
        query = select(User).where(User.id == user_id).options(
            selectinload(User.pets)
        )
        
        result = await session.execute(query)
        user = result.scalar_one_or_none()
        
        if user and not include_inactive:
            # Filter inactive pets in Python to avoid additional query
            user.pets = [pet for pet in user.pets if pet.is_active]
        
        return user
    
    @staticmethod
    async def get_pet_with_medical_data(
        session: AsyncSession,
        pet_id: str
    ) -> Optional[Pet]:
        """
        Optimized query to get pet with all medical data using eager loading.
        
        Args:
            session: Database session
            pet_id: Pet UUID
            
        Returns:
            Pet object with medical data loaded, or None
        """
        query = select(Pet).where(Pet.id == pet_id).options(
            selectinload(Pet.medications),
            selectinload(Pet.health_records),
            selectinload(Pet.appointments)
        )
        
        result = await session.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_active_medications_with_logs(
        session: AsyncSession,
        pet_id: str,
        days: int = 30
    ) -> List[Medication]:
        """
        Optimized query to get active medications with recent logs.
        
        Args:
            session: Database session
            pet_id: Pet UUID
            days: Number of days of logs to include
            
        Returns:
            List of Medication objects with logs loaded
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        query = (
            select(Medication)
            .where(
                and_(
                    Medication.pet_id == pet_id,
                    Medication.active == True
                )
            )
            .options(
                selectinload(Medication.medication_logs).where(
                    MedicationLog.administered_at >= cutoff_date
                )
            )
        )
        
        result = await session.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_upcoming_appointments(
        session: AsyncSession,
        user_id: str,
        days_ahead: int = 30
    ) -> List[Appointment]:
        """
        Optimized query to get upcoming appointments for all user's pets.
        
        Args:
            session: Database session
            user_id: User UUID
            days_ahead: Number of days to look ahead
            
        Returns:
            List of Appointment objects with pet data loaded
        """
        end_date = datetime.utcnow() + timedelta(days=days_ahead)
        
        query = (
            select(Appointment)
            .join(Pet)
            .where(
                and_(
                    Pet.user_id == user_id,
                    Appointment.appointment_date >= datetime.utcnow(),
                    Appointment.appointment_date <= end_date,
                    Appointment.status == "scheduled"
                )
            )
            .options(
                contains_eager(Appointment.pet)
            )
            .order_by(Appointment.appointment_date)
        )
        
        result = await session.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_medications_needing_refill(
        session: AsyncSession,
        user_id: str
    ) -> List[Medication]:
        """
        Optimized query to get medications that need refilling.
        
        Args:
            session: Database session
            user_id: User UUID
            
        Returns:
            List of Medication objects that need refilling
        """
        query = (
            select(Medication)
            .join(Pet)
            .where(
                and_(
                    Pet.user_id == user_id,
                    Medication.active == True,
                    Medication.current_quantity <= Medication.refill_threshold
                )
            )
            .options(
                contains_eager(Medication.pet)
            )
        )
        
        result = await session.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_health_records_by_date_range(
        session: AsyncSession,
        pet_id: str,
        start_date: datetime,
        end_date: datetime,
        record_types: Optional[List[str]] = None
    ) -> List[HealthRecord]:
        """
        Optimized query to get health records within a date range.
        
        Args:
            session: Database session
            pet_id: Pet UUID
            start_date: Start of date range
            end_date: End of date range
            record_types: Optional list of record types to filter
            
        Returns:
            List of HealthRecord objects
        """
        conditions = [
            HealthRecord.pet_id == pet_id,
            HealthRecord.record_date >= start_date.date(),
            HealthRecord.record_date <= end_date.date()
        ]
        
        if record_types:
            conditions.append(HealthRecord.record_type.in_(record_types))
        
        query = (
            select(HealthRecord)
            .where(and_(*conditions))
            .options(
                selectinload(HealthRecord.symptom_logs),
                selectinload(HealthRecord.vaccinations),
                selectinload(HealthRecord.ai_assessments)
            )
            .order_by(HealthRecord.record_date.desc())
        )
        
        result = await session.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_pet_statistics(
        session: AsyncSession,
        pet_id: str
    ) -> Dict[str, Any]:
        """
        Optimized aggregation query to get pet statistics.
        
        Args:
            session: Database session
            pet_id: Pet UUID
            
        Returns:
            Dictionary with pet statistics
        """
        # Count active medications
        med_count_query = select(func.count(Medication.id)).where(
            and_(
                Medication.pet_id == pet_id,
                Medication.active == True
            )
        )
        med_count = await session.scalar(med_count_query)
        
        # Count health records
        health_count_query = select(func.count(HealthRecord.id)).where(
            HealthRecord.pet_id == pet_id
        )
        health_count = await session.scalar(health_count_query)
        
        # Count upcoming appointments
        appt_count_query = select(func.count(Appointment.id)).where(
            and_(
                Appointment.pet_id == pet_id,
                Appointment.appointment_date >= datetime.utcnow(),
                Appointment.status == "scheduled"
            )
        )
        appt_count = await session.scalar(appt_count_query)
        
        # Get last AI assessment
        last_assessment_query = (
            select(AIAssessment)
            .where(AIAssessment.pet_id == pet_id)
            .order_by(AIAssessment.created_at.desc())
            .limit(1)
        )
        result = await session.execute(last_assessment_query)
        last_assessment = result.scalar_one_or_none()
        
        return {
            "active_medications": med_count or 0,
            "health_records": health_count or 0,
            "upcoming_appointments": appt_count or 0,
            "last_assessment_date": last_assessment.created_at if last_assessment else None,
            "last_triage_level": last_assessment.triage_level if last_assessment else None
        }
    
    @staticmethod
    async def get_appointments_needing_reminders(
        session: AsyncSession,
        hours_ahead: int = 24
    ) -> List[Appointment]:
        """
        Optimized query to get appointments that need reminders sent.
        
        Args:
            session: Database session
            hours_ahead: Hours ahead to check (24 or 2)
            
        Returns:
            List of Appointment objects needing reminders
        """
        now = datetime.utcnow()
        target_time = now + timedelta(hours=hours_ahead)
        
        # Determine which reminder field to check
        if hours_ahead == 24:
            reminder_field = Appointment.reminder_sent_24h
        elif hours_ahead == 2:
            reminder_field = Appointment.reminder_sent_2h
        else:
            raise ValueError("hours_ahead must be 24 or 2")
        
        query = (
            select(Appointment)
            .join(Pet)
            .join(User)
            .where(
                and_(
                    Appointment.status == "scheduled",
                    Appointment.appointment_date >= now,
                    Appointment.appointment_date <= target_time,
                    reminder_field == False
                )
            )
            .options(
                contains_eager(Appointment.pet).contains_eager(Pet.owner)
            )
        )
        
        result = await session.execute(query)
        return result.scalars().all()


class BulkOperations:
    """Utility class for bulk database operations."""
    
    @staticmethod
    async def bulk_create_medication_logs(
        session: AsyncSession,
        logs: List[Dict[str, Any]]
    ) -> int:
        """
        Bulk create medication logs efficiently.
        
        Args:
            session: Database session
            logs: List of log dictionaries
            
        Returns:
            Number of logs created
        """
        if not logs:
            return 0
        
        log_objects = [MedicationLog(**log_data) for log_data in logs]
        session.add_all(log_objects)
        await session.flush()
        
        return len(log_objects)
    
    @staticmethod
    async def bulk_create_feeding_logs(
        session: AsyncSession,
        logs: List[Dict[str, Any]]
    ) -> int:
        """
        Bulk create feeding logs efficiently.
        
        Args:
            session: Database session
            logs: List of log dictionaries
            
        Returns:
            Number of logs created
        """
        if not logs:
            return 0
        
        log_objects = [FeedingLog(**log_data) for log_data in logs]
        session.add_all(log_objects)
        await session.flush()
        
        return len(log_objects)
    
    @staticmethod
    async def bulk_update_reminder_status(
        session: AsyncSession,
        appointment_ids: List[str],
        reminder_type: str
    ) -> int:
        """
        Bulk update appointment reminder status.
        
        Args:
            session: Database session
            appointment_ids: List of appointment UUIDs
            reminder_type: "24h" or "2h"
            
        Returns:
            Number of appointments updated
        """
        if not appointment_ids:
            return 0
        
        from sqlalchemy import update
        
        if reminder_type == "24h":
            stmt = (
                update(Appointment)
                .where(Appointment.id.in_(appointment_ids))
                .values(reminder_sent_24h=True)
            )
        elif reminder_type == "2h":
            stmt = (
                update(Appointment)
                .where(Appointment.id.in_(appointment_ids))
                .values(reminder_sent_2h=True)
            )
        else:
            raise ValueError("reminder_type must be '24h' or '2h'")
        
        result = await session.execute(stmt)
        await session.flush()
        
        return result.rowcount
