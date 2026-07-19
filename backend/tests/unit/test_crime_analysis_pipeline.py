"""
CrimeLens AI — Crime Analysis Pipeline Integration Tests

Verifies end-to-end orchestration of all ML Core components. Tests embedding
generations, nearest neighbor searches, candidate resolutions, re-rankings,
timings metrics, and exceptions handling.
"""

from __future__ import annotations

import time
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
from app.services.crime_signature.embedding.orchestrator import EmbeddingOrchestrator
from app.services.crime_signature.pipeline import (
    CrimeAnalysisPipeline,
    ExecutionError,
    PipelineExecutor,
    PipelineResult,
)
from app.services.crime_signature.retrieval import CrimeMetadata, IndexManager
from app.services.crime_signature.retrieval.search_engine import SearchEngine
from app.services.crime_signature.similarity.engine import SimilarityEngine


@pytest.fixture
def sample_signatures() -> list[CrimeSignature]:
    """Fixture returning sample cases."""
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
                narrative_summary="A white Hyundai Creta was stolen using a relay bypass keyless device."
            ),
            derived=DerivedFeatures(
                reporting_delay_minutes=360,
                incident_duration_minutes=30,
                accused_count=1,
                victim_count=0,
            ),
            behavioral=BehavioralFeatures(
                modus_operandi_tags=["relay_bypass", "organized_syndicate"],
                repeat_offender_ratio=1.0,
                target_type="VEHICLE: HYUNDAI CRETA",
            ),
        ),
        # Slightly different case (low matching Mo)
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
                narrative_summary="Hyundai Creta vehicle stolen from driveway using keyless relay bypass frequencies."
            ),
            derived=DerivedFeatures(
                reporting_delay_minutes=120,
                incident_duration_minutes=15,
                accused_count=2,
                victim_count=0,
            ),
            behavioral=BehavioralFeatures(
                modus_operandi_tags=["relay_bypass", "masked_suspects"],
                repeat_offender_ratio=0.5,
                target_type="VEHICLE: HYUNDAI CRETA",
            ),
        ),
    ]


def test_pipeline_executor_end_to_end(sample_signatures: list[CrimeSignature]) -> None:
    """Verifies end-to-end pipeline execution with active seeding inputs."""
    # 1. Setup ML Subsystems
    embedding_orchestrator = EmbeddingOrchestrator()

    index_manager = IndexManager()
    index_manager.rebuild_index(dimension=384)

    # Seed vector retrieval index
    vectors = []
    metadata_list = []
    for case in sample_signatures:
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

    # 2. Wires pipeline orchestrator
    pipeline = CrimeAnalysisPipeline(
        embedding_orchestrator=embedding_orchestrator,
        search_engine=search_engine,
        similarity_engine=similarity_engine,
    )
    executor = PipelineExecutor(pipeline=pipeline)

    # Resolve map mapping Case IDs to Signatures
    candidate_lookup = {case.case_master_id: case for case in sample_signatures}

    # 3. Run Pipeline execution on query case 1001
    result = executor.run(
        query_signature=sample_signatures[0],
        candidate_resolver=candidate_lookup,
        model_name="minilm",
        top_k=5,
    )

    # 4. Asserts correct output structural payloads
    assert isinstance(result, PipelineResult)
    assert result.query_crime.case_master_id == 1001
    
    # Assert ranked results are populated (1001 is excluded by self-exclusion)
    assert len(result.top_similar_crimes) >= 1
    assert result.top_similar_crimes[0].case_id == 1002  # Identity query 1001 is excluded, leaving 1002
    assert 1001 not in [m.case_id for m in result.top_similar_crimes]


    # Assert processing times keys are populated
    assert "embedding_generation" in result.processing_times_ms
    assert "vector_retrieval" in result.processing_times_ms
    assert "similarity_scoring" in result.processing_times_ms
    assert "total_pipeline" in result.processing_times_ms

    for stage, duration in result.processing_times_ms.items():
        assert duration >= 0.0

    # Assert metadata metrics
    assert result.embedding_metadata.model_name == "minilm"
    assert result.search_metadata["index_size"] == 2
    assert result.search_metadata["index_type"] == "flat"


def test_pipeline_missing_candidates_warnings(sample_signatures: list[CrimeSignature]) -> None:
    """Asserts pipeline adds a warning if candidate signatures cannot be resolved."""
    embedding_orchestrator = EmbeddingOrchestrator()

    index_manager = IndexManager()
    index_manager.rebuild_index(dimension=384)

    # Seed query
    emb_res = embedding_orchestrator.get_embedding(sample_signatures[0], model_name="minilm")
    meta = CrimeMetadata(
        case_id=999,  # Orphan Case ID (not present in lookup dictionary)
        crime_signature_hash=emb_res.crime_signature_hash,
        embedding_version="1.0",
        pipeline_version="1.0",
        feature_version="1.0",
        creation_timestamp=datetime.now(timezone.utc),
    )
    index_manager.add_documents([emb_res.embedding_vector], [meta])
    search_engine = SearchEngine(manager=index_manager)

    pipeline = CrimeAnalysisPipeline(
        embedding_orchestrator=embedding_orchestrator,
        search_engine=search_engine,
        similarity_engine=SimilarityEngine(),
    )

    # Resolver with empty map lookup (triggers warning)
    result = pipeline.analyze(
        query_signature=sample_signatures[0],
        candidate_resolver={},
        model_name="minilm",
        top_k=2,
    )

    # Assert warnings list is logged in search_metadata
    assert any("Failed to resolve candidate" in w for w in result.search_metadata["warnings"])
    assert len(result.top_similar_crimes) == 0


def test_pipeline_unconfigured_model_exception(sample_signatures: list[CrimeSignature]) -> None:
    """Asserts ExecutionError triggers when querying unconfigured models."""
    pipeline = CrimeAnalysisPipeline()
    
    with pytest.raises(ExecutionError) as exc:
        pipeline.analyze(
            query_signature=sample_signatures[0],
            candidate_resolver={},
            model_name="unregistered_model",
        )
    assert "Embedding stage failed" in str(exc.value)
