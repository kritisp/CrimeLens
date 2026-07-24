"""
CrimeLens AI — Request Timing and ID Middleware

Implements HTTP middleware injecting unique X-Request-ID tracking tokens and
timing request execution process durations.
"""

from __future__ import annotations

import time
import uuid
from typing import Callable

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = structlog.get_logger("api_timing_middleware")


class TimingAndIDMiddleware(BaseHTTPMiddleware):
    """
    HTTP middleware validating and writing:
      - X-Request-ID: Unique execution tracking token
      - X-Process-Time: Processing latency in seconds
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)

        # Resolve Request ID tracking token
        req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = req_id

        # Attach request ID to logging context
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=req_id)

        start_time = time.perf_counter()
        
        logger.info(
            "request_received",
            method=request.method,
            path=request.url.path,
            client_host=request.client.host if request.client else None,
        )

        try:
            response: Response = await call_next(request)
        except Exception as exc:
            logger.exception(
                "request_failed",
                method=request.method,
                path=request.url.path,
                error=str(exc),
            )
            raise
        finally:
            process_time = time.perf_counter() - start_time
            logger.info(
                "request_complete",
                method=request.method,
                path=request.url.path,
                status_code=response.status_code if 'response' in locals() else 500,
                duration_sec=round(process_time, 4),
            )

        # Write response headers
        response.headers["X-Request-ID"] = req_id
        response.headers["X-Process-Time"] = f"{process_time:.4f}"
        
        return response
