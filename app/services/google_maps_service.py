"""
Google Maps API integration service for vet clinic search and location services.
"""

import os
import logging
from typing import List, Dict, Optional, Any
import googlemaps
from datetime import datetime

logger = logging.getLogger(__name__)


class GoogleMapsService:
    """
    Service for interacting with Google Maps APIs.
    
    Features:
    - Search for nearby vet clinics
    - Search vets by place name/address
    - Get detailed place information
    - Autocomplete for place searches
    - Calculate distances between locations
    """
    
    def __init__(self):
        """Initialize Google Maps client."""
        self.api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_MAPS_API_KEY not found in environment variables")
        
        self.client = googlemaps.Client(key=self.api_key)
        self.cache = {}  # Simple in-memory cache for place details
    
    def search_nearby_vets(
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
            location = (lat, lng)
            places_result = self.client.places_nearby(
                location=location,
                radius=radius,
                type='veterinary_care',
                keyword='vet clinic veterinary'
            )
            
            clinics = []
            for place in places_result.get('results', []):
                clinic = self._format_place_data(place, location)
                clinics.append(clinic)
            
            # Sort by distance
            clinics.sort(key=lambda x: x.get('distance', float('inf')))
            
            return clinics
        except Exception as e:
            logger.error(f"Error searching nearby vets: {e}")
            return []
    
    def search_vets_by_place(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for veterinary clinics by place name, city, or address.
        
        Args:
            query: Search query (e.g., "vets in Mumbai", "veterinary clinic Bandra")
            
        Returns:
            List of vet clinic dictionaries
        """
        try:
            # Add "veterinary" to query if not present
            if 'vet' not in query.lower() and 'veterinary' not in query.lower():
                query = f"veterinary clinic {query}"
            
            places_result = self.client.places(
                query=query,
                type='veterinary_care'
            )
            
            clinics = []
            for place in places_result.get('results', []):
                clinic = self._format_place_data(place)
                clinics.append(clinic)
            
            return clinics
        except Exception as e:
            logger.error(f"Error searching vets by place: {e}")
            return []
    
    def get_place_details(self, place_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a specific place.
        
        Args:
            place_id: Google Place ID
            
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
            place_result = self.client.place(
                place_id=place_id,
                fields=[
                    'name', 'formatted_address', 'formatted_phone_number',
                    'website', 'rating', 'user_ratings_total', 'opening_hours',
                    'geometry', 'photos', 'reviews', 'types'
                ]
            )
            
            result = place_result.get('result', {})
            details = self._format_place_details(result)
            
            # Cache the result
            self.cache[place_id] = {
                'data': details,
                'cached_at': datetime.now()
            }
            
            return details
        except Exception as e:
            logger.error(f"Error getting place details: {e}")
            return None
    
    def get_place_autocomplete(
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
            autocomplete_result = self.client.places_autocomplete(
                input_text=input_text,
                location=location,
                radius=radius,
                types=['establishment', 'geocode']
            )
            
            suggestions = []
            for prediction in autocomplete_result:
                suggestions.append({
                    'place_id': prediction.get('place_id'),
                    'description': prediction.get('description'),
                    'main_text': prediction.get('structured_formatting', {}).get('main_text'),
                    'secondary_text': prediction.get('structured_formatting', {}).get('secondary_text')
                })
            
            return suggestions
        except Exception as e:
            logger.error(f"Error getting autocomplete: {e}")
            return []
    
    def calculate_distance(
        self,
        origin: tuple,
        destination: tuple
    ) -> Optional[float]:
        """
        Calculate distance between two locations.
        
        Args:
            origin: (lat, lng) tuple
            destination: (lat, lng) tuple
            
        Returns:
            Distance in kilometers
        """
        try:
            distance_result = self.client.distance_matrix(
                origins=[origin],
                destinations=[destination],
                mode='driving',
                units='metric'
            )
            
            if distance_result['rows']:
                element = distance_result['rows'][0]['elements'][0]
                if element['status'] == 'OK':
                    # Distance in meters, convert to km
                    distance_meters = element['distance']['value']
                    return round(distance_meters / 1000, 2)
            
            return None
        except Exception as e:
            logger.error(f"Error calculating distance: {e}")
            return None
    
    def _format_place_data(
        self,
        place: Dict[str, Any],
        user_location: Optional[tuple] = None
    ) -> Dict[str, Any]:
        """Format place data into standardized clinic dictionary."""
        location = place.get('geometry', {}).get('location', {})
        lat = location.get('lat')
        lng = location.get('lng')
        
        # Calculate distance if user location provided
        distance = None
        if user_location and lat and lng:
            distance = self.calculate_distance(user_location, (lat, lng))
        
        # Get photo reference
        photos = []
        if place.get('photos'):
            for photo in place.get('photos', [])[:3]:  # Max 3 photos
                photo_ref = photo.get('photo_reference')
                if photo_ref:
                    photos.append(photo_ref)
        
        # Check if open now
        is_open_now = None
        opening_hours = place.get('opening_hours', {})
        if 'open_now' in opening_hours:
            is_open_now = opening_hours.get('open_now')
        
        return {
            'place_id': place.get('place_id'),
            'name': place.get('name'),
            'address': place.get('vicinity') or place.get('formatted_address'),
            'location': {
                'lat': lat,
                'lng': lng
            },
            'rating': place.get('rating'),
            'user_ratings_total': place.get('user_ratings_total'),
            'is_open_now': is_open_now,
            'distance': distance,
            'photos': photos
        }
    
    def _format_place_details(self, place: Dict[str, Any]) -> Dict[str, Any]:
        """Format detailed place data."""
        location = place.get('geometry', {}).get('location', {})
        
        # Format opening hours
        opening_hours = None
        if place.get('opening_hours'):
            opening_hours = {
                'open_now': place['opening_hours'].get('open_now'),
                'weekday_text': place['opening_hours'].get('weekday_text', [])
            }
        
        # Get photo references
        photos = []
        if place.get('photos'):
            for photo in place.get('photos', [])[:5]:  # Max 5 photos
                photo_ref = photo.get('photo_reference')
                if photo_ref:
                    photos.append(photo_ref)
        
        # Get reviews
        reviews = []
        if place.get('reviews'):
            for review in place.get('reviews', [])[:3]:  # Max 3 reviews
                reviews.append({
                    'author_name': review.get('author_name'),
                    'rating': review.get('rating'),
                    'text': review.get('text'),
                    'time': review.get('time')
                })
        
        return {
            'place_id': place.get('place_id'),
            'name': place.get('name'),
            'address': place.get('formatted_address'),
            'phone': place.get('formatted_phone_number'),
            'website': place.get('website'),
            'rating': place.get('rating'),
            'user_ratings_total': place.get('user_ratings_total'),
            'location': {
                'lat': location.get('lat'),
                'lng': location.get('lng')
            },
            'opening_hours': opening_hours,
            'photos': photos,
            'reviews': reviews,
            'types': place.get('types', [])
        }
