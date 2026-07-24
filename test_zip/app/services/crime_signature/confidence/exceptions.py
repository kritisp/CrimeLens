"""
CrimeLens AI — Confidence Engine Exceptions

Defines custom exception classes for confidence calculation errors.
"""

from __future__ import annotations

from app.core.exceptions import CrimeLensException


class ConfidenceError(CrimeLensException):
    """Base exception for confidence engine errors."""

    status_code = 500
    default_message = "Confidence estimation engine encountered an error."


class ConfidenceConfigurationError(ConfidenceError):
    """Raised when weight configurations for confidence contain errors."""

    status_code = 500
    default_message = "Failed to load confidence weight configurations."
