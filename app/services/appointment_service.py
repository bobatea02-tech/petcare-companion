"""
Appointment management service for scheduling and tracking veterinary appointments.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from typing import Optional, List
from datetime import datetime, timedelta
import uuid
import math
import logging

from app.database.models import Appointment, Pet, VetClinic
from app.schemas.appointments import (
    AppointmentCreate, AppointmentUpdate, AppointmentResponse,
    AppointmentListResponse, AppointmentHistoryResponse,
    VetClinicCreate, VetClinicUpdate, VetClinicResponse,
    VetClinicListResponse, EmergencyVetSearchResponse
)

logger = logging.getLogger(__name__)


class AppointmentService:
    """Service for managing veterinary appointments."""
    
    def __init__(self, db: AsyncSession):
        """Initialize appointment service with database session."""
        self.db = db
    
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
                detail=f"Pet with ID {pet_id} not found or does not belong to user"
            )
        
        return pet
    
    async def create_appointment(
        self,
        user_id: str,
        pet_id: str,
        appointment_data: AppointmentCreate
    ) -> AppointmentResponse:
        """
        Create a new appointment for a pet.
        
        Requirements validated:
        - 7.1: Appointment scheduling with clinic details and appointment times
        """
        # Verify pet ownership
        pet = await self._verify_pet_ownership(user_id, pet_id)
        
        # Create appointment
        appointment = Appointment(
            pet_id=uuid.UUID(pet_id),
            appointment_date=appointment_data.appointment_date,
            appointment_type=appointment_data.appointment_type,
            purpose=appointment_data.purpose,
            clinic_name=appointment_data.clinic_name,
            clinic_address=appointment_data.clinic_address,
            clinic_phone=appointment_data.clinic_phone,
            veterinarian=appointment_data.veterinarian,
            notes=appointment_data.notes,
            status='scheduled'
        )
        
        self.db.add(appointment)
        await self.db.commit()
        await self.db.refresh(appointment)
        
        return self._appointment_to_response(appointment)
    
    async def get_pet_appointments(
        self,
        user_id: str,
        pet_id: str,
        include_past: bool = True,
        include_cancelled: bool = False
    ) -> AppointmentListResponse:
        """
        Get all appointments for a pet with filtering options.
        
        Requirements validated:
        - 7.4: Appointment history display with filtering
        """
        # Verify pet ownership
        await self._verify_pet_ownership(user_id, pet_id)
        
        # Build query
        query = select(Appointment).where(Appointment.pet_id == uuid.UUID(pet_id))
        
        # Apply filters
        if not include_past:
            query = query.where(Appointment.appointment_date >= datetime.now())
        
        if not include_cancelled:
            query = query.where(Appointment.status != 'cancelled')
        
        # Order by appointment date
        query = query.order_by(Appointment.appointment_date.desc())
        
        result = await self.db.execute(query)
        appointments = result.scalars().all()
        
        # Convert to responses
        appointment_responses = [self._appointment_to_response(apt) for apt in appointments]
        
        # Calculate counts
        total_count = len(appointment_responses)
        upcoming_count = sum(1 for apt in appointment_responses if apt.is_upcoming)
        past_count = sum(1 for apt in appointment_responses if apt.is_past)
        
        return AppointmentListResponse(
            appointments=appointment_responses,
            total_count=total_count,
            upcoming_count=upcoming_count,
            past_count=past_count
        )
    
    async def get_appointment(
        self,
        user_id: str,
        pet_id: str,
        appointment_id: str
    ) -> AppointmentResponse:
        """Get a specific appointment by ID."""
        # Verify pet ownership
        await self._verify_pet_ownership(user_id, pet_id)
        
        # Get appointment
        result = await self.db.execute(
            select(Appointment).where(
                and_(
                    Appointment.id == uuid.UUID(appointment_id),
                    Appointment.pet_id == uuid.UUID(pet_id)
                )
            )
        )
        appointment = result.scalar_one_or_none()
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment with ID {appointment_id} not found"
            )
        
        return self._appointment_to_response(appointment)
    
    async def update_appointment(
        self,
        user_id: str,
        pet_id: str,
        appointment_id: str,
        appointment_data: AppointmentUpdate
    ) -> AppointmentResponse:
        """
        Update an existing appointment.
        
        Requirements validated:
        - 7.1: Appointment management with updates
        """
        # Verify pet ownership
        await self._verify_pet_ownership(user_id, pet_id)
        
        # Get appointment
        result = await self.db.execute(
            select(Appointment).where(
                and_(
                    Appointment.id == uuid.UUID(appointment_id),
                    Appointment.pet_id == uuid.UUID(pet_id)
                )
            )
        )
        appointment = result.scalar_one_or_none()
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment with ID {appointment_id} not found"
            )
        
        # Update fields
        update_data = appointment_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(appointment, field, value)
        
        await self.db.commit()
        await self.db.refresh(appointment)
        
        return self._appointment_to_response(appointment)
    
    async def delete_appointment(
        self,
        user_id: str,
        pet_id: str,
        appointment_id: str
    ) -> None:
        """
        Delete (cancel) an appointment.
        
        Requirements validated:
        - 7.1: Appointment management with deletion
        """
        # Verify pet ownership
        await self._verify_pet_ownership(user_id, pet_id)
        
        # Get appointment
        result = await self.db.execute(
            select(Appointment).where(
                and_(
                    Appointment.id == uuid.UUID(appointment_id),
                    Appointment.pet_id == uuid.UUID(pet_id)
                )
            )
        )
        appointment = result.scalar_one_or_none()
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment with ID {appointment_id} not found"
            )
        
        # Mark as cancelled instead of deleting
        appointment.status = 'cancelled'
        await self.db.commit()
    
    async def get_appointment_history(
        self,
        user_id: str,
        pet_id: str
    ) -> AppointmentHistoryResponse:
        """
        Get comprehensive appointment history for a pet.
        
        Requirements validated:
        - 7.4: Appointment history display with relevant details
        """
        # Verify pet ownership
        pet = await self._verify_pet_ownership(user_id, pet_id)
        
        # Get all appointments
        result = await self.db.execute(
            select(Appointment)
            .where(Appointment.pet_id == uuid.UUID(pet_id))
            .order_by(Appointment.appointment_date.desc())
        )
        appointments = result.scalars().all()
        
        # Convert to responses
        appointment_responses = [self._appointment_to_response(apt) for apt in appointments]
        
        # Calculate statistics
        total_appointments = len(appointment_responses)
        upcoming_appointments = sum(1 for apt in appointment_responses if apt.is_upcoming)
        
        # Find last and next appointment dates
        past_appointments = [apt for apt in appointment_responses if apt.is_past]
        upcoming_apts = [apt for apt in appointment_responses if apt.is_upcoming]
        
        last_appointment_date = past_appointments[0].appointment_date if past_appointments else None
        next_appointment_date = upcoming_apts[-1].appointment_date if upcoming_apts else None
        
        return AppointmentHistoryResponse(
            pet_id=pet_id,
            pet_name=pet.name,
            appointments=appointment_responses,
            total_appointments=total_appointments,
            upcoming_appointments=upcoming_appointments,
            last_appointment_date=last_appointment_date,
            next_appointment_date=next_appointment_date
        )
    
    async def get_upcoming_appointments(
        self,
        user_id: str,
        days_ahead: int = 7
    ) -> List[AppointmentResponse]:
        """Get all upcoming appointments for a user across all pets."""
        # Get all user's pets
        result = await self.db.execute(
            select(Pet).where(
                and_(
                    Pet.user_id == uuid.UUID(user_id),
                    Pet.is_active == True
                )
            )
        )
        pets = result.scalars().all()
        pet_ids = [pet.id for pet in pets]
        
        if not pet_ids:
            return []
        
        # Get upcoming appointments
        end_date = datetime.now() + timedelta(days=days_ahead)
        result = await self.db.execute(
            select(Appointment).where(
                and_(
                    Appointment.pet_id.in_(pet_ids),
                    Appointment.appointment_date >= datetime.now(),
                    Appointment.appointment_date <= end_date,
                    Appointment.status == 'scheduled'
                )
            ).order_by(Appointment.appointment_date.asc())
        )
        appointments = result.scalars().all()
        
        return [self._appointment_to_response(apt) for apt in appointments]
    
    async def create_emergency_appointment_from_triage(
        self,
        user_id: str,
        pet_id: str,
        clinic_id: str,
        triage_assessment_id: Optional[str] = None,
        notes: Optional[str] = None
    ) -> AppointmentResponse:
        """
        Create an emergency appointment directly from triage results.
        
        Requirements validated:
        - 7.3: Direct scheduling links for emergency triage results
        """
        # Verify pet ownership
        pet = await self._verify_pet_ownership(user_id, pet_id)
        
        # Get clinic information
        result = await self.db.execute(
            select(VetClinic).where(VetClinic.id == uuid.UUID(clinic_id))
        )
        clinic = result.scalar_one_or_none()
        
        if not clinic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vet clinic with ID {clinic_id} not found"
            )
        
        # Verify AI assessment exists if provided
        ai_assessment_uuid = None
        if triage_assessment_id:
            try:
                from app.database.models import AIAssessment
                assessment_result = await self.db.execute(
                    select(AIAssessment).where(AIAssessment.id == uuid.UUID(triage_assessment_id))
                )
                assessment = assessment_result.scalar_one_or_none()
                if assessment:
                    ai_assessment_uuid = uuid.UUID(triage_assessment_id)
            except (ValueError, TypeError):
                # Invalid UUID format - just log it in notes
                logger.warning(f"Invalid AI assessment ID format: {triage_assessment_id}")
                pass
        
        # Create emergency appointment with immediate scheduling
        appointment_notes = f"Emergency appointment created from triage assessment"
        if triage_assessment_id:
            appointment_notes += f" (Assessment ID: {triage_assessment_id})"
        if notes:
            appointment_notes += f"\n\nAdditional notes: {notes}"
        
        # Schedule for as soon as possible (within next hour)
        appointment_date = datetime.now() + timedelta(minutes=30)
        
        appointment = Appointment(
            pet_id=uuid.UUID(pet_id),
            ai_assessment_id=ai_assessment_uuid,
            appointment_date=appointment_date,
            appointment_type="emergency",
            purpose="Emergency visit from AI triage assessment",
            clinic_name=clinic.name,
            clinic_address=clinic.address,
            clinic_phone=clinic.phone_number,
            veterinarian=None,  # Will be assigned at clinic
            notes=appointment_notes,
            status='scheduled'
        )
        
        self.db.add(appointment)
        await self.db.commit()
        await self.db.refresh(appointment)
        
        return self._appointment_to_response(appointment)
    
    async def get_appointments_needing_reminders(
        self,
        reminder_type: str = "24h"
    ) -> List[AppointmentResponse]:
        """
        Get appointments that need reminder notifications.
        
        Requirements validated:
        - 7.2: Appointment reminder system integration
        """
        now = datetime.now()
        
        if reminder_type == "24h":
            # Find appointments 24 hours away that haven't been reminded
            start_window = now + timedelta(hours=23, minutes=45)
            end_window = now + timedelta(hours=24, minutes=15)
            
            result = await self.db.execute(
                select(Appointment).where(
                    and_(
                        Appointment.appointment_date >= start_window,
                        Appointment.appointment_date <= end_window,
                        Appointment.status == 'scheduled',
                        Appointment.reminder_sent_24h == False
                    )
                )
            )
        elif reminder_type == "2h":
            # Find appointments 2 hours away that haven't been reminded
            start_window = now + timedelta(hours=1, minutes=45)
            end_window = now + timedelta(hours=2, minutes=15)
            
            result = await self.db.execute(
                select(Appointment).where(
                    and_(
                        Appointment.appointment_date >= start_window,
                        Appointment.appointment_date <= end_window,
                        Appointment.status == 'scheduled',
                        Appointment.reminder_sent_2h == False
                    )
                )
            )
        else:
            raise ValueError(f"Invalid reminder type: {reminder_type}")
        
        appointments = result.scalars().all()
        return [self._appointment_to_response(apt) for apt in appointments]
    
    async def mark_reminder_sent(
        self,
        appointment_id: str,
        reminder_type: str = "24h"
    ) -> None:
        """
        Mark that a reminder has been sent for an appointment.
        
        Requirements validated:
        - 7.2: Appointment reminder tracking
        """
        result = await self.db.execute(
            select(Appointment).where(Appointment.id == uuid.UUID(appointment_id))
        )
        appointment = result.scalar_one_or_none()
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment with ID {appointment_id} not found"
            )
        
        if reminder_type == "24h":
            appointment.reminder_sent_24h = True
        elif reminder_type == "2h":
            appointment.reminder_sent_2h = True
        else:
            raise ValueError(f"Invalid reminder type: {reminder_type}")
        
        await self.db.commit()
    
    def _appointment_to_response(self, appointment: Appointment) -> AppointmentResponse:
        """Convert appointment model to response schema."""
        return AppointmentResponse(
            id=str(appointment.id),
            pet_id=str(appointment.pet_id),
            ai_assessment_id=str(appointment.ai_assessment_id) if appointment.ai_assessment_id else None,
            appointment_date=appointment.appointment_date,
            appointment_type=appointment.appointment_type,
            purpose=appointment.purpose,
            clinic_name=appointment.clinic_name,
            clinic_address=appointment.clinic_address,
            clinic_phone=appointment.clinic_phone,
            veterinarian=appointment.veterinarian,
            status=appointment.status,
            notes=appointment.notes,
            reminder_sent_24h=appointment.reminder_sent_24h,
            reminder_sent_2h=appointment.reminder_sent_2h,
            created_at=appointment.created_at,
            updated_at=appointment.updated_at,
            is_upcoming=False,  # Will be computed in __init__
            is_past=False,  # Will be computed in __init__
            hours_until_appointment=None  # Will be computed in __init__
        )


class VetClinicService:
    """Service for managing veterinary clinic information."""
    
    def __init__(self, db: AsyncSession):
        """Initialize vet clinic service with database session."""
        self.db = db
    
    async def create_vet_clinic(
        self,
        clinic_data: VetClinicCreate
    ) -> VetClinicResponse:
        """Create a new vet clinic entry."""
        clinic = VetClinic(
            name=clinic_data.name,
            address=clinic_data.address,
            phone_number=clinic_data.phone_number,
            email=clinic_data.email,
            website=clinic_data.website,
            latitude=clinic_data.latitude,
            longitude=clinic_data.longitude,
            is_emergency=clinic_data.is_emergency,
            is_24_hour=clinic_data.is_24_hour,
            services_offered=clinic_data.services_offered,
            operating_hours=clinic_data.operating_hours
        )
        
        self.db.add(clinic)
        await self.db.commit()
        await self.db.refresh(clinic)
        
        return self._clinic_to_response(clinic)
    
    async def get_vet_clinic(self, clinic_id: str) -> VetClinicResponse:
        """Get a specific vet clinic by ID."""
        result = await self.db.execute(
            select(VetClinic).where(VetClinic.id == uuid.UUID(clinic_id))
        )
        clinic = result.scalar_one_or_none()
        
        if not clinic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vet clinic with ID {clinic_id} not found"
            )
        
        return self._clinic_to_response(clinic)
    
    async def get_all_vet_clinics(
        self,
        emergency_only: bool = False,
        twenty_four_hour_only: bool = False
    ) -> VetClinicListResponse:
        """Get all vet clinics with optional filtering."""
        query = select(VetClinic)
        
        if emergency_only:
            query = query.where(VetClinic.is_emergency == True)
        
        if twenty_four_hour_only:
            query = query.where(VetClinic.is_24_hour == True)
        
        result = await self.db.execute(query)
        clinics = result.scalars().all()
        
        clinic_responses = [self._clinic_to_response(clinic) for clinic in clinics]
        
        return VetClinicListResponse(
            clinics=clinic_responses,
            total_count=len(clinic_responses),
            emergency_count=sum(1 for c in clinic_responses if c.is_emergency),
            twenty_four_hour_count=sum(1 for c in clinic_responses if c.is_24_hour)
        )
    
    async def search_emergency_vets(
        self,
        latitude: float,
        longitude: float,
        radius_miles: float = 10.0,
        emergency_only: bool = True,
        twenty_four_hour_only: bool = False
    ) -> EmergencyVetSearchResponse:
        """
        Search for emergency vet clinics near a location.
        
        Requirements validated:
        - 7.3: Emergency vet clinic database and search
        """
        # Build query
        query = select(VetClinic)
        
        if emergency_only:
            query = query.where(VetClinic.is_emergency == True)
        
        if twenty_four_hour_only:
            query = query.where(VetClinic.is_24_hour == True)
        
        result = await self.db.execute(query)
        all_clinics = result.scalars().all()
        
        # Filter by distance and calculate distances
        nearby_clinics = []
        for clinic in all_clinics:
            if clinic.latitude is not None and clinic.longitude is not None:
                distance = self._calculate_distance(
                    latitude, longitude,
                    clinic.latitude, clinic.longitude
                )
                
                if distance <= radius_miles:
                    clinic_response = self._clinic_to_response(clinic)
                    clinic_response.distance_miles = round(distance, 2)
                    nearby_clinics.append(clinic_response)
        
        # Sort by distance
        nearby_clinics.sort(key=lambda c: c.distance_miles or float('inf'))
        
        return EmergencyVetSearchResponse(
            clinics=nearby_clinics,
            search_location={"latitude": latitude, "longitude": longitude},
            search_radius_miles=radius_miles,
            total_found=len(nearby_clinics)
        )
    
    async def update_vet_clinic(
        self,
        clinic_id: str,
        clinic_data: VetClinicUpdate
    ) -> VetClinicResponse:
        """Update an existing vet clinic."""
        result = await self.db.execute(
            select(VetClinic).where(VetClinic.id == uuid.UUID(clinic_id))
        )
        clinic = result.scalar_one_or_none()
        
        if not clinic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vet clinic with ID {clinic_id} not found"
            )
        
        # Update fields
        update_data = clinic_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(clinic, field, value)
        
        await self.db.commit()
        await self.db.refresh(clinic)
        
        return self._clinic_to_response(clinic)
    
    def _clinic_to_response(self, clinic: VetClinic) -> VetClinicResponse:
        """Convert vet clinic model to response schema."""
        return VetClinicResponse(
            id=str(clinic.id),
            name=clinic.name,
            address=clinic.address,
            phone_number=clinic.phone_number,
            email=clinic.email,
            website=clinic.website,
            latitude=clinic.latitude,
            longitude=clinic.longitude,
            is_emergency=clinic.is_emergency,
            is_24_hour=clinic.is_24_hour,
            services_offered=clinic.services_offered,
            operating_hours=clinic.operating_hours,
            created_at=clinic.created_at,
            updated_at=clinic.updated_at,
            distance_miles=None  # Will be set by search function if applicable
        )
    
    def _calculate_distance(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """
        Calculate distance between two coordinates using Haversine formula.
        Returns distance in miles.
        """
        # Earth radius in miles
        R = 3959.0
        
        # Convert to radians
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        # Haversine formula
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        distance = R * c
        return distance
