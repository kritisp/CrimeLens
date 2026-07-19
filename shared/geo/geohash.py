"""
CrimeLens AI — Shared Geographic Utilities

Contains geohash encoding logic and other geo-related calculations.
"""

from __future__ import annotations


def encode_geohash(lat: float, lon: float, precision: int = 7) -> str:
    """
    Pure Python Geohash base32 encoder (resolution grid ~150m x 150m for precision=7).
    Deconstructs Latitude/Longitude coordinates into discrete grid strings.

    Args:
        lat: GPS latitude coordinate.
        lon: GPS longitude coordinate.
        precision: Geohash length (number of characters). Default is 7.

    Returns:
        The encoded Geohash base32 string.
    """
    base32 = "0123456789bcdefghjkmnpqrstuvwxyz"
    lat_interval = (-90.0, 90.0)
    lon_interval = (-180.0, 180.0)
    
    geohash = []
    bits = [16, 8, 4, 2, 1]
    bit = 0
    ch = 0
    is_even = True
    
    while len(geohash) < precision:
        if is_even:
            mid = (lon_interval[0] + lon_interval[1]) / 2.0
            if lon > mid:
                ch |= bits[bit]
                lon_interval = (mid, lon_interval[1])
            else:
                lon_interval = (lon_interval[0], mid)
        else:
            mid = (lat_interval[0] + lat_interval[1]) / 2.0
            if lat > mid:
                ch |= bits[bit]
                lat_interval = (mid, lat_interval[1])
            else:
                lat_interval = (lat_interval[0], mid)
        
        is_even = not is_even
        if bit < 4:
            bit += 1
        else:
            geohash.append(base32[ch])
            bit = 0
            ch = 0
            
    return "".join(geohash)
