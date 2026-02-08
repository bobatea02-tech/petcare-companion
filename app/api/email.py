"""
Email API endpoints for health reports and notifications.
"""

import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel, Field, EmailStr

from app.services.email_service import email_service, EmailMessage, EmailAttachment, EmailServiceError
from app.core.dependencies import get_current_user
from app.database.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/email", tags=["email"])


class EmailRequest(BaseModel):
    """Request model for sending email."""
    to_email: EmailStr = Field(..., description="Recipient email address")
    subject: str = Field(..., min_length=1, max_length=200, description="Email subject")
    html_content: str = Field(..., min_length=1, description="HTML email content")
    plain_content: Optional[str] = Field(None, description="Plain text email content")
    from_name: Optional[str] = Field(None, description="Sender name")


class TemplateEmailRequest(BaseModel):
    """Request model for sending template email."""
    to_email: EmailStr = Field(..., description="Recipient email address")
    template_id: str = Field(..., description="SendGrid template ID")
    dynamic_template_data: Dict[str, Any] = Field(..., description="Template data")
    from_name: Optional[str] = Field(None, description="Sender name")


class BulkEmailRequest(BaseModel):
    """Request model for sending bulk emails."""
    emails: List[EmailRequest] = Field(..., description="List of emails to send")


class HealthReportRequest(BaseModel):
    """Request model for sending health report."""
    to_email: EmailStr = Field(..., description="Recipient email address")
    user_name: str = Field(..., description="User's name for personalization")
    report_data: Dict[str, Any] = Field(..., description="Health report data")


class EmailResponse(BaseModel):
    """Response model for email operations."""
    success: bool
    message_id: Optional[str] = None
    to_email: Optional[str] = None
    error: Optional[str] = None
    status_code: Optional[int] = None


class BulkEmailResponse(BaseModel):
    """Response model for bulk email operations."""
    total_emails: int
    successful_sends: int
    failed_sends: int
    results: List[EmailResponse]


@router.post("/send", response_model=EmailResponse)
async def send_email(
    email_request: EmailRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send email message to a recipient.
    
    This endpoint sends emails using SendGrid API with
    support for HTML and plain text content.
    """
    try:
        result = await email_service.send_email(
            to_email=email_request.to_email,
            subject=email_request.subject,
            html_content=email_request.html_content,
            plain_content=email_request.plain_content,
            from_name=email_request.from_name
        )
        
        return EmailResponse(
            success=result.success,
            message_id=result.message_id,
            to_email=result.to_email,
            error=result.error,
            status_code=result.status_code
        )
        
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email")


@router.post("/send-template", response_model=EmailResponse)
async def send_template_email(
    template_request: TemplateEmailRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send email using SendGrid dynamic template.
    
    This endpoint sends emails using pre-configured SendGrid
    templates with dynamic data substitution.
    """
    try:
        result = await email_service.send_template_email(
            to_email=template_request.to_email,
            template_id=template_request.template_id,
            dynamic_template_data=template_request.dynamic_template_data,
            from_name=template_request.from_name
        )
        
        return EmailResponse(
            success=result.success,
            message_id=result.message_id,
            to_email=result.to_email,
            error=result.error,
            status_code=result.status_code
        )
        
    except Exception as e:
        logger.error(f"Error sending template email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send template email")


@router.post("/send-bulk", response_model=BulkEmailResponse)
async def send_bulk_emails(
    bulk_request: BulkEmailRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send multiple emails in batch.
    
    This endpoint allows sending multiple emails concurrently
    with rate limiting to prevent API abuse.
    """
    try:
        # Convert requests to EmailMessage objects
        email_messages = [
            EmailMessage(
                to_email=req.to_email,
                subject=req.subject,
                html_content=req.html_content,
                plain_content=req.plain_content,
                from_name=req.from_name
            )
            for req in bulk_request.emails
        ]
        
        results = await email_service.send_bulk_emails(email_messages)
        
        # Convert results to response format
        email_responses = [
            EmailResponse(
                success=result.success,
                message_id=result.message_id,
                to_email=result.to_email,
                error=result.error,
                status_code=result.status_code
            )
            for result in results
        ]
        
        successful_sends = sum(1 for result in results if result.success)
        failed_sends = len(results) - successful_sends
        
        return BulkEmailResponse(
            total_emails=len(results),
            successful_sends=successful_sends,
            failed_sends=failed_sends,
            results=email_responses
        )
        
    except Exception as e:
        logger.error(f"Error sending bulk emails: {e}")
        raise HTTPException(status_code=500, detail="Failed to send bulk emails")


@router.post("/health-report", response_model=EmailResponse)
async def send_health_report(
    report_request: HealthReportRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send weekly health report email.
    
    This endpoint sends a formatted weekly health report
    with AI insights and pet care summaries.
    """
    try:
        result = await email_service.send_weekly_health_report(
            to_email=report_request.to_email,
            user_name=report_request.user_name,
            report_data=report_request.report_data
        )
        
        return EmailResponse(
            success=result.success,
            message_id=result.message_id,
            to_email=result.to_email,
            error=result.error,
            status_code=result.status_code
        )
        
    except Exception as e:
        logger.error(f"Error sending health report: {e}")
        raise HTTPException(status_code=500, detail="Failed to send health report")


@router.post("/send-with-attachment", response_model=EmailResponse)
async def send_email_with_attachment(
    to_email: EmailStr,
    subject: str,
    html_content: str,
    attachment: UploadFile = File(...),
    plain_content: Optional[str] = None,
    from_name: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Send email with file attachment.
    
    This endpoint sends emails with file attachments
    using multipart form data upload.
    """
    try:
        # Read attachment content
        attachment_content = await attachment.read()
        
        # Create EmailAttachment object
        email_attachment = EmailAttachment(
            content=attachment_content,
            filename=attachment.filename or "attachment",
            file_type=attachment.content_type or "application/octet-stream"
        )
        
        result = await email_service.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            plain_content=plain_content,
            from_name=from_name,
            attachments=[email_attachment]
        )
        
        return EmailResponse(
            success=result.success,
            message_id=result.message_id,
            to_email=result.to_email,
            error=result.error,
            status_code=result.status_code
        )
        
    except Exception as e:
        logger.error(f"Error sending email with attachment: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email with attachment")


@router.get("/health")
async def email_health_check():
    """
    Check the health status of the email service.
    
    Returns information about SendGrid API availability
    and service configuration status.
    """
    return await email_service.health_check()