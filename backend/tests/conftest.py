"""
CrimeLens AI — Pytest Configuration & Shared Fixtures

Contains pytest hooks and global fixtures.
Sets up:
  - Event loop overrides for async tests
  - Decoupled configuration overrides for the settings singleton
  - Test client using HTTPX for router/health integration tests
"""

from __future__ import annotations

import asyncio
from typing import AsyncIterator, Generator

import pytest
from httpx import AsyncClient, ASGITransport

from app.core.config import Settings, get_settings
from app.main import create_app


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """
    Override the default function-scoped event loop to session scope.
    Required for sharing async resources (like in-memory caches or model instances)
    across tests.
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_settings() -> Settings:
    """
    Returns settings modified specifically for test runs.
    Ensures tests don't run in production configurations or write to real DB files.
    """
    return Settings(
        environment="development",
        app_name="CrimeLens AI (Test Suite)",
        debug=True,
        log_level="WARNING",  # Reduce clutter in test output
        database_url="sqlite+aiosqlite:///:memory:",  # Use in-memory SQLite for testing
        jwt_secret_key="TEST-SECRET-FOR-HMAC-SIGNING-ONLY-UNSAFE-FOR-PROD",
    )


from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.infrastructure.database.setup import get_db, Base
from app.core.synthetic import generate_synthetic_dataset
from app.infrastructure.database.repositories.sqlite_repository import SQLiteFIRRepository
from typing import AsyncIterator

# Create test engine and sessionmaker for isolated memory testing
test_engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    echo=False,
    future=True,
)

TestSessionLocal = sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def override_get_db() -> AsyncIterator[AsyncSession]:
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@pytest.fixture(scope="session")
async def client(test_settings: Settings) -> AsyncIterator[AsyncClient]:
    """
    Asynchronous test client wrapping the ASGI application.
    Enables HTTP requests directly to endpoints without starting a real port server.
    """
    # Create tables in the test database
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # Seed test database with synthetic cases
    async with TestSessionLocal() as session:
        repo = SQLiteFIRRepository(session)
        cases = generate_synthetic_dataset()
        for case in cases:
            await repo.store_raw_fir(case.model_dump())
        await session.commit()

    # Seed SIGNATURES_DB cache for tests to prevent 404 on patterns/similar case IDs
    from app.core.dependencies import SIGNATURES_DB
    from app.services.crime_signature.core import create_default_pipeline
    pipeline = create_default_pipeline()
    for case in cases:
        sig, _ = pipeline.execute(case)
        SIGNATURES_DB[case.case_master_id] = sig

    # Initialize the app with test settings injected
    app = create_app()

    # Override settings and db dependencies
    app.dependency_overrides[get_settings] = lambda: test_settings
    app.dependency_overrides[get_db] = override_get_db

    # Use HTTPX's ASGITransport to talk directly to the ASGI app
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        follow_redirects=True,
    ) as async_client:
        yield async_client
