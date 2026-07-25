"""
CrimeLens AI — SQLAlchemy FIR Repository (Backwards Compatibility Alias)

Aliases PostgresFIRRepository to maintain clean backward compatibility
with legacy imports while running all queries through SQLAlchemy AsyncSession.
"""

from __future__ import annotations

from app.infrastructure.database.repositories.postgres_repository import PostgresFIRRepository

# Backwards compatibility alias
SQLiteFIRRepository = PostgresFIRRepository
