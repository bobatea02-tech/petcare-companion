"""
Voice Processing Service for PawPal Voice Pet Care Assistant.

This service handles speech-to-text (STT) and text-to-speech (TTS) processing
using Web Speech API integration and Nova voice configuration.
"""

import asyncio
import base64
import io
import logging
import tempfile
from typing import Optional, Dict, Any, BinaryIO
from enum import Enum
import json

from app.core.config import settings

logger = logging.getLogger(__name__)


class AudioFormat(Enum):
    """Supported audio formats for voice processing."""
    WAV = "wav"
    MP3 = "mp3"
    WEBM = "webm"
    OGG = "ogg"


class VoiceModel(Enum):
    """Available TTS voice models."""
    NOVA = "nova"
    ALLOY = "alloy"
    ECHO = "echo"
    FABLE = "fable"
    ONYX = "onyx"
    SHIMMER = "shimmer"


class STTProvider(Enum):
    """Speech-to-text providers."""
    WEB_SPEECH_API = "web_speech_api"
    OPENAI_WHISPER = "openai_whisper"


class TTSProvider(Enum):
    """Text-to-speech providers."""
    WEB_SPEECH_API = "web_speech_api"
    OPENAI_TTS = "openai_tts"


class VoiceProcessingResult:
    """Result object for voice processing operations."""
    
    def __init__(
        self,
        success: bool,
        content: str = "",
        audio_data: Optional[bytes] = None,
        format: Optional[AudioFormat] = None,
        duration: Optional[float] = None,
        error: Optional[str] = None,
        provider: Optional[str] = None
    ):
        self.success = success
        self.content = content
        self.audio_data = audio_data
        self.format = format
        self.duration = duration
        self.error = error
        self.provider = provider
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary format."""
        return {
            "success": self.success,
            "content": self.content,
            "audio_data": base64.b64encode(self.audio_data).decode() if self.audio_data else None,
            "format": self.format.value if self.format else None,
            "duration": self.duration,
            "error": self.error,
            "provider": self.provider
        }


class VoiceService:
    """Service for voice processing with STT and TTS capabilities."""
    
    def __init__(self):
        """Initialize voice service with configured providers."""
        self.stt_provider = STTProvider(getattr(settings, 'STT_PROVIDER', 'web_speech_api'))
        self.tts_provider = TTSProvider(getattr(settings, 'TTS_PROVIDER', 'web_speech_api'))
        self.tts_voice = VoiceModel(getattr(settings, 'TTS_VOICE', 'nova'))
        self.tts_speed = getattr(settings, 'TTS_SPEED', 0.95)
        
        # Initialize OpenAI client if needed
        self.openai_client = None
        if (self.stt_provider == STTProvider.OPENAI_WHISPER or 
            self.tts_provider == TTSProvider.OPENAI_TTS):
            if settings.OPENAI_API_KEY:
                from openai import AsyncOpenAI
                self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            else:
                logger.warning("OpenAI API key not configured for voice services")
    
    async def transcribe_audio(
        self,
        audio_data: bytes,
        format: AudioFormat = AudioFormat.WAV,
        language: str = "en-US"
    ) -> VoiceProcessingResult:
        """
        Convert speech audio to text using configured STT provider.
        
        Args:
            audio_data: Raw audio data bytes
            format: Audio format of the input data
            language: Language code for transcription
            
        Returns:
            VoiceProcessingResult with transcribed text
        """
        try:
            if self.stt_provider == STTProvider.OPENAI_WHISPER:
                return await self._transcribe_with_whisper(audio_data, format, language)
            else:
                # Web Speech API transcription is handled client-side
                # This endpoint receives the transcribed text from the client
                return VoiceProcessingResult(
                    success=False,
                    error="Web Speech API transcription should be handled client-side",
                    provider="web_speech_api"
                )
        except Exception as e:
            logger.error(f"Error in audio transcription: {e}")
            return VoiceProcessingResult(
                success=False,
                error=str(e),
                provider=self.stt_provider.value
            )
    
    async def _transcribe_with_whisper(
        self,
        audio_data: bytes,
        format: AudioFormat,
        language: str
    ) -> VoiceProcessingResult:
        """
        Transcribe audio using OpenAI Whisper API.
        
        Args:
            audio_data: Raw audio data bytes
            format: Audio format of the input data
            language: Language code for transcription
            
        Returns:
            VoiceProcessingResult with transcribed text
        """
        if not self.openai_client:
            return VoiceProcessingResult(
                success=False,
                error="OpenAI client not initialized",
                provider="openai_whisper"
            )
        
        try:
            # Create temporary file for audio data
            with tempfile.NamedTemporaryFile(suffix=f".{format.value}", delete=False) as temp_file:
                temp_file.write(audio_data)
                temp_file.flush()
                
                # Transcribe using Whisper
                with open(temp_file.name, "rb") as audio_file:
                    transcript = await self.openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        language=language.split('-')[0] if '-' in language else language
                    )
                
                return VoiceProcessingResult(
                    success=True,
                    content=transcript.text,
                    provider="openai_whisper"
                )
                
        except Exception as e:
            logger.error(f"Whisper transcription error: {e}")
            return VoiceProcessingResult(
                success=False,
                error=str(e),
                provider="openai_whisper"
            )
    
    async def synthesize_speech(
        self,
        text: str,
        voice: Optional[VoiceModel] = None,
        speed: Optional[float] = None,
        format: AudioFormat = AudioFormat.MP3
    ) -> VoiceProcessingResult:
        """
        Convert text to speech using configured TTS provider.
        
        Args:
            text: Text to convert to speech
            voice: Voice model to use (defaults to configured voice)
            speed: Speech speed (defaults to configured speed)
            format: Output audio format
            
        Returns:
            VoiceProcessingResult with audio data
        """
        try:
            voice = voice or self.tts_voice
            speed = speed or self.tts_speed
            
            if self.tts_provider == TTSProvider.OPENAI_TTS:
                return await self._synthesize_with_openai_tts(text, voice, speed, format)
            else:
                # Web Speech API synthesis is handled client-side
                return await self._create_web_speech_config(text, voice, speed)
                
        except Exception as e:
            logger.error(f"Error in speech synthesis: {e}")
            return VoiceProcessingResult(
                success=False,
                error=str(e),
                provider=self.tts_provider.value
            )
    
    async def _synthesize_with_openai_tts(
        self,
        text: str,
        voice: VoiceModel,
        speed: float,
        format: AudioFormat
    ) -> VoiceProcessingResult:
        """
        Synthesize speech using OpenAI TTS API.
        
        Args:
            text: Text to convert to speech
            voice: Voice model to use
            speed: Speech speed
            format: Output audio format
            
        Returns:
            VoiceProcessingResult with audio data
        """
        if not self.openai_client:
            return VoiceProcessingResult(
                success=False,
                error="OpenAI client not initialized",
                provider="openai_tts"
            )
        
        try:
            # Map format to OpenAI supported formats
            openai_format = "mp3"  # OpenAI TTS supports mp3, opus, aac, flac
            if format == AudioFormat.WAV:
                openai_format = "wav"
            elif format == AudioFormat.OGG:
                openai_format = "opus"
            
            response = await self.openai_client.audio.speech.create(
                model="tts-1",
                voice=voice.value,
                input=text,
                response_format=openai_format,
                speed=speed
            )
            
            # Get audio data
            audio_data = b""
            async for chunk in response.iter_bytes():
                audio_data += chunk
            
            return VoiceProcessingResult(
                success=True,
                content=text,
                audio_data=audio_data,
                format=format,
                provider="openai_tts"
            )
            
        except Exception as e:
            logger.error(f"OpenAI TTS synthesis error: {e}")
            return VoiceProcessingResult(
                success=False,
                error=str(e),
                provider="openai_tts"
            )
    
    async def _create_web_speech_config(
        self,
        text: str,
        voice: VoiceModel,
        speed: float
    ) -> VoiceProcessingResult:
        """
        Create configuration for Web Speech API synthesis (client-side).
        
        Args:
            text: Text to convert to speech
            voice: Voice model to use
            speed: Speech speed
            
        Returns:
            VoiceProcessingResult with synthesis configuration
        """
        # For Web Speech API, we return configuration that the client will use
        config = {
            "text": text,
            "voice": voice.value,
            "rate": speed,
            "pitch": 1.0,
            "volume": 1.0,
            "lang": "en-US"
        }
        
        return VoiceProcessingResult(
            success=True,
            content=json.dumps(config),
            provider="web_speech_api"
        )
    
    def validate_audio_format(self, audio_data: bytes, expected_format: AudioFormat) -> bool:
        """
        Validate audio data format.
        
        Args:
            audio_data: Raw audio data bytes
            expected_format: Expected audio format
            
        Returns:
            True if format is valid, False otherwise
        """
        if not audio_data:
            return False
        
        # Basic format validation based on file headers
        if expected_format == AudioFormat.WAV:
            return audio_data.startswith(b'RIFF') and b'WAVE' in audio_data[:12]
        elif expected_format == AudioFormat.MP3:
            return audio_data.startswith(b'ID3') or audio_data.startswith(b'\xff\xfb')
        elif expected_format == AudioFormat.OGG:
            return audio_data.startswith(b'OggS')
        elif expected_format == AudioFormat.WEBM:
            return audio_data.startswith(b'\x1a\x45\xdf\xa3')
        
        return True  # Default to valid for unknown formats
    
    def compress_audio(self, audio_data: bytes, format: AudioFormat) -> bytes:
        """
        Compress audio data for efficient transmission.
        
        Args:
            audio_data: Raw audio data bytes
            format: Audio format
            
        Returns:
            Compressed audio data
        """
        # For now, return original data
        # In production, implement actual compression based on format
        logger.info(f"Audio compression requested for {format.value} format")
        return audio_data
    
    async def process_voice_command(
        self,
        audio_data: Optional[bytes] = None,
        transcribed_text: Optional[str] = None,
        format: AudioFormat = AudioFormat.WAV,
        pet_names: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Process voice command for AI assistant interaction.
        
        Args:
            audio_data: Raw audio data (if using server-side STT)
            transcribed_text: Pre-transcribed text (if using client-side STT)
            format: Audio format (if audio_data provided)
            pet_names: List of pet names for context
            
        Returns:
            Processed voice command result
        """
        try:
            # Get transcribed text
            if transcribed_text:
                text = transcribed_text
                stt_result = VoiceProcessingResult(
                    success=True,
                    content=text,
                    provider="client_side"
                )
            elif audio_data:
                stt_result = await self.transcribe_audio(audio_data, format)
                if not stt_result.success:
                    return {
                        "success": False,
                        "error": f"Transcription failed: {stt_result.error}",
                        "stt_result": stt_result.to_dict()
                    }
                text = stt_result.content
            else:
                return {
                    "success": False,
                    "error": "Either audio_data or transcribed_text must be provided"
                }
            
            # Process the command text
            processed_command = self._process_command_text(text, pet_names or [])
            
            return {
                "success": True,
                "transcribed_text": text,
                "processed_command": processed_command,
                "stt_result": stt_result.to_dict() if 'stt_result' in locals() else None
            }
            
        except Exception as e:
            logger.error(f"Error processing voice command: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _process_command_text(self, text: str, pet_names: list) -> Dict[str, Any]:
        """
        Process transcribed text to extract command intent and pet references.
        
        Args:
            text: Transcribed text from voice input
            pet_names: List of registered pet names
            
        Returns:
            Processed command information
        """
        text_lower = text.lower()
        
        # Extract pet names mentioned in the command
        mentioned_pets = []
        for pet_name in pet_names:
            if pet_name.lower() in text_lower:
                mentioned_pets.append(pet_name)
        
        # Identify command type based on keywords
        command_type = "general"
        if any(word in text_lower for word in ["medication", "medicine", "pill", "dose"]):
            command_type = "medication"
        elif any(word in text_lower for word in ["feeding", "food", "eat", "meal"]):
            command_type = "feeding"
        elif any(word in text_lower for word in ["emergency", "urgent", "vet", "help"]):
            command_type = "emergency"
        elif any(word in text_lower for word in ["toxic", "poison", "ate", "swallowed"]):
            command_type = "toxicity"
        elif any(word in text_lower for word in ["symptom", "sick", "not feeling", "problem"]):
            command_type = "symptoms"
        
        return {
            "original_text": text,
            "command_type": command_type,
            "mentioned_pets": mentioned_pets,
            "processed_at": "server"
        }
    
    async def create_voice_response(
        self,
        response_text: str,
        pet_names: Optional[list] = None,
        use_pet_names: bool = True
    ) -> VoiceProcessingResult:
        """
        Create voice response with pet name personalization.
        
        Args:
            response_text: Text response to convert to speech
            pet_names: List of pet names for personalization
            use_pet_names: Whether to include pet names in response
            
        Returns:
            VoiceProcessingResult with synthesized speech
        """
        try:
            # Personalize response with pet names if requested
            if use_pet_names and pet_names:
                personalized_text = self._personalize_response(response_text, pet_names)
            else:
                personalized_text = response_text
            
            # Synthesize speech with Nova voice at 0.95 speed
            return await self.synthesize_speech(
                text=personalized_text,
                voice=VoiceModel.NOVA,
                speed=0.95
            )
            
        except Exception as e:
            logger.error(f"Error creating voice response: {e}")
            return VoiceProcessingResult(
                success=False,
                error=str(e),
                provider=self.tts_provider.value
            )
    
    def _personalize_response(self, response_text: str, pet_names: list) -> str:
        """
        Personalize response text with pet names.
        
        Args:
            response_text: Original response text
            pet_names: List of pet names
            
        Returns:
            Personalized response text
        """
        # Simple personalization - in production, this could be more sophisticated
        if len(pet_names) == 1:
            # Single pet - use name directly
            pet_name = pet_names[0]
            if "your pet" in response_text.lower():
                response_text = response_text.replace("your pet", pet_name)
                response_text = response_text.replace("Your pet", pet_name)
        elif len(pet_names) > 1:
            # Multiple pets - use "your pets" or list names
            if len(pet_names) <= 3:
                pet_list = ", ".join(pet_names[:-1]) + f" and {pet_names[-1]}"
                response_text = response_text.replace("your pets", pet_list)
                response_text = response_text.replace("Your pets", pet_list)
        
        return response_text
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check the health of the voice service.
        
        Returns:
            Health status information
        """
        status = {
            "status": "healthy",
            "stt_provider": self.stt_provider.value,
            "tts_provider": self.tts_provider.value,
            "tts_voice": self.tts_voice.value,
            "tts_speed": self.tts_speed,
            "openai_available": self.openai_client is not None
        }
        
        # Test basic functionality
        try:
            # Test TTS configuration
            test_result = await self.synthesize_speech("Test", format=AudioFormat.MP3)
            status["tts_test"] = test_result.success
            
            if not test_result.success:
                status["status"] = "degraded"
                status["tts_error"] = test_result.error
                
        except Exception as e:
            status["status"] = "unhealthy"
            status["error"] = str(e)
        
        return status


# Global voice service instance
voice_service = VoiceService()