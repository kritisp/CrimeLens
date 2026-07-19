"""
CrimeLens AI — Embedding Provider Interface

Defines the abstract base contract (Strategy Pattern) that all machine learning
vector projection providers must implement.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List

from app.services.crime_signature.embedding.models import EmbeddingMetadata


class EmbeddingProvider(ABC):
    """
    Abstract base interface establishing the strategy pattern contracts
    for vector projection models. Exposes pure ML methods.
    """

    @abstractmethod
    def initialize(self, config: Dict[str, Any]) -> None:
        """
        Loads weights, validates dimensions, and verifies model health parameters.
        
        Args:
            config: A dictionary mapping key model properties.
        """
        pass

    @abstractmethod
    def embed_raw(self, text: str) -> List[float]:
        """
        Translates raw input text into high-dimensional float coordinates.

        Args:
            text: Normalized query or passage text facts.

        Returns:
            The raw float list vector coordinate coordinates.
        """
        pass

    @abstractmethod
    def get_metadata(self) -> EmbeddingMetadata:
        """
        Gets details describing dimensions, versioning tags, and naming.

        Returns:
            The metadata configuration block.
        """
        pass

