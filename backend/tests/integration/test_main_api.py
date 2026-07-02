"""
CrimeLens AI — Application Entry Point Integration Tests

Verifies global app characteristics, routers configuration, CORS configurations,
and custom exception handlers integration on the FastAPI instance.
"""

from __future__ import annotations

from http import HTTPStatus

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.exceptions import NotFoundError
from app.main import create_app


@pytest.mark.asyncio
async def test_custom_exception_handler_mapping() -> None:
    """
    Verifies that CrimeLensException subclasses (e.g. NotFoundError) are
    caught by the custom app exception handler and formatted as JSON.
    """
    app = create_app()

    # Mount a dummy route that raises a custom NotFoundError exception
    @app.get("/trigger-not-found")
    async def trigger_not_found() -> None:
        raise NotFoundError("Resource mapping failed.")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/trigger-not-found")

        assert response.status_code == HTTPStatus.NOT_FOUND.value
        data = response.json()
        assert data["detail"] == "Resource mapping failed."
        assert data["type"] == "NotFoundError"


@pytest.mark.asyncio
async def test_unhandled_exception_handler_mapping() -> None:
    """
    Verifies that arbitrary unhandled python exceptions (e.g. ValueError)
    are caught by the general fallback exception handler and formatted as HTTP 500.
    """
    app = create_app()

    # Mount a dummy route that raises an unhandled standard exception
    @app.get("/trigger-value-error")
    async def trigger_value_error() -> None:
        raise ValueError("Critical python core runtime failure.")

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/trigger-value-error")

        assert response.status_code == HTTPStatus.INTERNAL_SERVER_ERROR.value
        data = response.json()
        assert "detail" in data
        assert "unexpected server error occurred" in data["detail"]
        assert data["type"] == "InternalServerError"
