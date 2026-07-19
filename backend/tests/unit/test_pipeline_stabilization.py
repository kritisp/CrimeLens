"""
CrimeLens AI — Pipeline Stabilization Unit and Regression Tests

Verifies query self-exclusion filtering (Critical Fix #1) and dynamic confidence
calculations (Critical Fix #2).
"""

from __future__ import annotations

from datetime import datetime, timezone
import pytest

from app.domain.models.signature import (
    BehavioralFeatures,
    CrimeSignature,
    DerivedFeatures,
    SpatialFeatures,
    StructuredFeatures,
    TemporalFeatures,
    TextFeatures,
)
from app.services.crime_signature.confidence import ConfidenceEngine, ConfidenceResult
from app.services.crime_signature.embedding.orchestrator import EmbeddingOrchestrator
from app.services.crime_signature.pipeline import CrimeAnalysisPipeline, PipelineExecutor
from app.services.crime_signature.retrieval import CrimeMetadata, IndexManager
from app.services.crime_signature.retrieval.search_engine import SearchEngine
from app.services.crime_signature.similarity import SimilarityEngine


@pytest.fixture
def sample_cases() -> list[CrimeSignature]:
    """Fixture returning sample signatures for stabilization tests."""
    return [
        CrimeSignature(
            crime_no="104430006202600001",
            case_master_id=1001,
            structured=StructuredFeatures(
                case_category="FIR",
                gravity_level="Heinous",
                major_head="Crimes Against Property",
                minor_head="Vehicle Theft",
                police_station_id=443,
                statutory_charges=["IPC_379", "IPC_34"],
            ),
            temporal=TemporalFeatures(
                hour_sin=0.5,
                hour_cos=0.866,
                day_sin=0.0,
                day_cos=1.0,
                is_holiday=True,
            ),
            spatial=SpatialFeatures(
                latitude=12.9785,
                longitude=77.5946,
                geohash_code="tdr1wgd",
                zone_classification="URBAN METROPOLITAN",
            ),
            text=TextFeatures(
                narrative_summary="A white Hyundai Creta was stolen using a keyless frequency relay bypass."
            ),
            derived=DerivedFeatures(
                reporting_delay_minutes=120,
                incident_duration_minutes=30,
                accused_count=1,
                victim_count=0,
            ),
            behavioral=BehavioralFeatures(
                modus_operandi_tags=["relay_bypass"],
                repeat_offender_ratio=0.5,
                target_type="VEHICLE: HYUNDAI CRETA",
            ),
        ),
        CrimeSignature(
            crime_no="104430006202600002",
            case_master_id=1002,
            structured=StructuredFeatures(
                case_category="FIR",
                gravity_level="Heinous",
                major_head="Crimes Against Property",
                minor_head="Vehicle Theft",
                police_station_id=443,
                statutory_charges=["IPC_379", "IPC_34"],
            ),
            temporal=TemporalFeatures(
                hour_sin=0.5,
                hour_cos=0.866,
                day_sin=0.0,
                day_cos=1.0,
                is_holiday=True,
            ),
            spatial=SpatialFeatures(
                latitude=12.9780,
                longitude=77.5940,
                geohash_code="tdr1wgc",
                zone_classification="URBAN METROPOLITAN",
            ),
            text=TextFeatures(
                narrative_summary="Hyundai Creta stolen from driveway using keyless relay bypass."
            ),
            derived=DerivedFeatures(
                reporting_delay_minutes=60,
                incident_duration_minutes=30,
                accused_count=2,
                victim_count=0,
            ),
            behavioral=BehavioralFeatures(
                modus_operandi_tags=["relay_bypass"],
                repeat_offender_ratio=0.0,
                target_type="VEHICLE: HYUNDAI CRETA",
            ),
        ),
        # Case with lower match traits (leads to different confidence scores)
        CrimeSignature(
            crime_no="104430006202600003",
            case_master_id=1003,
            structured=StructuredFeatures(
                case_category="FIR",
                gravity_level="Non-Heinous",
                major_head="Crimes Against Person",
                minor_head="Simple Hurt",
                police_station_id=443,
                statutory_charges=["IPC_323"],
            ),
            temporal=TemporalFeatures(
                hour_sin=-0.707,
                hour_cos=-0.707,
                day_sin=-0.974,
                day_cos=-0.222,
                is_holiday=False,
            ),
            spatial=SpatialFeatures(
                latitude=12.9100,
                longitude=77.6200,
                geohash_code="tdr1tbf",
                zone_classification="COMMERCIAL ZONE",
            ),
            text=TextFeatures(
                narrative_summary="A verbal dispute broke out leading to minor assault."
            ),
            derived=DerivedFeatures(
                reporting_delay_minutes=30,
                incident_duration_minutes=30,
                accused_count=1,
                victim_count=1,
            ),
            behavioral=BehavioralFeatures(
                modus_operandi_tags=["verbal_dispute"],
                repeat_offender_ratio=0.0,
                target_type="PERSON: CIVILIAN",
            ),
        ),
    ]


