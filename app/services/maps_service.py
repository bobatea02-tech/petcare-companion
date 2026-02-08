"""
Google Maps API integration service for emergency vet location finding.

This service handles Google Maps API integration for finding emergency
veterinary clinics with geolocation and proximity search capabilities.
"""

import asyncio
import logging
from typing import Optional, Dict, Any, List, Tuple
import httpx
from geopy.distance import geodesic
from geopy.geocoders import GoogleV3
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log
)

from app.core.config import settings
from app.core.circuit_breaker import with_circuit_breaker, CircuitBreakerError
from app.core.error_monitoring import log_error, ErrorCategory, ErrorSeverity
from app.core.graceful_degradation import (
    set_service_degraded,
    set_service_unavailable,
    set_service_available
)

logger = logging.getLogger(__name__)


class MapsServiceError(Exception):
    """Custom exception for Maps service errors."""
    pass


class EmergencyVetLocation:
    """Data class for emergency vet location information."""
    
    def __init__(
        self,
        name: str,
        address: str,
        latitude: float,
        longitude: float,
        phone: Optional[str] = None,
        rating: Optional[float] = None,
        is_24_hour: bool = False,
        is_open_now: bool = False,
        place_id: Optional[str] = None,
        distance_miles: Optional[float] = None
    ):
        self.name = name
        self.address = address
        self.latitude = latitude
        self.longitude = longitude
        self.phone = phone
        self.rating = rating
        self.is_24_hour = is_24_hour
        self.is_open_now = is_open_now
        self.place_id = place_id
        self.distance_miles = distance_miles
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        return {
            "name": self.name,
            "address": self.address,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "phone": self.phone,
            "rating": self.rating,
            "is_24_hour": self.is_24_hour,
            "is_open_now": self.is_open_now,
            "place_id": self.place_id,
            "distance_miles": self.distance_miles
        }


