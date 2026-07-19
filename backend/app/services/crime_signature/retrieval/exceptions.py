"""
CrimeLens AI — Vector Retrieval Subsystem Exceptions

Defines specific exception classes for indexing and searching errors.
"""

from __future__ import annotations

from app.core.exceptions import CrimeLensException


class RetrievalError(CrimeLensException):
    """Base exception for all retrieval subsystem errors."""

    status_code = 500
    default_message = "Vector retrieval engine encountered an error."


class IndexBuildError(RetrievalError):
    """Raised when index building or training loops fail."""

    status_code = 500
    default_message = "Failed to construct vector index."


class IndexLoadError(RetrievalError):
    """Raised when file deserialization or loading fails."""

    status_code = 500
    default_message = "Failed to deserialize index from target storage."
