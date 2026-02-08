"""
Cached query service for frequently accessed data.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cached, cache_manager, CacheTTL, CacheInvalidator
from app.database.optimization import QueryOptimizer, BulkOperations
from app.database.models import User, Pet, Medication, Appointment, HealthRecord, AIAssessment


class CachedQueryService:
    """Service for cached database queries."""
    
    @staticmethod
    @cached(prefix="user:profile", ttl=CacheTTL.USER_PROFILE)
    async def get_user_profile(session: AsyncSession, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user profile with caching.
        
        Args:
            session: Database session
            user_id: User UUID
            
        Returns:
            User profile dictionary or None
        """
        user = await QueryOptimizer.get_user_with_pets(session, user_id)
        if not user:
            return None
        
        return {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone_number": user.phone_number,
            "emergency_contact": user.emergency_contact,
            "preferred_vet_clinic": user.preferred_vet_clinic,
            "is_active": user.is_active,
            "pet_count": len(user.pets)
        }
    
    @staticmethod
    @cached(prefix="pet:profile", ttl=CacheTTL.PET_PROFILE)
    async def get_pet_profile(session: AsyncSession, pet_id: str) -> Optional[Dict[str, Any]]:
        """
        Get pet profile with caching.
        
        Args:
            session: Database session
            pet_id: Pet UUID
            
        Returns:
            Pet profile dictionary or None
        """
        pet = await QueryOptimizer.get_pet_with_medical_data(session, pet_id)
        if not pet:
            return None
        
        return {
            "id": str(pet.id),
            "name": pet.name,
            "species": pet.species,
            "breed": pet.breed,
            "birth_date": pet.birth_date.isoformat() if pet.birth_date else None,
            "weight": pet.weight,
            "gender": pet.gender,
            "medical_conditions": pet.medical_conditions,
            "allergies": pet.allergies,
            "is_active": pet.is_active
        }
    
    @staticmethod
    @cached(prefix="pet:medications:active", ttl=CacheTTL.MEDICATION)
    async def get_active_medications(
        session: AsyncSession,
        pet_id: str,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Get active medications with recent logs (cached).
        
        Args:
            session: Database session
            pet_id: Pet UUID
            days: Number of days of logs to include
            
        Returns:
            List of medication dictionaries
        """
        medications = await QueryOptimizer.get_active_medications_with_logs(
            session, pet_id, days
        )
        
        return [
            {
                "id": str(med.id),
                "medication_name": med.medication_name,
                "dosage": med.dosage,
                "frequency": med.frequency,
                "start_date": med.start_date.isoformat() if med.start_date else None,
                "end_date": med.end_date.isoformat() if med.end_date else None,
                "current_quantity": med.current_quantity,
                "refill_threshold": med.refill_threshold,
                "needs_refill": med.current_quantity <= med.refill_threshold,
                "log_count": len(med.medication_logs)
            }
            for med in medications
        ]
    
    @staticmethod
    @cached(prefix="user:appointments:upcoming", ttl=CacheTTL.APPOINTMENT)
    async def get_upcoming_appointments(
        session: AsyncSession,
        user_id: str,
        days_ahead: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Get upcoming appointments (cached).
        
        Args:
            session: Database session
            user_id: User UUID
            days_ahead: Number of days to look ahead
            
        Returns:
            List of appointment dictionaries
        """
        appointments = await QueryOptimizer.get_upcoming_appointments(
            session, user_id, days_ahead
        )
        
        return [
            {
                "id": str(appt.id),
                "pet_id": str(appt.pet_id),
                "pet_name": appt.pet.name,
                "appointment_date": appt.appointment_date.isoformat(),
                "appointment_type": appt.appointment_type,
                "clinic_name": appt.clinic_name,
                "clinic_phone": appt.clinic_phone,
                "status": appt.status,
                "reminder_sent_24h": appt.reminder_sent_24h,
                "reminder_sent_2h": appt.reminder_sent_2h
            }
            for appt in appointments
        ]
    
    @staticmethod
    @cached(prefix="user:medications:refill", ttl=CacheTTL.MEDICATION)
    async def get_medications_needing_refill(
        session: AsyncSession,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get medications needing refill (cached).
        
        Args:
            session: Database session
            user_id: User UUID
            
        Returns:
            List of medication dictionaries
        """
        medications = await QueryOptimizer.get_medications_needing_refill(
            session, user_id
        )
        
        return [
            {
                "id": str(med.id),
                "pet_id": str(med.pet_id),
                "pet_name": med.pet.name,
                "medication_name": med.medication_name,
                "current_quantity": med.current_quantity,
                "refill_threshold": med.refill_threshold,
                "dosage": med.dosage,
                "frequency": med.frequency
            }
            for med in medications
        ]
    
    @staticmethod
    @cached(prefix="pet:statistics", ttl=CacheTTL.STATISTICS)
    async def get_pet_statistics(
        session: AsyncSession,
        pet_id: str
    ) -> Dict[str, Any]:
        """
        Get pet statistics (cached).
        
        Args:
            session: Database session
            pet_id: Pet UUID
            
        Returns:
            Statistics dictionary
        """
        stats = await QueryOptimizer.get_pet_statistics(session, pet_id)
        
        # Convert datetime to ISO format for caching
        if stats.get("last_assessment_date"):
            stats["last_assessment_date"] = stats["last_assessment_date"].isoformat()
        
        return stats
    
    @staticmethod
    @cached(prefix="pet:health_records", ttl=CacheTTL.HEALTH_RECORD)
    async def get_health_records_by_date_range(
        session: AsyncSession,
        pet_id: str,
        start_date: datetime,
        end_date: datetime,
        record_types: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get health records within date range (cached).
        
        Args:
            session: Database session
            pet_id: Pet UUID
            start_date: Start of date range
            end_date: End of date range
            record_types: Optional list of record types
            
        Returns:
            List of health record dictionaries
        """
        records = await QueryOptimizer.get_health_records_by_date_range(
            session, pet_id, start_date, end_date, record_types
        )
        
        return [
            {
                "id": str(record.id),
                "record_date": record.record_date.isoformat(),
                "record_type": record.record_type,
                "description": record.description,
                "veterinarian": record.veterinarian,
                "clinic_name": record.clinic_name,
                "diagnosis": record.diagnosis,
                "symptom_count": len(record.symptom_logs),
                "vaccination_count": len(record.vaccinations),
                "ai_assessment_count": len(record.ai_assessments)
            }
            for record in records
        ]


class CacheWarmer:
    """Utility for warming up cache with frequently accessed data."""
    
    @staticmethod
    async def warm_user_cache(session: AsyncSession, user_id: str):
        """
        Pre-load user-related data into cache.
        
        Args:
            session: Database session
            user_id: User UUID
        """
        # Warm user profile
        await CachedQueryService.get_user_profile(session, user_id)
        
        # Warm upcoming appointments
        await CachedQueryService.get_upcoming_appointments(session, user_id)
        
        # Warm medications needing refill
        await CachedQueryService.get_medications_needing_refill(session, user_id)
    
    @staticmethod
    async def warm_pet_cache(session: AsyncSession, pet_id: str):
        """
        Pre-load pet-related data into cache.
        
        Args:
            session: Database session
            pet_id: Pet UUID
        """
        # Warm pet profile
        await CachedQueryService.get_pet_profile(session, pet_id)
        
        # Warm active medications
        await CachedQueryService.get_active_medications(session, pet_id)
        
        # Warm pet statistics
        await CachedQueryService.get_pet_statistics(session, pet_id)
        
        # Warm recent health records (last 90 days)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=90)
        await CachedQueryService.get_health_records_by_date_range(
            session, pet_id, start_date, end_date
        )


class ResponseCache:
    """Cache for API responses."""
    
    @staticmethod
    async def cache_response(
        endpoint: str,
        params: Dict[str, Any],
        response: Any,
        ttl: int = CacheTTL.STATIC_DATA
    ):
        """
        Cache API response.
        
        Args:
            endpoint: API endpoint path
            params: Request parameters
            response: Response data
            ttl: Time to live in seconds
        """
        cache_key = cache_manager._generate_key(f"api:{endpoint}", **params)
        await cache_manager.set(cache_key, response, ttl)
    
    @staticmethod
    async def get_cached_response(
        endpoint: str,
        params: Dict[str, Any]
    ) -> Optional[Any]:
        """
        Get cached API response.
        
        Args:
            endpoint: API endpoint path
            params: Request parameters
            
        Returns:
            Cached response or None
        """
        cache_key = cache_manager._generate_key(f"api:{endpoint}", **params)
        return await cache_manager.get(cache_key)
    
    @staticmethod
    async def invalidate_endpoint_cache(endpoint: str):
        """
        Invalidate all cached responses for an endpoint.
        
        Args:
            endpoint: API endpoint path
        """
        await cache_manager.delete_pattern(f"api:{endpoint}:*")
