"""
CrimeLens AI — Custom Exception Hierarchy

Defines the entire application error taxonomy as a class hierarchy.
Every exception maps directly to an HTTP status code and a user-safe
message, eliminating switch statements in exception handlers.

Design principle:
  - Raise domain-specific exceptions in services and repositories.
  - The global exception handler in main.py converts them to HTTP responses.
  - No FastAPI or HTTP concerns belong in the exception classes themselves.
  - Never expose internal error details (stack traces, SQL errors) to clients.

Usage:
    # In a service or repository:
    from app.core.exceptions import NotFoundError, ForbiddenError

    if case is None:
        raise NotFoundError(f"Case {case_id!r} does not exist.")

    if user.clearance < required_clearance:
        raise ForbiddenError("Insufficient clearance to access this case.")
"""

from __future__ import annotations

from http import HTTPStatus


class CrimeLensException(Exception):
    """
    Base class for all application-level exceptions.

    Every subclass defines:
      - status_code: The HTTP status code to return to the client.
      - default_message: A safe, user-facing message used when none is provided.

    The global exception handler in main.py catches CrimeLensException and
    its subclasses, serialising them into a consistent JSON error response:
        {"detail": "<message>", "type": "<ClassName>"}
    """

    status_code: int = HTTPStatus.INTERNAL_SERVER_ERROR.value
    default_message: str = "An unexpected error occurred. Please contact support."

    def __init__(self, message: str | None = None) -> None:
        self.message = message if message is not None else self.default_message
        super().__init__(self.message)

    def __repr__(self) -> str:
        return f"{type(self).__name__}(status_code={self.status_code}, message={self.message!r})"


# ── 4xx Client Errors ─────────────────────────────────────────────────────────


class BadRequestError(CrimeLensException):
    """
    HTTP 400 — The request is malformed or contains invalid parameters.
    Raised when input fails domain-level validation beyond Pydantic schema checks.
    """

    status_code = HTTPStatus.BAD_REQUEST.value
    default_message = "The request is invalid. Please check your input."


class UnauthorizedError(CrimeLensException):
    """
    HTTP 401 — No valid authentication credentials were provided.
    Raised when a JWT token is missing, expired, or has an invalid signature.
    """

    status_code = HTTPStatus.UNAUTHORIZED.value
    default_message = "Authentication is required. Please log in."


class ForbiddenError(CrimeLensException):
    """
    HTTP 403 — Valid credentials, but insufficient clearance.
    Raised when an officer attempts to access a resource above their clearance level
    (e.g. an Investigator trying to access Supervisor-only directives).
    """

    status_code = HTTPStatus.FORBIDDEN.value
    default_message = "You do not have sufficient clearance to access this resource."


class NotFoundError(CrimeLensException):
    """
    HTTP 404 — The requested resource does not exist.
    Raised by repositories when a lookup by ID returns no result.
    """

    status_code = HTTPStatus.NOT_FOUND.value
    default_message = "The requested resource was not found."


class ConflictError(CrimeLensException):
    """
    HTTP 409 — The operation conflicts with the current state.
    Raised when attempting to create a duplicate resource (e.g. duplicate FIR ID).
    """

    status_code = HTTPStatus.CONFLICT.value
    default_message = "A conflict occurred with the current resource state."


class UnprocessableEntityError(CrimeLensException):
    """
    HTTP 422 — The request is syntactically valid but semantically incorrect.
    Raised when domain business rules are violated (distinct from Pydantic validation).
    """

    status_code = HTTPStatus.UNPROCESSABLE_ENTITY.value
    default_message = "The request could not be processed due to business rule violations."


# ── 5xx Server Errors ─────────────────────────────────────────────────────────


class ServiceUnavailableError(CrimeLensException):
    """
    HTTP 503 — A required downstream service is unavailable.
    Raised when the ML engine, database, or external API cannot be reached.
    """

    status_code = HTTPStatus.SERVICE_UNAVAILABLE.value
    default_message = "A required service is temporarily unavailable. Please try again later."


class MLInferenceError(CrimeLensException):
    """
    HTTP 500 — An ML model inference operation failed.
    Raised by the ML infrastructure layer when FAISS, Sentence Transformers,
    or any PyTorch-based model encounters a runtime error.
    """

    status_code = HTTPStatus.INTERNAL_SERVER_ERROR.value
    default_message = "The analytical model encountered an error. Please try again."


class DataIntegrityError(CrimeLensException):
    """
    HTTP 500 — A data consistency violation was detected.
    Raised when the infrastructure layer detects corrupt or inconsistent state
    (e.g. an FIR referencing a non-existent case).
    """

    status_code = HTTPStatus.INTERNAL_SERVER_ERROR.value
    default_message = "A data integrity error was detected. Please contact support."


class AIProviderError(CrimeLensException):
    """
    HTTP 500 — An AI engine or LLM provider operation failed.
    Raised by the AI service layer when model generation or parsing fails.
    """

    status_code = HTTPStatus.INTERNAL_SERVER_ERROR.value
    default_message = "The AI service encountered an error. Please try again."
