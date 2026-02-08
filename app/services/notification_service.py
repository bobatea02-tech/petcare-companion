"""
Notification scheduling service for automated reminders and alerts.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload

from app.database.connection import get_db_session
from app.database.models import (
    User, Pet, Medication, MedicationLog, FeedingSchedule, 
    FeedingLog, NotificationPreference, Appointment, HealthRecord
)
from app.core.config import settings


logger = logging.getLogger(__name__)


class NotificationService:
    """Service for managing automated notifications and reminders."""
    
    def __init__(self):
        self.default_reminder_minutes = settings.MEDICATION_REMINDER_MINUTES
        self.appointment_reminder_hours = settings.APPOINTMENT_REMINDER_HOURS
        
    async def schedule_medication_reminders(self) -> Dict[str, Any]:
        """
        Schedule 15-minute advance reminders for upcoming medications.
        """
        logger.info("Scheduling medication reminders")
        results = {
            "timestamp": datetime.utcnow().isoformat(),
            "reminders_scheduled": 0,
            "notifications_sent": 0,
            "errors": []
        }
        
        try:
            async with get_db_session() as session:
                # Get medication logs due in the next 15 minutes that haven't been completed
                now = datetime.utcnow()
                reminder_window = now + timedelta(minutes=self.default_reminder_minutes)
                
                stmt = select(MedicationLog).join(Medication).join(Pet).join(User).where(
                    and_(
                        MedicationLog.completed == False,
                        MedicationLog.administered_at >= now,
                        MedicationLog.administered_at <= reminder_window
                    )
                ).options(
                    selectinload(MedicationLog.medication).selectinload(Medication.pet).selectinload(Pet.owner)
                )
                
                medication_logs = await session.execute(stmt)
                medication_logs = medication_logs.scalars().all()
                
                for log in medication_logs:
                    try:
                        # Check user notification preferences
                        prefs = await self._get_user_notification_preferences(
                            session, str(log.medication.pet.owner.id)
                        )
                        
                        if not prefs.get("medication_reminders", True):
                            continue
                        
                        # Create reminder notification
                        notification = await self._create_medication_reminder(log, prefs)
                        
                        # Send notification based on user preferences
                        if prefs.get("push_notifications", True):
                            await self._send_push_notification(notification)
                        
                        if prefs.get("email_notifications", True):
                            await self._send_email_notification(notification)
                        
                        if prefs.get("sms_notifications", False):
                            await self._send_sms_notification(notification)
                        
                        results["reminders_scheduled"] += 1
                        results["notifications_sent"] += 1
                        
                    except Exception as e:
                        error_msg = f"Failed to schedule reminder for medication {log.medication.medication_name}: {str(e)}"
                        logger.error(error_msg)
                        results["errors"].append(error_msg)
                        
        except Exception as e:
            error_msg = f"Failed to schedule medication reminders: {str(e)}"
            logger.error(error_msg)
            results["errors"].append(error_msg)
            
        logger.info(f"Medication reminders scheduled: {results}")
        return results
    
    async def schedule_feeding_reminders(self) -> Dict[str, Any]:
        """
        Schedule 15-minute advance reminders for upcoming feeding times.
        """
        logger.info("Scheduling feeding reminders")
        results = {
            "timestamp": datetime.utcnow().isoformat(),
            "reminders_scheduled": 0,
            "notifications_sent": 0,
            "errors": []
        }
        
        try:
            async with get_db_session() as session:
                # Get feeding logs due in the next 15 minutes that haven't been completed
                now = datetime.utcnow()
                reminder_window = now + timedelta(minutes=self.default_reminder_minutes)
                
                stmt = select(FeedingLog).join(Pet).join(User).where(
                    and_(
                        FeedingLog.completed == False,
                        FeedingLog.feeding_time >= now,
                        FeedingLog.feeding_time <= reminder_window
                    )
                ).options(
                    selectinload(FeedingLog.pet).selectinload(Pet.owner)
                )
                
                feeding_logs = await session.execute(stmt)
                feeding_logs = feeding_logs.scalars().all()
                
                for log in feeding_logs:
                    try:
                        # Check user notification preferences
                        prefs = await self._get_user_notification_preferences(
                            session, str(log.pet.owner.id)
                        )
                        
                        if not prefs.get("feeding_reminders", True):
                            continue
                        
                        # Create reminder notification
                        notification = await self._create_feeding_reminder(log, prefs)
                        
                        # Send notification based on user preferences
                        if prefs.get("push_notifications", True):
                            await self._send_push_notification(notification)
                        
                        if prefs.get("email_notifications", True):
                            await self._send_email_notification(notification)
                        
                        if prefs.get("sms_notifications", False):
                            await self._send_sms_notification(notification)
                        
                        results["reminders_scheduled"] += 1
                        results["notifications_sent"] += 1
                        
                    except Exception as e:
                        error_msg = f"Failed to schedule feeding reminder for pet {log.pet.name}: {str(e)}"
                        logger.error(error_msg)
                        results["errors"].append(error_msg)
                        
        except Exception as e:
            error_msg = f"Failed to schedule feeding reminders: {str(e)}"
            logger.error(error_msg)
            results["errors"].append(error_msg)
            
        logger.info(f"Feeding reminders scheduled: {results}")
        return results
    
    async def schedule_appointment_reminders(self) -> Dict[str, Any]:
        """
        Schedule appointment reminders (24 hours and 2 hours before).
        """
        logger.info("Scheduling appointment reminders")
        results = {
            "timestamp": datetime.utcnow().isoformat(),
            "reminders_24h": 0,
            "reminders_2h": 0,
            "notifications_sent": 0,
            "errors": []
        }
        
        try:
            async with get_db_session() as session:
                now = datetime.utcnow()
                
                # Schedule 24-hour reminders
                reminder_24h = now + timedelta(hours=24)
                reminder_24h_window = reminder_24h + timedelta(minutes=30)  # 30-minute window
                
                stmt_24h = select(Appointment).join(Pet).join(User).where(
                    and_(
                        Appointment.status == "scheduled",
                        Appointment.appointment_date >= reminder_24h,
                        Appointment.appointment_date <= reminder_24h_window,
                        Appointment.reminder_sent_24h == False
                    )
                ).options(
                    selectinload(Appointment.pet).selectinload(Pet.owner)
                )
                
                appointments_24h = await session.execute(stmt_24h)
                appointments_24h = appointments_24h.scalars().all()
                
                for appointment in appointments_24h:
                    try:
                        # Check user notification preferences
                        prefs = await self._get_user_notification_preferences(
                            session, str(appointment.pet.owner.id)
                        )
                        
                        if not prefs.get("appointment_reminders", True):
                            continue
                        
                        # Create 24-hour reminder notification
                        notification = await self._create_appointment_reminder(appointment, "24_hours", prefs)
                        
                        # Send notification based on user preferences
                        if prefs.get("push_notifications", True):
                            await self._send_push_notification(notification)
                        
                        if prefs.get("email_notifications", True):
                            await self._send_email_notification(notification)
                        
                        if prefs.get("sms_notifications", False):
                            await self._send_sms_notification(notification)
                        
                        # Mark 24-hour reminder as sent
                        appointment.reminder_sent_24h = True
                        
                        results["reminders_24h"] += 1
                        results["notifications_sent"] += 1
                        
                    except Exception as e:
                        error_msg = f"Failed to schedule 24h reminder for appointment {appointment.id}: {str(e)}"
                        logger.error(error_msg)
                        results["errors"].append(error_msg)
                
                # Schedule 2-hour reminders
                reminder_2h = now + timedelta(hours=2)
                reminder_2h_window = reminder_2h + timedelta(minutes=30)  # 30-minute window
                
                stmt_2h = select(Appointment).join(Pet).join(User).where(
                    and_(
                        Appointment.status == "scheduled",
                        Appointment.appointment_date >= reminder_2h,
                        Appointment.appointment_date <= reminder_2h_window,
                        Appointment.reminder_sent_2h == False
                    )
                ).options(
                    selectinload(Appointment.pet).selectinload(Pet.owner)
                )
                
                appointments_2h = await session.execute(stmt_2h)
                appointments_2h = appointments_2h.scalars().all()
                
                for appointment in appointments_2h:
                    try:
                        # Check user notification preferences
                        prefs = await self._get_user_notification_preferences(
                            session, str(appointment.pet.owner.id)
                        )
                        
                        if not prefs.get("appointment_reminders", True):
                            continue
                        
                        # Create 2-hour reminder notification
                        notification = await self._create_appointment_reminder(appointment, "2_hours", prefs)
                        
                        # Send notification based on user preferences
                        if prefs.get("push_notifications", True):
                            await self._send_push_notification(notification)
                        
                        if prefs.get("email_notifications", True):
                            await self._send_email_notification(notification)
                        
                        if prefs.get("sms_notifications", False):
                            await self._send_sms_notification(notification)
                        
                        # Mark 2-hour reminder as sent
                        appointment.reminder_sent_2h = True
                        
                        results["reminders_2h"] += 1
                        results["notifications_sent"] += 1
                        
                    except Exception as e:
                        error_msg = f"Failed to schedule 2h reminder for appointment {appointment.id}: {str(e)}"
                        logger.error(error_msg)
                        results["errors"].append(error_msg)
                
                await session.commit()
                        
        except Exception as e:
            error_msg = f"Failed to schedule appointment reminders: {str(e)}"
            logger.error(error_msg)
            results["errors"].append(error_msg)
            
        logger.info(f"Appointment reminders scheduled: {results}")
        return results
    
    async def generate_weekly_health_reports(self) -> Dict[str, Any]:
        """
        Generate and send weekly health reports with AI insights.
        """
        logger.info("Generating weekly health reports")
        results = {
            "timestamp": datetime.utcnow().isoformat(),
            "reports_generated": 0,
            "reports_sent": 0,
            "errors": []
        }
        
        try:
            async with get_db_session() as session:
                # Get all active users with pets
                stmt = select(User).join(Pet).where(
                    and_(
                        User.is_active == True,
                        Pet.is_active == True
                    )
                ).options(
                    selectinload(User.pets),
                    selectinload(User.notification_preferences)
                ).distinct()
                
                users = await session.execute(stmt)
                users = users.scalars().all()
                
                for user in users:
                    try:
                        # Check if user wants weekly reports
                        prefs = await self._get_user_notification_preferences(
                            session, str(user.id)
                        )
                        
                        if not prefs.get("weekly_reports", True):
                            continue
                        
                        # Generate health report for user's pets
                        report = await self._generate_health_report(session, user)
                        
                        # Send report via email (primary method for reports)
                        if prefs.get("email_notifications", True):
                            await self._send_health_report_email(user, report)
                            results["reports_sent"] += 1
                        
                        results["reports_generated"] += 1
                        
                    except Exception as e:
                        error_msg = f"Failed to generate health report for user {user.email}: {str(e)}"
                        logger.error(error_msg)
                        results["errors"].append(error_msg)
                        
        except Exception as e:
            error_msg = f"Failed to generate weekly health reports: {str(e)}"
            logger.error(error_msg)
            results["errors"].append(error_msg)
            
        logger.info(f"Weekly health reports generated: {results}")
        return results
    
    async def _get_user_notification_preferences(
        self, 
        session: AsyncSession, 
        user_id: str
    ) -> Dict[str, Any]:
        """Get user notification preferences."""
        stmt = select(NotificationPreference).where(
            NotificationPreference.user_id == user_id
        )
        prefs = await session.execute(stmt)
        prefs = prefs.scalar_one_or_none()
        
        if not prefs:
            # Return default preferences
            return {
                "medication_reminders": True,
                "feeding_reminders": True,
                "appointment_reminders": True,
                "weekly_reports": True,
                "reminder_advance_minutes": 15,
                "email_notifications": True,
                "sms_notifications": False,
                "push_notifications": True
            }
        
        return {
            "medication_reminders": prefs.medication_reminders,
            "feeding_reminders": prefs.feeding_reminders,
            "appointment_reminders": prefs.appointment_reminders,
            "weekly_reports": prefs.weekly_reports,
            "reminder_advance_minutes": prefs.reminder_advance_minutes,
            "email_notifications": prefs.email_notifications,
            "sms_notifications": prefs.sms_notifications,
            "push_notifications": prefs.push_notifications
        }
    
    async def _create_medication_reminder(
        self, 
        medication_log: MedicationLog, 
        prefs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create medication reminder notification."""
        return {
            "type": "medication_reminder",
            "title": f"Medication Reminder for {medication_log.medication.pet.name}",
            "message": f"Time to give {medication_log.medication.pet.name} their {medication_log.medication.medication_name} ({medication_log.dosage_given})",
            "pet_name": medication_log.medication.pet.name,
            "medication_name": medication_log.medication.medication_name,
            "dosage": medication_log.dosage_given,
            "scheduled_time": medication_log.administered_at.isoformat(),
            "user_email": medication_log.medication.pet.owner.email,
            "user_phone": medication_log.medication.pet.owner.phone_number
        }
    
    async def _create_feeding_reminder(
        self, 
        feeding_log: FeedingLog, 
        prefs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create feeding reminder notification."""
        return {
            "type": "feeding_reminder",
            "title": f"Feeding Reminder for {feeding_log.pet.name}",
            "message": f"Time to feed {feeding_log.pet.name} their {feeding_log.food_type} ({feeding_log.amount})",
            "pet_name": feeding_log.pet.name,
            "food_type": feeding_log.food_type,
            "amount": feeding_log.amount,
            "scheduled_time": feeding_log.feeding_time.isoformat(),
            "user_email": feeding_log.pet.owner.email,
            "user_phone": feeding_log.pet.owner.phone_number
        }
    
    async def _create_appointment_reminder(
        self, 
        appointment: Appointment, 
        reminder_type: str, 
        prefs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create appointment reminder notification."""
        time_text = "24 hours" if reminder_type == "24_hours" else "2 hours"
        
        return {
            "type": "appointment_reminder",
            "reminder_type": reminder_type,
            "title": f"Appointment Reminder for {appointment.pet.name}",
            "message": f"Reminder: {appointment.pet.name} has a {appointment.appointment_type} appointment in {time_text} at {appointment.clinic_name}",
            "pet_name": appointment.pet.name,
            "appointment_type": appointment.appointment_type,
            "clinic_name": appointment.clinic_name,
            "appointment_time": appointment.appointment_date.isoformat(),
            "user_email": appointment.pet.owner.email,
            "user_phone": appointment.pet.owner.phone_number
        }
    
    async def _generate_health_report(self, session: AsyncSession, user: User) -> Dict[str, Any]:
        """Generate weekly health report for user's pets."""
        # Get health data from the past week
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        report = {
            "user_name": f"{user.first_name} {user.last_name}",
            "report_period": f"{week_ago.strftime('%Y-%m-%d')} to {datetime.utcnow().strftime('%Y-%m-%d')}",
            "pets": []
        }
        
        for pet in user.pets:
            if not pet.is_active:
                continue
                
            # Get recent health records
            health_stmt = select(HealthRecord).where(
                and_(
                    HealthRecord.pet_id == pet.id,
                    HealthRecord.created_at >= week_ago
                )
            )
            health_records = await session.execute(health_stmt)
            health_records = health_records.scalars().all()
            
            # Get medication compliance
            med_stmt = select(MedicationLog).join(Medication).where(
                and_(
                    Medication.pet_id == pet.id,
                    MedicationLog.administered_at >= week_ago
                )
            )
            med_logs = await session.execute(med_stmt)
            med_logs = med_logs.scalars().all()
            
            # Get feeding compliance
            feeding_stmt = select(FeedingLog).where(
                and_(
                    FeedingLog.pet_id == pet.id,
                    FeedingLog.feeding_time >= week_ago
                )
            )
            feeding_logs = await session.execute(feeding_stmt)
            feeding_logs = feeding_logs.scalars().all()
            
            pet_report = {
                "name": pet.name,
                "species": pet.species,
                "breed": pet.breed,
                "health_records_count": len(health_records),
                "medication_compliance": {
                    "total_doses": len(med_logs),
                    "completed_doses": len([log for log in med_logs if log.completed]),
                    "compliance_rate": len([log for log in med_logs if log.completed]) / len(med_logs) * 100 if med_logs else 0
                },
                "feeding_compliance": {
                    "total_feedings": len(feeding_logs),
                    "completed_feedings": len([log for log in feeding_logs if log.completed]),
                    "compliance_rate": len([log for log in feeding_logs if log.completed]) / len(feeding_logs) * 100 if feeding_logs else 0
                },
                "ai_insights": "No significant health concerns noted this week. Continue current care routine."  # Would be generated by AI service
            }
            
            report["pets"].append(pet_report)
        
        return report
    
    async def _send_push_notification(self, notification: Dict[str, Any]) -> bool:
        """Send push notification (placeholder implementation)."""
        logger.info(f"Sending push notification: {notification['title']}")
        # Implementation would integrate with push notification service
        return True
    
    async def _send_email_notification(self, notification: Dict[str, Any]) -> bool:
        """Send email notification using SendGrid service."""
        try:
            from app.services.email_service import email_service
            
            user_email = notification.get('user_email')
            if not user_email:
                logger.warning("No email address provided for email notification")
                return False
            
            # Create email content based on notification type
            notification_type = notification.get('type', 'general')
            title = notification.get('title', 'PawPal Notification')
            message = notification.get('message', '')
            
            # Generate HTML content
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                    <h2>🐾 {title}</h2>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <p>{message}</p>
                    
                    <div style="margin-top: 20px; padding: 15px; background-color: white; border-radius: 8px;">
                        <p style="margin: 0; color: #666;">
                            This notification was sent by PawPal Pet Care Assistant.
                        </p>
                    </div>
                </div>
            </div>
            """
            
            result = await email_service.send_email(
                to_email=user_email,
                subject=title,
                html_content=html_content,
                from_name="PawPal Pet Care Assistant"
            )
            
            if result.success:
                logger.info(f"Email notification sent successfully to {user_email}")
                return True
            else:
                logger.error(f"Failed to send email notification to {user_email}: {result.error}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email notification: {e}")
            return False
    
    async def _send_sms_notification(self, notification: Dict[str, Any]) -> bool:
        """Send SMS notification using Twilio service."""
        try:
            from app.services.sms_service import sms_service
            
            phone_number = notification.get('user_phone')
            if not phone_number:
                logger.warning("No phone number provided for SMS notification")
                return False
            
            # Determine message type and priority based on notification type
            notification_type = notification.get('type', 'general')
            priority = 'normal'
            
            if notification_type == 'medication_reminder':
                result = await sms_service.send_medication_reminder(
                    to_phone=phone_number,
                    pet_name=notification.get('pet_name', 'your pet'),
                    medication_name=notification.get('medication_name', 'medication'),
                    dosage=notification.get('dosage', 'prescribed dosage'),
                    scheduled_time=notification.get('scheduled_time', 'now')
                )
            elif notification_type == 'feeding_reminder':
                result = await sms_service.send_feeding_reminder(
                    to_phone=phone_number,
                    pet_name=notification.get('pet_name', 'your pet'),
                    food_type=notification.get('food_type', 'food'),
                    amount=notification.get('amount', 'regular amount'),
                    scheduled_time=notification.get('scheduled_time', 'now')
                )
            elif notification_type == 'appointment_reminder':
                result = await sms_service.send_appointment_reminder(
                    to_phone=phone_number,
                    pet_name=notification.get('pet_name', 'your pet'),
                    appointment_type=notification.get('appointment_type', 'appointment'),
                    clinic_name=notification.get('clinic_name', 'veterinary clinic'),
                    appointment_time=notification.get('appointment_time', 'scheduled time'),
                    reminder_type=notification.get('reminder_type', '24_hours')
                )
            else:
                # Generic SMS for other notification types
                result = await sms_service.send_sms(
                    to_phone=phone_number,
                    message=notification.get('message', notification.get('title', 'PawPal notification')),
                    message_type=notification_type,
                    priority=priority
                )
            
            if result.success:
                logger.info(f"SMS notification sent successfully to {phone_number}, SID: {result.message_sid}")
                return True
            else:
                logger.error(f"Failed to send SMS notification to {phone_number}: {result.error}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending SMS notification: {e}")
            return False
    
    async def _send_health_report_email(self, user: User, report: Dict[str, Any]) -> bool:
        """Send weekly health report via email using SendGrid service."""
        try:
            from app.services.email_service import email_service
            
            user_name = f"{user.first_name} {user.last_name}".strip()
            if not user_name:
                user_name = user.email.split('@')[0]  # Use email prefix as fallback
            
            result = await email_service.send_weekly_health_report(
                to_email=user.email,
                user_name=user_name,
                report_data=report
            )
            
            if result.success:
                logger.info(f"Weekly health report sent successfully to {user.email}")
                return True
            else:
                logger.error(f"Failed to send health report to {user.email}: {result.error}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending health report email: {e}")
            return False


# Global notification service instance
notification_service = NotificationService()