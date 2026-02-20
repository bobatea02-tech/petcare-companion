"""
Pydantic schemas for vet search and clinic data.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class LocationSchema(BaseModel):
    """Geographic location."""
    lat: float = Field(..., description="Latitude")
    lng: float = Field(..., description="Longitude")


class OpeningHoursSchema(BaseModel):
    """Clinic opening hours."""
    open_now: Optional[bool] = Field(None, description="Whether clinic is currently open")
    weekday_text: List[str] = Field(default_factory=list, description="Opening hours text for each day")


class ReviewSchema(BaseModel):
    """Clinic review."""
    author_name: str
    rating: int
    text: str
    time: int


class VetClinicSchema(BaseModel):
    """Basic vet clinic information."""
    place_id: str
    name: str
    address: str
    location: LocationSchema
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    is_open_now: Optional[bool] = None
    distance: Optional[float] = Field(None, description="Distance in kilometers")
    photos: List[str] = Field(default_factory=list, description="Photo references")


class VetClinicDetailSchema(VetClinicSchema):
    """Detailed vet clinic information."""
    phone: Optional[str] = None
    website: Optional[str] = None
    opening_hours: Optional[OpeningHoursSchema] = None
    reviews: List[ReviewSchema] = Field(default_factory=list)
    types: List[str] = Field(default_factory=list)


class NearbySearchRequest(BaseModel):
    """Request for nearby vet search."""
    lat: float
    lng: float
    radius: int = Field(default=5000, ge=100, le=50000, description="Search radius in meters")


class PlaceSearchRequest(BaseModel):
    """Request for place-based vet search."""
    query: str = Field(..., min_length=2, description="Search query")


class AutocompleteRequest(BaseModel):
    """Request for place autocomplete."""
    input: str = Field(..., min_length=2, description="Input text")
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius: int = Field(default=50000, description="Bias radius in meters")


class AutocompleteSuggestion(BaseModel):
    """Autocomplete suggestion."""
    place_id: str
    description: str
    main_text: Optional[str] = None
    secondary_text: Optional[str] = None
