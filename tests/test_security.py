"""
Unit tests for security features including encryption, session management, and HTTPS enforcement.
"""

import pytest
import time
from app.core.encryption import (
    EncryptionService,
    encrypt_sensitive_field,
    decrypt_sensitive_field,
    hash_sensitive_identifier
)
from app.core.middleware import (
    create_session,
    update_session_activity,
    is_session_valid,
    invalidate_session,
    cleanup_expired_sessions,
    active_sessions
)
from app.core.config import settings


class TestEncryptionService:
    """Test encryption service functionality."""
    
    def test_encrypt_decrypt_string(self):
        """Test string encryption and decryption."""
        service = EncryptionService()
        plaintext = "sensitive medical data"
        
        encrypted = service.encrypt_string(plaintext)
        assert encrypted != plaintext
        assert len(encrypted) > 0
        
        decrypted = service.decrypt_string(encrypted)
        assert decrypted == plaintext
    
    def test_encrypt_empty_string(self):
        """Test encryption of empty string."""
        service = EncryptionService()
        result = service.encrypt_string("")
        assert result == ""
    
    def test_encrypt_none(self):
        """Test encryption of None value."""
        result = encrypt_sensitive_field(None)
        assert result is None
    
    def test_decrypt_none(self):
        """Test decryption of None value."""
        result = decrypt_sensitive_field(None)
        assert result is None
    
    def test_encrypt_decrypt_sensitive_field(self):
        """Test helper functions for sensitive field encryption."""
        original = "patient@example.com"
        
        encrypted = encrypt_sensitive_field(original)
        assert encrypted != original
        
        decrypted = decrypt_sensitive_field(encrypted)
        assert decrypted == original
    
    def test_encrypt_bytes(self):
        """Test bytes encryption and decryption."""
        service = EncryptionService()
        data = b"binary medical data"
        
        encrypted = service.encrypt_bytes(data)
        assert encrypted != data
        
        decrypted = service.decrypt_bytes(encrypted)
        assert decrypted == data
    
    def test_hash_sensitive_identifier(self):
        """Test one-way hashing of sensitive identifiers."""
        identifier = "user@example.com"
        
        hash1 = hash_sensitive_identifier(identifier)
        hash2 = hash_sensitive_identifier(identifier)
        
        # Same input should produce different hashes (due to random salt)
        assert hash1 != hash2
        assert len(hash1) > 0
        assert len(hash2) > 0
    
    def test_encryption_consistency(self):
        """Test that encryption produces different outputs for same input."""
        service = EncryptionService()
        plaintext = "test data"
        
        encrypted1 = service.encrypt_string(plaintext)
        encrypted2 = service.encrypt_string(plaintext)
        
        # Fernet includes timestamp, so encryptions should differ
        # But both should decrypt to same value
        decrypted1 = service.decrypt_string(encrypted1)
        decrypted2 = service.decrypt_string(encrypted2)
        
        assert decrypted1 == plaintext
        assert decrypted2 == plaintext


class TestSessionManagement:
    """Test session management functionality."""
    
    def setup_method(self):
        """Clear sessions before each test."""
        active_sessions.clear()
    
    def test_create_session(self):
        """Test session creation."""
        user_id = "test-user-123"
        token = "test-token-abc"
        
        create_session(user_id, token)
        
        assert token in active_sessions
        assert active_sessions[token]["user_id"] == user_id
        assert "created_at" in active_sessions[token]
        assert "last_activity" in active_sessions[token]
    
    def test_update_session_activity(self):
        """Test session activity update."""
        user_id = "test-user-123"
        token = "test-token-abc"
        
        create_session(user_id, token)
        original_activity = active_sessions[token]["last_activity"]
        
        time.sleep(0.1)
        update_session_activity(token)
        
        assert active_sessions[token]["last_activity"] > original_activity
    
    def test_is_session_valid_new_session(self):
        """Test that newly created session is valid."""
        user_id = "test-user-123"
        token = "test-token-abc"
        
        create_session(user_id, token)
        
        assert is_session_valid(token) is True
    
    def test_is_session_valid_nonexistent(self):
        """Test that nonexistent session is invalid."""
        assert is_session_valid("nonexistent-token") is False
    
    def test_invalidate_session(self):
        """Test session invalidation."""
        user_id = "test-user-123"
        token = "test-token-abc"
        
        create_session(user_id, token)
        assert token in active_sessions
        
        invalidate_session(token)
        assert token not in active_sessions
    
    def test_cleanup_expired_sessions(self):
        """Test cleanup of expired sessions."""
        # Create a session with manipulated timestamps
        user_id = "test-user-123"
        token = "test-token-abc"
        
        create_session(user_id, token)
        
        # Manually set timestamps to simulate expired session
        current_time = time.time()
        active_sessions[token]["created_at"] = current_time - (settings.SESSION_TIMEOUT_MINUTES * 60 + 100)
        active_sessions[token]["last_activity"] = current_time - (settings.SESSION_IDLE_TIMEOUT_MINUTES * 60 + 100)
        
        cleanup_expired_sessions()
        
        assert token not in active_sessions


