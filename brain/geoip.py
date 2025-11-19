import geoip2.database
import geoip2.errors
import os
from typing import Optional, Dict
from cache import cache

class GeoIPLookup:
    def __init__(self, db_path: Optional[str] = None):
        """Initialize GeoIP lookup with MaxMind GeoLite2 database"""
        self.db_path = db_path or os.getenv("GEOIP_DB_PATH", "brain/GeoLite2-City.mmdb")
        self.reader = None
        self.enabled = False
        
        try:
            if os.path.exists(self.db_path):
                self.reader = geoip2.database.Reader(self.db_path)
                self.enabled = True
                print(f"[+] GeoIP database loaded from {self.db_path}")
            else:
                print(f"[!] GeoIP database not found at {self.db_path}. GeoIP lookup disabled.")
                print("[!] Download from: https://dev.maxmind.com/geoip/geolite2-free-geolocation-data")
        except Exception as e:
            print(f"[!] Failed to load GeoIP database: {e}")
            self.enabled = False

    def lookup(self, ip_address: str) -> Dict[str, Optional[str]]:
        """
        Lookup IP address and return geographic information
        
        Returns:
            Dict with keys: country, country_code, city, latitude, longitude, asn
        """
        default_result = {
            "country": None,
            "country_code": None,
            "city": None,
            "latitude": None,
            "longitude": None,
            "timezone": None
        }
        
        # Check if localhost or private IP
        if ip_address in ["127.0.0.1", "localhost", "::1"] or \
           ip_address.startswith("192.168.") or \
           ip_address.startswith("10.") or \
           ip_address.startswith("172."):
            default_result["country"] = "Local"
            default_result["country_code"] = "LO"
            default_result["city"] = "Private Network"
            return default_result
        
        if not self.enabled:
            return default_result
        
        # Check cache first
        cache_key = f"geoip:{ip_address}"
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result
        
        try:
            response = self.reader.city(ip_address)
            
            result = {
                "country": response.country.name,
                "country_code": response.country.iso_code,
                "city": response.city.name,
                "latitude": response.location.latitude,
                "longitude": response.location.longitude,
                "timezone": response.location.time_zone
            }
            
            # Cache for 24 hours
            cache.set(cache_key, result, ttl=86400)
            
            return result
            
        except geoip2.errors.AddressNotFoundError:
            # Cache negative results for 1 hour to avoid repeated lookups
            cache.set(cache_key, default_result, ttl=3600)
            return default_result
        except Exception as e:
            print(f"[-] GeoIP lookup error for {ip_address}: {e}")
            return default_result

    def close(self):
        """Close the database reader"""
        if self.reader:
            self.reader.close()

# Global GeoIP instance
geoip = GeoIPLookup()
