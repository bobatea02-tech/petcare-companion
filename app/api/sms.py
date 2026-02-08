"""
SMS API endpoints for urgent notifications and alerts.
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.services.sms_service import sms_service, SMSMessage, SMSServiceError
from app.core.dependencies import get_current_user
from app.database.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sms", tags=["sms"])


class SMSRequest(BaseModel):
    """Request model for sending SMS."""
    to_phone: str = Field(..., description="Recipient phone number")
    message: str = Field(..., min_length=1, max_length=1600, description="Message content")
    message_type: str = Field("general", description="Type of message")
    priority: str = Field("normal", description="Message priority")


class BulkSMSRequest(BaseModel):
    """Request model for sending bulk SMS."""
    messages: List[SMSRequest] = Field(..., description="List of SMS messages to send")


class MedicationReminderRequest(BaseModel):
    """Request model for medication reminder SMS."""
    to_phone: str = Field(..., description="Recipient phone number")
    pet_name: str = Field(..., description="Name of the pet")
    medication_name: str = Field(..., description="Name of the medication")
    dosage: str = Field(..., description="Medication dosage")
    scheduled_time: str = Field(..., description="Scheduled administration time")


class EmergencyAlertRequest(BaseModel):
    """Request model for emergency alert SMS."""
    to_phone: str = Field(..., description="Recipient phone number")
    pet_name: str = Field(..., description="Name of the pet")
    emergency_type: str = Field(..., description="Type of emergency")
    location_info: Optional[str] = Field(None, description="Emergency vet location information")


class AppointmentReminderRequest(BaseModel):
    """Request model for appointment reminder SMS."""
    to_phone: str = Field(..., description="Recipient phone number")
    pet_name: str = Field(..., description="Name of the pet")
    appointment_type: str = Field(..., description="Type of appointment")
    clinic_name: str = Field(..., description="Name of the veterinary clinic")
    appointment_time: str = Field(..., description="Appointment date and time")
    reminder_type: str = Field("24_hours", description="Type of reminder")


class FeedingReminderRequest(BaseModel):
    """Request model for feeding reminder SMS."""
    to_phone: str = Field(..., description="Recipient phone number")
    pet_name: str = Field(..., description="Name of the pet")
    food_type: str = Field(..., description="Type of food")
    amount: str = Field(..., description="Amount to feed")
    scheduled_time: str = Field(..., description="Scheduled feeding time")


class SMSResponse(BaseModel):
    """Response model for SMS operations."""
    success: bool
    message_sid: Optional[str] = None
    to_phone: Optional[str] = None
    error: Optional[str] = None
    status: Optional[str] = None


class BulkSMSResponse(BaseModel):
    """Response model for bulk SMS operations."""
    total_messages: int
    successful_sends: int
    failed_sends: int
    results: List[SMSResponse]


@router.post("/send", response_model=SMSResponse)
async def send_sms(
    sms_request: SMSRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send SMS message to a phone number.
    
    This endpoint sends SMS messages using Twilio API with
    support for different message types and priorities.
    """
    try:
        result = await sms_service.send_sms(
            to_phone=sms_request.to_phone,
            message=sms_request.message,
            message_type=sms_request.message_type,
            priority=sms_request.priority
        )
        
        return SMSResponse(
            success=result.success,
            message_sid=result.message_sid,
            to_phone=result.to_phone,
            error=result.error,
            status=result.status
        )
        
    except Exception as e:
        logger.error(f"Error sending SMS: {e}")
        raise HTTPException(status_code=500, detail="Failed to send SMS")


