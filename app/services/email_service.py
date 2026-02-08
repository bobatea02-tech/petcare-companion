"""
SendGrid email service for health reports and notifications.

This service handles email notifications using SendGrid API for weekly health reports,
appointment confirmations, and other email communications.
"""

import asyncio
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import base64
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content, Attachment, FileContent, FileName, FileType, Disposition
from python_http_client.exceptions import HTTPError
import json

from app.core.config import settings
from app.core.circuit_breaker import with_circuit_breaker, CircuitBreakerError
from app.core.error_monitoring import log_error, ErrorCategory, ErrorSeverity
from app.core.graceful_degradation import (
    set_service_degraded,
    set_service_unavailable,
    set_service_available
)

logger = logging.getLogger(__name__)


class EmailServiceError(Exception):
    """Custom exception for Email service errors."""
    pass


class EmailAttachment:
    """Data class for email attachments."""
    
    def __init__(
        self,
        content: bytes,
        filename: str,
        file_type: str,
        disposition: str = "attachment"
    ):
        self.content = content
        self.filename = filename
        self.file_type = file_type
        self.disposition = disposition
    
    def to_sendgrid_attachment(self) -> Attachment:
        """Convert to SendGrid attachment format."""
        encoded_content = base64.b64encode(self.content).decode()
        
        attachment = Attachment()
        attachment.file_content = FileContent(encoded_content)
        attachment.file_name = FileName(self.filename)
        attachment.file_type = FileType(self.file_type)
        attachment.disposition = Disposition(self.disposition)
        
        return attachment


class EmailMessage:
    """Data class for email message information."""
    
    def __init__(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        attachments: Optional[List[EmailAttachment]] = None,
        template_id: Optional[str] = None,
        dynamic_template_data: Optional[Dict[str, Any]] = None
    ):
        self.to_email = to_email
        self.subject = subject
        self.html_content = html_content
        self.plain_content = plain_content or self._html_to_plain(html_content)
        self.from_email = from_email or settings.SENDGRID_FROM_EMAIL
        self.from_name = from_name or "PawPal Pet Care Assistant"
        self.attachments = attachments or []
        self.template_id = template_id
        self.dynamic_template_data = dynamic_template_data or {}
        self.created_at = datetime.now(timezone.utc)
    
    def _html_to_plain(self, html_content: str) -> str:
        """Convert HTML content to plain text (simple implementation)."""
        import re
        # Remove HTML tags
        plain = re.sub(r'<[^>]+>', '', html_content)
        # Replace HTML entities
        plain = plain.replace('&nbsp;', ' ')
        plain = plain.replace('&amp;', '&')
        plain = plain.replace('&lt;', '<')
        plain = plain.replace('&gt;', '>')
        # Clean up whitespace
        plain = re.sub(r'\s+', ' ', plain).strip()
        return plain
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        return {
            "to_email": self.to_email,
            "subject": self.subject,
            "html_content": self.html_content,
            "plain_content": self.plain_content,
            "from_email": self.from_email,
            "from_name": self.from_name,
            "attachments_count": len(self.attachments),
            "template_id": self.template_id,
            "created_at": self.created_at.isoformat()
        }


class EmailResult:
    """Result object for email sending operations."""
    
    def __init__(
        self,
        success: bool,
        message_id: Optional[str] = None,
        to_email: Optional[str] = None,
        error: Optional[str] = None,
        status_code: Optional[int] = None
    ):
        self.success = success
        self.message_id = message_id
        self.to_email = to_email
        self.error = error
        self.status_code = status_code
        self.timestamp = datetime.now(timezone.utc)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        return {
            "success": self.success,
            "message_id": self.message_id,
            "to_email": self.to_email,
            "error": self.error,
            "status_code": self.status_code,
            "timestamp": self.timestamp.isoformat()
        }


