"""
CrimeLens AI — Embedding Pipeline Processors

Defines Preprocessing, Postprocessing, and Validation stages of the
embedding pipeline.
"""

from __future__ import annotations

import math
from typing import List

from app.services.crime_signature.embedding.exceptions import EmbeddingError


class EmbeddingPreprocessor:
    """Handles textual modifications (e.g., prefix prepending for E5/BGE)."""

    def __init__(self, prefix: str = "") -> None:
        self.prefix = prefix or ""

    def preprocess(self, text: str) -> str:
        """Prepends configured prefix to raw text facts."""
        cleaned = text.strip()
        if self.prefix:
            return f"{self.prefix.strip()} {cleaned}".strip()
        return cleaned


class EmbeddingPostProcessor:
    """Executes vector transformations (e.g., L2-normalization)."""

    def __init__(self, normalize: bool = True) -> None:
        self.normalize = normalize

    def postprocess(self, vector: List[float]) -> List[float]:
        """Optionally applies L2 normalization to convert vector to unit length."""
        if not self.normalize or not vector:
            return vector

        l2_sum = sum(x * x for x in vector)
        l2_norm = math.sqrt(l2_sum)

        if l2_norm > 0.0:
            return [x / l2_norm for x in vector]
        return vector


class EmbeddingValidator:
    """Validates vector structural constraints (dimension lengths, NAN/INF checks)."""

    def __init__(self, expected_dimension: int) -> None:
        self.expected_dimension = expected_dimension

    def validate(self, vector: List[float]) -> None:
        """
        Validates the output vector.
        
        Raises:
            EmbeddingError: If validation checks fail.
        """
        # 1. Assert dimensional shape matching
        actual_len = len(vector)
        if actual_len != self.expected_dimension:
            raise EmbeddingError(
                f"Dimensionality mismatch. Expected model dimension: {self.expected_dimension}, "
                f"but received generated vector dimension: {actual_len}."
            )

        # 2. Check for NaN or Inf occurrences
        for idx, val in enumerate(vector):
            if math.isnan(val) or math.isinf(val):
                raise EmbeddingError(
                    f"Generated coordinate value at index {idx} contains "
                    f"an invalid float pattern (NaN or Infinity)."
                )
