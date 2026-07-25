"""
CrimeLens AI — Database Engine Setup

Initializes SQLAlchemy async engine and session factory lazily on demand,
configured for Supabase PostgreSQL connection pooling and resilience.
"""

from __future__ import annotations

from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import get_settings

Base = declarative_base()

_async_engine: Optional[AsyncEngine] = None
_async_session_factory: Optional[sessionmaker] = None


def get_async_engine() -> AsyncEngine:
    """Returns or lazily instantiates the global AsyncEngine singleton."""
    global _async_engine
    if _async_engine is None:
        settings = get_settings()
        url = settings.async_database_url
        
        engine_kwargs = {
            "echo": settings.debug,
            "future": True,
        }

        # PostgreSQL / Supabase PgBouncer pooler optimization
        if "postgresql" in url or "postgres" in url:
            engine_kwargs.update({
                "pool_pre_ping": True,
                "pool_recycle": 300,
                "pool_size": 10,
                "max_overflow": 20,
                "connect_args": {
                    "statement_cache_size": 0,
                    "prepared_statement_cache_size": 0
                },
            })
        elif "sqlite" in url:
            engine_kwargs["connect_args"] = {"check_same_thread": False}

        _async_engine = create_async_engine(url, **engine_kwargs)
    return _async_engine


def get_async_session_factory() -> sessionmaker:
    """Returns or lazily instantiates the global AsyncSession sessionmaker singleton."""
    global _async_session_factory
    if _async_session_factory is None:
        engine = get_async_engine()
        _async_session_factory = sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
    return _async_session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding a database session."""
    factory = get_async_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def __getattr__(name: str):
    """
    Module attribute accessor for backward compatibility with top-level imports
    (e.g., `from app.infrastructure.database.setup import engine, async_session`).
    """
    if name == "engine":
        return get_async_engine()
    if name == "async_session":
        return get_async_session_factory()
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")
