"""
CrimeLens AI — Crime Signature Engine v2.1 Models

Defines the immutable, highly structured, nested canonical domain representation
of an FIR based on the Karnataka Police schema. Upgraded to v2.1 to act as the
official 'Crime DNA' internal schema.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class FeatureProvenance(BaseModel):
    """Metadata explaining how a specific derived feature was obtained."""
    field_name: str = Field(..., description="Name of the extracted property.")
    source_table: Optional[str] = Field(None, description="Database table or raw entity.")
    source_column: Optional[str] = Field(None, description="Specific column or raw attribute.")
    transformation_rule: str = Field(..., description="Logic used (e.g., 'Regex Match', 'Database Lookup').")
    is_derived: bool = Field(True, description="True if computed/derived, False if raw.")
    confidence: float = Field(..., description="Confidence score [0.0 - 1.0].")

    class Config:
        frozen = True


class IdentitySignature(BaseModel):
    """Core identifiers and cryptographic versioning."""
    case_master_id: int
    crime_no: str
    signature_hash: str
    schema_version: str = Field("2.1.0")
    feature_version: str

    class Config:
        frozen = True


class TaxonomySignature(BaseModel):
    """Core case classification categories."""
    case_category: str
    gravity_offence: str
    crime_major_head: str
    crime_minor_head: str
    taxonomy_hash: str = Field(..., description="Hash of the taxonomy fields.")

    class Config:
        frozen = True


class ActSection(BaseModel):
    act_code: str
    section_code: str

    class Config:
        frozen = True


class LegalSignature(BaseModel):
    """Statutory penal code charges mapping."""
    statutory_charges: List[ActSection] = Field(default_factory=list)
    legal_hash: str = Field(..., description="Hash of legal charges.")

    class Config:
        frozen = True


class TemporalSignature(BaseModel):
    """Extracted time-based properties."""
    incident_date_from: str
    incident_date_to: Optional[str] = None
    info_received_date: str
    reporting_delay_minutes: int
    day_of_week: Optional[str] = None
    time_of_day: Optional[str] = None
    temporal_hash: str = Field(..., description="Hash of temporal properties.")

    class Config:
        frozen = True


class SpatialSignature(BaseModel):
    """Geographical bounding metrics."""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geohash: Optional[str] = None
    police_station_id: int
    spatial_hash: str = Field(..., description="Hash of spatial location.")

    class Config:
        frozen = True


class VictimSignature(BaseModel):
    """Demographics of victims."""
    victim_count: int
    gender_distribution: str = Field(..., description="e.g., '2 Male, 1 Female'")
    age_distribution: str = Field(..., description="e.g., 'Adults (25-35)'")
    occupation_distribution: str = Field(..., description="e.g., '1 Business, 1 Student'")
    police_targeted: bool
    victim_vulnerability_score: float = Field(0.0, description="Risk vulnerability scale.")
    victim_category: str = Field(..., description="Categorical group (e.g., Minor, Senior Citizen, Commercial).")
    repeat_victim_indicator: bool = Field(False)
    victim_summary: str
    victim_hash: str = Field(..., description="Hash of victim profiles.")
    provenance: List[FeatureProvenance] = Field(default_factory=list)

    class Config:
        frozen = True


class AccusedSignature(BaseModel):
    """Profiles of accused persons."""
    accused_count: int
    gender_distribution: str
    age_distribution: str
    known_gang_indicator: bool = Field(False)
    repeat_offender_indicator: bool = Field(False)
    arrest_status: str = Field(..., description="e.g., 'Arrested', 'Absconding'")
    absconding_indicator: bool = Field(False)
    organization_indicator: bool = Field(False)
    criminal_history_count: int = Field(0)
    accused_summary: str
    accused_hash: str = Field(..., description="Hash of accused profiles.")
    provenance: List[FeatureProvenance] = Field(default_factory=list)

    class Config:
        frozen = True


class PropertySignature(BaseModel):
    """Extensible block for stolen/recovered assets."""
    stolen_properties: List[str] = Field(default_factory=list)
    recovered_properties: List[str] = Field(default_factory=list)

    class Config:
        frozen = True


class BehavioralSignature(BaseModel):
    """Modus Operandi behavior traits extracted from text."""
    entry_method: Optional[str] = None
    exit_method: Optional[str] = None
    target_selection_strategy: Optional[str] = None
    target_property_type: Optional[str] = None
    weapon_used: Optional[str] = None
    violence_used: bool = Field(False)
    force_used: bool = Field(False)
    planning_level: str = Field("Unknown", description="e.g., Spontaneous, Pre-planned, Highly Organized")
    estimated_offender_count: str = Field("Unknown", description="e.g., Lone Wolf, Group, Mob")
    vehicle_used: Optional[str] = None
    mask_used: bool = Field(False)
    communication_method: Optional[str] = None
    escape_strategy: Optional[str] = None
    forced_entry_indicator: bool = Field(False)
    professional_mo_indicator: bool = Field(False)
    behavior_tags: List[str] = Field(default_factory=list)
    behavior_confidence: float = Field(0.0)
    behavior_summary: str = Field(..., description="Synthesized text of MO.")
    behavior_hash: str = Field(..., description="Hash of behavioral MO.")
    provenance: List[FeatureProvenance] = Field(default_factory=list)

    class Config:
        frozen = True


class InvestigationSignature(BaseModel):
    """Investigation metadata status."""
    case_status: str
    investigating_officer: Optional[str] = None

    class Config:
        frozen = True


class IntelligenceSignature(BaseModel):
    """Container for derived AI inferences."""
    organized_crime_indicator: bool = Field(False)
    serial_crime_indicator: bool = Field(False)
    cross_district_indicator: bool = Field(False)
    holiday_crime_indicator: bool = Field(False)
    festival_crime_indicator: bool = Field(False)
    night_crime_indicator: bool = Field(False)
    professional_gang_indicator: bool = Field(False)
    crime_cluster_indicator: bool = Field(False)
    behavior_similarity_vector: Optional[List[float]] = Field(None, description="Optional dense vector if pre-computed.")
    intelligence_confidence: float = Field(0.0)
    intelligence_summary: str = Field(..., description="Narrative summary of derived risks.")
    intelligence_hash: str = Field(..., description="Hash of intelligence metrics.")
    provenance: List[FeatureProvenance] = Field(default_factory=list)

    class Config:
        frozen = True


class CrimeDNA(BaseModel):
    """Aggregated hash container for rapid pattern matching."""
    behavior_hash: str
    legal_hash: str
    temporal_hash: str
    spatial_hash: str
    taxonomy_hash: str
    victim_hash: str
    accused_hash: str
    overall_crime_hash: str

    class Config:
        frozen = True


class EmbeddingDocument(BaseModel):
    """The structured textual representation generated for vector space embedding."""
    semantic_text: str = Field(..., description="Sectioned, human-readable composite document.")

    class Config:
        frozen = True


class CrimeSignatureV2(BaseModel):
    """
    The Master Immutable Root Model of a Crime Signature (v2.1 Schema).
    """
    identity: IdentitySignature
    crime_dna: CrimeDNA
    taxonomy: TaxonomySignature
    legal: LegalSignature
    temporal: TemporalSignature
    spatial: SpatialSignature
    victim: VictimSignature
    accused: AccusedSignature
    property: PropertySignature
    behavioral: BehavioralSignature
    investigation: InvestigationSignature
    intelligence: IntelligenceSignature
    embedding_document: EmbeddingDocument

    class Config:
        frozen = True
