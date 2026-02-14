"""
AI Processing API endpoints for PawPal Voice Pet Care Assistant.
"""

import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field

from app.core.dependencies import get_current_user
from app.services.ai_service import ai_service, QueryComplexity
from app.services.conversation_service import conversation_service
from app.services.enhanced_ai_service import enhanced_ai_service
from app.database.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Processing"])


class SymptomAnalysisRequest(BaseModel):
    """Request model for symptom analysis."""
    symptom_input: str = Field(..., description="Description of pet symptoms")
    pet_id: Optional[str] = Field(None, description="Pet ID for context")
    input_type: str = Field("text", description="Input type: 'text' or 'voice'")


class SymptomAnalysisResponse(BaseModel):
    """Response model for symptom analysis."""
    analysis_result: Dict[str, Any]
    triage_response: Dict[str, Any]
    success: bool = True


class AIHealthResponse(BaseModel):
    """Response model for AI service health check."""
    status: str
    models_available: bool
    primary_model: Optional[str] = None
    fallback_model: Optional[str] = None
    error: Optional[str] = None


@router.get("/health", response_model=AIHealthResponse)
async def check_ai_health():
    """
    Check the health status of AI processing services.
    
    Returns:
        AI service health information
    """
    try:
        health_info = await ai_service.health_check()
        return AIHealthResponse(**health_info)
    except Exception as e:
        logger.error(f"Error checking AI health: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service health check failed"
        )


@router.post("/analyze-symptoms", response_model=SymptomAnalysisResponse)
async def analyze_symptoms(
    request: SymptomAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Analyze pet symptoms with knowledge base support.
    
    Args:
        request: Symptom analysis request
        current_user: Authenticated user
        
    Returns:
        Enhanced symptom analysis with triage and knowledge sources
    """
    try:
        # Get pet profile if pet_id provided
        pet_profile = None
        if request.pet_id:
            # TODO: Fetch pet profile from database using pet_id
            logger.info(f"Pet profile requested for ID: {request.pet_id}")
        
        # Use enhanced AI service for analysis
        analysis_result = await enhanced_ai_service.analyze_symptoms(
            symptoms=request.symptom_input,
            pet_profile=pet_profile
        )
        
        # Format response
        return SymptomAnalysisResponse(
            analysis_result=analysis_result,
            triage_response={
                "triage_level": analysis_result.get("triage_level", "unknown"),
                "is_emergency": analysis_result.get("is_emergency", False),
                "relevant_conditions": analysis_result.get("relevant_conditions", [])
            }
        )
        
    except Exception as e:
        logger.error(f"Error in symptom analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze symptoms"
        )


@router.post("/chat")
async def chat_with_ai(
    message: str,
    pet_profile: Optional[Dict[str, Any]] = None,
    complexity: QueryComplexity = QueryComplexity.SIMPLE,
    current_user: User = Depends(get_current_user)
):
    """
    Enhanced chat interface with AI assistant using knowledge base.
    
    Args:
        message: User message
        pet_profile: Optional pet information for context
        complexity: Query complexity level
        current_user: Authenticated user
        
    Returns:
        AI response with knowledge sources
    """
    try:
        # Use enhanced AI service with knowledge base
        response = await enhanced_ai_service.generate_response_with_knowledge(
            user_message=message,
            pet_profile=pet_profile,
            conversation_history=None  # Can be added later
        )
        
        return {
            "response": response["response"],
            "sources": response.get("sources", []),
            "is_emergency": response.get("is_emergency", False),
            "knowledge_used": response.get("knowledge_used", False),
            "success": response["success"]
        }
        
    except Exception as e:
        logger.error(f"Error in AI chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat message"
        )



class ConversationMessageRequest(BaseModel):
    """Request model for conversational AI."""
    message: str = Field(..., description="User's message")
    pet_id: Optional[str] = Field(None, description="Pet ID for context")
    pet_profile: Optional[Dict[str, Any]] = Field(None, description="Pet profile information")


class ConversationMessageResponse(BaseModel):
    """Response model for conversational AI."""
    message: str
    stage: str
    requires_response: bool
    context_id: str
    triage_level: Optional[str] = None
    analysis_result: Optional[Dict[str, Any]] = None


class ClearConversationRequest(BaseModel):
    """Request model for clearing conversation context."""
    pet_id: Optional[str] = Field(None, description="Pet ID")


@router.post("/conversation", response_model=ConversationMessageResponse)
async def conversation_message(
    request: ConversationMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Process conversational message with multi-turn dialogue support.
    
    This endpoint implements the conversational flow:
    1. User reports symptoms
    2. Assistant asks clarifying questions
    3. User provides answers
    4. Assistant provides structured assessment
    
    Args:
        request: Conversation message request
        current_user: Authenticated user
        
    Returns:
        Conversational response with appropriate stage and guidance
    """
    try:
        response = await conversation_service.process_message(
            user_id=str(current_user.id),
            message=request.message,
            pet_profile=request.pet_profile,
            pet_id=request.pet_id
        )
        
        return ConversationMessageResponse(**response)
        
    except Exception as e:
        logger.error(f"Error in conversation processing: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process conversation message"
        )


@router.post("/conversation/clear")
async def clear_conversation(
    request: ClearConversationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Clear conversation context to start fresh.
    
    Args:
        request: Clear conversation request
        current_user: Authenticated user
        
    Returns:
        Success confirmation
    """
    try:
        conversation_service.clear_context(
            user_id=str(current_user.id),
            pet_id=request.pet_id
        )
        
        return {
            "success": True,
            "message": "Conversation context cleared"
        }
        
    except Exception as e:
        logger.error(f"Error clearing conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear conversation context"
        )
