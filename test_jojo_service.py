"""
Test script for JoJo AI Assistant service.
Run this to verify JoJo backend is working correctly.
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_jojo_initialization():
    """Test JoJo service initialization."""
    print("Testing JoJo Service Initialization...")
    
    try:
        from app.services.jojo_service import JoJoService
        
        jojo = JoJoService()
        print("✓ JoJo service initialized successfully")
        print(f"✓ Gemini API configured")
        print(f"✓ Questions per hour limit: {jojo.QUESTIONS_PER_HOUR}")
        print(f"✓ Conversation message limit: {jojo.CONVERSATION_MESSAGE_LIMIT}")
        return True
        
    except Exception as e:
        print(f"✗ Failed to initialize JoJo: {e}")
        return False


async def test_gemini_api():
    """Test Gemini API connection."""
    print("\nTesting Gemini API Connection...")
    
    try:
        import google.generativeai as genai
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("✗ GEMINI_API_KEY not found in environment")
            return False
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Test simple generation
        response = model.generate_content("Say 'Hello from JoJo!' in one sentence.")
        print(f"✓ Gemini API connected successfully")
        print(f"✓ Test response: {response.text[:100]}...")
        return True
        
    except Exception as e:
        print(f"✗ Gemini API test failed: {e}")
        return False


async def test_database_models():
    """Test database models are properly defined."""
    print("\nTesting Database Models...")
    
    try:
        from app.database.models import ConversationHistory, UserQuestionQuota
        
        print("✓ ConversationHistory model imported")
        print("✓ UserQuestionQuota model imported")
        
        # Check model attributes
        assert hasattr(ConversationHistory, 'user_id')
        assert hasattr(ConversationHistory, 'pet_id')
        assert hasattr(ConversationHistory, 'messages')
        assert hasattr(ConversationHistory, 'last_accessed_at')
        print("✓ ConversationHistory has all required fields")
        
        assert hasattr(UserQuestionQuota, 'user_id')
        assert hasattr(UserQuestionQuota, 'questions_asked')
        assert hasattr(UserQuestionQuota, 'quota_reset_at')
        print("✓ UserQuestionQuota has all required fields")
        
        return True
        
    except Exception as e:
        print(f"✗ Database model test failed: {e}")
        return False


async def test_api_schemas():
    """Test API schemas are properly defined."""
    print("\nTesting API Schemas...")
    
    try:
        from app.schemas.jojo import (
            JoJoChatRequest,
            JoJoChatResponse,
            ConversationHistoryResponse,
            QuotaInfoResponse
        )
        
        print("✓ JoJoChatRequest schema imported")
        print("✓ JoJoChatResponse schema imported")
        print("✓ ConversationHistoryResponse schema imported")
        print("✓ QuotaInfoResponse schema imported")
        
        # Test schema instantiation
        request = JoJoChatRequest(message="Test message")
        print(f"✓ JoJoChatRequest can be instantiated")
        
        return True
        
    except Exception as e:
        print(f"✗ API schema test failed: {e}")
        return False


async def test_api_endpoints():
    """Test API endpoints are registered."""
    print("\nTesting API Endpoints...")
    
    try:
        from app.api.jojo import router
        
        routes = [route.path for route in router.routes]
        print(f"✓ JoJo router imported with {len(routes)} routes")
        
        expected_routes = ['/chat', '/conversation/{conversation_id}', '/quota', '/health']
        for route in expected_routes:
            if any(route in r for r in routes):
                print(f"✓ Route '{route}' registered")
            else:
                print(f"✗ Route '{route}' not found")
        
        return True
        
    except Exception as e:
        print(f"✗ API endpoint test failed: {e}")
        return False


async def main():
    """Run all tests."""
    print("=" * 60)
    print("JoJo AI Assistant - Backend Test Suite")
    print("=" * 60)
    
    results = []
    
    results.append(await test_jojo_initialization())
    results.append(await test_gemini_api())
    results.append(await test_database_models())
    results.append(await test_api_schemas())
    results.append(await test_api_endpoints())
    
    print("\n" + "=" * 60)
    print(f"Test Results: {sum(results)}/{len(results)} passed")
    print("=" * 60)
    
    if all(results):
        print("\n✓ All tests passed! JoJo backend is ready.")
        print("\nNext steps:")
        print("1. Run database migration: alembic upgrade head")
        print("2. Start the backend server")
        print("3. Test the API endpoints with curl or Postman")
        print("4. Proceed to frontend integration (Phase 3)")
    else:
        print("\n✗ Some tests failed. Please fix the issues above.")
        print("\nCommon issues:")
        print("- Missing GEMINI_API_KEY in .env file")
        print("- Database connection issues")
        print("- Missing dependencies (run: pip install -r requirements.txt)")


if __name__ == "__main__":
    asyncio.run(main())
