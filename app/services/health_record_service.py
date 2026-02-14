"""
Health record management service for comprehensive health tracking.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from datetime import date, datetime, timedelta
import uuid
import json

from app.database.models import (
    Pet, HealthRecord, SymptomLog, Vaccination, AIAssessment
)
from app.schemas.health_records import (
    HealthRecordCreate, HealthRecordUpdate, HealthRecordResponse,
    SymptomLogCreate, SymptomLogResponse, VaccinationCreate, VaccinationResponse,
    AIAssessmentCreate, AIAssessmentResponse, HealthRecordListResponse,
    HealthSummaryResponse, HealthSummaryStats, AIInsight
)
from app.services.ai_service import AIService


class HealthRecordService:
    """Service class for health record management."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.ai_service = AIService()
    
    async def _verify_pet_ownership(self, user_id: str, pet_id: str) -> Pet:
        """Verify that the pet belongs to the user."""
        result = await self.db.execute(
            select(Pet).where(
                and_(
                    Pet.id == uuid.UUID(pet_id),
                    Pet.user_id == uuid.UUID(user_id),
                    Pet.is_active == True
                )
            )
        )
        pet = result.scalar_one_or_none()
        
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found"
            )
        
        return pet
    
    async def _verify_health_record_ownership(self, user_id: str, record_id: str) -> HealthRecord:
        """Verify that the health record belongs to a pet owned by the user."""
        result = await self.db.execute(
            select(HealthRecord)
            .join(Pet)
            .where(
                and_(
                    HealthRecord.id == uuid.UUID(record_id),
                    Pet.user_id == uuid.UUID(user_id),
                    Pet.is_active == True
                )
            )
            .options(
                selectinload(HealthRecord.symptom_logs),
                selectinload(HealthRecord.vaccinations),
                selectinload(HealthRecord.ai_assessments)
            )
        )
        health_record = result.scalar_one_or_none()
        
        if not health_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Health record not found"
            )
        
        return health_record
    
    # Health Record Management
    
    async def create_health_record(
        self, user_id: str, health_record_data: HealthRecordCreate
    ) -> HealthRecordResponse:
        """
        Create a new health record for a pet.
        
        Requirements validated:
        - 6.1: Timestamped symptom log entries with AI assessments
        - 6.2: Vaccination record storage with dates and expiration tracking
        """
        try:
            await self._verify_pet_ownership(user_id, health_record_data.pet_id)
            
            health_record = HealthRecord(
                pet_id=uuid.UUID(health_record_data.pet_id),
                record_date=health_record_data.record_date,
                record_type=health_record_data.record_type.value,
                description=health_record_data.description,
                veterinarian=health_record_data.veterinarian,
                clinic_name=health_record_data.clinic_name,
                diagnosis=health_record_data.diagnosis,
                treatment_plan=health_record_data.treatment_plan
            )
            
            self.db.add(health_record)
            await self.db.commit()
            await self.db.refresh(health_record)
            
            # Load related data
            await self.db.refresh(health_record, ['symptom_logs', 'vaccinations', 'ai_assessments'])
            
            return self._health_record_to_response(health_record)
            
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create health record: {str(e)}"
            )
    
    async def get_health_record(self, user_id: str, record_id: str) -> HealthRecordResponse:
        """Get detailed information about a specific health record."""
        try:
            health_record = await self._verify_health_record_ownership(user_id, record_id)
            return self._health_record_to_response(health_record)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve health record: {str(e)}"
            )
    
    async def update_health_record(
        self, user_id: str, record_id: str, health_record_data: HealthRecordUpdate
    ) -> HealthRecordResponse:
        """
        Update an existing health record.
        
        Requirements validated:
        - 6.1: Health record updates with timestamp tracking
        """
        try:
            health_record = await self._verify_health_record_ownership(user_id, record_id)
            
            # Update only provided fields
            update_data = health_record_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                if hasattr(health_record, field):
                    if field == 'record_type' and value:
                        setattr(health_record, field, value.value)
                    else:
                        setattr(health_record, field, value)
            
            await self.db.commit()
            await self.db.refresh(health_record, ['symptom_logs', 'vaccinations', 'ai_assessments'])
            
            return self._health_record_to_response(health_record)
            
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update health record: {str(e)}"
            )
    
    async def get_pet_health_records(
        self, user_id: str, pet_id: str, record_type: Optional[str] = None,
        start_date: Optional[date] = None, end_date: Optional[date] = None,
        limit: int = 50, offset: int = 0, archived: Optional[bool] = None
    ) -> HealthRecordListResponse:
        """
        Get chronological health history for a pet with filtering capabilities.
        
        Requirements validated:
        - 6.4: Chronological health history with filtering capabilities
        """
        try:
            await self._verify_pet_ownership(user_id, pet_id)
            
            # Build query with filters
            query = select(HealthRecord).where(
                HealthRecord.pet_id == uuid.UUID(pet_id)
            ).options(
                selectinload(HealthRecord.symptom_logs),
                selectinload(HealthRecord.vaccinations),
                selectinload(HealthRecord.ai_assessments)
            )
            
            # Apply filters
            if record_type:
                query = query.where(HealthRecord.record_type == record_type)
            
            if start_date:
                query = query.where(HealthRecord.record_date >= start_date)
            
            if end_date:
                query = query.where(HealthRecord.record_date <= end_date)
            
            # Filter by archive status
            if archived is not None:
                query = query.where(HealthRecord.is_archived == archived)
            
            # Get total count
            count_query = select(func.count(HealthRecord.id)).where(
                HealthRecord.pet_id == uuid.UUID(pet_id)
            )
            if record_type:
                count_query = count_query.where(HealthRecord.record_type == record_type)
            if start_date:
                count_query = count_query.where(HealthRecord.record_date >= start_date)
            if end_date:
                count_query = count_query.where(HealthRecord.record_date <= end_date)
            if archived is not None:
                count_query = count_query.where(HealthRecord.is_archived == archived)
            
            total_result = await self.db.execute(count_query)
            total_count = total_result.scalar()
            
            # Apply ordering and pagination
            query = query.order_by(desc(HealthRecord.record_date), desc(HealthRecord.created_at))
            query = query.offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            health_records = result.scalars().all()
            
            return HealthRecordListResponse(
                records=[self._health_record_to_response(record) for record in health_records],
                total_count=total_count,
                page_size=limit,
                page_offset=offset,
                has_more=(offset + len(health_records)) < total_count
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve health records: {str(e)}"
            )
    
    async def archive_health_record(
        self, user_id: str, record_id: str, archive: bool
    ) -> HealthRecordResponse:
        """
        Archive or unarchive a health record.
        
        Moves health records between current and history based on user preference.
        """
        try:
            health_record = await self._verify_health_record_ownership(user_id, record_id)
            
            health_record.is_archived = archive
            health_record.archived_at = datetime.now() if archive else None
            
            await self.db.commit()
            await self.db.refresh(health_record)
            
            return self._health_record_to_response(health_record)
            
        except HTTPException:
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to archive health record: {str(e)}"
            )
    
    # Symptom Log Management
    
    async def add_symptom_log(
        self, user_id: str, record_id: str, symptom_data: SymptomLogCreate
    ) -> SymptomLogResponse:
        """
        Add a symptom log entry to an existing health record.
        
        Requirements validated:
        - 6.1: Timestamped symptom log entries
        """
        try:
            health_record = await self._verify_health_record_ownership(user_id, record_id)
            
            symptom_log = SymptomLog(
                health_record_id=health_record.id,
                symptom_description=symptom_data.symptom_description,
                severity=symptom_data.severity.value if symptom_data.severity else None,
                duration=symptom_data.duration,
                observed_at=symptom_data.observed_at
            )
            
            self.db.add(symptom_log)
            await self.db.commit()
            await self.db.refresh(symptom_log)
            
            return self._symptom_log_to_response(symptom_log)
            
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to add symptom log: {str(e)}"
            )
    
    # Vaccination Management
    
    async def add_vaccination_record(
        self, user_id: str, record_id: str, vaccination_data: VaccinationCreate
    ) -> VaccinationResponse:
        """
        Add a vaccination record to an existing health record.
        
        Requirements validated:
        - 6.2: Vaccination record storage with dates and expiration tracking
        """
        try:
            health_record = await self._verify_health_record_ownership(user_id, record_id)
            
            vaccination = Vaccination(
                health_record_id=health_record.id,
                vaccine_name=vaccination_data.vaccine_name,
                vaccine_type=vaccination_data.vaccine_type,
                administered_date=vaccination_data.administered_date,
                expiration_date=vaccination_data.expiration_date,
                veterinarian=vaccination_data.veterinarian,
                clinic_name=vaccination_data.clinic_name,
                batch_number=vaccination_data.batch_number
            )
            
            self.db.add(vaccination)
            await self.db.commit()
            await self.db.refresh(vaccination)
            
            return self._vaccination_to_response(vaccination)
            
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to add vaccination record: {str(e)}"
            )
    
    # AI Assessment Management
    
    async def add_ai_assessment(
        self, user_id: str, record_id: str, assessment_data: AIAssessmentCreate
    ) -> AIAssessmentResponse:
        """
        Add an AI assessment to an existing health record.
        
        Requirements validated:
        - 6.1: AI assessments linked to health records
        - 6.3: AI assessment results storage
        """
        try:
            health_record = await self._verify_health_record_ownership(user_id, record_id)
            
            ai_assessment = AIAssessment(
                pet_id=health_record.pet_id,
                health_record_id=health_record.id,
                symptoms_reported=assessment_data.symptoms_reported,
                triage_level=assessment_data.triage_level.value,
                ai_analysis=assessment_data.ai_analysis,
                recommendations=assessment_data.recommendations,
                model_used=assessment_data.model_used,
                confidence_score=assessment_data.confidence_score
            )
            
            self.db.add(ai_assessment)
            await self.db.commit()
            await self.db.refresh(ai_assessment)
            
            return self._ai_assessment_to_response(ai_assessment)
            
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to add AI assessment: {str(e)}"
            )
    
    # Health Summary Generation
    
    async def generate_health_summary(
        self, user_id: str, pet_id: str, include_ai_insights: bool = True,
        date_range_days: int = 90
    ) -> HealthSummaryResponse:
        """
        Generate comprehensive health summary for veterinary visits.
        
        Requirements validated:
        - 6.5: Exportable health summary generation for vet visits
        """
        try:
            pet = await self._verify_pet_ownership(user_id, pet_id)
            
            # Calculate date range
            end_date = date.today()
            start_date = end_date - timedelta(days=date_range_days)
            
            # Get health records in date range
            records_result = await self.db.execute(
                select(HealthRecord)
                .where(
                    and_(
                        HealthRecord.pet_id == uuid.UUID(pet_id),
                        HealthRecord.record_date >= start_date,
                        HealthRecord.record_date <= end_date
                    )
                )
                .options(
                    selectinload(HealthRecord.symptom_logs),
                    selectinload(HealthRecord.vaccinations),
                    selectinload(HealthRecord.ai_assessments)
                )
                .order_by(desc(HealthRecord.record_date))
            )
            health_records = records_result.scalars().all()
            
            # Calculate statistics
            stats = await self._calculate_health_stats(pet_id, health_records)
            
            # Generate AI insights if requested
            ai_insights = []
            if include_ai_insights and health_records:
                ai_insights = await self._generate_ai_insights(pet, health_records)
            
            return HealthSummaryResponse(
                pet_id=pet_id,
                pet_name=pet.name,
                summary_period_days=date_range_days,
                generated_at=datetime.now(),
                stats=stats,
                recent_records=[self._health_record_to_response(record) for record in health_records[:10]],
                ai_insights=ai_insights,
                export_formats=["json", "pdf"]
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate health summary: {str(e)}"
            )
    
    async def _calculate_health_stats(self, pet_id: str, health_records: List[HealthRecord]) -> HealthSummaryStats:
        """Calculate health summary statistics."""
        symptom_logs_count = sum(len(record.symptom_logs) for record in health_records)
        vaccinations_count = sum(len(record.vaccinations) for record in health_records)
        ai_assessments_count = sum(len(record.ai_assessments) for record in health_records)
        
        emergency_visits = sum(1 for record in health_records if record.record_type == 'emergency')
        checkups_count = sum(1 for record in health_records if record.record_type == 'checkup')
        
        # Find last checkup date
        checkup_records = [r for r in health_records if r.record_type == 'checkup']
        last_checkup_date = checkup_records[0].record_date if checkup_records else None
        
        # Count upcoming vaccinations (expiring within 30 days)
        thirty_days_from_now = date.today() + timedelta(days=30)
        upcoming_vaccinations = 0
        for record in health_records:
            for vaccination in record.vaccinations:
                if (vaccination.expiration_date and 
                    vaccination.expiration_date > date.today() and 
                    vaccination.expiration_date <= thirty_days_from_now):
                    upcoming_vaccinations += 1
        
        return HealthSummaryStats(
            total_records=len(health_records),
            symptom_logs_count=symptom_logs_count,
            vaccinations_count=vaccinations_count,
            ai_assessments_count=ai_assessments_count,
            emergency_visits=emergency_visits,
            checkups_count=checkups_count,
            last_checkup_date=last_checkup_date,
            upcoming_vaccinations=upcoming_vaccinations
        )
    
    async def _generate_ai_insights(self, pet: Pet, health_records: List[HealthRecord]) -> List[AIInsight]:
        """Generate AI-powered health insights."""
        try:
            # Prepare health data for AI analysis
            health_data = {
                "pet_info": {
                    "name": pet.name,
                    "species": pet.species,
                    "breed": pet.breed,
                    "age_years": (date.today() - pet.birth_date).days / 365.25,
                    "medical_conditions": pet.medical_conditions,
                    "allergies": pet.allergies
                },
                "recent_records": []
            }
            
            for record in health_records[:5]:  # Last 5 records
                record_data = {
                    "date": record.record_date.isoformat(),
                    "type": record.record_type,
                    "description": record.description,
                    "diagnosis": record.diagnosis,
                    "symptoms": [log.symptom_description for log in record.symptom_logs],
                    "ai_assessments": [
                        {
                            "triage_level": assessment.triage_level,
                            "analysis": assessment.ai_analysis[:200]  # Truncate for context
                        }
                        for assessment in record.ai_assessments
                    ]
                }
                health_data["recent_records"].append(record_data)
            
            # Generate insights using AI service
            insights_prompt = f"""
            Analyze the following pet health data and provide 3-5 key insights for veterinary discussion:
            
            {json.dumps(health_data, indent=2)}
            
            Focus on:
            1. Health trends and patterns
            2. Preventive care recommendations
            3. Areas of concern requiring attention
            4. Vaccination and checkup scheduling
            
            Return insights as JSON array with format:
            [{{
                "insight_type": "trend|recommendation|alert",
                "title": "Brief title",
                "description": "Detailed description",
                "confidence": 0.0-1.0,
                "priority": "low|medium|high"
            }}]
            """
            
            ai_response = await self.ai_service.generate_health_insights(insights_prompt)
            
            # Parse AI response and create insights
            insights = []
            try:
                ai_insights_data = json.loads(ai_response)
                for insight_data in ai_insights_data[:5]:  # Limit to 5 insights
                    insights.append(AIInsight(
                        insight_type=insight_data.get("insight_type", "recommendation"),
                        title=insight_data.get("title", "Health Insight"),
                        description=insight_data.get("description", ""),
                        confidence=float(insight_data.get("confidence", 0.8)),
                        priority=insight_data.get("priority", "medium")
                    ))
            except (json.JSONDecodeError, KeyError, ValueError):
                # Fallback to basic insights if AI parsing fails
                insights = [
                    AIInsight(
                        insight_type="recommendation",
                        title="Regular Health Monitoring",
                        description="Continue monitoring your pet's health with regular checkups and symptom tracking.",
                        confidence=0.9,
                        priority="medium"
                    )
                ]
            
            return insights
            
        except Exception as e:
            # Return empty insights if AI generation fails
            return []
    
    # Helper methods for response conversion
    
    def _health_record_to_response(self, health_record: HealthRecord) -> HealthRecordResponse:
        """Convert HealthRecord to response schema."""
        return HealthRecordResponse(
            id=str(health_record.id),
            pet_id=str(health_record.pet_id),
            record_date=health_record.record_date,
            record_type=health_record.record_type,
            description=health_record.description,
            veterinarian=health_record.veterinarian,
            clinic_name=health_record.clinic_name,
            diagnosis=health_record.diagnosis,
            treatment_plan=health_record.treatment_plan,
            created_at=health_record.created_at,
            updated_at=health_record.updated_at,
            symptom_logs=[self._symptom_log_to_response(log) for log in health_record.symptom_logs],
            vaccinations=[self._vaccination_to_response(vac) for vac in health_record.vaccinations],
            ai_assessments=[self._ai_assessment_to_response(assess) for assess in health_record.ai_assessments]
        )
    
    def _symptom_log_to_response(self, symptom_log: SymptomLog) -> SymptomLogResponse:
        """Convert SymptomLog to response schema."""
        return SymptomLogResponse(
            id=str(symptom_log.id),
            health_record_id=str(symptom_log.health_record_id),
            symptom_description=symptom_log.symptom_description,
            severity=symptom_log.severity,
            duration=symptom_log.duration,
            observed_at=symptom_log.observed_at,
            created_at=symptom_log.created_at,
            updated_at=symptom_log.updated_at
        )
    
    def _vaccination_to_response(self, vaccination: Vaccination) -> VaccinationResponse:
        """Convert Vaccination to response schema."""
        return VaccinationResponse(
            id=str(vaccination.id),
            health_record_id=str(vaccination.health_record_id),
            vaccine_name=vaccination.vaccine_name,
            vaccine_type=vaccination.vaccine_type,
            administered_date=vaccination.administered_date,
            expiration_date=vaccination.expiration_date,
            veterinarian=vaccination.veterinarian,
            clinic_name=vaccination.clinic_name,
            batch_number=vaccination.batch_number,
            created_at=vaccination.created_at,
            updated_at=vaccination.updated_at
        )
    
    def _ai_assessment_to_response(self, ai_assessment: AIAssessment) -> AIAssessmentResponse:
        """Convert AIAssessment to response schema."""
        return AIAssessmentResponse(
            id=str(ai_assessment.id),
            pet_id=str(ai_assessment.pet_id),
            health_record_id=str(ai_assessment.health_record_id) if ai_assessment.health_record_id else None,
            symptoms_reported=ai_assessment.symptoms_reported,
            triage_level=ai_assessment.triage_level,
            ai_analysis=ai_assessment.ai_analysis,
            recommendations=ai_assessment.recommendations,
            model_used=ai_assessment.model_used,
            confidence_score=ai_assessment.confidence_score,
            created_at=ai_assessment.created_at,
            updated_at=ai_assessment.updated_at
        )