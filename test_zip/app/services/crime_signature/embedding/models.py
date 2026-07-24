"""
CrimeLens AI — Embedding Framework Models

Declares the data structures for managing version states, execution metadata,
and semantic vector output wrappers.
"""

from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class EmbeddingVersion(BaseModel):
    """
    Tracks coordinate dependencies including model weights tag, feature
    engineering logic tag, and preprocessing pipeline sequence tag.
    """

    model_version: str = Field(..., description="Release version of model weights.")
    feature_version: str = Field(..., description="Logical version of features configuration.")
    pipeline_version: str = Field(..., description="Execution version of pipeline framework.")

    class Config:
        frozen = True


class EmbeddingMetadata(BaseModel):
    """Execution profile describing model specifications and configurations."""

    model_name: str = Field(..., description="Target model lookup code.")
    dimension: int = Field(..., description="Dimensionality index of the output space.")
    version: EmbeddingVersion = Field(..., description="Immutable version tags block.")

    class Config:
        frozen = True


class EmbeddingResult(BaseModel):
    """
    Consolidated execution envelope containing generated coordinates alongside
    profiling metrics and cryptographic source hashes.
    """

    embedding_vector: List[float] = Field(
        ...,
        description="High-dimensional floating point coordinate values.",
    )
    model_name: str = Field(..., description="Model lookup identifier code.")
    embedding_dimension: int = Field(..., description="Length of the coordinates vector.")
    embedding_version: EmbeddingVersion = Field(
        ...,
        description="Logical versions mapping block.",
    )
    inference_latency_ms: float = Field(
        ...,
        description="Calculation latency in milliseconds.",
    )
    generation_timestamp: datetime = Field(
        ...,
        description="Timestamp indicating generation time.",
    )
    crime_signature_hash: str = Field(
        ...,
        description="Deterministic SHA-256 digest of the source CrimeSignature.",
    )

    class Config:
        frozen = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

