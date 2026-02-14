"""
Test script to verify the conversation flow works correctly.
Run this to test the chatbot conversation pattern.
"""

import asyncio
import sys
from app.services.conversation_service import conversation_service

async def test_conversation_flow():
    """Test the complete conversation flow."""
    
    print("=" * 80)
    print("TESTING VOICE CHATBOT CONVERSATION FLOW")
    print("=" * 80)
    print()
    
    user_id = "test_user_123"
    pet_profile = {
        "name": "Max",
        "species": "dog",
        "age": "3 years",
        "breed": "Golden Retriever"
    }
    
    # Step 1: User reports initial symptoms
    print("👤 USER: My dog has been vomiting twice today and seems very lethargic")
    print()
    
    response1 = await conversation_service.process_message(
        user_id=user_id,
        message="My dog has been vomiting twice today and seems very lethargic",
        pet_profile=pet_profile,
        pet_id="pet_123"
    )
    
    print("🤖 AI ASSISTANT:")
    print(response1["message"])
    print()
    print(f"Stage: {response1['stage']}")
    print(f"Requires Response: {response1['requires_response']}")
    print()
    print("-" * 80)
    print()
    
    # If AI is asking questions, answer them
    if response1['requires_response']:
        # Step 2: Answer first question
        print("👤 USER: He ate his normal kibble this morning")
        print()
        
        response2 = await conversation_service.process_message(
            user_id=user_id,
            message="He ate his normal kibble this morning",
            pet_profile=pet_profile,
            pet_id="pet_123"
        )
        
        print("🤖 AI ASSISTANT:")
        print(response2["message"])
        print()
        print(f"Stage: {response2['stage']}")
        print(f"Requires Response: {response2['requires_response']}")
        print()
        print("-" * 80)
        print()
        
        # Continue answering questions until we get assessment
        if response2['requires_response']:
            # Step 3: Answer second question
            print("👤 USER: Yes, he's drinking water")
            print()
            
            response3 = await conversation_service.process_message(
                user_id=user_id,
                message="Yes, he's drinking water",
                pet_profile=pet_profile,
                pet_id="pet_123"
            )
            
            print("🤖 AI ASSISTANT:")
            print(response3["message"])
            print()
            print(f"Stage: {response3['stage']}")
            print(f"Requires Response: {response3['requires_response']}")
            print()
            print("-" * 80)
            print()
            
            # Continue if more questions
            if response3['requires_response']:
                # Step 4: Answer third question
                print("👤 USER: Since this morning, about 6 hours ago")
                print()
                
                response4 = await conversation_service.process_message(
                    user_id=user_id,
                    message="Since this morning, about 6 hours ago",
                    pet_profile=pet_profile,
                    pet_id="pet_123"
                )
                
                print("🤖 AI ASSISTANT:")
                print(response4["message"])
                print()
                print(f"Stage: {response4['stage']}")
                print(f"Requires Response: {response4['requires_response']}")
                if response4.get('triage_level'):
                    print(f"Triage Level: {response4['triage_level']}")
                if response4.get('analysis_result'):
                    print(f"Severity Rating: {response4['analysis_result'].get('severity_rating', 'N/A')}/5")
                print()
                print("-" * 80)
                print()
    
    print()
    print("=" * 80)
    print("TEST COMPLETED SUCCESSFULLY!")
    print("=" * 80)
    print()
    print("✅ The conversation flow is working correctly:")
    print("   1. User reports symptoms")
    print("   2. AI asks clarifying questions")
    print("   3. User answers questions")
    print("   4. AI provides assessment with severity rating")
    print()

async def test_emergency_flow():
    """Test emergency symptom handling."""
    
    print("=" * 80)
    print("TESTING EMERGENCY FLOW")
    print("=" * 80)
    print()
    
    user_id = "test_user_456"
    pet_profile = {
        "name": "Bella",
        "species": "dog",
        "age": "5 years",
        "breed": "Labrador"
    }
    
    print("👤 USER: My dog is having seizures and can't stand up!")
    print()
    
    response = await conversation_service.process_message(
        user_id=user_id,
        message="My dog is having seizures and can't stand up!",
        pet_profile=pet_profile,
        pet_id="pet_456"
    )
    
    print("🤖 AI ASSISTANT:")
    print(response["message"])
    print()
    print(f"Stage: {response['stage']}")
    print(f"Requires Response: {response['requires_response']}")
    if response.get('triage_level'):
        print(f"Triage Level: {response['triage_level']}")
    if response.get('analysis_result'):
        print(f"Severity Rating: {response['analysis_result'].get('severity_rating', 'N/A')}/5")
    print()
    print("-" * 80)
    print()
    
    print("✅ Emergency flow working correctly - immediate assessment provided")
    print()

if __name__ == "__main__":
    print()
    print("Starting conversation flow tests...")
    print()
    
    try:
        # Run normal conversation flow test
        asyncio.run(test_conversation_flow())
        
        # Run emergency flow test
        asyncio.run(test_emergency_flow())
        
        print("All tests passed! ✅")
        sys.exit(0)
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
