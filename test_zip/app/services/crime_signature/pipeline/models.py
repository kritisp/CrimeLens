"""
CrimeLens AI — Pipeline Models

Defines the output payload for the integrated Crime Analysis Pipeline.
"""

from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel, Field

from app.domain.models.signature import CrimeSignature
from app.services.crime_signature.embedding.models import EmbeddingMetadata
from app.services.crime_signature.similarity.models import SimilarityResult


class PipelineResult(BaseModel):
    """
    Unified result holding query signature, re-ranked candidate list,
    execution latency indicators, and configurations metadata.
    """

    query_crime: CrimeSignature = Field(..., description="The query CrimeSignature object.")
    top_similar_crimes: List[SimilarityResult] = Field(
        default_factory=list,
        description="Re-ranked matching similar candidates sorted by score.",
    )
    processing_times_ms: Dict[str, float] = Field(
        default_factory=dict,
        description="Execution latencies measured in milliseconds for each pipeline stage.",
    )
    embedding_metadata: EmbeddingMetadata = Field(
        ...,
        description="Query embedding model parameters and specifications details.",
    )
    search_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Vector Index details (Metric, Type, Size).",
    )

    class Config:
        frozen = True
