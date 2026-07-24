"""
CrimeLens AI — Vector Index Interface

Defines the abstract interface for all search index strategies (Strategy Pattern).
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Tuple

from app.services.crime_signature.retrieval.models import CrimeMetadata, SearchResult


class VectorIndex(ABC):
    """
    Base interface mapping core index storage operations.
    Supports future swap-ins of ChromaDB, pgvector, or Milvus providers.
    """

    @abstractmethod
    def build(self, dimension: int, metric: str, index_type: str = "flat") -> None:
        """
        Initializes structural dimensions and distance metrics parameters.

        Args:
            dimension: Dimensionality of inputs.
            metric: Distance metric lookup code (cosine, l2, ip).
            index_type: Index structure format (flat, ivf, hnsw).
        """
        pass

    @abstractmethod
    def add(self, vectors: List[List[float]], metadata_list: List[CrimeMetadata]) -> None:
        """
        Adds coordinate vectors alongside their metadata maps.

        Args:
            vectors: List of coordinate lists.
            metadata_list: List of metadata models.
        """
        pass

    @abstractmethod
    def search_top_k(self, query: List[float], k: int) -> List[SearchResult]:
        """
        Runs nearest neighbor queries.

        Args:
            query: Input float coordinates.
            k: Number of matches to return.
        """
        pass

    @abstractmethod
    def search_radius(self, query: List[float], radius: float) -> List[SearchResult]:
        """
        Runs radius searches returning elements within range.

        Args:
            query: Input float coordinates.
            radius: Radius limit threshold.
        """
        pass

    @abstractmethod
    def search_batch(self, queries: List[List[float]], k: int) -> List[List[SearchResult]]:
        """
        Runs batch queries.

        Args:
            queries: List of float lists.
            k: Nearest neighbors matching count.
        """
        pass

    @abstractmethod
    def size(self) -> int:
        """Returns the total number of records indexed."""
        pass

    @abstractmethod
    def serialize(self) -> Tuple[bytes, Dict[int, Any]]:
        """
        Serializes binary vector parameters and metadata index dictionaries.

        Returns:
            A tuple of (binary bytes array, metadata map dict).
        """
        pass

    @abstractmethod
    def deserialize(self, index_data: bytes, metadata_map: Dict[int, Any]) -> None:
        """
        Loads index states from serialized payloads.

        Args:
            index_data: Binary array.
            metadata_map: Metadata map index dictionary.
        """
        pass
