"""
Authentication API endpoints for user registration, login, and profile management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db_session
from app.services.auth_service import AuthService
from app.schemas.auth import (
    UserRegistration, 
    UserLogin, 
    TokenResponse, 
    TokenRefresh, 
    UserProfile, 
    UserProfileUpdate,
    ErrorResponse,
    SessionStatus
)
from app.core.dependencies import get_current_active_user
from app.core.middleware import (
    limiter, 
    record_failed_login, 
    reset_failed_login, 
    get_client_ip,
    invalidate_session,
    LOGIN_RATE_LIMIT,
    GENERAL_RATE_LIMIT,
    SessionManager
)
from app.core.security import verify_token
from app.database.models import User


# Create router for authentication endpoints
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Create a new user account with email validation and return authentication tokens",
    responses={
        201: {"description": "User registered successfully", "model": TokenResponse},
        400: {"description": "Registration failed - email already exists or validation error", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def register_user(
    request: Request,
    user_data: UserRegistration,
    db: AsyncSession = Depends(get_db_session)
) -> TokenResponse:
    """
    Register a new user account.
    
    Creates a new user with the provided information, validates email uniqueness,
    hashes the password securely, and returns JWT authentication tokens.
    
    **Requirements validated:**
    - 1.1: User profile creation with email, password, and basic information
    - 1.2: Secure password hashing and token generation
    """
    auth_service = AuthService(db)
    return await auth_service.register_user(user_data)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login",
    description="Authenticate user with email and password, return JWT tokens",
    responses={
        200: {"description": "Login successful", "model": TokenResponse},
        401: {"description": "Invalid credentials or inactive account", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded or IP locked out", "model": ErrorResponse}
    }
)
@limiter.limit(LOGIN_RATE_LIMIT)
async def login_user(
    request: Request,
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db_session)
) -> TokenResponse:
    """
    Authenticate user and return access tokens.
    
    Validates user credentials, checks account status, and returns
    JWT access and refresh tokens for authenticated sessions.
    Implements rate limiting and IP lockout for security.
    
    **Requirements validated:**
    - 1.2: User authentication with valid credentials
    - 1.5: Proper error handling for invalid credentials
    - 11.3: Rate limiting for login attempts
    """
    client_ip = get_client_ip(request)
    auth_service = AuthService(db)
    
    try:
        tokens = await auth_service.authenticate_user(login_data)
        # Reset failed attempts on successful login
        reset_failed_login(client_ip)
        return tokens
    except HTTPException as e:
        # Record failed login attempt for rate limiting
        if e.status_code == status.HTTP_401_UNAUTHORIZED:
            record_failed_login(client_ip)
        raise e


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Generate new access token using refresh token",
    responses={
        200: {"description": "Token refreshed successfully", "model": TokenResponse},
        401: {"description": "Invalid or expired refresh token", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def refresh_access_token(
    request: Request,
    token_data: TokenRefresh,
    db: AsyncSession = Depends(get_db_session)
) -> TokenResponse:
    """
    Refresh access token using refresh token.
    
    Validates the refresh token and generates a new access token pair
    for continued authenticated access.
    
    **Requirements validated:**
    - 11.3: Session management with token refresh
    - 1.5: Secure token handling
    """
    auth_service = AuthService(db)
    return await auth_service.refresh_token(token_data.refresh_token)


@router.get(
    "/profile",
    response_model=UserProfile,
    summary="Get user profile",
    description="Retrieve current user's profile information",
    responses={
        200: {"description": "Profile retrieved successfully", "model": UserProfile},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "User not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_user_profile(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> UserProfile:
    """
    Get current user's profile information.
    
    Returns the authenticated user's profile data including contact information
    and account settings.
    
    **Requirements validated:**
    - 1.1: User profile retrieval
    - 1.5: Authenticated access to user data
    """
    auth_service = AuthService(db)
    user = await auth_service.get_user_profile(str(current_user.id))
    
    return UserProfile(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone_number=user.phone_number,
        emergency_contact=user.emergency_contact,
        preferred_vet_clinic=user.preferred_vet_clinic,
        is_active=user.is_active,
        email_verified=user.email_verified,
        created_at=user.created_at.isoformat()
    )


@router.put(
    "/profile",
    response_model=UserProfile,
    summary="Update user profile",
    description="Update current user's profile information",
    responses={
        200: {"description": "Profile updated successfully", "model": UserProfile},
        401: {"description": "Authentication required", "model": ErrorResponse},
        404: {"description": "User not found", "model": ErrorResponse},
        422: {"description": "Validation error in request data", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def update_user_profile(
    request: Request,
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> UserProfile:
    """
    Update current user's profile information.
    
    Updates the authenticated user's profile with provided data.
    Only provided fields will be updated.
    
    **Requirements validated:**
    - 1.3: User vet contact information updates
    - 1.4: User notification preference modifications
    """
    auth_service = AuthService(db)
    updated_user = await auth_service.update_user_profile(str(current_user.id), profile_data)
    
    return UserProfile(
        id=str(updated_user.id),
        email=updated_user.email,
        first_name=updated_user.first_name,
        last_name=updated_user.last_name,
        phone_number=updated_user.phone_number,
        emergency_contact=updated_user.emergency_contact,
        preferred_vet_clinic=updated_user.preferred_vet_clinic,
        is_active=updated_user.is_active,
        email_verified=updated_user.email_verified,
        created_at=updated_user.created_at.isoformat()
    )


@router.get(
    "/session",
    response_model=SessionStatus,
    summary="Get session status",
    description="Get current session information and token status",
    responses={
        200: {"description": "Session status retrieved successfully", "model": SessionStatus},
        401: {"description": "Authentication required", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_session_status(
    request: Request,
    current_user: User = Depends(get_current_active_user)
) -> SessionStatus:
    """
    Get current session status and token information.
    
    Returns information about the current session including token expiration
    and whether the token should be refreshed soon.
    
    **Requirements validated:**
    - 11.3: Session management with timeout information
    - 1.5: Secure session status reporting
    """
    # Get token from request
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    
    token = auth_header.split(" ")[1]
    token_payload = verify_token(token, token_type="access")
    
    if not token_payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    expires_in = SessionManager.get_token_remaining_time(token_payload)
    should_refresh = SessionManager.should_refresh_token(token_payload)
    
    return SessionStatus(
        user_id=str(current_user.id),
        email=current_user.email,
        expires_in=expires_in,
        should_refresh=should_refresh,
        session_active=True
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="User logout",
    description="Logout user and invalidate current session",
    responses={
        200: {"description": "Logout successful"},
        401: {"description": "Authentication required", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def logout_user(
    request: Request,
    current_user: User = Depends(get_current_active_user)
):
    """
    Logout user and invalidate session.
    
    Invalidates the current session token, requiring the user to
    login again for future requests.
    
    **Requirements validated:**
    - 11.3: Secure session management with logout capability
    - 1.5: Proper session termination
    """
    # Get token from request
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        invalidate_session(token)
    
    return {"message": "Logout successful", "status": "ok"}