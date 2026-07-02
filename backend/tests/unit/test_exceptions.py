"""
CrimeLens AI — Custom Exceptions Unit Tests

Verifies that custom application exceptions map to correct HTTP status codes,
have correct default messages, and can be initialized with custom messages.
"""

from __future__ import annotations

from http import HTTPStatus

from app.core.exceptions import (
    BadRequestError,
    ConflictError,
    CrimeLensException,
    DataIntegrityError,
    ForbiddenError,
    MLInferenceError,
    NotFoundError,
    ServiceUnavailableError,
    UnauthorizedError,
    UnprocessableEntityError,
)


def test_base_exception_defaults() -> None:
    """Verifies default properties of the base exception class."""
    exc = CrimeLensException()
    assert exc.status_code == HTTPStatus.INTERNAL_SERVER_ERROR.value
    assert exc.message == "An unexpected error occurred. Please contact support."
    assert repr(exc) == "CrimeLensException(status_code=500, message='An unexpected error occurred. Please contact support.')"


def test_custom_exception_properties() -> None:
    """Verifies properties of specific HTTP client-side and server-side exceptions."""
    # NotFoundError
    not_found = NotFoundError("Case FIR-999 not found")
    assert not_found.status_code == HTTPStatus.NOT_FOUND.value
    assert not_found.message == "Case FIR-999 not found"

    # BadRequestError
    bad_req = BadRequestError()
    assert bad_req.status_code == HTTPStatus.BAD_REQUEST.value
    assert bad_req.message == "The request is invalid. Please check your input."

    # UnauthorizedError
    unauth = UnauthorizedError()
    assert unauth.status_code == HTTPStatus.UNAUTHORIZED.value
    assert unauth.message == "Authentication is required. Please log in."

    # ForbiddenError
    forbidden = ForbiddenError()
    assert forbidden.status_code == HTTPStatus.FORBIDDEN.value
    assert forbidden.message == "You do not have sufficient clearance to access this resource."

    # ConflictError
    conflict = ConflictError()
    assert conflict.status_code == HTTPStatus.CONFLICT.value
    assert conflict.message == "A conflict occurred with the current resource state."

    # UnprocessableEntityError
    unprocessable = UnprocessableEntityError()
    assert unprocessable.status_code == HTTPStatus.UNPROCESSABLE_ENTITY.value
    assert unprocessable.message == "The request could not be processed due to business rule violations."

    # ServiceUnavailableError
    unavailable = ServiceUnavailableError()
    assert unavailable.status_code == HTTPStatus.SERVICE_UNAVAILABLE.value
    assert unavailable.message == "A required service is temporarily unavailable. Please try again later."

    # MLInferenceError
    ml_err = MLInferenceError()
    assert ml_err.status_code == HTTPStatus.INTERNAL_SERVER_ERROR.value
    assert ml_err.message == "The analytical model encountered an error. Please try again."

    # DataIntegrityError
    integrity = DataIntegrityError()
    assert integrity.status_code == HTTPStatus.INTERNAL_SERVER_ERROR.value
    assert integrity.message == "A data integrity error was detected. Please contact support."
