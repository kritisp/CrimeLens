"""
CrimeLens AI — Confidence Models

Defines Pydantic schemas for confidence factors and results payload.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ConfidenceFactors(BaseModel):
    """
    Evidence factor values mapped to each compared crime trait.
    Represent the presence and quality of match features.
    """

    embedding: float = Field(..., description="Embedding similarity factor.")
    crime_head: float = Field(..., description="Crime head match factor (1.0 or 0.0).")
    crime_sub_head: float = Field(..., description="Crime subhead match factor (1.0 or 0.0).")
    legal: float = Field(..., description="Statutory charges match factor.")
    temporal: float = Field(..., description="Temporal proximity match factor.")
    spatial: float = Field(..., description="Spatial prefix match factor.")
    behavior: float = Field(..., description="Behavioral MO tags match factor.")

    class Config:
        frozen = True


class ConfidenceResult(BaseModel):
    """
    Unified outcome wrapper carrying aggregate confidence score and
    individual evidence factors.
    """

    score: float = Field(..., description="Calculated confidence score between 0.0 and 1.0.")
    factors: ConfidenceFactors = Field(..., description="Breakdown of individual evidence factors.")

    class Config:
        frozen = True
