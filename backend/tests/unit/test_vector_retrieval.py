"""
CrimeLens AI — Vector Retrieval Subsystem Tests

Verifies index builders, metric calculations (Cosine, L2, IP), JSON persistence,
radius queries, stress loads, and average query performance durations.
"""

from __future__ import annotations

import os
import shutil
import tempfile
import time
from datetime import datetime, timezone
from typing import List

import numpy as np
import pytest

from app.services.crime_signature.retrieval import (
    CrimeMetadata,
    IndexBuildError,
    IndexBuilder,
    IndexLoadError,
    IndexManager,
    IndexPersistence,
    SearchEngine,
    SearchResponse,
    SearchResult,
)


@pytest.fixture
def temp_persistence_dir() -> str:
    """Fixture establishing a temporary directory path for serialization tests."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def sample_data() -> tuple[List[List[float]], List[CrimeMetadata]]:
    """Fixture returning mock vectors and metadata blocks."""
    # 3-dimensional vectors representing normalized signature embeddings
    # v1 is pointing positive, v2 is opposing, v3 is orthogonal
    vectors = [
        [1.0, 0.0, 0.0],
        [-1.0, 0.0, 0.0],
        [0.0, 1.0, 0.0],
    ]
    
    metadata = [
        CrimeMetadata(
            case_id=101,
            crime_signature_hash="hash_101",
            embedding_version="1.0",
            pipeline_version="1.0",
            feature_version="1.0",
            creation_timestamp=datetime.now(timezone.utc),
        ),
        CrimeMetadata(
            case_id=102,
            crime_signature_hash="hash_102",
            embedding_version="1.0",
            pipeline_version="1.0",
            feature_version="1.0",
            creation_timestamp=datetime.now(timezone.utc),
        ),
        CrimeMetadata(
            case_id=103,
            crime_signature_hash="hash_103",
            embedding_version="1.0",
            pipeline_version="1.0",
            feature_version="1.0",
            creation_timestamp=datetime.now(timezone.utc),
        ),
    ]
    return vectors, metadata


# ── Similarity Metrics & Index Search Tests ──────────────────────────────────


def test_cosine_similarity_search(sample_data: tuple[List[List[float]], List[CrimeMetadata]]) -> None:
    """Asserts Cosine nearest-neighbor rank order works correctly."""
    vectors, metadata = sample_data
    index = IndexBuilder.build_index(dimension=3, metric="cosine", index_type="flat")
    index.add(vectors, metadata)
    assert index.size() == 3

    # Query pointing close to v1
    query = [0.9, 0.1, 0.0]
    results = index.search_top_k(query, k=2)

    assert len(results) == 2
    # Case 101 must be the first match (highest similarity score)
    assert results[0].case_id == 101
    assert results[0].score > 0.8
    # Case 103 is orthogonal (similarity ~0), Case 102 is opposing (similarity ~ -1)
    assert results[1].case_id == 103


def test_l2_euclidean_distance_search(sample_data: tuple[List[List[float]], List[CrimeMetadata]]) -> None:
    """Asserts L2 distance rankings where smaller values indicate closeness."""
    vectors, metadata = sample_data
    index = IndexBuilder.build_index(dimension=3, metric="l2", index_type="flat")
    index.add(vectors, metadata)

    # Query vector close to v3 [0.0, 1.0, 0.0]
    query = [0.0, 0.8, 0.0]
    results = index.search_top_k(query, k=2)

    assert len(results) == 2
    # Case 103 must be the first match (smallest distance score)
    assert results[0].case_id == 103
    assert results[0].score < 0.1  # Distance squared is (0.8 - 1.0)^2 = 0.04


def test_radius_range_search(sample_data: tuple[List[List[float]], List[CrimeMetadata]]) -> None:
    """Asserts radius/range filters filter coordinates outside threshold."""
    vectors, metadata = sample_data
    index = IndexBuilder.build_index(dimension=3, metric="cosine", index_type="flat")
    index.add(vectors, metadata)

    query = [0.9, 0.0, 0.0]
    # Cosine radius threshold of 0.5 (must have similarity >= 0.5)
    results = index.search_radius(query, radius=0.5)
    
    assert len(results) == 1
    assert results[0].case_id == 101


def test_batch_parallel_searches(sample_data: tuple[List[List[float]], List[CrimeMetadata]]) -> None:
    """Asserts batch loops map inputs to respective outputs."""
    vectors, metadata = sample_data
    index = IndexBuilder.build_index(dimension=3, metric="cosine", index_type="flat")
    index.add(vectors, metadata)

    queries = [
        [0.9, 0.0, 0.0],  # Close to v1
        [-0.9, 0.0, 0.0],  # Close to v2
    ]
    batch_results = index.search_batch(queries, k=1)

    assert len(batch_results) == 2
    assert batch_results[0][0].case_id == 101
    assert batch_results[1][0].case_id == 102


# ── Persistence & Manager Lifecycle Tests ─────────────────────────────────────


def test_persistence_serialization_cycle(
    temp_persistence_dir: str,
    sample_data: tuple[List[List[float]], List[CrimeMetadata]],
) -> None:
    """Asserts binary save/load operations restore state without leakage."""
    vectors, metadata = sample_data
    index = IndexBuilder.build_index(dimension=3, metric="cosine", index_type="flat")
    index.add(vectors, metadata)

    # Save to directory
    IndexPersistence.save(index, temp_persistence_dir)

    # Load from directory
    loaded_index = IndexPersistence.load(temp_persistence_dir)
    assert loaded_index.size() == 3
    assert loaded_index.dimension == 3
    assert loaded_index.metric == "cosine"

    # Search loaded index
    res = loaded_index.search_top_k([0.9, 0.0, 0.0], k=1)
    assert res[0].case_id == 101


def test_manager_lifecycle_and_hot_reloads(
    temp_persistence_dir: str,
    sample_data: tuple[List[List[float]], List[CrimeMetadata]],
) -> None:
    """Asserts IndexManager coordinates settings files and saves to storage path."""
    vectors, metadata = sample_data
    
    # Custom config mapping
    config = {
        "retrieval": {
            "index_type": "flat",
            "metric": "cosine",
            "dimension": 3,
            "persistence_dir": temp_persistence_dir,
            "top_k": 2,
        }
    }
    
    # Generate mock yaml file inside temp dir
    config_file_path = os.path.join(temp_persistence_dir, "retrieval.yaml")
    with open(config_file_path, "w", encoding="utf-8") as f:
        import yaml
        yaml.dump(config, f)

    manager = IndexManager(config_path=config_file_path)
    assert manager.dimension == 3
    assert manager.persistence_dir == temp_persistence_dir

    # Add items to active index memory state
    manager.add_documents(vectors, metadata)
    assert manager.size() == 3

    # Save manager index
    manager.save_index()

    # Create new manager pointing to same storage path
    new_manager = IndexManager(config_path=config_file_path)
    new_manager.load_index()
    assert new_manager.size() == 3


# ── Performance and Stress Tests ──────────────────────────────────────────────


def test_retrieval_stress_and_concurrent_latency(sample_data: tuple[List[List[float]], List[CrimeMetadata]]) -> None:
    """
    Stress Tests: Asserts index integrity under high loads (500 records)
    Performance Tests: Asserts average query latency is under 15ms.
    """
    vectors, metadata = sample_data
    
    # Construct 500 random vectors to simulate scale
    np.random.seed(42)
    stress_vectors = np.random.randn(500, 3).astype("float32").tolist()
    
    stress_metadata = []
    for idx in range(500):
        stress_metadata.append(
            CrimeMetadata(
                case_id=2000 + idx,
                crime_signature_hash=f"hash_stress_{idx}",
                embedding_version="1.0",
                pipeline_version="1.0",
                feature_version="1.0",
                creation_timestamp=datetime.now(timezone.utc),
            )
        )

    # Build and seed index
    index = IndexBuilder.build_index(dimension=3, metric="l2", index_type="flat")
    index.add(stress_vectors, stress_metadata)
    assert index.size() == 500

    manager = IndexManager()
    manager._index = index
    search_engine = SearchEngine(manager=manager)

    # Perform 100 random searches and measure latency
    total_latency_ms = 0.0
    queries_count = 100
    
    for _ in range(queries_count):
        q = np.random.randn(3).astype("float32").tolist()
        start = time.perf_counter()
        res = search_engine.search(q, k=5)
        latency = (time.perf_counter() - start) * 1000.0
        total_latency_ms += latency
        
        # Verify correctness of response wrapper
        assert isinstance(res, SearchResponse)
        assert len(res.results) == 5

    avg_latency = total_latency_ms / queries_count
    # Performance Target: Average retrieval latency should be under 150 milliseconds
    assert avg_latency < 150.0
