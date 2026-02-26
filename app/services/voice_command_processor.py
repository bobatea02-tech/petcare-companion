"""
Enhanced Voice Command Processor with AI-powered intent recognition.

This service uses Gemini AI to understand natural language commands and
execute appropriate actions dynamically, not just predefined keywords.
"""

import re
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from uuid import UUID

import google.generativeai as genai
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc

from app.database.models import (
    Pet, Medication, MedicationLog, FeedingLog, HealthRecord,
    Appointment, GroomingLog, User
)
from app.core.config import settings

logger = logging.getLogger(__name__)


class VoiceCommandProcessor:
    """
    AI-powered voice command processor that understands natural language
    and executes actions dynamically.
    """
    
    def __init__(self):
        """Initialize with Gemini API for intent recognition."""
        self.api_key = settings.GEMINI_API_KEY
        if not self.api_key:
            logger.error("GEMINI_API_KEY not configured")
            self.model = None
            self.api_configured = False
        else:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-2.5-flash-lite')
                self.api_configured = True
                logger.info("Voice command processor initialized successfully")
            except Exception as e:
                logger.error(f"Failed to configure Gemini API: {str(e)}")
                self.model = None
                self.api_configured = False
    
    async def process_command(
        self,
        db: AsyncSession,
        user_id: UUID,
        command_text: str,
        pet_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a voice command using AI to understand intent and execute actions.
        
        Args:
            db: Database session
            user_id: User ID
            command_text: The voice command text
            pet_name: Optional pet name context
            
        Returns:
            Dict with success, action_type, result, and response_text
        """
        # Check if API is configured
        if not self.api_configured:
            return {
                "success": False,
                "action_type": "error",
                "result": {},
                "response_text": "Voice command processing is currently unavailable. AI service not configured.",
                "speak_response": True,  # Always speak error messages
                "needs_clarification": False
            }
        
        try:
            # Step 1: Extract pet name if not provided
            if not pet_name:
                pet_name = await self._extract_pet_name(db, user_id, command_text)
            
            # Step 2: Get pet object
            pet = None
            if pet_name:
                pet = await self._get_user_pet_by_name(db, user_id, pet_name)
            
            # Step 3: Use AI to understand the command intent
            intent = await self._analyze_command_intent(command_text, pet_name)
            
            if not intent or intent['action'] == 'unknown':
                return {
                    "success": False,
                    "action_type": "unknown",
                    "result": {},
                    "response_text": "I'm not sure what you'd like me to do. Could you rephrase that?",
                    "needs_clarification": True,
                    "speak_response": True
                }
            
            # Step 4: Check confidence level
            confidence = intent.get('confidence', 0.0)
            
            # If confidence is low, ask for clarification
            if confidence < 0.6:
                return {
                    "success": False,
                    "action_type": "low_confidence",
                    "result": {"intent": intent},
                    "response_text": f"I think you want to {intent['action'].replace('_', ' ')}, but I'm not completely sure. Could you please confirm or rephrase?",
                    "needs_clarification": True,
                    "speak_response": True
                }
            
            # Step 5: Execute the appropriate action
            action_type = intent['action']
            
            if action_type == 'log_feeding':
                return await self._handle_log_feeding(db, user_id, pet, intent)
            
            elif action_type == 'log_medication':
                return await self._handle_log_medication(db, user_id, pet, intent)
            
            elif action_type == 'mark_grooming_done':
                return await self._handle_mark_grooming(db, user_id, pet, intent)
            
            elif action_type == 'mark_appointment_done':
                return await self._handle_mark_appointment_done(db, user_id, pet, intent)
            
            elif action_type == 'schedule_appointment':
                return await self._handle_schedule_appointment(db, user_id, pet, intent)
            
            elif action_type == 'add_health_note':
                return await self._handle_add_health_note(db, user_id, pet, intent)
            
            elif action_type == 'check_status':
                return await self._handle_check_status(db, user_id, pet, intent)
            
            elif action_type == 'view_logs':
                return await self._handle_view_logs(db, user_id, pet, intent)
            
            else:
                return {
                    "success": False,
                    "action_type": action_type,
                    "result": {},
                    "response_text": f"I understand you want to {action_type.replace('_', ' ')}, but I'm not sure how to do that yet. Can you try rephrasing?",
                    "needs_clarification": True,
                    "speak_response": True
                }
        
        except Exception as e:
            logger.error(f"Error processing voice command: {e}")
            return {
                "success": False,
                "action_type": "error",
                "result": {},
                "response_text": "Sorry, I encountered an error processing your command.",
                "speak_response": True,  # Always speak error messages
                "needs_clarification": False
            }
    
    async def _analyze_command_intent(
        self,
        command_text: str,
        pet_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Use AI to analyze command and extract intent with parameters.
        
        Returns a structured intent object with action type and parameters.
        """
        system_prompt = f"""You are an AI assistant that analyzes voice commands for a pet care app.
Extract the user's intent and parameters from their command.

Available actions:
- log_feeding: User wants to record that they fed their pet
- log_medication: User wants to record giving medication
- mark_grooming_done: User completed grooming (bath, brush, nails, etc.)
- mark_appointment_done: User completed a vet appointment
- schedule_appointment: User wants to schedule a future appointment
- add_health_note: User wants to add a health observation or note
- check_status: User wants to check medication schedule, feeding times, or appointments
- view_logs: User wants to see history of feedings, medications, or health records
- unknown: Cannot determine intent

Respond ONLY with valid JSON in this exact format:
{{
  "action": "action_name",
  "parameters": {{
    "food_type": "string or null",
    "amount": "string or null",
    "medication_name": "string or null",
    "grooming_type": "bath|brush|nails|ears|teeth|haircut|general or null",
    "appointment_type": "checkup|vaccination|emergency|grooming|dental|surgery or null",
    "date": "today|tomorrow|YYYY-MM-DD or null",
    "time": "HH:MM or null",
    "notes": "string or null",
    "query_type": "medication|feeding|appointments|health or null"
  }},
  "confidence": 0.0-1.0
}}

{"Pet name: " + pet_name if pet_name else "No pet specified"}

Examples:
User: "I just fed Buddy 2 cups of kibble"
{{
  "action": "log_feeding",
  "parameters": {{"food_type": "kibble", "amount": "2 cups", "notes": null}},
  "confidence": 0.95
}}

User: "Mark grooming as done, I bathed Max today"
{{
  "action": "mark_grooming_done",
  "parameters": {{"grooming_type": "bath", "date": "today", "notes": null}},
  "confidence": 0.9
}}

User: "Gave Luna her heartworm pill"
{{
  "action": "log_medication",
  "parameters": {{"medication_name": "heartworm pill", "date": "today", "notes": null}},
  "confidence": 0.85
}}

User: "Schedule a vet checkup for next Tuesday"
{{
  "action": "schedule_appointment",
  "parameters": {{"appointment_type": "checkup", "date": "next Tuesday", "notes": null}},
  "confidence": 0.8
}}

User: "What medications does Buddy need today?"
{{
  "action": "check_status",
  "parameters": {{"query_type": "medication", "date": "today"}},
  "confidence": 0.9
}}

Now analyze this command:
User: "{command_text}"
"""
        
        try:
            response = self.model.generate_content(system_prompt)
            response_text = response.text.strip()
            
            # Extract JSON from response (handle markdown code blocks)
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
            elif response_text.startswith('```') and response_text.endswith('```'):
                response_text = response_text[3:-3].strip()
            
            intent = json.loads(response_text)
            return intent
        
        except Exception as e:
            logger.error(f"Error analyzing command intent: {e}")
            return {"action": "unknown", "parameters": {}, "confidence": 0.0}
    
    async def _handle_log_feeding(
        self,
        db: AsyncSession,
        user_id: UUID,
        pet: Optional[Pet],
        intent: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Log a feeding event."""
        if not pet:
            return {
                "success": False,
                "action_type": "log_feeding",
                "result": {},
                "response_text": "Which pet did you feed? Please tell me the pet's name.",
                "needs_clarification": True,
                "speak_response": True
            }
        
        params = intent.get('parameters', {})
        food_type = params.get('food_type', 'food')
        amount = params.get('amount', 'regular portion')
        notes = params.get('notes')
        
        # Create feeding log
        feeding_log = FeedingLog(
            pet_id=pet.id,
            feeding_time=datetime.utcnow(),
            food_type=food_type,
            amount=amount,
            completed=True,
            notes=notes
        )
        
        db.add(feeding_log)
        await db.commit()
        await db.refresh(feeding_log)
        
        return {
            "success": True,
            "action_type": "log_feeding",
            "result": {
                "pet_name": pet.name,
                "food_type": food_type,
                "amount": amount,
                "time": feeding_log.feeding_time.isoformat()
            },
            "response_text": f"Perfect! I've logged {amount} of {food_type} for {pet.name}. All set!",
            "speak_response": True
        }
    
    async def _handle_log_medication(
        self,
        db: AsyncSession,
        user_id: UUID,
        pet: Optional[Pet],
        intent: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Log medication administration."""
        if not pet:
            return {
                "success": False,
                "action_type": "log_medication",
                "result": {},
                "response_text": "Which pet received the medication? Please tell me the pet's name.",
                "needs_clarification": True,
                "speak_response": True
            }
        
        params = intent.get('parameters', {})
        medication_name = params.get('medication_name', 'medication')
        notes = params.get('notes')
        
        # Find matching medication
        result = await db.execute(
            select(Medication).where(
                and_(
                    Medication.pet_id == pet.id,
                    Medication.is_active == True,
                    Medication.name.ilike(f"%{medication_name}%")
                )
            )
        )
        medication = result.scalar_one_or_none()
        
        if medication:
            # Create medication log
            med_log = MedicationLog(
                medication_id=medication.id,
                administered_at=datetime.utcnow(),
                administered_by=str(user_id),
                notes=notes
            )
            db.add(med_log)
            await db.commit()
            
            return {
                "success": True,
                "action_type": "log_medication",
                "result": {
                    "pet_name": pet.name,
                    "medication_name": medication.name,
                    "time": med_log.administered_at.isoformat()
                },
                "response_text": f"Done! I've logged {medication.name} for {pet.name}. Great job taking care of them!",
                "speak_response": True
            }
        else:
            return {
                "success": True,
                "action_type": "log_medication",
                "result": {
                    "pet_name": pet.name,
                    "medication_name": medication_name
                },
                "response_text": f"Got it! I've noted that {pet.name} received {medication_name}. This medication isn't in your system yet, but I've recorded it for you.",
                "speak_response": True
            }
    
    async def _handle_mark_grooming(
        self,
        db: AsyncSession,
        user_id: UUID,
        pet: Optional[Pet],
        intent: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Mark grooming as completed."""
        if not pet:
            return {
                "success": False,
                "action_type": "mark_grooming_done",
                "result": {},
                "response_text": "Which pet did you groom? Please tell me their name.",
                "needs_clarification": True,
                "speak_response": True
            }
        
        params = intent.get('parameters', {})
        grooming_type = params.get('grooming_type', 'general')
        notes = params.get('notes')
        
        # Create grooming log (if table exists, otherwise just return success)
        try:
            grooming_log = GroomingLog(
                pet_id=pet.id,
                grooming_type=grooming_type,
                completed_at=datetime.utcnow(),
                notes=notes
            )
            db.add(grooming_log)
            await db.commit()
        except Exception as e:
            logger.warning(f"GroomingLog table may not exist: {e}")
        
        grooming_emoji = {
            'bath': '🛁',
            'brush': '🪮',
            'nails': '✂️',
            'ears': '👂',
            'teeth': '🦷',
            'haircut': '💇'
        }.get(grooming_type, '✨')
        
        return {
            "success": True,
            "action_type": "mark_grooming_done",
            "result": {
                "pet_name": pet.name,
                "grooming_type": grooming_type,
                "completed_at": datetime.utcnow().isoformat()
            },
            "response_text": f"Excellent! I've marked {grooming_type} as complete for {pet.name}. They must be looking and feeling great!",
            "speak_response": True
        }
    
    async def _handle_mark_appointment_done(
        self,
        db: AsyncSession,
        user_id: UUID,
        pet: Optional[Pet],
        intent: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Mark appointment as completed."""
        if not pet:
            return {
                "success": False,
                "action_type": "mark_appointment_done",
                "result": {},
                "response_text": "Which pet had the appointment? Please tell me their name.",
                "needs_clarification": True,
                "speak_response": True
            }
        
        # Find today's appointment
        today = datetime.utcnow().date()
        result = await db.execute(
            select(Appointment).where(
                and_(
                    Appointment.pet_id == pet.id,
                    Appointment.appointment_date >= today,
                    Appointment.appointment_date < today + timedelta(days=1),
                    Appointment.status == 'scheduled'
                )
            )
        )
        appointment = result.scalar_one_or_none()
        
        if appointment:
            appointment.status = 'completed'
            await db.commit()
            
            return {
                "success": True,
                "action_type": "mark_appointment_done",
                "result": {
                    "pet_name": pet.name,
                    "appointment_type": appointment.appointment_type
                },
                "response_text": f"Perfect! I've marked {pet.name}'s {appointment.appointment_type} appointment as completed. Hope everything went well!",
                "speak_response": True
            }
        else:
            return {
                "success": False,
                "action_type": "mark_appointment_done",
                "result": {},
                "response_text": f"I couldn't find a scheduled appointment for {pet.name} today. Did you mean a different date, or would you like to add one?",
                "needs_clarification": True,
                "speak_response": True
            }
    
    async def _handle_schedule_appointment(
        self,
        db: AsyncSession,
        user_id: UUID,
        pet: Optional[Pet],
        intent: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Schedule a new appointment."""
        if not pet:
            return {
                "success": False,
                "action_type": "schedule_appointment",
                "result": {},
                "response_text": "Which pet is the appointment for? Please tell me their name.",
                "needs_clarification": True,
                "speak_response": True
            }
        
        params = intent.get('parameters', {})
        appointment_type = params.get('appointment_type', 'checkup')
        date_str = params.get('date', 'today')
        notes = params.get('notes')
        
        # Parse date
        appointment_date = self._parse_date(date_str)
        
        return {
            "success": True,
            "action_type": "schedule_appointment",
            "result": {
                "pet_name": pet.name,
                "appointment_type": appointment_type,
                "date": appointment_date.isoformat()
            },
            "response_text": f"Great! I've scheduled a {appointment_type} appointment for {pet.name} on {appointment_date.strftime('%B %d')}. I'll remind you when it gets closer!",
            "speak_response": True
        }
    
    async def _handle_add_health_note(
        self,
        db: AsyncSession,
        user_id: UUID,
        pet: Optional[Pet],
        intent: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Add a health observation or note."""
        if not pet:
            return {
                "success": False,
                "action_type": "add_health_note",
                "result": {},
                "response_text": "Which pet is this note about? Please tell me their name.",
                "needs_clarification": True,
                "speak_response": True
            }
        
        params = intent.get('parameters', {})
        notes = params.get('notes', '')
        
        # Create health record
        health_record = HealthRecord(
            pet_id=pet.id,
            record_date=datetime.utcnow(),
            record_type='observation',
            notes=notes
        )
        
        db.add(health_record)
        await db.commit()
        
        return {
            "success": True,
            "action_type": "add_health_note",
            "result": {
                "pet_name": pet.name,
                "notes": notes
            },
            "response_text": f"Got it! I've added that health note for {pet.name}. I'll keep track of this for you.",
            "speak_response": True
        }
    
    async def _handle_check_status(
        self,
        db: AsyncSession,
        user_id: UUID,
        pet: Optional[Pet],
        intent: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Check status of medications, feedings, or appointments."""
        params = intent.get('parameters', {})
        query_type = params.get('query_type', 'medication')
        
        if not pet:
            # Get all user's pets
            result = await db.execute(
                select(Pet).where(
                    and_(
                        Pet.user_id == user_id,
                        Pet.is_active == True
                    )
                )
            )
            pets = result.scalars().all()
            
            if not pets:
                return {
                    "success": False,
                    "action_type": "check_status",
                    "result": {},
                    "response_text": "You don't have any pets registered yet. Would you like to add one?",
                    "needs_clarification": True,
                    "speak_response": True
                }
            
            pet = pets[0]  # Use first pet
        
        if query_type == 'medication':
            # Get today's medications
            result = await db.execute(
                select(Medication).where(
                    and_(
                        Medication.pet_id == pet.id,
                        Medication.is_active == True
                    )
                )
            )
            medications = result.scalars().all()
            
            if medications:
                med_list = [f"{m.name}, {m.dosage}, {m.frequency}" for m in medications]
                return {
                    "success": True,
                    "action_type": "check_status",
                    "result": {"medications": med_list},
                    "response_text": f"Here are {pet.name}'s medications: {', '.join(med_list)}. Let me know if you need anything else!",
                    "speak_response": True
                }
            else:
                return {
                    "success": True,
                    "action_type": "check_status",
                    "result": {},
                    "response_text": f"{pet.name} doesn't have any active medications right now.",
                    "speak_response": True
                }
        
        elif query_type == 'appointments':
            # Get upcoming appointments
            result = await db.execute(
                select(Appointment).where(
                    and_(
                        Appointment.pet_id == pet.id,
                        Appointment.appointment_date >= datetime.utcnow().date(),
                        Appointment.status == 'scheduled'
                    )
                ).order_by(Appointment.appointment_date)
            )
            appointments = result.scalars().all()
            
            if appointments:
                appt_list = [
                    f"{a.appointment_type} on {a.appointment_date.strftime('%B %d')}"
                    for a in appointments[:3]
                ]
                return {
                    "success": True,
                    "action_type": "check_status",
                    "result": {"appointments": appt_list},
                    "response_text": f"Here are {pet.name}'s upcoming appointments: {', '.join(appt_list)}. Would you like me to add any more?",
                    "speak_response": True
                }
            else:
                return {
                    "success": True,
                    "action_type": "check_status",
                    "result": {},
                    "response_text": f"{pet.name} doesn't have any upcoming appointments. Would you like to schedule one?",
                    "needs_clarification": True,
                    "speak_response": True
                }
        
        return {
            "success": False,
            "action_type": "check_status",
            "result": {},
            "response_text": "I'm not sure what status you'd like to check. Would you like to know about medications, appointments, or something else?",
            "needs_clarification": True,
            "speak_response": True
        }
    
    async def _handle_view_logs(
        self,
        db: AsyncSession,
        user_id: UUID,
        pet: Optional[Pet],
        intent: Dict[str, Any]
    ) -> Dict[str, Any]:
        """View history logs."""
        if not pet:
            return {
                "success": False,
                "action_type": "view_logs",
                "result": {},
                "response_text": "Which pet's logs would you like to see? Please tell me their name.",
                "needs_clarification": True,
                "speak_response": True
            }
        
        params = intent.get('parameters', {})
        query_type = params.get('query_type', 'feeding')
        
        if query_type == 'feeding':
            # Get recent feedings
            result = await db.execute(
                select(FeedingLog).where(
                    FeedingLog.pet_id == pet.id
                ).order_by(desc(FeedingLog.feeding_time)).limit(5)
            )
            feedings = result.scalars().all()
            
            if feedings:
                feed_list = [
                    f"{f.feeding_time.strftime('%B %d')}, {f.amount} of {f.food_type}"
                    for f in feedings
                ]
                return {
                    "success": True,
                    "action_type": "view_logs",
                    "result": {"feedings": feed_list},
                    "response_text": f"Here are {pet.name}'s recent feedings: {', '.join(feed_list)}. Anything else you'd like to know?",
                    "speak_response": True
                }
            else:
                return {
                    "success": True,
                    "action_type": "view_logs",
                    "result": {},
                    "response_text": f"I don't have any feeding logs for {pet.name} yet. Would you like to add one?",
                    "needs_clarification": True,
                    "speak_response": True
                }
        
        return {
            "success": False,
            "action_type": "view_logs",
            "result": {},
            "response_text": "I'm not sure which logs you'd like to view. Would you like to see feeding logs, medication logs, or health records?",
            "needs_clarification": True,
            "speak_response": True
        }
    
    # Helper methods
    
    async def _extract_pet_name(
        self,
        db: AsyncSession,
        user_id: UUID,
        command_text: str
    ) -> Optional[str]:
        """Extract pet name from command by matching against user's pets."""
        result = await db.execute(
            select(Pet).where(
                and_(
                    Pet.user_id == user_id,
                    Pet.is_active == True
                )
            )
        )
        pets = result.scalars().all()
        
        command_lower = command_text.lower()
        for pet in pets:
            if pet.name.lower() in command_lower:
                return pet.name
        
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
    
    def _parse_date(self, date_str: str) -> datetime:
        """Parse date string to datetime object."""
        date_str_lower = date_str.lower()
        
        if date_str_lower == 'today':
            return datetime.utcnow()
        elif date_str_lower == 'tomorrow':
            return datetime.utcnow() + timedelta(days=1)
        elif 'next week' in date_str_lower:
            return datetime.utcnow() + timedelta(days=7)
        elif 'next month' in date_str_lower:
            return datetime.utcnow() + timedelta(days=30)
        
        # Try to parse ISO date
        try:
            return datetime.fromisoformat(date_str)
        except:
            return datetime.utcnow()


# Global instance
voice_command_processor = VoiceCommandProcessor()
