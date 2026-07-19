"""
CrimeLens AI — Crime Signature Pipeline Unit Tests

Verifies the correctness, immutability, and OCP extensibility of the Crime
Signature Pipeline and its execution stages.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import List, Union

import pytest
from pydantic import ValidationError

from app.domain.models.ingested_case import Accused, ActSection, IngestedCase
from app.domain.models.signature import CrimeSignature
from app.services.crime_signature.core import (
    CrimeSignaturePipeline,
    PipelineContext,
    PipelineValidationError,
    create_default_pipeline,
)
from app.services.crime_signature.core.interfaces import PipelineStage
from app.services.crime_signature.core.stages.assembler import CrimeSignatureAssembler
from app.services.crime_signature.core.stages.behavioral import BehavioralFeatureStage
from app.services.crime_signature.core.stages.normalization import NormalizationStage
from app.services.crime_signature.core.stages.spatial import SpatialFeatureStage
from app.services.crime_signature.core.stages.structured import StructuredFeatureStage
from app.services.crime_signature.core.stages.temporal import TemporalFeatureStage
from app.services.crime_signature.core.stages.text import TextFeatureStage
from app.services.crime_signature.core.stages.validation import ValidationStage


@pytest.fixture
def mock_ingested_case() -> IngestedCase:
    """Fixture returning a standard valid IngestedCase."""
    return IngestedCase(
        case_master_id=1024,
        crime_no="104430006202600001",
        case_category="FIR",
        gravity_offence="Heinous",
        crime_major_head="Crimes Against Property",
        crime_minor_head="Vehicle Theft",
        police_station_id=443,
        incident_date_from=datetime(2026, 7, 4, 2, 30, tzinfo=timezone.utc),  # Saturday early morning
        incident_date_to=datetime(2026, 7, 4, 3, 0, tzinfo=timezone.utc),
        info_received_ps_date=datetime(2026, 7, 4, 8, 30, tzinfo=timezone.utc),
        latitude=12.9785,
        longitude=77.5946,
        brief_facts="The complainant states that a white Hyundai Creta was stolen from outside the residence using an electronic keyless relay bypass device by masked suspects.",
        complainant=None,
        victims=[],
        accused_list=[
            Accused(name="Ravi Bouncer Kumar", age=32, gender_id=1, person_sequence="A1")
        ],
        statutory_charges=[
            ActSection(act_code="IPC", section_code="379"),
            ActSection(act_code="IPC", section_code="34"),
        ],
    )


# ── Immutability Tests ────────────────────────────────────────────────────────


def test_pipeline_context_immutability(mock_ingested_case: IngestedCase) -> None:
    """Asserts that PipelineContext attributes cannot be modified after instantiation."""
    context = PipelineContext(case=mock_ingested_case)
    with pytest.raises(ValidationError):
        context.normalized_facts = "Mutating facts"  # type: ignore[misc]


def test_crime_signature_immutability(mock_ingested_case: IngestedCase) -> None:
    """Asserts that CrimeSignature values are frozen and immutable."""
    pipeline = create_default_pipeline()
    signature, _ = pipeline.execute(mock_ingested_case)
    
    with pytest.raises(ValidationError):
        signature.crime_no = "99999999999999999"  # type: ignore[misc]


# ── Individual Stage Tests ───────────────────────────────────────────────────


def test_validation_stage(mock_ingested_case: IngestedCase) -> None:
    """Tests the ValidationStage assertions."""
    stage = ValidationStage()
    context = PipelineContext(case=mock_ingested_case)
    
    # Valid context passes
    assert stage.process(context) is context

    # Test empty facts narrative
    bad_case_facts = mock_ingested_case.model_copy(update={"brief_facts": "   "})
    with pytest.raises(PipelineValidationError) as exc_info:
        stage.process(PipelineContext(case=bad_case_facts))
    assert "brief_facts narrative is empty" in str(exc_info.value)

    # Test incident date mismatch
    bad_case_dates = mock_ingested_case.model_copy(
        update={
            "incident_date_to": datetime(2026, 7, 4, 1, 0, tzinfo=timezone.utc)
        }
    )
    with pytest.raises(PipelineValidationError) as exc_info:
        stage.process(PipelineContext(case=bad_case_dates))
    assert "cannot be earlier than IncidentFromDate" in str(exc_info.value)


def test_normalization_stage(mock_ingested_case: IngestedCase) -> None:
    """Tests whitespace and boilerplate stripping in NormalizationStage."""
    stage = NormalizationStage()
    context = PipelineContext(case=mock_ingested_case)
    
    processed_context = stage.process(context)
    assert isinstance(processed_context, PipelineContext)
    assert processed_context.normalized_facts is not None
    # Boilerplate ("The complainant states that") should be stripped
    assert not processed_context.normalized_facts.startswith("The complainant states that")
    assert processed_context.normalized_facts.startswith("A white Hyundai Creta")


def test_structured_feature_stage(mock_ingested_case: IngestedCase) -> None:
    """Tests mapping of statutory charges and category headers."""
    stage = StructuredFeatureStage()
    context = PipelineContext(case=mock_ingested_case)
    
    processed = stage.process(context)
    assert isinstance(processed, PipelineContext)
    assert processed.structured is not None
    assert processed.structured.case_category == "FIR"
    assert processed.structured.police_station_id == 443
    assert processed.structured.statutory_charges == ["IPC_34", "IPC_379"]


def test_temporal_feature_stage(mock_ingested_case: IngestedCase) -> None:
    """Tests cyclical sin/cos hour and day transformations and holiday checks."""
    stage = TemporalFeatureStage()
    context = PipelineContext(case=mock_ingested_case)
    
    processed = stage.process(context)
    assert isinstance(processed, PipelineContext)
    assert processed.temporal is not None
    
    # 02:30 AM is 2.5 hours out of 24
    expected_hour_angle = 2.0 * math.pi * 2.5 / 24.0
    assert abs(processed.temporal.hour_sin - math.sin(expected_hour_angle)) < 1e-5
    assert abs(processed.temporal.hour_cos - math.cos(expected_hour_angle)) < 1e-5
    
    # Saturday is dt.weekday() == 5
    expected_day_angle = 2.0 * math.pi * 5 / 7.0
    assert abs(processed.temporal.day_sin - math.sin(expected_day_angle)) < 1e-5
    assert abs(processed.temporal.day_cos - math.cos(expected_day_angle)) < 1e-5
    
    # Weekend must be marked as holiday
    assert processed.temporal.is_holiday is True


def test_spatial_feature_stage(mock_ingested_case: IngestedCase) -> None:
    """Tests Geohash resolution and coordinate zone classifications."""
    stage = SpatialFeatureStage()
    context = PipelineContext(case=mock_ingested_case)
    
    processed = stage.process(context)
    assert isinstance(processed, PipelineContext)
    assert processed.spatial is not None
    assert len(processed.spatial.geohash_code) == 7
    # Coordinates inside metro grid (Bengaluru)
    assert processed.spatial.zone_classification == "URBAN METROPOLITAN"

    # Test unknown coordinates
    none_case = mock_ingested_case.model_copy(update={"latitude": None, "longitude": None})
    processed_none = stage.process(PipelineContext(case=none_case))
    assert isinstance(processed_none, PipelineContext)
    assert processed_none.spatial is not None
    assert processed_none.spatial.geohash_code == "UNKNOWN"
    assert processed_none.spatial.zone_classification == "UNKNOWN"


def test_behavioral_feature_stage(mock_ingested_case: IngestedCase) -> None:
    """Tests Modus Operandi parsing, repeat offender counts, and targets."""
    stage = BehavioralFeatureStage()
    context = PipelineContext(case=mock_ingested_case)
    
    processed = stage.process(context)
    assert isinstance(processed, PipelineContext)
    assert processed.behavioral is not None
    assert "relay_bypass" in processed.behavioral.modus_operandi_tags
    assert "organized_syndicate" in processed.behavioral.modus_operandi_tags
    assert processed.behavioral.target_type == "VEHICLE: HYUNDAI CRETA"
    # Suspct matches 'Ravi Bouncer Kumar' (ratio is 1.0)
    assert processed.behavioral.repeat_offender_ratio == 1.0


# ── Pipeline Runner & OCP Tests ──────────────────────────────────────────────


def test_pipeline_execution_and_assembly(mock_ingested_case: IngestedCase) -> None:
    """Verifies that running the pipeline aggregates features and collects metrics."""
    pipeline = create_default_pipeline()
    signature, context = pipeline.execute(mock_ingested_case)
    
    assert isinstance(signature, CrimeSignature)
    assert isinstance(context, PipelineContext)
    assert signature.crime_no == "104430006202600001"
    assert signature.derived.reporting_delay_minutes == 360  # 2:30 AM to 8:30 AM = 6 hours (360 mins)
    assert signature.derived.incident_duration_minutes == 30  # 2:30 AM to 3:00 AM = 30 mins
    assert signature.derived.accused_count == 1
    assert signature.derived.victim_count == 0

    # Verify timing metrics are recorded
    assert "ValidationStage" in context.metrics
    assert "NormalizationStage" in context.metrics
    assert "StructuredFeatureStage" in context.metrics
    assert "TemporalFeatureStage" in context.metrics
    assert "SpatialFeatureStage" in context.metrics
    assert "BehavioralFeatureStage" in context.metrics
    assert "TextFeatureStage" in context.metrics
    assert "CrimeSignatureAssembler" in context.metrics
    
    # Assert values are positive numbers representing durations
    assert context.metrics["ValidationStage"] >= 0.0


def test_open_closed_principle_custom_stage(mock_ingested_case: IngestedCase) -> None:
    """
    Verifies that the pipeline supports appending custom third-party stages
    without modifying pipeline code, adhering to the Open-Closed Principle.
    """
    class CustomMetadataStage(PipelineStage):
        def process(
            self,
            context: Union[PipelineContext, CrimeSignature],
        ) -> Union[PipelineContext, CrimeSignature]:
            if isinstance(context, CrimeSignature):
                return context
            
            # Append custom metadata field
            updated_metadata = dict(context.metadata)
            updated_metadata["source_api"] = "KSP_GATEWAY_V1"
            return context.model_copy(update={"metadata": updated_metadata})

    pipeline = create_default_pipeline()
    # Insert custom stage before the final CrimeSignatureAssembler
    pipeline.stages.insert(-1, CustomMetadataStage())
    
    signature, context = pipeline.execute(mock_ingested_case)
    assert isinstance(signature, CrimeSignature)
    assert context.metadata["source_api"] == "KSP_GATEWAY_V1"
    assert "CustomMetadataStage" in context.metrics

