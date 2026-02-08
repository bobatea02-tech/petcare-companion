"""
Tests for retry logic and fallback mechanisms.

This test suite validates:
1. Exponential backoff for failed API calls
2. Fallback to GPT-3.5 when GPT-4 is unavailable
3. Cached emergency vet locations for Maps API failures
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import openai
import httpx

from app.services.ai_service import AIService, QueryComplexity, AIModel, AIProvider
from app.services.maps_service import MapsService, EmergencyVetLocation
from app.core.circuit_breaker import CircuitBreakerError


class TestAIServiceRetryAndFallback:
    """Test AI service retry logic and fallback mechanisms."""
    
    @pytest.fixture
    def ai_service(self):
        """Create AI service instance for testing."""
        with patch('app.services.ai_service.settings') as mock_settings:
            mock_settings.AI_PROVIDER = "openai"
            mock_settings.PRIMARY_AI_MODEL = "gpt-4-turbo-preview"
            mock_settings.FALLBACK_AI_MODEL = "gpt-3.5-turbo"
            mock_settings.OPENAI_API_KEY = "test-key"
            mock_settings.AI_TEMPERATURE = 0.7
            mock_settings.AI_MAX_TOKENS = 1000
            mock_settings.SCALEDOWN_API_KEY = None
            
            service = AIService()
            return service
    
    @pytest.mark.asyncio
    async def test_exponential_backoff_on_rate_limit(self, ai_service):
        """Test that exponential backoff is applied on rate limit errors."""
        # Mock the OpenAI client to raise RateLimitError multiple times
        mock_client = AsyncMock()
        ai_service.openai_client = mock_client
        
        # First two calls fail with rate limit, third succeeds
        mock_client.chat.completions.create.side_effect = [
            openai.RateLimitError("Rate limit exceeded", response=Mock(), body={}),
            openai.RateLimitError("Rate limit exceeded", response=Mock(), body={}),
            Mock(
                choices=[Mock(message=Mock(content="Success"), finish_reason="stop")],
                model="gpt-4-turbo-preview",
                usage=Mock(prompt_tokens=10, completion_tokens=20, total_tokens=30)
            )
        ]
        
        messages = [{"role": "user", "content": "Test"}]
        
        # Should succeed after retries
        result = await ai_service._make_ai_request(messages, "gpt-4-turbo-preview")
        
        assert result["content"] == "Success"
        assert mock_client.chat.completions.create.call_count == 3
    
    @pytest.mark.asyncio
    async def test_exponential_backoff_on_timeout(self, ai_service):
        """Test that exponential backoff is applied on timeout errors."""
        mock_client = AsyncMock()
        ai_service.openai_client = mock_client
        
        # First call times out, second succeeds
        mock_client.chat.completions.create.side_effect = [
            openai.APITimeoutError("Request timed out"),
            Mock(
                choices=[Mock(message=Mock(content="Success"), finish_reason="stop")],
                model="gpt-4-turbo-preview",
                usage=Mock(prompt_tokens=10, completion_tokens=20, total_tokens=30)
            )
        ]
        
        messages = [{"role": "user", "content": "Test"}]
        
        result = await ai_service._make_ai_request(messages, "gpt-4-turbo-preview")
        
        assert result["content"] == "Success"
        assert mock_client.chat.completions.create.call_count == 2
    
    @pytest.mark.asyncio
    async def test_exponential_backoff_on_connection_error(self, ai_service):
        """Test that exponential backoff is applied on connection errors."""
        mock_client = AsyncMock()
        ai_service.openai_client = mock_client
        
        # First call has connection error, second succeeds
        mock_client.chat.completions.create.side_effect = [
            openai.APIConnectionError(request=Mock()),
            Mock(
                choices=[Mock(message=Mock(content="Success"), finish_reason="stop")],
                model="gpt-4-turbo-preview",
                usage=Mock(prompt_tokens=10, completion_tokens=20, total_tokens=30)
            )
        ]
        
        messages = [{"role": "user", "content": "Test"}]
        
        result = await ai_service._make_ai_request(messages, "gpt-4-turbo-preview")
        
        assert result["content"] == "Success"
        assert mock_client.chat.completions.create.call_count == 2
    
    @pytest.mark.asyncio
    async def test_fallback_to_gpt35_when_gpt4_fails(self, ai_service):
        """Test fallback to GPT-3.5 when GPT-4 is unavailable."""
        mock_client = AsyncMock()
        ai_service.openai_client = mock_client
        
        call_count = 0
        
        def side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            
            # GPT-4 calls fail
            if kwargs.get('model') == 'gpt-4-turbo-preview':
                raise openai.APIError("GPT-4 unavailable")
            # GPT-3.5 calls succeed
            else:
                return Mock(
                    choices=[Mock(message=Mock(content="Fallback success"), finish_reason="stop")],
                    model="gpt-3.5-turbo",
                    usage=Mock(prompt_tokens=10, completion_tokens=20, total_tokens=30)
                )
        
        mock_client.chat.completions.create.side_effect = side_effect
        
        messages = [{"role": "user", "content": "Test"}]
        
        # Should fallback to GPT-3.5
        result = await ai_service.generate_response(
            messages=messages,
            complexity=QueryComplexity.COMPLEX  # Would normally use GPT-4
        )
        
        assert result["content"] == "Fallback success"
        assert result["model"] == "gpt-3.5-turbo"
        # Should have tried GPT-4 (with retries) then succeeded with GPT-3.5
        assert call_count >= 4  # 3 GPT-4 retries + 1 GPT-3.5 success
    
    @pytest.mark.asyncio
    async def test_fallback_with_reduced_parameters(self, ai_service):
        """Test fallback attempts with reduced parameters when quota exceeded."""
        mock_client = AsyncMock()
        ai_service.openai_client = mock_client
        
        call_count = 0
        
        def side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            
            # GPT-4 fails
            if kwargs.get('model') == 'gpt-4-turbo-preview':
                raise openai.APIError("GPT-4 unavailable")
            
            # First GPT-3.5 attempt with full params fails
            if kwargs.get('max_tokens') == 1000:
                raise openai.RateLimitError("Quota exceeded", response=Mock(), body={})
            
            # Second GPT-3.5 attempt with reduced params succeeds
            return Mock(
                choices=[Mock(message=Mock(content="Reduced params success"), finish_reason="stop")],
                model="gpt-3.5-turbo",
                usage=Mock(prompt_tokens=10, completion_tokens=15, total_tokens=25)
            )
        
        mock_client.chat.completions.create.side_effect = side_effect
        
        messages = [{"role": "user", "content": "Test"}]
        
        result = await ai_service.generate_response(
            messages=messages,
            complexity=QueryComplexity.COMPLEX,
            max_tokens=1000
        )
        
        assert result["content"] == "Reduced params success"
        assert result["model"] == "gpt-3.5-turbo"
    
    @pytest.mark.asyncio
    async def test_all_models_fail_raises_exception(self, ai_service):
        """Test that exception is raised when all models fail."""
        mock_client = AsyncMock()
        ai_service.openai_client = mock_client
        
        # All calls fail
        mock_client.chat.completions.create.side_effect = openai.APIError(
            message="All models down",
            request=Mock(),
            body={}
        )
        
        messages = [{"role": "user", "content": "Test"}]
        
        with pytest.raises(Exception) as exc_info:
            await ai_service.generate_response(
                messages=messages,
                complexity=QueryComplexity.COMPLEX
            )
        
        assert "unavailable" in str(exc_info.value).lower() or "failed" in str(exc_info.value).lower()


class TestMapsServiceRetryAndFallback:
    """Test Maps service retry logic and fallback mechanisms."""
    
    @pytest.fixture
    def maps_service(self):
        """Create Maps service instance for testing."""
        with patch('app.services.maps_service.settings') as mock_settings:
            mock_settings.GOOGLE_MAPS_API_KEY = "test-key"
            service = MapsService()
            return service
    
    @pytest.mark.asyncio
    async def test_exponential_backoff_on_timeout(self, maps_service):
        """Test that exponential backoff is applied on timeout errors."""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            # First call times out, second succeeds
            mock_client.get.side_effect = [
                httpx.TimeoutException("Request timed out"),
                Mock(
                    status_code=200,
                    json=lambda: {
                        "status": "OK",
                        "results": [
                            {
                                "name": "Test Vet",
                                "vicinity": "123 Test St",
                                "geometry": {"location": {"lat": 40.7128, "lng": -74.0060}},
                                "place_id": "test123"
                            }
                        ]
                    }
                ),
                # Mock for place details call
                Mock(
                    status_code=200,
                    json=lambda: {
                        "status": "OK",
                        "result": {
                            "formatted_phone_number": "555-1234"
                        }
                    }
                )
            ]
            
            results = await maps_service._search_places(
                latitude=40.7128,
                longitude=-74.0060,
                radius_meters=40000,
                query="emergency vet",
                place_type="veterinary_care"
            )
            
            assert len(results) > 0
            # Should have retried once (2 calls for search) + 1 call for place details
            assert mock_client.get.call_count >= 2
    
    @pytest.mark.asyncio
    async def test_exponential_backoff_on_connection_error(self, maps_service):
        """Test that exponential backoff is applied on connection errors."""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            # First call has connection error, second succeeds
            mock_client.get.side_effect = [
                httpx.ConnectError("Connection failed"),
                Mock(
                    status_code=200,
                    json=lambda: {
                        "status": "OK",
                        "results": []
                    }
                )
            ]
            
            results = await maps_service._search_places(
                latitude=40.7128,
                longitude=-74.0060,
                radius_meters=40000,
                query="emergency vet",
                place_type="veterinary_care"
            )
            
            assert isinstance(results, list)
            # Should have retried once (2 calls total)
            assert mock_client.get.call_count >= 2
    
    @pytest.mark.asyncio
    async def test_cached_vets_fallback_on_api_failure(self, maps_service):
        """Test that cached emergency vets are returned when API fails."""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            # All API calls fail
            mock_client.get.side_effect = httpx.TimeoutException("Persistent timeout")
            
            # Should return cached results
            results = await maps_service.find_emergency_vets(
                latitude=40.7128,
                longitude=-74.0060,
                radius_miles=25.0
            )
            
            assert len(results) > 0
            # Verify these are cached results
            assert any("BluePearl" in vet.name for vet in results)
            assert any("VCA" in vet.name for vet in results)
            assert all(vet.is_24_hour for vet in results)
    
    @pytest.mark.asyncio
    async def test_cached_vets_include_poison_control(self, maps_service):
        """Test that cached vets include poison control hotlines."""
        results = await maps_service.get_cached_emergency_vets(
            latitude=40.7128,
            longitude=-74.0060,
            radius_miles=25.0
        )
        
        # Should include poison control centers
        poison_control_names = [vet.name for vet in results]
        assert any("Poison Control" in name for name in poison_control_names)
        
        # Verify poison control has phone numbers
        poison_control_vets = [vet for vet in results if "Poison" in vet.name]
        for vet in poison_control_vets:
            assert vet.phone is not None
            assert len(vet.phone) > 0
    
    @pytest.mark.asyncio
    async def test_cached_vets_regional_guidance(self, maps_service):
        """Test that cached vets include regional guidance for major areas."""
        # Test Northeast US coordinates (New York)
        results_ny = await maps_service.get_cached_emergency_vets(
            latitude=40.7128,
            longitude=-74.0060,
            radius_miles=25.0
        )
        
        # Should include regional guidance
        regional_vets = [vet for vet in results_ny if "Regional" in vet.name]
        assert len(regional_vets) > 0
        assert any("Northeast" in vet.name for vet in regional_vets)
        
        # Test West Coast coordinates (Los Angeles)
        results_la = await maps_service.get_cached_emergency_vets(
            latitude=34.0522,
            longitude=-118.2437,
            radius_miles=25.0
        )
        
        regional_vets_la = [vet for vet in results_la if "Regional" in vet.name]
        assert len(regional_vets_la) > 0
        assert any("West Coast" in vet.name for vet in regional_vets_la)
    
    @pytest.mark.asyncio
    async def test_geocode_retry_on_timeout(self, maps_service):
        """Test that geocoding retries on timeout errors."""
        mock_geocoder = AsyncMock()
        maps_service.geocoder = Mock()
        
        # First call times out, second succeeds
        call_count = 0
        
        def geocode_side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                from geopy.exc import GeocoderTimedOut
                raise GeocoderTimedOut("Timeout")
            return Mock(latitude=40.7128, longitude=-74.0060)
        
        maps_service.geocoder.geocode = geocode_side_effect
        
        result = await maps_service.geocode_address("123 Test St, New York, NY")
        
        assert result is not None
        assert result[0] == 40.7128
        assert result[1] == -74.0060
        assert call_count == 2
    
    @pytest.mark.asyncio
    async def test_reverse_geocode_retry_on_service_error(self, maps_service):
        """Test that reverse geocoding retries on service errors."""
        mock_geocoder = AsyncMock()
        maps_service.geocoder = Mock()
        
        # First call has service error, second succeeds
        call_count = 0
        
        def reverse_side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                from geopy.exc import GeocoderServiceError
                raise GeocoderServiceError("Service error")
            return Mock(address="123 Test St, New York, NY")
        
        maps_service.geocoder.reverse = reverse_side_effect
        
        result = await maps_service.reverse_geocode(40.7128, -74.0060)
        
        assert result is not None
        assert "Test St" in result
        assert call_count == 2


class TestCircuitBreakerIntegration:
    """Test circuit breaker integration with retry and fallback."""
    
    @pytest.mark.asyncio
    async def test_circuit_breaker_triggers_cached_fallback(self):
        """Test that circuit breaker open state triggers cached fallback."""
        with patch('app.services.maps_service.settings') as mock_settings:
            mock_settings.GOOGLE_MAPS_API_KEY = "test-key"
            maps_service = MapsService()
            
            with patch('httpx.AsyncClient') as mock_client_class:
                mock_client = AsyncMock()
                mock_client_class.return_value.__aenter__.return_value = mock_client
                
                # Simulate persistent failures to open circuit breaker
                mock_client.get.side_effect = Exception("Persistent failure")
                
                # First call should fail and eventually return cached results
                results = await maps_service.find_emergency_vets(
                    latitude=40.7128,
                    longitude=-74.0060,
                    radius_miles=25.0
                )
                
                # Should return cached results as fallback
                assert len(results) > 0
                assert any("BluePearl" in vet.name for vet in results)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