@router.post("/send-bulk", response_model=BulkSMSResponse)
async def send_bulk_sms(
    bulk_request: BulkSMSRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send multiple SMS messages in batch.
    
    This endpoint allows sending multiple SMS messages concurrently
    with rate limiting to prevent API abuse.
    """
    try:
        # Convert requests to SMSMessage objects
        sms_messages = [
            SMSMessage(
                to_phone=req.to_phone,
                message=req.message,
                message_type=req.message_type,
                priority=req.priority
            )
            for req in bulk_request.messages
        ]
        
        results = await sms_service.send_bulk_sms(sms_messages)
        
        # Convert results to response format
        sms_responses = [
            SMSResponse(
                success=result.success,
                message_sid=result.message_sid,
                to_phone=result.to_phone,
                error=result.error,
                status=result.status
            )
            for result in results
        ]
        
        successful_sends = sum(1 for result in results if result.success)
        failed_sends = len(results) - successful_sends
        
        return BulkSMSResponse(
            total_messages=len(results),
            successful_sends=successful_sends,
            failed_sends=failed_sends,
            results=sms_responses
        )
        
    except Exception as e:
        logger.error(f"Error sending bulk SMS: {e}")
        raise HTTPException(status_code=500, detail="Failed to send bulk SMS")


@router.post("/medication-reminder", response_model=SMSResponse)
async def send_medication_reminder(
    reminder_request: MedicationReminderRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send medication reminder SMS.
    
    This endpoint sends a formatted medication reminder SMS
    with pet name, medication details, and scheduled time.
    """
    try:
        result = await sms_service.send_medication_reminder(
            to_phone=reminder_request.to_phone,
            pet_name=reminder_request.pet_name,
            medication_name=reminder_request.medication_name,
            dosage=reminder_request.dosage,
            scheduled_time=reminder_request.scheduled_time
        )
        
        return SMSResponse(
            success=result.success,
            message_sid=result.message_sid,
            to_phone=result.to_phone,
            error=result.error,
            status=result.status
        )
        
    except Exception as e:
        logger.error(f"Error sending medication reminder SMS: {e}")
        raise HTTPException(status_code=500, detail="Failed to send medication reminder")


@router.post("/emergency-alert", response_model=SMSResponse)
async def send_emergency_alert(
    alert_request: EmergencyAlertRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send emergency alert SMS.
    
    This endpoint sends urgent emergency alert SMS messages
    with high priority for immediate attention.
    """
    try:
        result = await sms_service.send_emergency_alert(
            to_phone=alert_request.to_phone,
            pet_name=alert_request.pet_name,
            emergency_type=alert_request.emergency_type,
            location_info=alert_request.location_info
        )
        
        return SMSResponse(
            success=result.success,
            message_sid=result.message_sid,
            to_phone=result.to_phone,
            error=result.error,
            status=result.status
        )
        
    except Exception as e:
        logger.error(f"Error sending emergency alert SMS: {e}")
        raise HTTPException(status_code=500, detail="Failed to send emergency alert")


@router.post("/appointment-reminder", response_model=SMSResponse)
async def send_appointment_reminder(
    reminder_request: AppointmentReminderRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send appointment reminder SMS.
    
    This endpoint sends appointment reminder SMS messages
    with clinic details and appointment timing.
    """
    try:
        result = await sms_service.send_appointment_reminder(
            to_phone=reminder_request.to_phone,
            pet_name=reminder_request.pet_name,
            appointment_type=reminder_request.appointment_type,
            clinic_name=reminder_request.clinic_name,
            appointment_time=reminder_request.appointment_time,
            reminder_type=reminder_request.reminder_type
        )
        
        return SMSResponse(
            success=result.success,
            message_sid=result.message_sid,
            to_phone=result.to_phone,
            error=result.error,
            status=result.status
        )
        
    except Exception as e:
        logger.error(f"Error sending appointment reminder SMS: {e}")
        raise HTTPException(status_code=500, detail="Failed to send appointment reminder")


@router.post("/feeding-reminder", response_model=SMSResponse)
async def send_feeding_reminder(
    reminder_request: FeedingReminderRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send feeding reminder SMS.
    
    This endpoint sends feeding reminder SMS messages
    with pet name, food details, and scheduled time.
    """
    try:
        result = await sms_service.send_feeding_reminder(
            to_phone=reminder_request.to_phone,
            pet_name=reminder_request.pet_name,
            food_type=reminder_request.food_type,
            amount=reminder_request.amount,
            scheduled_time=reminder_request.scheduled_time
        )
        
        return SMSResponse(
            success=result.success,
            message_sid=result.message_sid,
            to_phone=result.to_phone,
            error=result.error,
            status=result.status
        )
        
    except Exception as e:
        logger.error(f"Error sending feeding reminder SMS: {e}")
        raise HTTPException(status_code=500, detail="Failed to send feeding reminder")


@router.get("/status/{message_sid}")
async def get_message_status(
    message_sid: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get the delivery status of a sent SMS message.
    
    This endpoint retrieves the current delivery status
    of an SMS message using its Twilio message SID.
    """
    try:
        status_info = await sms_service.get_message_status(message_sid)
        
        if status_info:
            return status_info
        else:
            raise HTTPException(status_code=404, detail="Message not found or SMS service unavailable")
            
    except Exception as e:
        logger.error(f"Error getting message status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get message status")


@router.get("/health")
async def sms_health_check():
    """
    Check the health status of the SMS service.
    
    Returns information about Twilio API availability
    and service configuration status.
    """
    return await sms_service.health_check()