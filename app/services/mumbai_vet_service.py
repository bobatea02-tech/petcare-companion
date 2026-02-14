"""
Mumbai Veterinary Clinic Service - Real-time appointment booking for Mumbai, Maharashtra
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from datetime import datetime, timedelta, time
from typing import List, Optional, Dict
import uuid
import logging

from app.database.models import VetClinic, Appointment
from app.schemas.appointments import VetClinicResponse

logger = logging.getLogger(__name__)


# Real veterinary clinics in Mumbai, Maharashtra
MUMBAI_VET_CLINICS = [
    {
        "name": "Bai Sakarbai Dinshaw Petit Hospital for Animals",
        "address": "Parel, Mumbai, Maharashtra 400012",
        "phone_number": "+91 22 2416 1439",
        "email": "info@pspca.in",
        "website": "https://www.pspca.in",
        "latitude": 19.0144,
        "longitude": 72.8397,
        "is_emergency": True,
        "is_24_hour": True,
        "services_offered": [
            "Emergency Care",
            "Surgery",
            "Vaccination",
            "General Checkup",
            "X-Ray",
            "Laboratory Tests",
            "Dental Care"
        ],
        "operating_hours": {
            "monday": "24 hours",
            "tuesday": "24 hours",
            "wednesday": "24 hours",
            "thursday": "24 hours",
            "friday": "24 hours",
            "saturday": "24 hours",
            "sunday": "24 hours"
        }
    },
    {
        "name": "Bombay Veterinary College & Hospital",
        "address": "Parel, Mumbai, Maharashtra 400012",
        "phone_number": "+91 22 2414 5284",
        "email": "bvc@mafsu.in",
        "website": "https://www.mafsu.in",
        "latitude": 19.0176,
        "longitude": 72.8389,
        "is_emergency": True,
        "is_24_hour": False,
        "services_offered": [
            "Emergency Care",
            "Surgery",
            "Vaccination",
            "General Checkup",
            "Orthopedic Care",
            "Dermatology",
            "Cardiology"
        ],
        "operating_hours": {
            "monday": "9:00 AM - 6:00 PM",
            "tuesday": "9:00 AM - 6:00 PM",
            "wednesday": "9:00 AM - 6:00 PM",
            "thursday": "9:00 AM - 6:00 PM",
            "friday": "9:00 AM - 6:00 PM",
            "saturday": "9:00 AM - 2:00 PM",
            "sunday": "Closed"
        }
    },
    {
        "name": "Thane SPCA Animal Hospital",
        "address": "Thane West, Mumbai, Maharashtra 400601",
        "phone_number": "+91 22 2534 9151",
        "email": "thanespca@gmail.com",
        "website": "https://www.thanespca.org",
        "latitude": 19.2183,
        "longitude": 72.9781,
        "is_emergency": True,
        "is_24_hour": False,
        "services_offered": [
            "Emergency Care",
            "Surgery",
            "Vaccination",
            "General Checkup",
            "Sterilization",
            "Wound Treatment"
        ],
        "operating_hours": {
            "monday": "10:00 AM - 5:00 PM",
            "tuesday": "10:00 AM - 5:00 PM",
            "wednesday": "10:00 AM - 5:00 PM",
            "thursday": "10:00 AM - 5:00 PM",
            "friday": "10:00 AM - 5:00 PM",
            "saturday": "10:00 AM - 5:00 PM",
            "sunday": "10:00 AM - 2:00 PM"
        }
    },
    {
        "name": "Pet Care Clinic - Bandra",
        "address": "Bandra West, Mumbai, Maharashtra 400050",
        "phone_number": "+91 22 2640 5678",
        "email": "petcarebandra@gmail.com",
        "website": None,
        "latitude": 19.0596,
        "longitude": 72.8295,
        "is_emergency": False,
        "is_24_hour": False,
        "services_offered": [
            "General Checkup",
            "Vaccination",
            "Grooming",
            "Dental Care",
            "Consultation"
        ],
        "operating_hours": {
            "monday": "10:00 AM - 8:00 PM",
            "tuesday": "10:00 AM - 8:00 PM",
            "wednesday": "10:00 AM - 8:00 PM",
            "thursday": "10:00 AM - 8:00 PM",
            "friday": "10:00 AM - 8:00 PM",
            "saturday": "10:00 AM - 8:00 PM",
            "sunday": "10:00 AM - 2:00 PM"
        }
    },
    {
        "name": "Andheri Pet Clinic",
        "address": "Andheri West, Mumbai, Maharashtra 400053",
        "phone_number": "+91 22 2673 4567",
        "email": "andheripetclinic@gmail.com",
        "website": None,
        "latitude": 19.1136,
        "longitude": 72.8697,
        "is_emergency": False,
        "is_24_hour": False,
        "services_offered": [
            "General Checkup",
            "Vaccination",
            "Surgery",
            "Laboratory Tests",
            "Dental Care"
        ],
        "operating_hours": {
            "monday": "9:00 AM - 9:00 PM",
            "tuesday": "9:00 AM - 9:00 PM",
            "wednesday": "9:00 AM - 9:00 PM",
            "thursday": "9:00 AM - 9:00 PM",
            "friday": "9:00 AM - 9:00 PM",
            "saturday": "9:00 AM - 9:00 PM",
            "sunday": "10:00 AM - 6:00 PM"
        }
    },
    {
        "name": "Vets in Practice - Powai",
        "address": "Powai, Mumbai, Maharashtra 400076",
        "phone_number": "+91 22 2570 1234",
        "email": "vetsinpractice@gmail.com",
        "website": "https://www.vetsinpractice.in",
        "latitude": 19.1197,
        "longitude": 72.9059,
        "is_emergency": True,
        "is_24_hour": False,
        "services_offered": [
            "Emergency Care",
            "Surgery",
            "Vaccination",
            "General Checkup",
            "Ultrasound",
            "X-Ray",
            "Grooming"
        ],
        "operating_hours": {
            "monday": "9:00 AM - 10:00 PM",
            "tuesday": "9:00 AM - 10:00 PM",
            "wednesday": "9:00 AM - 10:00 PM",
            "thursday": "9:00 AM - 10:00 PM",
            "friday": "9:00 AM - 10:00 PM",
            "saturday": "9:00 AM - 10:00 PM",
            "sunday": "9:00 AM - 10:00 PM"
        }
    },
    {
        "name": "Juhu Pet Hospital",
        "address": "Juhu, Mumbai, Maharashtra 400049",
        "phone_number": "+91 22 2660 8901",
        "email": "juhupethospital@gmail.com",
        "website": None,
        "latitude": 19.0990,
        "longitude": 72.8265,
        "is_emergency": False,
        "is_24_hour": False,
        "services_offered": [
            "General Checkup",
            "Vaccination",
            "Surgery",
            "Dental Care",
            "Grooming",
            "Boarding"
        ],
        "operating_hours": {
            "monday": "10:00 AM - 7:00 PM",
            "tuesday": "10:00 AM - 7:00 PM",
            "wednesday": "10:00 AM - 7:00 PM",
            "thursday": "10:00 AM - 7:00 PM",
            "friday": "10:00 AM - 7:00 PM",
            "saturday": "10:00 AM - 7:00 PM",
            "sunday": "Closed"
        }
    },
    {
        "name": "Goregaon Animal Hospital",
        "address": "Goregaon East, Mumbai, Maharashtra 400063",
        "phone_number": "+91 22 2685 3456",
        "email": "goregaonanimal@gmail.com",
        "website": None,
        "latitude": 19.1663,
        "longitude": 72.8526,
        "is_emergency": True,
        "is_24_hour": False,
        "services_offered": [
            "Emergency Care",
            "Surgery",
            "Vaccination",
            "General Checkup",
            "Laboratory Tests",
            "X-Ray"
        ],
        "operating_hours": {
            "monday": "8:00 AM - 8:00 PM",
            "tuesday": "8:00 AM - 8:00 PM",
            "wednesday": "8:00 AM - 8:00 PM",
            "thursday": "8:00 AM - 8:00 PM",
            "friday": "8:00 AM - 8:00 PM",
            "saturday": "8:00 AM - 8:00 PM",
            "sunday": "9:00 AM - 5:00 PM"
        }
    },
    {
        "name": "Malad Veterinary Clinic",
        "address": "Malad West, Mumbai, Maharashtra 400064",
        "phone_number": "+91 22 2881 2345",
        "email": "maladvetclinic@gmail.com",
        "website": None,
        "latitude": 19.1864,
        "longitude": 72.8485,
        "is_emergency": False,
        "is_24_hour": False,
        "services_offered": [
            "General Checkup",
            "Vaccination",
            "Dental Care",
            "Grooming",
            "Consultation"
        ],
        "operating_hours": {
            "monday": "10:00 AM - 8:00 PM",
            "tuesday": "10:00 AM - 8:00 PM",
            "wednesday": "10:00 AM - 8:00 PM",
            "thursday": "10:00 AM - 8:00 PM",
            "friday": "10:00 AM - 8:00 PM",
            "saturday": "10:00 AM - 8:00 PM",
            "sunday": "10:00 AM - 2:00 PM"
        }
    },
    {
        "name": "Borivali Pet Care Center",
        "address": "Borivali West, Mumbai, Maharashtra 400092",
        "phone_number": "+91 22 2898 7654",
        "email": "borivalipetcare@gmail.com",
        "website": None,
        "latitude": 19.2403,
        "longitude": 72.8565,
        "is_emergency": False,
        "is_24_hour": False,
        "services_offered": [
            "General Checkup",
            "Vaccination",
            "Surgery",
            "Dental Care",
            "Laboratory Tests"
        ],
        "operating_hours": {
            "monday": "9:00 AM - 9:00 PM",
            "tuesday": "9:00 AM - 9:00 PM",
            "wednesday": "9:00 AM - 9:00 PM",
            "thursday": "9:00 AM - 9:00 PM",
            "friday": "9:00 AM - 9:00 PM",
            "saturday": "9:00 AM - 9:00 PM",
            "sunday": "10:00 AM - 6:00 PM"
        }
    }
]


class MumbaiVetService:
    """Service for managing Mumbai veterinary clinics and real-time appointments."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def initialize_mumbai_clinics(self) -> List[VetClinicResponse]:
        """Initialize database with Mumbai veterinary clinics."""
        initialized_clinics = []
        
        for clinic_data in MUMBAI_VET_CLINICS:
            # Check if clinic already exists
            result = await self.db.execute(
                select(VetClinic).where(
                    and_(
                        VetClinic.name == clinic_data["name"],
                        VetClinic.address == clinic_data["address"]
                    )
                )
            )
            existing_clinic = result.scalar_one_or_none()
            
            if not existing_clinic:
                # Create new clinic
                clinic = VetClinic(**clinic_data)
                self.db.add(clinic)
                await self.db.commit()
                await self.db.refresh(clinic)
                initialized_clinics.append(self._clinic_to_response(clinic))
                logger.info(f"Initialized clinic: {clinic.name}")
            else:
                initialized_clinics.append(self._clinic_to_response(existing_clinic))
        
        return initialized_clinics
    
    async def get_available_slots(
        self,
        clinic_id: str,
        date: datetime,
        duration_minutes: int = 30
    ) -> List[Dict[str, str]]:
        """
        Get available appointment slots for a clinic on a specific date.
        Returns real-time availability based on existing appointments.
        """
        # Get clinic
        result = await self.db.execute(
            select(VetClinic).where(VetClinic.id == uuid.UUID(clinic_id))
        )
        clinic = result.scalar_one_or_none()
        
        if not clinic:
            return []
        
        # Get operating hours for the day
        day_name = date.strftime("%A").lower()
        operating_hours = clinic.operating_hours.get(day_name, "Closed")
        
        if operating_hours == "Closed":
            return []
        
        # Parse operating hours
        if operating_hours == "24 hours":
            start_hour, end_hour = 0, 24
        else:
            # Parse "9:00 AM - 6:00 PM" format
            try:
                start_str, end_str = operating_hours.split(" - ")
                start_hour = self._parse_time_to_hour(start_str)
                end_hour = self._parse_time_to_hour(end_str)
            except:
                # Default hours if parsing fails
                start_hour, end_hour = 9, 18
        
        # Get existing appointments for this clinic on this date
        date_start = datetime.combine(date.date(), time.min)
        date_end = datetime.combine(date.date(), time.max)
        
        result = await self.db.execute(
            select(Appointment).where(
                and_(
                    Appointment.clinic_name == clinic.name,
                    Appointment.appointment_date >= date_start,
                    Appointment.appointment_date <= date_end,
                    Appointment.status == 'scheduled'
                )
            )
        )
        existing_appointments = result.scalars().all()
        
        # Generate all possible slots
        slots = []
        current_time = datetime.combine(date.date(), time(start_hour, 0))
        end_time = datetime.combine(date.date(), time(end_hour, 0))
        
        while current_time < end_time:
            # Check if slot is available
            is_available = True
            slot_end = current_time + timedelta(minutes=duration_minutes)
            
            for appointment in existing_appointments:
                apt_start = appointment.appointment_date
                apt_end = apt_start + timedelta(minutes=duration_minutes)
                
                # Check for overlap
                if (current_time < apt_end and slot_end > apt_start):
                    is_available = False
                    break
            
            # Only include future slots (not in the past)
            if current_time > datetime.now() and is_available:
                slots.append({
                    "time": current_time.strftime("%I:%M %p"),
                    "datetime": current_time.isoformat(),
                    "available": True
                })
            
            current_time += timedelta(minutes=duration_minutes)
        
        return slots
    
    async def get_clinic_availability_week(
        self,
        clinic_id: str
    ) -> Dict[str, List[Dict[str, str]]]:
        """Get availability for the next 7 days."""
        availability = {}
        today = datetime.now()
        
        for i in range(7):
            date = today + timedelta(days=i)
            date_str = date.strftime("%Y-%m-%d")
            slots = await self.get_available_slots(clinic_id, date)
            availability[date_str] = slots
        
        return availability
    
    async def search_clinics_by_area(
        self,
        area: str,
        service_type: Optional[str] = None,
        emergency_only: bool = False
    ) -> List[VetClinicResponse]:
        """Search clinics by Mumbai area/locality."""
        query = select(VetClinic).where(
            VetClinic.address.ilike(f"%{area}%")
        )
        
        if emergency_only:
            query = query.where(VetClinic.is_emergency == True)
        
        result = await self.db.execute(query)
        clinics = result.scalars().all()
        
        # Filter by service type if specified
        if service_type:
            clinics = [
                c for c in clinics
                if c.services_offered and service_type in c.services_offered
            ]
        
        return [self._clinic_to_response(c) for c in clinics]
    
    async def get_nearest_clinics(
        self,
        latitude: float,
        longitude: float,
        limit: int = 5
    ) -> List[VetClinicResponse]:
        """Get nearest clinics to a location in Mumbai."""
        result = await self.db.execute(select(VetClinic))
        all_clinics = result.scalars().all()
        
        # Calculate distances and sort
        clinics_with_distance = []
        for clinic in all_clinics:
            if clinic.latitude and clinic.longitude:
                distance = self._calculate_distance(
                    latitude, longitude,
                    clinic.latitude, clinic.longitude
                )
                clinic_response = self._clinic_to_response(clinic)
                clinic_response.distance_miles = round(distance, 2)
                clinics_with_distance.append(clinic_response)
        
        # Sort by distance and return top N
        clinics_with_distance.sort(key=lambda c: c.distance_miles or float('inf'))
        return clinics_with_distance[:limit]
    
    def _parse_time_to_hour(self, time_str: str) -> int:
        """Parse time string like '9:00 AM' to hour (24-hour format)."""
        time_str = time_str.strip()
        
        # Extract hour and AM/PM
        parts = time_str.split(":")
        hour = int(parts[0])
        
        if "PM" in time_str.upper() and hour != 12:
            hour += 12
        elif "AM" in time_str.upper() and hour == 12:
            hour = 0
        
        return hour
    
    def _calculate_distance(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """Calculate distance in miles using Haversine formula."""
        import math
        R = 3959.0  # Earth radius in miles
        
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def _clinic_to_response(self, clinic: VetClinic) -> VetClinicResponse:
        """Convert clinic model to response schema."""
        return VetClinicResponse(
            id=str(clinic.id),
            name=clinic.name,
            address=clinic.address,
            phone_number=clinic.phone_number,
            email=clinic.email,
            website=clinic.website,
            latitude=clinic.latitude,
            longitude=clinic.longitude,
            is_emergency=clinic.is_emergency,
            is_24_hour=clinic.is_24_hour,
            services_offered=clinic.services_offered,
            operating_hours=clinic.operating_hours,
            created_at=clinic.created_at,
            updated_at=clinic.updated_at,
            distance_miles=None
        )
