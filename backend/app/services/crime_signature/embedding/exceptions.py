"""
CrimeLens AI — Embedding Engine Exceptions

Defines subsystem exception classes mapping custom errors to HTTP status codes.
"""

from __future__ import annotations

from app.core.exceptions import CrimeLensException


class EmbeddingError(CrimeLensException):
    """Base exception for all errors inside the embedding framework."""

    status_code = 500
    default_message = "Embedding framework encountered an error."


class ModelNotFoundError(EmbeddingError):
    """Raised when the client requests a model profile that is not configured."""

    status_code = 404
    default_message = "Requested embedding model configuration not found."


class ModelLoadError(EmbeddingError):
    """Raised when an embedding provider fails to load its model weights."""

    status_code = 500
    default_message = "Failed to initialize target embedding model."
