"""
CrimeLens AI — API Pattern Endpoints

Exposes detailed crime signature comparison, similarity overlays, and matched playbook metrics.
"""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.setup import get_db
from app.infrastructure.database.repositories.sqlite_repository import SQLiteFIRRepository
from app.core.dependencies import get_pipeline_executor, SIGNATURES_DB

router = APIRouter()


@router.get("/{case_id}", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def get_pattern_analysis(case_id: int, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    Computes dynamic similarity patterns and matched feature rationales for a case.
    """
    repo = SQLiteFIRRepository(db)
    
    # 1. Resolve case signature
    query_sig = SIGNATURES_DB.get(case_id)
    if not query_sig:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case ID {case_id} was not found in the signature cache."
        )

    executor = get_pipeline_executor()
    candidate_lookup = {**SIGNATURES_DB}

    # 2. Run similarity pipeline
    try:
        pipeline_res = executor.run(
            query_signature=query_sig,
            candidate_resolver=candidate_lookup,
            model_name="minilm",
            top_k=5,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pattern analysis pipeline execution failed: {str(exc)}"
        )

    # 3. Format response matching PatternAnalysis expectation
    similar_cases_list = []
    for match in pipeline_res.top_similar_crimes[:5]:
        similar_cases_list.append({
            "case_id": f"FIR-{match.case_id}",
            "crime_no": f"1100040020260000{match.case_id}",
            "similarity": round(match.overall_similarity * 100, 1),
            "confidence": round(match.confidence * 100, 1),
            "matched_features": match.matched_features,
            "rationale": match.explanation.rationale
        })

    # Assemble explainability scores mapping weights
    explainability = {
        "embedding_alignment": 0.45,
        "crime_head_correlation": 0.10,
        "crime_sub_head_correlation": 0.05,
        "statutory_charge_matching": 0.10,
        "temporal_proximity": 0.10,
        "spatial_proximity": 0.10,
        "behavioral_similarity": 0.10
    }

    performance = {
        "embedding_ms": pipeline_res.processing_times_ms.get("embedding_generation", 0.0),
        "retrieval_ms": pipeline_res.processing_times_ms.get("vector_retrieval", 0.0),
        "ranking_ms": pipeline_res.processing_times_ms.get("similarity_scoring", 0.0),
        "total_ms": pipeline_res.processing_times_ms.get("total_pipeline", 0.0)
    }

    return {
        "id": f"FIR-{case_id}",
        "crimeSignature": {
            "case_master_id": query_sig.case_master_id,
            "crime_no": query_sig.crime_no,
            "brief_facts": query_sig.text.narrative_summary,
            "major_head": query_sig.structured.major_head,
            "minor_head": query_sig.structured.minor_head,
            "police_station_id": query_sig.structured.police_station_id,
        },
        "similarCases": similar_cases_list,
        "explainability": explainability,
        "performance": performance
    }
