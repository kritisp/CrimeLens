"""
CrimeLens AI — Embedding Framework Unit Tests

Verifies ModelRegistry behaviors, cache evictions, unit-normalized coordinate
projections, latency diagnostics, pre/postprocessing pipelines, lifecycle management,
and exceptions triggers.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import List, Union

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
from app.services.crime_signature.embedding import (
    EmbeddingCache,
    EmbeddingMetadata,
    EmbeddingOrchestrator,
    EmbeddingResult,
    ModelLoadError,
    ModelNotFoundError,
    ModelRegistry,
    SentenceTransformerProvider,
)
from app.services.crime_signature.embedding.exceptions import EmbeddingError
from app.services.crime_signature.embedding.manager import EmbeddingManager
from app.services.crime_signature.embedding.processors import (
    EmbeddingPostProcessor,
    EmbeddingPreprocessor,
    EmbeddingValidator,
)


@pytest.fixture
def mock_crime_signature() -> CrimeSignature:
    """Fixture returning a canonical CrimeSignature domain object."""
    return CrimeSignature(
        crime_no="104430006202600001",
        case_master_id=1024,
        structured=StructuredFeatures(
            case_category="FIR",
            gravity_level="Heinous",
            major_head="Crimes Against Property",
            minor_head="Vehicle Theft",
            police_station_id=443,
            statutory_charges=["IPC_379", "IPC_34"],
        ),
        temporal=TemporalFeatures(
            hour_sin=0.608761,
            hour_cos=0.793353,
            day_sin=-0.781831,
            day_cos=0.62349,
            is_holiday=True,
        ),
        spatial=SpatialFeatures(
            latitude=12.9785,
            longitude=77.5946,
            geohash_code="tdr1wgd",
            zone_classification="URBAN METROPOLITAN",
        ),
        text=TextFeatures(
            narrative_summary="A white Hyundai Creta was stolen using an electronic relay keyless device."
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
    )


# ── Registry & Providers Tests ───────────────────────────────────────────────


def test_registry_registration_and_lookup() -> None:
    """Asserts ModelRegistry maps decorators and triggers errors on missing keys."""
    provider_cls = ModelRegistry.get_provider_class("sentence_transformers")
    assert provider_cls is SentenceTransformerProvider

    with pytest.raises(ValueError) as exc:
        ModelRegistry.get_provider_class("unregistered_provider_key")
    assert "is not registered in ModelRegistry" in str(exc.value)


def test_provider_raw_vector_generation() -> None:
    """Asserts raw mock vectors are deterministic and computed correctly."""
    provider = SentenceTransformerProvider()
    provider.initialize(
        {
            "model_name": "minilm",
            "model_path": "all-MiniLM-L6-v2",
            "dimension": 384,
            "mock_mode": True,
        }
    )

    vec1 = provider.embed_raw("Test facts summary")
    vec2 = provider.embed_raw("Test facts summary")

    assert vec1 == vec2
    assert len(vec1) == 384


# ── Pipeline Processors Tests ────────────────────────────────────────────────


def test_embedding_preprocessor() -> None:
    """Asserts preprocessor prepends search prefixes correctly."""
    preprocessor = EmbeddingPreprocessor(prefix="query: ")
    res = preprocessor.preprocess("Target theft crime scene")
    assert res == "query: Target theft crime scene"

    empty_prep = EmbeddingPreprocessor(prefix="")
    assert empty_prep.preprocess("Simple text") == "Simple text"


def test_embedding_post_processor() -> None:
    """Asserts postprocessor normalizes coordinates using L2 norm."""
    post_processor = EmbeddingPostProcessor(normalize=True)
    raw_vec = [3.0, 4.0]  # L2 norm is 5.0
    norm_vec = post_processor.postprocess(raw_vec)
    assert norm_vec == [0.6, 0.8]
    assert abs(math.sqrt(sum(x * x for x in norm_vec)) - 1.0) < 1e-5

    no_norm = EmbeddingPostProcessor(normalize=False)
    assert no_norm.postprocess([3.0, 4.0]) == [3.0, 4.0]


def test_embedding_validator() -> None:
    """Asserts validator raises error on wrong dimensions or NAN values."""
    validator = EmbeddingValidator(expected_dimension=3)
    
    # Valid vector passes
    validator.validate([0.1, 0.2, 0.3])

    # Dimensional failure raises error
    with pytest.raises(EmbeddingError) as exc:
        validator.validate([0.1, 0.2])
    assert "Dimensionality mismatch" in str(exc.value)

    # NaN / Inf raises error
    with pytest.raises(EmbeddingError) as exc_nan:
        validator.validate([0.1, float("nan"), 0.3])
    assert "invalid float pattern" in str(exc_nan.value)


# ── Model Lifecycle Management Tests ──────────────────────────────────────────


def test_embedding_model_lifecycle(mock_crime_signature: CrimeSignature) -> None:
    """Asserts load, warmup, health, reload, and unload transitions inside manager."""
    provider = SentenceTransformerProvider()
    config = {
        "model_name": "minilm",
        "model_path": "all-MiniLM-L6-v2",
        "dimension": 384,
        "mock_mode": True,
    }
    
    manager = EmbeddingManager(provider, config)
    assert not manager.is_loaded
    assert not manager.is_healthy

    # 1. Load weights
    manager.load()
    assert manager.is_loaded

    # 2. Warmup model
    warmup_time = manager.warmup()
    assert warmup_time > 0.0
    assert manager.is_healthy

    # 3. Health check runs successfully
    assert manager.health_check() is True

    # 4. Unload model cleans up references
    manager.unload()
    assert not manager.is_loaded
    assert not manager.is_healthy


# ── Cache Tests ──────────────────────────────────────────────────────────────


def test_cache_hits_misses_and_evictions() -> None:
    """Asserts cache size limits, eviction policies, and hit rate diagnostics."""
    cache = EmbeddingCache(max_size=3)
    
    version = {"model_version": "1.0", "feature_version": "1.0", "pipeline_version": "1.0"}
    res_mock = lambda h: EmbeddingResult(
        embedding_vector=[0.1, 0.2, 0.3],
        model_name="minilm",
        embedding_dimension=3,
        embedding_version=version,  # type: ignore[arg-type]
        inference_latency_ms=1.2,
        generation_timestamp=datetime.now(timezone.utc),
        crime_signature_hash=h,
    )

    assert cache.get("k1") is None
    assert cache.misses == 1

    cache.set("k1", res_mock("k1"))
    cache.set("k2", res_mock("k2"))
    cache.set("k3", res_mock("k3"))
    assert cache.size == 3

    assert cache.get("k1") is not None
    assert cache.hits == 1

    cache.set("k4", res_mock("k4"))
    assert cache.size == 3
    assert cache.get("k1") is None  # Evicted
    assert cache.get("k4") is not None


# ── Orchestrator Integration Tests ───────────────────────────────────────────


def test_orchestrator_initialization_and_registry_yaml() -> None:
    """Asserts configuration lookup and lifecycle registrations mapping."""
    orchestrator = EmbeddingOrchestrator()
    assert orchestrator.default_model_name in ("minilm", "bge", "e5")

    # Assert active model managers are populated
    assert "minilm" in orchestrator._managers
    assert "bge" in orchestrator._managers
    assert "e5" in orchestrator._managers

    metadata = orchestrator.get_model_metadata("minilm")
    assert metadata.model_name == "minilm"
    assert metadata.dimension == 384


def test_orchestrator_processing_pipeline(mock_crime_signature: CrimeSignature) -> None:
    """Verifies end-to-end pipeline execution with lifecycle manager triggers."""
    orchestrator = EmbeddingOrchestrator()
    orchestrator.cache.clear()

    # 1. Pipeline Execution runs pre-loading & warmup lifecycle hooks automatically
    res = orchestrator.get_embedding(mock_crime_signature, model_name="e5")
    assert isinstance(res, EmbeddingResult)
    assert res.embedding_dimension == 768  # e5 uses 768 dimensions in config
    assert len(res.embedding_vector) == 768

    # Assert L2 Normalization (approx 1.0)
    l2_norm = math.sqrt(sum(x * x for x in res.embedding_vector))
    assert abs(l2_norm - 1.0) < 1e-5

    # Check that cache hits are resolved on subsequent runs
    res_cached = orchestrator.get_embedding(mock_crime_signature, model_name="e5")
    assert res.embedding_vector == res_cached.embedding_vector
    assert orchestrator.cache.hits == 1
    assert orchestrator.cache.misses == 1


def test_orchestrator_missing_model_exception(mock_crime_signature: CrimeSignature) -> None:
    """Asserts ModelNotFoundError triggers when asking for non-existing model codes."""
    orchestrator = EmbeddingOrchestrator()
    with pytest.raises(ModelNotFoundError) as exc:
        orchestrator.get_embedding(mock_crime_signature, model_name="unconfigured_model")
    assert "is not configured in ModelRegistry" in str(exc.value)
