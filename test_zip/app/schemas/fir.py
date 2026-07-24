from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict

def to_camel(string: str) -> str:
    """Convert snake_case to camelCase."""
    components = string.split("_")
    return components[0] + "".join(x.title() for x in components[1:])

class BaseSchema(BaseModel):
    """Base schema with auto camelCase alias generation."""
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )

class FIRBase(BaseSchema):
    complainant: str
    offense: str
    station: str
    officer: str
    status: str = "pending"
    priority: str = "medium"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    district: Optional[str] = None
    ward: Optional[str] = None
    crime_category: Optional[str] = None
    severity: Optional[str] = "medium"
    risk_score: Optional[int] = 50

class FIRCreate(FIRBase):
    fir_number: str
    date: Optional[datetime] = None

class FIRResponse(FIRBase):
    id: str
    fir_number: str
    date: datetime

class HeatmapPointResponse(BaseSchema):
    lat: float
    lng: float
    intensity: float

class HotspotResponse(BaseSchema):
    id: str
    name: str
    center_lat: float
    center_lng: float
    total_crimes: int
    most_common_crime: str
    last_incident: str
    avg_monthly_increase: float
    hotspot_score: int
    risk_level: str  # "High", "Medium", "Low"
    radius: float    # in kilometers

class DistrictAnalytics(BaseSchema):
    district: str
    crime_count: int
    active_cases: int

class CategoryBreakdown(BaseSchema):
    category: str
    count: int

class MonthlyTrend(BaseSchema):
    month: str
    count: int

class OfficerWorkload(BaseSchema):
    officer: str
    active_cases: int

class AnalyticsResponse(BaseSchema):
    district_breakdown: list[DistrictAnalytics]
    category_breakdown: list[CategoryBreakdown]
    monthly_trends: list[MonthlyTrend]
    officer_workload: list[OfficerWorkload]

class RiskAnalysisResponse(BaseSchema):
    district: str
    risk_score: int
    expected_increase: float  # e.g., 5.4%
    probability_theft: float   # 0 to 1
    probability_cyber: float   # 0 to 1
    probability_assault: float # 0 to 1
    risk_level: str            # "Green", "Yellow", "Orange", "Red"

class PredictionsResponse(BaseSchema):
    expected_increase_pct: float
    theft_probability: float
    cyber_probability: float
    assault_probability: float
    insights: list[str]
    weekly_trends: list[dict[str, Any]]
    monthly_trends: list[dict[str, Any]]
    seasonal_trends: list[dict[str, Any]]

class PatrolRoute(BaseSchema):
    name: str
    coordinates: list[list[float]]  # List of [lat, lng]
    priority: str                   # "High", "Medium", "Low"
    assigned_officers: int

class CctvArea(BaseSchema):
    location_name: str
    lat: float
    lng: float
    coverage_radius: float          # in meters
    priority: str

class AIIntelligenceResponse(BaseSchema):
    highest_crime_district: str
    fastest_growing_hotspot: str
    crimes_increasing_week: list[str]
    crimes_decreasing_month: list[str]
    suggested_patrol_locations: list[PatrolRoute]
    recommended_police_deployment: str
    most_active_officer: str
    high_priority_investigations: list[dict[str, Any]]
    gemini_summary: str

# ----------------- Normalized Entity Schemas -----------------

class DistrictSchema(BaseSchema):
    id: str
    name: str
    risk_score: int

class PoliceStationSchema(BaseSchema):
    id: str
    name: str
    district_id: str
    ward: Optional[str] = None
    base_latitude: Optional[float] = None
    base_longitude: Optional[float] = None

class EmployeeSchema(BaseSchema):
    id: str
    name: str
    badge_number: str
    rank: str
    station_id: Optional[str] = None
    status: str

class CrimeHeadSchema(BaseSchema):
    id: str
    name: str

class CrimeSubHeadSchema(BaseSchema):
    id: str
    name: str
    crime_head_id: str

class ComplainantSchema(BaseSchema):
    id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    details: Optional[str] = None

class VictimSchema(BaseSchema):
    id: str
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    contact: Optional[str] = None
    details: Optional[str] = None

class AccusedSchema(BaseSchema):
    id: str
    name: str
    age: Optional[int] = None
    description: Optional[str] = None
    details: Optional[str] = None

class ChargesheetSchema(BaseSchema):
    id: str
    case_id: str
    sections: str
    date_filed: datetime
    status: str
    details: Optional[str] = None

class CaseMasterResponse(BaseSchema):
    id: str
    fir_number: str
    date: datetime
    status: str
    priority: str
    severity: str
    risk_score: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    offense_description: str
    incident_summary: Optional[str] = None
    evidence: Optional[str] = None
    
    station: Optional[PoliceStationSchema] = None
    officer: Optional[EmployeeSchema] = None
    crime_sub_head: Optional[CrimeSubHeadSchema] = None
    complainants: list[ComplainantSchema] = []
    victims: list[VictimSchema] = []
    accused: list[AccusedSchema] = []
    chargesheet: Optional[ChargesheetSchema] = None
