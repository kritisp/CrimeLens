"""
CrimeLens AI — Crime Signature Domain Models

Defines the canonical CrimeSignature object. This is the single source of truth
for every machine learning model in the platform (retrieval, copilot, clustering, etc.).
All signature objects are immutable (frozen=True) to prevent side effects in pipelines.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class StructuredFeatures(BaseModel):
    """Structured and categorical features of the case."""

    case_category: str = Field(..., description="Category code (e.g. 'FIR', 'UDR').")
    gravity_level: str = Field(..., description="Heinous or Non-Heinous classification.")
    major_head: str = Field(..., description="Major crime classification head.")
    minor_head: str = Field(..., description="Minor crime classification sub-head.")
    police_station_id: int = Field(..., description="Identifier of the police station.")
    statutory_charges: List[str] = Field(
        default_factory=list,
        description="Invoked legal acts/sections as list of strings.",
    )

    class Config:
        frozen = True


class TemporalFeatures(BaseModel):
    """Temporal and cyclical representations of the crime timing."""

    hour_sin: float = Field(..., description="Cyclical sine representation of the incident hour.")
    hour_cos: float = Field(..., description="Cyclical cosine representation of the incident hour.")
    day_sin: float = Field(..., description="Cyclical sine representation of the day of the week.")
    day_cos: float = Field(..., description="Cyclical cosine representation of the day of the week.")
    is_holiday: bool = Field(..., description="Flag: True if occurred on a public holiday.")

    class Config:
        frozen = True


class SpatialFeatures(BaseModel):
    """Geographical and spatial descriptors."""

    latitude: Optional[float] = Field(None, description="GPS latitude coordinate.")
    longitude: Optional[float] = Field(None, description="GPS longitude coordinate.")
    geohash_code: str = Field(..., description="Geohash grid cell code representing the location.")
    zone_classification: str = Field(..., description="Classification category (e.g. 'Urban', 'Highway').")

    class Config:
        frozen = True


class TextFeatures(BaseModel):
    """Textual descriptors representing the cleaned incident facts."""

    narrative_summary: str = Field(..., description="Cleaned, normalized FIR narrative facts.")

    class Config:
        frozen = True


class DerivedFeatures(BaseModel):
    """Derived mathematical indices and count statistics."""

    reporting_delay_minutes: int = Field(..., description="Time delay between occurrence and filing.")
    incident_duration_minutes: int = Field(..., description="Time span of the crime occurrence.")
    accused_count: int = Field(..., description="Total count of accused suspects.")
    victim_count: int = Field(..., description="Total count of associated victims.")

    class Config:
        frozen = True


class BehavioralFeatures(BaseModel):
    """Behavioral signatures and Modus Operandi descriptors."""

    modus_operandi_tags: List[str] = Field(
        default_factory=list,
        description="Extracted MO tags and behavioral traits.",
    )
    repeat_offender_ratio: float = Field(
        ...,
        description="Ratio of repeat offenders among the accused suspects.",
    )
    target_type: str = Field(..., description="Profile of the target/victim/property.")

    class Config:
        frozen = True


class CrimeSignature(BaseModel):
    """
    Canonical Crime Signature Object.
    Unified representation of an FIR, combining structured, unstructured,
    behavioral, spatial, temporal, and derived dimensions. This is the main data
    structure consumed by downstream ML models.
    """

    crime_no: str = Field(..., description="Canonical 17-digit KSP identifier.")
    case_master_id: int = Field(..., description="Relational database reference key.")
    structured: StructuredFeatures = Field(..., description="Structured features block.")
    temporal: TemporalFeatures = Field(..., description="Temporal features block.")
    spatial: SpatialFeatures = Field(..., description="Spatial features block.")
    text: TextFeatures = Field(..., description="Text narrative features block.")
    derived: DerivedFeatures = Field(..., description="Derived count/span features block.")
    behavioral: BehavioralFeatures = Field(..., description="Behavioral / MO features block.")

    class Config:
        frozen = True
