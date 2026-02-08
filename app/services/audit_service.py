"""
Audit logging service for tracking data access and modifications.
Implements comprehensive audit trail for compliance and security.
"""

import uuid
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Column, DateTime, String, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import select
import logging

from app.database.models import Base, BaseModel


logger = logging.getLogger(__name__)


class AuditLog(BaseModel):
    """Audit log model for tracking data access and modifications."""
    
    __tablename__ = "audit_logs"
    
    # User and action information
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)  # Nullable for system actions
    user_email = Column(String(255), nullable=True)
    
    # Action details
    action_type = Column(String(50), nullable=False, index=True)  # create, read, update, delete, export, login, logout
    resource_type = Column(String(50), nullable=False, index=True)  # user, pet, medication, health_record, etc.
    resource_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    
    # Request information
    endpoint = Column(String(255), nullable=True)
    http_method = Column(String(10), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    
    # Change tracking
    changes = Column(Text, nullable=True)  # JSON string of changes
    previous_values = Column(Text, nullable=True)  # JSON string of previous values
    
    # Status and metadata
    status = Column(String(20), nullable=False)  # success, failure, error
    error_message = Column(Text, nullable=True)
    
    # Performance tracking
    execution_time_ms = Column(Integer, nullable=True)


class AuditService:
    """Service for audit logging operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def log_action(
        self,
        action_type: str,
        resource_type: str,
        status: str = "success",
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        resource_id: Optional[str] = None,
        endpoint: Optional[str] = None,
        http_method: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        changes: Optional[Dict[str, Any]] = None,
        previous_values: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
        execution_time_ms: Optional[int] = None
    ) -> AuditLog:
        """
        Log an audit event.
        
        Args:
            action_type: Type of action (create, read, update, delete, export, login, logout)
            resource_type: Type of resource affected
            status: Status of the action (success, failure, error)
            user_id: ID of user performing action
            user_email: Email of user performing action
            resource_id: ID of resource affected
            endpoint: API endpoint accessed
            http_method: HTTP method used
            ip_address: IP address of request
            user_agent: User agent string
            changes: Dictionary of changes made
            previous_values: Dictionary of previous values
            error_message: Error message if action failed
            execution_time_ms: Execution time in milliseconds
            
        Returns:
            Created audit log entry
        """
        # Convert UUIDs to strings
        user_uuid = None
        if user_id:
            try:
                user_uuid = uuid.UUID(user_id)
            except (ValueError, TypeError):
                pass
        
        resource_uuid = None
        if resource_id:
            try:
                resource_uuid = uuid.UUID(resource_id)
            except (ValueError, TypeError):
                pass
        
        # Create audit log entry
        audit_log = AuditLog(
            user_id=user_uuid,
            user_email=user_email,
            action_type=action_type,
            resource_type=resource_type,
            resource_id=resource_uuid,
            endpoint=endpoint,
            http_method=http_method,
            ip_address=ip_address,
            user_agent=user_agent,
            changes=json.dumps(changes) if changes else None,
            previous_values=json.dumps(previous_values) if previous_values else None,
            status=status,
            error_message=error_message,
            execution_time_ms=execution_time_ms
        )
        
        self.db.add(audit_log)
        await self.db.commit()
        
        logger.info(
            f"Audit log created: {action_type} {resource_type} by user {user_email or 'system'} - {status}"
        )
        
        return audit_log
    
    async def get_user_audit_logs(
        self,
        user_id: str,
        limit: int = 100,
        action_type: Optional[str] = None
    ) -> List[AuditLog]:
        """
        Get audit logs for a specific user.
        
        Args:
            user_id: User ID to get logs for
            limit: Maximum number of logs to return
            action_type: Optional filter by action type
            
        Returns:
            List of audit log entries
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except (ValueError, TypeError):
            return []
        
        query = select(AuditLog).where(AuditLog.user_id == user_uuid)
        
        if action_type:
            query = query.where(AuditLog.action_type == action_type)
        
        query = query.order_by(AuditLog.created_at.desc()).limit(limit)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_resource_audit_logs(
        self,
        resource_type: str,
        resource_id: str,
        limit: int = 100
    ) -> List[AuditLog]:
        """
        Get audit logs for a specific resource.
        
        Args:
            resource_type: Type of resource
            resource_id: Resource ID to get logs for
            limit: Maximum number of logs to return
            
        Returns:
            List of audit log entries
        """
        try:
            resource_uuid = uuid.UUID(resource_id)
        except (ValueError, TypeError):
            return []
        
        query = (
            select(AuditLog)
            .where(AuditLog.resource_type == resource_type)
            .where(AuditLog.resource_id == resource_uuid)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_failed_actions(
        self,
        limit: int = 100,
        resource_type: Optional[str] = None
    ) -> List[AuditLog]:
        """
        Get failed audit log entries.
        
        Args:
            limit: Maximum number of logs to return
            resource_type: Optional filter by resource type
            
        Returns:
            List of failed audit log entries
        """
        query = select(AuditLog).where(AuditLog.status.in_(["failure", "error"]))
        
        if resource_type:
            query = query.where(AuditLog.resource_type == resource_type)
        
        query = query.order_by(AuditLog.created_at.desc()).limit(limit)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())


# Decorator for automatic audit logging
def audit_action(action_type: str, resource_type: str):
    """
    Decorator for automatic audit logging of service methods.
    
    Usage:
        @audit_action("create", "pet")
        async def create_pet(self, ...):
            ...
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            start_time = datetime.utcnow()
            status = "success"
            error_msg = None
            
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status = "error"
                error_msg = str(e)
                raise
            finally:
                # Calculate execution time
                execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
                
                # Log audit event (simplified - in production, extract more context)
                logger.info(
                    f"Audit: {action_type} {resource_type} - {status} ({execution_time}ms)"
                )
        
        return wrapper
    return decorator