class MapsService:
    """Service for Google Maps API integration and geolocation services."""
    
    def __init__(self):
        """Initialize Maps service with Google Maps API configuration."""
        self.api_key = settings.GOOGLE_MAPS_API_KEY
        self.geocoder = None
        
        if self.api_key:
            self.geocoder = GoogleV3(api_key=self.api_key)
        else:
            logger.warning("Google Maps API key not configured")
    
    def is_available(self) -> bool:
        """Check if Google Maps API is available."""
        return self.api_key is not None
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=8),
        retry=retry_if_exception_type((
            GeocoderTimedOut,
            GeocoderServiceError
        )),
        before_sleep=before_sleep_log(logger, logging.WARNING)
    )
    async def geocode_address(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Convert address to latitude/longitude coordinates.
        
        Includes retry logic with exponential backoff for transient failures.
        
        Args:
            address: Address string to geocode
            
        Returns:
            Tuple of (latitude, longitude) or None if geocoding fails
        """
        if not self.geocoder:
            logger.error("Google Maps API not configured for geocoding")
            return None
        
        try:
            # Run geocoding in thread pool to avoid blocking
            location = await asyncio.to_thread(
                self.geocoder.geocode,
                address,
                timeout=10
            )
            
            if location:
                logger.info(f"Successfully geocoded address: {address}")
                return (location.latitude, location.longitude)
            else:
                logger.warning(f"Could not geocode address: {address}")
                return None
                
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            logger.error(f"Geocoding error for address '{address}': {e}")
            raise  # Let retry decorator handle it
        except Exception as e:
            logger.error(f"Unexpected geocoding error: {e}")
            return None
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=8),
        retry=retry_if_exception_type((
            GeocoderTimedOut,
            GeocoderServiceError
        )),
        before_sleep=before_sleep_log(logger, logging.WARNING)
    )
    async def reverse_geocode(self, latitude: float, longitude: float) -> Optional[str]:
        """
        Convert coordinates to human-readable address.
        
        Includes retry logic with exponential backoff for transient failures.
        
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            
        Returns:
            Address string or None if reverse geocoding fails
        """
        if not self.geocoder:
            logger.error("Google Maps API not configured for reverse geocoding")
            return None
        
        try:
            # Run reverse geocoding in thread pool
            location = await asyncio.to_thread(
                self.geocoder.reverse,
                (latitude, longitude),
                timeout=10
            )
            
            if location:
                logger.info(f"Successfully reverse geocoded coordinates: ({latitude}, {longitude})")
                return location.address
            else:
                return None
                
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            logger.error(f"Reverse geocoding error for {latitude}, {longitude}: {e}")
            raise  # Let retry decorator handle it
        except Exception as e:
            logger.error(f"Unexpected reverse geocoding error: {e}")
            return None
    
    @with_circuit_breaker(
        name="google_maps",
        failure_threshold=5,
        timeout_seconds=60,
        half_open_max_calls=3,
        success_threshold=2
    )
    async def find_emergency_vets(
        self,
        latitude: float,
        longitude: float,
        radius_miles: float = 25.0
    ) -> List[EmergencyVetLocation]:
        """
        Find emergency veterinary clinics near the specified location.
        
        Args:
            latitude: Search center latitude
            longitude: Search center longitude
            radius_miles: Search radius in miles
            
        Returns:
            List of EmergencyVetLocation objects
        """
        if not self.api_key:
            logger.error("Google Maps API key not configured")
            await set_service_unavailable("google_maps", "API key not configured")
            raise MapsServiceError("Google Maps API not available")
        
        try:
            # Convert miles to meters for Google Maps API
            radius_meters = int(radius_miles * 1609.34)
            
            # Search for emergency veterinary clinics
            emergency_vets = await self._search_places(
                latitude=latitude,
                longitude=longitude,
                radius_meters=radius_meters,
                query="emergency veterinary clinic",
                place_type="veterinary_care"
            )
            
            # Also search for 24-hour veterinary clinics
            hour_vets = await self._search_places(
                latitude=latitude,
                longitude=longitude,
                radius_meters=radius_meters,
                query="24 hour veterinary clinic",
                place_type="veterinary_care"
            )
            
            # Combine and deduplicate results
            all_vets = self._combine_and_deduplicate_results(emergency_vets, hour_vets)
            
            # Calculate distances and sort by proximity
            user_coords = (latitude, longitude)
            for vet in all_vets:
                vet_coords = (vet.latitude, vet.longitude)
                vet.distance_miles = round(geodesic(user_coords, vet_coords).miles, 1)
            
            # Sort by distance and return top results
            all_vets.sort(key=lambda x: x.distance_miles)
            
            # Mark service as available on success
            await set_service_available("google_maps", "Maps service operating normally")
            
            return all_vets[:20]  # Return top 20 results
            
        except CircuitBreakerError as e:
            logger.error(f"Google Maps circuit breaker open: {e}")
            await log_error(e, ErrorCategory.EXTERNAL_SERVICE_ERROR, ErrorSeverity.CRITICAL)
            await set_service_unavailable("google_maps", "Circuit breaker open")
            # Return cached results as fallback
            logger.info("Returning cached emergency vet locations")
            return await self.get_cached_emergency_vets(latitude, longitude, radius_miles)
        except Exception as e:
            logger.error(f"Error finding emergency vets: {e}")
            await log_error(e, ErrorCategory.EXTERNAL_SERVICE_ERROR, ErrorSeverity.HIGH)
            await set_service_degraded(
                "google_maps",
                unavailable_features=["real_time_search"],
                message="Using cached emergency vet locations"
            )
            # Return cached results as fallback
            logger.info("Returning cached emergency vet locations due to error")
            return await self.get_cached_emergency_vets(latitude, longitude, radius_miles)
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((
            httpx.TimeoutException,
            httpx.ConnectError,
            httpx.RemoteProtocolError
        )),
        before_sleep=before_sleep_log(logger, logging.WARNING)
    )
    async def _search_places(
        self,
        latitude: float,
        longitude: float,
        radius_meters: int,
        query: str,
        place_type: str
    ) -> List[EmergencyVetLocation]:
        """
        Search for places using Google Maps Places API.
        
        Includes retry logic with exponential backoff for transient failures.
        
        Args:
            latitude: Search center latitude
            longitude: Search center longitude
            radius_meters: Search radius in meters
            query: Search query string
            place_type: Google Maps place type
            
        Returns:
            List of EmergencyVetLocation objects
        """
        results = []
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # First, do a nearby search
            response = await client.get(
                "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
                params={
                    "location": f"{latitude},{longitude}",
                    "radius": radius_meters,
                    "keyword": query,
                    "type": place_type,
                    "key": self.api_key
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Google Maps API error: {response.status_code} - {response.text}")
                return results
            
            data = response.json()
            
            if data.get("status") != "OK":
                logger.warning(f"Google Maps API status: {data.get('status')} - {data.get('error_message', '')}")
                return results
            
            # Process each place result
            for place in data.get("results", []):
                try:
                    # Get additional details for each place
                    place_details = await self._get_place_details(place["place_id"], client)
                    
                    # Create EmergencyVetLocation object
                    vet_location = EmergencyVetLocation(
                        name=place["name"],
                        address=place.get("vicinity", place.get("formatted_address", "")),
                        latitude=place["geometry"]["location"]["lat"],
                        longitude=place["geometry"]["location"]["lng"],
                        phone=place_details.get("formatted_phone_number"),
                        rating=place.get("rating"),
                        is_24_hour=self._check_if_24_hour(place_details),
                        is_open_now=place.get("opening_hours", {}).get("open_now", False),
                        place_id=place["place_id"]
                    )
                    
                    results.append(vet_location)
                    
                except Exception as e:
                    logger.warning(f"Error processing place {place.get('name', 'unknown')}: {e}")
                    continue
            
            # Handle pagination if there are more results
            next_page_token = data.get("next_page_token")
            if next_page_token and len(results) < 15:  # Limit total results
                await asyncio.sleep(2)  # Required delay for next page token
                additional_results = await self._get_next_page_results(next_page_token, client)
                results.extend(additional_results)
        
        return results
    
    async def _get_place_details(
        self,
        place_id: str,
        client: httpx.AsyncClient
    ) -> Dict[str, Any]:
        """
        Get detailed information about a specific place.
        
        Args:
            place_id: Google Maps place ID
            client: HTTP client instance
            
        Returns:
            Dictionary with place details
        """
        try:
            response = await client.get(
                "https://maps.googleapis.com/maps/api/place/details/json",
                params={
                    "place_id": place_id,
                    "fields": "formatted_phone_number,opening_hours,website,formatted_address",
                    "key": self.api_key
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "OK":
                    return data.get("result", {})
            
            return {}
            
        except Exception as e:
            logger.warning(f"Error getting place details for {place_id}: {e}")
            return {}
    
    async def _get_next_page_results(
        self,
        next_page_token: str,
        client: httpx.AsyncClient
    ) -> List[EmergencyVetLocation]:
        """
        Get additional results using next page token.
        
        Args:
            next_page_token: Token for next page of results
            client: HTTP client instance
            
        Returns:
            List of additional EmergencyVetLocation objects
        """
        results = []
        
        try:
            response = await client.get(
                "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
                params={
                    "pagetoken": next_page_token,
                    "key": self.api_key
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "OK":
                    for place in data.get("results", []):
                        try:
                            place_details = await self._get_place_details(place["place_id"], client)
                            
                            vet_location = EmergencyVetLocation(
                                name=place["name"],
                                address=place.get("vicinity", place.get("formatted_address", "")),
                                latitude=place["geometry"]["location"]["lat"],
                                longitude=place["geometry"]["location"]["lng"],
                                phone=place_details.get("formatted_phone_number"),
                                rating=place.get("rating"),
                                is_24_hour=self._check_if_24_hour(place_details),
                                is_open_now=place.get("opening_hours", {}).get("open_now", False),
                                place_id=place["place_id"]
                            )
                            
                            results.append(vet_location)
                            
                        except Exception as e:
                            logger.warning(f"Error processing next page place: {e}")
                            continue
        
        except Exception as e:
            logger.error(f"Error getting next page results: {e}")
        
        return results
    
    def _check_if_24_hour(self, place_details: Dict[str, Any]) -> bool:
        """
        Check if a place is open 24 hours based on opening hours data.
        
        Args:
            place_details: Place details from Google Maps API
            
        Returns:
            True if the place appears to be open 24 hours
        """
        opening_hours = place_details.get("opening_hours", {})
        
        # Check if there are periods defined
        periods = opening_hours.get("periods", [])
        
        if not periods:
            return False
        
        # If there's only one period with no close time, it's likely 24/7
        if len(periods) == 1:
            period = periods[0]
            if "close" not in period or period.get("close") is None:
                return True
        
        # Check if all days have the same hours and they span 24 hours
        if len(periods) == 7:  # One period per day
            all_24_hour = True
            for period in periods:
                open_time = period.get("open", {}).get("time")
                close_time = period.get("close", {}).get("time")
                
                if open_time != "0000" or close_time != "0000":
                    all_24_hour = False
                    break
            
            if all_24_hour:
                return True
        
        return False
    
    def _combine_and_deduplicate_results(
        self,
        *result_lists: List[EmergencyVetLocation]
    ) -> List[EmergencyVetLocation]:
        """
        Combine multiple result lists and remove duplicates.
        
        Args:
            result_lists: Variable number of result lists to combine
            
        Returns:
            Combined and deduplicated list of EmergencyVetLocation objects
        """
        combined = []
        seen_places = set()
        
        for result_list in result_lists:
            for vet in result_list:
                # Use place_id as primary deduplication key, fallback to name+address
                dedup_key = vet.place_id if vet.place_id else f"{vet.name.lower()}_{vet.address.lower()}"
                
                if dedup_key not in seen_places:
                    combined.append(vet)
                    seen_places.add(dedup_key)
        
        return combined
    
    async def get_cached_emergency_vets(
        self,
        latitude: float,
        longitude: float,
        radius_miles: float = 25.0
    ) -> List[EmergencyVetLocation]:
        """
        Get cached emergency vet locations for fallback when API is unavailable.
        
        This method provides a comprehensive fallback list of:
        1. Major emergency vet chains with national coverage
        2. Well-known 24-hour clinics for major metropolitan areas
        3. Generic emergency vet guidance
        
        The cached data is organized by geographic regions to provide
        more relevant results based on the user's location.
        
        Args:
            latitude: Search center latitude
            longitude: Search center longitude
            radius_miles: Search radius in miles
            
        Returns:
            List of cached EmergencyVetLocation objects
        """
        logger.info(
            f"Using cached emergency vet locations as fallback for "
            f"coordinates ({latitude}, {longitude}) within {radius_miles} miles"
        )
        
        # Major national emergency vet chains
        cached_vets = [
            EmergencyVetLocation(
                name="BluePearl Pet Hospital - Emergency & Specialty Care",
                address="Multiple Locations Nationwide - Visit bluepearlvet.com or call for nearest location",
                latitude=latitude,
                longitude=longitude,
                phone="1-800-BLUEPEARL (1-800-258-3732)",
                rating=4.5,
                is_24_hour=True,
                is_open_now=True,
                distance_miles=0.0  # Unknown distance in fallback mode
            ),
            EmergencyVetLocation(
                name="VCA Emergency Animal Hospital & Referral Center",
                address="Multiple Locations Nationwide - Visit vcahospitals.com or call for nearest location",
                latitude=latitude,
                longitude=longitude,
                phone="1-800-VCA-PETS (1-800-822-7387)",
                rating=4.3,
                is_24_hour=True,
                is_open_now=True,
                distance_miles=0.0
            ),
            EmergencyVetLocation(
                name="Animal Emergency Center",
                address="Check Local Directory or Search Online for Nearest Location",
                latitude=latitude,
                longitude=longitude,
                phone="Search Online: 'emergency vet near me' or call 411",
                rating=4.0,
                is_24_hour=True,
                is_open_now=True,
                distance_miles=0.0
            ),
            EmergencyVetLocation(
                name="ASPCA Animal Poison Control Center",
                address="24/7 Poison Control Hotline - For Toxic Substance Emergencies",
                latitude=latitude,
                longitude=longitude,
                phone="(888) 426-4435",
                rating=5.0,
                is_24_hour=True,
                is_open_now=True,
                distance_miles=0.0
            ),
            EmergencyVetLocation(
                name="Pet Poison Helpline",
                address="24/7 Poison Control Service - Fee May Apply",
                latitude=latitude,
                longitude=longitude,
                phone="(855) 764-7661",
                rating=4.8,
                is_24_hour=True,
                is_open_now=True,
                distance_miles=0.0
            ),
            EmergencyVetLocation(
                name="Local Emergency Veterinary Clinic",
                address="Search Online: Use Google Maps or Yelp to find '24 hour emergency vet near me'",
                latitude=latitude,
                longitude=longitude,
                phone="Call 411 for local directory assistance",
                rating=None,
                is_24_hour=True,
                is_open_now=True,
                distance_miles=0.0
            )
        ]
        
        # Add region-specific guidance based on coordinates
        region_guidance = self._get_regional_emergency_guidance(latitude, longitude)
        if region_guidance:
            cached_vets.insert(0, region_guidance)
        
        logger.warning(
            f"Returning {len(cached_vets)} cached emergency vet locations. "
            f"These are general resources - users should verify availability and location. "
            f"Real-time location data unavailable due to Maps API failure."
        )
        
        return cached_vets
    
    def _get_regional_emergency_guidance(
        self,
        latitude: float,
        longitude: float
    ) -> Optional[EmergencyVetLocation]:
        """
        Get region-specific emergency vet guidance based on coordinates.
        
        This provides more relevant cached data for major metropolitan areas.
        
        Args:
            latitude: User's latitude
            longitude: User's longitude
            
        Returns:
            EmergencyVetLocation with regional guidance or None
        """
        # Define major metropolitan regions (approximate coordinates)
        regions = {
            "Northeast US": {
                "bounds": {"lat_min": 39.0, "lat_max": 45.0, "lon_min": -80.0, "lon_max": -70.0},
                "guidance": "Major emergency vet centers in NYC, Boston, Philadelphia areas. Search 'emergency vet' + your city name."
            },
            "Southeast US": {
                "bounds": {"lat_min": 25.0, "lat_max": 37.0, "lon_min": -90.0, "lon_max": -75.0},
                "guidance": "Emergency vet services available in Atlanta, Miami, Charlotte areas. Contact local veterinary hospitals."
            },
            "Midwest US": {
                "bounds": {"lat_min": 37.0, "lat_max": 49.0, "lon_min": -105.0, "lon_max": -80.0},
                "guidance": "Emergency vet clinics in Chicago, Detroit, Minneapolis areas. Check university veterinary hospitals."
            },
            "Southwest US": {
                "bounds": {"lat_min": 25.0, "lat_max": 40.0, "lon_min": -115.0, "lon_max": -95.0},
                "guidance": "24-hour emergency vets in Dallas, Houston, Phoenix areas. Many clinics open late hours."
            },
            "West Coast US": {
                "bounds": {"lat_min": 32.0, "lat_max": 49.0, "lon_min": -125.0, "lon_max": -115.0},
                "guidance": "Emergency veterinary care in LA, San Francisco, Seattle, Portland areas. Multiple 24/7 options available."
            }
        }
        
        # Check which region the coordinates fall into
        for region_name, region_data in regions.items():
            bounds = region_data["bounds"]
            if (bounds["lat_min"] <= latitude <= bounds["lat_max"] and
                bounds["lon_min"] <= longitude <= bounds["lon_max"]):
                
                return EmergencyVetLocation(
                    name=f"Regional Emergency Vet Resources - {region_name}",
                    address=region_data["guidance"],
                    latitude=latitude,
                    longitude=longitude,
                    phone="Search online or call local directory",
                    rating=None,
                    is_24_hour=True,
                    is_open_now=True,
                    distance_miles=0.0
                )
        
        return None


# Global maps service instance
maps_service = MapsService()