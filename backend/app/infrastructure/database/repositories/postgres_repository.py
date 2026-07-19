"""
CrimeLens AI — PostgreSQL / Catalyst Repository

Subclasses the core SQLAlchemy repository implementation for PostgreSQL and Zoho Catalyst.
"""

from __future__ import annotations

from app.infrastructure.database.repositories.sqlite_repository import SQLiteFIRRepository


class PostgresFIRRepository(SQLiteFIRRepository):
    """
    Decoupled SQLAlchemy-backed repository for PostgreSQL and Catalyst Data Store.
    Provides direct migration compatibility without changing any route level dependencies.
    """
    pass
