"""
CrimeLens AI — Crime Signature v2.1 Builder Tests
"""

from datetime import datetime, timezone
import pytest

from app.domain.models.ingested_case import IngestedCase, ActSection as RawActSection
from app.services.crime_signature_v2.builder import SignatureBuilder


@pytest.fixture
def sample_ingested_case() -> IngestedCase:
    return IngestedCase(
        case_master_id=505,
        crime_no="123456789012345678",
        case_category="FIR",
        gravity_offence="Heinous",
        crime_major_head="THEFT",
        crime_minor_head="MOTOR VEHICLE THEFT",
        police_station_id=1,
        incident_date_from=datetime(2023, 5, 1, 14, 0, tzinfo=timezone.utc),
        info_received_ps_date=datetime(2023, 5, 1, 16, 0, tzinfo=timezone.utc),
        latitude=12.9716,
        longitude=77.5946,
        brief_facts="The complainant parked his two-wheeler outside the shop. Unknown culprits broke the lock and stole the car.",
        statutory_charges=[
            RawActSection(act_code="IPC", section_code="379")
        ],
        victims=[],
        accused_list=[]
    )


def test_signature_builder_v2_1(sample_ingested_case: IngestedCase):
    builder = SignatureBuilder()
    sig_v2 = builder.build_from_case(sample_ingested_case)
    
    # Check identity
    assert sig_v2.identity.case_master_id == 505
    assert len(sig_v2.identity.signature_hash) == 64  # SHA-256
    
    # Check taxonomy
    assert sig_v2.taxonomy.crime_major_head == "THEFT"
    
    # Check temporal
    assert sig_v2.temporal.reporting_delay_minutes == 120
    assert sig_v2.temporal.day_of_week == "Monday"
    assert sig_v2.temporal.time_of_day == "Day Hours"
    
    # Check behavioral mock extraction
    assert "Forced Entry" in sig_v2.behavioral.behavior_tags
    assert sig_v2.behavioral.entry_method == "Forced"
    
    # Check embedding document
    semantic_text = sig_v2.embedding_document.semantic_text
    assert "### Crime Taxonomy" in semantic_text
    assert "THEFT" in semantic_text
    assert "IPC 379" in semantic_text
    
    # Check CrimeDNA
    assert len(sig_v2.crime_dna.behavior_hash) == 64
    assert len(sig_v2.crime_dna.overall_crime_hash) == 64
    
    # Check Intelligence
    assert sig_v2.intelligence.night_crime_indicator is False
