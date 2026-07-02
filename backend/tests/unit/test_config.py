"""
CrimeLens AI — Settings Configuration Unit Tests

Verifies that the Settings model parses environment values correctly,
enforces Pydantic validations, and validates default values.
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_settings_defaults() -> None:
    """Verifies that default settings are correctly populated."""
    settings = Settings()
    assert settings.app_name == "CrimeLens AI"
    assert settings.environment == "development"
    assert settings.debug is False
    assert settings.api_v1_prefix == "/api/v1"
    assert settings.log_level == "INFO"
    assert settings.log_json is False
    assert settings.is_development is True
    assert settings.is_production is False
    assert settings.docs_enabled is True


def test_settings_overrides() -> None:
    """Verifies that constructor overrides take precedence over defaults."""
    settings = Settings(
        environment="production",
        jwt_secret_key="secure-production-ready-jwt-key-for-ksp-platform",
        debug=True,
        log_level="ERROR",
        log_json=True,
    )
    assert settings.environment == "production"
    assert settings.jwt_secret_key == "secure-production-ready-jwt-key-for-ksp-platform"
    assert settings.debug is True
    assert settings.log_level == "ERROR"
    assert settings.log_json is True
    assert settings.is_development is False
    assert settings.is_production is True
    assert settings.docs_enabled is False


def test_invalid_log_level() -> None:
    """Verifies that validation errors are raised for unsupported log levels."""
    with pytest.raises(ValidationError) as exc_info:
        Settings(log_level="INVALID_LEVEL")
    assert "log_level must be one of" in str(exc_info.value)


def test_production_jwt_secret_validation() -> None:
    """
    Verifies that the default insecure JWT secret key raises an error
    when the environment is set to production.
    """
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            environment="production",
            jwt_secret_key="INSECURE-DEV-SECRET-CHANGE-IN-PRODUCTION",
        )
    assert "jwt_secret_key must be changed from the default in production" in str(exc_info.value)

    # Valid secret in production should pass validation
    settings = Settings(
        environment="production",
        jwt_secret_key="super-secret-hex-secure-key-for-ksp-production",
    )
    assert settings.jwt_secret_key == "super-secret-hex-secure-key-for-ksp-production"
