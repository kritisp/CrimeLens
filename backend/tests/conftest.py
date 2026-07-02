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


@pytest.fixture(scope="session")
async def client(test_settings: Settings) -> AsyncIterator[AsyncClient]:
    """
    Asynchronous test client wrapping the ASGI application.
    Enables HTTP requests directly to endpoints without starting a real port server.

    Usage:
        async def test_health(client: AsyncClient):
            res = await client.get("/api/v1/health")
            assert res.status_code == 200
    """
    # Initialize the app with test settings injected
    app = create_app()

    # Override settings dependency
    app.dependency_overrides[get_settings] = lambda: test_settings

    # Use HTTPX's ASGITransport to talk directly to the ASGI app
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        follow_redirects=True,
    ) as async_client:
        yield async_client
