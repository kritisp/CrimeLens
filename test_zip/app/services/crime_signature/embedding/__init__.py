"""
CrimeLens AI — Embedding Subsystem Exports

Provides centralized imports for the machine learning embedding framework.
"""

from __future__ import annotations

from app.services.crime_signature.embedding.cache import EmbeddingCache
from app.services.crime_signature.embedding.exceptions import (
    EmbeddingError,
    ModelLoadError,
    ModelNotFoundError,
)
from app.services.crime_signature.embedding.interfaces import EmbeddingProvider
from app.services.crime_signature.embedding.manager import EmbeddingManager
from app.services.crime_signature.embedding.models import (
    EmbeddingMetadata,
    EmbeddingResult,
    EmbeddingVersion,
)
from app.services.crime_signature.embedding.orchestrator import EmbeddingOrchestrator
from app.services.crime_signature.embedding.processors import (
    EmbeddingPostProcessor,
    EmbeddingPreprocessor,
    EmbeddingValidator,
)
from app.services.crime_signature.embedding.providers import (
    SentenceTransformerProvider,
)
from app.services.crime_signature.embedding.registry import ModelRegistry
