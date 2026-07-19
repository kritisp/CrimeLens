"""
CrimeLens AI — End-to-End System Integration Tests

Runs a full execution sweep from Raw FIR ingestion and feature engineering pipelines,
to vector indexing, search queries, and hybrid similarity re-ranking.
"""

from __future__ import annotations

import os
import tempfile
from datetime import datetime, timezone

import pytest

from app.domain.models.ingested_case import IngestedCase
from app.services.crime_signature.core import create_default_pipeline
from app.services.crime_signature.embedding.orchestrator import EmbeddingOrchestrator
from app.services.crime_signature.pipeline.executor import PipelineExecutor
from app.services.crime_signature.pipeline.models import PipelineResult
from app.services.crime_signature.retrieval import CrimeMetadata, IndexManager
from app.services.crime_signature.retrieval.search_engine import SearchEngine
from app.services.crime_signature.similarity.engine import SimilarityEngine
from examples.demo_end_to_end import generate_synthetic_dataset


def test_end_to_end_system_integration() -> None:
    """
    Verifies that the entire ML stack executes end-to-end successfully.
    """
    # 1. Ingestion: Generate synthetic IngestedCase records (25 records)
    raw_cases = generate_synthetic_dataset()
    assert len(raw_cases) == 25

    # 2. Features: Run cases through the CrimeSignaturePipeline
    sig_pipeline = create_default_pipeline()
    signatures = []
    for raw_case in raw_cases:
        sig, context = sig_pipeline.execute(raw_case)
        signatures.append(sig)
    assert len(signatures) == 25

    # 3. Embedding: Setup embedding orchestrator
    embedding_orchestrator = EmbeddingOrchestrator()

    # 4. Retrieval: Setup index manager and seed FAISS index
    index_manager = IndexManager()
    index_manager.rebuild_index(dimension=384)

    vectors = []
    metadata_list = []

    # Map signatures to coordinates and metadata
    for sig in signatures:
        emb_res = embedding_orchestrator.get_embedding(sig, model_name="minilm")
        vectors.append(emb_res.embedding_vector)
        metadata_list.append(
            CrimeMetadata(
                case_id=sig.case_master_id,
                crime_signature_hash=emb_res.crime_signature_hash,
                embedding_version=emb_res.embedding_version.model_version,
                pipeline_version=emb_res.embedding_version.pipeline_version,
                feature_version=emb_res.embedding_version.feature_version,
                creation_timestamp=datetime.now(timezone.utc),
            )
        )

    # Seed Index
    index_manager.add_documents(vectors, metadata_list)
    assert index_manager.size() == 25

    search_engine = SearchEngine(manager=index_manager)
    similarity_engine = SimilarityEngine()

    # 5. Pipeline Orchestration: Wires pipeline executor
    executor = PipelineExecutor()
    executor.pipeline.embedding_orchestrator = embedding_orchestrator
    executor.pipeline.search_engine = search_engine
    executor.pipeline.similarity_engine = similarity_engine

    # 6. Execute End-to-End Query Analysis on Case 1000
    query_case = signatures[0]
    candidate_lookup = {sig.case_master_id: sig for sig in signatures}

    result = executor.run(
        query_signature=query_case,
        candidate_resolver=candidate_lookup,
        model_name="minilm",
        top_k=20,
    )

    # 7. Asserts output verification
    assert isinstance(result, PipelineResult)
    assert result.query_crime.case_master_id == 1000
    
    # Assert re-ranked list is returned and excludes query case 1000
    assert len(result.top_similar_crimes) >= 1
    assert 1000 not in [m.case_id for m in result.top_similar_crimes]


    # Assert timings list is populated
    assert "embedding_generation" in result.processing_times_ms
    assert "vector_retrieval" in result.processing_times_ms
    assert "similarity_scoring" in result.processing_times_ms
    assert "total_pipeline" in result.processing_times_ms
