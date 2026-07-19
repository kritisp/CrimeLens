"""
CrimeLens AI — Crime Signature v2.1 Model Tests
"""

import pytest
from pydantic import ValidationError

from app.services.crime_signature_v2.models import (
    IdentitySignature,
    TemporalSignature,
    SpatialSignature,
    BehavioralSignature,
    FeatureProvenance,
    CrimeDNA
)

def test_identity_signature_immutability():
    identity = IdentitySignature(
        case_master_id=1,
        crime_no="123456789012345678",
        signature_hash="abcd",
        schema_version="2.1.0",
        feature_version="2.1.0"
    )
    with pytest.raises(ValidationError):
        # frozen=True prevents assignment
        identity.case_master_id = 2


def test_spatial_signature_boundaries():
    # Valid
    SpatialSignature(latitude=12.9716, longitude=77.5946, geohash="tdr1", police_station_id=101, spatial_hash="hash")
    
    # Missing required PS ID should fail
    with pytest.raises(ValidationError):
        SpatialSignature(latitude=12.9716, longitude=77.5946, geohash="tdr1", spatial_hash="hash")


def test_temporal_signature():
    # Valid
    temp = TemporalSignature(
        incident_date_from="2023-01-01T10:00:00Z",
        info_received_date="2023-01-01T12:00:00Z",
        reporting_delay_minutes=120,
        day_of_week="Sunday",
        time_of_day="Day Hours",
        temporal_hash="hash"
    )
    assert temp.reporting_delay_minutes == 120


def test_feature_provenance_immutability():
    prov = FeatureProvenance(
        field_name="weapon_used",
        source_column="brief_facts",
        transformation_rule="Regex",
        confidence=0.9
    )
    with pytest.raises(ValidationError):
        prov.confidence = 1.0


def test_crime_dna_completeness():
    dna = CrimeDNA(
        behavior_hash="b",
        legal_hash="l",
        temporal_hash="t",
        spatial_hash="s",
        taxonomy_hash="tax",
        victim_hash="v",
        accused_hash="a",
        overall_crime_hash="overall"
    )
    assert dna.overall_crime_hash == "overall"

def test_behavioral_signature_v2_1():
    b = BehavioralSignature(
        weapon_used="Knife",
        violence_used=True,
        planning_level="Spontaneous",
        behavior_summary="Test",
        behavior_hash="hash"
    )
    assert b.violence_used is True
    assert b.planning_level == "Spontaneous"
