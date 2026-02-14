"""
Conversational AI Service for PawPal Voice Pet Care Assistant.

This service implements multi-turn conversations with clarifying questions
and structured responses following the example format.
"""

import logging
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timezone
from enum import Enum

from app.services.ai_service import ai_service, QueryComplexity, TriageLevel
from app.core.config import settings

logger = logging.getLogger(__name__)


class ConversationStage(Enum):
    """Stages of the conversation flow."""
    INITIAL_SYMPTOM = "initial_symptom"
    GATHERING_INFO = "gathering_info"
    ASSESSMENT = "assessment"
    FOLLOW_UP = "follow_up"


class ConversationContext:
    """Context for managing multi-turn conversations."""
    
    def __init__(self, user_id: str, pet_id: Optional[str] = None):
        self.user_id = user_id
        self.pet_id = pet_id
        self.stage = ConversationStage.INITIAL_SYMPTOM
        self.conversation_history: List[Dict[str, str]] = []
        self.collected_info: Dict[str, Any] = {}
        self.created_at = datetime.now(timezone.utc)
        self.last_updated = datetime.now(timezone.utc)
    
    def add_message(self, role: str, content: str):
        """Add a message to conversation history."""
        self.conversation_history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        self.last_updated = datetime.now(timezone.utc)
    
    def update_info(self, key: str, value: Any):
        """Update collected information."""
        self.collected_info[key] = value
        self.last_updated = datetime.now(timezone.utc)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert context to dictionary."""
        return {
            "user_id": self.user_id,
            "pet_id": self.pet_id,
            "stage": self.stage.value,
            "conversation_history": self.conversation_history,
            "collected_info": self.collected_info,
            "created_at": self.created_at.isoformat(),
            "last_updated": self.last_updated.isoformat()
        }


class ConversationService:
    """Service for managing conversational AI interactions."""
    
    def __init__(self):
        # In-memory storage for conversation contexts
        # In production, this would be stored in Redis or database
        self.active_conversations: Dict[str, ConversationContext] = {}
    
    def get_or_create_context(
        self,
        user_id: str,
        pet_id: Optional[str] = None
    ) -> ConversationContext:
        """Get existing conversation context or create new one."""
        context_key = f"{user_id}_{pet_id or 'default'}"
        
        if context_key not in self.active_conversations:
            self.active_conversations[context_key] = ConversationContext(user_id, pet_id)
        
        return self.active_conversations[context_key]
    
    def clear_context(self, user_id: str, pet_id: Optional[str] = None):
        """Clear conversation context."""
        context_key = f"{user_id}_{pet_id or 'default'}"
        if context_key in self.active_conversations:
            del self.active_conversations[context_key]
    
    async def process_message(
        self,
        user_id: str,
        message: str,
        pet_profile: Optional[Dict[str, Any]] = None,
        pet_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process user message and generate appropriate response.
        
        Args:
            user_id: User ID
            message: User's message
            pet_profile: Optional pet profile information
            pet_id: Optional pet ID
            
        Returns:
            Response dictionary with message and metadata
        """
        # Get or create conversation context
        context = self.get_or_create_context(user_id, pet_id)
        context.add_message("user", message)
        
        # Determine conversation stage and generate response
        if context.stage == ConversationStage.INITIAL_SYMPTOM:
            response = await self._handle_initial_symptom(context, message, pet_profile)
        elif context.stage == ConversationStage.GATHERING_INFO:
            response = await self._handle_gathering_info(context, message, pet_profile)
        elif context.stage == ConversationStage.ASSESSMENT:
            response = await self._handle_assessment(context, message, pet_profile)
        else:
            response = await self._handle_follow_up(context, message, pet_profile)
        
        context.add_message("assistant", response["message"])
        
        return response
    
    async def _handle_initial_symptom(
        self,
        context: ConversationContext,
        message: str,
        pet_profile: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Handle initial symptom report and ask clarifying questions."""
        
        # Store initial symptom description
        context.update_info("initial_symptoms", message)
        
        # Determine what information we need to gather
        questions_needed = self._determine_questions_needed(message, pet_profile)
        
        if not questions_needed:
            # We have enough information, proceed to assessment
            context.stage = ConversationStage.ASSESSMENT
            return await self._generate_assessment(context, pet_profile)
        
        # Move to gathering info stage
        context.stage = ConversationStage.GATHERING_INFO
        context.update_info("questions_to_ask", questions_needed)
        context.update_info("current_question_index", 0)
        
        # Generate empathetic acknowledgment and first question
        acknowledgment = self._generate_acknowledgment(message)
        first_question = questions_needed[0]
        
        response_message = f"{acknowledgment}\n\n{first_question}"
        
        return {
            "message": response_message,
            "stage": context.stage.value,
            "requires_response": True,
            "context_id": f"{context.user_id}_{context.pet_id or 'default'}"
        }
    
    async def _handle_gathering_info(
        self,
        context: ConversationContext,
        message: str,
        pet_profile: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Handle information gathering phase."""
        
        # Store the answer
        questions = context.collected_info.get("questions_to_ask", [])
        current_index = context.collected_info.get("current_question_index", 0)
        
        if current_index < len(questions):
            # Store answer for current question
            answer_key = f"answer_{current_index}"
            context.update_info(answer_key, message)
            
            # Move to next question
            current_index += 1
            context.update_info("current_question_index", current_index)
            
            if current_index < len(questions):
                # Ask next question
                next_question = questions[current_index]
                return {
                    "message": next_question,
                    "stage": context.stage.value,
                    "requires_response": True,
                    "context_id": f"{context.user_id}_{context.pet_id or 'default'}"
                }
        
        # All questions answered, proceed to assessment
        context.stage = ConversationStage.ASSESSMENT
        return await self._generate_assessment(context, pet_profile)
    
    async def _handle_assessment(
        self,
        context: ConversationContext,
        message: str,
        pet_profile: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Handle assessment phase."""
        # This is called when we have all info and need to provide assessment
        return await self._generate_assessment(context, pet_profile)
    
    async def _handle_follow_up(
        self,
        context: ConversationContext,
        message: str,
        pet_profile: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Handle follow-up questions after assessment."""
        
        # Use AI to generate contextual follow-up response
        conversation_summary = self._build_conversation_summary(context)
        
        system_prompt = f"""You are a compassionate, caring pet care assistant dedicated to providing medical support and comfort to pet owners.

Your role is to:
- Answer follow-up questions with empathy and clarity
- Provide specific, actionable guidance
- Maintain a warm, supportive tone
- Help pet owners feel confident in caring for their pets
- Offer reassurance while being medically responsible

Previous conversation summary:
{conversation_summary}

Provide a helpful, caring response to the user's follow-up question. Keep responses clear, specific, and supportive."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message}
        ]
        
        response = await ai_service.generate_response(
            messages=messages,
            complexity=QueryComplexity.SIMPLE,
            temperature=0.7
        )
        
        return {
            "message": response["content"],
            "stage": context.stage.value,
            "requires_response": False,
            "context_id": f"{context.user_id}_{context.pet_id or 'default'}"
        }
    
    def _determine_questions_needed(
        self,
        initial_message: str,
        pet_profile: Optional[Dict[str, Any]]
    ) -> List[str]:
        """Determine what clarifying questions to ask."""
        
        questions = []
        message_lower = initial_message.lower()
        
        # Check if we need pet age
        if not pet_profile or not pet_profile.get("age"):
            if "puppy" not in message_lower and "kitten" not in message_lower and "old" not in message_lower:
                questions.append("How old is your pet?")
        
        # Check if we need recent diet info
        if "vomit" in message_lower or "diarrhea" in message_lower or "stomach" in message_lower:
            questions.append("What did they eat in the last 24 hours?")
        
        # Check if we need water intake info
        if "vomit" in message_lower or "diarrhea" in message_lower or "letharg" in message_lower:
            questions.append("Are they drinking water?")
        
        # Check if we need duration info
        if "how long" not in message_lower and "since" not in message_lower:
            questions.append("How long have you noticed these symptoms?")
        
        # Check if we need behavior changes
        if "behavior" not in message_lower and "acting" not in message_lower:
            questions.append("Have you noticed any other changes in behavior or appetite?")
        
        # Limit to 3-4 questions max to avoid overwhelming user
        return questions[:4]
    
    def _generate_acknowledgment(self, message: str) -> str:
        """Generate empathetic acknowledgment of user's concern."""
        
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["emergency", "urgent", "severe", "blood", "seizure"]):
            return "I can hear how urgent this is, and I'm here to help you right away. Let me quickly gather some important information so I can give you the best guidance for your pet."
        elif any(word in message_lower for word in ["worried", "concerned", "scared", "afraid"]):
            return "I understand you're worried about your pet - that's completely natural. You're doing the right thing by reaching out. Let me ask a few questions to better understand what's happening."
        else:
            return "Thank you for reaching out about your pet. I'm here to help you figure out the best course of action. Let me gather some information to give you the most helpful guidance."
    
    async def _generate_assessment(
        self,
        context: ConversationContext,
        pet_profile: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate comprehensive assessment based on collected information."""
        
        # Build complete symptom description from collected info
        full_description = self._build_full_description(context)
        
        # Enhance pet profile with collected info
        enhanced_profile = self._enhance_pet_profile(context, pet_profile)
        
        # Get AI analysis
        analysis_result, triage_response = await ai_service.process_symptom_input(
            symptom_input=full_description,
            pet_profile=enhanced_profile,
            input_type="text"
        )
        
        # Format response in the structured format
        formatted_response = self._format_assessment_response(
            context,
            analysis_result,
            triage_response,
            enhanced_profile
        )
        
        # Move to follow-up stage
        context.stage = ConversationStage.FOLLOW_UP
        
        return {
            "message": formatted_response,
            "stage": context.stage.value,
            "requires_response": False,
            "triage_level": analysis_result.triage_level.value,
            "analysis_result": analysis_result.to_dict(),
            "context_id": f"{context.user_id}_{context.pet_id or 'default'}"
        }
    
    def _build_full_description(self, context: ConversationContext) -> str:
        """Build complete symptom description from collected information."""
        
        parts = [context.collected_info.get("initial_symptoms", "")]
        
        # Add answers to questions
        questions = context.collected_info.get("questions_to_ask", [])
        for i in range(len(questions)):
            answer = context.collected_info.get(f"answer_{i}")
            if answer:
                parts.append(f"{questions[i]} {answer}")
        
        return " ".join(parts)
    
    def _enhance_pet_profile(
        self,
        context: ConversationContext,
        pet_profile: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Enhance pet profile with information collected during conversation."""
        
        profile = pet_profile.copy() if pet_profile else {}
        
        # Extract age from answers if not in profile
        if not profile.get("age"):
            for i in range(10):
                answer = context.collected_info.get(f"answer_{i}")
                if answer and any(word in answer.lower() for word in ["year", "month", "old", "puppy", "kitten"]):
                    profile["age"] = answer
                    break
        
        return profile
    
    def _format_assessment_response(
        self,
        context: ConversationContext,
        analysis_result,
        triage_response,
        pet_profile: Dict[str, Any]
    ) -> str:
        """Format assessment response in structured format with emojis and sections."""
        
        pet_name = pet_profile.get("name", "your pet")
        pet_age = pet_profile.get("age", "unknown age")
        
        # Build response based on triage level
        if analysis_result.triage_level == TriageLevel.RED:
            return self._format_emergency_response(pet_name, pet_age, analysis_result, triage_response)
        elif analysis_result.triage_level == TriageLevel.YELLOW:
            return self._format_schedule_response(pet_name, pet_age, analysis_result, triage_response)
        else:
            return self._format_monitor_response(pet_name, pet_age, analysis_result, triage_response)
    
    def _format_emergency_response(
        self,
        pet_name: str,
        pet_age: str,
        analysis_result,
        triage_response
    ) -> str:
        """Format emergency (RED) response."""
        
        severity_rating = analysis_result.severity_rating
        
        response_parts = [
            "🚨 URGENT CARE NEEDED",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "",
            f"I know this is stressful, but I'm here to help guide you through this. Based on what you've shared about {pet_name}, this situation needs immediate veterinary attention.",
            "",
            f"📊 Severity Rating: {severity_rating}/5 (Critical)",
            "",
            f"💙 What I'm seeing: {analysis_result.analysis}",
            "",
            "🏥 WHAT YOU NEED TO DO RIGHT NOW",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            ""
        ]
        
        # Add immediate actions with caring tone
        if triage_response.emergency_info:
            response_parts.append("Please take these steps immediately:")
            response_parts.append("")
            for step in triage_response.emergency_info.get("next_steps", []):
                response_parts.append(f"• {step}")
            
            # Add transport guidance
            transport = triage_response.emergency_info.get("transport_guidance", [])
            if transport:
                response_parts.extend([
                    "",
                    "🚗 While getting to the vet:",
                    ""
                ])
                for guidance in transport:
                    response_parts.append(f"• {guidance}")
        
        # Add critical signs with empathy
        response_parts.extend([
            "",
            "⚠️ WATCH FOR THESE CRITICAL SIGNS",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "",
            "If you notice any of these, tell the vet immediately:",
            "",
            "• Difficulty breathing or gasping for air",
            "• Loss of consciousness or extreme weakness",
            "• Severe bleeding that won't stop",
            "• Seizures or uncontrollable shaking",
            "• Pale or blue-colored gums",
            "• Complete inability to stand or move",
            "",
            f"💙 I know this is frightening, but you're doing the right thing by getting {pet_name} help. Stay as calm as you can - your pet can sense your emotions. You've got this, and the veterinary team will take excellent care of your beloved companion.",
            "",
            "I'm here if you need any other guidance. Please focus on getting to the vet safely."
        ])
        
        return "\n".join(response_parts)
    
    def _format_schedule_response(
        self,
        pet_name: str,
        pet_age: str,
        analysis_result,
        triage_response
    ) -> str:
        """Format schedule visit (YELLOW) response."""
        
        severity_rating = analysis_result.severity_rating
        symptoms = analysis_result.symptoms_processed
        
        response_parts = [
            f"Thank you for sharing what's happening with {pet_name}. I've carefully reviewed the symptoms, and I want to help you understand what's going on and what steps to take.",
            "",
            "📋 MY ASSESSMENT",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "",
            f"🔍 Symptoms I'm seeing: {', '.join(symptoms)}",
            "",
            f"📊 Severity Rating: {severity_rating}/5 (Moderate - needs attention)",
            "",
            f"💙 Here's what I think: {analysis_result.analysis}",
            "",
            "⏰ RECOMMENDED ACTION",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "",
            f"I recommend scheduling a veterinary appointment for {pet_name} within the next 24-48 hours. While this isn't an emergency, it's important to get professional care to ensure your pet's wellbeing.",
            "",
            "💊 WHAT YOU CAN DO RIGHT NOW",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "",
            "Here are some caring steps you can take to help your pet feel better:"
        ]
        
        # Add all recommendations with caring language
        if analysis_result.recommendations:
            response_parts.append("")
            for i, rec in enumerate(analysis_result.recommendations, 1):
                response_parts.append(f"{i}. {rec}")
        else:
            response_parts.extend([
                "",
                "• Keep your pet comfortable in a quiet, familiar space",
                "• Ensure they have access to fresh water at all times",
                "• Monitor their symptoms and note any changes",
                "• Maintain a calm environment - your pet can sense your emotions"
            ])
        
        # Add scheduling guidance with empathy
        if triage_response.scheduling_info:
            response_parts.extend([
                "",
                "📅 PREPARING FOR THE VET VISIT",
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                "",
                "To make the most of your appointment:"
            ])
            
            preparation = triage_response.scheduling_info.get("preparation", [])
            if preparation:
                response_parts.append("")
                for tip in preparation:
                    response_parts.append(f"• {tip}")
        
        # Add monitoring guidance with care
        if triage_response.scheduling_info:
            monitoring = triage_response.scheduling_info.get("monitoring_signs", [])
            if monitoring:
                response_parts.extend([
                    "",
                    "🚨 PLEASE SEEK IMMEDIATE CARE IF YOU NOTICE:",
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                    ""
                ])
                for sign in monitoring:
                    response_parts.append(f"• {sign}")
        
        response_parts.extend([
            "",
            f"💙 You're being a wonderful pet parent by paying attention to {pet_name}'s health. Trust your instincts - if you feel something is wrong or symptoms worsen, don't hesitate to seek care sooner.",
            "",
            "Is there anything specific you'd like to know more about? I'm here to help answer your questions."
        ])
        
        return "\n".join(response_parts)
    
    def _format_monitor_response(
        self,
        pet_name: str,
        pet_age: str,
        analysis_result,
        triage_response
    ) -> str:
        """Format monitor at home (GREEN) response."""
        
        severity_rating = analysis_result.severity_rating
        
        response_parts = [
            f"Thank you for being so attentive to {pet_name}'s wellbeing. Based on what you've shared, I have some good news and helpful guidance for you.",
            "",
            "✅ MY ASSESSMENT",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "",
            f"📊 Severity Rating: {severity_rating}/5 (Mild - can monitor at home)",
            "",
            f"💙 Here's what I think: {analysis_result.analysis}",
            "",
            f"The symptoms you're seeing in {pet_name} ({pet_age}) appear to be mild and can typically be managed at home with proper care and monitoring. You're doing a great job by staying alert to your pet's health!",
            "",
            "💊 CARING FOR YOUR PET AT HOME",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "",
            "Here's how you can help your pet feel better:"
        ]
        
        # Add all recommendations with caring tone
        if analysis_result.recommendations:
            response_parts.append("")
            for i, rec in enumerate(analysis_result.recommendations, 1):
                response_parts.append(f"{i}. {rec}")
        else:
            response_parts.extend([
                "",
                "• Continue your normal feeding and care routines",
                "• Make sure fresh, clean water is always available",
                "• Keep your pet in a comfortable, stress-free environment",
                "• Give them extra love and attention - it helps!"
            ])
        
        # Add monitoring guidance with supportive language
        if triage_response.monitoring_guidance:
            home_care = triage_response.monitoring_guidance.get("home_care_tips", [])
            if home_care:
                response_parts.extend([
                    "",
                    "🏠 ADDITIONAL CARE TIPS",
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                    ""
                ])
                for tip in home_care:
                    response_parts.append(f"• {tip}")
            
            # Add monitoring schedule
            monitoring_schedule = triage_response.monitoring_guidance.get("monitoring_schedule", {})
            if monitoring_schedule:
                response_parts.extend([
                    "",
                    "📅 HOW TO MONITOR",
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                    "",
                    f"• Check on your pet: {monitoring_schedule.get('frequency', 'Every few hours')}",
                    f"• Keep watching for: {monitoring_schedule.get('duration', '24-48 hours')}",
                    f"• When to call the vet: {monitoring_schedule.get('escalation', 'If symptoms persist or worsen')}"
                ])
        
        # Add when to escalate with reassurance
        if triage_response.monitoring_guidance:
            escalation = triage_response.monitoring_guidance.get("when_to_escalate", [])
            if escalation:
                response_parts.extend([
                    "",
                    "📞 WHEN TO CONTACT YOUR VET",
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                    "",
                    "Please reach out to your veterinarian if:"
                ])
                for condition in escalation:
                    response_parts.append(f"• {condition}")
        
        response_parts.extend([
            "",
            f"💙 You know {pet_name} best. If something doesn't feel right or you're worried, it's always okay to call your vet. They'd rather hear from a caring pet parent than have you worry alone. Trust your instincts!",
            "",
            "I'm here if you have any questions or need more guidance. How else can I help you today?"
        ])
        
        return "\n".join(response_parts)
    
    def _build_conversation_summary(self, context: ConversationContext) -> str:
        """Build summary of conversation for context."""
        
        summary_parts = [
            f"Initial symptoms: {context.collected_info.get('initial_symptoms', 'N/A')}",
            "",
            "Information gathered:"
        ]
        
        questions = context.collected_info.get("questions_to_ask", [])
        for i, question in enumerate(questions):
            answer = context.collected_info.get(f"answer_{i}", "N/A")
            summary_parts.append(f"- {question} {answer}")
        
        return "\n".join(summary_parts)


# Global conversation service instance
conversation_service = ConversationService()
