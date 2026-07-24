"""
CrimeLens AI — Similarity Engine Models

Defines Pydantic schemas for similarity results and explanations.
"""

from __future__ import annotations

from typing import Dict, List

from pydantic import BaseModel, Field


class SimilarityExplanation(BaseModel):
    """
    Detailed match analytics explaining why comparator scores were calculated.
    """

    rationale: str = Field(..., description="High-level description of matched traits.")
    comparator_explanations: Dict[str, str] = Field(
        default_factory=dict,
        description="Individual comparator score explanations.",
    )

    class Config:
        frozen = True


class SimilarityResult(BaseModel):
    """
    Envelope holding similarity scores, matched features, confidence indices,
    and structured explanation rationale.
    """

    case_id: int = Field(..., description="Reference candidate case ID.")
    overall_similarity: float = Field(..., description="Aggregated similarity score [0.0 - 1.0].")
    comparator_scores: Dict[str, float] = Field(
        default_factory=dict,
        description="Individual raw comparator scores.",
    )
    matched_features: List[str] = Field(
        default_factory=list,
        description="List of key matched fields/descriptors.",
    )
    confidence: float = Field(
        ...,
        description="Confidence index representing overall data overlap completeness.",
    )
    explanation: SimilarityExplanation = Field(..., description="Structured rationale explanation.")

    class Config:
        frozen = True
