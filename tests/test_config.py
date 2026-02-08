"""
Tests for application configuration.
"""

import pytest
from app.core.config import Settings


def test_settings_default_values():
    """Test that settings have correct default values."""
    settings = Settings()
    
    assert settings.APP_NAME == "PawPal Voice Pet Care Assistant"
    assert settings.DEBUG is False
    assert settings.ALLOWED_HOSTS == ["*"]
    assert settings.JWT_ALGORITHM == "HS256"
    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 30
    assert settings.PRIMARY_AI_MODEL == "gemini-2.5-pro"
    assert settings.FALLBACK_AI_MODEL == "gemini-2.5-flash"
    assert settings.TTS_VOICE == "nova"
    assert settings.TTS_SPEED == 0.95


def test_settings_environment_override(monkeypatch):
    """Test that environment variables override default settings."""
    monkeypatch.setenv("DEBUG", "true")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    monkeypatch.setenv("TTS_SPEED", "1.0")
    
    settings = Settings()
    
    assert settings.DEBUG is True
    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 60
    assert settings.TTS_SPEED == 1.0