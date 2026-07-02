"""
CrimeLens AI — Ingested Case Domain Models

Defines the clean, validated, strongly typed domain representations of cases,
complainants, victims, accused entities, and legal acts/sections.
These objects represent the core entities of our system and are decoupled from
any databases, networks, or web frameworks.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class ActSection(BaseModel):
    """Domain model representing an Act and Section charge association."""

    act_code: str = Field(..., description="Legal act identifier (e.g. 'IPC', 'NDPS').")
    section_code: str = Field(..., description="Specific section code (e.g. '379', '34').")


class Complainant(BaseModel):
    """Domain model representing a validated complainant."""

    name: Optional[str] = Field(None, description="Optional name (PII masked by default).")
    age: Optional[int] = Field(None, description="Age in years.")
    gender_id: Optional[int] = Field(None, description="Gender lookup ID.")
    occupation: Optional[str] = Field(None, description="Occupation description.")
    religion: Optional[str] = Field(None, description="Religion description.")
    caste: Optional[str] = Field(None, description="Caste description.")

    @field_validator("age")
    @classmethod
    def validate_age(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and (value < 0 or value > 120):
            raise ValueError(f"Complainant age must be between 0 and 120, got: {value}")
        return value


class Victim(BaseModel):
    """Domain model representing a case victim."""

    name: Optional[str] = Field(None, description="Optional name (PII masked by default).")
    age: Optional[int] = Field(None, description="Age in years.")
    gender_id: Optional[int] = Field(None, description="Gender lookup ID.")
    is_police: bool = Field(default=False, description="Flag: True if victim is a police officer.")

    @field_validator("age")
    @classmethod
    def validate_age(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and (value < 0 or value > 120):
            raise ValueError(f"Victim age must be between 0 and 120, got: {value}")
        return value


class Accused(BaseModel):
    """Domain model representing an accused person."""

    name: Optional[str] = Field(None, description="Optional name (PII masked by default).")
    age: Optional[int] = Field(None, description="Age in years.")
    gender_id: Optional[int] = Field(None, description="Gender lookup ID.")
    person_sequence: Optional[str] = Field(None, description="Suspect order (e.g. 'A1', 'A2').")

    @field_validator("age")
    @classmethod
    def validate_age(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and (value < 0 or value > 120):
            raise ValueError(f"Accused age must be between 0 and 120, got: {value}")
        return value


class IngestedCase(BaseModel):
    """
    Canonical Domain Model of a validated case.
    This serves as the single source of truth for downstream processes (e.g.
    feature engineering, embedding generation, index mapping) after ingestion.
    """

    case_master_id: int = Field(..., description="Relational database primary key reference.")
    crime_no: str = Field(..., description="Canonical 17-digit KSP crime registration number.")
    case_category: str = Field(..., description="Category label (e.g. 'FIR', 'UDR').")
    gravity_offence: str = Field(..., description="Gravity classification (e.g. 'Heinous').")
    crime_major_head: str = Field(..., description="Major crime classification head.")
    crime_minor_head: str = Field(..., description="Minor crime classification sub-head.")
    police_station_id: int = Field(..., description="Police station unit identifier.")

    incident_date_from: datetime = Field(..., description="Estimated incident start date and time.")
    incident_date_to: Optional[datetime] = Field(None, description="Estimated incident end date and time.")
    info_received_ps_date: datetime = Field(..., description="Date and time info was received by PS.")

    latitude: Optional[float] = Field(None, description="GPS latitude coordinate.")
    longitude: Optional[float] = Field(None, description="GPS longitude coordinate.")
    brief_facts: str = Field(..., description="Cleaned, normalized text narrative summary of the incident.")

    complainant: Optional[Complainant] = Field(None, description="Complainant details.")
    victims: List[Victim] = Field(default_factory=list, description="Associated victims.")
    accused_list: List[Accused] = Field(default_factory=list, description="Associated accused suspects.")
    statutory_charges: List[ActSection] = Field(default_factory=list, description="Associated legal charges.")

    @field_validator("crime_no")
    @classmethod
    def validate_crime_no(cls, value: str) -> str:
        # Crime number is assigned as a 17-character digit sequence
        cleaned = value.strip()
        if not (cleaned.isdigit() and len(cleaned) == 17):
            raise ValueError(f"CrimeNo must be a 17-digit string, got: {value!r}")
        return cleaned

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, value: Optional[float]) -> Optional[float]:
        # Validate coordinates are within the geographic boundaries of Karnataka State (approx 11.5N to 18.5N)
        if value is not None and not (11.5 <= value <= 18.5):
            raise ValueError(f"Latitude must fall within Karnataka boundaries (11.5 to 18.5), got: {value}")
        return value

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, value: Optional[float]) -> Optional[float]:
        # Validate coordinates are within the geographic boundaries of Karnataka State (approx 74.0E to 78.5E)
        if value is not None and not (74.0 <= value <= 78.5):
            raise ValueError(f"Longitude must fall within Karnataka boundaries (74.0 to 78.5), got: {value}")
        return value

    @field_validator("incident_date_from", "incident_date_to", "info_received_ps_date")
    @classmethod
    def ensure_utc(cls, value: Optional[datetime]) -> Optional[datetime]:
        """Ensures all date timestamps are timezone-aware and set to UTC."""
        if value is not None and value.tzinfo is None:
            return value.replace(tzinfo=None)  # Stored as naive UTC by database standard
        return value

    @property
    def reporting_delay_minutes(self) -> int:
        """Calculates the delay in minutes between the incident occurrence and filing."""
        delta = self.info_received_ps_date - self.incident_date_from
        return max(0, int(delta.total_seconds() / 60))
