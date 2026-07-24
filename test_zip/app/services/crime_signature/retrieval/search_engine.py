"""
CrimeLens AI — Retrieval Search Engine

Coordinates nearest neighbor queries (Top-K, Radius, and Batch search) on active
indexes, measures performance latency, and registers structured query execution logs.
"""

from __future__ import annotations

import time
from typing import List, Optional

import structlog

from app.services.crime_signature.retrieval.manager import IndexManager
from app.services.crime_signature.retrieval.models import SearchResponse

logger = structlog.get_logger("retrieval_search_engine")


class SearchEngine:
    """
    Coordinates searches, measures latency, and registers structured query logs.
    """

    def __init__(self, manager: Optional[IndexManager] = None) -> None:
        self.manager = manager or IndexManager()
        
        # Load search parameter settings
        self.default_top_k: int = self.manager.config.get("retrieval", {}).get("top_k", 10)
        self.default_radius: float = self.manager.config.get("retrieval", {}).get("radius", 0.8)

    def search(self, query_vector: List[float], k: Optional[int] = None) -> SearchResponse:
        """
        Runs Top-K nearest neighbor search on the active index.

        Args:
            query_vector: Coordinates list to query.
            k: Optional K override, defaults to configs.

        Returns:
            The consolidated SearchResponse envelope.
        """
        start = time.perf_counter()
        target_k = k if k is not None else self.default_top_k
        index = self.manager.get_index()

        results = index.search_top_k(query_vector, target_k)
        latency_ms = (time.perf_counter() - start) * 1000.0

        response = SearchResponse(
            query_latency_ms=round(latency_ms, 3),
            index_size=index.size(),
            results=results,
        )

        # Emit Structured Query Log
        logger.info(
            "Vector retrieval execution complete.",
            search_latency=response.query_latency_ms,
            top_k=target_k,
            metric=self.manager.metric,
            index_size=response.index_size,
            search_time=round(latency_ms, 3),
        )

        return response

    def search_by_radius(self, query_vector: List[float], radius: Optional[float] = None) -> SearchResponse:
        """
        Runs range/radius search returning matches within range.

        Args:
            query_vector: Coordinates list to query.
            radius: Optional search range override, defaults to configs.

        Returns:
            The consolidated SearchResponse envelope.
        """
        start = time.perf_counter()
        target_radius = radius if radius is not None else self.default_radius
        index = self.manager.get_index()

        results = index.search_radius(query_vector, target_radius)
        latency_ms = (time.perf_counter() - start) * 1000.0

        response = SearchResponse(
            query_latency_ms=round(latency_ms, 3),
            index_size=index.size(),
            results=results,
        )

        # Emit Structured Query Log
        logger.info(
            "Vector radius retrieval execution complete.",
            search_latency=response.query_latency_ms,
            radius=target_radius,
            metric=self.manager.metric,
            index_size=response.index_size,
            search_time=round(latency_ms, 3),
        )

        return response

    def search_batch(self, query_vectors: List[List[float]], k: Optional[int] = None) -> List[SearchResponse]:
        """
        Runs batch searches across multiple vectors concurrently.

        Args:
            query_vectors: Matrix listing query coordinate lists.
            k: Nearest neighbors matching count.

        Returns:
            List of SearchResponse wrappers.
        """
        start = time.perf_counter()
        target_k = k if k is not None else self.default_top_k
        index = self.manager.get_index()

        batch_results = index.search_batch(query_vectors, target_k)
        total_latency_ms = (time.perf_counter() - start) * 1000.0

        responses = []
        for results in batch_results:
            responses.append(
                SearchResponse(
                    # Apportion total batch latency evenly to results for reporting
                    query_latency_ms=round(total_latency_ms / len(query_vectors), 3),
                    index_size=index.size(),
                    results=results,
                )
            )

        logger.info(
            "Vector batch retrieval execution complete.",
            batch_size=len(query_vectors),
            total_latency_ms=round(total_latency_ms, 3),
            top_k=target_k,
            metric=self.manager.metric,
            index_size=index.size(),
        )

        return responses
