"""
CrimeLens AI — Vector Index Builder

Responsible for initializing, structuring, and bulk adding vectors to a VectorIndex.
"""

from __future__ import annotations

from typing import List, Optional

from app.services.crime_signature.retrieval.faiss_index import FAISSIndex
from app.services.crime_signature.retrieval.interfaces import VectorIndex
from app.services.crime_signature.retrieval.models import CrimeMetadata


class IndexBuilder:
    """
    Coordinates indexing structure configurations and handles bulk ingestion loops.
    """

    @staticmethod
    def build_index(
        dimension: int,
        metric: str,
        index_type: str = "flat",
        vectors: Optional[List[List[float]]] = None,
        metadata_list: Optional[List[CrimeMetadata]] = None,
    ) -> VectorIndex:
        """
        Creates and populates a new VectorIndex instance.

        Args:
            dimension: Float coordinate dimensions size.
            metric: Math calculation logic (cosine, l2, ip).
            index_type: Structural format (flat, ivf, hnsw).
            vectors: Optional initial coordinate vectors.
            metadata_list: Optional initial metadata block records list.

        Returns:
            The finalized, populated VectorIndex.
        """
        index = FAISSIndex()
        index.build(dimension=dimension, metric=metric, index_type=index_type)

        if vectors and metadata_list:
            index.add(vectors, metadata_list)

        return index
