"""
Pydantic schemas for JoJo AI Assistant API.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class JoJoChatRequest(BaseModel):
    """Request schema for JoJo chat."""
    message: str = Field(..., min_length=1, max_length=2000, description="User's message to JoJo")
    conversation_id: Optional[str] = Field(None, description="Optional conversation ID to continue existing conversation")
    pet_name: Optional[str] = Field(None, description="Optional pet name if user wants to specify")


class JoJoChatResponse(BaseModel):
    """Response schema for JoJo chat."""
    response: str = Field(..., description="JoJo's response")
    conversation_id: str = Field(..., description="Conversation ID for continuing the conversation")
    questions_remaining: int = Field(..., description="Number of questions remaining in current hour")
    pet_identified: bool = Field(..., description="Whether a pet was identified in the conversation")
    quota_exceeded: bool = Field(False, description="Whether user has exceeded their question quota")
    needs_pet_name: Optional[bool] = Field(None, description="Whether JoJo needs the user to specify a pet name")
    action_taken: bool = Field(False, description="Whether JoJo executed an action (grooming complete, reminder set, etc.)")
    action_type: Optional[str] = Field(None, description="Type of action taken")
    action_details: Optional[Dict[str, Any]] = Field(None, description="Details of the action taken")
    speak_response: bool = Field(True, description="Whether the response should be spoken aloud")
    needs_clarification: bool = Field(False, description="Whether JoJo needs clarification from the user")


class ConversationMessage(BaseModel):
    """Schema for a single conversation message."""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: str = Field(..., description="ISO format timestamp")


class ConversationHistoryResponse(BaseModel):
    """Response schema for conversation history."""
    conversation_id: str = Field(..., description="Conversation ID")
    messages: List[ConversationMessage] = Field(..., description="List of conversation messages")
    created_at: str = Field(..., description="ISO format timestamp of conversation creation")
    last_accessed_at: str = Field(..., description="ISO format timestamp of last access")


class QuotaInfoResponse(BaseModel):
    """Response schema for quota information."""
    questions_remaining: int = Field(..., description="Number of questions remaining in current hour")
    quota_resets_at: Optional[str] = Field(None, description="ISO format timestamp when quota resets")
    questions_per_hour: int = Field(..., description="Total questions allowed per hour")


class ErrorResponse(BaseModel):
    """Error response schema."""
    detail: str = Field(..., description="Error message")
