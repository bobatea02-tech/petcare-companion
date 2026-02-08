"""
Maps API endpoints for emergency vet location services.
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

from app.services.maps_service import maps_service, MapsServiceError
from app.core.dependencies import get_current_user
from app.database.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/maps", tags=["maps"])


class LocationRequest(BaseModel):
    """Request model for location-based searches."""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    radius_miles: float = Field(25.0, gt=0, le=100, description="Search radius in miles")


class GeocodeRequest(BaseModel):
    """Request model for address geocoding."""
    address: str = Field(..., min_length=1, max_length=500, description="Address to geocode")


class EmergencyVetResponse(BaseModel):
    """Response model for emergency vet location."""
    name: str
    address: str
    latitude: float
    longitude: float
    phone: Optional[str] = None
    rating: Optional[float] = None
    is_24_hour: bool = False
    is_open_now: bool = False
    distance_miles: Optional[float] = None


class EmergencyVetsResponse(BaseModel):
    """Response model for emergency vet search results."""
    user_location: str
    search_radius_miles: float
    emergency_vets: List[EmergencyVetResponse]
    total_found: int
    google_maps_available: bool


class GeocodeResponse(BaseModel):
    """Response model for geocoding results."""
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    success: bool


@router.post("/emergency-vets", response_model=EmergencyVetsResponse)
async def find_emergency_vets(
    location_request: LocationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Find emergency veterinary clinics near the specified location.
    
    This endpoint uses Google Maps API to find emergency and 24-hour
    veterinary clinics within the specified radius.
    """
    try:
        # Find emergency vets using the maps service
        vet_locations = await maps_service.find_emergency_vets(
            latitude=location_request.latitude,
            longitude=location_request.longitude,
            radius_miles=location_request.radius_miles
        )
        
        # Convert to response format
        emergency_vets = [
            EmergencyVetResponse(
                name=vet.name,
                address=vet.address,
                latitude=vet.latitude,
                longitude=vet.longitude,
                phone=vet.phone,
                rating=vet.rating,
                is_24_hour=vet.is_24_hour,
                is_open_now=vet.is_open_now,
                distance_miles=vet.distance_miles
            )
            for vet in vet_locations
        ]
        
        return EmergencyVetsResponse(
            user_location=f"{location_request.latitude}, {location_request.longitude}",
            search_radius_miles=location_request.radius_miles,
            emergency_vets=emergency_vets,
            total_found=len(emergency_vets),
            google_maps_available=maps_service.is_available()
        )
        
    except MapsServiceError as e:
        logger.error(f"Maps service error: {e}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error finding emergency vets: {e}")
        raise HTTPException(status_code=500, detail="Failed to find emergency veterinary clinics")


@router.get("/emergency-vets", response_model=EmergencyVetsResponse)
async def find_emergency_vets_by_params(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude coordinate"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude coordinate"),
    radius_miles: float = Query(25.0, gt=0, le=100, description="Search radius in miles"),
    current_user: User = Depends(get_current_user)
):
    """
    Find emergency veterinary clinics using query parameters.
    
    Alternative endpoint that accepts location parameters as query strings
    instead of a request body.
    """
    location_request = LocationRequest(
        latitude=latitude,
        longitude=longitude,
        radius_miles=radius_miles
    )
    
    return await find_emergency_vets(location_request, current_user)


@router.post("/geocode", response_model=GeocodeResponse)
async def geocode_address(
    geocode_request: GeocodeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Convert an address to latitude/longitude coordinates.
    
    This endpoint uses Google Maps Geocoding API to convert
    human-readable addresses to coordinates.
    """
    try:
        if not maps_service.is_available():
            raise HTTPException(
                status_code=503, 
                detail="Google Maps API not available"
            )
        
        coordinates = await maps_service.geocode_address(geocode_request.address)
        
        if coordinates:
            latitude, longitude = coordinates
            return GeocodeResponse(
                address=geocode_request.address,
                latitude=latitude,
                longitude=longitude,
                success=True
            )
        else:
            return GeocodeResponse(
                address=geocode_request.address,
                latitude=None,
                longitude=None,
                success=False
            )
            
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
        raise HTTPException(status_code=500, detail="Failed to geocode address")


@router.post("/reverse-geocode")
async def reverse_geocode_coordinates(
    location_request: LocationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Convert latitude/longitude coordinates to a human-readable address.
    
    This endpoint uses Google Maps Reverse Geocoding API to convert
    coordinates to addresses.
    """
    try:
        if not maps_service.is_available():
            raise HTTPException(
                status_code=503,
                detail="Google Maps API not available"
            )
        
        address = await maps_service.reverse_geocode(
            location_request.latitude,
            location_request.longitude
        )
        
        return {
            "latitude": location_request.latitude,
            "longitude": location_request.longitude,
            "address": address,
            "success": address is not None
        }
        
    except Exception as e:
        logger.error(f"Reverse geocoding error: {e}")
        raise HTTPException(status_code=500, detail="Failed to reverse geocode coordinates")


@router.get("/health")
async def maps_health_check():
    """
    Check the health status of the Maps service.
    
    Returns information about Google Maps API availability
    and service status.
    """
    return {
        "service": "maps",
        "google_maps_available": maps_service.is_available(),
        "api_key_configured": maps_service.api_key is not None,
        "status": "healthy" if maps_service.is_available() else "limited"
    }