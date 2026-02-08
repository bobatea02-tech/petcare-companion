"""
AI Assistant Function Calling Service for PawPal Voice Pet Care Assistant.

This service implements the specific functions that the AI assistant can call
in response to voice commands: medication status, feeding logs, emergency vets,
and toxic substance checks.
"""

import asyncio
import logging
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, date, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func
from sqlalchemy.orm import selectinload
import json
import httpx
import uuid
from geopy.distance import geodesic

from app.database.models import (
    Pet, Medication, MedicationLog, FeedingLog, VetClinic, AIAssessment
)
from app.core.config import settings

logger = logging.getLogger(__name__)


class AssistantFunctionResult:
    """Result object for assistant function calls."""
    
    def __init__(
        self,
        success: bool,
        function_name: str,
        result_data: Dict[str, Any],
        message: str,
        error: Optional[str] = None
    ):
        self.success = success
        self.function_name = function_name
        self.result_data = result_data
        self.message = message
        self.error = error
        self.timestamp = datetime.now(timezone.utc)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary format."""
        return {
            "success": self.success,
            "function_name": self.function_name,
            "result_data": self.result_data,
            "message": self.message,
            "error": self.error,
            "timestamp": self.timestamp.isoformat()
        }


class AssistantFunctions:
    """Service class for AI assistant function implementations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def check_medication_status(
        self,
        pet_id: str,
        user_id: str,
        medication_name: Optional[str] = None
    ) -> AssistantFunctionResult:
        """
        Check medication status for a pet including upcoming doses and refill needs.
        
        Args:
            pet_id: Pet ID to check medications for
            user_id: User ID for authorization
            medication_name: Optional specific medication to check
            
        Returns:
            AssistantFunctionResult with medication status information
        """
        try:
            # Verify pet belongs to user
            pet_result = await self.db.execute(
                select(Pet).where(
                    and_(
                        Pet.id == uuid.UUID(pet_id),
                        Pet.user_id == uuid.UUID(user_id),
                        Pet.is_active == True
                    )
                )
            )
            pet = pet_result.scalar_one_or_none()
            
            if not pet:
                return AssistantFunctionResult(
                    success=False,
                    function_name="check_medication_status",
                    result_data={},
                    message="Pet not found or access denied",
                    error="Pet not found"
                )
            
            # Build query for medications
            query = select(Medication).where(
                and_(
                    Medication.pet_id == uuid.UUID(pet_id),
                    Medication.active == True
                )
            ).options(selectinload(Medication.medication_logs))
            
            if medication_name:
                query = query.where(
                    Medication.medication_name.ilike(f"%{medication_name}%")
                )
            
            result = await self.db.execute(query)
            medications = result.scalars().all()
            
            if not medications:
                message = f"No active medications found for {pet.name}"
                if medication_name:
                    message += f" matching '{medication_name}'"
                
                return AssistantFunctionResult(
                    success=True,
                    function_name="check_medication_status",
                    result_data={"medications": []},
                    message=message
                )
            
            # Process medication status
            medication_status = []
            refill_alerts = []
            upcoming_doses = []
            
            for med in medications:
                # Calculate next dose time (simplified - assumes daily frequency)
                last_log = None
                if med.medication_logs:
                    last_log = max(med.medication_logs, key=lambda x: x.administered_at)
                
                # Check refill status
                needs_refill = med.current_quantity <= med.refill_threshold
                if needs_refill:
                    refill_alerts.append({
                        "medication": med.medication_name,
                        "current_quantity": med.current_quantity,
                        "threshold": med.refill_threshold
                    })
                
                # Calculate next dose (simplified logic)
                next_dose_time = None
                if last_log:
                    # Assume daily medication for simplicity
                    next_dose_time = last_log.administered_at + timedelta(days=1)
                else:
                    # No previous doses, suggest now
                    next_dose_time = datetime.now(timezone.utc)
                
                if next_dose_time and next_dose_time <= datetime.now(timezone.utc) + timedelta(hours=24):
                    upcoming_doses.append({
                        "medication": med.medication_name,
                        "dosage": med.dosage,
                        "next_dose": next_dose_time.isoformat(),
                        "overdue": next_dose_time < datetime.now(timezone.utc)
                    })
                
                medication_status.append({
                    "id": str(med.id),
                    "name": med.medication_name,
                    "dosage": med.dosage,
                    "frequency": med.frequency,
                    "current_quantity": med.current_quantity,
                    "needs_refill": needs_refill,
                    "last_administered": last_log.administered_at.isoformat() if last_log else None,
                    "next_dose": next_dose_time.isoformat() if next_dose_time else None,
                    "instructions": med.administration_instructions
                })
            
            # Create summary message
            message_parts = [f"Medication status for {pet.name}:"]
            
            if upcoming_doses:
                overdue_count = sum(1 for dose in upcoming_doses if dose["overdue"])
                if overdue_count > 0:
                    message_parts.append(f"⚠️ {overdue_count} overdue dose(s)")
                
                upcoming_count = len(upcoming_doses) - overdue_count
                if upcoming_count > 0:
                    message_parts.append(f"📅 {upcoming_count} upcoming dose(s) in next 24 hours")
            
            if refill_alerts:
                message_parts.append(f"🔔 {len(refill_alerts)} medication(s) need refilling")
            
            if not upcoming_doses and not refill_alerts:
                message_parts.append("✅ All medications are up to date")
            
            result_data = {
                "pet_name": pet.name,
                "medications": medication_status,
                "upcoming_doses": upcoming_doses,
                "refill_alerts": refill_alerts,
                "total_active_medications": len(medications)
            }
            
            return AssistantFunctionResult(
                success=True,
                function_name="check_medication_status",
                result_data=result_data,
                message=" ".join(message_parts)
            )
            
        except Exception as e:
            logger.error(f"Error checking medication status: {e}")
            return AssistantFunctionResult(
                success=False,
                function_name="check_medication_status",
                result_data={},
                message="Failed to check medication status",
                error=str(e)
            )
    
    async def log_feeding(
        self,
        pet_id: str,
        user_id: str,
        food_type: str,
        amount: str,
        feeding_time: Optional[datetime] = None,
        notes: Optional[str] = None
    ) -> AssistantFunctionResult:
        """
        Log a feeding event for a pet with data persistence.
        
        Args:
            pet_id: Pet ID to log feeding for
            user_id: User ID for authorization
            food_type: Type of food given
            amount: Amount of food given
            feeding_time: When feeding occurred (defaults to now)
            notes: Optional notes about the feeding
            
        Returns:
            AssistantFunctionResult with feeding log confirmation
        """
        try:
            # Verify pet belongs to user
            pet_result = await self.db.execute(
                select(Pet).where(
                    and_(
                        Pet.id == uuid.UUID(pet_id),
                        Pet.user_id == uuid.UUID(user_id),
                        Pet.is_active == True
                    )
                )
            )
            pet = pet_result.scalar_one_or_none()
            
            if not pet:
                return AssistantFunctionResult(
                    success=False,
                    function_name="log_feeding",
                    result_data={},
                    message="Pet not found or access denied",
                    error="Pet not found"
                )
            
            # Use current time if not specified
            if feeding_time is None:
                feeding_time = datetime.now(timezone.utc)
            
            # Create feeding log entry
            feeding_log = FeedingLog(
                pet_id=uuid.UUID(pet_id),
                feeding_time=feeding_time,
                food_type=food_type,
                amount=amount,
                completed=True,
                notes=notes
            )
            
            self.db.add(feeding_log)
            await self.db.commit()
            await self.db.refresh(feeding_log)
            
            # Get recent feeding history for context
            recent_feedings_result = await self.db.execute(
                select(FeedingLog)
                .where(FeedingLog.pet_id == uuid.UUID(pet_id))
                .where(FeedingLog.feeding_time >= datetime.now(timezone.utc) - timedelta(days=7))
                .order_by(desc(FeedingLog.feeding_time))
                .limit(5)
            )
            recent_feedings = recent_feedings_result.scalars().all()
            
            result_data = {
                "pet_name": pet.name,
                "feeding_logged": {
                    "id": str(feeding_log.id),
                    "food_type": food_type,
                    "amount": amount,
                    "feeding_time": feeding_time.isoformat(),
                    "notes": notes
                },
                "recent_feedings": [
                    {
                        "food_type": f.food_type,
                        "amount": f.amount,
                        "feeding_time": f.feeding_time.isoformat(),
                        "notes": f.notes
                    }
                    for f in recent_feedings
                ],
                "total_feedings_this_week": len(recent_feedings)
            }
            
            message = f"✅ Feeding logged for {pet.name}: {amount} of {food_type}"
            if feeding_time.date() != datetime.now(timezone.utc).date():
                message += f" on {feeding_time.strftime('%B %d')}"
            
            return AssistantFunctionResult(
                success=True,
                function_name="log_feeding",
                result_data=result_data,
                message=message
            )
            
        except Exception as e:
            logger.error(f"Error logging feeding: {e}")
            return AssistantFunctionResult(
                success=False,
                function_name="log_feeding",
                result_data={},
                message="Failed to log feeding",
                error=str(e)
            )
    
    async def find_emergency_vet(
        self,
        latitude: float,
        longitude: float,
        radius_miles: float = 25.0,
        user_location: Optional[str] = None
    ) -> AssistantFunctionResult:
        """
        Find emergency veterinary clinics near the user's location.
        
        Args:
            latitude: User's latitude
            longitude: User's longitude
            radius_miles: Search radius in miles
            user_location: Optional human-readable location description
            
        Returns:
            AssistantFunctionResult with emergency vet locations
        """
        try:
            from app.services.maps_service import maps_service
            
            # First try to get emergency vets from local database
            local_vets = await self._get_local_emergency_vets(latitude, longitude, radius_miles)
            
            # Try to get emergency vets from Google Maps API
            google_vets = []
            try:
                if maps_service.is_available():
                    google_vet_locations = await maps_service.find_emergency_vets(
                        latitude, longitude, radius_miles
                    )
                    # Convert EmergencyVetLocation objects to dictionaries
                    google_vets = [vet.to_dict() for vet in google_vet_locations]
                else:
                    logger.warning("Google Maps API not available, using local database only")
            except Exception as e:
                logger.error(f"Google Maps API search failed: {e}, falling back to cached results")
                # Use cached emergency vets as fallback
                try:
                    cached_vet_locations = await maps_service.get_cached_emergency_vets(
                        latitude, longitude, radius_miles
                    )
                    google_vets = [vet.to_dict() for vet in cached_vet_locations]
                except Exception as cache_error:
                    logger.error(f"Cached emergency vets also failed: {cache_error}")
                    google_vets = []
            
            # Combine and deduplicate results
            all_vets = self._combine_vet_results(local_vets, google_vets)
            
            # Sort by distance
            user_location_coords = (latitude, longitude)
            for vet in all_vets:
                if vet.get("latitude") and vet.get("longitude"):
                    vet_coords = (vet["latitude"], vet["longitude"])
                    vet["distance_miles"] = round(geodesic(user_location_coords, vet_coords).miles, 1)
                else:
                    vet["distance_miles"] = 999  # Unknown distance
            
            all_vets.sort(key=lambda x: x["distance_miles"])
            
            # Limit to top 10 results
            top_vets = all_vets[:10]
            
            if not top_vets:
                return AssistantFunctionResult(
                    success=True,
                    function_name="find_emergency_vet",
                    result_data={"emergency_vets": []},
                    message="No emergency veterinary clinics found in your area. Please contact your regular veterinarian or search online for the nearest emergency clinic."
                )
            
            # Create message with top 3 closest vets
            message_parts = ["🚨 Emergency veterinary clinics near you:"]
            for i, vet in enumerate(top_vets[:3], 1):
                distance_text = f"{vet['distance_miles']} miles" if vet['distance_miles'] < 999 else "distance unknown"
                message_parts.append(f"{i}. {vet['name']} - {distance_text}")
                if vet.get("phone"):
                    message_parts.append(f"   📞 {vet['phone']}")
                if vet.get("address"):
                    message_parts.append(f"   📍 {vet['address']}")
                if vet.get("is_24_hour"):
                    message_parts.append(f"   🕐 24-hour service")
                if vet.get("rating"):
                    message_parts.append(f"   ⭐ {vet['rating']}/5.0")
            
            if len(top_vets) > 3:
                message_parts.append(f"...and {len(top_vets) - 3} more clinics found")
            
            result_data = {
                "user_location": user_location or f"{latitude}, {longitude}",
                "search_radius_miles": radius_miles,
                "emergency_vets": top_vets,
                "total_found": len(all_vets),
                "search_timestamp": datetime.now(timezone.utc).isoformat(),
                "google_maps_used": maps_service.is_available()
            }
            
            return AssistantFunctionResult(
                success=True,
                function_name="find_emergency_vet",
                result_data=result_data,
                message="\n".join(message_parts)
            )
            
        except Exception as e:
            logger.error(f"Error finding emergency vets: {e}")
            return AssistantFunctionResult(
                success=False,
                function_name="find_emergency_vet",
                result_data={},
                message="Failed to find emergency veterinary clinics. Please contact your regular veterinarian or call a local emergency clinic.",
                error=str(e)
            )
    
    async def check_toxic_substance(
        self,
        substance_name: str,
        pet_species: str,
        amount_consumed: Optional[str] = None,
        pet_weight: Optional[float] = None
    ) -> AssistantFunctionResult:
        """
        Check if a substance is toxic to pets and provide safety guidance.
        
        Args:
            substance_name: Name of the substance consumed
            pet_species: Species of the pet (dog, cat, etc.)
            amount_consumed: Optional amount consumed
            pet_weight: Optional pet weight for dosage calculations
            
        Returns:
            AssistantFunctionResult with toxicity information and guidance
        """
        try:
            # Get toxicity information from knowledge base
            toxicity_info = self._get_toxicity_information(substance_name, pet_species)
            
            # Determine urgency level
            urgency_level = self._assess_toxicity_urgency(
                substance_name, pet_species, amount_consumed, pet_weight, toxicity_info
            )
            
            # Create appropriate response based on urgency
            if urgency_level == "EMERGENCY":
                message = f"🚨 EMERGENCY: {substance_name} is highly toxic to {pet_species}s!"
                guidance = [
                    "Contact emergency veterinarian IMMEDIATELY",
                    "Do NOT induce vomiting unless specifically instructed by a vet",
                    "Bring the substance packaging with you to the vet",
                    "Monitor your pet closely for symptoms"
                ]
                
            elif urgency_level == "URGENT":
                message = f"⚠️ URGENT: {substance_name} can be harmful to {pet_species}s"
                guidance = [
                    "Contact your veterinarian within the next few hours",
                    "Monitor your pet for symptoms",
                    "Keep the substance packaging for reference",
                    "Do not give any home remedies without vet approval"
                ]
                
            elif urgency_level == "CAUTION":
                message = f"⚠️ CAUTION: {substance_name} may cause mild issues in {pet_species}s"
                guidance = [
                    "Monitor your pet for any unusual symptoms",
                    "Contact your vet if symptoms develop",
                    "Ensure your pet has access to fresh water",
                    "Note the time and amount consumed"
                ]
                
            else:  # LOW or SAFE
                message = f"✅ {substance_name} is generally safe for {pet_species}s in small amounts"
                guidance = [
                    "Continue to monitor your pet",
                    "Contact your vet if any unusual symptoms develop",
                    "Keep harmful substances out of reach in the future"
                ]
            
            # Add specific symptoms to watch for
            symptoms_to_watch = toxicity_info.get("symptoms", [])
            if symptoms_to_watch:
                guidance.append(f"Watch for these symptoms: {', '.join(symptoms_to_watch)}")
            
            result_data = {
                "substance_name": substance_name,
                "pet_species": pet_species,
                "amount_consumed": amount_consumed,
                "pet_weight": pet_weight,
                "urgency_level": urgency_level,
                "toxicity_info": toxicity_info,
                "guidance": guidance,
                "symptoms_to_watch": symptoms_to_watch,
                "assessment_timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            return AssistantFunctionResult(
                success=True,
                function_name="check_toxic_substance",
                result_data=result_data,
                message=message + "\n\nGuidance:\n" + "\n".join(f"• {g}" for g in guidance)
            )
            
        except Exception as e:
            logger.error(f"Error checking toxic substance: {e}")
            return AssistantFunctionResult(
                success=False,
                function_name="check_toxic_substance",
                result_data={},
                message="Failed to check substance toxicity. If you suspect poisoning, contact your veterinarian or emergency clinic immediately.",
                error=str(e)
            )
    
    async def _get_local_emergency_vets(
        self,
        latitude: float,
        longitude: float,
        radius_miles: float
    ) -> List[Dict[str, Any]]:
        """Get emergency vets from local database."""
        try:
            result = await self.db.execute(
                select(VetClinic).where(
                    and_(
                        VetClinic.is_emergency == True,
                        VetClinic.latitude.isnot(None),
                        VetClinic.longitude.isnot(None)
                    )
                )
            )
            clinics = result.scalars().all()
            
            # Filter by distance
            user_coords = (latitude, longitude)
            nearby_clinics = []
            
            for clinic in clinics:
                clinic_coords = (clinic.latitude, clinic.longitude)
                distance = geodesic(user_coords, clinic_coords).miles
                
                if distance <= radius_miles:
                    nearby_clinics.append({
                        "name": clinic.name,
                        "address": clinic.address,
                        "phone": clinic.phone_number,
                        "latitude": clinic.latitude,
                        "longitude": clinic.longitude,
                        "is_24_hour": clinic.is_24_hour,
                        "services": clinic.services_offered,
                        "source": "local_database"
                    })
            
            return nearby_clinics
            
        except Exception as e:
            logger.error(f"Error getting local emergency vets: {e}")
            return []
    
    def _combine_vet_results(
        self,
        local_vets: List[Dict[str, Any]],
        google_vets: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Combine and deduplicate vet results from different sources."""
        combined = []
        seen_names = set()
        
        # Add local vets first (they have more complete data)
        for vet in local_vets:
            name_key = vet["name"].lower().strip()
            if name_key not in seen_names:
                combined.append(vet)
                seen_names.add(name_key)
        
        # Add Google vets that aren't duplicates
        for vet in google_vets:
            name_key = vet["name"].lower().strip()
            if name_key not in seen_names:
                combined.append(vet)
                seen_names.add(name_key)
        
        return combined
    
    def _get_toxicity_information(
        self,
        substance_name: str,
        pet_species: str
    ) -> Dict[str, Any]:
        """Get toxicity information from knowledge base."""
        # Comprehensive toxicity database
        toxicity_db = {
            "chocolate": {
                "toxic_to": ["dog", "cat"],
                "severity": "HIGH",
                "symptoms": ["vomiting", "diarrhea", "increased heart rate", "seizures"],
                "notes": "Dark chocolate and baking chocolate are most dangerous"
            },
            "grapes": {
                "toxic_to": ["dog"],
                "severity": "HIGH",
                "symptoms": ["vomiting", "diarrhea", "kidney failure"],
                "notes": "Even small amounts can be dangerous"
            },
            "raisins": {
                "toxic_to": ["dog"],
                "severity": "HIGH",
                "symptoms": ["vomiting", "diarrhea", "kidney failure"],
                "notes": "Even small amounts can be dangerous"
            },
            "onions": {
                "toxic_to": ["dog", "cat"],
                "severity": "MEDIUM",
                "symptoms": ["anemia", "weakness", "pale gums"],
                "notes": "Can cause red blood cell damage"
            },
            "garlic": {
                "toxic_to": ["dog", "cat"],
                "severity": "MEDIUM",
                "symptoms": ["anemia", "weakness", "pale gums"],
                "notes": "More potent than onions"
            },
            "xylitol": {
                "toxic_to": ["dog"],
                "severity": "HIGH",
                "symptoms": ["vomiting", "loss of coordination", "lethargy", "collapse"],
                "notes": "Artificial sweetener - extremely dangerous for dogs"
            },
            "alcohol": {
                "toxic_to": ["dog", "cat"],
                "severity": "HIGH",
                "symptoms": ["vomiting", "diarrhea", "difficulty breathing", "coma"],
                "notes": "Even small amounts can be dangerous"
            },
            "caffeine": {
                "toxic_to": ["dog", "cat"],
                "severity": "MEDIUM",
                "symptoms": ["restlessness", "rapid breathing", "heart palpitations"],
                "notes": "Found in coffee, tea, energy drinks"
            },
            "macadamia nuts": {
                "toxic_to": ["dog"],
                "severity": "MEDIUM",
                "symptoms": ["weakness", "vomiting", "tremors", "hyperthermia"],
                "notes": "Specific to dogs"
            }
        }
        
        # Search for substance (case-insensitive, partial matches)
        substance_lower = substance_name.lower()
        
        for key, info in toxicity_db.items():
            if key in substance_lower or substance_lower in key:
                return info
        
        # Default response for unknown substances
        return {
            "toxic_to": ["unknown"],
            "severity": "UNKNOWN",
            "symptoms": ["monitor for any unusual behavior"],
            "notes": "Toxicity information not available in database"
        }
    
    def _assess_toxicity_urgency(
        self,
        substance_name: str,
        pet_species: str,
        amount_consumed: Optional[str],
        pet_weight: Optional[float],
        toxicity_info: Dict[str, Any]
    ) -> str:
        """Assess the urgency level based on toxicity information."""
        
        # Check if substance is toxic to this species
        toxic_to = toxicity_info.get("toxic_to", [])
        if pet_species.lower() not in toxic_to and "unknown" not in toxic_to:
            return "LOW"
        
        # Check severity level
        severity = toxicity_info.get("severity", "UNKNOWN")
        
        if severity == "HIGH":
            return "EMERGENCY"
        elif severity == "MEDIUM":
            return "URGENT"
        elif severity == "LOW":
            return "CAUTION"
        else:
            # Unknown substance - err on the side of caution
            return "URGENT"


# Helper function to create service instance
def create_assistant_functions(db: AsyncSession) -> AssistantFunctions:
    """Create AssistantFunctions service instance."""
    return AssistantFunctions(db)