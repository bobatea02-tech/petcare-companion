"""
Security utilities for authentication and password handling.
"""

import time
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from fastapi import HTTPException, status

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash using bcrypt directly."""
    try:
        # Convert to bytes
        password_bytes = plain_password.encode('utf-8')
        hash_bytes = hashed_password.encode('utf-8') if isinstance(hashed_password, str) else hashed_password
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Generate password hash with bcrypt directly (Python 3.13 compatible)."""
    # Convert to bytes and hash
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    now = datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Add timestamp to ensure uniqueness
    to_encode.update({
        "exp": expire, 
        "type": "access",
        "iat": now.timestamp()
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT refresh token."""
    to_encode = data.copy()
    now = datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Add timestamp to ensure uniqueness
    to_encode.update({
        "exp": expire, 
        "type": "refresh",
        "iat": now.timestamp()
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """Verify JWT token and return payload."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        
        # Check token type
        if payload.get("type") != token_type:
            return None
            
        # Check expiration
        exp = payload.get("exp")
        if exp is None or datetime.utcnow() > datetime.fromtimestamp(exp):
            return None
            
        return payload
    except JWTError:
        return None


def create_token_pair(user_id: str, email: str) -> dict:
    """Create both access and refresh tokens for a user."""
    user_data = {"sub": user_id, "email": email}
    
    access_token = create_access_token(user_data)
    
    # Add a small delay to ensure different timestamps for refresh token
    time.sleep(0.001)
    refresh_token = create_refresh_token(user_data)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }