"""
Integration tests for PawPal Voice Pet Care Assistant.

Tests end-to-end workflows including:
- Symptom analysis and triage workflows
- External API integrations with mock services
- Performance testing for critical endpoints

**Feature: pawpal-voice-pet-care-assistant**
**Validates: All requirements integration**
"""

import pytest
import asyncio
import time
from datetime import date, datetime, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch, AsyncMock, MagicMock

from app.database.models import User, Pet, Medication, HealthRecord, Appointment


class TestSymptomAnalysisWorkflow:
    """Test end-to-end symptom analysis and triage workflow."""
    
    @pytest.mark.asyncio
    async def test_complete_symptom_analysis_workflow(
        self, 
        client: AsyncClient, 
        test_user: User,
        test_pet: Pet,
        db_session: AsyncSession
    ):
        """
        Test complete workflow: login -> symptom input -> AI analysis -> triage response.
        
        Validates Requirements: 1.2, 3.1, 3.2, 3.3, 3.4, 3.5
        """
        # Step 1: Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword123"
            }
        )
        assert login_response.status_code == 200
        tokens = login_response.json()
        access_token = tokens["access_token"]
        
        # Step 2: Submit symptom analysis with mocked AI service
        with patch('app.services.ai_service.ai_service.process_symptom_input') as mock_ai:
            # Mock AI response with Red triage (emergency)
            mock_analysis = MagicMock()
            mock_analysis.to_dict.return_value = {
                "symptoms": "vomiting, lethargy, not eating",
                "triage_level": "Red",
                "confidence": 0.92,
                "model_used": "gpt-4-turbo"
            }
            
            mock_triage = MagicMock()
            mock_triage.to_dict.return_value = {
                "level": "Red",
                "urgency": "Emergency - Immediate veterinary care required",
                "recommendations": [
                    "Seek emergency veterinary care immediately",
                    "Do not wait for regular clinic hours",
                    "Monitor for worsening symptoms"
                ],
                "emergency_vets_needed": True
            }
            
            mock_ai.return_value = (mock_analysis, mock_triage)
            
            symptom_response = await client.post(
                "/api/v1/ai/analyze-symptoms",
                json={
                    "symptom_input": "My dog has been vomiting and won't eat",
                    "pet_id": str(test_pet.id),
                    "input_type": "text"
                },
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            assert symptom_response.status_code == 200
            result = symptom_response.json()
            assert result["success"] is True
            assert result["analysis_result"]["triage_level"] == "Red"
            assert result["triage_response"]["emergency_vets_needed"] is True
    
    @pytest.mark.asyncio
    async def test_yellow_triage_appointment_workflow(
        self,
        client: AsyncClient,
        test_user: User,
        test_pet: Pet,
        db_session: AsyncSession
    ):
        """
        Test Yellow triage workflow with appointment scheduling recommendation.
        
        Validates Requirements: 3.4, 7.1, 7.3
        """
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "testpassword123"}
        )
        access_token = login_response.json()["access_token"]
        
        # Mock Yellow triage response
        with patch('app.services.ai_service.ai_service.process_symptom_input') as mock_ai:
            mock_analysis = MagicMock()
            mock_analysis.to_dict.return_value = {
                "symptoms": "mild cough, reduced appetite",
                "triage_level": "Yellow",
                "confidence": 0.85,
                "model_used": "gpt-4-turbo"
            }
            
            mock_triage = MagicMock()
            mock_triage.to_dict.return_value = {
                "level": "Yellow",
                "urgency": "Schedule vet appointment within 24-48 hours",
                "recommendations": [
                    "Schedule a veterinary appointment within 24-48 hours",
                    "Monitor symptoms for worsening",
                    "Keep pet hydrated"
                ],
                "emergency_vets_needed": False
            }
            
            mock_ai.return_value = (mock_analysis, mock_triage)
            
            symptom_response = await client.post(
                "/api/v1/ai/analyze-symptoms",
                json={
                    "symptom_input": "My cat has a mild cough",
                    "pet_id": str(test_pet.id),
                    "input_type": "text"
                },
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            assert symptom_response.status_code == 200
            result = symptom_response.json()
            assert result["analysis_result"]["triage_level"] == "Yellow"
            assert "24-48 hours" in result["triage_response"]["urgency"]


class TestExternalAPIIntegrations:
    """Test external API integrations with mock services."""
    
    @pytest.mark.asyncio
    async def test_google_maps_emergency_vet_integration(
        self,
        client: AsyncClient,
        test_user: User
    ):
        """
        Test Google Maps API integration for emergency vet locations.
        
        Validates Requirements: 8.1, 8.4
        """
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "testpassword123"}
        )
        access_token = login_response.json()["access_token"]
        
        # Mock Google Maps API response
        with patch('app.services.maps_service.googlemaps.Client') as mock_maps:
            mock_client = MagicMock()
            mock_client.places_nearby.return_value = {
                "results": [
                    {
                        "name": "Emergency Vet Clinic",
                        "vicinity": "123 Main St",
                        "geometry": {"location": {"lat": 40.7128, "lng": -74.0060}},
                        "rating": 4.5,
                        "opening_hours": {"open_now": True}
                    }
                ],
                "status": "OK"
            }
            mock_maps.return_value = mock_client
            
            # Request emergency vet locations
            maps_response = await client.get(
                "/api/v1/maps/emergency-vets",
                params={
                    "latitude": 40.7128,
                    "longitude": -74.0060,
                    "radius": 5000
                },
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            assert maps_response.status_code == 200
            result = maps_response.json()
            assert len(result["clinics"]) > 0
            assert result["clinics"][0]["name"] == "Emergency Vet Clinic"
    
    @pytest.mark.asyncio
    async def test_twilio_sms_notification_integration(
        self,
        client: AsyncClient,
        test_user: User
    ):
        """
        Test Twilio SMS API integration for urgent notifications.
        
        Validates Requirements: 8.2
        """
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "testpassword123"}
        )
        access_token = login_response.json()["access_token"]
        
        # Mock Twilio API
        with patch('app.services.sms_service.Client') as mock_twilio:
            mock_client = MagicMock()
            mock_message = MagicMock()
            mock_message.sid = "SM123456789"
            mock_message.status = "sent"
            mock_client.messages.create.return_value = mock_message
            mock_twilio.return_value = mock_client
            
            # Send urgent SMS notification
            sms_response = await client.post(
                "/api/v1/sms/send-urgent",
                json={
                    "phone_number": "+15551234567",
                    "message": "Urgent: Your pet's medication refill is due"
                },
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            assert sms_response.status_code == 200
            result = sms_response.json()
            assert result["success"] is True
            assert "sid" in result
    
    @pytest.mark.asyncio
    async def test_sendgrid_email_health_report_integration(
        self,
        client: AsyncClient,
        test_user: User,
        test_pet: Pet
    ):
        """
        Test SendGrid Email API integration for health reports.
        
        Validates Requirements: 8.3
        """
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "testpassword123"}
        )
        access_token = login_response.json()["access_token"]
        
        # Mock SendGrid API
        with patch('app.services.email_service.SendGridAPIClient') as mock_sendgrid:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.status_code = 202
            mock_client.send.return_value = mock_response
            mock_sendgrid.return_value = mock_client
            
            # Send health report email
            email_response = await client.post(
                "/api/v1/email/send-health-report",
                json={
                    "pet_id": str(test_pet.id),
                    "recipient_email": "test@example.com"
                },
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            assert email_response.status_code == 200
            result = email_response.json()
            assert result["success"] is True
    
    @pytest.mark.asyncio
    async def test_external_api_graceful_degradation(
        self,
        client: AsyncClient,
        test_user: User
    ):
        """
        Test graceful degradation when external APIs are unavailable.
        
        Validates Requirements: 8.5
        """
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "testpassword123"}
        )
        access_token = login_response.json()["access_token"]
        
        # Mock Google Maps API failure
        with patch('app.services.maps_service.googlemaps.Client') as mock_maps:
            mock_maps.side_effect = Exception("API unavailable")
            
            # Request should still return cached/fallback data
            maps_response = await client.get(
                "/api/v1/maps/emergency-vets",
                params={
                    "latitude": 40.7128,
                    "longitude": -74.0060,
                    "radius": 5000
                },
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            # Should return 503 or fallback data, not crash
            assert maps_response.status_code in [200, 503]
            if maps_response.status_code == 200:
                result = maps_response.json()
                assert "fallback" in result or "cached" in result


class TestPerformanceCriticalEndpoints:
    """Performance testing for critical endpoints."""
    
    @pytest.mark.asyncio
    async def test_authentication_endpoint_performance(
        self,
        client: AsyncClient,
        test_user: User
    ):
        """
        Test authentication endpoint response time.
        
        Should complete within 500ms for good user experience.
        Validates Requirements: 11.3, 12.2
        """
        start_time = time.time()
        
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword123"
            }
        )
        
        end_time = time.time()
        response_time = (end_time - start_time) * 1000  # Convert to ms
        
        assert response.status_code == 200
        assert response_time < 500, f"Login took {response_time}ms, should be < 500ms"
    
    @pytest.mark.asyncio
    async def test_pet_profile_retrieval_performance(
        self,
        client: AsyncClient,
        test_user: User,
        test_pet: Pet
    ):
        """
        Test pet profile retrieval performance.
        
        Should complete within 200ms for responsive UI.
        Validates Requirements: 2.1, 12.2
        """
        # Login first
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "testpassword123"}
        )
        access_token = login_response.json()["access_token"]
        
        start_time = time.time()
        
        response = await client.get(
            f"/api/v1/pets/{test_pet.id}",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        end_time = time.time()
        response_time = (end_time - start_time) * 1000
        
        assert response.status_code == 200
        assert response_time < 200, f"Pet retrieval took {response_time}ms, should be < 200ms"
    
    @pytest.mark.asyncio
    async def test_concurrent_requests_handling(
        self,
        client: AsyncClient,
        test_user: User,
        test_pet: Pet
    ):
        """
        Test system handling of concurrent requests.
        
        Should handle multiple simultaneous requests without degradation.
        Validates Requirements: 12.2, 12.3
        """
        # Login first
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "testpassword123"}
        )
        access_token = login_response.json()["access_token"]
        
        # Create 10 concurrent requests
        async def make_request():
            return await client.get(
                f"/api/v1/pets/{test_pet.id}",
                headers={"Authorization": f"Bearer {access_token}"}
            )
        
        start_time = time.time()
        
        # Execute concurrent requests
        responses = await asyncio.gather(*[make_request() for _ in range(10)])
        
        end_time = time.time()
        total_time = (end_time - start_time) * 1000
        
        # All requests should succeed
        assert all(r.status_code == 200 for r in responses)
        
        # Total time should be reasonable (not 10x single request time)
        # Allow 1 second for 10 concurrent requests
        assert total_time < 1000, f"10 concurrent requests took {total_time}ms"
    
    @pytest.mark.asyncio
    async def test_ai_symptom_analysis_performance(
        self,
        client: AsyncClient,
        test_user: User,
        test_pet: Pet
    ):
        """
        Test AI symptom analysis endpoint performance.
        
        Should complete within 3 seconds for acceptable user experience.
        Validates Requirements: 3.1, 3.6, 12.2
        """
        # Login first
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "testpassword123"}
        )
        access_token = login_response.json()["access_token"]
        
        # Mock AI service for consistent timing
        with patch('app.services.ai_service.ai_service.process_symptom_input') as mock_ai:
            mock_analysis = MagicMock()
            mock_analysis.to_dict.return_value = {
                "symptoms": "test symptoms",
                "triage_level": "Green",
                "confidence": 0.9,
                "model_used": "gpt-4-turbo"
            }
            
            mock_triage = MagicMock()
            mock_triage.to_dict.return_value = {
                "level": "Green",
                "urgency": "Monitor at home",
                "recommendations": ["Monitor symptoms"],
                "emergency_vets_needed": False
            }
            
            mock_ai.return_value = (mock_analysis, mock_triage)
            
            start_time = time.time()
            
            response = await client.post(
                "/api/v1/ai/analyze-symptoms",
                json={
                    "symptom_input": "My pet seems tired",
                    "pet_id": str(test_pet.id),
                    "input_type": "text"
                },
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            end_time = time.time()
            response_time = (end_time - start_time) * 1000
            
            assert response.status_code == 200
            # AI analysis should complete within 3 seconds
            assert response_time < 3000, f"AI analysis took {response_time}ms, should be < 3000ms"


class TestCompleteUserJourney:
    """Test complete user journey from registration to care management."""
    
    @pytest.mark.asyncio
    async def test_new_user_complete_workflow(
        self,
        client: AsyncClient,
        db_session: AsyncSession
    ):
        """
        Test complete workflow for new user:
        1. Register
        2. Create pet profile
        3. Add medical information
        4. Analyze symptoms
        5. Schedule appointment
        
        Validates Requirements: 1.1, 2.1, 2.2, 3.1, 7.1
        """
        # Step 1: Register new user
        register_response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "SecurePass123!",
                "first_name": "New",
                "last_name": "User",
                "phone_number": "555-9999"
            }
        )
        assert register_response.status_code == 201
        tokens = register_response.json()
        access_token = tokens["access_token"]
        
        # Step 2: Create pet profile
        pet_response = await client.post(
            "/api/v1/pets/",
            json={
                "name": "Max",
                "species": "dog",
                "breed": "Labrador",
                "birth_date": "2020-05-15",
                "weight": 70.0,
                "gender": "male"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert pet_response.status_code == 201
        pet_data = pet_response.json()
        pet_id = pet_data["id"]
        
        # Step 3: Add medical condition
        condition_response = await client.post(
            f"/api/v1/pets/{pet_id}/medical-conditions",
            json={
                "condition_name": "Hip Dysplasia",
                "diagnosed_date": "2021-03-10",
                "severity": "moderate",
                "treatment": "Physical therapy and pain management"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert condition_response.status_code == 201
        
        # Step 4: Analyze symptoms (mocked)
        with patch('app.services.ai_service.ai_service.process_symptom_input') as mock_ai:
            mock_analysis = MagicMock()
            mock_analysis.to_dict.return_value = {
                "symptoms": "limping",
                "triage_level": "Yellow",
                "confidence": 0.88,
                "model_used": "gpt-4-turbo"
            }
            
            mock_triage = MagicMock()
            mock_triage.to_dict.return_value = {
                "level": "Yellow",
                "urgency": "Schedule appointment within 24-48 hours",
                "recommendations": ["Schedule vet visit"],
                "emergency_vets_needed": False
            }
            
            mock_ai.return_value = (mock_analysis, mock_triage)
            
            symptom_response = await client.post(
                "/api/v1/ai/analyze-symptoms",
                json={
                    "symptom_input": "Max is limping on his back leg",
                    "pet_id": pet_id,
                    "input_type": "text"
                },
                headers={"Authorization": f"Bearer {access_token}"}
            )
            assert symptom_response.status_code == 200
        
        # Step 5: Schedule appointment
        appointment_response = await client.post(
            "/api/v1/appointments/",
            json={
                "pet_id": pet_id,
                "appointment_date": (datetime.now() + timedelta(days=1)).isoformat(),
                "clinic_name": "City Vet Clinic",
                "clinic_address": "456 Oak St",
                "clinic_phone": "555-8888",
                "reason": "Follow-up for limping",
                "notes": "Hip dysplasia patient"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert appointment_response.status_code == 201
        
        # Verify complete workflow succeeded
        assert all([
            register_response.status_code == 201,
            pet_response.status_code == 201,
            condition_response.status_code == 201,
            symptom_response.status_code == 200,
            appointment_response.status_code == 201
        ])
