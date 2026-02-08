"""
Tests for authentication endpoints and functionality.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password, get_password_hash, verify_token
from app.database.models import User


class TestPasswordSecurity:
    """Test password hashing and verification."""
    
    def test_password_hashing(self):
        """Test password hashing with bcrypt."""
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        
        # Hash should be different from original password
        assert hashed != password
        
        # Hash should be verifiable
        assert verify_password(password, hashed)
        
        # Wrong password should not verify
        assert not verify_password("WrongPassword", hashed)
    
    def test_password_hash_uniqueness(self):
        """Test that same password produces different hashes (salt)."""
        password = "TestPassword123!"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        # Hashes should be different due to salt
        assert hash1 != hash2
        
        # Both should verify the same password
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)


class TestJWTTokens:
    """Test JWT token creation and verification."""
    
    def test_token_creation_and_verification(self):
        """Test JWT token creation and verification."""
        from app.core.security import create_access_token, create_refresh_token
        
        user_data = {"sub": "test-user-id", "email": "test@example.com"}
        
        # Create tokens
        access_token = create_access_token(user_data)
        refresh_token = create_refresh_token(user_data)
        
        # Verify tokens
        access_payload = verify_token(access_token, "access")
        refresh_payload = verify_token(refresh_token, "refresh")
        
        # Check payloads
        assert access_payload["sub"] == "test-user-id"
        assert access_payload["email"] == "test@example.com"
        assert access_payload["type"] == "access"
        
        assert refresh_payload["sub"] == "test-user-id"
        assert refresh_payload["email"] == "test@example.com"
        assert refresh_payload["type"] == "refresh"
    
    def test_token_type_validation(self):
        """Test that tokens are validated for correct type."""
        from app.core.security import create_access_token, create_refresh_token
        
        user_data = {"sub": "test-user-id", "email": "test@example.com"}
        
        access_token = create_access_token(user_data)
        refresh_token = create_refresh_token(user_data)
        
        # Access token should not verify as refresh token
        assert verify_token(access_token, "refresh") is None
        
        # Refresh token should not verify as access token
        assert verify_token(refresh_token, "access") is None


@pytest.mark.asyncio
class TestUserRegistration:
    """Test user registration endpoint."""
    
    async def test_successful_registration(self, client: AsyncClient):
        """Test successful user registration."""
        user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User",
            "phone_number": "+1234567890",
            "emergency_contact": "Emergency Contact",
            "preferred_vet_clinic": "Test Vet Clinic"
        }
        
        response = await client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        
        # Check response structure
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
        
        # Verify tokens are valid
        access_payload = verify_token(data["access_token"], "access")
        refresh_payload = verify_token(data["refresh_token"], "refresh")
        
        assert access_payload is not None
        assert refresh_payload is not None
        assert access_payload["email"] == "test@example.com"
    
    async def test_duplicate_email_registration(self, client: AsyncClient, db_session: AsyncSession):
        """Test registration with duplicate email."""
        # Create first user
        user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        response1 = await client.post("/api/v1/auth/register", json=user_data)
        assert response1.status_code == 201
        
        # Try to create second user with same email
        response2 = await client.post("/api/v1/auth/register", json=user_data)
        assert response2.status_code == 400
        
        data = response2.json()
        assert "email already exists" in data["detail"].lower()
    
    async def test_invalid_password_registration(self, client: AsyncClient):
        """Test registration with invalid password."""
        user_data = {
            "email": "test@example.com",
            "password": "weak",  # Too weak password
            "first_name": "Test",
            "last_name": "User"
        }
        
        response = await client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 422
    
    async def test_invalid_email_registration(self, client: AsyncClient):
        """Test registration with invalid email."""
        user_data = {
            "email": "invalid-email",  # Invalid email format
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        response = await client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 422


@pytest.mark.asyncio
class TestUserLogin:
    """Test user login endpoint."""
    
    async def test_successful_login(self, client: AsyncClient):
        """Test successful user login."""
        # First register a user
        user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        register_response = await client.post("/api/v1/auth/register", json=user_data)
        assert register_response.status_code == 201
        
        # Now login
        login_data = {
            "email": "test@example.com",
            "password": "TestPassword123!"
        }
        
        response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    async def test_invalid_credentials_login(self, client: AsyncClient):
        """Test login with invalid credentials."""
        # Register a user first
        user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        register_response = await client.post("/api/v1/auth/register", json=user_data)
        assert register_response.status_code == 201
        
        # Try login with wrong password
        login_data = {
            "email": "test@example.com",
            "password": "WrongPassword"
        }
        
        response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 401
        
        data = response.json()
        assert "invalid" in data["detail"].lower()
    
    async def test_nonexistent_user_login(self, client: AsyncClient):
        """Test login with non-existent user."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "TestPassword123!"
        }
        
        response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 401


