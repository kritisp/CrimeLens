"""
CrimeLens AI — Health API Integration Tests

Verifies that the public liveness/readiness health-check endpoint responds
correctly under the FastAPI app instance, outputting valid schemas.
"""

from __future__ import annotations

from http import HTTPStatus

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check_endpoint(client: AsyncClient) -> None:
    """
    Sends a GET request to /api/v1/health and asserts the schema
    and validity of the returned properties.
    """
    response = await client.get("/api/v1/health")

    # Assert correct status code
    assert response.status_code == HTTPStatus.OK.value

    # Parse response content
    data = response.json()

    # Assert expected fields are present
    assert "status" in data
    assert "service" in data
    assert "version" in data
    assert "environment" in data
    assert "timestamp" in data

    # Verify structural values
    assert data["status"] == "healthy"
    assert data["service"] == "CrimeLens AI (Test Suite)"
    assert data["version"] == "1.0.0"
    assert data["environment"] == "development"
    assert data["timestamp"].endswith("Z") or "+00:00" in data["timestamp"]

