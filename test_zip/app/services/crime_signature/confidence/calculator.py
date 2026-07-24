"""
CrimeLens AI — Confidence Calculator

Calculates aggregated confidence scores based on evidence factors and configured weights.
"""

from __future__ import annotations

from typing import Dict

from app.services.crime_signature.confidence.models import ConfidenceFactors, ConfidenceResult


class ConfidenceCalculator:
    """
    Computes the weighted sum of match quality factors.
    """

    def __init__(self, weights: Dict[str, float]) -> None:
        self.weights = weights

    def calculate(self, factors: ConfidenceFactors) -> ConfidenceResult:
        """
        Calculates the overall confidence score based on the given factors.

        Args:
            factors: Individual populated match factor scores.

        Returns:
            The compiled ConfidenceResult containing the overall score.
        """
        score = 0.0
        score += factors.embedding * self.weights.get("embedding", 0.45)
        score += factors.crime_head * self.weights.get("crime_head", 0.10)
        score += factors.crime_sub_head * self.weights.get("crime_sub_head", 0.05)
        score += factors.legal * self.weights.get("legal", 0.10)
        score += factors.temporal * self.weights.get("temporal", 0.10)
        score += factors.spatial * self.weights.get("spatial", 0.10)
        score += factors.behavior * self.weights.get("behavior", 0.10)

        # Enforce boundary guarantees in case of floating precision fluctuations
        score = max(0.0, min(1.0, score))

        return ConfidenceResult(
            score=round(score, 3),
            factors=factors,
        )
class Config:
    frozen = True
