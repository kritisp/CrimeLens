"""
CrimeLens AI — API Analysis Schemas

Defines Pydantic models for incoming requests and outgoing structured responses.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    """Request payload for case analysis."""

    case_id: Optional[Union[str, int]] = Field(
        None,
        description="Database reference key of an existing case to query.",
        examples=[1000, "1000"],
    )
    raw_payload: Optional[Dict[str, Any]] = Field(
        None,
        description="Full raw case / FIR payload logs to analyze dynamically (alternative to case_id).",
        examples=[{
            "case_master_id": 1099,
            "crime_no": "110000400202600000",
            "case_category": "FIR",
            "gravity_offence": "Heinous",
            "crime_major_head": "Crimes Against Property",
            "crime_minor_head": "Vehicle Theft",
            "police_station_id": 401,
            "incident_date_from": "2026-06-01T00:00:00",
            "info_received_ps_date": "2026-06-01T02:00:00",
            "latitude": 12.97,
            "longitude": 77.59,
            "brief_facts": "A black Royal Enfield Bullet was stolen outside residence.",
            "complainant": {"age": 25, "gender_id": 1, "occupation": "Business"},
            "victims": [{"age": 30, "gender_id": 1, "is_police": False}],
            "accused_list": [{"age": 22, "gender_id": 1, "person_sequence": "A1"}],
            "statutory_charges": [{"act_code": "IPC", "section_code": "379"}]
        }]
    )

    class Config:
        json_schema_extra = {
            "example": {
                "case_id": 1000
            }
        }


class QueryCaseResponse(BaseModel):
    """Basic details of the query case analyzed."""

    case_master_id: int = Field(..., description="Relational database reference key.")
    crime_no: str = Field(..., description="Canonical registration crime identifier.")
    brief_facts: str = Field(..., description="Preprocessed narrative facts details.")


class SimilarCaseResponse(BaseModel):
    """Basic details of a matched candidate case."""

    case_id: str = Field(..., description="Relational database reference key string.")
    similarity: float = Field(..., description="Hybrid similarity score index [0.0 - 1.0].")
    confidence: float = Field(..., description="Match confidence estimation score [0.0 - 1.0].")
    matched_features: List[str] = Field(..., description="List of high matching features blocks.")


class PerformanceMetrics(BaseModel):
    """Breakdown of process timings in milliseconds."""

    embedding_ms: float = Field(..., description="Latencies generating text vector embeddings.")
    retrieval_ms: float = Field(..., description="Latencies querying FAISS nearest neighbors.")
    ranking_ms: float = Field(..., description="Latencies re-ranking candidates using similarities.")
    total_ms: float = Field(..., description="Total pipeline latency duration.")


class AnalyzeResponse(BaseModel):
    """Response payload returned by POST /analyze."""

    query_case: QueryCaseResponse = Field(..., description="Processed query case properties.")
    similar_cases: List[SimilarCaseResponse] = Field(..., description="List of re-ranked similar cases.")
    performance: PerformanceMetrics = Field(..., description="Execution speed metrics.")

    class Config:
        json_schema_extra = {
            "example": {
                "query_case": {
                    "case_master_id": 1000,
                    "crime_no": "110000400202600000",
                    "brief_facts": "A black Royal Enfield Bullet was stolen outside residence."
                },
                "similar_cases": [
                    {
                        "case_id": "1020",
                        "similarity": 0.799,
                        "confidence": 0.799,
                        "matched_features": ["EMBEDDING", "CRIME_HEAD", "LEGAL"]
                    }
                ],
                "performance": {
                    "embedding_ms": 0.49,
                    "retrieval_ms": 0.74,
                    "ranking_ms": 90.01,
                    "total_ms": 91.56
                }
            }
        }


class MetricsResponse(BaseModel):
    """Response payload returned by GET /metrics."""

    average_latency_ms: float = Field(..., description="Mean total analysis duration in milliseconds.")
    total_analyses: int = Field(..., description="Cumulative number of analyses executed.")
    cache_hit_rate: float = Field(..., description="Embedding cache hit ratio [0.0 - 1.0].")
    index_size: int = Field(..., description="Total count of vectors stored in the index.")
    model_version: str = Field(..., description="Active ML embedding model identifier.")
    pipeline_version: str = Field(..., description="Active framework execution pipeline identifier.")

    class Config:
        json_schema_extra = {
            "example": {
                "average_latency_ms": 76.5,
                "total_analyses": 142,
                "cache_hit_rate": 0.35,
                "index_size": 25,
                "model_version": "all-MiniLM-L6-v2",
                "pipeline_version": "1.0.0"
            }
        }
