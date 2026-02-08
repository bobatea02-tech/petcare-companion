"""
AI Processing API endpoints for PawPal Voice Pet Care Assistant.
"""

import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field

from app.core.dependencies import get_current_user
from app.services.ai_service import ai_service, QueryComplexity
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
    Analyze pet symptoms and provide triage assessment.
    
    Args:
        request: Symptom analysis request
        current_user: Authenticated user
        
    Returns:
        Symptom analysis result with triage response
    """
    try:
        # Get pet profile if pet_id provided
        pet_profile = None
        if request.pet_id:
            # TODO: Fetch pet profile from database using pet_id
            # This will be implemented when pet service is available
            logger.info(f"Pet profile requested for ID: {request.pet_id}")
        
        # Process symptom input
        analysis_result, triage_response = await ai_service.process_symptom_input(
            symptom_input=request.symptom_input,
            pet_profile=pet_profile,
            input_type=request.input_type
        )
        
        return SymptomAnalysisResponse(
            analysis_result=analysis_result.to_dict(),
            triage_response=triage_response.to_dict()
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
    complexity: QueryComplexity = QueryComplexity.SIMPLE,
    current_user: User = Depends(get_current_user)
):
    """
    General chat interface with AI assistant.
    
    Args:
        message: User message
        complexity: Query complexity level
        current_user: Authenticated user
        
    Returns:
        AI response
    """
    try:
        messages = [
            {"role": "user", "content": message}
        ]
        
        response = await ai_service.generate_response(
            messages=messages,
            complexity=complexity
        )
        
        return {
            "response": response["content"],
            "model_used": response["model"],
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Error in AI chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat message"
        )