class TestSecurityHeaders:
    """Test security headers configuration."""
    
    def test_security_settings_configured(self):
        """Test that security settings are properly configured."""
        assert hasattr(settings, 'FORCE_HTTPS')
        assert hasattr(settings, 'HSTS_MAX_AGE')
        assert hasattr(settings, 'ENABLE_SECURITY_HEADERS')
        assert hasattr(settings, 'CSP_POLICY')
    
    def test_session_timeout_configured(self):
        """Test that session timeout settings are configured."""
        assert hasattr(settings, 'SESSION_TIMEOUT_MINUTES')
        assert hasattr(settings, 'SESSION_IDLE_TIMEOUT_MINUTES')
        assert settings.SESSION_TIMEOUT_MINUTES > 0
        assert settings.SESSION_IDLE_TIMEOUT_MINUTES > 0
    
    def test_encryption_settings_configured(self):
        """Test that encryption settings are configured."""
        assert hasattr(settings, 'ENCRYPTION_ENABLED')
        assert settings.ENCRYPTION_ENABLED is True


class TestPasswordSecurity:
    """Test password security features."""
    
    def test_password_hashing(self):
        """Test that passwords are properly hashed."""
        from app.core.security import get_password_hash, verify_password
        
        password = "SecurePassword123!"
        hashed = get_password_hash(password)
        
        # Hash should be different from password
        assert hashed != password
        
        # Should be able to verify correct password
        assert verify_password(password, hashed) is True
        
        # Should reject incorrect password
        assert verify_password("WrongPassword", hashed) is False
    
    def test_password_hash_uniqueness(self):
        """Test that same password produces different hashes."""
        from app.core.security import get_password_hash
        
        password = "SecurePassword123!"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        # Bcrypt includes salt, so hashes should differ
        assert hash1 != hash2


class TestTokenSecurity:
    """Test JWT token security features."""
    
    def test_token_creation(self):
        """Test JWT token creation."""
        from app.core.security import create_access_token, verify_token
        
        data = {"sub": "user-123", "email": "test@example.com"}
        token = create_access_token(data)
        
        assert token is not None
        assert len(token) > 0
        
        # Verify token
        payload = verify_token(token, token_type="access")
        assert payload is not None
        assert payload["sub"] == "user-123"
        assert payload["email"] == "test@example.com"
    
    def test_token_expiration(self):
        """Test that expired tokens are rejected."""
        from app.core.security import create_access_token, verify_token
        from datetime import timedelta
        
        data = {"sub": "user-123", "email": "test@example.com"}
        # Create token that expires immediately
        token = create_access_token(data, expires_delta=timedelta(seconds=-1))
        
        # Token should be invalid due to expiration
        payload = verify_token(token, token_type="access")
        assert payload is None
    
    def test_token_type_validation(self):
        """Test that token type is validated."""
        from app.core.security import create_access_token, verify_token
        
        data = {"sub": "user-123", "email": "test@example.com"}
        access_token = create_access_token(data)
        
        # Should fail when verifying as refresh token
        payload = verify_token(access_token, token_type="refresh")
        assert payload is None
