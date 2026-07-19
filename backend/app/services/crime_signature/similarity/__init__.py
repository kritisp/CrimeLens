"""
CrimeLens AI — Similarity Subsystem Exports

Provides centralized imports for the machine learning similarity re-ranking engine.
"""

from __future__ import annotations

from app.services.crime_signature.similarity.comparators import (
    BehaviorComparator,
    CrimeHeadComparator,
    CrimeSubHeadComparator,
    EmbeddingComparator,
    LegalComparator,
    SpatialComparator,
    TemporalComparator,
)
from app.services.crime_signature.similarity.engine import SimilarityEngine
from app.services.crime_signature.similarity.exceptions import (
    ConfigurationError,
    SimilarityError,
)
from app.services.crime_signature.similarity.interfaces import SimilarityComparator
from app.services.crime_signature.similarity.models import (
    SimilarityExplanation,
    SimilarityResult,
)
from app.services.crime_signature.similarity.scorer import CompositeSimilarityScorer
