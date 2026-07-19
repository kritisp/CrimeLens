"""
CrimeLens AI — Similarity Engine Exceptions

Defines custom exception classes for weighting or scoring calculation errors.
"""

from __future__ import annotations

from app.core.exceptions import CrimeLensException


class SimilarityError(CrimeLensException):
    """Base exception for all similarity engine errors."""

    status_code = 500
    default_message = "Similarity engine encountered an error."


class ConfigurationError(SimilarityError):
    """Raised when similarity weight configurations contain formatting or math errors."""

    status_code = 500
    default_message = "Failed to load similarity configurations parameters."
