"""
AI Processing Service for PawPal Voice Pet Care Assistant.

This service handles AI API integration (OpenAI GPT and Google Gemini), 
model selection, and AI-powered symptom analysis with proper error handling 
and retry logic.
"""

import asyncio
import json
import logging
import re
from typing import Optional, Dict, Any, List, Tuple
from enum import Enum
from datetime import datetime
import openai
from openai import AsyncOpenAI
import google.generativeai as genai
import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log
)

from app.core.config import settings
from app.core.circuit_breaker import with_circuit_breaker, CircuitBreakerError
from app.core.error_monitoring import log_error, ErrorCategory, ErrorSeverity
from app.core.graceful_degradation import (
    with_fallback,
    set_service_degraded,
    set_service_unavailable,
    set_service_available
)

logger = logging.getLogger(__name__)


class AIModel(Enum):
    """Available AI models for different use cases."""
    # OpenAI Models
    GPT4_TURBO = "gpt-4-turbo-preview"
    GPT35_TURBO = "gpt-3.5-turbo"
    # Gemini Models
    GEMINI_PRO = "gemini-1.5-pro"
    GEMINI_FLASH = "gemini-1.5-flash"


class AIProvider(Enum):
    """AI service providers."""
    OPENAI = "openai"
    GEMINI = "gemini"


class QueryComplexity(Enum):
    """Query complexity levels for model selection."""
    SIMPLE = "simple"
    COMPLEX = "complex"
    EMERGENCY = "emergency"


class TriageLevel(Enum):
    """Triage levels for symptom assessment."""
    GREEN = "green"  # Monitor at home
    YELLOW = "yellow"  # Schedule vet visit within 24-48 hours
    RED = "red"  # Emergency - seek immediate veterinary care


class TriageResponse:
    """Response object for triage assessment with specific actions."""
    
    def __init__(
        self,
        triage_level: TriageLevel,
        message: str,
        actions: List[str],
        emergency_info: Optional[Dict[str, Any]] = None,
        scheduling_info: Optional[Dict[str, Any]] = None,
        monitoring_guidance: Optional[Dict[str, Any]] = None
    ):
        self.triage_level = triage_level
        self.message = message
        self.actions = actions
        self.emergency_info = emergency_info
        self.scheduling_info = scheduling_info
        self.monitoring_guidance = monitoring_guidance
        self.timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert response to dictionary format."""
        return {
            "triage_level": self.triage_level.value,
            "message": self.message,
            "actions": self.actions,
            "emergency_info": self.emergency_info,
            "scheduling_info": self.scheduling_info,
            "monitoring_guidance": self.monitoring_guidance,
            "timestamp": self.timestamp.isoformat()
        }


class SymptomAnalysisResult:
    
    def __init__(
        self,
        triage_level: TriageLevel,
        confidence_score: float,
        analysis: str,
        recommendations: List[str],
        symptoms_processed: List[str],
        model_used: str,
        compressed_knowledge_used: bool = False
    ):
        self.triage_level = triage_level
        self.confidence_score = confidence_score
        self.analysis = analysis
        self.recommendations = recommendations
        self.symptoms_processed = symptoms_processed
        self.model_used = model_used
        self.compressed_knowledge_used = compressed_knowledge_used
        self.timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary format."""
        return {
            "triage_level": self.triage_level.value,
            "confidence_score": self.confidence_score,
            "analysis": self.analysis,
            "recommendations": self.recommendations,
            "symptoms_processed": self.symptoms_processed,
            "model_used": self.model_used,
            "compressed_knowledge_used": self.compressed_knowledge_used,
            "timestamp": self.timestamp.isoformat()
        }


