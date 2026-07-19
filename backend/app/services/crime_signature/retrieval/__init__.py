"""
CrimeLens AI — Retrieval Subsystem Exports

Provides centralized imports for the machine learning vector retrieval framework.
"""

from __future__ import annotations

from app.services.crime_signature.retrieval.builder import IndexBuilder
from app.services.crime_signature.retrieval.exceptions import (
    IndexBuildError,
    IndexLoadError,
    RetrievalError,
)
from app.services.crime_signature.retrieval.faiss_index import FAISSIndex
from app.services.crime_signature.retrieval.interfaces import VectorIndex
from app.services.crime_signature.retrieval.manager import IndexManager
from app.services.crime_signature.retrieval.models import (
    CrimeMetadata,
    SearchResponse,
    SearchResult,
)
from app.services.crime_signature.retrieval.persistence import IndexPersistence
from app.services.crime_signature.retrieval.search_engine import SearchEngine
