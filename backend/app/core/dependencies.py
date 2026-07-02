"""
CrimeLens AI — Dependency Injection Providers

This module defines all FastAPI Depends() providers used across the API layer.
It is the single place where application-wide dependencies are declared and
wired together.

Clean Architecture rule enforced here:
  - Route handlers declare what they need via type annotations.
  - This module provides the concrete implementations.
  - Swapping an implementation (e.g. real DB → mock) requires changing
    this file only — zero changes to routes or services.

Dependency Injection hierarchy:
  get_settings()         → Pure function, @lru_cache singleton
  get_case_repository()  → Depends(get_settings) [Phase 2: + Depends(get_db)]
  get_case_service()     → Depends(get_case_repository)
  get_current_user()     → Depends(oauth2_scheme) + JWT decode

Usage in a route:
    from app.core.dependencies import SettingsDep

    @router.get("/health")
    async def health(settings: SettingsDep) -> ...:
        return {"version": settings.app_version}
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings

# ── Annotated Type Aliases ────────────────────────────────────────────────────
# These aliases combine the Python type with the FastAPI Depends() declaration.
# Routes use these as type annotations, keeping signatures clean.
#
# Pattern:  XxxDep = Annotated[XxxType, Depends(get_xxx)]
#
# FastAPI reads the Annotated metadata at startup, builds a dependency graph,
# and injects resolved values into route handler arguments at request time.

SettingsDep = Annotated[Settings, Depends(get_settings)]
"""
Injects the application Settings singleton into a route.

Example:
    @router.get("/info")
    async def info(settings: SettingsDep) -> dict:
        return {"app": settings.app_name, "version": settings.app_version}
"""

# ── Phase 2 Placeholders ──────────────────────────────────────────────────────
# The following dependencies will be wired in subsequent tasks.
# They are documented here now so routes can reference them before
# the implementations exist, enabling parallel development.

# DatabaseSessionDep — async SQLAlchemy session per request
# Will be: Annotated[AsyncSession, Depends(get_db_session)]
#
# CurrentUserDep — authenticated officer extracted from JWT
# Will be: Annotated[UserClaims, Depends(get_current_user)]
#
# CaseServiceDep — injected business logic layer for case operations
# Will be: Annotated[CaseService, Depends(get_case_service)]
#
# MLEngineDep — injected FAISS + Sentence Transformers engine
# Will be: Annotated[SimilarityEngine, Depends(get_ml_engine)]
