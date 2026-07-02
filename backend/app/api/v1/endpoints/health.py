"""
CrimeLens AI — Health Check Endpoint

Provides a liveness and readiness signal for:
  - Docker / Kubernetes health checks
  - Load balancer target health monitoring
  - Uptime monitoring services (Datadog, Prometheus, UptimeRobot)
  - CI/CD pipeline smoke tests after deployment

Endpoint: GET /api/v1/health
Auth required: No (deliberately public — must be reachable before login)
Response time: < 50ms (pure in-memory, no DB or ML calls)
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from fastapi import APIRouter, status
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.core.dependencies import SettingsDep
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


class ServiceStatus(str, Enum):
    """Enumerated health states for machine-readable status checks."""

    OPERATIONAL = "operational"
    DEGRADED = "degraded"
    DOWN = "down"


class HealthResponse(BaseModel):
    """
    Health check response payload.

    All fields are present in every response, making it safe for monitoring
    tools to parse without conditional field handling.
    """

    status: ServiceStatus = Field(
        description="Current operational status of the service.",
        examples=[ServiceStatus.OPERATIONAL],
    )
    service: str = Field(
        description="Human-readable service name.",
        examples=["CrimeLens AI"],
    )
    version: str = Field(
        description="Deployed application version (semantic versioning).",
        examples=["1.0.0"],
    )
    environment: str = Field(
        description="Deployment environment.",
        examples=["production"],
    )
    timestamp: datetime = Field(
        description="UTC timestamp of when this health response was generated.",
    )

    model_config = {"json_schema_extra": {
        "example": {
            "status": "operational",
            "service": "CrimeLens AI",
            "version": "1.0.0",
            "environment": "production",
            "timestamp": "2026-07-02T01:03:59+00:00",
        }
    }}


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Service Health Check",
    description=(
        "Returns the current operational status of the CrimeLens AI backend. "
        "No authentication required. Used by infrastructure health monitors, "
        "Docker health checks, and CI/CD smoke tests."
    ),
    tags=["System"],
    # Exclude from OpenAPI schema so it doesn't appear as a primary endpoint
    include_in_schema=True,
)
async def health_check(settings: SettingsDep) -> HealthResponse:
    """
    Liveness probe endpoint.

    Returns HTTP 200 when the service is running and accepting requests.
    A non-200 response indicates the service should be restarted.

    In later phases, this will be extended to a readiness probe that
    verifies database connectivity and ML model availability.
    """
    logger.debug(
        "health_check_called",
        version=settings.app_version,
        environment=settings.environment,
    )

    return HealthResponse(
        status=ServiceStatus.OPERATIONAL,
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
        timestamp=datetime.now(tz=timezone.utc),
    )
