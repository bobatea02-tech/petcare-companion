"""
Tests for AI Processing Service.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.ai_service import (
    AIService, 
    QueryComplexity, 
    TriageLevel, 
    SymptomAnalysisResult,
    TriageResponse,
    AIProvider
)


class TestAIService:
    """Test cases for AI service functionality."""
    
    @pytest.fixture
    def ai_service(self):
        """Create AI service instance for testing."""
        return AIService()
    
    def test_determine_model_complex_query(self, ai_service):
        """Test model selection for complex queries."""
        model = ai_service._determine_model(QueryComplexity.COMPLEX)
        assert model == ai_service.primary_model
    
    def test_determine_model_simple_query(self, ai_service):
        """Test model selection for simple queries."""
        model = ai_service._determine_model(QueryComplexity.SIMPLE)
        assert model == ai_service.fallback_model
    
    def test_determine_model_emergency_query(self, ai_service):
        """Test model selection for emergency queries."""
        model = ai_service._determine_model(QueryComplexity.EMERGENCY)
        assert model == ai_service.primary_model
    
    def test_extract_symptoms_from_input(self, ai_service):
        """Test symptom extraction from user input."""
        input_text = "My dog is vomiting and has diarrhea"
        symptoms = ai_service._extract_symptoms_from_input(input_text)
        assert "vomiting" in symptoms
        assert "diarrhea" in symptoms
    
    def test_extract_symptoms_no_keywords(self, ai_service):
        """Test symptom extraction when no keywords found."""
        input_text = "My pet seems unwell"
        symptoms = ai_service._extract_symptoms_from_input(input_text)
        assert symptoms == ["My pet seems unwell"]
    
    def test_scaledown_compression(self, ai_service):
        """Test ScaleDown compression functionality."""
        knowledge_base = """
        Emergency symptoms include breathing difficulty. 
        Routine care involves regular feeding.
        Toxic substances are dangerous for pets.
        Normal behavior includes playing and eating.
        """
        compressed = ai_service._apply_scaledown_compression(knowledge_base)
        
        # Should be shorter than original
        assert len(compressed) < len(knowledge_base)
        # Should prioritize medical terms
        assert "toxic" in compressed.lower() or "emergency" in compressed.lower()
    
    def test_parse_triage_response_json(self, ai_service):
        """Test parsing JSON triage response."""
        json_response = '''
        {
            "triage_level": "red",
            "confidence_score": 0.9,
            "analysis": "Emergency situation",
            "recommendations": ["Seek immediate care"]
        }
        '''
        
        triage_level, confidence, analysis, recommendations = ai_service._parse_triage_response(json_response)
        
        assert triage_level == TriageLevel.RED
        assert confidence == 0.9
        assert analysis == "Emergency situation"
        assert recommendations == ["Seek immediate care"]
    
    def test_parse_triage_response_text_emergency(self, ai_service):
        """Test parsing text response with emergency keywords."""
        text_response = "This is an emergency situation requiring immediate attention."
        
        triage_level, confidence, analysis, recommendations = ai_service._parse_triage_response(text_response)
        
        assert triage_level == TriageLevel.RED
        assert confidence == 0.8
        assert analysis == text_response
    
    def test_parse_triage_response_text_schedule(self, ai_service):
        """Test parsing text response with scheduling keywords."""
        text_response = "You should schedule a vet visit soon."
        
        triage_level, confidence, analysis, recommendations = ai_service._parse_triage_response(text_response)
        
        assert triage_level == TriageLevel.YELLOW
        assert confidence == 0.7
    
    def test_parse_triage_response_text_monitor(self, ai_service):
        """Test parsing text response for monitoring."""
        text_response = "This can be monitored at home with routine care."
        
        triage_level, confidence, analysis, recommendations = ai_service._parse_triage_response(text_response)
        
        assert triage_level == TriageLevel.GREEN
        assert confidence == 0.6
    
    def test_create_red_triage_response(self, ai_service):
        """Test creation of RED triage response."""
        analysis_result = SymptomAnalysisResult(
            triage_level=TriageLevel.RED,
            confidence_score=0.9,
            analysis="Emergency symptoms detected",
            recommendations=["Seek immediate care"],
            symptoms_processed=["breathing difficulty"],
            model_used="gpt-4-turbo-preview"
        )
        
        response = ai_service._create_red_triage_response(analysis_result)
        
        assert response.triage_level == TriageLevel.RED
        assert "EMERGENCY" in response.message
        assert response.emergency_info is not None
        assert "display_emergency_vets" in response.actions
    
    def test_create_yellow_triage_response(self, ai_service):
        """Test creation of YELLOW triage response."""
        analysis_result = SymptomAnalysisResult(
            triage_level=TriageLevel.YELLOW,
            confidence_score=0.7,
            analysis="Symptoms need veterinary attention",
            recommendations=["Schedule appointment"],
            symptoms_processed=["vomiting"],
            model_used="gpt-4-turbo-preview"
        )
        
        response = ai_service._create_yellow_triage_response(analysis_result)
        
        assert response.triage_level == TriageLevel.YELLOW
        assert "SCHEDULE VET VISIT" in response.message
        assert response.scheduling_info is not None
        assert "schedule_vet_appointment" in response.actions
    
    def test_create_green_triage_response(self, ai_service):
        """Test creation of GREEN triage response."""
        analysis_result = SymptomAnalysisResult(
            triage_level=TriageLevel.GREEN,
            confidence_score=0.6,
            analysis="Minor symptoms for monitoring",
            recommendations=["Monitor at home"],
            symptoms_processed=["mild lethargy"],
            model_used="gpt-3.5-turbo"
        )
        
        response = ai_service._create_green_triage_response(analysis_result)
        
        assert response.triage_level == TriageLevel.GREEN
        assert "MONITOR AT HOME" in response.message
        assert response.monitoring_guidance is not None
        assert "setup_home_monitoring" in response.actions
    
    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings')
    async def test_health_check_no_client(self, mock_settings):
        """Test health check when AI client is not configured."""
        # Mock settings with no API keys
        mock_settings.AI_PROVIDER = "gemini"
        mock_settings.GEMINI_API_KEY = None
        mock_settings.OPENAI_API_KEY = None
        mock_settings.PRIMARY_AI_MODEL = "gemini-2.5-pro"
        mock_settings.FALLBACK_AI_MODEL = "gemini-1.5-flash"
        mock_settings.AI_TEMPERATURE = 0.7
        mock_settings.AI_MAX_TOKENS = 1000
        
        from app.services.ai_service import AIService
        ai_service_no_key = AIService()
        
        health_info = await ai_service_no_key.health_check()
        
        assert health_info["status"] == "unhealthy"
        assert health_info["models_available"] is False
        assert "API key not configured" in health_info["error"]
    
    @pytest.mark.asyncio
    @patch('app.services.ai_service.genai')
    async def test_health_check_success(self, mock_genai, ai_service):
        """Test successful health check."""
        # Mock Gemini model and response
        mock_model = AsyncMock()
        mock_response = MagicMock()
        mock_response.text = "Test response"
        mock_response.usage_metadata = MagicMock()
        mock_response.usage_metadata.prompt_token_count = 10
        mock_response.usage_metadata.candidates_token_count = 5
        mock_response.usage_metadata.total_token_count = 15
        
        # Mock the generate_content method to return our mock response
        async def mock_generate_content(*args, **kwargs):
            return mock_response
        
        # Set up the mock
        mock_genai.GenerativeModel.return_value = mock_model
        ai_service.gemini_model = mock_model
        ai_service.provider = AIProvider.GEMINI
        
        # Mock asyncio.to_thread to return our mock response directly
        with patch('asyncio.to_thread', return_value=mock_response):
            health_info = await ai_service.health_check()
        
        assert health_info["status"] == "healthy"
        assert health_info["models_available"] is True
        assert health_info["test_response_received"] is True
        assert health_info["provider"] == "gemini"
    
    def test_scaledown_compression(self, ai_service):
        """Test ScaleDown compression functionality."""
        knowledge_base = """
        Emergency symptoms include breathing difficulty. 
        Routine care involves regular feeding.
        Toxic substances are dangerous for pets.
        Normal behavior includes playing and eating.
        Veterinary attention may be needed for persistent symptoms.
        """
        compressed = ai_service._apply_scaledown_compression(knowledge_base)
        
        # Should be shorter than original (or same if no compression possible)
        assert len(compressed) <= len(knowledge_base)
        # Should prioritize medical terms
        assert any(word in compressed.lower() for word in ["toxic", "emergency", "veterinary"])
    
    def test_fallback_compression(self, ai_service):
        """Test fallback compression when ScaleDown API unavailable."""
        knowledge_base = """Emergency symptoms include breathing difficulty and seizures. Routine care involves regular feeding and exercise. Toxic substances like chocolate are dangerous for pets. Normal behavior includes playing and eating regularly. Additional information about general pet care and maintenance. More details about routine veterinary checkups and procedures. Information about pet nutrition and dietary requirements. Details about exercise needs and activity levels for pets."""
        
        compressed = ai_service._fallback_compression(knowledge_base)
        
        # Should be shorter than original (75% compression target)
        assert len(compressed) < len(knowledge_base)
        # Should prioritize emergency and toxic keywords
        assert "emergency" in compressed.lower() or "toxic" in compressed.lower()
        # Should contain high-priority medical terms
        priority_terms_found = any(term in compressed.lower() for term in 
                                 ["emergency", "toxic", "symptom", "breathing", "seizure"])
        assert priority_terms_found


class TestSymptomAnalysisResult:
    """Test cases for SymptomAnalysisResult class."""
    
    def test_to_dict(self):
        """Test conversion to dictionary."""
        result = SymptomAnalysisResult(
            triage_level=TriageLevel.YELLOW,
            confidence_score=0.8,
            analysis="Test analysis",
            recommendations=["Test recommendation"],
            symptoms_processed=["vomiting"],
            model_used="gpt-4-turbo-preview",
            compressed_knowledge_used=True
        )
        
        result_dict = result.to_dict()
        
        assert result_dict["triage_level"] == "yellow"
        assert result_dict["confidence_score"] == 0.8
        assert result_dict["analysis"] == "Test analysis"
        assert result_dict["recommendations"] == ["Test recommendation"]
        assert result_dict["symptoms_processed"] == ["vomiting"]
        assert result_dict["model_used"] == "gpt-4-turbo-preview"
        assert result_dict["compressed_knowledge_used"] is True
        assert "timestamp" in result_dict


class TestTriageResponse:
    """Test cases for TriageResponse class."""
    
    def test_to_dict(self):
        """Test conversion to dictionary."""
        response = TriageResponse(
            triage_level=TriageLevel.RED,
            message="Emergency response",
            actions=["display_emergency_vets"],
            emergency_info={"urgency": "IMMEDIATE"}
        )
        
        response_dict = response.to_dict()
        
        assert response_dict["triage_level"] == "red"
        assert response_dict["message"] == "Emergency response"
        assert response_dict["actions"] == ["display_emergency_vets"]
        assert response_dict["emergency_info"] == {"urgency": "IMMEDIATE"}
        assert "timestamp" in response_dict