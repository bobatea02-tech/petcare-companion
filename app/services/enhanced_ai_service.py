"""
Enhanced AI Service with RAG (Retrieval Augmented Generation).
Integrates knowledge base for better, more accurate responses.
"""

import logging
from typing import Optional, Dict, Any, List
import google.generativeai as genai

from app.core.config import settings
from app.services.knowledge_base_service import knowledge_base_service

logger = logging.getLogger(__name__)


class EnhancedAIService:
    """Enhanced AI service with knowledge base integration."""
    
    def __init__(self):
        """Initialize the enhanced AI service."""
        self.knowledge_base = knowledge_base_service
        self._configure_ai()
    
    def _configure_ai(self):
        """Configure AI provider (Gemini)."""
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            logger.info("Gemini AI configured successfully")
        else:
            logger.warning("No Gemini API key found")
    
    async def generate_response_with_knowledge(
        self,
        user_message: str,
        pet_profile: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Generate AI response enhanced with knowledge base.
        
        Args:
            user_message: User's message/question
            pet_profile: Pet information for context
            conversation_history: Previous conversation messages
            
        Returns:
            Dict with response, sources, and metadata
        """
        try:
            # Step 1: Search knowledge base for relevant information
            pet_type = pet_profile.get("species") if pet_profile else None
            relevant_knowledge = self.knowledge_base.search(
                query=user_message,
                pet_type=pet_type,
                max_results=3
            )
            
            # Step 2: Check if it's an emergency
            is_emergency = self.knowledge_base.is_emergency(user_message)
            
            # Step 3: Build enhanced prompt with knowledge
            system_prompt = self._build_system_prompt(
                pet_profile=pet_profile,
                relevant_knowledge=relevant_knowledge,
                is_emergency=is_emergency
            )
            
            # Step 4: Build conversation context
            messages = self._build_messages(
                system_prompt=system_prompt,
                user_message=user_message,
                conversation_history=conversation_history
            )
            
            # Step 5: Generate response using Gemini
            response_text = await self._generate_with_gemini(messages)
            
            # Step 6: Format response with sources
            return {
                "response": response_text,
                "sources": [
                    {
                        "title": entry.title,
                        "category": entry.category,
                        "severity": entry.severity
                    }
                    for entry in relevant_knowledge
                ],
                "is_emergency": is_emergency,
                "knowledge_used": len(relevant_knowledge) > 0,
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Error generating response with knowledge: {e}")
            return {
                "response": "I apologize, but I'm having trouble processing your request. Please try again or consult with a veterinarian if this is urgent.",
                "sources": [],
                "is_emergency": False,
                "knowledge_used": False,
                "success": False,
                "error": str(e)
            }
    
    def _build_system_prompt(
        self,
        pet_profile: Optional[Dict[str, Any]],
        relevant_knowledge: List[Any],
        is_emergency: bool
    ) -> str:
        """Build system prompt with knowledge base context."""
        
        prompt = """You are PetPal, an AI assistant specialized in pet health and care. 
You provide helpful, accurate, and compassionate advice to pet owners.

**Important Guidelines:**
1. Always prioritize pet safety and wellbeing
2. Recommend veterinary care when appropriate
3. Never diagnose or prescribe medication
4. Be clear about what requires professional care
5. Provide practical, actionable advice
6. Be empathetic and supportive

"""
        
        # Add emergency warning if detected
        if is_emergency:
            prompt += """
⚠️ **EMERGENCY DETECTED** ⚠️
This appears to be an emergency situation. Prioritize immediate veterinary care in your response.
Provide clear, urgent guidance while being calm and supportive.

"""
        
        # Add pet profile context
        if pet_profile:
            prompt += f"""
**Pet Information:**
- Name: {pet_profile.get('name', 'Unknown')}
- Species: {pet_profile.get('species', 'Unknown')}
- Breed: {pet_profile.get('breed', 'Unknown')}
- Age: {pet_profile.get('age', 'Unknown')}
- Weight: {pet_profile.get('weight', 'Unknown')}
- Medical Conditions: {pet_profile.get('medical_conditions', 'None reported')}
- Allergies: {pet_profile.get('allergies', 'None reported')}

"""
        
        # Add relevant knowledge
        if relevant_knowledge:
            prompt += self.knowledge_base.format_for_ai(relevant_knowledge)
            prompt += """
**Instructions for Using Knowledge:**
- Reference the veterinary knowledge provided above
- Cite specific information when relevant
- Adapt advice to the specific pet and situation
- Add your own insights and recommendations
- Always include when to see a vet

"""
        
        prompt += """
**Response Format:**
- Be conversational and friendly
- Use clear, simple language
- Break information into sections
- Use bullet points for clarity
- Include specific action items
- Always mention when veterinary care is needed

Remember: You're a helpful assistant, not a replacement for veterinary care.
"""
        
        return prompt
    
    def _build_messages(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]]
    ) -> str:
        """Build message context for AI."""
        
        # Combine system prompt with conversation
        full_context = system_prompt + "\n\n"
        
        # Add conversation history if available
        if conversation_history:
            full_context += "**Previous Conversation:**\n"
            for msg in conversation_history[-5:]:  # Last 5 messages
                role = msg.get("role", "user")
                content = msg.get("content", "")
                full_context += f"{role.capitalize()}: {content}\n"
            full_context += "\n"
        
        # Add current user message
        full_context += f"**Current Question:**\n{user_message}\n\n"
        full_context += "**Your Response:**\n"
        
        return full_context
    
    async def _generate_with_gemini(self, prompt: str) -> str:
        """Generate response using Gemini."""
        try:
            model = genai.GenerativeModel(settings.PRIMARY_AI_MODEL)
            
            generation_config = {
                "temperature": settings.AI_TEMPERATURE,
                "max_output_tokens": settings.AI_MAX_TOKENS,
            }
            
            response = await model.generate_content_async(
                prompt,
                generation_config=generation_config
            )
            
            return response.text
            
        except Exception as e:
            logger.error(f"Error generating with Gemini: {e}")
            
            # Try fallback model
            try:
                model = genai.GenerativeModel(settings.FALLBACK_AI_MODEL)
                response = await model.generate_content_async(prompt)
                return response.text
            except Exception as fallback_error:
                logger.error(f"Fallback model also failed: {fallback_error}")
                raise
    
    async def analyze_symptoms(
        self,
        symptoms: str,
        pet_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze pet symptoms with knowledge base support.
        
        Args:
            symptoms: Description of symptoms
            pet_profile: Pet information
            
        Returns:
            Analysis with triage level and recommendations
        """
        try:
            # Search for relevant conditions
            pet_type = pet_profile.get("species") if pet_profile else None
            relevant_knowledge = self.knowledge_base.search(
                query=symptoms,
                pet_type=pet_type,
                max_results=5
            )
            
            # Check emergency status
            is_emergency = self.knowledge_base.is_emergency(symptoms)
            
            # Determine triage level based on knowledge
            triage_level = self._determine_triage_level(
                symptoms=symptoms,
                relevant_knowledge=relevant_knowledge,
                is_emergency=is_emergency
            )
            
            # Build analysis prompt
            analysis_prompt = f"""
Analyze these pet symptoms and provide a structured assessment:

**Symptoms:** {symptoms}

**Pet Information:**
{json.dumps(pet_profile, indent=2) if pet_profile else "Not provided"}

**Relevant Medical Knowledge:**
{self.knowledge_base.format_for_ai(relevant_knowledge)}

**Provide:**
1. **Assessment:** What these symptoms might indicate
2. **Severity:** How serious this appears to be
3. **Immediate Actions:** What the owner should do right now
4. **When to See Vet:** Specific timeframe and reasons
5. **Home Care:** If appropriate, what can be done at home
6. **Warning Signs:** What to watch for that would require immediate care

Be specific, practical, and prioritize pet safety.
"""
            
            # Generate analysis
            model = genai.GenerativeModel(settings.PRIMARY_AI_MODEL)
            response = await model.generate_content_async(analysis_prompt)
            
            return {
                "analysis": response.text,
                "triage_level": triage_level,
                "is_emergency": is_emergency,
                "relevant_conditions": [
                    {
                        "title": entry.title,
                        "category": entry.category,
                        "severity": entry.severity
                    }
                    for entry in relevant_knowledge
                ],
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Error analyzing symptoms: {e}")
            return {
                "analysis": "Unable to analyze symptoms at this time. Please consult a veterinarian.",
                "triage_level": "unknown",
                "is_emergency": True,  # Err on the side of caution
                "relevant_conditions": [],
                "success": False,
                "error": str(e)
            }
    
    def _determine_triage_level(
        self,
        symptoms: str,
        relevant_knowledge: List[Any],
        is_emergency: bool
    ) -> str:
        """Determine triage level based on symptoms and knowledge."""
        
        if is_emergency:
            return "red"  # Emergency
        
        # Check severity of matched conditions
        if relevant_knowledge:
            max_severity = max(
                (entry.severity for entry in relevant_knowledge),
                default="low"
            )
            
            if max_severity == "emergency" or max_severity == "high":
                return "yellow"  # Vet visit needed soon
            elif max_severity == "medium":
                return "yellow"  # Monitor and schedule vet
            else:
                return "green"  # Monitor at home
        
        # Default to caution
        return "yellow"


# Global instance
enhanced_ai_service = EnhancedAIService()
