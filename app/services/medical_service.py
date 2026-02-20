"""
Medical information management service for pet health records.
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, or_
from fastapi import HTTPException, status
from datetime import date, timedelta
import uuid
import logging

logger = logging.getLogger(__name__)

from app.database.models import (
    Pet, PetMedicalCondition, PetAllergy, PetVaccinationRecord, 
    PetMedicalHistoryEntry, PetWeightRecord
)
from app.schemas.pets import (
    MedicalConditionCreate, AllergyCreate, VaccinationRecordCreate,
    MedicalHistoryEntryCreate, MedicalConditionResponse, AllergyResponse,
    VaccinationRecordResponse, MedicalHistoryEntryResponse, PetMedicalSummaryResponse,
    WeightRecordCreate, WeightRecordResponse, WeightHistoryResponse
)


class MedicalService:
    """Service class for pet medical information management."""
    
    def __init__(self, db: AsyncSession):
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
                detail="Pet not found"
            )
        
        return pet
    
    # Medical Conditions Management
    
    async def add_medical_condition(
        self, user_id: str, pet_id: str, condition_data: MedicalConditionCreate
    ) -> MedicalConditionResponse:
        """
        Add a medical condition to a pet.
        
        Requirements validated:
        - 2.2: Medical conditions storage and retrieval
        """
        try:
            await self._verify_pet_ownership(user_id, pet_id)
            
            condition = PetMedicalCondition(
                pet_id=uuid.UUID(pet_id),
                condition_name=condition_data.condition_name,
                diagnosis_date=condition_data.diagnosis_date,
                severity=condition_data.severity,
                treatment_status=condition_data.treatment_status,
                notes=condition_data.notes
            )
            
            self.db.add(condition)
            await self.db.commit()
            await self.db.refresh(condition)
            
            return self._condition_to_response(condition)
            
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to add medical condition: {str(e)}"
            )
    
    async def get_pet_medical_conditions(self, user_id: str, pet_id: str) -> List[MedicalConditionResponse]:
        """Get all medical conditions for a pet."""
        try:
            await self._verify_pet_ownership(user_id, pet_id)
            
            result = await self.db.execute(
                select(PetMedicalCondition)
                .where(
                    and_(
                        PetMedicalCondition.pet_id == uuid.UUID(pet_id),
                        PetMedicalCondition.is_active == True
                    )
                )
                .order_by(desc(PetMedicalCondition.created_at))
            )
            conditions = result.scalars().all()
            
            return [self._condition_to_response(condition) for condition in conditions]
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve medical conditions: {str(e)}"
            )
    
    # Allergies Management
    
    async def add_allergy(
        self, user_id: str, pet_id: str, allergy_data: AllergyCreate
    ) -> AllergyResponse:
        """
        Add an allergy to a pet.
        
        Requirements validated:
        - 2.2: Allergies storage and retrieval
        """
        try:
            await self._verify_pet_ownership(user_id, pet_id)
            
            allergy = PetAllergy(
                pet_id=uuid.UUID(pet_id),
                allergen=allergy_data.allergen,
                reaction_type=allergy_data.reaction_type,
                severity=allergy_data.severity,
                discovered_date=allergy_data.discovered_date,
                notes=allergy_data.notes
            )
            
            self.db.add(allergy)
            await self.db.commit()
            await self.db.refresh(allergy)
            
            return self._allergy_to_response(allergy)
            
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to add allergy: {str(e)}"
            )
    
    async def get_pet_allergies(self, user_id: str, pet_id: str) -> List[AllergyResponse]:
        """Get all allergies for a pet."""
        try:
            await self._verify_pet_ownership(user_id, pet_id)
            
            result = await self.db.execute(
                select(PetAllergy)
                .where(
                    and_(
                        PetAllergy.pet_id == uuid.UUID(pet_id),
                        PetAllergy.is_active == True
                    )
                )
                .order_by(desc(PetAllergy.created_at))
            )
            allergies = result.scalars().all()
            
            return [self._allergy_to_response(allergy) for allergy in allergies]
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve allergies: {str(e)}"
            )
    
    # Vaccination Records Management
    
    async def add_vaccination_record(
        self, user_id: str, pet_id: str, vaccination_data: VaccinationRecordCreate
    ) -> VaccinationRecordResponse:
        """
        Add a vaccination record to a pet.
        
        Requirements validated:
        - 2.3: Vaccination record storage and retrieval
        """
        try:
            await self._verify_pet_ownership(user_id, pet_id)
            
            vaccination = PetVaccinationRecord(
                pet_id=uuid.UUID(pet_id),
                vaccine_name=vaccination_data.vaccine_name,
                vaccine_type=vaccination_data.vaccine_type,
                administered_date=vaccination_data.administered_date,
                expiration_date=vaccination_data.expiration_date,
                veterinarian=vaccination_data.veterinarian,
                clinic_name=vaccination_data.clinic_name,
                batch_number=vaccination_data.batch_number,
                notes=vaccination_data.notes
            )
            
            self.db.add(vaccination)
            await self.db.commit()
            await self.db.refresh(vaccination)
            
            return self._vaccination_to_response(vaccination)
            
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to add vaccination record: {str(e)}"
            )
    
    async def get_pet_vaccinations(self, user_id: str, pet_id: str) -> List[VaccinationRecordResponse]:
        """Get all vaccination records for a pet."""
        try:
            await self._verify_pet_ownership(user_id, pet_id)
            
            result = await self.db.execute(
                select(PetVaccinationRecord)
                .where(
                    and_(
                        PetVaccinationRecord.pet_id == uuid.UUID(pet_id),
                        PetVaccinationRecord.is_active == True
                    )
                )
                .order_by(desc(PetVaccinationRecord.administered_date))
            )
            vaccinations = result.scalars().all()
            
            return [self._vaccination_to_response(vaccination) for vaccination in vaccinations]
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve vaccination records: {str(e)}"
            )
    
    # Medical History Management
    
    async def add_medical_history_entry(
        self, user_id: str, pet_id: str, history_data: MedicalHistoryEntryCreate
    ) -> MedicalHistoryEntryResponse:
        """
        Add a medical history entry to a pet.
        
        Requirements validated:
        - 2.3: Medical history tracking with timestamps
        """
        try:
            await self._verify_pet_ownership(user_id, pet_id)
            
            history_entry = PetMedicalHistoryEntry(
                pet_id=uuid.UUID(pet_id),
                entry_date=history_data.entry_date,
                entry_type=history_data.entry_type,
                description=history_data.description,
                veterinarian=history_data.veterinarian,
                clinic_name=history_data.clinic_name,
                diagnosis=history_data.diagnosis,
                treatment_plan=history_data.treatment_plan,
                follow_up_required=history_data.follow_up_required,
                follow_up_date=history_data.follow_up_date
            )
            
            self.db.add(history_entry)
            await self.db.commit()
            await self.db.refresh(history_entry)
            
            return self._history_to_response(history_entry)
            
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to add medical history entry: {str(e)}"
            )
    
    async def get_pet_medical_history(self, user_id: str, pet_id: str) -> List[MedicalHistoryEntryResponse]:
        """Get all medical history entries for a pet."""
        try:
            await self._verify_pet_ownership(user_id, pet_id)
            
            result = await self.db.execute(
                select(PetMedicalHistoryEntry)
                .where(
                    and_(
                        PetMedicalHistoryEntry.pet_id == uuid.UUID(pet_id),
                        PetMedicalHistoryEntry.is_active == True
                    )
                )
                .order_by(desc(PetMedicalHistoryEntry.entry_date))
            )
            history_entries = result.scalars().all()
            
            return [self._history_to_response(entry) for entry in history_entries]
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve medical history: {str(e)}"
            )
    
    # Comprehensive Medical Summary
    
    async def get_pet_medical_summary(self, user_id: str, pet_id: str) -> PetMedicalSummaryResponse:
        """
        Get comprehensive medical summary for a pet.
        
        Requirements validated:
        - 2.2: Complete medical information retrieval
        - 2.3: Medical history with timestamps
        """
        try:
            pet = await self._verify_pet_ownership(user_id, pet_id)
            
            # Get all medical information
            conditions = await self.get_pet_medical_conditions(user_id, pet_id)
            allergies = await self.get_pet_allergies(user_id, pet_id)
            vaccinations = await self.get_pet_vaccinations(user_id, pet_id)
            history = await self.get_pet_medical_history(user_id, pet_id)
            
            # Calculate summary statistics
            active_conditions = sum(1 for c in conditions if c.treatment_status in ['active', 'ongoing'])
            expired_vaccinations = sum(1 for v in vaccinations if v.is_expired)
            
            # Count vaccinations expiring within 30 days
            thirty_days_from_now = date.today() + timedelta(days=30)
            upcoming_expirations = sum(
                1 for v in vaccinations 
                if v.expiration_date and not v.is_expired and v.expiration_date <= thirty_days_from_now
            )
            
            # Find last checkup date
            checkup_entries = [h for h in history if h.entry_type == 'checkup']
            last_checkup_date = checkup_entries[0].entry_date if checkup_entries else None
            
            return PetMedicalSummaryResponse(
                pet_id=pet_id,
                pet_name=pet.name,
                medical_conditions=conditions,
                allergies=allergies,
                vaccinations=vaccinations,
                medical_history=history,
                total_conditions=len(conditions),
                active_conditions=active_conditions,
                total_allergies=len(allergies),
                total_vaccinations=len(vaccinations),
                expired_vaccinations=expired_vaccinations,
                upcoming_expirations=upcoming_expirations,
                last_checkup_date=last_checkup_date
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve medical summary: {str(e)}"
            )
    
    # Helper methods for response conversion
    
    def _condition_to_response(self, condition: PetMedicalCondition) -> MedicalConditionResponse:
        """Convert PetMedicalCondition to response schema."""
        return MedicalConditionResponse(
            id=str(condition.id),
            pet_id=str(condition.pet_id),
            condition_name=condition.condition_name,
            diagnosis_date=condition.diagnosis_date,
            severity=condition.severity,
            treatment_status=condition.treatment_status,
            notes=condition.notes,
            created_at=condition.created_at,
            updated_at=condition.updated_at
        )
    
    def _allergy_to_response(self, allergy: PetAllergy) -> AllergyResponse:
        """Convert PetAllergy to response schema."""
        return AllergyResponse(
            id=str(allergy.id),
            pet_id=str(allergy.pet_id),
            allergen=allergy.allergen,
            reaction_type=allergy.reaction_type,
            severity=allergy.severity,
            discovered_date=allergy.discovered_date,
            notes=allergy.notes,
            created_at=allergy.created_at,
            updated_at=allergy.updated_at
        )
    
    def _vaccination_to_response(self, vaccination: PetVaccinationRecord) -> VaccinationRecordResponse:
        """Convert PetVaccinationRecord to response schema."""
        return VaccinationRecordResponse(
            id=str(vaccination.id),
            pet_id=str(vaccination.pet_id),
            vaccine_name=vaccination.vaccine_name,
            vaccine_type=vaccination.vaccine_type,
            administered_date=vaccination.administered_date,
            expiration_date=vaccination.expiration_date,
            veterinarian=vaccination.veterinarian,
            clinic_name=vaccination.clinic_name,
            batch_number=vaccination.batch_number,
            notes=vaccination.notes,
            is_expired=False,  # Will be calculated in __init__
            days_until_expiration=None,  # Will be calculated in __init__
            created_at=vaccination.created_at,
            updated_at=vaccination.updated_at
        )
    
    def _history_to_response(self, history: PetMedicalHistoryEntry) -> MedicalHistoryEntryResponse:
        """Convert PetMedicalHistoryEntry to response schema."""
        return MedicalHistoryEntryResponse(
            id=str(history.id),
            pet_id=str(history.pet_id),
            entry_date=history.entry_date,
            entry_type=history.entry_type,
            description=history.description,
            veterinarian=history.veterinarian,
            clinic_name=history.clinic_name,
            diagnosis=history.diagnosis,
            treatment_plan=history.treatment_plan,
            follow_up_required=history.follow_up_required,
            follow_up_date=history.follow_up_date,
            created_at=history.created_at,
            updated_at=history.updated_at
        )

    
    # Weight Tracking Methods
    
    async def add_weight_record(
        self, user_id: str, pet_id: str, weight_data: WeightRecordCreate
    ) -> WeightRecordResponse:
        """Add a weight measurement record for a pet."""
        try:
            # Verify pet ownership
            pet = await self._get_pet_with_ownership_check(user_id, pet_id)
            
            # Create weight record
            weight_record = PetWeightRecord(
                id=uuid.uuid4(),
                pet_id=uuid.UUID(pet_id),
                weight=weight_data.weight,
                weight_unit=weight_data.weight_unit,
                measurement_date=weight_data.measurement_date,
                source=weight_data.source,
                notes=weight_data.notes
            )
            
            self.db.add(weight_record)
            
            # Update pet's current weight if this is the most recent measurement
            if weight_data.measurement_date >= (pet.updated_at.date() if pet.updated_at else date.today()):
                pet.weight = weight_data.weight
            
            await self.db.commit()
            await self.db.refresh(weight_record)
            
            return self._weight_to_response(weight_record)
            
        except HTTPException:
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error adding weight record: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add weight record"
            )
    
    async def get_weight_history(self, user_id: str, pet_id: str) -> WeightHistoryResponse:
        """Get weight history with trend analysis for a pet."""
        try:
            # Verify pet ownership
            pet = await self._get_pet_with_ownership_check(user_id, pet_id)
            
            # Get all weight records
            result = await self.db.execute(
                select(PetWeightRecord)
                .where(
                    PetWeightRecord.pet_id == uuid.UUID(pet_id),
                    PetWeightRecord.is_active == True
                )
                .order_by(PetWeightRecord.measurement_date.desc())
            )
            records = result.scalars().all()
            
            # Convert to response objects
            weight_records = [self._weight_to_response(record) for record in records]
            
            # Calculate trend analysis
            total_records = len(weight_records)
            weight_change = None
            weight_change_percent = None
            trend = None
            
            if total_records >= 2:
                # Get oldest and newest records
                oldest = weight_records[-1]
                newest = weight_records[0]
                
                weight_change = newest.weight - oldest.weight
                weight_change_percent = (weight_change / oldest.weight) * 100
                
                # Determine trend
                if abs(weight_change_percent) < 2:
                    trend = "stable"
                elif weight_change > 0:
                    trend = "increasing"
                else:
                    trend = "decreasing"
            
            return WeightHistoryResponse(
                pet_id=pet_id,
                current_weight=pet.weight,
                weight_unit="lbs",
                records=weight_records,
                total_records=total_records,
                weight_change=weight_change,
                weight_change_percent=weight_change_percent,
                trend=trend
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting weight history: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve weight history"
            )
    
    def _weight_to_response(self, weight_record: PetWeightRecord) -> WeightRecordResponse:
        """Convert PetWeightRecord to response schema."""
        return WeightRecordResponse(
            id=str(weight_record.id),
            pet_id=str(weight_record.pet_id),
            weight=weight_record.weight,
            weight_unit=weight_record.weight_unit,
            measurement_date=weight_record.measurement_date,
            source=weight_record.source,
            notes=weight_record.notes,
            created_at=weight_record.created_at,
            updated_at=weight_record.updated_at
        )