class EmailService:
    """Service for sending emails via SendGrid API."""
    
    def __init__(self):
        """Initialize email service with SendGrid configuration."""
        self.api_key = settings.SENDGRID_API_KEY
        self.from_email = settings.SENDGRID_FROM_EMAIL
        self.client = None
        
        if self.api_key:
            try:
                self.client = SendGridAPIClient(api_key=self.api_key)
                logger.info("SendGrid email service initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize SendGrid client: {e}")
        else:
            logger.warning("SendGrid API key not configured - email service unavailable")
    
    def is_available(self) -> bool:
        """Check if email service is available."""
        return self.client is not None and self.from_email is not None
    
    @with_circuit_breaker(
        name="sendgrid_email",
        failure_threshold=5,
        timeout_seconds=60,
        half_open_max_calls=3,
        success_threshold=2
    )
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str] = None,
        from_name: Optional[str] = None,
        attachments: Optional[List[EmailAttachment]] = None
    ) -> EmailResult:
        """
        Send email message to a recipient.
        
        Args:
            to_email: Recipient email address
            subject: Email subject line
            html_content: HTML email content
            plain_content: Plain text email content (optional)
            from_name: Sender name (optional)
            attachments: List of email attachments (optional)
            
        Returns:
            EmailResult with sending status and details
        """
        if not self.is_available():
            await set_service_unavailable("sendgrid_email", "SendGrid not configured")
            return EmailResult(
                success=False,
                to_email=to_email,
                error="Email service not available - SendGrid not configured"
            )
        
        try:
            # Create email message
            email_message = EmailMessage(
                to_email=to_email,
                subject=subject,
                html_content=html_content,
                plain_content=plain_content,
                from_name=from_name,
                attachments=attachments or []
            )
            
            # Build SendGrid mail object
            mail = Mail(
                from_email=Email(self.from_email, email_message.from_name),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            # Add plain text content if provided
            if plain_content:
                mail.content = [
                    Content("text/plain", plain_content),
                    Content("text/html", html_content)
                ]
            
            # Add attachments if provided
            for attachment in email_message.attachments:
                mail.attachment = attachment.to_sendgrid_attachment()
            
            # Send email using SendGrid (run in thread pool to avoid blocking)
            response = await asyncio.to_thread(
                self.client.send,
                mail
            )
            
            # Extract message ID from response headers
            message_id = None
            if hasattr(response, 'headers') and 'X-Message-Id' in response.headers:
                message_id = response.headers['X-Message-Id']
            
            logger.info(f"Email sent successfully to {to_email}, status: {response.status_code}")
            
            # Mark service as available on success
            await set_service_available("sendgrid_email", "Email service operating normally")
            
            return EmailResult(
                success=True,
                message_id=message_id,
                to_email=to_email,
                status_code=response.status_code
            )
            
        except CircuitBreakerError as e:
            logger.error(f"SendGrid email circuit breaker open: {e}")
            await log_error(e, ErrorCategory.EXTERNAL_SERVICE_ERROR, ErrorSeverity.CRITICAL)
            await set_service_unavailable("sendgrid_email", "Circuit breaker open")
            return EmailResult(
                success=False,
                to_email=to_email,
                error="Email service temporarily unavailable - circuit breaker open"
            )
        except HTTPError as e:
            logger.error(f"SendGrid HTTP error sending email to {to_email}: {e}")
            await log_error(e, ErrorCategory.EXTERNAL_SERVICE_ERROR, ErrorSeverity.HIGH)
            await set_service_degraded(
                "sendgrid_email",
                unavailable_features=["email_delivery"],
                message=f"SendGrid HTTP error: {str(e)}"
            )
            return EmailResult(
                success=False,
                to_email=to_email,
                error=f"SendGrid HTTP error: {str(e)}",
                status_code=getattr(e, 'status_code', None)
            )
        except Exception as e:
            logger.error(f"Unexpected error sending email to {to_email}: {e}")
            await log_error(e, ErrorCategory.EXTERNAL_SERVICE_ERROR, ErrorSeverity.HIGH)
            return EmailResult(
                success=False,
                to_email=to_email,
                error=f"Unexpected error: {str(e)}"
            )
    
    async def send_template_email(
        self,
        to_email: str,
        template_id: str,
        dynamic_template_data: Dict[str, Any],
        from_name: Optional[str] = None
    ) -> EmailResult:
        """
        Send email using SendGrid dynamic template.
        
        Args:
            to_email: Recipient email address
            template_id: SendGrid template ID
            dynamic_template_data: Template data for personalization
            from_name: Sender name (optional)
            
        Returns:
            EmailResult with sending status and details
        """
        if not self.is_available():
            return EmailResult(
                success=False,
                to_email=to_email,
                error="Email service not available - SendGrid not configured"
            )
        
        try:
            # Build SendGrid mail object with template
            mail = Mail(
                from_email=Email(self.from_email, from_name or "PawPal Pet Care Assistant"),
                to_emails=To(to_email)
            )
            
            # Set template ID and dynamic data
            mail.template_id = template_id
            mail.dynamic_template_data = dynamic_template_data
            
            # Send email using SendGrid
            response = await asyncio.to_thread(
                self.client.send,
                mail
            )
            
            # Extract message ID from response headers
            message_id = None
            if hasattr(response, 'headers') and 'X-Message-Id' in response.headers:
                message_id = response.headers['X-Message-Id']
            
            logger.info(f"Template email sent successfully to {to_email}, template: {template_id}")
            
            return EmailResult(
                success=True,
                message_id=message_id,
                to_email=to_email,
                status_code=response.status_code
            )
            
        except HTTPError as e:
            logger.error(f"SendGrid HTTP error sending template email to {to_email}: {e}")
            return EmailResult(
                success=False,
                to_email=to_email,
                error=f"SendGrid HTTP error: {str(e)}",
                status_code=getattr(e, 'status_code', None)
            )
        except Exception as e:
            logger.error(f"Unexpected error sending template email to {to_email}: {e}")
            return EmailResult(
                success=False,
                to_email=to_email,
                error=f"Unexpected error: {str(e)}"
            )
    
    async def send_bulk_emails(
        self,
        emails: List[EmailMessage]
    ) -> List[EmailResult]:
        """
        Send multiple emails in batch.
        
        Args:
            emails: List of EmailMessage objects to send
            
        Returns:
            List of EmailResult objects with sending status for each email
        """
        if not self.is_available():
            return [
                EmailResult(
                    success=False,
                    to_email=email.to_email,
                    error="Email service not available - SendGrid not configured"
                )
                for email in emails
            ]
        
        results = []
        
        # Send emails concurrently but with rate limiting
        semaphore = asyncio.Semaphore(10)  # Limit to 10 concurrent sends
        
        async def send_single_email(email_message: EmailMessage) -> EmailResult:
            async with semaphore:
                return await self.send_email(
                    to_email=email_message.to_email,
                    subject=email_message.subject,
                    html_content=email_message.html_content,
                    plain_content=email_message.plain_content,
                    from_name=email_message.from_name,
                    attachments=email_message.attachments
                )
        
        # Create tasks for all emails
        tasks = [send_single_email(email) for email in emails]
        
        # Execute all tasks concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle any exceptions that occurred
        final_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error sending bulk email message {i}: {result}")
                final_results.append(EmailResult(
                    success=False,
                    to_email=emails[i].to_email,
                    error=str(result)
                ))
            else:
                final_results.append(result)
        
        return final_results
    
    async def send_weekly_health_report(
        self,
        to_email: str,
        user_name: str,
        report_data: Dict[str, Any]
    ) -> EmailResult:
        """
        Send weekly health report email with AI insights.
        
        Args:
            to_email: Recipient email address
            user_name: User's name for personalization
            report_data: Health report data
            
        Returns:
            EmailResult with sending status
        """
        try:
            # Generate HTML content for health report
            html_content = self._generate_health_report_html(user_name, report_data)
            
            # Generate subject line
            report_period = report_data.get('report_period', 'this week')
            subject = f"PawPal Weekly Health Report - {report_period}"
            
            return await self.send_email(
                to_email=to_email,
                subject=subject,
                html_content=html_content,
                from_name="PawPal Health Reports"
            )
            
        except Exception as e:
            logger.error(f"Error sending weekly health report to {to_email}: {e}")
            return EmailResult(
                success=False,
                to_email=to_email,
                error=f"Failed to generate health report: {str(e)}"
            )
    
    def _generate_health_report_html(
        self,
        user_name: str,
        report_data: Dict[str, Any]
    ) -> str:
        """
        Generate HTML content for weekly health report.
        
        Args:
            user_name: User's name for personalization
            report_data: Health report data
            
        Returns:
            HTML content string
        """
        pets_data = report_data.get('pets', [])
        report_period = report_data.get('report_period', 'this week')
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>PawPal Weekly Health Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 20px; }}
                .pet-section {{ background-color: white; margin: 20px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50; }}
                .pet-name {{ font-size: 18px; font-weight: bold; color: #4CAF50; margin-bottom: 10px; }}
                .metric {{ margin: 10px 0; }}
                .metric-label {{ font-weight: bold; }}
                .compliance-good {{ color: #4CAF50; }}
                .compliance-warning {{ color: #FF9800; }}
                .compliance-poor {{ color: #F44336; }}
                .footer {{ background-color: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }}
                .ai-insights {{ background-color: #E3F2FD; padding: 15px; border-radius: 8px; margin: 15px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🐾 PawPal Weekly Health Report</h1>
                    <p>Health summary for {report_period}</p>
                </div>
                
                <div class="content">
                    <h2>Hello {user_name}!</h2>
                    <p>Here's your weekly pet health summary with AI-powered insights and recommendations.</p>
        """
        
        # Add pet sections
        for pet in pets_data:
            pet_name = pet.get('name', 'Unknown Pet')
            species = pet.get('species', 'Pet')
            breed = pet.get('breed', '')
            
            # Medication compliance
            med_compliance = pet.get('medication_compliance', {})
            med_rate = med_compliance.get('compliance_rate', 0)
            med_class = self._get_compliance_class(med_rate)
            
            # Feeding compliance
            feeding_compliance = pet.get('feeding_compliance', {})
            feeding_rate = feeding_compliance.get('compliance_rate', 0)
            feeding_class = self._get_compliance_class(feeding_rate)
            
            # Health records
            health_records_count = pet.get('health_records_count', 0)
            ai_insights = pet.get('ai_insights', 'No specific insights this week.')
            
            html_content += f"""
                    <div class="pet-section">
                        <div class="pet-name">{pet_name} ({species}{' - ' + breed if breed else ''})</div>
                        
                        <div class="metric">
                            <span class="metric-label">Medication Compliance:</span>
                            <span class="{med_class}">{med_rate:.1f}%</span>
                            ({med_compliance.get('completed_doses', 0)}/{med_compliance.get('total_doses', 0)} doses)
                        </div>
                        
                        <div class="metric">
                            <span class="metric-label">Feeding Compliance:</span>
                            <span class="{feeding_class}">{feeding_rate:.1f}%</span>
                            ({feeding_compliance.get('completed_feedings', 0)}/{feeding_compliance.get('total_feedings', 0)} feedings)
                        </div>
                        
                        <div class="metric">
                            <span class="metric-label">Health Records:</span>
                            {health_records_count} new record{'s' if health_records_count != 1 else ''} this week
                        </div>
                        
                        <div class="ai-insights">
                            <strong>🤖 AI Insights:</strong><br>
                            {ai_insights}
                        </div>
                    </div>
            """
        
        html_content += f"""
                    <div class="ai-insights">
                        <h3>📊 Weekly Summary</h3>
                        <p>This report covers {len(pets_data)} pet{'s' if len(pets_data) != 1 else ''} for the period {report_period}.</p>
                        <p>Keep up the great work taking care of your furry family members! 🐾</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Generated by PawPal AI Pet Care Assistant</p>
                    <p>Questions? Reply to this email or contact support.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html_content
    
    def _get_compliance_class(self, rate: float) -> str:
        """Get CSS class for compliance rate."""
        if rate >= 90:
            return "compliance-good"
        elif rate >= 70:
            return "compliance-warning"
        else:
            return "compliance-poor"
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check the health status of the email service.
        
        Returns:
            Dictionary with service health information
        """
        if not self.is_available():
            return {
                "service": "email",
                "status": "unavailable",
                "sendgrid_configured": False,
                "error": "SendGrid credentials not configured"
            }
        
        try:
            # Test SendGrid connection by making a simple API call
            # Note: This is a placeholder - SendGrid doesn't have a simple health check endpoint
            # In production, you might want to send a test email to a known address
            
            return {
                "service": "email",
                "status": "healthy",
                "sendgrid_configured": True,
                "from_email": self.from_email,
                "api_key_configured": bool(self.api_key)
            }
            
        except Exception as e:
            logger.error(f"Email service health check failed: {e}")
            return {
                "service": "email",
                "status": "error",
                "sendgrid_configured": True,
                "error": str(e)
            }


# Global email service instance
email_service = EmailService()