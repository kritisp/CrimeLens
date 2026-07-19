"""
CrimeLens AI — Retrieval Models

Defines the metadata mapping structure and search results envelopes.
"""

from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class CrimeMetadata(BaseModel):
    """
    Metadata mapped to each vector inside the search index.
    Guarantees structural lookup validation.
    """

    case_id: int = Field(..., description="Relational database primary key reference.")
    crime_signature_hash: str = Field(..., description="SHA-256 hash of the CrimeSignature.")
    embedding_version: str = Field(..., description="Version of the model that generated coordinates.")
    pipeline_version: str = Field(..., description="Version of the feature pipeline.")
    feature_version: str = Field(..., description="Version of the feature definitions.")
    creation_timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="UTC Timestamp of index mapping creation.",
    )

    class Config:
        frozen = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }


class SearchResult(BaseModel):
    """A single matched crime result."""

    case_id: int = Field(..., description="Reference case ID.")
    score: float = Field(..., description="Distance or similarity score.")
    metadata: CrimeMetadata = Field(..., description="Metadata block details.")

    class Config:
        frozen = True


class SearchResponse(BaseModel):
    """Consolidated search metrics and results listing envelope."""

    query_latency_ms: float = Field(..., description="Search time duration in milliseconds.")
    index_size: int = Field(..., description="Total size of vector registry.")
    results: List[SearchResult] = Field(default_factory=list, description="Matched results sorted by relevance.")

    class Config:
        frozen = True
