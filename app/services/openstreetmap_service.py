"""
OpenStreetMap (Nominatim) API integration service for vet clinic search.
Free alternative to Google Maps - no billing required.
"""

import logging
from typing import List, Dict, Optional, Any
import httpx
from datetime import datetime
import asyncio
from math import radians, cos, sin, asin, sqrt

logger = logging.getLogger(__name__)


class OpenStreetMapService:
    """
    Service for interacting with OpenStreetMap Nominatim API.
    
    Features:
    - Search for nearby vet clinics
    - Search vets by place name/address
    - Geocoding (address to coordinates)
    - Distance calculation
    
    Note: Free service with rate limit of 1 request/second
    """
    
    BASE_URL = "https://nominatim.openstreetmap.org"
    USER_AGENT = "PawPal-VetSearch/1.0"
    
    def __init__(self):
        """Initialize OpenStreetMap service."""
        self.cache = {}  # Simple in-memory cache
        self.last_request_time = 0
        
    async def _rate_limit(self):
        """Ensure we don't exceed 1 request per second."""
        current_time = datetime.now().timestamp()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < 1.0:
            await asyncio.sleep(1.0 - time_since_last)
        
        self.last_request_time = datetime.now().timestamp()
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two points using Haversine formula.
        Returns distance in kilometers.
        """
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        
        return round(c * r, 2)
    
    async def search_nearby_vets(
        self,
        lat: float,
        lng: float,
        radius: int = 5000
    ) -> List[Dict[str, Any]]:
        """
        Search for veterinary clinics near a location.
        
        Args:
            lat: Latitude
            lng: Longitude
            radius: Search radius in meters (default 5km)
            
        Returns:
            List of vet clinic dictionaries
        """
        try:
            await self._rate_limit()
            
            # Convert radius from meters to degrees (approximate)
            radius_deg = radius / 111000  # 1 degree ≈ 111km
            
            # Search for veterinary clinics using Overpass API (OSM data)
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Use Nominatim search with amenity=veterinary
                params = {
                    "format": "json",
                    "q": "veterinary",
                    "lat": lat,
                    "lon": lng,
                    "addressdetails": 1,
                    "limit": 50,
                    "bounded": 1,
                    "viewbox": f"{lng-radius_deg},{lat-radius_deg},{lng+radius_deg},{lat+radius_deg}"
                }
                
                headers = {"User-Agent": self.USER_AGENT}
                
                response = await client.get(
                    f"{self.BASE_URL}/search",
                    params=params,
                    headers=headers
                )
                
                if response.status_code != 200:
                    logger.error(f"Nominatim API error: {response.status_code}")
                    return []
                
                results = response.json()
                
                clinics = []
                for place in results:
                    place_lat = float(place.get("lat", 0))
                    place_lon = float(place.get("lon", 0))
                    
                    # Calculate distance
                    distance = self._calculate_distance(lat, lng, place_lat, place_lon)
                    
                    # Filter by radius
                    if distance <= (radius / 1000):  # Convert radius to km
                        clinic = self._format_place_data(place, (lat, lng))
                        clinics.append(clinic)
                
                # Sort by distance
                clinics.sort(key=lambda x: x.get('distance', float('inf')))
                
                return clinics[:20]  # Return top 20 results
                
        except Exception as e:
            logger.error(f"Error searching nearby vets: {e}")
            return []
    
    async def search_vets_by_place(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for veterinary clinics by place name, city, or address.
        
        Args:
            query: Search query (e.g., "vets in Mumbai", "veterinary clinic Bandra")
            
        Returns:
            List of vet clinic dictionaries
        """
        try:
            await self._rate_limit()
            
            # Add "veterinary" to query if not present
            if 'vet' not in query.lower() and 'veterinary' not in query.lower():
                query = f"veterinary clinic {query}"
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                params = {
                    "format": "json",
                    "q": query,
                    "addressdetails": 1,
                    "limit": 20
                }
                
                headers = {"User-Agent": self.USER_AGENT}
                
                response = await client.get(
                    f"{self.BASE_URL}/search",
                    params=params,
                    headers=headers
                )
                
                if response.status_code != 200:
                    logger.error(f"Nominatim API error: {response.status_code}")
                    return []
                
                results = response.json()
                
                clinics = []
                for place in results:
                    clinic = self._format_place_data(place)
                    clinics.append(clinic)
                
                return clinics
                
        except Exception as e:
            logger.error(f"Error searching vets by place: {e}")
            return []
    
    async def get_place_details(self, place_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a specific place.
        
        Args:
            place_id: OpenStreetMap place ID
            
        Returns:
            Detailed place information dictionary
        """
        # Check cache first
        if place_id in self.cache:
            cached_data = self.cache[place_id]
            # Cache valid for 24 hours
            if (datetime.now() - cached_data['cached_at']).seconds < 86400:
                return cached_data['data']
        
        try:
            await self._rate_limit()
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                params = {
                    "format": "json",
                    "addressdetails": 1,
                    "extratags": 1,
                    "namedetails": 1
                }
                
                headers = {"User-Agent": self.USER_AGENT}
                
                response = await client.get(
                    f"{self.BASE_URL}/lookup",
                    params={**params, "osm_ids": place_id},
                    headers=headers
                )
                
                if response.status_code != 200:
                    logger.error(f"Nominatim API error: {response.status_code}")
                    return None
                
                results = response.json()
                
                if not results:
                    return None
                
                details = self._format_place_details(results[0])
                
                # Cache the result
                self.cache[place_id] = {
                    'data': details,
                    'cached_at': datetime.now()
                }
                
                return details
                
        except Exception as e:
            logger.error(f"Error getting place details: {e}")
            return None
    
    async def get_place_autocomplete(
        self,
        input_text: str,
        location: Optional[tuple] = None,
        radius: int = 50000
    ) -> List[Dict[str, str]]:
        """
        Get autocomplete suggestions for place search.
        
        Args:
            input_text: User input text
            location: Optional (lat, lng) tuple to bias results
            radius: Search radius in meters for location bias
            
        Returns:
            List of autocomplete suggestions
        """
        try:
            await self._rate_limit()
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                params = {
                    "format": "json",
                    "q": input_text,
                    "addressdetails": 1,
                    "limit": 10
                }
                
                # Add location bias if provided
                if location:
                    params["lat"] = location[0]
                    params["lon"] = location[1]
                
                headers = {"User-Agent": self.USER_AGENT}
                
                response = await client.get(
                    f"{self.BASE_URL}/search",
                    params=params,
                    headers=headers
                )
                
                if response.status_code != 200:
                    logger.error(f"Nominatim API error: {response.status_code}")
                    return []
                
                results = response.json()
                
                suggestions = []
                for place in results:
                    suggestions.append({
                        'place_id': str(place.get('place_id')),
                        'description': place.get('display_name', ''),
                        'main_text': place.get('name', place.get('display_name', '').split(',')[0]),
                        'secondary_text': ', '.join(place.get('display_name', '').split(',')[1:])
                    })
                
                return suggestions
                
        except Exception as e:
            logger.error(f"Error getting autocomplete: {e}")
            return []
    
    def _format_place_data(
        self,
        place: Dict[str, Any],
        user_location: Optional[tuple] = None
    ) -> Dict[str, Any]:
        """Format place data into standardized clinic dictionary."""
        lat = float(place.get('lat', 0))
        lon = float(place.get('lon', 0))
        
        # Calculate distance if user location provided
        distance = None
        if user_location and lat and lon:
            distance = self._calculate_distance(user_location[0], user_location[1], lat, lon)
        
        # Extract address components
        address = place.get('address', {})
        display_name = place.get('display_name', '')
        
        # Get name
        name = place.get('name') or place.get('namedetails', {}).get('name') or 'Veterinary Clinic'
        
        # Build address string
        address_parts = []
        if address.get('road'):
            address_parts.append(address.get('road'))
        if address.get('suburb'):
            address_parts.append(address.get('suburb'))
        if address.get('city'):
            address_parts.append(address.get('city'))
        elif address.get('town'):
            address_parts.append(address.get('town'))
        if address.get('state'):
            address_parts.append(address.get('state'))
        if address.get('postcode'):
            address_parts.append(address.get('postcode'))
        
        formatted_address = ', '.join(address_parts) if address_parts else display_name
        
        # Extract phone if available
        extratags = place.get('extratags', {})
        phone = extratags.get('phone') or extratags.get('contact:phone')
        
        return {
            'place_id': str(place.get('place_id')),
            'name': name,
            'address': formatted_address,
            'location': {
                'lat': lat,
                'lng': lon
            },
            'rating': None,  # OSM doesn't provide ratings
            'user_ratings_total': None,
            'is_open_now': None,  # OSM doesn't provide real-time hours
            'distance': distance,
            'photos': [],  # OSM doesn't provide photos
            'phone': phone
        }
    
    def _format_place_details(self, place: Dict[str, Any]) -> Dict[str, Any]:
        """Format detailed place data."""
        lat = float(place.get('lat', 0))
        lon = float(place.get('lon', 0))
        
        # Extract address components
        address = place.get('address', {})
        display_name = place.get('display_name', '')
        
        # Get name
        name = place.get('name') or place.get('namedetails', {}).get('name') or 'Veterinary Clinic'
        
        # Build address string
        address_parts = []
        if address.get('road'):
            address_parts.append(address.get('road'))
        if address.get('suburb'):
            address_parts.append(address.get('suburb'))
        if address.get('city'):
            address_parts.append(address.get('city'))
        elif address.get('town'):
            address_parts.append(address.get('town'))
        if address.get('state'):
            address_parts.append(address.get('state'))
        if address.get('postcode'):
            address_parts.append(address.get('postcode'))
        
        formatted_address = ', '.join(address_parts) if address_parts else display_name
        
        # Extract contact info from extratags
        extratags = place.get('extratags', {})
        phone = extratags.get('phone') or extratags.get('contact:phone')
        website = extratags.get('website') or extratags.get('contact:website')
        opening_hours = extratags.get('opening_hours')
        
        # Format opening hours if available
        opening_hours_formatted = None
        if opening_hours:
            opening_hours_formatted = {
                'open_now': None,  # Can't determine without parsing
                'weekday_text': [opening_hours]  # Simple format
            }
        
        return {
            'place_id': str(place.get('place_id')),
            'name': name,
            'address': formatted_address,
            'phone': phone,
            'website': website,
            'rating': None,  # OSM doesn't provide ratings
            'user_ratings_total': None,
            'location': {
                'lat': lat,
                'lng': lon
            },
            'opening_hours': opening_hours_formatted,
            'photos': [],  # OSM doesn't provide photos
            'reviews': [],  # OSM doesn't provide reviews
            'types': [place.get('type', 'veterinary')]
        }
