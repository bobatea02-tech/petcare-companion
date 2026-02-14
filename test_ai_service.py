"""
Quick test script to verify AI service is working
"""
import asyncio
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_service import ai_service
from app.core.config import settings


async def test_ai_service():
    """Test the AI service with a simple query"""
    print("=" * 60)
    print("AI Service Configuration Test")
    print("=" * 60)
    print(f"AI Provider: {settings.AI_PROVIDER}")
    print(f"Primary Model: {settings.PRIMARY_AI_MODEL}")
    print(f"Fallback Model: {settings.FALLBACK_AI_MODEL}")
    print(f"Gemini API Key configured: {'Yes' if settings.GEMINI_API_KEY else 'No'}")
    print("=" * 60)
    
    # Test health check
    print("\n1. Testing AI Service Health Check...")
    try:
        health = await ai_service.health_check()
        print(f"   Status: {health.get('status')}")
        print(f"   Models Available: {health.get('models_available')}")
        if health.get('error'):
            print(f"   Error: {health.get('error')}")
    except Exception as e:
        print(f"   Health check failed: {e}")
    
    # Test symptom analysis
    print("\n2. Testing Symptom Analysis...")
    try:
        result = await ai_service.analyze_symptoms(
            symptom_input="My dog is vomiting and seems lethargic",
            pet_profile={
                "species": "dog",
                "breed": "Golden Retriever",
                "age": "3 years",
                "weight": "65 lbs"
            },
            input_type="text"
        )
        
        print(f"   Triage Level: {result.triage_level.value}")
        print(f"   Confidence: {result.confidence_score}")
        print(f"   Analysis: {result.analysis[:100]}...")
        print(f"   Recommendations: {len(result.recommendations)} items")
        print(f"   Model Used: {result.model_used}")
        
    except Exception as e:
        print(f"   Symptom analysis failed: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("Test Complete")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_ai_service())