def test_query_self_exclusion_retrieval(sample_cases: list[CrimeSignature]) -> None:
    """Critical Fix #1: Asserts that query case ID is filtered out of matching results list."""
    # 1. Setup ML Subsystems
    embedding_orchestrator = EmbeddingOrchestrator()

    index_manager = IndexManager()
    index_manager.rebuild_index(dimension=384)

    # Seed all three cases into search index
    vectors = []
    metadata_list = []
    for case in sample_cases:
        emb_res = embedding_orchestrator.get_embedding(case, model_name="minilm")
        vectors.append(emb_res.embedding_vector)
        metadata_list.append(
            CrimeMetadata(
                case_id=case.case_master_id,
                crime_signature_hash=emb_res.crime_signature_hash,
                embedding_version=emb_res.embedding_version.model_version,
                pipeline_version=emb_res.embedding_version.pipeline_version,
                feature_version=emb_res.embedding_version.feature_version,
                creation_timestamp=datetime.now(timezone.utc),
            )
        )
    index_manager.add_documents(vectors, metadata_list)

    search_engine = SearchEngine(manager=index_manager)
    similarity_engine = SimilarityEngine()

    pipeline = CrimeAnalysisPipeline(
        embedding_orchestrator=embedding_orchestrator,
        search_engine=search_engine,
        similarity_engine=similarity_engine,
    )
    executor = PipelineExecutor(pipeline=pipeline)

    # Resolve lookup map
    candidate_lookup = {case.case_master_id: case for case in sample_cases}

    # Execute pipeline querying Case 1001
    result = executor.run(
        query_signature=sample_cases[0],
        candidate_resolver=candidate_lookup,
        model_name="minilm",
        top_k=5,
    )

    # Assert Case 1001 is completely excluded from matching candidates
    matched_ids = [m.case_id for m in result.top_similar_crimes]
    assert 1001 not in matched_ids
    assert 1002 in matched_ids  # Candidate 1002 should match


def test_dynamic_confidence_calculation(sample_cases: list[CrimeSignature]) -> None:
    """Critical Fix #2: Asserts confidence calculation outputs dynamic scores."""
    engine = ConfidenceEngine()

    # 1. High match factors (close similarity)
    high_match_scores = {
        "embedding": 0.95,
        "crime_head": 1.0,
        "crime_sub_head": 1.0,
        "legal": 1.0,
        "temporal": 0.90,
        "spatial": 0.85,
        "behavior": 0.80,
    }
    high_res = engine.calculate_confidence(high_match_scores)
    assert isinstance(high_res, ConfidenceResult)
    assert high_res.score > 0.80
    assert high_res.score <= 1.0

    # 2. Lower match factors
    low_match_scores = {
        "embedding": 0.15,
        "crime_head": 0.0,
        "crime_sub_head": 0.0,
        "legal": 0.0,
        "temporal": 0.20,
        "spatial": 0.10,
        "behavior": 0.05,
    }
    low_res = engine.calculate_confidence(low_match_scores)
    assert low_res.score < 0.30
    assert low_res.score >= 0.0

    # Check variation difference
    assert high_res.score != low_res.score
