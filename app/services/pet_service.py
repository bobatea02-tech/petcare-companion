"""
Pet profile management service for CRUD operations and business logic.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, desc
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from datetime import datetime, date, timedelta, timezone
import uuid
import json

from app.database.models import Pet, User, PetProfileHistory
from app.schemas.pets import PetCreate, PetUpdate, PetResponse, PetListResponse, PetHistoryResponse


class PetService:
    """Service class for pet profile management operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_pet_profile(self, user_id: str, pet_data: PetCreate) -> PetResponse:
        """
        Create a new pet profile for the user.
        
        Requirements validated:
        - 2.1: Pet profile creation with required fields (species, name, age)
        - 2.4: Version history tracking for profile changes
        """
        try:
            # Verify user exists
            user_result = await self.db.execute(
                select(User).where(User.id == uuid.UUID(user_id))
            )
            user = user_result.scalar_one_or_none()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            # Create new pet profile
            new_pet = Pet(
                user_id=uuid.UUID(user_id),
                name=pet_data.name,
                species=pet_data.species,
                birth_date=pet_data.birth_date,
                breed=pet_data.breed,
                weight=pet_data.weight,
                gender=pet_data.gender,
                medical_conditions=pet_data.medical_conditions,
                allergies=pet_data.allergies,
                behavioral_notes=pet_data.behavioral_notes,
                is_active=True
            )
            
            self.db.add(new_pet)
            await self.db.flush()  # Get the ID without committing
            
            # Create history entry for profile creation
            await self._create_history_entry(
                pet_id=str(new_pet.id),
                user_id=user_id,
                change_type="created",
                changes=pet_data.model_dump(exclude_unset=True),
                previous_values=None
            )
            
            await self.db.commit()
            await self.db.refresh(new_pet)
            
            return self._pet_to_response(new_pet)
            
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create pet profile: {str(e)}"
            )
    
    async def get_pet_profile(self, user_id: str, pet_id: str) -> PetResponse:
        """
        Get a specific pet profile by ID.
        
        Requirements validated:
        - 2.1: Pet profile retrieval with all stored information
        """
        try:
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
            
            return self._pet_to_response(pet)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve pet profile: {str(e)}"
            )
    
    async def get_user_pets(self, user_id: str, include_inactive: bool = False) -> PetListResponse:
        """
        Get all pets for a user.
        
        Requirements validated:
        - 2.1: Pet profile listing for user
        """
        try:
            query = select(Pet).where(Pet.user_id == uuid.UUID(user_id))
            
            if not include_inactive:
                query = query.where(Pet.is_active == True)
            
            query = query.order_by(desc(Pet.created_at))
            
            result = await self.db.execute(query)
            pets = result.scalars().all()
            
            pet_responses = [self._pet_to_response(pet) for pet in pets]
            active_count = sum(1 for pet in pets if pet.is_active)
            
            return PetListResponse(
                pets=pet_responses,
                total_count=len(pets),
                active_count=active_count
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve pets: {str(e)}"
            )
    
    async def update_pet_profile(self, user_id: str, pet_id: str, pet_data: PetUpdate) -> PetResponse:
        """
        Update an existing pet profile.
        
        Requirements validated:
        - 2.4: Pet profile updates with validation
        - 2.5: Version history tracking for profile changes
        """
        try:
            # Get current pet data
            result = await self.db.execute(
                select(Pet).where(
                    and_(
                        Pet.id == uuid.UUID(pet_id),
                        Pet.user_id == uuid.UUID(user_id)
                    )
                )
            )
            pet = result.scalar_one_or_none()
            
            if not pet:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Pet not found"
                )
            
            # Store previous values for history
            previous_values = {
                "name": pet.name,
                "species": pet.species,
                "birth_date": pet.birth_date.isoformat() if pet.birth_date else None,
                "breed": pet.breed,
                "weight": pet.weight,
                "gender": pet.gender,
                "medical_conditions": pet.medical_conditions,
                "allergies": pet.allergies,
                "behavioral_notes": pet.behavioral_notes,
                "is_active": pet.is_active
            }
            
            # Update only provided fields
            update_data = pet_data.model_dump(exclude_unset=True)
            changes = {}
            
            for field, value in update_data.items():
                if hasattr(pet, field):
                    old_value = getattr(pet, field)
                    if old_value != value:
                        setattr(pet, field, value)
                        changes[field] = {
                            "old": old_value.isoformat() if isinstance(old_value, date) else old_value,
                            "new": value.isoformat() if isinstance(value, date) else value
                        }
            
            if changes:
                pet.updated_at = datetime.now(timezone.utc)
                
                # Create history entry
                await self._create_history_entry(
                    pet_id=pet_id,
                    user_id=user_id,
                    change_type="updated",
                    changes=changes,
                    previous_values=previous_values
                )
            
            await self.db.commit()
            await self.db.refresh(pet)
            
            return self._pet_to_response(pet)
            
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update pet profile: {str(e)}"
            )
    
    async def delete_pet_profile(self, user_id: str, pet_id: str, soft_delete: bool = True) -> bool:
        """
        Delete a pet profile (soft delete by default).
        
        Requirements validated:
        - 2.5: Pet profile deletion with history tracking
        """
        try:
            result = await self.db.execute(
                select(Pet).where(
                    and_(
                        Pet.id == uuid.UUID(pet_id),
                        Pet.user_id == uuid.UUID(user_id)
                    )
                )
            )
            pet = result.scalar_one_or_none()
            
            if not pet:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Pet not found"
                )
            
            if soft_delete:
                # Soft delete - mark as inactive
                pet.is_active = False
                pet.updated_at = datetime.now(timezone.utc)
                
                await self._create_history_entry(
                    pet_id=pet_id,
                    user_id=user_id,
                    change_type="soft_deleted",
                    changes={"is_active": {"old": True, "new": False}},
                    previous_values={"is_active": True}
                )
            else:
                # Hard delete - remove from database
                await self._create_history_entry(
                    pet_id=pet_id,
                    user_id=user_id,
                    change_type="hard_deleted",
                    changes={},
                    previous_values={}
                )
                
                await self.db.delete(pet)
            
            await self.db.commit()
            return True
            
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete pet profile: {str(e)}"
            )
    
    async def get_pet_history(self, user_id: str, pet_id: str) -> PetHistoryResponse:
        """
        Get version history for a pet profile.
        
        Requirements validated:
        - 2.5: Version history tracking retrieval
        """
        try:
            # Verify pet belongs to user
            result = await self.db.execute(
                select(Pet).where(
                    and_(
                        Pet.id == uuid.UUID(pet_id),
                        Pet.user_id == uuid.UUID(user_id)
                    )
                )
            )
            pet = result.scalar_one_or_none()
            
            if not pet:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Pet not found"
                )
            
            # Get history entries
            history_result = await self.db.execute(
                select(PetProfileHistory)
                .where(PetProfileHistory.pet_id == uuid.UUID(pet_id))
                .order_by(desc(PetProfileHistory.changed_at))
            )
            history_entries = history_result.scalars().all()
            
            return PetHistoryResponse(
                pet_id=pet_id,
                history=[
                    {
                        "id": str(entry.id),
                        "pet_id": str(entry.pet_id),
                        "changed_at": entry.changed_at,
                        "changed_by": str(entry.changed_by),
                        "change_type": entry.change_type,
                        "changes": json.loads(entry.changes) if entry.changes else {},
                        "previous_values": json.loads(entry.previous_values) if entry.previous_values else None
                    }
                    for entry in history_entries
                ],
                total_changes=len(history_entries)
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve pet history: {str(e)}"
            )
    
    async def _create_history_entry(
        self, 
        pet_id: str, 
        user_id: str, 
        change_type: str, 
        changes: Dict[str, Any], 
        previous_values: Optional[Dict[str, Any]]
    ) -> None:
        """Create a history entry for pet profile changes."""
        
        # Convert date objects to strings for JSON serialization
        def serialize_for_json(obj):
            if isinstance(obj, dict):
                return {k: serialize_for_json(v) for k, v in obj.items()}
            elif isinstance(obj, (date, datetime)):
                return obj.isoformat()
            elif isinstance(obj, list):
                return [serialize_for_json(item) for item in obj]
            else:
                return obj
        
        serialized_changes = serialize_for_json(changes) if changes else None
        serialized_previous = serialize_for_json(previous_values) if previous_values else None
        
        history_entry = PetProfileHistory(
            pet_id=uuid.UUID(pet_id),
            changed_by=uuid.UUID(user_id),
            change_type=change_type,
            changes=json.dumps(serialized_changes) if serialized_changes else None,
            previous_values=json.dumps(serialized_previous) if serialized_previous else None
        )
        
        self.db.add(history_entry)
    
    def _pet_to_response(self, pet: Pet) -> PetResponse:
        """Convert Pet model to PetResponse schema."""
        return PetResponse(
            id=str(pet.id),
            user_id=str(pet.user_id),
            name=pet.name,
            species=pet.species,
            birth_date=pet.birth_date,
            breed=pet.breed,
            weight=pet.weight,
            gender=pet.gender,
            medical_conditions=pet.medical_conditions,
            allergies=pet.allergies,
            behavioral_notes=pet.behavioral_notes,
            is_active=pet.is_active,
            created_at=pet.created_at,
            updated_at=pet.updated_at
        )