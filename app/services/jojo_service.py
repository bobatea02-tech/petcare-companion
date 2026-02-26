"""
JoJo AI Assistant Service - Context-aware pet care chatbot with Gemini integration.
"""

import os
import json
import re
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from uuid import UUID, uuid4

import google.generativeai as genai
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.database.models import (
    ConversationHistory,
    UserQuestionQuota,
    Pet,
    Medication,
    MedicationLog,
    HealthRecord,
    User
)

logger = logging.getLogger(__name__)


class JoJoService:
    """
    JoJo - Friendly AI pet care assistant with conversation memory and context awareness.
    
    Features:
    - Gemini API integration for natural language responses
    - Cross-session conversation persistence
    - Smart health data retrieval (only when needed)
    - Pet name detection and validation
    - Rate limiting (5 questions per hour per user)
    - Strict pet care topic focus
    """
    
    QUESTIONS_PER_HOUR = 5
    CONVERSATION_MESSAGE_LIMIT = 10  # Last 10 message pairs
    
    def __init__(self):
        """Initialize JoJo service with Gemini API."""
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            # Log the error but don't crash - allow graceful degradation
            logger.error("GEMINI_API_KEY not found in environment variables")
            self.model = None
            self.api_configured = False
        else:
            try:
                genai.configure(api_key=self.api_key)
                # Use gemini-2.5-flash-lite for better free tier availability
                self.model = genai.GenerativeModel('gemini-2.5-flash-lite')
                self.api_configured = True
                logger.info("JoJo service initialized successfully with Gemini API")
            except Exception as e:
                logger.error(f"Failed to configure Gemini API: {str(e)}")
                self.model = None
                self.api_configured = False
        
    async def chat(
        self,
        db: AsyncSession,
        user_id: UUID,
        message: str,
        conversation_id: Optional[UUID] = None,
        pet_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a chat message from the user.
        
        Args:
            db: Database session
            user_id: User ID
            message: User's message
            conversation_id: Optional conversation ID for continuing conversations
            pet_name: Optional pet name mentioned by user
            
        Returns:
            Dict with response, conversation_id, questions_remaining, pet_identified
        """
        # Get or create conversation first (needed for conversation_id in all responses)
        conversation = await self._get_or_create_conversation(
            db, user_id, conversation_id
        )
        
        # Check if API is configured
        if not self.api_configured:
            return {
                "response": "I'm sorry, but I'm currently unable to respond. The AI service is not properly configured. Please contact support or check that the GEMINI_API_KEY is set in the environment variables.",
                "conversation_id": str(conversation.id),
                "questions_remaining": 0,
                "pet_identified": False,
                "api_error": True
            }
        
        # Check rate limit
        questions_remaining = await self._check_rate_limit(db, user_id)
        if questions_remaining <= 0:
            return {
                "response": "You've reached your question limit for this hour. JoJo will be ready to help again soon! Your quota resets in a bit.",
                "conversation_id": str(conversation.id),
                "questions_remaining": 0,
                "pet_identified": False,
                "quota_exceeded": True
            }
        
        # Extract pet name from message if not provided
        if not pet_name:
            pet_name = await self._extract_pet_name(db, user_id, message)
        
        # Validate pet belongs to user
        pet = None
        pet_info = None
        if pet_name:
            pet = await self._get_user_pet_by_name(db, user_id, pet_name)
            if pet:
                # Build pet info dictionary
                pet_info = {
                    'species': pet.species,
                    'breed': pet.breed,
                    'age': self._calculate_pet_age(pet.birth_date) if pet.birth_date else None,
                    'weight': pet.weight,
                    'gender': pet.gender
                }
        
        # Check if question is pet-care related
        if not self._is_pet_care_question(message):
            response = "I'm JoJo, and I specialize in pet care! Let me know if you have any questions about your furry friends. 🐾"
            await self._add_message_to_conversation(db, conversation, "user", message)
            await self._add_message_to_conversation(db, conversation, "assistant", response)
            return {
                "response": response,
                "conversation_id": str(conversation.id),
                "questions_remaining": questions_remaining,
                "pet_identified": pet is not None,
                "quota_exceeded": False
            }
        
        # If question seems pet-specific but no pet identified, ask for clarification
        if self._requires_pet_context(message) and not pet:
            response = "Which pet are you asking about? 🐕🐈"
            await self._add_message_to_conversation(db, conversation, "user", message)
            await self._add_message_to_conversation(db, conversation, "assistant", response)
            return {
                "response": response,
                "conversation_id": str(conversation.id),
                "questions_remaining": questions_remaining,
                "pet_identified": False,
                "needs_pet_name": True,
                "quota_exceeded": False
            }
        
        # Fetch health data if relevant
        health_context = ""
        if pet and self._needs_health_data(message):
            health_context = await self._fetch_health_data(db, pet.id)
        
        # Build conversation history
        conversation_history = await self._build_conversation_history(conversation)
        
        # Generate response with Gemini
        response = await self._generate_response(
            message=message,
            conversation_history=conversation_history,
            health_context=health_context,
            pet_name=pet.name if pet else None,
            pet_info=pet_info
        )
        
        # CRITICAL: Validate that response was generated
        if not response or response.startswith("Oops!"):
            logger.error("❌ CRITICAL: Jojo failed to generate a proper response")
        else:
            logger.info("✅ Jojo response generated successfully")
        
        # Save messages to conversation
        await self._add_message_to_conversation(db, conversation, "user", message)
        await self._add_message_to_conversation(db, conversation, "assistant", response)
        
        # Increment question count
        await self._increment_question_count(db, user_id)
        
        return {
            "response": response,
            "conversation_id": str(conversation.id),
            "questions_remaining": questions_remaining - 1,
            "pet_identified": pet is not None,
            "quota_exceeded": False
        }
    
    async def get_conversation(
        self,
        db: AsyncSession,
        user_id: UUID,
        conversation_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """Retrieve conversation history."""
        result = await db.execute(
            select(ConversationHistory).where(
                and_(
                    ConversationHistory.id == conversation_id,
                    ConversationHistory.user_id == user_id
                )
            )
        )
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            return None
        
        return {
            "conversation_id": str(conversation.id),
            "messages": json.loads(conversation.messages),
            "created_at": conversation.created_at.isoformat(),
            "last_accessed_at": conversation.last_accessed_at.isoformat()
        }
    
    async def clear_conversation(
        self,
        db: AsyncSession,
        user_id: UUID,
        conversation_id: UUID
    ) -> bool:
        """Clear conversation history."""
        result = await db.execute(
            select(ConversationHistory).where(
                and_(
                    ConversationHistory.id == conversation_id,
                    ConversationHistory.user_id == user_id
                )
            )
        )
        conversation = result.scalar_one_or_none()
        
        if conversation:
            await db.delete(conversation)
            await db.commit()
            return True
        return False
    
    async def get_quota_info(
        self,
        db: AsyncSession,
        user_id: UUID
    ) -> Dict[str, Any]:
        """Get user's question quota information."""
        questions_remaining = await self._check_rate_limit(db, user_id)
        
        result = await db.execute(
            select(UserQuestionQuota).where(UserQuestionQuota.user_id == user_id)
        )
        quota = result.scalar_one_or_none()
        
        return {
            "questions_remaining": questions_remaining,
            "quota_resets_at": quota.quota_reset_at.isoformat() if quota else None,
            "questions_per_hour": self.QUESTIONS_PER_HOUR
        }
    
    # Private helper methods
    
    async def _check_rate_limit(self, db: AsyncSession, user_id: UUID) -> int:
        """Check if user has questions remaining. Returns questions remaining."""
        result = await db.execute(
            select(UserQuestionQuota).where(UserQuestionQuota.user_id == user_id)
        )
        quota = result.scalar_one_or_none()
        
        now = datetime.utcnow()
        
        if not quota:
            # Create new quota entry
            quota = UserQuestionQuota(
                user_id=user_id,
                questions_asked=0,
                quota_reset_at=now + timedelta(hours=1)
            )
            db.add(quota)
            await db.commit()
            return self.QUESTIONS_PER_HOUR
        
        # Check if quota needs reset
        if now >= quota.quota_reset_at:
            quota.questions_asked = 0
            quota.quota_reset_at = now + timedelta(hours=1)
            await db.commit()
        
        return max(0, self.QUESTIONS_PER_HOUR - quota.questions_asked)
    
    async def _increment_question_count(self, db: AsyncSession, user_id: UUID):
        """Increment user's question count."""
        result = await db.execute(
            select(UserQuestionQuota).where(UserQuestionQuota.user_id == user_id)
        )
        quota = result.scalar_one_or_none()
        
        if quota:
            quota.questions_asked += 1
            await db.commit()
    
    async def _get_or_create_conversation(
        self,
        db: AsyncSession,
        user_id: UUID,
        conversation_id: Optional[UUID] = None
    ) -> ConversationHistory:
        """Get existing conversation or create new one."""
        if conversation_id:
            result = await db.execute(
                select(ConversationHistory).where(
                    and_(
                        ConversationHistory.id == conversation_id,
                        ConversationHistory.user_id == user_id
                    )
                )
            )
            conversation = result.scalar_one_or_none()
            
            if conversation:
                # Update last accessed time
                conversation.last_accessed_at = datetime.utcnow()
                await db.commit()
                return conversation
        
        # Create new conversation
        conversation = ConversationHistory(
            user_id=user_id,
            messages=json.dumps([])
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        return conversation
    
    async def _add_message_to_conversation(
        self,
        db: AsyncSession,
        conversation: ConversationHistory,
        role: str,
        content: str
    ):
        """Add a message to conversation history."""
        messages = json.loads(conversation.messages)
        messages.append({
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Keep only last N message pairs
        if len(messages) > self.CONVERSATION_MESSAGE_LIMIT * 2:
            messages = messages[-(self.CONVERSATION_MESSAGE_LIMIT * 2):]
        
        conversation.messages = json.dumps(messages)
        conversation.last_accessed_at = datetime.utcnow()
        await db.commit()
    
    async def _extract_pet_name(
        self,
        db: AsyncSession,
        user_id: UUID,
        message: str
    ) -> Optional[str]:
        """Extract pet name from message by matching against user's pets."""
        # Get user's pets
        result = await db.execute(
            select(Pet).where(
                and_(
                    Pet.user_id == user_id,
                    Pet.is_active == True
                )
            )
        )
        pets = result.scalars().all()
        
        # Check if any pet name appears in the message
        message_lower = message.lower()
        for pet in pets:
            if pet.name.lower() in message_lower:
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
    
    def _is_pet_care_question(self, message: str) -> bool:
        """Check if question is related to pet care."""
        pet_care_keywords = [
            'pet', 'dog', 'cat', 'puppy', 'kitten', 'animal', 'vet', 'veterinary',
            'health', 'sick', 'symptom', 'medication', 'vaccine', 'food', 'diet',
            'nutrition', 'behavior', 'training', 'grooming', 'breed', 'species',
            'bird', 'rabbit', 'hamster', 'guinea pig', 'fish', 'reptile'
        ]
        
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in pet_care_keywords)
    
    def _requires_pet_context(self, message: str) -> bool:
        """Check if question requires specific pet context."""
        pet_specific_keywords = [
            'my pet', 'his', 'her', 'medication', 'symptoms', 'health',
            'sick', 'eating', 'drinking', 'weight', 'age', 'breed'
        ]
        
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in pet_specific_keywords)
    
    def _needs_health_data(self, message: str) -> bool:
        """Check if question needs health data context."""
        health_keywords = [
            'medication', 'medicine', 'drug', 'prescription', 'dose', 'dosage',
            'health', 'medical', 'history', 'condition', 'symptom', 'diagnosis',
            'treatment', 'illness', 'disease', 'sick'
        ]
        
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in health_keywords)
    
    def _calculate_pet_age(self, birth_date) -> str:
        """Calculate pet age from birth date."""
        from datetime import datetime
        
        if not birth_date:
            return None
        
        today = datetime.utcnow().date()
        if hasattr(birth_date, 'date'):
            birth_date = birth_date.date()
        
        years = today.year - birth_date.year
        months = today.month - birth_date.month
        
        if months < 0:
            years -= 1
            months += 12
        
        if years > 0:
            return f"{years} year{'s' if years != 1 else ''}"
        elif months > 0:
            return f"{months} month{'s' if months != 1 else ''}"
        else:
            return "less than 1 month"
    
    async def _fetch_health_data(self, db: AsyncSession, pet_id: UUID) -> str:
        """Fetch pet's health data (medications and health logs)."""
        health_context_parts = []
        
        # Fetch active medications
        result = await db.execute(
            select(Medication).where(
                and_(
                    Medication.pet_id == pet_id,
                    Medication.is_active == True
                )
            )
        )
        medications = result.scalars().all()
        
        if medications:
            med_info = []
            for med in medications:
                med_info.append(
                    f"- {med.name}: {med.dosage}, {med.frequency}"
                    f"{f', started {med.start_date}' if med.start_date else ''}"
                )
            health_context_parts.append(
                f"Current Medications:\n" + "\n".join(med_info)
            )
        
        # Fetch recent health records (last 5)
        result = await db.execute(
            select(HealthRecord)
            .where(HealthRecord.pet_id == pet_id)
            .order_by(HealthRecord.record_date.desc())
            .limit(5)
        )
        health_records = result.scalars().all()
        
        if health_records:
            record_info = []
            for record in health_records:
                record_info.append(
                    f"- {record.record_date}: {record.record_type}"
                    f"{f' - {record.notes[:100]}' if record.notes else ''}"
                )
            health_context_parts.append(
                f"Recent Health Records:\n" + "\n".join(record_info)
            )
        
        return "\n\n".join(health_context_parts) if health_context_parts else ""
    
    async def _build_conversation_history(
        self,
        conversation: ConversationHistory
    ) -> List[Dict[str, str]]:
        """Build conversation history for context."""
        messages = json.loads(conversation.messages)
        
        # Return last N messages
        return [
            {"role": msg["role"], "content": msg["content"]}
            for msg in messages[-(self.CONVERSATION_MESSAGE_LIMIT * 2):]
        ]
    
    async def _generate_response(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        health_context: str,
        pet_name: Optional[str] = None,
        pet_info: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate response using Gemini API with proper system prompt handling."""
        # Build system prompt
        system_prompt = self._build_system_prompt(health_context, pet_name, pet_info)
        
        # Log that system prompt is being used
        logger.info("✅ Jojo system prompt loaded")
        
        # For Gemini API, we need to use a different approach
        # Gemini doesn't have a native "system" role, so we prepend system instructions
        # to the first user message and maintain conversation history
        
        # Build the full context with system prompt at the beginning
        full_prompt_parts = [
            system_prompt,
            "\n" + "="*60,
            "CONVERSATION HISTORY:",
            "="*60 + "\n"
        ]
        
        # Add conversation history in a clear format
        for msg in conversation_history:
            role = "User" if msg["role"] == "user" else "JoJo"
            full_prompt_parts.append(f"{role}: {msg['content']}")
        
        # Add the current user message
        full_prompt_parts.append(f"\nUser: {message}")
        full_prompt_parts.append("\nJoJo (respond as JoJo, the pet care assistant):")
        
        full_prompt = "\n".join(full_prompt_parts)
        
        # Log the request
        logger.info("✅ Jojo request sent to Gemini API")
        
        try:
            # Call Gemini API with the full prompt
            response = self.model.generate_content(full_prompt)
            
            if not response or not response.text:
                logger.error("❌ Jojo received empty response from Gemini API")
                return f"Oops! JoJo had a little hiccup. Please try again in a moment. 🐾"
            
            response_text = response.text.strip()
            
            # Log successful response
            logger.info("✅ Jojo response received from Gemini API")
            logger.info(f"✅ Jojo response displayed: {response_text[:100]}...")
            
            return response_text
            
        except Exception as e:
            logger.error(f"❌ Jojo API error: {str(e)}")
            logger.error(f"❌ System prompt was: {system_prompt[:200]}...")
            return f"Oops! JoJo had a little hiccup. Please try again in a moment. 🐾"
    
    def _build_system_prompt(
        self,
        health_context: str,
        pet_name: Optional[str] = None,
        pet_info: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build system prompt for JoJo - CRITICAL: This must be included in EVERY API call."""
        prompt = """You are JoJo, a friendly and knowledgeable pet care AI assistant. You help pet owners with:
- General pet care advice
- Health and wellness questions
- Behavior and training tips
- Nutrition guidance
- Emergency triage (when needed)

CRITICAL INSTRUCTIONS FOR JOJO:
- ALWAYS respond as JoJo, the pet care assistant
- ALWAYS be warm, friendly, and conversational
- ALWAYS keep responses concise but helpful (2-4 sentences usually)
- ALWAYS use emojis occasionally to be friendly 🐾
- ALWAYS recommend seeing a vet for serious situations
- ONLY answer questions related to pet care, health, behavior, nutrition, and training
- If asked about non-pet topics, politely decline: "I'm JoJo, and I specialize in pet care! Let me know if you have any questions about your furry friends."
- NEVER break character as JoJo
- NEVER forget you are JoJo, the pet care assistant

PERSONALITY TRAITS:
- Warm and empathetic
- Knowledgeable about pets
- Clear and concise
- Honest about limitations (not a replacement for a vet)
- Proactive in suggesting vet visits for serious concerns
- Knowledgeable about breed-specific traits and needs"""
        
        if pet_info:
            pet_details = []
            if pet_name:
                pet_details.append(f"Name: {pet_name}")
            if pet_info.get('species'):
                pet_details.append(f"Species: {pet_info['species']}")
            if pet_info.get('breed'):
                pet_details.append(f"Breed: {pet_info['breed']}")
            if pet_info.get('age'):
                pet_details.append(f"Age: {pet_info['age']}")
            if pet_info.get('weight'):
                pet_details.append(f"Weight: {pet_info['weight']} lbs")
            if pet_info.get('gender'):
                pet_details.append(f"Gender: {pet_info['gender']}")
            
            if pet_details:
                prompt += f"\n\nPET INFORMATION (Use this to provide breed-specific advice):\n" + "\n".join(f"- {detail}" for detail in pet_details)
                if pet_info.get('species') == 'dog' and pet_info.get('breed'):
                    prompt += f"\n- Consider {pet_info['breed']}-specific traits, health issues, and care needs"
                    prompt += f"\n- Adjust exercise, nutrition, and grooming advice for this breed"
                elif pet_info.get('species') == 'cat' and pet_info.get('breed'):
                    prompt += f"\n- Consider {pet_info['breed']}-specific traits and care needs"
                    prompt += f"\n- Adjust advice for indoor/outdoor lifestyle typical of this breed"
        elif pet_name:
            prompt += f"\n\nYou are currently discussing {pet_name}."
        
        if health_context:
            prompt += f"\n\nRELEVANT HEALTH INFORMATION:\n{health_context}"
        
        # CRITICAL: Validate that system prompt is complete
        if not prompt or len(prompt) < 100:
            logger.error("❌ CRITICAL: System prompt is incomplete or missing!")
            raise ValueError("System prompt validation failed - prompt is too short")
        
        logger.debug(f"✅ System prompt built successfully ({len(prompt)} chars)")
        return prompt
