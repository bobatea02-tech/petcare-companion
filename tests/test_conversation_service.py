"""
Tests for Conversational AI Service.
"""

import pytest
from app.services.conversation_service import (
    ConversationService,
    ConversationContext,
    ConversationStage
)


@pytest.fixture
def conversation_service():
    """Create conversation service instance."""
    return ConversationService()


@pytest.fixture
def sample_pet_profile():
    """Sample pet profile for testing."""
    return {
        "name": "Bella",
        "species": "dog",
        "breed": "Golden Retriever",
        "age": "3 years",
        "weight": "65 lbs"
    }


@pytest.mark.asyncio
async def test_initial_symptom_triggers_questions(conversation_service, sample_pet_profile):
    """Test that initial symptom report triggers clarifying questions."""
    
    response = await conversation_service.process_message(
        user_id="test_user_1",
        message="My dog has been vomiting twice today and seems lethargic",
        pet_profile=sample_pet_profile,
        pet_id="test_pet_1"
    )
    
    assert response["stage"] == ConversationStage.GATHERING_INFO.value
    assert response["requires_response"] is True
    assert "?" in response["message"]  # Should contain a question


@pytest.mark.asyncio
async def test_multi_turn_conversation_flow(conversation_service, sample_pet_profile):
    """Test complete multi-turn conversation flow."""
    
    user_id = "test_user_2"
    pet_id = "test_pet_2"
    
    # Step 1: Initial symptom
    response1 = await conversation_service.process_message(
        user_id=user_id,
        message="My dog has been vomiting twice today and seems lethargic",
        pet_profile=sample_pet_profile,
        pet_id=pet_id
    )
    
    assert response1["stage"] == ConversationStage.GATHERING_INFO.value
    assert response1["requires_response"] is True
    
    # Step 2: Answer first question
    response2 = await conversation_service.process_message(
        user_id=user_id,
        message="She ate normal kibble",
        pet_profile=sample_pet_profile,
        pet_id=pet_id
    )
    
    # Should either ask another question or provide assessment
    assert response2["stage"] in [
        ConversationStage.GATHERING_INFO.value,
        ConversationStage.ASSESSMENT.value
    ]
    
    # Step 3: Continue answering until assessment
    max_iterations = 5
    current_response = response2
    
    for i in range(max_iterations):
        if current_response["stage"] == ConversationStage.ASSESSMENT.value:
            break
        
        current_response = await conversation_service.process_message(
            user_id=user_id,
            message="Yes" if i % 2 == 0 else "No changes",
            pet_profile=sample_pet_profile,
            pet_id=pet_id
        )
    
    # Should eventually reach assessment stage
    assert current_response["stage"] in [
        ConversationStage.ASSESSMENT.value,
        ConversationStage.FOLLOW_UP.value
    ]


@pytest.mark.asyncio
async def test_emergency_keywords_recognized(conversation_service, sample_pet_profile):
    """Test that emergency keywords are recognized."""
    
    response = await conversation_service.process_message(
        user_id="test_user_3",
        message="My dog is having seizures and can't breathe properly",
        pet_profile=sample_pet_profile,
        pet_id="test_pet_3"
    )
    
    # Emergency situations should be acknowledged urgently
    assert "urgent" in response["message"].lower() or "emergency" in response["message"].lower()


@pytest.mark.asyncio
async def test_context_persistence(conversation_service, sample_pet_profile):
    """Test that conversation context persists across messages."""
    
    user_id = "test_user_4"
    pet_id = "test_pet_4"
    
    # First message
    response1 = await conversation_service.process_message(
        user_id=user_id,
        message="My cat is vomiting",
        pet_profile=sample_pet_profile,
        pet_id=pet_id
    )
    
    # Get context
    context = conversation_service.get_or_create_context(user_id, pet_id)
    
    assert len(context.conversation_history) >= 2  # User message + assistant response
    assert context.collected_info.get("initial_symptoms") == "My cat is vomiting"


@pytest.mark.asyncio
async def test_clear_context(conversation_service, sample_pet_profile):
    """Test clearing conversation context."""
    
    user_id = "test_user_5"
    pet_id = "test_pet_5"
    
    # Create conversation
    await conversation_service.process_message(
        user_id=user_id,
        message="My dog is limping",
        pet_profile=sample_pet_profile,
        pet_id=pet_id
    )
    
    # Clear context
    conversation_service.clear_context(user_id, pet_id)
    
    # Get context - should be fresh
    context = conversation_service.get_or_create_context(user_id, pet_id)
    
    assert context.stage == ConversationStage.INITIAL_SYMPTOM
    assert len(context.conversation_history) == 0


@pytest.mark.asyncio
async def test_response_formatting(conversation_service, sample_pet_profile):
    """Test that responses are properly formatted with structure."""
    
    user_id = "test_user_6"
    pet_id = "test_pet_6"
    
    # Go through conversation to get assessment
    response1 = await conversation_service.process_message(
        user_id=user_id,
        message="My dog has been vomiting and has diarrhea",
        pet_profile=sample_pet_profile,
        pet_id=pet_id
    )
    
    # Answer questions to reach assessment
    for i in range(4):
        response = await conversation_service.process_message(
            user_id=user_id,
            message="Normal" if i % 2 == 0 else "Yes",
            pet_profile=sample_pet_profile,
            pet_id=pet_id
        )
        
        if response.get("triage_level"):
            # Check that assessment has proper formatting
            assert "•" in response["message"] or "-" in response["message"]  # Bullet points
            break


def test_determine_questions_needed(conversation_service):
    """Test question determination logic."""
    
    # Test vomiting scenario
    questions = conversation_service._determine_questions_needed(
        "My dog is vomiting",
        None
    )
    
    assert len(questions) > 0
    assert any("eat" in q.lower() for q in questions)
    assert any("water" in q.lower() or "drink" in q.lower() for q in questions)


def test_generate_acknowledgment(conversation_service):
    """Test acknowledgment generation."""
    
    # Test emergency acknowledgment
    ack1 = conversation_service._generate_acknowledgment(
        "My dog is having an emergency seizure"
    )
    assert "urgent" in ack1.lower() or "emergency" in ack1.lower()
    
    # Test worried acknowledgment
    ack2 = conversation_service._generate_acknowledgment(
        "I'm really worried about my cat"
    )
    assert "worried" in ack2.lower() or "concerned" in ack2.lower()
    
    # Test normal acknowledgment
    ack3 = conversation_service._generate_acknowledgment(
        "My dog is scratching"
    )
    assert "concerned" in ack3.lower() or "understand" in ack3.lower()
