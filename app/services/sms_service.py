"""
Twilio SMS service for urgent notifications and alerts.

This service handles SMS notifications using Twilio API for urgent alerts,
medication reminders, and emergency notifications.
"""

import asyncio
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from twilio.rest import Client
from twilio.base.exceptions import TwilioException
import phonenumbers
from phonenumbers import NumberParseException

from app.core.config import settings
from app.core.circuit_breaker import with_circuit_breaker, CircuitBreakerError
from app.core.error_monitoring import log_error, ErrorCategory, ErrorSeverity
from app.core.graceful_degradation import (
    set_service_degraded,
    set_service_unavailable,
    set_service_available
)

logger = logging.getLogger(__name__)


class SMSServiceError(Exception):
    """Custom exception for SMS service errors."""
    pass


class SMSMessage:
    """Data class for SMS message information."""
    
    def __init__(
        self,
        to_phone: str,
        message: str,
        message_type: str = "general",
        priority: str = "normal",
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.to_phone = to_phone
        self.message = message
        self.message_type = message_type  # medication, emergency, appointment, general
        self.priority = priority  # low, normal, high, urgent
        self.metadata = metadata or {}
        self.created_at = datetime.now(timezone.utc)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        return {
            "to_phone": self.to_phone,
            "message": self.message,
            "message_type": self.message_type,
            "priority": self.priority,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat()
        }


class SMSResult:
    """Result object for SMS sending operations."""
    
    def __init__(
        self,
        success: bool,
        message_sid: Optional[str] = None,
        to_phone: Optional[str] = None,
        error: Optional[str] = None,
        status: Optional[str] = None
    ):
        self.success = success
        self.message_sid = message_sid
        self.to_phone = to_phone
        self.error = error
        self.status = status
        self.timestamp = datetime.now(timezone.utc)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        return {
            "success": self.success,
            "message_sid": self.message_sid,
            "to_phone": self.to_phone,
            "error": self.error,
            "status": self.status,
            "timestamp": self.timestamp.isoformat()
        }


class SMSService:
    """Service for sending SMS notifications via Twilio API."""
    
    def __init__(self):
        """Initialize SMS service with Twilio configuration."""
        self.account_sid = settings.TWILIO_ACCOUNT_SID
        self.auth_token = settings.TWILIO_AUTH_TOKEN
        self.from_phone = settings.TWILIO_PHONE_NUMBER
        self.client = None
        
        if self.account_sid and self.auth_token:
            try:
                self.client = Client(self.account_sid, self.auth_token)
                logger.info("Twilio SMS service initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Twilio client: {e}")
        else:
            logger.warning("Twilio credentials not configured - SMS service unavailable")
    
    def is_available(self) -> bool:
        """Check if SMS service is available."""
        return self.client is not None and self.from_phone is not None
    
    def validate_phone_number(self, phone_number: str) -> Optional[str]:
        """
        Validate and format phone number for SMS sending.
        
        Args:
            phone_number: Phone number to validate
            
        Returns:
            Formatted phone number or None if invalid
        """
        try:
            # Parse the phone number (assume US if no country code)
            parsed = phonenumbers.parse(phone_number, "US")
            
            # Check if the number is valid
            if phonenumbers.is_valid_number(parsed):
                # Format in E164 format for Twilio
                return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
            else:
                logger.warning(f"Invalid phone number: {phone_number}")
                return None
                
        except NumberParseException as e:
            logger.error(f"Phone number parsing error for {phone_number}: {e}")
            return None
    
    @with_circuit_breaker(
        name="twilio_sms",
        failure_threshold=5,
        timeout_seconds=60,
        half_open_max_calls=3,
        success_threshold=2
    )
    async def send_sms(
        self,
        to_phone: str,
        message: str,
        message_type: str = "general",
        priority: str = "normal"
    ) -> SMSResult:
        """
        Send SMS message to a phone number.
        
        Args:
            to_phone: Recipient phone number
            message: Message content
            message_type: Type of message (medication, emergency, appointment, general)
            priority: Message priority (low, normal, high, urgent)
            
        Returns:
            SMSResult with sending status and details
        """
        if not self.is_available():
            await set_service_unavailable("twilio_sms", "Twilio not configured")
            return SMSResult(
                success=False,
                to_phone=to_phone,
                error="SMS service not available - Twilio not configured"
            )
        
        # Validate and format phone number
        formatted_phone = self.validate_phone_number(to_phone)
        if not formatted_phone:
            return SMSResult(
                success=False,
                to_phone=to_phone,
                error="Invalid phone number format"
            )
        
        try:
            # Add priority indicator to urgent messages
            if priority == "urgent":
                message = f"🚨 URGENT: {message}"
            elif priority == "high":
                message = f"⚠️ IMPORTANT: {message}"
            
            # Send SMS using Twilio (run in thread pool to avoid blocking)
            twilio_message = await asyncio.to_thread(
                self.client.messages.create,
                body=message,
                from_=self.from_phone,
                to=formatted_phone
            )
            
            logger.info(f"SMS sent successfully to {formatted_phone}, SID: {twilio_message.sid}")
            
            # Mark service as available on success
            await set_service_available("twilio_sms", "SMS service operating normally")
            
            return SMSResult(
                success=True,
                message_sid=twilio_message.sid,
                to_phone=formatted_phone,
                status=twilio_message.status
            )
            
        except CircuitBreakerError as e:
            logger.error(f"Twilio SMS circuit breaker open: {e}")
            await log_error(e, ErrorCategory.EXTERNAL_SERVICE_ERROR, ErrorSeverity.CRITICAL)
            await set_service_unavailable("twilio_sms", "Circuit breaker open")
            return SMSResult(
                success=False,
                to_phone=formatted_phone,
                error="SMS service temporarily unavailable - circuit breaker open"
            )
        except TwilioException as e:
            logger.error(f"Twilio error sending SMS to {formatted_phone}: {e}")
            await log_error(e, ErrorCategory.EXTERNAL_SERVICE_ERROR, ErrorSeverity.HIGH)
            await set_service_degraded(
                "twilio_sms",
                unavailable_features=["sms_delivery"],
                message=f"Twilio error: {str(e)}"
            )
            return SMSResult(
                success=False,
                to_phone=formatted_phone,
                error=f"Twilio error: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error sending SMS to {formatted_phone}: {e}")
            await log_error(e, ErrorCategory.EXTERNAL_SERVICE_ERROR, ErrorSeverity.HIGH)
            return SMSResult(
                success=False,
                to_phone=formatted_phone,
                error=f"Unexpected error: {str(e)}"
            )
    
    async def send_bulk_sms(
        self,
        messages: List[SMSMessage]
    ) -> List[SMSResult]:
        """
        Send multiple SMS messages in batch.
        
        Args:
            messages: List of SMSMessage objects to send
            
        Returns:
            List of SMSResult objects with sending status for each message
        """
        if not self.is_available():
            return [
                SMSResult(
                    success=False,
                    to_phone=msg.to_phone,
                    error="SMS service not available - Twilio not configured"
                )
                for msg in messages
            ]
        
        results = []
        
        # Send messages concurrently but with rate limiting
        semaphore = asyncio.Semaphore(5)  # Limit to 5 concurrent sends
        
        async def send_single_message(sms_message: SMSMessage) -> SMSResult:
            async with semaphore:
                return await self.send_sms(
                    to_phone=sms_message.to_phone,
                    message=sms_message.message,
                    message_type=sms_message.message_type,
                    priority=sms_message.priority
                )
        
        # Create tasks for all messages
        tasks = [send_single_message(msg) for msg in messages]
        
        # Execute all tasks concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle any exceptions that occurred
        final_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error sending bulk SMS message {i}: {result}")
                final_results.append(SMSResult(
                    success=False,
                    to_phone=messages[i].to_phone,
                    error=str(result)
                ))
            else:
                final_results.append(result)
        
        return final_results
    
    async def send_medication_reminder(
        self,
        to_phone: str,
        pet_name: str,
        medication_name: str,
        dosage: str,
        scheduled_time: str
    ) -> SMSResult:
        """
        Send medication reminder SMS.
        
        Args:
            to_phone: Recipient phone number
            pet_name: Name of the pet
            medication_name: Name of the medication
            dosage: Medication dosage
            scheduled_time: Scheduled administration time
            
        Returns:
            SMSResult with sending status
        """
        message = (
            f"💊 Medication Reminder: Time to give {pet_name} their "
            f"{medication_name} ({dosage}). Scheduled for {scheduled_time}."
        )
        
        return await self.send_sms(
            to_phone=to_phone,
            message=message,
            message_type="medication",
            priority="normal"
        )
    
    async def send_emergency_alert(
        self,
        to_phone: str,
        pet_name: str,
        emergency_type: str,
        location_info: Optional[str] = None
    ) -> SMSResult:
        """
        Send emergency alert SMS.
        
        Args:
            to_phone: Recipient phone number
            pet_name: Name of the pet
            emergency_type: Type of emergency
            location_info: Optional emergency vet location information
            
        Returns:
            SMSResult with sending status
        """
        message = f"🚨 EMERGENCY ALERT: {pet_name} - {emergency_type}. Seek immediate veterinary care!"
        
        if location_info:
            message += f" Nearest emergency clinic: {location_info}"
        
        return await self.send_sms(
            to_phone=to_phone,
            message=message,
            message_type="emergency",
            priority="urgent"
        )
    
    async def send_appointment_reminder(
        self,
        to_phone: str,
        pet_name: str,
        appointment_type: str,
        clinic_name: str,
        appointment_time: str,
        reminder_type: str = "24_hours"
    ) -> SMSResult:
        """
        Send appointment reminder SMS.
        
        Args:
            to_phone: Recipient phone number
            pet_name: Name of the pet
            appointment_type: Type of appointment
            clinic_name: Name of the veterinary clinic
            appointment_time: Appointment date and time
            reminder_type: Type of reminder (24_hours, 2_hours)
            
        Returns:
            SMSResult with sending status
        """
        time_text = "24 hours" if reminder_type == "24_hours" else "2 hours"
        
        message = (
            f"📅 Appointment Reminder: {pet_name} has a {appointment_type} "
            f"appointment in {time_text} at {clinic_name} ({appointment_time})."
        )
        
        return await self.send_sms(
            to_phone=to_phone,
            message=message,
            message_type="appointment",
            priority="normal"
        )
    
    async def send_feeding_reminder(
        self,
        to_phone: str,
        pet_name: str,
        food_type: str,
        amount: str,
        scheduled_time: str
    ) -> SMSResult:
        """
        Send feeding reminder SMS.
        
        Args:
            to_phone: Recipient phone number
            pet_name: Name of the pet
            food_type: Type of food
            amount: Amount to feed
            scheduled_time: Scheduled feeding time
            
        Returns:
            SMSResult with sending status
        """
        message = (
            f"🍽️ Feeding Reminder: Time to feed {pet_name} their "
            f"{food_type} ({amount}). Scheduled for {scheduled_time}."
        )
        
        return await self.send_sms(
            to_phone=to_phone,
            message=message,
            message_type="feeding",
            priority="normal"
        )
    
    async def get_message_status(self, message_sid: str) -> Optional[Dict[str, Any]]:
        """
        Get the delivery status of a sent message.
        
        Args:
            message_sid: Twilio message SID
            
        Returns:
            Dictionary with message status information or None if error
        """
        if not self.is_available():
            return None
        
        try:
            message = await asyncio.to_thread(
                self.client.messages(message_sid).fetch
            )
            
            return {
                "sid": message.sid,
                "status": message.status,
                "to": message.to,
                "from": message.from_,
                "date_sent": message.date_sent.isoformat() if message.date_sent else None,
                "date_updated": message.date_updated.isoformat() if message.date_updated else None,
                "error_code": message.error_code,
                "error_message": message.error_message
            }
            
        except TwilioException as e:
            logger.error(f"Error fetching message status for {message_sid}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching message status: {e}")
            return None
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check the health status of the SMS service.
        
        Returns:
            Dictionary with service health information
        """
        if not self.is_available():
            return {
                "service": "sms",
                "status": "unavailable",
                "twilio_configured": False,
                "error": "Twilio credentials not configured"
            }
        
        try:
            # Test Twilio connection by fetching account info
            account = await asyncio.to_thread(
                lambda: self.client.api.accounts(self.account_sid).fetch()
            )
            
            return {
                "service": "sms",
                "status": "healthy",
                "twilio_configured": True,
                "account_sid": self.account_sid,
                "from_phone": self.from_phone,
                "account_status": account.status
            }
            
        except TwilioException as e:
            logger.error(f"Twilio health check failed: {e}")
            return {
                "service": "sms",
                "status": "unhealthy",
                "twilio_configured": True,
                "error": str(e)
            }
        except Exception as e:
            logger.error(f"SMS service health check failed: {e}")
            return {
                "service": "sms",
                "status": "error",
                "twilio_configured": True,
                "error": str(e)
            }


# Global SMS service instance
sms_service = SMSService()