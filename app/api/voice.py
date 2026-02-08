"""
Voice Interface API endpoints for PawPal Voice Pet Care Assistant.

This module provides REST API endpoints for speech-to-text, text-to-speech,
and voice command processing functionality.
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
import base64

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.services.voice_service import voice_service, AudioFormat, VoiceModel
from app.services.ai_service import ai_service
from app.services.pet_service import PetService
from app.services.assistant_functions import create_assistant_functions
from app.database.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["voice"])


class TranscriptionRequest(BaseModel):
    """Request model for audio transcription."""
    audio_data: str = Field(..., description="Base64 encoded audio data")
    format: AudioFormat = Field(default=AudioFormat.WAV, description="Audio format")
    language: str = Field(default="en-US", description="Language code for transcription")


class SynthesisRequest(BaseModel):
    """Request model for speech synthesis."""
    text: str = Field(..., description="Text to convert to speech", max_length=4000)
    voice: Optional[VoiceModel] = Field(default=None, description="Voice model to use")
    speed: Optional[float] = Field(default=None, description="Speech speed (0.25-4.0)", ge=0.25, le=4.0)
    format: AudioFormat = Field(default=AudioFormat.MP3, description="Output audio format")
    use_pet_names: bool = Field(default=True, description="Include pet names in response")


class VoiceCommandRequest(BaseModel):
    """Request model for voice command processing."""
    transcribed_text: Optional[str] = Field(default=None, description="Pre-transcribed text")
    audio_data: Optional[str] = Field(default=None, description="Base64 encoded audio data")
    format: AudioFormat = Field(default=AudioFormat.WAV, description="Audio format")
    pet_id: Optional[str] = Field(default=None, description="Specific pet ID for context")


class VoiceCommandResponse(BaseModel):
    """Response model for voice command processing."""
    success: bool
    transcribed_text: Optional[str] = None
    ai_response: Optional[str] = None
    audio_response: Optional[str] = None  # Base64 encoded audio
    command_type: Optional[str] = None
    mentioned_pets: Optional[List[str]] = None
    error: Optional[str] = None


@router.post("/transcribe")
async def transcribe_audio(
    request: TranscriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Transcribe audio to text using configured STT provider.
    
    Args:
        request: Transcription request with audio data
        current_user: Authenticated user
        
    Returns:
        Transcription result
    """
    try:
        # Decode base64 audio data
        try:
            audio_data = base64.b64decode(request.audio_data)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 audio data: {e}")
        
        # Validate audio format
        if not voice_service.validate_audio_format(audio_data, request.format):
            raise HTTPException(status_code=400, detail="Invalid audio format")
        
        # Transcribe audio
        result = await voice_service.transcribe_audio(
            audio_data=audio_data,
            format=request.format,
            language=request.language
        )
        
        if not result.success:
            raise HTTPException(status_code=500, detail=f"Transcription failed: {result.error}")
        
        return {
            "success": True,
            "transcribed_text": result.content,
            "provider": result.provider
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in audio transcription: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/synthesize")
async def synthesize_speech(
    request: SynthesisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Convert text to speech using configured TTS provider.
    
    Args:
        request: Speech synthesis request
        current_user: Authenticated user
        
    Returns:
        Synthesized audio data or configuration
    """
    try:
        # Get user's pet names for personalization
        pet_names = []
        if request.use_pet_names:
            pet_service = PetService(db)
            pets_response = await pet_service.get_user_pets(str(current_user.id))
            pet_names = [pet.name for pet in pets_response.pets]
        
        # Create voice response
        result = await voice_service.create_voice_response(
            response_text=request.text,
            pet_names=pet_names,
            use_pet_names=request.use_pet_names
        )
        
        if not result.success:
            raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {result.error}")
        
        response_data = {
            "success": True,
            "provider": result.provider
        }
        
        # Return audio data or configuration based on provider
        if result.audio_data:
            response_data["audio_data"] = base64.b64encode(result.audio_data).decode()
            response_data["format"] = result.format.value if result.format else None
        else:
            # Web Speech API configuration
            response_data["config"] = result.content
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in speech synthesis: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/command", response_model=VoiceCommandResponse)
async def process_voice_command(
    request: VoiceCommandRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Process voice command with AI assistant integration.
    
    Args:
        request: Voice command request
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Processed voice command with AI response
    """
    try:
        # Get user's pets for context
        pet_service = PetService(db)
        pets_response = await pet_service.get_user_pets(str(current_user.id))
        pets = pets_response.pets
        pet_names = [pet.name for pet in pets]
        
        # Decode audio data if provided
        audio_data = None
        if request.audio_data:
            try:
                audio_data = base64.b64decode(request.audio_data)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid base64 audio data: {e}")
        
        # Process voice command
        voice_result = await voice_service.process_voice_command(
            audio_data=audio_data,
            transcribed_text=request.transcribed_text,
            format=request.format,
            pet_names=pet_names
        )
        
        if not voice_result["success"]:
            return VoiceCommandResponse(
                success=False,
                error=voice_result["error"]
            )
        
        transcribed_text = voice_result["transcribed_text"]
        command_info = voice_result["processed_command"]
        
        # Get pet profile for AI context
        pet_profile = None
        target_pet_id = request.pet_id
        
        # If no specific pet ID provided, try to infer from mentioned pets
        if not target_pet_id and command_info["mentioned_pets"]:
            # Find the first mentioned pet
            for pet in pets:
                if pet.name in command_info["mentioned_pets"]:
                    target_pet_id = str(pet.id)
                    break
        
        # If still no pet ID and user has only one pet, use that
        if not target_pet_id and len(pets) == 1:
            target_pet_id = str(pets[0].id)
        
        if target_pet_id:
            pet = next((p for p in pets if str(p.id) == target_pet_id), None)
            if pet:
                pet_profile = {
                    "species": pet.species,
                    "breed": pet.breed,
                    "age": pet.age,
                    "weight": pet.weight,
                    "medical_conditions": pet.medical_conditions,
                    "allergies": pet.allergies
                }
        
        # Process with AI assistant based on command type
        ai_response_text = await _process_ai_command(
            command_info["command_type"],
            transcribed_text,
            pet_profile,
            target_pet_id,
            str(current_user.id),
            db
        )
        
        # Create voice response
        voice_response = await voice_service.create_voice_response(
            response_text=ai_response_text,
            pet_names=pet_names,
            use_pet_names=True
        )
        
        # Prepare response
        response = VoiceCommandResponse(
            success=True,
            transcribed_text=transcribed_text,
            ai_response=ai_response_text,
            command_type=command_info["command_type"],
            mentioned_pets=command_info["mentioned_pets"]
        )
        
        # Add audio response if synthesis succeeded
        if voice_response.success and voice_response.audio_data:
            response.audio_response = base64.b64encode(voice_response.audio_data).decode()
        elif voice_response.success and voice_response.content:
            # Web Speech API configuration
            response.audio_response = voice_response.content
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing voice command: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


async def _process_ai_command(
    command_type: str,
    transcribed_text: str,
    pet_profile: Optional[dict],
    pet_id: Optional[str],
    user_id: str,
    db: AsyncSession
) -> str:
    """
    Process command with appropriate AI assistant function.
    
    Args:
        command_type: Type of command identified
        transcribed_text: Original transcribed text
        pet_profile: Pet profile information
        pet_id: Pet ID for function calls
        user_id: User ID for context
        db: Database session
        
    Returns:
        AI response text
    """
    try:
        # Create assistant functions service
        assistant_functions = create_assistant_functions(db)
        
        if command_type == "symptoms":
            # Process symptom analysis
            analysis_result, triage_response = await ai_service.process_symptom_input(
                symptom_input=transcribed_text,
                pet_profile=pet_profile,
                input_type="voice"
            )
            return triage_response.message
        
        elif command_type == "medication" and pet_id:
            # Check medication status
            result = await assistant_functions.check_medication_status(
                pet_id=pet_id,
                user_id=user_id
            )
            return result.message
        
        elif command_type == "feeding" and pet_id:
            # Extract feeding information from transcribed text
            food_type, amount = _extract_feeding_info(transcribed_text)
            
            result = await assistant_functions.log_feeding(
                pet_id=pet_id,
                user_id=user_id,
                food_type=food_type,
                amount=amount,
                notes=f"Logged via voice command: {transcribed_text}"
            )
            return result.message
        
        elif command_type == "emergency":
            # For emergency, we need location - this is a simplified version
            # In production, this would get user's location from the request
            return "I can help you find emergency veterinary care. Please provide your location or enable location services for the most accurate results."
        
        elif command_type == "toxicity":
            # Extract substance name from transcribed text
            substance_name = _extract_substance_name(transcribed_text)
            pet_species = pet_profile.get("species", "dog") if pet_profile else "dog"
            
            result = await assistant_functions.check_toxic_substance(
                substance_name=substance_name,
                pet_species=pet_species
            )
            return result.message
        
        else:
            # General AI response
            messages = [
                {
                    "role": "system",
                    "content": "You are a helpful pet care assistant. Respond warmly and professionally to pet-related questions."
                },
                {
                    "role": "user",
                    "content": transcribed_text
                }
            ]
            
            response = await ai_service.generate_response(messages)
            return response.get("content", "I'm here to help with your pet care needs!")
    
    except Exception as e:
        logger.error(f"Error in AI command processing: {e}")
        return "I'm sorry, I encountered an issue processing your request. Please try again."


def _extract_feeding_info(transcribed_text: str) -> tuple[str, str]:
    """
    Extract food type and amount from transcribed text.
    
    Args:
        transcribed_text: Voice command text
        
    Returns:
        Tuple of (food_type, amount)
    """
    text_lower = transcribed_text.lower()
    
    # Simple extraction logic - in production, this could use NLP
    food_type = "pet food"  # default
    amount = "1 serving"  # default
    
    # Look for food types
    food_keywords = {
        "kibble": "dry kibble",
        "wet food": "wet food",
        "treats": "treats",
        "dry food": "dry food",
        "canned food": "canned food"
    }
    
    for keyword, food_name in food_keywords.items():
        if keyword in text_lower:
            food_type = food_name
            break
    
    # Look for amounts
    import re
    amount_patterns = [
        r'(\d+(?:\.\d+)?)\s*(cup|cups|ounce|ounces|oz|gram|grams|g|pound|pounds|lb)',
        r'(half|quarter|one|two|three)\s*(cup|cups)',
        r'(\d+)\s*(serving|servings|scoop|scoops)'
    ]
    
    for pattern in amount_patterns:
        match = re.search(pattern, text_lower)
        if match:
            amount = f"{match.group(1)} {match.group(2)}"
            break
    
    return food_type, amount


def _extract_substance_name(transcribed_text: str) -> str:
    """
    Extract substance name from transcribed text.
    
    Args:
        transcribed_text: Voice command text
        
    Returns:
        Extracted substance name
    """
    text_lower = transcribed_text.lower()
    
    # Common toxic substances to look for
    toxic_substances = [
        "chocolate", "grapes", "raisins", "onions", "garlic", "xylitol",
        "alcohol", "caffeine", "macadamia nuts", "avocado", "cherries"
    ]
    
    for substance in toxic_substances:
        if substance in text_lower:
            return substance
    
    # If no specific substance found, try to extract from common patterns
    import re
    patterns = [
        r'ate\s+(?:some\s+)?([a-zA-Z\s]+)',
        r'consumed\s+([a-zA-Z\s]+)',
        r'swallowed\s+([a-zA-Z\s]+)',
        r'got into\s+([a-zA-Z\s]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text_lower)
        if match:
            return match.group(1).strip()
    
    return "unknown substance"


@router.post("/upload-audio")
async def upload_audio_file(
    audio_file: UploadFile = File(...),
    language: str = Form(default="en-US"),
    current_user: User = Depends(get_current_user)
):
    """
    Upload audio file for transcription.
    
    Args:
        audio_file: Uploaded audio file
        language: Language code for transcription
        current_user: Authenticated user
        
    Returns:
        Transcription result
    """
    try:
        # Validate file size (max 25MB)
        max_size = 25 * 1024 * 1024  # 25MB
        if audio_file.size and audio_file.size > max_size:
            raise HTTPException(status_code=413, detail="File too large (max 25MB)")
        
        # Determine audio format from filename
        filename = audio_file.filename or ""
        if filename.endswith('.wav'):
            format = AudioFormat.WAV
        elif filename.endswith('.mp3'):
            format = AudioFormat.MP3
        elif filename.endswith('.ogg'):
            format = AudioFormat.OGG
        elif filename.endswith('.webm'):
            format = AudioFormat.WEBM
        else:
            raise HTTPException(status_code=400, detail="Unsupported audio format")
        
        # Read audio data
        audio_data = await audio_file.read()
        
        # Validate audio format
        if not voice_service.validate_audio_format(audio_data, format):
            raise HTTPException(status_code=400, detail="Invalid audio file format")
        
        # Transcribe audio
        result = await voice_service.transcribe_audio(
            audio_data=audio_data,
            format=format,
            language=language
        )
        
        if not result.success:
            raise HTTPException(status_code=500, detail=f"Transcription failed: {result.error}")
        
        return {
            "success": True,
            "transcribed_text": result.content,
            "provider": result.provider,
            "filename": filename
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in audio file upload: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/health")
async def voice_health_check():
    """
    Check voice service health status.
    
    Returns:
        Voice service health information
    """
    try:
        health_status = await voice_service.health_check()
        return health_status
    except Exception as e:
        logger.error(f"Voice health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }


@router.get("/config")
async def get_voice_config(current_user: User = Depends(get_current_user)):
    """
    Get voice interface configuration for client-side setup.
    
    Args:
        current_user: Authenticated user
        
    Returns:
        Voice configuration settings
    """
    return {
        "stt_provider": voice_service.stt_provider.value,
        "tts_provider": voice_service.tts_provider.value,
        "tts_voice": voice_service.tts_voice.value,
        "tts_speed": voice_service.tts_speed,
        "supported_formats": [format.value for format in AudioFormat],
        "available_voices": [voice.value for voice in VoiceModel],
        "web_speech_api_config": {
            "lang": "en-US",
            "continuous": False,
            "interimResults": False,
            "maxAlternatives": 1
        }
    }


@router.post("/functions/medication-status")
async def check_medication_status_endpoint(
    pet_id: str,
    medication_name: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Check medication status for a specific pet.
    
    Args:
        pet_id: Pet ID to check medications for
        medication_name: Optional specific medication to check
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Medication status information
    """
    try:
        assistant_functions = create_assistant_functions(db)
        result = await assistant_functions.check_medication_status(
            pet_id=pet_id,
            user_id=str(current_user.id),
            medication_name=medication_name
        )
        return result.to_dict()
        
    except Exception as e:
        logger.error(f"Error checking medication status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/functions/log-feeding")
async def log_feeding_endpoint(
    pet_id: str,
    food_type: str,
    amount: str,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Log a feeding event for a pet.
    
    Args:
        pet_id: Pet ID to log feeding for
        food_type: Type of food given
        amount: Amount of food given
        notes: Optional notes about the feeding
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Feeding log confirmation
    """
    try:
        assistant_functions = create_assistant_functions(db)
        result = await assistant_functions.log_feeding(
            pet_id=pet_id,
            user_id=str(current_user.id),
            food_type=food_type,
            amount=amount,
            notes=notes
        )
        return result.to_dict()
        
    except Exception as e:
        logger.error(f"Error logging feeding: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/functions/find-emergency-vet")
async def find_emergency_vet_endpoint(
    latitude: float,
    longitude: float,
    radius_miles: float = 25.0,
    user_location: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Find emergency veterinary clinics near a location.
    
    Args:
        latitude: User's latitude
        longitude: User's longitude
        radius_miles: Search radius in miles
        user_location: Optional human-readable location description
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Emergency vet locations
    """
    try:
        assistant_functions = create_assistant_functions(db)
        result = await assistant_functions.find_emergency_vet(
            latitude=latitude,
            longitude=longitude,
            radius_miles=radius_miles,
            user_location=user_location
        )
        return result.to_dict()
        
    except Exception as e:
        logger.error(f"Error finding emergency vets: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/functions/check-toxic-substance")
async def check_toxic_substance_endpoint(
    substance_name: str,
    pet_species: str,
    amount_consumed: Optional[str] = None,
    pet_weight: Optional[float] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Check if a substance is toxic to pets.
    
    Args:
        substance_name: Name of the substance consumed
        pet_species: Species of the pet (dog, cat, etc.)
        amount_consumed: Optional amount consumed
        pet_weight: Optional pet weight for dosage calculations
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Toxicity information and guidance
    """
    try:
        assistant_functions = create_assistant_functions(db)
        result = await assistant_functions.check_toxic_substance(
            substance_name=substance_name,
            pet_species=pet_species,
            amount_consumed=amount_consumed,
            pet_weight=pet_weight
        )
        return result.to_dict()
        
    except Exception as e:
        logger.error(f"Error checking toxic substance: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")