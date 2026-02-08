"""
Compliance API endpoints for data export, deletion, and audit logging.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
import json

from app.database.connection import get_db_session
from app.services.compliance_service import ComplianceService
from app.services.audit_service import AuditService
from app.core.dependencies import get_current_active_user
from app.core.middleware import limiter, GENERAL_RATE_LIMIT, get_client_ip
from app.database.models import User


# Create router for compliance endpoints
router = APIRouter(prefix="/compliance", tags=["Compliance"])


@router.get(
    "/export",
    summary="Export user data",
    description="Export all user data in JSON format (GDPR compliance)",
    responses={
        200: {"description": "Data exported successfully"},
        401: {"description": "Authentication required"},
        404: {"description": "User not found"},
        429: {"description": "Rate limit exceeded"}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def export_user_data(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> Dict[str, Any]:
    """
    Export all user data.
    
    Implements GDPR right to data portability by exporting all user data
    in a structured JSON format.
    
    **Requirements validated:**
    - 11.5: User data export functionality
    """
    compliance_service = ComplianceService(db)
    audit_service = AuditService(db)
    
    # Log audit event
    client_ip = get_client_ip(request)
    await audit_service.log_action(
        action_type="export",
        resource_type="user",
        user_id=str(current_user.id),
        user_email=current_user.email,
        resource_id=str(current_user.id),
        endpoint=str(request.url.path),
        http_method=request.method,
        ip_address=client_ip,
        user_agent=request.headers.get("User-Agent")
    )
    
    return await compliance_service.export_user_data(str(current_user.id))


@router.post(
    "/delete",
    summary="Delete user account",
    description="Delete user account and all associated data",
    responses={
        200: {"description": "Account deleted successfully"},
        401: {"description": "Authentication required"},
        404: {"description": "User not found"},
        429: {"description": "Rate limit exceeded"}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def delete_user_account(
    request: Request,
    permanent: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> Dict[str, str]:
    """
    Delete user account.
    
    Implements GDPR right to erasure (right to be forgotten).
    By default performs soft delete (deactivation). Set permanent=True
    for permanent deletion.
    
    **Requirements validated:**
    - 11.5: Secure data deletion capabilities
    """
    compliance_service = ComplianceService(db)
    audit_service = AuditService(db)
    
    # Log audit event before deletion
    client_ip = get_client_ip(request)
    await audit_service.log_action(
        action_type="delete",
        resource_type="user",
        user_id=str(current_user.id),
        user_email=current_user.email,
        resource_id=str(current_user.id),
        endpoint=str(request.url.path),
        http_method=request.method,
        ip_address=client_ip,
        user_agent=request.headers.get("User-Agent"),
        changes={"permanent": permanent}
    )
    
    return await compliance_service.delete_user_data(str(current_user.id), permanent=permanent)


@router.post(
    "/anonymize",
    summary="Anonymize user data",
    description="Anonymize user data while preserving statistical information",
    responses={
        200: {"description": "Data anonymized successfully"},
        401: {"description": "Authentication required"},
        404: {"description": "User not found"},
        429: {"description": "Rate limit exceeded"}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def anonymize_user_data(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> Dict[str, str]:
    """
    Anonymize user data.
    
    Anonymizes personal information while preserving statistical data
    for research and analytics purposes.
    
    **Requirements validated:**
    - 11.5: Data protection and privacy features
    """
    compliance_service = ComplianceService(db)
    audit_service = AuditService(db)
    
    # Log audit event
    client_ip = get_client_ip(request)
    await audit_service.log_action(
        action_type="anonymize",
        resource_type="user",
        user_id=str(current_user.id),
        user_email=current_user.email,
        resource_id=str(current_user.id),
        endpoint=str(request.url.path),
        http_method=request.method,
        ip_address=client_ip,
        user_agent=request.headers.get("User-Agent")
    )
    
    return await compliance_service.anonymize_user_data(str(current_user.id))


@router.get(
    "/audit-logs",
    summary="Get user audit logs",
    description="Retrieve audit logs for current user",
    responses={
        200: {"description": "Audit logs retrieved successfully"},
        401: {"description": "Authentication required"},
        429: {"description": "Rate limit exceeded"}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def get_user_audit_logs(
    request: Request,
    limit: int = 100,
    action_type: str = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get audit logs for current user.
    
    Returns audit trail of all actions performed by or on behalf of the user.
    
    **Requirements validated:**
    - 11.5: Audit logging for data access and modifications
    """
    audit_service = AuditService(db)
    
    logs = await audit_service.get_user_audit_logs(
        str(current_user.id),
        limit=limit,
        action_type=action_type
    )
    
    return {
        "user_id": str(current_user.id),
        "total_logs": len(logs),
        "logs": [
            {
                "id": str(log.id),
                "action_type": log.action_type,
                "resource_type": log.resource_type,
                "resource_id": str(log.resource_id) if log.resource_id else None,
                "endpoint": log.endpoint,
                "http_method": log.http_method,
                "ip_address": log.ip_address,
                "status": log.status,
                "error_message": log.error_message,
                "created_at": log.created_at.isoformat(),
                "execution_time_ms": log.execution_time_ms
            }
            for log in logs
        ]
    }


@router.get(
    "/download-data",
    summary="Download user data as JSON file",
    description="Download all user data as a JSON file",
    responses={
        200: {"description": "Data file downloaded successfully"},
        401: {"description": "Authentication required"},
        404: {"description": "User not found"},
        429: {"description": "Rate limit exceeded"}
    }
)
@limiter.limit(GENERAL_RATE_LIMIT)
async def download_user_data(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Download user data as JSON file.
    
    Provides downloadable JSON file containing all user data for
    offline storage or transfer to another service.
    
    **Requirements validated:**
    - 11.5: User data export functionality
    """
    compliance_service = ComplianceService(db)
    audit_service = AuditService(db)
    
    # Log audit event
    client_ip = get_client_ip(request)
    await audit_service.log_action(
        action_type="download",
        resource_type="user",
        user_id=str(current_user.id),
        user_email=current_user.email,
        resource_id=str(current_user.id),
        endpoint=str(request.url.path),
        http_method=request.method,
        ip_address=client_ip,
        user_agent=request.headers.get("User-Agent")
    )
    
    # Export data
    data = await compliance_service.export_user_data(str(current_user.id))
    
    # Return as downloadable JSON file
    json_content = json.dumps(data, indent=2)
    filename = f"pawpal_data_export_{current_user.id}_{data['export_date']}.json"
    
    return Response(
        content=json_content,
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
