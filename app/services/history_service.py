"""
Service for managing pet health history, appointments, and medication tracking.
"""
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from app.database.models import Appointment, Medication, HealthRecord, Pet


class HistoryService:
    """Service for retrieving and managing pet health history."""
    
    @staticmethod
    def get_appointment_history(
        db: Session,
        pet_id: int,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[Appointment]:
        """
        Get appointment history for a pet.
        
        Args:
            db: Database session
            pet_id: Pet ID
            status: Filter by status (completed, cancelled, scheduled)
            limit: Maximum number of appointments to return
            
        Returns:
            List of appointments sorted by date (newest first)
        """
        query = db.query(Appointment).filter(Appointment.pet_id == pet_id)
        
        if status:
            query = query.filter(Appointment.status == status)
        
        return query.order_by(desc(Appointment.appointment_date)).limit(limit).all()
    
    @staticmethod
    def get_medication_history(
        db: Session,
        pet_id: int,
        active_only: bool = False
    ) -> List[Medication]:
        """
        Get medication history for a pet.
        
        Args:
            db: Database session
            pet_id: Pet ID
            active_only: If True, only return active medications
            
        Returns:
            List of medications
        """
        query = db.query(Medication).filter(Medication.pet_id == pet_id)
        
        if active_only:
            today = datetime.now().date()
            query = query.filter(
                and_(
                    Medication.start_date <= today,
                    (Medication.end_date.is_(None)) | (Medication.end_date >= today)
                )
            )
        
        return query.order_by(desc(Medication.start_date)).all()
    
    @staticmethod
    def get_health_logs(
        db: Session,
        pet_id: int,
        log_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        search_query: Optional[str] = None,
        limit: int = 100
    ) -> List[HealthRecord]:
        """
        Get health logs for a pet with filtering options.
        
        Args:
            db: Database session
            pet_id: Pet ID
            log_type: Filter by type (checkup, emergency, surgery, etc.)
            start_date: Filter logs after this date
            end_date: Filter logs before this date
            search_query: Search in notes
            limit: Maximum number of logs to return
            
        Returns:
            List of health logs sorted by date (newest first)
        """
        query = db.query(HealthRecord).filter(HealthRecord.pet_id == pet_id)
        
        if log_type:
            query = query.filter(HealthRecord.log_type == log_type)
        
        if start_date:
            query = query.filter(HealthRecord.log_date >= start_date)
        
        if end_date:
            query = query.filter(HealthRecord.log_date <= end_date)
        
        if search_query:
            query = query.filter(HealthRecord.notes.ilike(f"%{search_query}%"))
        
        return query.order_by(desc(HealthRecord.log_date)).limit(limit).all()
    
    @staticmethod
    def get_upcoming_appointments(
        db: Session,
        pet_id: int,
        days_ahead: int = 30
    ) -> List[Appointment]:
        """
        Get upcoming appointments for a pet.
        
        Args:
            db: Database session
            pet_id: Pet ID
            days_ahead: Number of days to look ahead
            
        Returns:
            List of upcoming appointments
        """
        today = datetime.now().date()
        future_date = today + timedelta(days=days_ahead)
        
        return db.query(Appointment).filter(
            and_(
                Appointment.pet_id == pet_id,
                Appointment.status == "scheduled",
                Appointment.appointment_date >= today,
                Appointment.appointment_date <= future_date
            )
        ).order_by(Appointment.appointment_date).all()
    
    @staticmethod
    def get_pet_health_summary(db: Session, pet_id: int) -> dict:
        """
        Get a comprehensive health summary for a pet.
        
        Args:
            db: Database session
            pet_id: Pet ID
            
        Returns:
            Dictionary with health summary statistics
        """
        total_appointments = db.query(Appointment).filter(Appointment.pet_id == pet_id).count()
        completed_appointments = db.query(Appointment).filter(
            and_(Appointment.pet_id == pet_id, Appointment.status == "completed")
        ).count()
        
        active_medications = HistoryService.get_medication_history(db, pet_id, active_only=True)
        total_health_logs = db.query(HealthRecord).filter(HealthRecord.pet_id == pet_id).count()
        
        upcoming = HistoryService.get_upcoming_appointments(db, pet_id, days_ahead=30)
        
        return {
            "total_appointments": total_appointments,
            "completed_appointments": completed_appointments,
            "active_medications_count": len(active_medications),
            "total_health_logs": total_health_logs,
            "upcoming_appointments_count": len(upcoming),
            "next_appointment": upcoming[0] if upcoming else None
        }
