"""
CrimeLens AI — Pipeline Exceptions

Defines custom exception classes for pipeline coordination and execution errors.
"""

from __future__ import annotations

from app.core.exceptions import CrimeLensException


class PipelineError(CrimeLensException):
    """Base exception for all pipeline subsystem errors."""

    status_code = 500
    default_message = "Crime analysis pipeline encountered an error."


class ExecutionError(PipelineError):
    """Raised when pipeline execution stages fail."""

    status_code = 500
    default_message = "Crime analysis pipeline failed to execute."
