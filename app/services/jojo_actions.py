"""
JoJo Actions Service - Allows JoJo to execute tasks and update data.
"""

import json
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.database.models import Pet


class JoJoActionsService:
    """
    Service for JoJo to execute actions based on user commands.
    
    Capabilities:
    - Mark grooming tasks as complete
    - Add custom calendar events
    - Update pet care records
    - Schedule reminders
    """
    
    def __init__(self):
        """Initialize JoJo Actions Service."""
        pass
    
    async def parse_and_execute_command(
        self,
        db: AsyncSession,
        user_id: UUID,
        message: str,
        pet_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Parse user message for actionable commands and execute them.
        
        Returns:
            Dict with:
            - action_taken: bool
            - action_type: str (grooming_complete, event_added, etc.)
            - action_details: dict
            - response_text: str (what JoJo should say)
        """
        message_lower = message.lower()
        
        # Get pet if mentioned
        pet = None
        if pet_name:
            pet = await self._get_user_pet_by_name(db, user_id, pet_name)
        
        # Check for grooming completion
        if self._is_grooming_completion(message_lower):
            return await self._handle_grooming_completion(db, user_id, pet, message)
        
        # Check for medication taken
        if self._is_medication_taken(message_lower):
            return await self._handle_medication_taken(db, user_id, pet, message)
        
        # Check for appointment scheduling
        if self._is_appointment_request(message_lower):
            return await self._handle_appointment_request(db, user_id, pet, message)
        
        # Check for reminder creation
        if self._is_reminder_request(message_lower):
            return await self._handle_reminder_creation(db, user_id, pet, message)
        
        # No action detected
        return {
            "action_taken": False,
            "action_type": None,
            "action_details": {},
            "response_text": None
        }
    
    def _is_grooming_completion(self, message: str) -> bool:
        """Check if message indicates grooming was completed."""
        grooming_keywords = ['groomed', 'bathed', 'brushed', 'trimmed nails', 'cleaned ears', 'haircut']
        completion_keywords = ['today', 'just', 'finished', 'done', 'completed', 'did']
        
        has_grooming = any(keyword in message for keyword in grooming_keywords)
        has_completion = any(keyword in message for keyword in completion_keywords)
        
        return has_grooming and has_completion
    
    def _is_medication_taken(self, message: str) -> bool:
        """Check if message indicates medication was taken."""
        med_keywords = ['gave', 'medication', 'medicine', 'pill', 'dose']
        completion_keywords = ['today', 'just', 'gave', 'taken', 'administered']
        
        has_med = any(keyword in message for keyword in med_keywords)
        has_completion = any(keyword in message for keyword in completion_keywords)
        
        return has_med and has_completion
    
    def _is_appointment_request(self, message: str) -> bool:
        """Check if message is requesting to schedule an appointment."""
        appointment_keywords = ['schedule', 'book', 'appointment', 'vet visit', 'checkup']
        return any(keyword in message for keyword in appointment_keywords)
    
    def _is_reminder_request(self, message: str) -> bool:
        """Check if message is requesting to set a reminder."""
        reminder_keywords = ['remind me', 'set reminder', 'don\'t forget', 'remember to']
        return any(keyword in message for keyword in reminder_keywords)
    
    async def _handle_grooming_completion(
        self,
        db: AsyncSession,
        user_id: UUID,
        pet: Optional[Pet],
        message: str
    ) -> Dict[str, Any]:
        """Handle grooming completion command."""
        if not pet:
            return {
                "action_taken": False,
                "action_type": "grooming_complete",
                "action_details": {},
                "response_text": "Which pet did you groom? 🐕"
            }
        
        # Determine grooming type
        grooming_type = "grooming"
        if "bath" in message.lower():
            grooming_type = "bath"
        elif "brush" in message.lower():
            grooming_type = "brush"
        elif "nail" in message.lower():
            grooming_type = "nails"
        elif "ear" in message.lower():
            grooming_type = "ears"
        elif "haircut" in message.lower() or "trim" in message.lower():
            grooming_type = "haircut"
        elif "teeth" in message.lower() or "dental" in message.lower():
            grooming_type = "teeth"
        
        return {
            "action_taken": True,
            "action_type": "grooming_complete",
            "action_details": {
                "pet_id": str(pet.id),
                "pet_name": pet.name,
                "grooming_type": grooming_type,
                "completed_date": datetime.utcnow().isoformat()
            },
            "response_text": f"Great job! I've marked {pet.name}'s {grooming_type} as complete for today. 🎉 {pet.name} must be looking and feeling fresh!"
        }
    
    async def _handle_medication_taken(
        self,
        db: AsyncSession,
        user_id: UUID,
        pet: Optional[Pet],
        message: str
    ) -> Dict[str, Any]:
        """Handle medication taken command."""
        if not pet:
            return {
                "action_taken": False,
                "action_type": "medication_taken",
                "action_details": {},
                "response_text": "Which pet took their medication? 💊"
            }
        
        return {
            "action_taken": True,
            "action_type": "medication_taken",
            "action_details": {
                "pet_id": str(pet.id),
                "pet_name": pet.name,
                "taken_date": datetime.utcnow().isoformat()
            },
            "response_text": f"Perfect! I've logged {pet.name}'s medication for today. 💊 Keep up the great care!"
        }
    
    async def _handle_appointment_request(
        self,
        db: AsyncSession,
        user_id: UUID,
        pet: Optional[Pet],
        message: str
    ) -> Dict[str, Any]:
        """Handle appointment scheduling request."""
        if not pet:
            return {
                "action_taken": False,
                "action_type": "appointment_request",
                "action_details": {},
                "response_text": "Which pet needs an appointment? 🏥"
            }
        
        # Extract date if mentioned
        date_match = self._extract_date_from_message(message)
        
        return {
            "action_taken": True,
            "action_type": "appointment_request",
            "action_details": {
                "pet_id": str(pet.id),
                "pet_name": pet.name,
                "requested_date": date_match
            },
            "response_text": f"I can help you schedule an appointment for {pet.name}! Would you like me to add it to your calendar? Just let me know the date and time. 📅"
        }
    
    async def _handle_reminder_creation(
        self,
        db: AsyncSession,
        user_id: UUID,
        pet: Optional[Pet],
        message: str
    ) -> Dict[str, Any]:
        """Handle reminder creation request."""
        # Extract what to remind about
        reminder_text = message
        date_match = self._extract_date_from_message(message)
        
        return {
            "action_taken": True,
            "action_type": "reminder_created",
            "action_details": {
                "pet_id": str(pet.id) if pet else None,
                "pet_name": pet.name if pet else None,
                "reminder_text": reminder_text,
                "reminder_date": date_match
            },
            "response_text": f"Got it! I'll remind you about that. 🔔"
        }
    
    def _extract_date_from_message(self, message: str) -> Optional[str]:
        """Extract date from message (simple implementation)."""
        message_lower = message.lower()
        
        if "today" in message_lower:
            return datetime.utcnow().date().isoformat()
        elif "tomorrow" in message_lower:
            return (datetime.utcnow() + timedelta(days=1)).date().isoformat()
        elif "next week" in message_lower:
            return (datetime.utcnow() + timedelta(days=7)).date().isoformat()
        
        # Try to find date patterns (MM/DD, DD/MM, etc.)
        date_patterns = [
            r'\d{1,2}/\d{1,2}',
            r'\d{1,2}-\d{1,2}',
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, message)
            if match:
                return match.group(0)
        
        return None
    
    async def _get_user_pet_by_name(
        self,
        db: AsyncSession,
        user_id: UUID,
        pet_name: str
    ) -> Optional[Pet]:
        """Get pet by name for specific user."""
        result = await db.execute(
            select(Pet).where(
                and_(
                    Pet.user_id == user_id,
                    Pet.name.ilike(pet_name),
                    Pet.is_active == True
                )
            )
        )
        return result.scalar_one_or_none()
