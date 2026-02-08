"""
Application configuration management using Pydantic settings.
"""

from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    # Application Settings
    APP_NAME: str = "PawPal Voice Pet Care Assistant"
    DEBUG: bool = False
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # Database Settings
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./pawpal.db",
        description="Database connection URL"
    )
    DATABASE_POOL_SIZE: int = Field(
        default=20,
        description="Database connection pool size"
    )
    DATABASE_MAX_OVERFLOW: int = Field(
        default=10,
        description="Maximum overflow connections beyond pool size"
    )
    DATABASE_POOL_TIMEOUT: int = Field(
        default=30,
        description="Connection pool timeout in seconds"
    )
    DATABASE_POOL_RECYCLE: int = Field(
        default=3600,
        description="Connection recycle time in seconds (1 hour)"
    )
    
    # Redis Cache Settings
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL for caching"
    )
    REDIS_ENABLED: bool = Field(
        default=True,
        description="Enable Redis caching (falls back to in-memory if unavailable)"
    )
    CACHE_DEFAULT_TTL: int = Field(
        default=300,
        description="Default cache TTL in seconds (5 minutes)"
    )
    
    # Security Settings
    SECRET_KEY: str = Field(
        default="your-secret-key-change-in-production",
        description="Secret key for JWT token generation"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SESSION_TIMEOUT_MINUTES: int = 60  # Absolute session timeout
    SESSION_IDLE_TIMEOUT_MINUTES: int = 30  # Idle timeout
    
    # Encryption Settings
    ENCRYPTION_ENABLED: bool = True
    ENCRYPTION_KEY_ROTATION_DAYS: int = 90
    
    # HTTPS/TLS Settings
    FORCE_HTTPS: bool = True  # Redirect HTTP to HTTPS in production
    HSTS_MAX_AGE: int = 31536000  # 1 year in seconds
    HSTS_INCLUDE_SUBDOMAINS: bool = True
    
    # Security Headers
    ENABLE_SECURITY_HEADERS: bool = True
    CSP_POLICY: str = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    
    # External API Keys
    OPENAI_API_KEY: Optional[str] = Field(
        default=None,
        description="OpenAI API key for GPT models"
    )
    GEMINI_API_KEY: Optional[str] = Field(
        default=None,
        description="Google Gemini API key for Gemini models"
    )
    SCALEDOWN_API_KEY: Optional[str] = Field(
        default=None,
        description="ScaleDown API key for knowledge base compression"
    )
    GOOGLE_MAPS_API_KEY: Optional[str] = Field(
        default=None,
        description="Google Maps API key for location services"
    )
    TWILIO_ACCOUNT_SID: Optional[str] = Field(
        default=None,
        description="Twilio Account SID for SMS notifications"
    )
    TWILIO_AUTH_TOKEN: Optional[str] = Field(
        default=None,
        description="Twilio Auth Token for SMS notifications"
    )
    TWILIO_PHONE_NUMBER: Optional[str] = Field(
        default=None,
        description="Twilio phone number for sending SMS"
    )
    SENDGRID_API_KEY: Optional[str] = Field(
        default=None,
        description="SendGrid API key for email notifications"
    )
    SENDGRID_FROM_EMAIL: Optional[str] = Field(
        default=None,
        description="SendGrid from email address"
    )
    
    # AI Model Configuration
    AI_PROVIDER: str = "gemini"  # "openai" or "gemini"
    PRIMARY_AI_MODEL: str = "gemini-2.5-pro"
    FALLBACK_AI_MODEL: str = "gemini-2.5-flash"
    AI_TEMPERATURE: float = 0.3
    AI_MAX_TOKENS: int = 1000
    
    # Voice Interface Settings
    STT_PROVIDER: str = "web_speech_api"  # "web_speech_api" or "openai_whisper"
    TTS_PROVIDER: str = "web_speech_api"  # "web_speech_api" or "openai_tts"
    TTS_VOICE: str = "nova"
    TTS_SPEED: float = 0.95
    
    # File Upload Settings
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: List[str] = ["pdf", "jpg", "jpeg", "png", "doc", "docx"]
    
    # Notification Settings
    MEDICATION_REMINDER_MINUTES: int = 15
    APPOINTMENT_REMINDER_HOURS: List[int] = [24, 2]
    
    # Logging Settings
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Error Tracking (Sentry)
    SENTRY_DSN: Optional[str] = Field(
        default=None,
        description="Sentry DSN for error tracking"
    )
    SENTRY_ENVIRONMENT: str = Field(
        default="development",
        description="Sentry environment (development, staging, production)"
    )
    SENTRY_TRACES_SAMPLE_RATE: float = Field(
        default=0.1,
        description="Sentry traces sample rate (0.0 to 1.0)"
    )
    
    # Monitoring
    ENABLE_METRICS: bool = Field(
        default=False,
        description="Enable Prometheus metrics endpoint"
    )
    METRICS_PORT: int = Field(
        default=9090,
        description="Port for Prometheus metrics"
    )


# Global settings instance
settings = Settings()