class AIService:
    """Service for AI processing with support for OpenAI and Gemini APIs."""
    
    def __init__(self):
        """Initialize AI service with configured provider."""
        self.provider = AIProvider(settings.AI_PROVIDER)
        self.primary_model = settings.PRIMARY_AI_MODEL
        self.fallback_model = settings.FALLBACK_AI_MODEL
        self.temperature = settings.AI_TEMPERATURE
        self.max_tokens = settings.AI_MAX_TOKENS
        
        # Initialize clients based on provider
        self.openai_client = None
        self.gemini_model = None
        
        if self.provider == AIProvider.OPENAI:
            if settings.OPENAI_API_KEY:
                self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            else:
                logger.warning("OpenAI API key not configured")
        
        elif self.provider == AIProvider.GEMINI:
            if settings.GEMINI_API_KEY:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.gemini_model = genai.GenerativeModel(self.primary_model)
            else:
                logger.warning("Gemini API key not configured")
    
    def _determine_model(self, complexity: QueryComplexity) -> str:
        """
        Determine which AI model to use based on query complexity.
        
        Args:
            complexity: The complexity level of the query
            
        Returns:
            Model name to use for the query
        """
        if complexity in [QueryComplexity.COMPLEX, QueryComplexity.EMERGENCY]:
            return self.primary_model
        return self.fallback_model
    
    @with_circuit_breaker(
        name="ai_service",
        failure_threshold=5,
        timeout_seconds=60,
        half_open_max_calls=3,
        success_threshold=2
    )
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((
            openai.RateLimitError,
            openai.APITimeoutError,
            openai.APIConnectionError,
            httpx.TimeoutException,
            httpx.ConnectError,
            Exception  # For Gemini errors
        )),
        before_sleep=before_sleep_log(logger, logging.WARNING)
    )
    async def _make_ai_request(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Make a request to the configured AI provider with retry logic.
        
        Args:
            messages: List of message dictionaries for the conversation
            model: Model name to use
            temperature: Temperature setting for response randomness
            max_tokens: Maximum tokens in response
            
        Returns:
            AI API response
            
        Raises:
            Exception: If API request fails after retries
        """
        if self.provider == AIProvider.OPENAI:
            return await self._make_openai_request(messages, model, temperature, max_tokens)
        elif self.provider == AIProvider.GEMINI:
            return await self._make_gemini_request(messages, model, temperature, max_tokens)
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")
    
    async def _make_openai_request(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """Make request to OpenAI API."""
        if not self.openai_client:
            raise ValueError("OpenAI client not initialized - API key missing")
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature or self.temperature,
                max_tokens=max_tokens or self.max_tokens
            )
            
            return {
                "content": response.choices[0].message.content,
                "model": response.model,
                "usage": response.usage.model_dump() if response.usage else None,
                "finish_reason": response.choices[0].finish_reason,
                "provider": "openai"
            }
            
        except openai.BadRequestError as e:
            logger.error(f"Bad request to OpenAI API: {e}")
            await log_error(e, ErrorCategory.EXTERNAL_SERVICE_ERROR, ErrorSeverity.MEDIUM)
            raise
        except openai.AuthenticationError as e:
            logger.error(f"Authentication error with OpenAI API: {e}")
            await log_error(e, ErrorCategory.AUTHENTICATION_ERROR, ErrorSeverity.HIGH)
            await set_service_unavailable("ai_service", "OpenAI authentication failed")
            raise
        except openai.PermissionDeniedError as e:
            logger.error(f"Permission denied for OpenAI API: {e}")
            await log_error(e, ErrorCategory.AUTHENTICATION_ERROR, ErrorSeverity.HIGH)
            raise
        except openai.NotFoundError as e:
            logger.error(f"OpenAI API endpoint not found: {e}")
            await log_error(e, ErrorCategory.EXTERNAL_SERVICE_ERROR, ErrorSeverity.MEDIUM)
            raise
        except Exception as e:
            logger.error(f"Unexpected error in OpenAI API request: {e}")
            await log_error(e, ErrorCategory.EXTERNAL_SERVICE_ERROR, ErrorSeverity.HIGH)
            raise
    
    async def _make_gemini_request(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """Make request to Gemini API."""
        if not self.gemini_model:
            raise ValueError("Gemini model not initialized - API key missing")
        
        try:
            # Convert OpenAI-style messages to Gemini format
            prompt = self._convert_messages_to_gemini_prompt(messages)
            
            # Configure generation parameters
            generation_config = genai.types.GenerationConfig(
                temperature=temperature or self.temperature,
                max_output_tokens=max_tokens or self.max_tokens,
            )
            
            # Use the model specified or fallback to configured model
            if model != self.primary_model:
                # Create new model instance for different model
                current_model = genai.GenerativeModel(model)
            else:
                current_model = self.gemini_model
            
            # Generate response
            response = await asyncio.to_thread(
                current_model.generate_content,
                prompt,
                generation_config=generation_config
            )
            
            # Handle response text extraction safely
            try:
                response_text = response.text
            except ValueError:
                # Handle multi-part responses
                if response.candidates and response.candidates[0].content.parts:
                    response_text = ''.join(part.text for part in response.candidates[0].content.parts if hasattr(part, 'text'))
                else:
                    response_text = "No response generated"
            
            return {
                "content": response_text,
                "model": model,
                "usage": {
                    "prompt_tokens": 0,  # Usage metadata not available in this API version
                    "completion_tokens": 0,
                    "total_tokens": 0
                },
                "finish_reason": "stop",
                "provider": "gemini"
            }
            
        except Exception as e:
            logger.error(f"Error in Gemini API request: {e}")
            await log_error(e, ErrorCategory.EXTERNAL_SERVICE_ERROR, ErrorSeverity.HIGH)
            raise
    
    def _convert_messages_to_gemini_prompt(self, messages: List[Dict[str, str]]) -> str:
        """
        Convert OpenAI-style messages to Gemini prompt format.
        
        Args:
            messages: List of message dictionaries
            
        Returns:
            Formatted prompt string for Gemini
        """
        prompt_parts = []
        
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            
            if role == "system":
                prompt_parts.append(f"System Instructions: {content}")
            elif role == "user":
                prompt_parts.append(f"User: {content}")
            elif role == "assistant":
                prompt_parts.append(f"Assistant: {content}")
        
        return "\n\n".join(prompt_parts)
    
    async def _fallback_to_secondary_model(
        self,
        messages: List[Dict[str, str]],
        primary_model: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Attempt to use fallback model when primary model fails.
        
        This method implements intelligent fallback with exponential backoff:
        1. First attempts the configured fallback model
        2. If fallback model also fails, tries with reduced parameters
        3. Logs all fallback attempts for monitoring
        
        Args:
            messages: List of message dictionaries for the conversation
            primary_model: The primary model that failed
            temperature: Temperature setting for response randomness
            max_tokens: Maximum tokens in response
            
        Returns:
            AI API response from fallback model
            
        Raises:
            Exception: If all fallback attempts fail
        """
        fallback_model = self.fallback_model if primary_model == self.primary_model else self.primary_model
        
        logger.warning(
            f"Initiating fallback from {primary_model} to {fallback_model}. "
            f"This may result in reduced response quality."
        )
        
        try:
            # First attempt: Try fallback model with same parameters
            response = await self._make_ai_request(
                messages=messages,
                model=fallback_model,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            logger.info(f"Fallback to {fallback_model} succeeded")
            return response
            
        except Exception as first_error:
            logger.warning(
                f"First fallback attempt with {fallback_model} failed: {first_error}. "
                f"Attempting with reduced parameters."
            )
            
            try:
                # Second attempt: Try with reduced max_tokens to avoid quota issues
                reduced_max_tokens = (max_tokens or self.max_tokens) // 2
                
                response = await self._make_ai_request(
                    messages=messages,
                    model=fallback_model,
                    temperature=temperature,
                    max_tokens=reduced_max_tokens
                )
                
                logger.info(
                    f"Fallback to {fallback_model} succeeded with reduced parameters "
                    f"(max_tokens: {reduced_max_tokens})"
                )
                return response
                
            except Exception as second_error:
                logger.error(
                    f"All fallback attempts failed. "
                    f"Primary model: {primary_model}, Fallback model: {fallback_model}. "
                    f"First error: {first_error}, Second error: {second_error}"
                )
                raise Exception(
                    f"Both primary and fallback models failed. "
                    f"Primary: {str(first_error)}, Fallback: {str(second_error)}"
                )
    
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        complexity: QueryComplexity = QueryComplexity.SIMPLE,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate AI response with automatic model selection and fallback.
        
        Args:
            messages: List of message dictionaries for the conversation
            complexity: Complexity level to determine model selection
            temperature: Temperature setting for response randomness
            max_tokens: Maximum tokens in response
            
        Returns:
            AI response with metadata
        """
        model = self._determine_model(complexity)
        
        try:
            response = await self._make_ai_request(
                messages=messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens
            )
            # Mark service as available on success
            await set_service_available("ai_service", "AI service operating normally")
            return response
        except CircuitBreakerError as e:
            # Circuit breaker is open, service is unavailable
            logger.error(f"AI service circuit breaker open: {e}")
            await log_error(e, ErrorCategory.EXTERNAL_SERVICE_ERROR, ErrorSeverity.CRITICAL)
            await set_service_unavailable("ai_service", "AI service circuit breaker open")
            raise
        except Exception as e:
            logger.warning(f"Primary model {model} failed: {e}. Attempting fallback.")
            await log_error(e, ErrorCategory.EXTERNAL_SERVICE_ERROR, ErrorSeverity.HIGH)
            
            try:
                fallback_response = await self._fallback_to_secondary_model(
                    messages=messages,
                    primary_model=model,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                # Mark service as degraded when using fallback
                await set_service_degraded(
                    "ai_service",
                    unavailable_features=["primary_model"],
                    message=f"Using fallback model due to {model} failure"
                )
                return fallback_response
            except Exception as fallback_error:
                logger.error(f"Fallback model also failed: {fallback_error}")
                await log_error(
                    fallback_error,
                    ErrorCategory.EXTERNAL_SERVICE_ERROR,
                    ErrorSeverity.CRITICAL
                )
                await set_service_unavailable("ai_service", "All AI models unavailable")
                raise
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check the health of the AI service and API connectivity.
        
        Returns:
            Health status information
        """
        if self.provider == AIProvider.OPENAI and not self.openai_client:
            return {
                "status": "unhealthy",
                "error": "OpenAI API key not configured",
                "models_available": False,
                "provider": "openai"
            }
        elif self.provider == AIProvider.GEMINI and not self.gemini_model:
            return {
                "status": "unhealthy",
                "error": "Gemini API key not configured",
                "models_available": False,
                "provider": "gemini"
            }
        
        try:
            # Simple test request to verify API connectivity
            test_messages = [
                {"role": "user", "content": "Hello, this is a connectivity test."}
            ]
            
            response = await self._make_ai_request(
                messages=test_messages,
                model=self.fallback_model,  # Use fallback model for health check
                temperature=0.1,
                max_tokens=10
            )
            
            return {
                "status": "healthy",
                "provider": self.provider.value,
                "primary_model": self.primary_model,
                "fallback_model": self.fallback_model,
                "models_available": True,
                "test_response_received": bool(response.get("content"))
            }
            
        except Exception as e:
            logger.error(f"AI service health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "models_available": False,
                "provider": self.provider.value
            }
    
    async def _apply_scaledown_compression_async(self, knowledge_base: str) -> str:
        """
        Apply ScaleDown compression to veterinary knowledge base (75% compression).
        
        This method uses the ScaleDown API for professional knowledge base compression
        while maintaining essential medical information.
        
        Args:
            knowledge_base: Full veterinary knowledge base text
            
        Returns:
            Compressed knowledge base (approximately 75% reduction)
        """
        if not settings.SCALEDOWN_API_KEY:
            logger.warning("ScaleDown API key not configured, using fallback compression")
            return self._fallback_compression(knowledge_base)
        
        try:
            # Use ScaleDown API for professional compression
            return await self._scaledown_api_compress(knowledge_base)
        except Exception as e:
            logger.error(f"ScaleDown API compression failed: {e}, using fallback")
            return self._fallback_compression(knowledge_base)
    
    def _apply_scaledown_compression(self, knowledge_base: str) -> str:
        """
        Synchronous wrapper for ScaleDown compression.
        
        Args:
            knowledge_base: Full veterinary knowledge base text
            
        Returns:
            Compressed knowledge base (approximately 75% reduction)
        """
        if not settings.SCALEDOWN_API_KEY:
            logger.warning("ScaleDown API key not configured, using fallback compression")
            return self._fallback_compression(knowledge_base)
        
        # For now, use fallback compression since we're in sync context
        # In production, this would be called from async context
        logger.info("Using fallback compression (sync context)")
        return self._fallback_compression(knowledge_base)
    
    async def _scaledown_api_compress(self, knowledge_base: str) -> str:
        """
        Use ScaleDown API for knowledge base compression.
        
        Args:
            knowledge_base: Full veterinary knowledge base text
            
        Returns:
            Compressed knowledge base via ScaleDown API
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.scaledown.com/v1/compress",
                headers={
                    "Authorization": f"Bearer {settings.SCALEDOWN_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "text": knowledge_base,
                    "compression_ratio": 0.75,  # 75% compression
                    "domain": "veterinary_medical",
                    "preserve_keywords": [
                        "emergency", "toxic", "poisonous", "lethal", "fatal", "urgent",
                        "symptom", "diagnosis", "treatment", "medication", "dosage",
                        "veterinarian", "clinic", "surgery", "infection", "disease",
                        "allergy", "reaction", "breathing", "heart", "temperature",
                        "vomiting", "diarrhea", "seizure", "bleeding", "pain"
                    ]
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("compressed_text", knowledge_base)
            else:
                logger.error(f"ScaleDown API error: {response.status_code} - {response.text}")
                raise Exception(f"ScaleDown API returned {response.status_code}")
    
    def _fallback_compression(self, knowledge_base: str) -> str:
        """
        Fallback compression method when ScaleDown API is unavailable.
        
        Args:
            knowledge_base: Full veterinary knowledge base text
            
        Returns:
            Compressed knowledge base using simple algorithm
        """
        # Split into sentences and prioritize medical terms
        sentences = knowledge_base.split('. ')
        
        # Priority keywords for veterinary knowledge
        priority_keywords = [
            'emergency', 'toxic', 'poisonous', 'lethal', 'fatal', 'urgent',
            'symptom', 'diagnosis', 'treatment', 'medication', 'dosage',
            'veterinarian', 'clinic', 'surgery', 'infection', 'disease',
            'allergy', 'reaction', 'breathing', 'heart', 'temperature',
            'vomiting', 'diarrhea', 'seizure', 'bleeding', 'pain'
        ]
        
        # Score sentences based on medical relevance
        scored_sentences = []
        for sentence in sentences:
            score = sum(1 for keyword in priority_keywords 
                       if keyword.lower() in sentence.lower())
            scored_sentences.append((sentence, score))
        
        # Sort by score and keep top 25% (75% compression)
        scored_sentences.sort(key=lambda x: x[1], reverse=True)
        keep_count = max(1, len(scored_sentences) // 4)
        
        compressed_sentences = [sent[0] for sent in scored_sentences[:keep_count]]
        return '. '.join(compressed_sentences)
    
    def _get_raw_veterinary_knowledge_base(self) -> str:
        """
        Get raw (uncompressed) veterinary knowledge base.
        
        Returns:
            Full veterinary knowledge base before compression
        """
        # This would typically be loaded from a file or database
        # For now, using a comprehensive knowledge base
        return """
        Emergency veterinary symptoms requiring immediate attention include difficulty breathing, 
        severe bleeding, loss of consciousness, seizures, suspected poisoning, bloat or gastric torsion,
        severe trauma, inability to urinate, and extreme lethargy in young animals.
        
        Common toxic substances for pets include chocolate, grapes, raisins, onions, garlic, 
        xylitol artificial sweetener, alcohol, caffeine, macadamia nuts, and many human medications.
        Chocolate toxicity varies by type: dark chocolate and baking chocolate are most dangerous.
        Grapes and raisins can cause kidney failure in dogs. Xylitol can cause rapid insulin release
        and liver damage. Onions and garlic can cause anemia by damaging red blood cells.
        
        Yellow flag symptoms requiring veterinary attention within 24-48 hours include persistent 
        vomiting, diarrhea lasting more than 24 hours, loss of appetite for more than 24 hours,
        lethargy, difficulty urinating, coughing, limping, or behavioral changes.
        Persistent vomiting can lead to dehydration and electrolyte imbalances.
        Diarrhea lasting more than a day may indicate infections, dietary indiscretion, or parasites.
        Loss of appetite in cats is particularly concerning as it can lead to hepatic lipidosis.
        
        Green flag symptoms that can be monitored at home include mild digestive upset lasting 
        less than 24 hours, minor scratches, occasional coughing without distress, and mild 
        changes in eating habits that resolve quickly.
        Mild digestive upset often resolves with bland diet and rest.
        Minor scratches should be cleaned and monitored for signs of infection.
        Occasional coughing may be due to environmental irritants or minor respiratory issues.
        
        Species-specific considerations: Dogs are more prone to bloat, especially large breeds.
        Cats hide illness well and sudden changes are more concerning. Small animals like rabbits
        and guinea pigs can deteriorate rapidly and need prompt attention for any symptoms.
        Birds are particularly good at hiding illness until they are very sick.
        Reptiles require specific temperature and humidity conditions for proper health.
        
        Age-specific considerations: Puppies and kittens are more susceptible to infections
        and dehydration. Senior pets may have underlying conditions that complicate symptoms.
        Very young animals can become hypoglycemic quickly. Elderly pets may have decreased
        immune function and slower healing.
        
        Breed-specific considerations: Brachycephalic breeds (flat-faced) are prone to breathing
        difficulties. Large breed dogs are susceptible to bloat and joint problems.
        Small breed dogs may have luxating patella and tracheal collapse.
        Certain breeds have genetic predispositions to specific conditions.
        """
    
    def _get_veterinary_knowledge_base(self) -> str:
        """
        Get compressed veterinary knowledge base for symptom analysis.
        
        Returns:
            Compressed veterinary knowledge base
        """
        raw_knowledge = self._get_raw_veterinary_knowledge_base()
        return self._apply_scaledown_compression(raw_knowledge)
    
    def _extract_symptoms_from_input(self, symptom_input: str) -> List[str]:
        """
        Extract and normalize symptoms from user input.
        
        Args:
            symptom_input: Raw symptom description from user
            
        Returns:
            List of extracted symptoms
        """
        # Simple keyword extraction - in production, this could use NLP
        symptom_keywords = [
            'vomiting', 'diarrhea', 'lethargy', 'coughing', 'sneezing',
            'limping', 'bleeding', 'seizure', 'breathing', 'eating',
            'drinking', 'urinating', 'temperature', 'fever', 'pain',
            'swelling', 'discharge', 'scratching', 'shaking', 'hiding'
        ]
        
        input_lower = symptom_input.lower()
        found_symptoms = [keyword for keyword in symptom_keywords 
                         if keyword in input_lower]
        
        # If no specific symptoms found, return the original input as a symptom
        return found_symptoms if found_symptoms else [symptom_input.strip()]
    
    def _parse_triage_response(self, ai_response: str) -> Tuple[TriageLevel, float, str, List[str]]:
        """
        Parse AI response to extract triage level, confidence, analysis, and recommendations.
        
        Args:
            ai_response: Raw AI response text
            
        Returns:
            Tuple of (triage_level, confidence_score, analysis, recommendations)
        """
        try:
            # Try to parse as JSON first
            if ai_response.strip().startswith('{'):
                data = json.loads(ai_response)
                triage_level = TriageLevel(data.get('triage_level', 'yellow').lower())
                confidence = float(data.get('confidence_score', 0.5))
                analysis = data.get('analysis', '')
                recommendations = data.get('recommendations', [])
                return triage_level, confidence, analysis, recommendations
        except (json.JSONDecodeError, ValueError, KeyError):
            pass
        
        # Fallback to text parsing
        response_lower = ai_response.lower()
        
        # Determine triage level from keywords (using word boundaries for accuracy)
        import re
        
        emergency_pattern = r'\b(emergency|immediate|urgent|red)\b'
        schedule_pattern = r'\b(schedule|vet|visit|yellow|appointment)\b'
        monitor_pattern = r'\b(monitor|home|green|routine|watch)\b'
        
        if re.search(emergency_pattern, response_lower):
            triage_level = TriageLevel.RED
            confidence = 0.8
        elif re.search(schedule_pattern, response_lower):
            triage_level = TriageLevel.YELLOW
            confidence = 0.7
        elif re.search(monitor_pattern, response_lower):
            triage_level = TriageLevel.GREEN
            confidence = 0.6
        else:
            # Default to YELLOW for safety if unclear
            triage_level = TriageLevel.YELLOW
            confidence = 0.5
        
        # Extract recommendations (simple approach)
        recommendations = []
        if 'recommend' in response_lower:
            # Split by sentences and find recommendation sentences
            sentences = ai_response.split('.')
            recommendations = [s.strip() for s in sentences if 'recommend' in s.lower()]
        
        return triage_level, confidence, ai_response, recommendations
    
    async def analyze_symptoms(
        self,
        symptom_input: str,
        pet_profile: Optional[Dict[str, Any]] = None,
        input_type: str = "text"
    ) -> SymptomAnalysisResult:
        """
        Analyze pet symptoms and provide triage assessment.
        
        Args:
            symptom_input: Description of symptoms (voice or text)
            pet_profile: Pet profile information for context
            input_type: Type of input ("voice" or "text")
            
        Returns:
            SymptomAnalysisResult with triage assessment
        """
        # Extract symptoms from input
        symptoms = self._extract_symptoms_from_input(symptom_input)
        
        # Get compressed veterinary knowledge base using ScaleDown API
        try:
            knowledge_base = await self._apply_scaledown_compression_async(
                self._get_raw_veterinary_knowledge_base()
            )
            compressed_knowledge_used = settings.SCALEDOWN_API_KEY is not None
        except Exception as e:
            logger.warning(f"Async compression failed: {e}, using sync fallback")
            knowledge_base = self._get_veterinary_knowledge_base()
            compressed_knowledge_used = False
        
        # Build context for AI analysis
        pet_context = ""
        if pet_profile:
            pet_context = f"""
Pet Information:
- Species: {pet_profile.get('species', 'Unknown')}
- Breed: {pet_profile.get('breed', 'Unknown')}
- Age: {pet_profile.get('age', 'Unknown')}
- Weight: {pet_profile.get('weight', 'Unknown')}
- Medical Conditions: {pet_profile.get('medical_conditions', 'None known')}
- Allergies: {pet_profile.get('allergies', 'None known')}
"""
        
        # Create system prompt for triage analysis
        system_prompt = f"""
You are a veterinary triage assistant. Analyze the reported symptoms and provide a triage assessment.

Veterinary Knowledge Base (ScaleDown Compressed):
{knowledge_base}

{pet_context}

Provide your response in the following JSON format:
{{
    "triage_level": "red|yellow|green",
    "confidence_score": 0.0-1.0,
    "analysis": "Detailed analysis of symptoms",
    "recommendations": ["recommendation 1", "recommendation 2", ...]
}}

Triage Levels:
- RED: Emergency - immediate veterinary attention required
- YELLOW: Schedule vet visit within 24-48 hours
- GREEN: Monitor at home, routine care sufficient
"""
        
        user_prompt = f"""
Input Type: {input_type}
Reported Symptoms: {symptom_input}
Extracted Symptoms: {', '.join(symptoms)}

Please analyze these symptoms and provide a triage assessment.
"""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        try:
            # Use complex query type for symptom analysis
            response = await self.generate_response(
                messages=messages,
                complexity=QueryComplexity.COMPLEX,
                temperature=0.3,  # Lower temperature for medical analysis
                max_tokens=800
            )
            
            # Parse the AI response
            triage_level, confidence, analysis, recommendations = self._parse_triage_response(
                response["content"]
            )
            
            return SymptomAnalysisResult(
                triage_level=triage_level,
                confidence_score=confidence,
                analysis=analysis,
                recommendations=recommendations,
                symptoms_processed=symptoms,
                model_used=response["model"],
                compressed_knowledge_used=compressed_knowledge_used
            )
            
        except Exception as e:
            logger.error(f"Error in symptom analysis: {e}")
            # Return safe fallback result
            return SymptomAnalysisResult(
                triage_level=TriageLevel.YELLOW,  # Safe default
                confidence_score=0.3,
                analysis=f"Unable to complete analysis due to technical error: {str(e)}",
                recommendations=["Please consult with a veterinarian for proper assessment"],
                symptoms_processed=symptoms,
                model_used="fallback",
                compressed_knowledge_used=False
            )
    
    def _create_red_triage_response(self, analysis_result: SymptomAnalysisResult) -> TriageResponse:
        """
        Create emergency triage response for RED level symptoms.
        
        Args:
            analysis_result: Result from symptom analysis
            
        Returns:
            TriageResponse with emergency information
        """
        emergency_info = {
            "urgency": "IMMEDIATE",
            "message": "This appears to be an emergency situation requiring immediate veterinary attention.",
            "next_steps": [
                "Contact your emergency veterinarian immediately",
                "If your regular vet is closed, go to the nearest 24/7 emergency clinic",
                "Do not wait - seek care now"
            ],
            "emergency_contacts": {
                "note": "Emergency vet locations will be displayed",
                "action_required": "find_emergency_vet"
            },
            "transport_guidance": [
                "Keep your pet calm and comfortable during transport",
                "Bring any medications your pet is currently taking",
                "Have your pet's medical history ready if possible"
            ]
        }
        
        actions = [
            "display_emergency_vets",
            "show_transport_guidance",
            "prepare_medical_history"
        ]
        
        message = f"🚨 EMERGENCY: {analysis_result.analysis}"
        
        return TriageResponse(
            triage_level=TriageLevel.RED,
            message=message,
            actions=actions,
            emergency_info=emergency_info
        )
    
    def _create_yellow_triage_response(self, analysis_result: SymptomAnalysisResult) -> TriageResponse:
        """
        Create scheduling triage response for YELLOW level symptoms.
        
        Args:
            analysis_result: Result from symptom analysis
            
        Returns:
            TriageResponse with scheduling information
        """
        scheduling_info = {
            "urgency": "SCHEDULE_SOON",
            "timeframe": "24-48 hours",
            "message": "These symptoms warrant veterinary attention within the next 1-2 days.",
            "scheduling_options": [
                "Contact your regular veterinarian to schedule an appointment",
                "If symptoms worsen, consider urgent care",
                "Monitor symptoms closely until your appointment"
            ],
            "preparation": [
                "Note any changes in symptoms",
                "Record when symptoms started",
                "List any recent changes in diet, behavior, or environment",
                "Prepare questions for your veterinarian"
            ],
            "monitoring_signs": [
                "Watch for worsening symptoms",
                "Note any new symptoms that develop",
                "Monitor eating, drinking, and bathroom habits"
            ]
        }
        
        actions = [
            "schedule_vet_appointment",
            "setup_symptom_monitoring",
            "prepare_vet_visit_info"
        ]
        
        message = f"⚠️ SCHEDULE VET VISIT: {analysis_result.analysis}"
        
        return TriageResponse(
            triage_level=TriageLevel.YELLOW,
            message=message,
            actions=actions,
            scheduling_info=scheduling_info
        )
    
    def _create_green_triage_response(self, analysis_result: SymptomAnalysisResult) -> TriageResponse:
        """
        Create monitoring triage response for GREEN level symptoms.
        
        Args:
            analysis_result: Result from symptom analysis
            
        Returns:
            TriageResponse with monitoring guidance
        """
        monitoring_guidance = {
            "urgency": "MONITOR_AT_HOME",
            "message": "These symptoms can typically be monitored at home with routine care.",
            "home_care_tips": [
                "Continue normal feeding and care routines",
                "Ensure fresh water is always available",
                "Monitor for any changes or worsening symptoms",
                "Maintain a comfortable environment for your pet"
            ],
            "when_to_escalate": [
                "Symptoms persist for more than 24-48 hours",
                "Symptoms worsen or new symptoms appear",
                "Your pet stops eating or drinking",
                "You notice significant behavioral changes"
            ],
            "routine_care": [
                "Continue regular exercise and play",
                "Maintain normal grooming routines",
                "Keep up with scheduled medications",
                "Follow regular feeding schedule"
            ],
            "monitoring_schedule": {
                "frequency": "Check on your pet every few hours",
                "duration": "Monitor for 24-48 hours",
                "escalation": "Contact vet if symptoms persist or worsen"
            }
        }
        
        actions = [
            "setup_home_monitoring",
            "schedule_routine_checkup",
            "continue_normal_care"
        ]
        
        message = f"✅ MONITOR AT HOME: {analysis_result.analysis}"
        
        return TriageResponse(
            triage_level=TriageLevel.GREEN,
            message=message,
            actions=actions,
            monitoring_guidance=monitoring_guidance
        )
    
    async def create_triage_response(self, analysis_result: SymptomAnalysisResult) -> TriageResponse:
        """
        Create appropriate triage response based on analysis result.
        
        Args:
            analysis_result: Result from symptom analysis
            
        Returns:
            TriageResponse with appropriate actions and guidance
        """
        if analysis_result.triage_level == TriageLevel.RED:
            return self._create_red_triage_response(analysis_result)
        elif analysis_result.triage_level == TriageLevel.YELLOW:
            return self._create_yellow_triage_response(analysis_result)
        else:  # GREEN
            return self._create_green_triage_response(analysis_result)
    
    async def process_symptom_input(
        self,
        symptom_input: str,
        pet_profile: Optional[Dict[str, Any]] = None,
        input_type: str = "text"
    ) -> Tuple[SymptomAnalysisResult, TriageResponse]:
        """
        Complete symptom processing pipeline: analysis + triage response.
        
        Args:
            symptom_input: Description of symptoms (voice or text)
            pet_profile: Pet profile information for context
            input_type: Type of input ("voice" or "text")
            
        Returns:
            Tuple of (SymptomAnalysisResult, TriageResponse)
        """
        # Analyze symptoms
        analysis_result = await self.analyze_symptoms(
            symptom_input=symptom_input,
            pet_profile=pet_profile,
            input_type=input_type
        )
        
        # Create appropriate triage response
        triage_response = await self.create_triage_response(analysis_result)
        
        return analysis_result, triage_response
    
    async def generate_health_insights(self, insights_prompt: str) -> str:
        """
        Generate AI-powered health insights for health summaries.
        
        Args:
            insights_prompt: Prompt containing health data for analysis
            
        Returns:
            AI-generated insights as JSON string
        """
        try:
            messages = [
                {
                    "role": "system", 
                    "content": "You are a veterinary health analyst. Analyze pet health data and provide actionable insights in JSON format."
                },
                {
                    "role": "user", 
                    "content": insights_prompt
                }
            ]
            
            response = await self.generate_response(
                messages=messages,
                complexity=QueryComplexity.COMPLEX,
                temperature=0.4,  # Moderate creativity for insights
                max_tokens=1000
            )
            
            return response["content"]
            
        except Exception as e:
            logger.error(f"Error generating health insights: {e}")
            # Return fallback insights
            return json.dumps([{
                "insight_type": "recommendation",
                "title": "Regular Health Monitoring",
                "description": "Continue monitoring your pet's health with regular checkups and symptom tracking.",
                "confidence": 0.9,
                "priority": "medium"
            }])


# Global AI service instance
ai_service = AIService()