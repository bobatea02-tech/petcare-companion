"""
Pydantic schemas for authentication endpoints.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class UserRegistration(BaseModel):
    """Schema for user registration request."""
    
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=72, description="User password")
    first_name: str = Field(..., min_length=1, max_length=100, description="User first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="User last name")
    phone_number: Optional[str] = Field(None, max_length=20, description="User phone number")
    emergency_contact: Optional[str] = Field(None, max_length=255, description="Emergency contact information")
    preferred_vet_clinic: Optional[str] = Field(None, max_length=255, description="Preferred veterinary clinic")
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        if len(v) > 72:
            raise ValueError('Password must be no more than 72 characters long')
        
        # Check for at least one uppercase letter
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        
        # Check for at least one lowercase letter
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        
        # Check for at least one digit
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        
        return v
    
    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v):
        """Validate phone number format."""
        if v is None:
            return v
        
        # Remove all non-digit characters for validation
        digits_only = re.sub(r'\D', '', v)
        
        # Check if it's a valid length (10-15 digits)
        if len(digits_only) < 10 or len(digits_only) > 15:
            raise ValueError('Phone number must be between 10 and 15 digits')
        
        return v


class UserLogin(BaseModel):
    """Schema for user login request."""
    
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class TokenResponse(BaseModel):
    """Schema for token response."""
    
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")


class TokenRefresh(BaseModel):
    """Schema for token refresh request."""
    
    refresh_token: str = Field(..., description="JWT refresh token")


class UserProfile(BaseModel):
    """Schema for user profile response."""
    
    id: str = Field(..., description="User ID")
    email: str = Field(..., description="User email address")
    first_name: str = Field(..., description="User first name")
    last_name: str = Field(..., description="User last name")
    phone_number: Optional[str] = Field(None, description="User phone number")
    emergency_contact: Optional[str] = Field(None, description="Emergency contact information")
    preferred_vet_clinic: Optional[str] = Field(None, description="Preferred veterinary clinic")
    is_active: bool = Field(..., description="User account status")
    email_verified: bool = Field(..., description="Email verification status")
    created_at: str = Field(..., description="Account creation timestamp")
    
    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    """Schema for user profile update request."""
    
    first_name: Optional[str] = Field(None, min_length=1, max_length=100, description="User first name")
    last_name: Optional[str] = Field(None, min_length=1, max_length=100, description="User last name")
    phone_number: Optional[str] = Field(None, max_length=20, description="User phone number")
    emergency_contact: Optional[str] = Field(None, max_length=255, description="Emergency contact information")
    preferred_vet_clinic: Optional[str] = Field(None, max_length=255, description="Preferred veterinary clinic")
    
    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v):
        """Validate phone number format."""
        if v is None:
            return v
        
        # Remove all non-digit characters for validation
        digits_only = re.sub(r'\D', '', v)
        
        # Check if it's a valid length (10-15 digits)
        if len(digits_only) < 10 or len(digits_only) > 15:
            raise ValueError('Phone number must be between 10 and 15 digits')
        
        return v


class SessionStatus(BaseModel):
    """Schema for session status response."""
    
    user_id: str = Field(..., description="Current user ID")
    email: str = Field(..., description="Current user email")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    should_refresh: bool = Field(..., description="Whether token should be refreshed soon")
    session_active: bool = Field(..., description="Whether session is active")


class ErrorResponse(BaseModel):
    """Schema for error responses."""
    
    detail: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Error code for client handling")