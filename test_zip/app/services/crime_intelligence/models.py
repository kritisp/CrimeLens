"""
CrimeLens AI — Crime Intelligence Models

Defines the structured output models for actionable insights and recommendations.
"""

from enum import Enum
from typing import List

from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Insight(BaseModel):
    """
    A specific investigative insight extracted from similarity patterns.
    """
    category: str = Field(..., description="Category of the insight (e.g., 'Temporal Pattern')")
    description: str = Field(..., description="Human-readable description of the finding.")
    supporting_evidence: List[str] = Field(
        default_factory=list, description="Case IDs or feature names supporting this insight."
    )

    class Config:
        frozen = True


class Recommendation(BaseModel):
    """
    Actionable next step for an investigator.
    """
    action: str = Field(..., description="The recommended action.")
    rationale: str = Field(..., description="Why this action is recommended.")
    priority: str = Field(..., description="Priority level: HIGH, MEDIUM, LOW")

    class Config:
        frozen = True


class IntelligenceResult(BaseModel):
    """
    Final JSON output payload holding insights, recommendations, and risk levels.
    """
    risk_level: RiskLevel = Field(..., description="Computed risk severity.")
    insights: List[Insight] = Field(default_factory=list, description="Extracted actionable insights.")
    recommendations: List[Recommendation] = Field(
        default_factory=list, description="Investigative next steps."
    )
    patterns: List[str] = Field(default_factory=list, description="List of raw pattern names.")
    confidence: float = Field(..., description="Overall confidence of the intelligence generation.")

    class Config:
        frozen = True
