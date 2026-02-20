"""
Test script for voice command processor.
Run this to verify the AI-powered intent recognition is working.
"""

import asyncio
import os
from app.services.voice_command_processor import VoiceCommandProcessor

# Test commands
TEST_COMMANDS = [
    "I just fed Buddy 2 cups of kibble",
    "Gave Max his heartworm pill this morning",
    "I bathed Luna today",
    "Mark grooming as done for Whiskers",
    "Schedule a vet checkup for next Tuesday",
    "What medications does Buddy need today?",
    "Show me Max's recent feedings",
    "Add a note: Luna has been more playful lately",
    "I completed the vet appointment",
    "Remind me to give medication tomorrow",
]


async def test_intent_analysis():
    """Test the AI intent analysis without database."""
    print("=" * 60)
    print("VOICE COMMAND PROCESSOR - INTENT ANALYSIS TEST")
    print("=" * 60)
    print()
    
    # Check if API key is configured
    if not os.getenv("GEMINI_API_KEY"):
        print("❌ ERROR: GEMINI_API_KEY not found in environment variables")
        print("Please set it in your .env file")
        return
    
    try:
        processor = VoiceCommandProcessor()
        print("✅ Voice Command Processor initialized successfully")
        print()
    except Exception as e:
        print(f"❌ ERROR: Failed to initialize processor: {e}")
        return
    
    # Test each command
    for i, command in enumerate(TEST_COMMANDS, 1):
        print(f"Test {i}/{len(TEST_COMMANDS)}")
        print(f"Command: \"{command}\"")
        print("-" * 60)
        
        try:
            intent = await processor._analyze_command_intent(command, pet_name=None)
            
            print(f"Action: {intent.get('action', 'unknown')}")
            print(f"Confidence: {intent.get('confidence', 0.0):.2f}")
            
            params = intent.get('parameters', {})
            if params:
                print("Parameters:")
                for key, value in params.items():
                    if value is not None:
                        print(f"  - {key}: {value}")
            
            # Determine if this would execute successfully
            if intent.get('action') != 'unknown' and intent.get('confidence', 0) > 0.5:
                print("✅ Would execute successfully")
            else:
                print("⚠️  Low confidence or unknown action")
            
        except Exception as e:
            print(f"❌ ERROR: {e}")
        
        print()
    
    print("=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_intent_analysis())
