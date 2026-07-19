"""
CrimeLens AI — Embedding Cache

Implements a thread-safe, size-limited in-memory cache storing calculated
EmbeddingResults linked to CrimeSignature cryptographic digests.
"""

from __future__ import annotations

import threading
from typing import Dict, Optional

from app.services.crime_signature.embedding.models import EmbeddingResult


class EmbeddingCache:
    """
    Thread-safe Cache for tracking pre-calculated vector outputs.
    Automatically manages evictions under configurable size thresholds.
    """

    def __init__(self, max_size: int = 1000) -> None:
        self.max_size = max_size
        self._cache: Dict[str, EmbeddingResult] = {}
        self._lock = threading.Lock()
        self.hits = 0
        self.misses = 0

    def get(self, key: str) -> Optional[EmbeddingResult]:
        """
        Looks up cached entries matching the hash key.
        Increments hit/miss counts.
        """
        with self._lock:
            if key in self._cache:
                self.hits += 1
                return self._cache[key]
            self.misses += 1
            return None

    def set(self, key: str, result: EmbeddingResult) -> None:
        """
        Registers a new embedding result in cache.
        Evicts the oldest entry if size constraints are violated (FIFO policy).
        """
        with self._lock:
            if key in self._cache:
                self._cache[key] = result
                return

            if len(self._cache) >= self.max_size:
                # Evict the oldest key in dict sequence
                oldest_key = next(iter(self._cache))
                del self._cache[oldest_key]

            self._cache[key] = result

    def clear(self) -> None:
        """Flushes the cache map and resets hits/misses indices."""
        with self._lock:
            self._cache.clear()
            self.hits = 0
            self.misses = 0

    @property
    def size(self) -> int:
        """Returns the current number of items cached."""
        with self._lock:
            return len(self._cache)

    def get_memory_estimate_kb(self) -> float:
        """
        Calculates a memory utilization footprint estimate in Kilobytes.
        Calculated recursively for key structures and float coordinate arrays.
        """
        with self._lock:
            if not self._cache:
                return 0.0

            total_bytes = 0
            for key, val in self._cache.items():
                # Hash Key string size + standard dictionary node overheads
                total_bytes += len(key) + 64
                # Vector arrays (usually float64 coordinates)
                total_bytes += len(val.embedding_vector) * 8
                # Serialized namespaces and timestamp tags
                total_bytes += len(val.model_name) + 200

            return round(total_bytes / 1024.0, 3)
