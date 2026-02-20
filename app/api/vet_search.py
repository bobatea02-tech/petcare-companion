"""
API endpoints for vet clinic search using OpenStreetMap (Nominatim).
Free alternative - no billing required.
Public endpoints - no authentication required.
"""

from fastapi import APIRouter, HTTPException
from typing import List
from app.services.openstreetmap_service import OpenStreetMapService
from app.schemas.vet_search import (
    VetClinicSchema,
    VetClinicDetailSchema,
    NearbySearchRequest,
    PlaceSearchRequest,
    AutocompleteRequest,
    AutocompleteSuggestion
)

router = APIRouter(prefix="/vets", tags=["Vet Search"])


@router.post("/search/nearby", response_model=List[VetClinicSchema])
async def search_nearby_vets(
    request: NearbySearchRequest
):
    """
    Search for veterinary clinics near a location using OpenStreetMap.
    
    Public endpoint - no authentication required.
    """
    try:
        maps_service = OpenStreetMapService()
        clinics = await maps_service.search_nearby_vets(
            lat=request.lat,
            lng=request.lng,
            radius=request.radius
        )
        return clinics
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to search for vet clinics")


@router.post("/search/place", response_model=List[VetClinicSchema])
async def search_vets_by_place(
    request: PlaceSearchRequest
):
    """
    Search for veterinary clinics by place name, city, or address using OpenStreetMap.
    
    Public endpoint - no authentication required.
    """
    try:
        maps_service = OpenStreetMapService()
        clinics = await maps_service.search_vets_by_place(query=request.query)
        return clinics
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to search for vet clinics")


@router.get("/{place_id}", response_model=VetClinicDetailSchema)
async def get_vet_details(
    place_id: str
):
    """
    Get detailed information about a specific vet clinic using OpenStreetMap.
    
    Public endpoint - no authentication required.
    """
    try:
        maps_service = OpenStreetMapService()
        details = await maps_service.get_place_details(place_id=place_id)
        
        if not details:
            raise HTTPException(status_code=404, detail="Vet clinic not found")
        
        return details
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get vet clinic details")


@router.post("/autocomplete", response_model=List[AutocompleteSuggestion])
async def get_place_autocomplete(
    request: AutocompleteRequest
):
    """
    Get autocomplete suggestions for place search using OpenStreetMap.
    
    Public endpoint - no authentication required.
    """
    try:
        maps_service = OpenStreetMapService()
        
        location = None
        if request.lat and request.lng:
            location = (request.lat, request.lng)
        
        suggestions = await maps_service.get_place_autocomplete(
            input_text=request.input,
            location=location,
            radius=request.radius
        )
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get autocomplete suggestions")
