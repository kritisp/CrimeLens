"""
CrimeLens AI — Structured Logging Configuration

Sets up structlog as the application-wide logging library.

Why structlog over stdlib logging?
  - Every log event is a Python dict, not a formatted string.
  - Key-value context is automatically included on every log line.
  - Outputs either human-readable console format (dev) or JSON lines (prod).
  - JSON output integrates directly with log aggregation stacks
    (Datadog, ELK, Google Cloud Logging, etc.) without custom parsers.

Usage pattern in any module:
    import structlog
    logger = structlog.get_logger(__name__)

    logger.info("case_created", case_id="FIR-1024", officer="KSP-4821")
    logger.warning("high_risk_alert", risk_score=88, confidence=0.94)
    logger.error("ml_inference_failed", model="faiss", exc_info=True)
"""

from __future__ import annotations

import logging
import sys
from typing import Any

import structlog


def safe_add_logger_name(logger: Any, method_name: str, event_dict: dict) -> dict:
    """Safely adds the logger name, fallback to root if not present."""
    try:
        return structlog.stdlib.add_logger_name(logger, method_name, event_dict)
    except AttributeError:
        event_dict["logger"] = getattr(logger, "__name__", "root")
        return event_dict


def safe_add_log_level(logger: Any, method_name: str, event_dict: dict) -> dict:
    """Safely adds the log level, fallback to method_name if not present."""
    try:
        return structlog.stdlib.add_log_level(logger, method_name, event_dict)
    except AttributeError:
        event_dict["level"] = method_name
        return event_dict


def configure_logging(log_level: str = "INFO", json_logs: bool = False) -> None:
    """
    Configure structlog processors for the entire application lifecycle.

    This function is called exactly once inside the FastAPI lifespan context
    manager (app/main.py). It must be called before any logger.get_logger()
    calls are made, which is guaranteed by the lifespan ordering.

    Args:
        log_level: Minimum log level string (e.g. "INFO", "DEBUG").
                   Comes from Settings.log_level.
        json_logs: When True, renders log events as compact JSON lines.
                   When False, renders pretty colored console output.
                   Comes from Settings.log_json.
    """
    numeric_level: int = getattr(logging, log_level.upper(), logging.INFO)

    # Processors that run on every log event regardless of output format.
    # Order matters — each processor receives and returns the event dict.
    shared_processors: list[Any] = [
        # Merge any context vars bound with structlog.contextvars.bind_contextvars()
        # Useful for binding request_id, user_id at the start of a request.
        structlog.contextvars.merge_contextvars,
        # Add the __name__ of the calling module as "logger" key.
        safe_add_logger_name,
        # Add the log level (info, warning, etc.) as "level" key.
        safe_add_log_level,
        # Allow positional arguments: logger.info("msg %s", value)
        structlog.stdlib.PositionalArgumentsFormatter(),
        # Add "timestamp" key in ISO 8601 format.
        structlog.processors.TimeStamper(fmt="iso"),
        # Render stack_info if passed.
        structlog.processors.StackInfoRenderer(),
        # Decode bytes to str before rendering.
        structlog.processors.UnicodeDecoder(),
    ]


    if json_logs:
        # ── Production / Staging ─────────────────────────────────────────────
        # Output: one compact JSON object per line.
        # Each field becomes a top-level JSON key for easy querying in Datadog
        # or Kibana. Example:
        # {"timestamp":"2026-07-02T01:03:59+05:30","level":"info",
        #  "logger":"app.services.case","event":"case_retrieved","case_id":"FIR-1024"}
        structlog.configure(
            processors=shared_processors
            + [
                structlog.processors.format_exc_info,
                structlog.processors.JSONRenderer(),
            ],
            wrapper_class=structlog.make_filtering_bound_logger(numeric_level),
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
            cache_logger_on_first_use=True,
        )
    else:
        # ── Development ──────────────────────────────────────────────────────
        # Output: colored, aligned, human-readable console output.
        # Example:
        # 2026-07-02T01:03:59 [info     ] case_retrieved  [app.services.case] case_id=FIR-1024
        structlog.configure(
            processors=shared_processors
            + [
                structlog.dev.ConsoleRenderer(colors=True),
            ],
            wrapper_class=structlog.make_filtering_bound_logger(numeric_level),
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
            cache_logger_on_first_use=True,
        )

    # ── Stdlib logging bridge ────────────────────────────────────────────────
    # Route Python stdlib logging (used by uvicorn, httpx, sqlalchemy, etc.)
    # through the same stdout handler so all logs appear in one stream.
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=numeric_level,
    )

    # Quieten overly verbose third-party loggers in development.
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("sentence_transformers").setLevel(logging.WARNING)


def get_logger(name: str) -> structlog.BoundLogger:
    """
    Convenience wrapper around structlog.get_logger().

    Preferred usage at module level:
        from app.core.logging import get_logger
        logger = get_logger(__name__)

    This is equivalent to structlog.get_logger(__name__) but provides
    a single import point that can be swapped out without touching
    every module if the logging library ever changes.
    """
    return structlog.get_logger(name)  # type: ignore[return-value]
