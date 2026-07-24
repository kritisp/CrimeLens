"""
CrimeLens AI — API Heatmap Endpoints

Exposes dynamic hotspots and district statistics based on the persistent database cases.
"""

from __future__ import annotations

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.setup import get_db
from app.infrastructure.database.repositories.sqlite_repository import SQLiteFIRRepository

router = APIRouter()


@router.get("/districts", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
async def get_districts(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """Returns the list of Karnataka districts with caseload counts from the database."""
    repo = SQLiteFIRRepository(db)
    cases = await repo.list_raw_firs()
    
    # Pre-defined districts with coordinate projections for the SVG map
    districts = [
        {"id": "D1", "name": "Bengaluru Urban", "x": 350, "y": 340, "radius": 40, "cases_count": 0},
        {"id": "D2", "name": "Mysuru", "x": 290, "y": 390, "radius": 32, "cases_count": 0},
        {"id": "D3", "name": "Mangaluru", "x": 190, "y": 340, "radius": 28, "cases_count": 0},
        {"id": "D4", "name": "Hubballi-Dharwad", "x": 230, "y": 210, "radius": 30, "cases_count": 0},
        {"id": "D5", "name": "Belagavi", "x": 180, "y": 150, "radius": 32, "cases_count": 0},
        {"id": "D6", "name": "Bidar", "x": 370, "y": 50, "radius": 24, "cases_count": 0},
        {"id": "D7", "name": "Kalaburagi", "x": 360, "y": 100, "radius": 28, "cases_count": 0}
    ]
    
    # Map raw case locations to districts
    # Distances calculation to find the closest district center
    district_centers = {
        "Bengaluru Urban": (12.9785, 77.5946),
        "Mysuru": (12.2958, 76.6394),
        "Mangaluru": (12.9141, 74.8560),
        "Hubballi-Dharwad": (15.3647, 75.1240),
        "Belagavi": (15.8497, 74.4977),
        "Bidar": (17.9104, 77.5199),
        "Kalaburagi": (17.3364, 76.8370),
    }
    
    for case in cases:
        lat = case.get("latitude")
        lon = case.get("longitude")
        if lat is not None and lon is not None:
            # Find nearest district center
            closest_district = "Bengaluru Urban"
            min_dist = float("inf")
            for dist_name, coords in district_centers.items():
                d = (lat - coords[0]) ** 2 + (lon - coords[1]) ** 2
                if d < min_dist:
                    min_dist = d
                    closest_district = dist_name
            
            # Increment count
            for dist in districts:
                if dist["name"] == closest_district:
                    dist["cases_count"] += 1
                    break
        else:
            # Default fallback
            districts[0]["cases_count"] += 1

    return districts


@router.get("/hotspots", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
async def get_hotspots(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """Returns dynamic hotspots mapping cases in the database to visual hotspots on the KSP map."""
    repo = SQLiteFIRRepository(db)
    cases = await repo.list_raw_firs()
    
    hotspots = [
        {
            "id": "HS-001",
            "name": "Indiranagar 100ft Road",
            "district": "Bengaluru Urban",
            "crimeType": "Vehicle Theft",
            "timeRange": "24h",
            "severity": "High",
            "x": 360,
            "y": 335,
            "firs": []
        },
        {
            "id": "HS-002",
            "name": "Koramangala 4th Block",
            "district": "Bengaluru Urban",
            "crimeType": "Cyber Fraud",
            "timeRange": "24h",
            "severity": "Medium",
            "x": 345,
            "y": 350,
            "firs": []
        },
        {
            "id": "HS-003",
            "name": "Ullal Border Checkpoint",
            "district": "Mangaluru",
            "crimeType": "Narcotics",
            "timeRange": "7d",
            "severity": "High",
            "x": 190,
            "y": 340,
            "firs": []
        },
        {
            "id": "HS-004",
            "name": "HSR Layout Sector 2",
            "district": "Bengaluru Urban",
            "crimeType": "Vehicle Theft",
            "timeRange": "30d",
            "severity": "Low",
            "x": 355,
            "y": 360,
            "firs": []
        },
        {
            "id": "HS-005",
            "name": "Bidar Cash withdrawal terminal",
            "district": "Bidar",
            "crimeType": "Financial Crime",
            "timeRange": "24h",
            "severity": "High",
            "x": 370,
            "y": 50,
            "firs": []
        },
        {
            "id": "HS-006",
            "name": "Hubballi Toll Plaza",
            "district": "Hubballi-Dharwad",
            "crimeType": "Vehicle Theft",
            "timeRange": "7d",
            "severity": "Medium",
            "x": 230,
            "y": 210,
            "firs": []
        }
    ]

    district_centers = {
        "Bengaluru Urban": (12.9785, 77.5946),
        "Mysuru": (12.2958, 76.6394),
        "Mangaluru": (12.9141, 74.8560),
        "Hubballi-Dharwad": (15.3647, 75.1240),
        "Belagavi": (15.8497, 74.4977),
        "Bidar": (17.9104, 77.5199),
        "Kalaburagi": (17.3364, 76.8370),
    }

    # Dynamic association
    for case in cases:
        lat = case.get("latitude")
        lon = case.get("longitude")
        fir_id = f"FIR-{case.get('case_master_id')}"
        
        closest_district = "Bengaluru Urban"
        if lat is not None and lon is not None:
            min_dist = float("inf")
            for dist_name, coords in district_centers.items():
                d = (lat - coords[0]) ** 2 + (lon - coords[1]) ** 2
                if d < min_dist:
                    min_dist = d
                    closest_district = dist_name
        
        # Link to the corresponding hotspot for that district
        # Each district maps to some hotspot. If multiple exist, we assign by case major head or round robin.
        assigned = False
        for hs in hotspots:
            if hs["district"] == closest_district:
                # Filter by crimeType if matching
                major_head = case.get("crime_major_head", "").lower()
                if "property" in major_head or "theft" in major_head:
                    if hs["crimeType"] == "Vehicle Theft":
                        hs["firs"].append(fir_id)
                        assigned = True
                        break
                elif "cyber" in major_head or "fraud" in major_head:
                    if hs["crimeType"] == "Cyber Fraud" or hs["crimeType"] == "Financial Crime":
                        hs["firs"].append(fir_id)
                        assigned = True
                        break
        
        if not assigned:
            # Add to first hotspot matching the district
            for hs in hotspots:
                if hs["district"] == closest_district:
                    hs["firs"].append(fir_id)
                    break
                    
    return hotspots
