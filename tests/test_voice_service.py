"""
Tests for Voice Processing Service.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.voice_service import (
    VoiceService, 
    AudioFormat, 
    VoiceModel,
    VoiceProcessingResult
)


class TestVoiceService:
    """Test cases for voice service functionality."""
    
    @pytest.fixture
    def voice_service(self):
        """Create voice service instance for testing."""
        return VoiceService()
    
    def test_validate_audio_format_wav(self, voice_service):
        """Test WAV audio format validation."""
        # WAV file header
        wav_data = b'RIFF\x24\x08\x00\x00WAVE'
        result = voice_service.validate_audio_format(wav_data, AudioFormat.WAV)
        assert result is True
    
    def test_validate_audio_format_invalid(self, voice_service):
        """Test invalid audio format validation."""
        invalid_data = b'invalid audio data'
        result = voice_service.validate_audio_format(invalid_data, AudioFormat.WAV)
        assert result is False
    
    def test_process_command_text_medication(self, voice_service):
        """Test command text processing for medication queries."""
        text = "Check Buddy's medication status"
        pet_names = ["Buddy", "Max"]
        
        result = voice_service._process_command_text(text, pet_names)
        
        assert result["command_type"] == "medication"
        assert "Buddy" in result["mentioned_pets"]
        assert result["original_text"] == text
    
    def test_process_command_text_feeding(self, voice_service):
        """Test command text processing for feeding logs."""
        text = "Log feeding for Max - gave him kibble"
        pet_names = ["Buddy", "Max"]
        
        result = voice_service._process_command_text(text, pet_names)
        
        assert result["command_type"] == "feeding"
        assert "Max" in result["mentioned_pets"]
    
    def test_process_command_text_emergency(self, voice_service):
        """Test command text processing for emergency queries."""
        text = "I need emergency vet help"
        pet_names = ["Buddy"]
        
        result = voice_service._process_command_text(text, pet_names)
        
        assert result["command_type"] == "emergency"
    
    def test_process_command_text_toxicity(self, voice_service):
        """Test command text processing for toxicity checks."""
        text = "My dog ate chocolate, is it toxic?"
        pet_names = ["Buddy"]
        
        result = voice_service._process_command_text(text, pet_names)
        
        assert result["command_type"] == "toxicity"
    
    def test_personalize_response_single_pet(self, voice_service):
        """Test response personalization with single pet."""
        response = "Your pet needs medication"
        pet_names = ["Buddy"]
        
        result = voice_service._personalize_response(response, pet_names)
        
        assert "Buddy" in result
        assert "your pet" not in result.lower()
    
    def test_personalize_response_multiple_pets(self, voice_service):
        """Test response personalization with multiple pets."""
        response = "Your pets are healthy"
        pet_names = ["Buddy", "Max", "Luna"]
        
        result = voice_service._personalize_response(response, pet_names)
        
        assert "Buddy, Max and Luna" in result
    
    @pytest.mark.asyncio
    async def test_create_web_speech_config(self, voice_service):
        """Test Web Speech API configuration creation."""
        text = "Hello, this is a test"
        voice = VoiceModel.NOVA
        speed = 0.95
        
        result = await voice_service._create_web_speech_config(text, voice, speed)
        
        assert result.success is True
        assert result.provider == "web_speech_api"
        assert text in result.content
    
    @pytest.mark.asyncio
    async def test_health_check(self, voice_service):
        """Test voice service health check."""
        with patch.object(voice_service, 'synthesize_speech') as mock_synthesize:
            mock_synthesize.return_value = VoiceProcessingResult(
                success=True,
                content="Test",
                provider="web_speech_api"
            )
            
            result = await voice_service.health_check()
            
            assert result["status"] == "healthy"
            assert result["tts_voice"] == voice_service.tts_voice.value
            assert result["tts_speed"] == voice_service.tts_speed