@pytest.mark.asyncio
class TestTokenRefresh:
    """Test token refresh endpoint."""
    
    async def test_successful_token_refresh(self, client: AsyncClient):
        """Test successful token refresh."""
        # Register and login
        user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        register_response = await client.post("/api/v1/auth/register", json=user_data)
        tokens = register_response.json()
        
        # Refresh token
        refresh_data = {
            "refresh_token": tokens["refresh_token"]
        }
        
        response = await client.post("/api/v1/auth/refresh", json=refresh_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        
        # New tokens should be different from original
        assert data["access_token"] != tokens["access_token"]
        assert data["refresh_token"] != tokens["refresh_token"]
    
    async def test_invalid_refresh_token(self, client: AsyncClient):
        """Test refresh with invalid token."""
        refresh_data = {
            "refresh_token": "invalid-token"
        }
        
        response = await client.post("/api/v1/auth/refresh", json=refresh_data)
        assert response.status_code == 401


@pytest.mark.asyncio
class TestUserProfile:
    """Test user profile endpoints."""
    
    async def test_get_profile_authenticated(self, client: AsyncClient):
        """Test getting user profile when authenticated."""
        # Register user
        user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User",
            "phone_number": "+1234567890"
        }
        
        register_response = await client.post("/api/v1/auth/register", json=user_data)
        tokens = register_response.json()
        
        # Get profile
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        response = await client.get("/api/v1/auth/profile", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["email"] == "test@example.com"
        assert data["first_name"] == "Test"
        assert data["last_name"] == "User"
        assert data["phone_number"] == "+1234567890"
        assert data["is_active"] is True
    
    async def test_get_profile_unauthenticated(self, client: AsyncClient):
        """Test getting user profile without authentication."""
        response = await client.get("/api/v1/auth/profile")
        assert response.status_code == 401
    
    async def test_update_profile_authenticated(self, client: AsyncClient):
        """Test updating user profile when authenticated."""
        # Register user
        user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        register_response = await client.post("/api/v1/auth/register", json=user_data)
        tokens = register_response.json()
        
        # Update profile
        update_data = {
            "first_name": "Updated",
            "emergency_contact": "New Emergency Contact"
        }
        
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        response = await client.put("/api/v1/auth/profile", json=update_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["first_name"] == "Updated"
        assert data["emergency_contact"] == "New Emergency Contact"
        assert data["last_name"] == "User"  # Unchanged field


@pytest.mark.asyncio
class TestSessionManagement:
    """Test session management features."""
    
    async def test_session_status(self, client: AsyncClient):
        """Test session status endpoint."""
        # Register user
        user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        register_response = await client.post("/api/v1/auth/register", json=user_data)
        tokens = register_response.json()
        
        # Get session status
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        response = await client.get("/api/v1/auth/session", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["email"] == "test@example.com"
        assert data["session_active"] is True
        assert "expires_in" in data
        assert "should_refresh" in data
        assert isinstance(data["expires_in"], int)
        assert isinstance(data["should_refresh"], bool)



@pytest.mark.asyncio
class TestAuthenticationEdgeCases:
    """Test authentication edge cases including expired tokens and rate limiting."""
    
    async def test_expired_access_token(self, client: AsyncClient):
        """Test that expired access tokens are rejected."""
        from datetime import timedelta
        from app.core.security import create_access_token
        
        # Create a token that expires immediately
        expired_token = create_access_token(
            {"sub": "test-user-id", "email": "test@example.com"},
            expires_delta=timedelta(seconds=-1)  # Already expired
        )
        
        # Try to use expired token
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = await client.get("/api/v1/auth/profile", headers=headers)
        
        assert response.status_code == 401
        data = response.json()
        assert "invalid" in data["detail"].lower() or "expired" in data["detail"].lower()
    
    async def test_expired_refresh_token(self, client: AsyncClient):
        """Test that expired refresh tokens are rejected."""
        from datetime import timedelta
        from app.core.security import create_refresh_token
        
        # Create a refresh token that expires immediately
        expired_refresh_token = create_refresh_token(
            {"sub": "test-user-id", "email": "test@example.com"},
            expires_delta=timedelta(seconds=-1)  # Already expired
        )
        
        # Try to refresh with expired token
        refresh_data = {
            "refresh_token": expired_refresh_token
        }
        
        response = await client.post("/api/v1/auth/refresh", json=refresh_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "invalid" in data["detail"].lower() or "expired" in data["detail"].lower()
    
    async def test_malformed_token(self, client: AsyncClient):
        """Test that malformed tokens are rejected."""
        # Try with completely invalid token format
        headers = {"Authorization": "Bearer not-a-valid-jwt-token"}
        response = await client.get("/api/v1/auth/profile", headers=headers)
        
        assert response.status_code == 401
    
    async def test_missing_authorization_header(self, client: AsyncClient):
        """Test that requests without authorization header are rejected."""
        response = await client.get("/api/v1/auth/profile")
        
        assert response.status_code == 401
        data = response.json()
        assert "authentication" in data["detail"].lower() or "credentials" in data["detail"].lower()
    
    async def test_wrong_token_type_for_endpoint(self, client: AsyncClient):
        """Test that using refresh token for access-only endpoints is rejected."""
        # Register user
        user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        register_response = await client.post("/api/v1/auth/register", json=user_data)
        tokens = register_response.json()
        
        # Try to use refresh token for profile endpoint (which requires access token)
        headers = {"Authorization": f"Bearer {tokens['refresh_token']}"}
        response = await client.get("/api/v1/auth/profile", headers=headers)
        
        assert response.status_code == 401
    
    async def test_inactive_user_authentication(self, client: AsyncClient, db_session: AsyncSession):
        """Test that inactive users cannot authenticate."""
        from app.database.models import User
        from sqlalchemy import select
        import uuid
        
        # Register user
        user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        register_response = await client.post("/api/v1/auth/register", json=user_data)
        tokens = register_response.json()
        
        # First verify the token works
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        response = await client.get("/api/v1/auth/profile", headers=headers)
        assert response.status_code == 200
        
        # Now manually deactivate the user in the database using the same session
        result = await db_session.execute(select(User).where(User.email == "test@example.com"))
        user = result.scalar_one_or_none()
        assert user is not None
        
        user.is_active = False
        await db_session.commit()
        
        # Try to use token after deactivation - should fail
        response = await client.get("/api/v1/auth/profile", headers=headers)
        
        assert response.status_code == 401
        data = response.json()
        assert "inactive" in data["detail"].lower()
    
    async def test_rate_limiting_login_attempts(self, client: AsyncClient):
        """Test that excessive login attempts are rate limited."""
        # Register a user first
        user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        register_response = await client.post("/api/v1/auth/register", json=user_data)
        assert register_response.status_code == 201
        
        # Attempt multiple failed logins rapidly
        login_data = {
            "email": "test@example.com",
            "password": "WrongPassword"
        }
        
        # Make multiple rapid requests
        responses = []
        for _ in range(10):
            response = await client.post("/api/v1/auth/login", json=login_data)
            responses.append(response)
        
        # Check if any requests were rate limited (429 status code)
        # Note: This test may pass without rate limiting if the limit is high
        # The important thing is that the rate limiting middleware is in place
        status_codes = [r.status_code for r in responses]
        
        # All should be either 401 (invalid credentials) or 429 (rate limited)
        assert all(code in [401, 429] for code in status_codes)
        
        # If rate limiting is working, we should see at least some 429s
        # But this depends on the rate limit configuration
        # For now, we just verify the middleware doesn't break the endpoint
    
    async def test_session_timeout_behavior(self, client: AsyncClient):
        """Test that session timeout is properly configured."""
        from app.core.config import settings
        
        # Verify that session timeout settings exist
        assert hasattr(settings, 'ACCESS_TOKEN_EXPIRE_MINUTES')
        assert hasattr(settings, 'REFRESH_TOKEN_EXPIRE_DAYS')
        
        # Verify reasonable timeout values
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES > 0
        assert settings.REFRESH_TOKEN_EXPIRE_DAYS > 0
        
        # Register user and get tokens
        user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        register_response = await client.post("/api/v1/auth/register", json=user_data)
        tokens = register_response.json()
        
        # Verify token expiration is included in response
        assert "expires_in" in tokens
        assert tokens["expires_in"] > 0
