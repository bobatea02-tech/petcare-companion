"""
JoJo AI Assistant API endpoints.
"""

import logging
import traceback
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.database.connection import get_db_session
from app.services.jojo_service import JoJoService
from app.services.jojo_actions import JoJoActionsService
from app.services.voice_command_processor import voice_command_processor
from app.schemas.jojo import (
    JoJoChatRequest,
    JoJoChatResponse,
    ConversationHistoryResponse,
    QuotaInfoResponse,
    ErrorResponse
)
from app.core.dependencies import get_current_active_user
from app.database.models import User

logger = logging.getLogger(__name__)


# Create router for JoJo endpoints
router = APIRouter(prefix="/jojo", tags=["JoJo AI Assistant"])


@router.post(
    "/chat",
    response_model=JoJoChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat with JoJo",
    description="Send a message to JoJo and receive a response. JoJo can answer pet care questions and access your pet's health data when relevant.",
    responses={
        200: {"description": "JoJo's response", "model": JoJoChatResponse},
        401: {"description": "Unauthorized - invalid or missing token", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded - too many questions", "model": ErrorResponse},
        500: {"description": "Internal server error", "model": ErrorResponse}
    }
)
async def chat_with_jojo(
    request: JoJoChatRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Chat with JoJo AI assistant.
    
    - **message**: Your question or message to JoJo
    - **conversation_id**: Optional - provide to continue an existing conversation
    - **pet_name**: Optional - specify which pet you're asking about
    
    JoJo will:
    - Answer pet care questions
    - Access your pet's health data when relevant
    - Remember conversation context
    - Ask for pet name if needed for specific questions
    """
    try:
        # Initialize services with error handling
        try:
            jojo_service = JoJoService()
        except Exception as init_error:
            # Log the full error for debugging
            import traceback
            error_details = traceback.format_exc()
            logger.error(f"JoJo service initialization failed: {str(init_error)}\n{error_details}")
            
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"JoJo service initialization failed: {str(init_error)}. Please ensure GEMINI_API_KEY is configured and restart the backend server."
            )
        
        jojo_actions = JoJoActionsService()
        
        conversation_id = None
        if request.conversation_id:
            try:
                conversation_id = UUID(request.conversation_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid conversation_id format"
                )
        
        # First try AI-powered voice command processing
        voice_result = await voice_command_processor.process_command(
            db=db,
            user_id=current_user.id,
            command_text=request.message,
            pet_name=request.pet_name
        )
        
        # If voice command was successfully processed, use it
        if voice_result.get("success"):
            action_result = {
                "action_taken": True,
                "action_type": voice_result.get("action_type"),
                "action_details": voice_result.get("result", {}),
                "response_text": voice_result.get("response_text"),
                "speak_response": voice_result.get("speak_response", True),
                "needs_clarification": voice_result.get("needs_clarification", False)
            }
        else:
            # Check if it needs clarification
            if voice_result.get("needs_clarification"):
                action_result = {
                    "action_taken": False,
                    "action_type": voice_result.get("action_type"),
                    "action_details": voice_result.get("result", {}),
                    "response_text": voice_result.get("response_text"),
                    "speak_response": voice_result.get("speak_response", True),
                    "needs_clarification": True
                }
            else:
                # Fallback to keyword-based action detection
                action_result = await jojo_actions.parse_and_execute_command(
                    db=db,
                    user_id=current_user.id,
                    message=request.message,
                    pet_name=request.pet_name
                )
        
        # Get JoJo's response
        result = await jojo_service.chat(
            db=db,
            user_id=current_user.id,
            message=request.message,
            conversation_id=conversation_id,
            pet_name=request.pet_name
        )
        
        # CRITICAL: Log that Jojo responded
        logger.info(f"✅ Jojo response received: {result.get('response', '')[:100]}...")
        
        # If action was taken, override response with action confirmation
        if action_result["action_taken"]:
            result["response"] = action_result["response_text"]
            result["action_taken"] = True
            result["action_type"] = action_result["action_type"]
            result["action_details"] = action_result["action_details"]
            result["speak_response"] = action_result.get("speak_response", True)
            result["needs_clarification"] = action_result.get("needs_clarification", False)
            logger.info("✅ Jojo action taken and response confirmed")
        elif action_result.get("needs_clarification"):
            # If clarification is needed, use that response
            result["response"] = action_result["response_text"]
            result["action_taken"] = False
            result["speak_response"] = action_result.get("speak_response", True)
            result["needs_clarification"] = True
            logger.info("✅ Jojo clarification needed")
        else:
            result["action_taken"] = False
            result["speak_response"] = True
            result["needs_clarification"] = False
            logger.info("✅ Jojo response displayed")
        
        logger.info("✅ Jojo chat endpoint completed successfully")
        return JoJoChatResponse(**result)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat: {str(e)}"
        )


@router.get(
    "/conversation/{conversation_id}",
    response_model=ConversationHistoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get conversation history",
    description="Retrieve the full history of a conversation with JoJo",
    responses={
        200: {"description": "Conversation history", "model": ConversationHistoryResponse},
        401: {"description": "Unauthorized", "model": ErrorResponse},
        404: {"description": "Conversation not found", "model": ErrorResponse}
    }
)
async def get_conversation_history(
    conversation_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get conversation history by ID.
    
    Returns all messages in the conversation with timestamps.
    """
    try:
        jojo_service = JoJoService()
        
        try:
            conv_uuid = UUID(conversation_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid conversation_id format"
            )
        
        conversation = await jojo_service.get_conversation(
            db=db,
            user_id=current_user.id,
            conversation_id=conv_uuid
        )
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        return ConversationHistoryResponse(**conversation)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving conversation: {str(e)}"
        )


@router.delete(
    "/conversation/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear conversation",
    description="Delete a conversation and clear its history",
    responses={
        204: {"description": "Conversation cleared successfully"},
        401: {"description": "Unauthorized", "model": ErrorResponse},
        404: {"description": "Conversation not found", "model": ErrorResponse}
    }
)
async def clear_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Clear conversation history.
    
    Permanently deletes the conversation and all its messages.
    """
    try:
        jojo_service = JoJoService()
        
        try:
            conv_uuid = UUID(conversation_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid conversation_id format"
            )
        
        success = await jojo_service.clear_conversation(
            db=db,
            user_id=current_user.id,
            conversation_id=conv_uuid
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing conversation: {str(e)}"
        )


@router.get(
    "/quota",
    response_model=QuotaInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Get question quota",
    description="Get information about remaining questions for the current hour",
    responses={
        200: {"description": "Quota information", "model": QuotaInfoResponse},
        401: {"description": "Unauthorized", "model": ErrorResponse}
    }
)
async def get_quota_info(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get user's question quota information.
    
    Returns:
    - Number of questions remaining in current hour
    - When the quota resets
    - Total questions allowed per hour
    """
    try:
        jojo_service = JoJoService()
        
        quota_info = await jojo_service.get_quota_info(
            db=db,
            user_id=current_user.id
        )
        
        return QuotaInfoResponse(**quota_info)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving quota info: {str(e)}"
        )


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="JoJo health check",
    description="Check if JoJo service is operational",
    responses={
        200: {"description": "JoJo is healthy"},
        503: {"description": "JoJo service unavailable", "model": ErrorResponse}
    }
)
async def jojo_health_check():
    """
    Health check endpoint for JoJo service.
    
    Verifies that JoJo can be initialized and is ready to respond.
    """
    try:
        jojo_service = JoJoService()
        if not jojo_service.api_configured:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="JoJo service unavailable: GEMINI_API_KEY not configured"
            )
        return {
            "status": "healthy",
            "service": "JoJo AI Assistant",
            "message": "JoJo is ready to help! 🐾"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"JoJo service unavailable: {str(e)}"
        )
