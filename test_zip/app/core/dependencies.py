"""
CrimeLens AI — Dependency Injection Providers

This module defines all FastAPI Depends() providers used across the API layer.
It is the single place where application-wide dependencies are declared and
wired together.

Clean Architecture rule enforced here:
  - Route handlers declare what they need via type annotations.
  - This module provides the concrete implementations.
  - Swapping an implementation (e.g. real DB → mock) requires changing
    this file only — zero changes to routes or services.

Dependency Injection hierarchy:
  get_settings()         → Pure function, @lru_cache singleton
  get_case_repository()  → Depends(get_settings) [Phase 2: + Depends(get_db)]
  get_case_service()     → Depends(get_case_repository)
  get_current_user()     → Depends(oauth2_scheme) + JWT decode

Usage in a route:
    from app.core.dependencies import SettingsDep

    @router.get("/health")
    async def health(settings: SettingsDep) -> ...:
        return {"version": settings.app_version}
"""

from __future__ import annotations

from typing import Annotated, Any, Dict, Optional

from fastapi import Depends

from app.core.config import Settings, get_settings

# ── Annotated Type Aliases ────────────────────────────────────────────────────
# These aliases combine the Python type with the FastAPI Depends() declaration.
# Routes use these as type annotations, keeping signatures clean.
#
# Pattern:  XxxDep = Annotated[XxxType, Depends(get_xxx)]
#
# FastAPI reads the Annotated metadata at startup, builds a dependency graph,
# and injects resolved values into route handler arguments at request time.

SettingsDep = Annotated[Settings, Depends(get_settings)]
"""
Injects the application Settings singleton into a route.
"""

import threading
from datetime import datetime, timezone
from app.domain.models.signature import CrimeSignature
from app.services.crime_signature.core import create_default_pipeline
from app.services.crime_signature.embedding.orchestrator import EmbeddingOrchestrator
from app.services.crime_signature.retrieval import IndexManager, CrimeMetadata
from app.services.crime_signature.retrieval.search_engine import SearchEngine
from app.services.crime_signature.similarity.engine import SimilarityEngine
from app.services.crime_signature.pipeline.executor import PipelineExecutor
from app.core.synthetic import generate_synthetic_dataset

# Singleton DB cache mapping Case IDs to Signatures
SIGNATURES_DB: Dict[int, CrimeSignature] = {}
_db_lock = threading.Lock()


def populate_signatures_db() -> None:
    """Fills the mock signature database cache from raw templates."""
    with _db_lock:
        if SIGNATURES_DB:
            return
        cases = generate_synthetic_dataset()
        pipeline = create_default_pipeline()
        for case in cases:
            sig, _ = pipeline.execute(case)
            SIGNATURES_DB[case.case_master_id] = sig


async def init_db() -> None:
    """Creates SQLite tables and seeds them with synthetic FIRs if empty."""
    from app.infrastructure.database.setup import engine, Base, async_session
    from app.infrastructure.database.repositories.sqlite_repository import SQLiteFIRRepository
    from app.db.base import Base as NormalizedBase
    from app.db.session import SessionLocal
    from app.db.seed import seed_database
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(NormalizedBase.metadata.create_all)
        
    async with async_session() as session:
        repo = SQLiteFIRRepository(session)
        existing = await repo.list_raw_firs()
        if not existing:
            cases = generate_synthetic_dataset()
            for case in cases:
                await repo.store_raw_fir(case.model_dump())
            await session.commit()

    # Seed relational normalized tables
    try:
        sync_db = SessionLocal()
        seed_database(sync_db)
        sync_db.close()
    except Exception as exc:
        print(f"Relational seed note: {exc}")


async def load_signatures_from_db() -> None:
    """Populates SIGNATURES_DB from raw database records."""
    from app.infrastructure.database.setup import async_session
    from app.infrastructure.database.repositories.sqlite_repository import SQLiteFIRRepository
    from app.domain.models.ingested_case import IngestedCase
    
    async with async_session() as session:
        repo = SQLiteFIRRepository(session)
        raw_cases = await repo.list_raw_firs()
        pipeline = create_default_pipeline()
        for raw in raw_cases:
            case = IngestedCase.model_validate(raw)
            sig, _ = pipeline.execute(case)
            SIGNATURES_DB[case.case_master_id] = sig


class PipelineMetricsTracker:
    """Thread-safe statistics logger tracking pipeline analysis runs."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.total_analyses = 0
        self.total_latency_ms = 0.0

    def record_analysis(self, total_ms: float) -> None:
        with self._lock:
            self.total_analyses += 1
            self.total_latency_ms += total_ms

    @property
    def average_latency_ms(self) -> float:
        with self._lock:
            if self.total_analyses == 0:
                return 0.0
            return round(self.total_latency_ms / self.total_analyses, 2)


# Singletons
_metrics_tracker = PipelineMetricsTracker()
_pipeline_executor: Optional[PipelineExecutor] = None
_executor_lock = threading.Lock()


def get_metrics_tracker() -> PipelineMetricsTracker:
    """Returns the global performance metrics logger."""
    return _metrics_tracker


def get_pipeline_executor() -> PipelineExecutor:
    """
    Initializes and returns the singleton PipelineExecutor,
    building and seeding the FAISS index with synthetic records at startup.
    """
    global _pipeline_executor
    with _executor_lock:
        if _pipeline_executor is not None:
            return _pipeline_executor

        # Populate database mapping Case IDs to Signatures
        populate_signatures_db()

        emb_orchestrator = EmbeddingOrchestrator()
        idx_manager = IndexManager()
        idx_manager.rebuild_index(dimension=384)

        vectors = []
        metadata_list = []

        for sig in SIGNATURES_DB.values():
            emb_res = emb_orchestrator.get_embedding(sig, model_name="minilm")
            vectors.append(emb_res.embedding_vector)
            metadata_list.append(
                CrimeMetadata(
                    case_id=sig.case_master_id,
                    crime_signature_hash=emb_res.crime_signature_hash,
                    embedding_version=emb_res.embedding_version.model_version,
                    pipeline_version=emb_res.embedding_version.pipeline_version,
                    feature_version=emb_res.embedding_version.feature_version,
                    creation_timestamp=datetime.now(timezone.utc),
                )
            )

        idx_manager.add_documents(vectors, metadata_list)
        search_eng = SearchEngine(manager=idx_manager)
        similarity_eng = SimilarityEngine()

        executor = PipelineExecutor()
        executor.pipeline.embedding_orchestrator = emb_orchestrator
        executor.pipeline.search_engine = search_eng
        executor.pipeline.similarity_engine = similarity_eng

        _pipeline_executor = executor
        return _pipeline_executor


# Dependency injections annotations
PipelineExecutorDep = Annotated[PipelineExecutor, Depends(get_pipeline_executor)]
MetricsTrackerDep = Annotated[PipelineMetricsTracker, Depends(get_metrics_tracker)]


from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.exceptions import UnauthorizedError

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    settings: Settings = Depends(get_settings),
) -> Dict[str, Any]:
    """Decodes JWT tokens and resolves user profile credentials."""
    if not credentials:
        # Fallback for demo safety: return default admin context if token is missing
        return {"username": "admin", "role": "Investigator", "badge_id": "KSP-2026-9041"}
        
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return {
            "username": payload.get("sub"),
            "role": payload.get("role"),
            "badge_id": payload.get("badge_id"),
        }
    except JWTError as exc:
        raise UnauthorizedError(f"Invalid or expired credentials token: {str(exc)}")


CurrentUserDep = Annotated[Dict[str, Any], Depends(get_current_user)]
