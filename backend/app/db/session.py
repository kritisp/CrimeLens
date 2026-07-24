"""
CrimeLens AI — Synchronous Database Session Setup

Initializes SQLAlchemy sync engine and session factory lazily on demand.
"""

from __future__ import annotations

import logging
from collections.abc import Generator
from typing import Optional
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_sync_engine: Optional[Engine] = None
_sync_session_factory: Optional[sessionmaker] = None


def get_sync_engine() -> Engine:
    """Returns or lazily instantiates the global sync Engine singleton."""
    global _sync_engine
    if _sync_engine is None:
        settings = get_settings()
        db_url = settings.sync_database_url

        engine_args = {}
        if db_url.startswith("sqlite://"):
            engine_args = {"connect_args": {"check_same_thread": False}}

        _sync_engine = create_engine(db_url, pool_pre_ping=True, **engine_args)
    return _sync_engine


def get_sync_session_factory() -> sessionmaker:
    """Returns or lazily instantiates the global SessionLocal sessionmaker singleton."""
    global _sync_session_factory
    if _sync_session_factory is None:
        engine = get_sync_engine()
        _sync_session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return _sync_session_factory


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a synchronous database session."""
    factory = get_sync_session_factory()
    db = factory()
    try:
        yield db
    finally:
        db.close()


def __getattr__(name: str):
    """
    Module attribute accessor for backward compatibility with top-level imports
    (e.g., `from app.db.session import engine, SessionLocal`).
    """
    if name == "engine":
        return get_sync_engine()
    if name == "SessionLocal":
        return get_sync_session_factory()
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")
