"""
CrimeLens AI — API Analysis Endpoints

Provides route handlers for case similarity analyses and metrics queries.
"""

from __future__ import annotations

import time
from typing import Dict

from fastapi import APIRouter, HTTPException, status

from app.api.v1.schemas.analysis import (
    AnalyzeRequest,
    AnalyzeResponse,
    MetricsResponse,
    PerformanceMetrics,
    QueryCaseResponse,
    SimilarCaseResponse,
)
from app.core.dependencies import (
    MetricsTrackerDep,
    PipelineExecutorDep,
    SIGNATURES_DB,
)
from app.domain.models.ingested_case import IngestedCase
from app.services.crime_signature.core import create_default_pipeline

router = APIRouter()


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Case Similarity",
    description=(
        "Executes the CrimeAnalysisPipeline on a target case. "
        "Can look up an existing case by ID or process a raw case/FIR payload log. "
        "Returns the preprocessed query case, a ranked list of similar historical crimes, "
        "and execution performance metrics."
    ),
    tags=["Analysis"],
)
async def analyze_case(
    request_data: AnalyzeRequest,
    executor: PipelineExecutorDep,
    tracker: MetricsTrackerDep,
) -> AnalyzeResponse:
    """Runs end-to-end case matching analysis."""
    # 1. Input Validation: Check mutual exclusivity
    if request_data.case_id is not None and request_data.raw_payload is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either 'case_id' or 'raw_payload', but not both.",
        )
    if request_data.case_id is None and request_data.raw_payload is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either 'case_id' or 'raw_payload' details.",
        )

    query_sig = None
    start_pipeline_time = time.perf_counter()

    # 2. Resolve query case signature
    if request_data.case_id is not None:
        try:
            cid = int(request_data.case_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Case ID must be an integer (got: {request_data.case_id}).",
            )
        
        query_sig = SIGNATURES_DB.get(cid)
        if query_sig is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Case ID {cid} was not found in the database.",
            )
    else:
        # Parse and process raw payload dynamically
        try:
            ingested = IngestedCase.model_validate(request_data.raw_payload)
            sig_pipeline = create_default_pipeline()
            query_sig, _ = sig_pipeline.execute(ingested)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to validate raw FIR payload: {str(exc)}",
            )

    # 3. Assemble lookups mapping candidate cases
    # Include all pre-seeded records + the query signature itself (orchestrator handles self-exclusion)
    candidate_lookup = {**SIGNATURES_DB}
    if query_sig.case_master_id not in candidate_lookup:
        candidate_lookup[query_sig.case_master_id] = query_sig

    # 4. Execute Analysis Pipeline
    try:
        pipeline_res = executor.run(
            query_signature=query_sig,
            candidate_resolver=candidate_lookup,
            model_name="minilm",
            top_k=20,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pipeline execution failed: {str(exc)}",
        )

    # Calculate overall route duration
    total_ms = (time.perf_counter() - start_pipeline_time) * 1000.0
    tracker.record_analysis(total_ms)

    # 5. Format response payload details
    similar_cases_list = [
        SimilarCaseResponse(
            case_id=str(c.case_id),
            similarity=c.overall_similarity,
            confidence=c.confidence,
            matched_features=c.matched_features,
        )
        for c in pipeline_res.top_similar_crimes
    ]

    performance = PerformanceMetrics(
        embedding_ms=pipeline_res.processing_times_ms.get("embedding_generation", 0.0),
        retrieval_ms=pipeline_res.processing_times_ms.get("vector_retrieval", 0.0),
        ranking_ms=pipeline_res.processing_times_ms.get("similarity_scoring", 0.0),
        total_ms=pipeline_res.processing_times_ms.get("total_pipeline", 0.0),
    )

    return AnalyzeResponse(
        query_case=QueryCaseResponse(
            case_master_id=query_sig.case_master_id,
            crime_no=query_sig.crime_no,
            brief_facts=query_sig.text.narrative_summary,
        ),
        similar_cases=similar_cases_list,
        performance=performance,
    )


@router.get(
    "/metrics",
    response_model=MetricsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Pipeline Metrics",
    description="Returns performance statistics for the AI Inference Pipeline, including average latencies and cache hits.",
    tags=["Analysis"],
)
async def get_pipeline_metrics(
    executor: PipelineExecutorDep,
    tracker: MetricsTrackerDep,
) -> MetricsResponse:
    """Returns analytics metadata and performance trackers."""
    emb_orch = executor.pipeline.embedding_orchestrator
    search_eng = executor.pipeline.search_engine

    # Cache hit rate calculations
    total_lookups = emb_orch.cache.hits + emb_orch.cache.misses
    cache_rate = 0.0
    if total_lookups > 0:
        cache_rate = round(emb_orch.cache.hits / total_lookups, 3)

    return MetricsResponse(
        average_latency_ms=tracker.average_latency_ms,
        total_analyses=tracker.total_analyses,
        cache_hit_rate=cache_rate,
        index_size=search_eng.manager.size(),
        model_version=emb_orch.default_model_name,
        pipeline_version="1.0.0",
    )
