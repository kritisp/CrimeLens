"""
CrimeLens AI — Similarity Comparator Interface

Defines the abstract Strategy Pattern interface for individual feature comparators.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Tuple

from app.domain.models.signature import CrimeSignature


class SimilarityComparator(ABC):
    """
    Interface defining comparison logic for individual crime feature dimensions.
    Returns normalized scores and text explanations.
    """

    @abstractmethod
    def compare(self, query: CrimeSignature, candidate: CrimeSignature) -> Tuple[float, str]:
        """
        Evaluates similarity between query and candidate signature profiles.

        Args:
            query: The query CrimeSignature.
            candidate: The candidate CrimeSignature to evaluate.

        Returns:
            A tuple of:
                - float: Normalized score between 0.0 (disparate) and 1.0 (identical).
                - str: Rationale explaining why the score was assigned.
        """
        pass
