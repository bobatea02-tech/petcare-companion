"""
Authentication service with business logic for user management.
"""

import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.database.models import User, NotificationPreference
from app.core.security import verify_password, get_password_hash, create_token_pair, verify_token
from app.schemas.auth import UserRegistration, UserLogin, TokenResponse, UserProfileUpdate
from app.core.middleware import create_session, reset_failed_login


class AuthService:
    """Service class for authentication operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def register_user(self, user_data: UserRegistration) -> TokenResponse:
        """Register a new user and return authentication tokens."""
        
        # Check if user already exists
        result = await self.db.execute(select(User).where(User.email == user_data.email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists",
                headers={"error_code": "EMAIL_ALREADY_EXISTS"}
            )
        
        # Hash password
        password_hash = get_password_hash(user_data.password)
        
        # Create new user
        new_user = User(
            email=user_data.email,
            password_hash=password_hash,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone_number=user_data.phone_number,
            emergency_contact=user_data.emergency_contact,
            preferred_vet_clinic=user_data.preferred_vet_clinic,
            is_active=True,
            email_verified=False  # Will be verified later via email
        )
        
        self.db.add(new_user)
        await self.db.flush()  # Get the user ID
        
        # Create default notification preferences
        notification_prefs = NotificationPreference(
            user_id=new_user.id,
            medication_reminders=True,
            feeding_reminders=True,
            appointment_reminders=True,
            emergency_alerts=True,
            weekly_reports=True,
            email_notifications=True,
            sms_notifications=False,
            push_notifications=True,
            reminder_advance_minutes=15
        )
        
        self.db.add(notification_prefs)
        await self.db.commit()
        
        # Create authentication tokens
        tokens = create_token_pair(str(new_user.id), new_user.email)
        
        # Create session
        create_session(str(new_user.id), tokens["access_token"])
        
        return TokenResponse(**tokens)
    
    async def authenticate_user(self, login_data: UserLogin) -> TokenResponse:
        """Authenticate user and return tokens."""
        
        # Get user by email
        result = await self.db.execute(select(User).where(User.email == login_data.email))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"error_code": "INVALID_CREDENTIALS"}
            )
        
        # Verify password
        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"error_code": "INVALID_CREDENTIALS"}
            )
        
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive",
                headers={"error_code": "ACCOUNT_INACTIVE"}
            )
        
        # Create authentication tokens
        tokens = create_token_pair(str(user.id), user.email)
        
        # Create session and reset failed login attempts
        create_session(str(user.id), tokens["access_token"])
        
        return TokenResponse(**tokens)
    
    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        """Refresh access token using refresh token."""
        
        # Verify refresh token
        token_payload = verify_token(refresh_token, token_type="refresh")
        if not token_payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
                headers={"error_code": "INVALID_REFRESH_TOKEN"}
            )
        
        # Get user from database
        user_id = token_payload.get("sub")
        email = token_payload.get("email")
        
        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"error_code": "INVALID_TOKEN_PAYLOAD"}
            )
        
        # Verify user still exists and is active
        try:
            user_uuid = uuid.UUID(user_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user ID format",
                headers={"error_code": "INVALID_USER_ID"}
            )
        
        result = await self.db.execute(select(User).where(User.id == user_uuid))
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
                headers={"error_code": "USER_NOT_FOUND"}
            )
        
        # Create new token pair
        tokens = create_token_pair(str(user.id), user.email)
        
        # Create new session
        create_session(str(user.id), tokens["access_token"])
        
        return TokenResponse(**tokens)
    
    async def get_user_profile(self, user_id: str) -> User:
        """Get user profile by ID."""
        
        try:
            user_uuid = uuid.UUID(user_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format",
                headers={"error_code": "INVALID_USER_ID"}
            )
        
        result = await self.db.execute(select(User).where(User.id == user_uuid))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
                headers={"error_code": "USER_NOT_FOUND"}
            )
        
        return user
    
    async def update_user_profile(self, user_id: str, update_data: UserProfileUpdate) -> User:
        """Update user profile information."""
        
        try:
            user_uuid = uuid.UUID(user_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format",
                headers={"error_code": "INVALID_USER_ID"}
            )
        
        # Get user
        result = await self.db.execute(select(User).where(User.id == user_uuid))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
                headers={"error_code": "USER_NOT_FOUND"}
            )
        
        # Update fields that are provided
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(user, field, value)
        
        await self.db.commit()
        await self.db.refresh(user)
        
        return user